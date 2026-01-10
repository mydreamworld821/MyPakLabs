import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import AdminLayout from "@/components/admin/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { format } from "date-fns";
import {
  Search,
  Loader2,
  Eye,
  Calendar,
  Clock,
  Stethoscope,
  User,
  Phone,
  MapPin,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Filter,
} from "lucide-react";

interface Appointment {
  id: string;
  appointment_date: string;
  appointment_time: string;
  consultation_type: string;
  status: string;
  fee: number;
  notes: string | null;
  cancellation_reason: string | null;
  created_at: string;
  confirmed_at: string | null;
  completed_at: string | null;
  cancelled_at: string | null;
  patient_id: string;
  doctors: {
    id: string;
    full_name: string;
    photo_url: string | null;
    qualification: string | null;
    phone: string | null;
    clinic_name: string | null;
    doctor_specializations?: {
      name: string;
    } | null;
  };
  profiles?: {
    full_name: string | null;
    phone: string | null;
  } | null;
}

const statusConfig: Record<string, { color: string; label: string }> = {
  pending: { color: "bg-yellow-500/10 text-yellow-600 border-yellow-500/20", label: "Pending" },
  confirmed: { color: "bg-blue-500/10 text-blue-600 border-blue-500/20", label: "Confirmed" },
  completed: { color: "bg-green-500/10 text-green-600 border-green-500/20", label: "Completed" },
  cancelled: { color: "bg-red-500/10 text-red-600 border-red-500/20", label: "Cancelled" },
  no_show: { color: "bg-orange-500/10 text-orange-600 border-orange-500/20", label: "No Show" },
};

