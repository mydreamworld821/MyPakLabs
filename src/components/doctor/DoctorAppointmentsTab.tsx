import { useState, useEffect } from "react";
import { format, parseISO, isToday, isFuture, isPast } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Loader2,
  Calendar,
  Clock,
  User,
  Phone,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Video,
  MapPin,
} from "lucide-react";

interface Appointment {
  id: string;
  appointment_date: string;
  appointment_time: string;
  consultation_type: "physical" | "online";
  status: "pending" | "confirmed" | "cancelled" | "completed" | "no_show";
  fee: number;
  notes: string | null;
  patient_id: string;
  created_at: string;
  patient?: {
    full_name: string | null;
    phone: string | null;
  };
}

interface DoctorAppointmentsTabProps {
  doctorId: string;
  isApproved: boolean;
}

const statusConfig = {
  pending: { label: "Pending", className: "bg-yellow-100 text-yellow-700" },
  confirmed: { label: "Confirmed", className: "bg-blue-100 text-blue-700" },
  completed: { label: "Completed", className: "bg-green-100 text-green-700" },
  cancelled: { label: "Cancelled", className: "bg-red-100 text-red-700" },
  no_show: { label: "No Show", className: "bg-gray-100 text-gray-700" },
};

const DoctorAppointmentsTab = ({ doctorId, isApproved }: DoctorAppointmentsTabProps) => {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean;
    appointmentId: string;
    action: "confirm" | "complete" | "no_show" | "cancel";
  } | null>(null);

  useEffect(() => {
    if (doctorId) {
      fetchAppointments();
      
      // Set up real-time subscription
      const channel = supabase
        .channel('doctor-appointments')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'appointments',
            filter: `doctor_id=eq.${doctorId}`,
          },
          () => {
            fetchAppointments();
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [doctorId]);

  const fetchAppointments = async () => {
    try {
      const { data, error } = await supabase
        .from("appointments")
        .select(`
          *,
          patient:profiles!appointments_patient_id_fkey(full_name, phone)
        `)
        .eq("doctor_id", doctorId)
        .order("appointment_date", { ascending: true })
        .order("appointment_time", { ascending: true });

      if (error) throw error;

      // Handle case where join might fail - fetch profile separately
      const appointmentsData = data || [];
      
      // If patient data is null, try to fetch from profiles table
      const appointmentsWithPatients = await Promise.all(
        appointmentsData.map(async (apt) => {
          if (!apt.patient) {
            const { data: profileData } = await supabase
              .from("profiles")
              .select("full_name, phone")
              .eq("user_id", apt.patient_id)
              .maybeSingle();
            return { ...apt, patient: profileData };
          }
          return apt;
        })
      );

      setAppointments(appointmentsWithPatients as Appointment[]);
    } catch (error) {
      console.error("Error fetching appointments:", error);
      toast.error("Failed to load appointments");
    } finally {
      setIsLoading(false);
    }
  };

  const handleAction = async (appointmentId: string, action: "confirm" | "complete" | "no_show" | "cancel") => {
    setActionLoading(appointmentId);
    
    try {
      const updateData: Record<string, any> = {};
      
      switch (action) {
        case "confirm":
          updateData.status = "confirmed";
          updateData.confirmed_at = new Date().toISOString();
          break;
        case "complete":
          updateData.status = "completed";
          updateData.completed_at = new Date().toISOString();
          break;
        case "no_show":
          updateData.status = "no_show";
          break;
        case "cancel":
          updateData.status = "cancelled";
          updateData.cancelled_at = new Date().toISOString();
          updateData.cancellation_reason = "Cancelled by doctor";
          break;
      }

      const { error } = await supabase
        .from("appointments")
        .update(updateData)
        .eq("id", appointmentId);

      if (error) throw error;

      toast.success(`Appointment ${action === "no_show" ? "marked as no-show" : action + "ed"} successfully`);
      fetchAppointments();
    } catch (error: any) {
      toast.error(error.message || `Failed to ${action} appointment`);
    } finally {
      setActionLoading(null);
      setConfirmDialog(null);
    }
  };

  const openConfirmDialog = (appointmentId: string, action: "confirm" | "complete" | "no_show" | "cancel") => {
    setConfirmDialog({ open: true, appointmentId, action });
  };

  const getActionDialogContent = () => {
    if (!confirmDialog) return { title: "", description: "" };
    
    switch (confirmDialog.action) {
      case "confirm":
        return {
          title: "Confirm Appointment",
          description: "Are you sure you want to confirm this appointment? The patient will be notified.",
        };
      case "complete":
        return {
          title: "Complete Appointment",
          description: "Mark this appointment as completed? This action cannot be undone.",
        };
      case "no_show":
        return {
          title: "Mark as No-Show",
          description: "Mark this patient as a no-show? This will be recorded in their history.",
        };
      case "cancel":
        return {
          title: "Cancel Appointment",
          description: "Are you sure you want to cancel this appointment? The patient will be notified.",
        };
      default:
        return { title: "", description: "" };
    }
  };

  // Filter appointments
  const today = new Date();
  const upcomingAppointments = appointments.filter(
    (apt) => 
      (isFuture(parseISO(apt.appointment_date)) || isToday(parseISO(apt.appointment_date))) &&
      ["pending", "confirmed"].includes(apt.status)
  );
  const pastAppointments = appointments.filter(
    (apt) => 
      isPast(parseISO(apt.appointment_date)) && !isToday(parseISO(apt.appointment_date)) ||
      ["completed", "cancelled", "no_show"].includes(apt.status)
  );

  const renderAppointmentCard = (appointment: Appointment, showActions: boolean = true) => {
    const isActionable = showActions && ["pending", "confirmed"].includes(appointment.status);
    const appointmentDate = parseISO(appointment.appointment_date);
    const isAppointmentToday = isToday(appointmentDate);

    return (
      <Card key={appointment.id} className="mb-3">
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <User className="w-4 h-4 text-muted-foreground" />
                <span className="font-medium text-sm">
                  {appointment.patient?.full_name || "Unknown Patient"}
                </span>
                <Badge className={`text-xs ${statusConfig[appointment.status].className}`}>
                  {statusConfig[appointment.status].label}
                </Badge>
              </div>
              
              <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
                <div className="flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  <span>
                    {isAppointmentToday ? "Today" : format(appointmentDate, "MMM d, yyyy")}
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  <span>{appointment.appointment_time}</span>
                </div>
                <div className="flex items-center gap-1">
                  {appointment.consultation_type === "online" ? (
                    <Video className="w-3 h-3" />
                  ) : (
                    <MapPin className="w-3 h-3" />
                  )}
                  <span className="capitalize">{appointment.consultation_type}</span>
                </div>
                {appointment.patient?.phone && (
                  <div className="flex items-center gap-1">
                    <Phone className="w-3 h-3" />
                    <span>{appointment.patient.phone}</span>
                  </div>
                )}
              </div>
              
              {appointment.notes && (
                <p className="text-xs text-muted-foreground mt-2 italic">
                  "{appointment.notes}"
                </p>
              )}
              
              <div className="mt-2 text-xs font-medium text-primary">
                Fee: Rs. {appointment.fee.toLocaleString()}
              </div>
            </div>
            
            {isActionable && isApproved && (
              <div className="flex flex-wrap gap-2">
                {appointment.status === "pending" && (
                  <Button
                    size="sm"
                    variant="outline"
                    className="text-xs h-8 text-green-600 border-green-200 hover:bg-green-50"
                    onClick={() => openConfirmDialog(appointment.id, "confirm")}
                    disabled={actionLoading === appointment.id}
                  >
                    {actionLoading === appointment.id ? (
                      <Loader2 className="w-3 h-3 animate-spin" />
                    ) : (
                      <>
                        <CheckCircle className="w-3 h-3 mr-1" /> Confirm
                      </>
                    )}
                  </Button>
                )}
                
                {appointment.status === "confirmed" && (
                  <>
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-xs h-8 text-green-600 border-green-200 hover:bg-green-50"
                      onClick={() => openConfirmDialog(appointment.id, "complete")}
                      disabled={actionLoading === appointment.id}
                    >
                      <CheckCircle className="w-3 h-3 mr-1" /> Complete
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-xs h-8 text-orange-600 border-orange-200 hover:bg-orange-50"
                      onClick={() => openConfirmDialog(appointment.id, "no_show")}
                      disabled={actionLoading === appointment.id}
                    >
                      <AlertTriangle className="w-3 h-3 mr-1" /> No-Show
                    </Button>
                  </>
                )}
                
                {["pending", "confirmed"].includes(appointment.status) && (
                  <Button
                    size="sm"
                    variant="outline"
                    className="text-xs h-8 text-red-600 border-red-200 hover:bg-red-50"
                    onClick={() => openConfirmDialog(appointment.id, "cancel")}
                    disabled={actionLoading === appointment.id}
                  >
                    <XCircle className="w-3 h-3 mr-1" /> Cancel
                  </Button>
                )}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    );
  };

  if (!isApproved) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <AlertTriangle className="w-12 h-12 mx-auto text-yellow-500 mb-3" />
          <h3 className="text-sm font-semibold mb-1">Profile Not Approved</h3>
          <p className="text-xs text-muted-foreground">
            You can manage appointments once your profile is approved by our team.
          </p>
        </CardContent>
      </Card>
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <Tabs defaultValue="upcoming" className="w-full">
        <TabsList className="grid grid-cols-2 h-9">
          <TabsTrigger value="upcoming" className="text-xs">
            Upcoming ({upcomingAppointments.length})
          </TabsTrigger>
          <TabsTrigger value="past" className="text-xs">
            Past ({pastAppointments.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="upcoming" className="mt-4">
          {upcomingAppointments.length === 0 ? (
            <Card>
              <CardContent className="p-6 text-center">
                <Calendar className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
                <h3 className="text-sm font-semibold mb-1">No Upcoming Appointments</h3>
                <p className="text-xs text-muted-foreground">
                  You don't have any upcoming appointments yet.
                </p>
              </CardContent>
            </Card>
          ) : (
            upcomingAppointments.map((apt) => renderAppointmentCard(apt, true))
          )}
        </TabsContent>

        <TabsContent value="past" className="mt-4">
          {pastAppointments.length === 0 ? (
            <Card>
              <CardContent className="p-6 text-center">
                <Clock className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
                <h3 className="text-sm font-semibold mb-1">No Past Appointments</h3>
                <p className="text-xs text-muted-foreground">
                  Your appointment history will appear here.
                </p>
              </CardContent>
            </Card>
          ) : (
            pastAppointments.map((apt) => renderAppointmentCard(apt, false))
          )}
        </TabsContent>
      </Tabs>

      {/* Confirmation Dialog */}
      <AlertDialog
        open={confirmDialog?.open}
        onOpenChange={(open) => !open && setConfirmDialog(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="text-base">
              {getActionDialogContent().title}
            </AlertDialogTitle>
            <AlertDialogDescription className="text-sm">
              {getActionDialogContent().description}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="text-xs">Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="text-xs"
              onClick={() =>
                confirmDialog && handleAction(confirmDialog.appointmentId, confirmDialog.action)
              }
            >
              {actionLoading ? (
                <Loader2 className="w-3 h-3 animate-spin" />
              ) : (
                "Confirm"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default DoctorAppointmentsTab;
