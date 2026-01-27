import { useState, useEffect, useRef } from "react";
import { format, parseISO, isToday, isFuture, isPast } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { sendAdminEmailNotification } from "@/utils/adminNotifications";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
  Upload,
  FileText,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { ChatButton } from "@/components/chat/ChatButton";

interface Appointment {
  id: string;
  appointment_date: string;
  appointment_time: string;
  consultation_type: "physical" | "online";
  status: "pending" | "confirmed" | "cancelled" | "completed" | "no_show";
  fee: number;
  notes: string | null;
  consultation_notes: string | null;
  prescription_url: string | null;
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
  const navigate = useNavigate();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean;
    appointmentId: string;
    action: "confirm" | "no_show" | "cancel";
  } | null>(null);

  const [doctorProfile, setDoctorProfile] = useState<{
    full_name: string;
    qualification: string | null;
    phone: string | null;
    clinic_name: string | null;
    clinic_address: string | null;
  } | null>(null);
  
  // Complete appointment dialog state
  const [completeDialog, setCompleteDialog] = useState<{
    open: boolean;
    appointmentId: string;
  } | null>(null);
  const [consultationNotes, setConsultationNotes] = useState("");
  const [prescriptionFile, setPrescriptionFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchDoctorProfile = async () => {
    try {
      const { data, error } = await supabase
        .from("doctors")
        .select("full_name, qualification, phone, clinic_name, clinic_address")
        .eq("id", doctorId)
        .maybeSingle();

      if (error) throw error;
      if (data) setDoctorProfile(data);
    } catch (err) {
      console.warn("Could not load doctor profile for notifications", err);
    }
  };

  useEffect(() => {
    if (doctorId) {
      fetchDoctorProfile();
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
        // NOTE: appointments table doesn't have an explicit FK to profiles in our schema,
        // so we fetch appointments first then resolve patient info separately.
        .select("*")
        .eq("doctor_id", doctorId)
        .order("appointment_date", { ascending: true })
        .order("appointment_time", { ascending: true });

      if (error) throw error;

      const appointmentsData = (data || []) as Appointment[];
      const patientIds = Array.from(
        new Set(appointmentsData.map((a) => a.patient_id).filter(Boolean))
      );

      let patientMap = new Map<string, { full_name: string | null; phone: string | null }>();

      if (patientIds.length > 0) {
        const { data: profilesData, error: profilesError } = await supabase
          .from("profiles")
          .select("user_id, full_name, phone")
          .in("user_id", patientIds);

        if (profilesError) throw profilesError;

        (profilesData || []).forEach((p) => {
          patientMap.set(p.user_id, { full_name: p.full_name, phone: p.phone });
        });
      }

      const withPatients = appointmentsData.map((apt) => ({
        ...apt,
        patient: patientMap.get(apt.patient_id) ?? null,
      }));

      setAppointments(withPatients);
    } catch (error: any) {
      console.error("Error fetching appointments:", error);
      toast.error(error?.message || "Failed to load appointments");
    } finally {
      setIsLoading(false);
    }
  };

  const handleAction = async (appointmentId: string, action: "confirm" | "no_show" | "cancel") => {
    setActionLoading(appointmentId);

    try {
      const updateData: Record<string, any> = {};

      switch (action) {
        case "confirm":
          updateData.status = "confirmed";
          updateData.confirmed_at = new Date().toISOString();
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

      // Send confirmation emails (doctor-confirm flow)
      if (action === "confirm") {
        const apt = appointments.find((a) => a.id === appointmentId);
        if (apt) {
          try {
            const { data: emailData, error: emailErr } = await supabase.functions.invoke(
              "send-admin-notification",
              {
                body: { action: "get_user_email", userId: apt.patient_id },
              }
            );
            if (emailErr) throw emailErr;

            await sendAdminEmailNotification({
              type: "doctor_appointment",
              status: "confirmed",
              bookingId: apt.id.slice(0, 8).toUpperCase(),
              patientName: apt.patient?.full_name || "Patient",
              patientPhone: apt.patient?.phone || undefined,
              patientEmail: emailData?.email || undefined,
              doctorName: doctorProfile?.full_name || "Doctor",
              doctorQualification: doctorProfile?.qualification || undefined,
              doctorPhone: doctorProfile?.phone || undefined,
              clinicName: doctorProfile?.clinic_name || undefined,
              clinicAddress: doctorProfile?.clinic_address || undefined,
              appointmentDate: format(parseISO(apt.appointment_date), "d MMM yyyy"),
              appointmentTime: apt.appointment_time,
              consultationType: apt.consultation_type,
              appointmentFee: apt.fee,
            });
          } catch (notifyErr: any) {
            console.error("Doctor confirmation email failed:", notifyErr);
            toast.error("Appointment confirmed, but email could not be sent.");
          }
        }
      }

      toast.success(
        `Appointment ${action === "no_show" ? "marked as no-show" : action + "ed"} successfully`
      );
      fetchAppointments();
    } catch (error: any) {
      toast.error(error.message || `Failed to ${action} appointment`);
    } finally {
      setActionLoading(null);
      setConfirmDialog(null);
    }
  };

  const handleCompleteAppointment = async () => {
    if (!completeDialog) return;
    
    setIsUploading(true);
    
    try {
      let prescriptionUrl: string | null = null;
      
      // Upload prescription if provided
      if (prescriptionFile) {
        const fileExt = prescriptionFile.name.split(".").pop();
        const fileName = `${completeDialog.appointmentId}/${Date.now()}.${fileExt}`;
        
        const { error: uploadError } = await supabase.storage
          .from("prescriptions")
          .upload(fileName, prescriptionFile);
        
        if (uploadError) throw uploadError;
        
        // Get the file path (not public URL since it's private bucket)
        prescriptionUrl = fileName;
      }
      
      // Update appointment with completion data
      const updateData: Record<string, any> = {
        status: "completed",
        completed_at: new Date().toISOString(),
        consultation_notes: consultationNotes || null,
      };
      
      if (prescriptionUrl) {
        updateData.prescription_url = prescriptionUrl;
        updateData.prescription_uploaded_at = new Date().toISOString();
      }
      
      const { error } = await supabase
        .from("appointments")
        .update(updateData)
        .eq("id", completeDialog.appointmentId);
      
      if (error) throw error;
      
      toast.success("Appointment completed successfully! Prescription sent to patient.");
      fetchAppointments();
      
      // Reset dialog state
      setCompleteDialog(null);
      setConsultationNotes("");
      setPrescriptionFile(null);
    } catch (error: any) {
      toast.error(error.message || "Failed to complete appointment");
    } finally {
      setIsUploading(false);
    }
  };

  const openConfirmDialog = (appointmentId: string, action: "confirm" | "no_show" | "cancel") => {
    setConfirmDialog({ open: true, appointmentId, action });
  };

  const openCompleteDialog = (appointmentId: string) => {
    setCompleteDialog({ open: true, appointmentId });
    setConsultationNotes("");
    setPrescriptionFile(null);
  };

  const getActionDialogContent = () => {
    if (!confirmDialog) return { title: "", description: "" };
    
    switch (confirmDialog.action) {
      case "confirm":
        return {
          title: "Confirm Appointment",
          description: "Are you sure you want to confirm this appointment? The patient will be notified.",
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
                  {/* Chat button for online consultations */}
                  {appointment.consultation_type === "online" && (
                    <ChatButton
                      appointmentId={appointment.id}
                      appointmentDate={appointment.appointment_date}
                      appointmentTime={appointment.appointment_time}
                      consultationType={appointment.consultation_type}
                      appointmentStatus={appointment.status}
                      variant="badge"
                      className="ml-2"
                    />
                  )}
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
              
              {appointment.consultation_notes && (
                <div className="mt-2 p-2 bg-muted/50 rounded text-xs">
                  <span className="font-medium">Consultation Notes: </span>
                  {appointment.consultation_notes}
                </div>
              )}
              
              {appointment.prescription_url && (
                <div className="mt-2 flex items-center gap-1 text-xs text-green-600">
                  <FileText className="w-3 h-3" />
                  <span>Prescription uploaded</span>
                </div>
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
                      onClick={() => openCompleteDialog(appointment.id)}
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

      {/* Simple Confirmation Dialog */}
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

      {/* Complete Appointment Dialog with Notes & Prescription */}
      <Dialog
        open={completeDialog?.open}
        onOpenChange={(open) => {
          if (!open) {
            setCompleteDialog(null);
            setConsultationNotes("");
            setPrescriptionFile(null);
          }
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Complete Appointment</DialogTitle>
            <DialogDescription>
              Add consultation notes and upload prescription for the patient.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="consultation-notes" className="text-sm">
                Consultation Notes (Optional)
              </Label>
              <Textarea
                id="consultation-notes"
                placeholder="Enter consultation notes, diagnosis, recommendations..."
                value={consultationNotes}
                onChange={(e) => setConsultationNotes(e.target.value)}
                className="min-h-[100px] text-sm"
              />
            </div>
            
            <div className="space-y-2">
              <Label className="text-sm">Upload Prescription (Optional)</Label>
              <div 
                className="border-2 border-dashed rounded-lg p-4 text-center cursor-pointer hover:border-primary/50 transition-colors"
                onClick={() => fileInputRef.current?.click()}
              >
                {prescriptionFile ? (
                  <div className="flex items-center justify-center gap-2">
                    <FileText className="w-5 h-5 text-green-600" />
                    <span className="text-sm font-medium">{prescriptionFile.name}</span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-6 text-xs text-red-500"
                      onClick={(e) => {
                        e.stopPropagation();
                        setPrescriptionFile(null);
                      }}
                    >
                      Remove
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <Upload className="w-8 h-8 mx-auto text-muted-foreground" />
                    <p className="text-sm text-muted-foreground">
                      Click to upload prescription
                    </p>
                    <p className="text-xs text-muted-foreground">
                      PDF, JPG, PNG (max 5MB)
                    </p>
                  </div>
                )}
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.jpg,.jpeg,.png"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    if (file.size > 5 * 1024 * 1024) {
                      toast.error("File size must be less than 5MB");
                      return;
                    }
                    setPrescriptionFile(file);
                  }
                }}
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setCompleteDialog(null)}
              disabled={isUploading}
            >
              Cancel
            </Button>
            <Button
              onClick={handleCompleteAppointment}
              disabled={isUploading}
            >
              {isUploading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Completing...
                </>
              ) : (
                <>
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Complete Appointment
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default DoctorAppointmentsTab;