const AdminDoctorAppointments = () => {
  const navigate = useNavigate();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [filteredAppointments, setFilteredAppointments] = useState<Appointment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    fetchAppointments();
  }, []);

  useEffect(() => {
    filterAppointments();
  }, [appointments, searchQuery, statusFilter]);

  const fetchAppointments = async () => {
    try {
      const { data, error } = await supabase
        .from("appointments")
        .select(`
          *,
          doctors:doctor_id (
            id,
            full_name,
            photo_url,
            qualification,
            phone,
            clinic_name,
            doctor_specializations:specialization_id (
              name
            )
          )
        `)
        .order("created_at", { ascending: false });

      if (error) throw error;
      
      // Fetch patient profiles
      const appointmentsWithProfiles = await Promise.all(
        (data || []).map(async (apt) => {
          const { data: profile } = await supabase
            .from("profiles")
            .select("full_name, phone")
            .eq("user_id", apt.patient_id)
            .maybeSingle();
          return { ...apt, profiles: profile };
        })
      );
      
      setAppointments(appointmentsWithProfiles);
    } catch (error) {
      console.error("Error fetching appointments:", error);
      toast.error("Failed to fetch appointments");
    } finally {
      setIsLoading(false);
    }
  };

  const filterAppointments = () => {
    let filtered = [...appointments];

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (apt) =>
          apt.doctors?.full_name?.toLowerCase().includes(query) ||
          apt.profiles?.full_name?.toLowerCase().includes(query) ||
          apt.profiles?.phone?.includes(query)
      );
    }

    if (statusFilter !== "all") {
      filtered = filtered.filter((apt) => apt.status === statusFilter);
    }

    setFilteredAppointments(filtered);
  };

  const handleUpdateStatus = async (id: string, newStatus: string) => {
    setIsUpdating(true);
    try {
      const updateData: any = { status: newStatus };
      
      if (newStatus === 'confirmed') {
        updateData.confirmed_at = new Date().toISOString();
      } else if (newStatus === 'completed') {
        updateData.completed_at = new Date().toISOString();
      } else if (newStatus === 'cancelled') {
        updateData.cancelled_at = new Date().toISOString();
      }

      const { error } = await supabase
        .from("appointments")
        .update(updateData)
        .eq("id", id);

      if (error) throw error;

      toast.success(`Appointment ${newStatus}`);
      fetchAppointments();
      setIsDialogOpen(false);
    } catch (error) {
      console.error("Error updating appointment:", error);
      toast.error("Failed to update appointment");
    } finally {
      setIsUpdating(false);
    }
  };

  const stats = {
    total: appointments.length,
    pending: appointments.filter((a) => a.status === "pending").length,
    confirmed: appointments.filter((a) => a.status === "confirmed").length,
    completed: appointments.filter((a) => a.status === "completed").length,
    cancelled: appointments.filter((a) => a.status === "cancelled").length,
  };

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-[60vh]">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="p-4 lg:p-6 space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold">Doctor Appointments</h1>
          <p className="text-muted-foreground">Manage all doctor appointment bookings</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <Calendar className="w-8 h-8 text-primary" />
                <div>
                  <p className="text-2xl font-bold">{stats.total}</p>
                  <p className="text-xs text-muted-foreground">Total</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <Clock className="w-8 h-8 text-yellow-500" />
                <div>
                  <p className="text-2xl font-bold">{stats.pending}</p>
                  <p className="text-xs text-muted-foreground">Pending</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <CheckCircle className="w-8 h-8 text-blue-500" />
                <div>
                  <p className="text-2xl font-bold">{stats.confirmed}</p>
                  <p className="text-xs text-muted-foreground">Confirmed</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <CheckCircle className="w-8 h-8 text-green-500" />
                <div>
                  <p className="text-2xl font-bold">{stats.completed}</p>
                  <p className="text-xs text-muted-foreground">Completed</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <XCircle className="w-8 h-8 text-red-500" />
                <div>
                  <p className="text-2xl font-bold">{stats.cancelled}</p>
                  <p className="text-xs text-muted-foreground">Cancelled</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="p-4">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search by doctor or patient name..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full sm:w-[180px]">
                  <Filter className="w-4 h-4 mr-2" />
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="confirmed">Confirmed</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                  <SelectItem value="no_show">No Show</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Appointments Table */}
        <Card>
          <CardHeader>
            <CardTitle>Appointments ({filteredAppointments.length})</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Patient</TableHead>
                    <TableHead>Doctor</TableHead>
                    <TableHead>Date & Time</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Fee</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredAppointments.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                        No appointments found
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredAppointments.map((apt) => (
                      <TableRow key={apt.id}>
                        <TableCell>
                          <div>
                            <p className="font-medium">{apt.profiles?.full_name || "Unknown"}</p>
                            <p className="text-xs text-muted-foreground">{apt.profiles?.phone || "-"}</p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {apt.doctors?.photo_url ? (
                              <img src={apt.doctors.photo_url} alt="" className="w-8 h-8 rounded-full object-cover" />
                            ) : (
                              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                                <Stethoscope className="w-4 h-4 text-primary" />
                              </div>
                            )}
                            <div>
                              <p className="font-medium">{apt.doctors?.full_name}</p>
                              <p className="text-xs text-muted-foreground">{apt.doctors?.doctor_specializations?.name}</p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div>
                            <p className="font-medium">{format(new Date(apt.appointment_date), "dd MMM yyyy")}</p>
                            <p className="text-xs text-muted-foreground">{apt.appointment_time}</p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="capitalize">{apt.consultation_type}</Badge>
                        </TableCell>
                        <TableCell>
                          <span className="font-medium">Rs. {apt.fee.toLocaleString()}</span>
                        </TableCell>
                        <TableCell>
                          <Badge className={statusConfig[apt.status]?.color || ""}>
                            {statusConfig[apt.status]?.label || apt.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                              setSelectedAppointment(apt);
                              setIsDialogOpen(true);
                            }}
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Appointment Detail Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Appointment Details</DialogTitle>
          </DialogHeader>

          {selectedAppointment && (
            <div className="space-y-6 mt-4">
              {/* Status Badge */}
              <div className="flex items-center justify-between">
                <Badge className={statusConfig[selectedAppointment.status]?.color || ""} >
                  {statusConfig[selectedAppointment.status]?.label}
                </Badge>
                <Badge variant="outline" className="capitalize">
                  {selectedAppointment.consultation_type} Consultation
                </Badge>
              </div>

              {/* Patient Info */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base flex items-center gap-2">
                    <User className="w-4 h-4" />
                    Patient Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Name</span>
                    <span className="font-medium">{selectedAppointment.profiles?.full_name || "Unknown"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Phone</span>
                    <span className="font-medium">{selectedAppointment.profiles?.phone || "-"}</span>
                  </div>
                </CardContent>
              </Card>

              {/* Doctor Info */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Stethoscope className="w-4 h-4" />
                    Doctor Information
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-4">
                    {selectedAppointment.doctors?.photo_url ? (
                      <img src={selectedAppointment.doctors.photo_url} alt="" className="w-16 h-16 rounded-full object-cover" />
                    ) : (
                      <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                        <Stethoscope className="w-8 h-8 text-primary" />
                      </div>
                    )}
                    <div>
                      <p className="font-semibold text-lg">{selectedAppointment.doctors?.full_name}</p>
                      <p className="text-muted-foreground">{selectedAppointment.doctors?.qualification}</p>
                      <p className="text-sm text-primary">{selectedAppointment.doctors?.doctor_specializations?.name}</p>
                    </div>
                  </div>
                  {selectedAppointment.doctors?.clinic_name && (
                    <div className="mt-4 flex items-start gap-2">
                      <MapPin className="w-4 h-4 text-muted-foreground mt-0.5" />
                      <span className="text-sm">{selectedAppointment.doctors.clinic_name}</span>
                    </div>
                  )}
                  {selectedAppointment.doctors?.phone && (
                    <div className="mt-2 flex items-center gap-2">
                      <Phone className="w-4 h-4 text-muted-foreground" />
                      <span className="text-sm">{selectedAppointment.doctors.phone}</span>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Appointment Details */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">Appointment Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Date</span>
                    <span className="font-medium">{format(new Date(selectedAppointment.appointment_date), "dd MMM yyyy")}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Time</span>
                    <span className="font-medium">{selectedAppointment.appointment_time}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Fee</span>
                    <span className="font-bold text-lg">Rs. {selectedAppointment.fee.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Booked On</span>
                    <span className="font-medium">{format(new Date(selectedAppointment.created_at), "dd MMM yyyy, hh:mm a")}</span>
                  </div>
                  {selectedAppointment.confirmed_at && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Confirmed At</span>
                      <span className="font-medium">{format(new Date(selectedAppointment.confirmed_at), "dd MMM yyyy, hh:mm a")}</span>
                    </div>
                  )}
                  {selectedAppointment.completed_at && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Completed At</span>
                      <span className="font-medium">{format(new Date(selectedAppointment.completed_at), "dd MMM yyyy, hh:mm a")}</span>
                    </div>
                  )}
                </CardContent>
              </Card>

              {selectedAppointment.notes && (
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base">Patient Notes</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm">{selectedAppointment.notes}</p>
                  </CardContent>
                </Card>
              )}

              {selectedAppointment.cancellation_reason && (
                <Card className="border-red-200 bg-red-50">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base text-red-600">Cancellation Reason</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-red-700">{selectedAppointment.cancellation_reason}</p>
                  </CardContent>
                </Card>
              )}

              {/* Status Update Actions */}
              {selectedAppointment.status !== 'completed' && selectedAppointment.status !== 'cancelled' && (
                <div className="flex gap-3">
                  {selectedAppointment.status === 'pending' && (
                    <Button
                      className="flex-1 bg-blue-600 hover:bg-blue-700"
                      onClick={() => handleUpdateStatus(selectedAppointment.id, 'confirmed')}
                      disabled={isUpdating}
                    >
                      {isUpdating ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <CheckCircle className="w-4 h-4 mr-2" />}
                      Confirm
                    </Button>
                  )}
                  {selectedAppointment.status === 'confirmed' && (
                    <Button
                      className="flex-1 bg-green-600 hover:bg-green-700"
                      onClick={() => handleUpdateStatus(selectedAppointment.id, 'completed')}
                      disabled={isUpdating}
                    >
                      {isUpdating ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <CheckCircle className="w-4 h-4 mr-2" />}
                      Mark Completed
                    </Button>
                  )}
                  <Button
                    variant="destructive"
                    onClick={() => handleUpdateStatus(selectedAppointment.id, 'cancelled')}
                    disabled={isUpdating}
                  >
                    <XCircle className="w-4 h-4 mr-2" />
                    Cancel
                  </Button>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
};

export default AdminDoctorAppointments;