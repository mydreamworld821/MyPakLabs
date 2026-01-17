import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import AdminLayout from "@/components/admin/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
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
  UserRound,
  User,
  Phone,
  MapPin,
  CheckCircle,
  XCircle,
  Filter,
  ClipboardList,
} from "lucide-react";

interface NurseBooking {
  id: string;
  nurse_id: string;
  patient_id: string | null;
  patient_name: string;
  patient_phone: string;
  patient_address: string | null;
  service_needed: string;
  preferred_date: string;
  preferred_time: string;
  status: string;
  notes: string | null;
  nurse_notes: string | null;
  created_at: string;
  confirmed_at: string | null;
  completed_at: string | null;
  cancelled_at: string | null;
  nurses: {
    id: string;
    full_name: string;
    photo_url: string | null;
    qualification: string;
    phone: string | null;
    city: string | null;
  };
}

const statusConfig: Record<string, { color: string; label: string }> = {
  pending: { color: "bg-yellow-500/10 text-yellow-600 border-yellow-500/20", label: "Pending" },
  confirmed: { color: "bg-blue-500/10 text-blue-600 border-blue-500/20", label: "Confirmed" },
  completed: { color: "bg-green-500/10 text-green-600 border-green-500/20", label: "Completed" },
  cancelled: { color: "bg-red-500/10 text-red-600 border-red-500/20", label: "Cancelled" },
};

const AdminNurseBookings = () => {
  const navigate = useNavigate();
  const [bookings, setBookings] = useState<NurseBooking[]>([]);
  const [filteredBookings, setFilteredBookings] = useState<NurseBooking[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedBooking, setSelectedBooking] = useState<NurseBooking | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [adminNote, setAdminNote] = useState("");

  useEffect(() => {
    fetchBookings();
  }, []);

  useEffect(() => {
    filterBookings();
  }, [bookings, searchQuery, statusFilter]);

  const fetchBookings = async () => {
    try {
      const { data, error } = await supabase
        .from("nurse_bookings")
        .select(`
          *,
          nurses:nurse_id (
            id,
            full_name,
            photo_url,
            qualification,
            phone,
            city
          )
        `)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setBookings(data || []);
    } catch (error) {
      console.error("Error fetching bookings:", error);
      toast.error("Failed to fetch bookings");
    } finally {
      setIsLoading(false);
    }
  };

  const filterBookings = () => {
    let filtered = [...bookings];

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (booking) =>
          booking.nurses?.full_name?.toLowerCase().includes(query) ||
          booking.patient_name?.toLowerCase().includes(query) ||
          booking.patient_phone?.includes(query) ||
          booking.service_needed?.toLowerCase().includes(query)
      );
    }

    if (statusFilter !== "all") {
      filtered = filtered.filter((booking) => booking.status === statusFilter);
    }

    setFilteredBookings(filtered);
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
        .from("nurse_bookings")
        .update(updateData)
        .eq("id", id);

      if (error) throw error;

      // Send confirmation notification with PDF when status changes to confirmed
      if (newStatus === 'confirmed' && selectedBooking) {
        const { sendAdminEmailNotification } = await import("@/utils/adminNotifications");
        const { data: authUser } = selectedBooking.patient_id 
          ? await supabase.auth.admin.getUserById(selectedBooking.patient_id)
          : { data: null };
        
        sendAdminEmailNotification({
          type: 'nurse_booking',
          status: 'confirmed',
          bookingId: id.slice(0, 8).toUpperCase(),
          patientName: selectedBooking.patient_name,
          patientPhone: selectedBooking.patient_phone,
          patientEmail: authUser?.user?.email || undefined,
          patientAddress: selectedBooking.patient_address || undefined,
          nurseId: selectedBooking.nurse_id,
          nurseName: selectedBooking.nurses?.full_name || '',
          nurseQualification: selectedBooking.nurses?.qualification || undefined,
          nursePhone: selectedBooking.nurses?.phone || undefined,
          serviceNeeded: selectedBooking.service_needed,
          preferredDate: format(new Date(selectedBooking.preferred_date), "dd MMM yyyy"),
          preferredTime: selectedBooking.preferred_time,
          nurseNotes: selectedBooking.nurse_notes || undefined,
        }).catch(console.error);
      }

      toast.success(`Booking ${newStatus}`);
      fetchBookings();
      setIsDialogOpen(false);
    } catch (error) {
      console.error("Error updating booking:", error);
      toast.error("Failed to update booking");
    } finally {
      setIsUpdating(false);
    }
  };

  const stats = {
    total: bookings.length,
    pending: bookings.filter((b) => b.status === "pending").length,
    confirmed: bookings.filter((b) => b.status === "confirmed").length,
    completed: bookings.filter((b) => b.status === "completed").length,
    cancelled: bookings.filter((b) => b.status === "cancelled").length,
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
          <h1 className="text-2xl font-bold">Nurse Bookings</h1>
          <p className="text-muted-foreground">Manage all nursing service bookings</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <ClipboardList className="w-8 h-8 text-primary" />
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
                  placeholder="Search by nurse, patient, or service..."
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
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Bookings Table */}
        <Card>
          <CardHeader>
            <CardTitle>Bookings ({filteredBookings.length})</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Patient</TableHead>
                    <TableHead>Nurse</TableHead>
                    <TableHead>Service</TableHead>
                    <TableHead>Date & Time</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredBookings.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                        No bookings found
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredBookings.map((booking) => (
                      <TableRow key={booking.id}>
                        <TableCell>
                          <div>
                            <p className="font-medium">{booking.patient_name}</p>
                            <p className="text-xs text-muted-foreground">{booking.patient_phone}</p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {booking.nurses?.photo_url ? (
                              <img src={booking.nurses.photo_url} alt="" className="w-8 h-8 rounded-full object-cover" />
                            ) : (
                              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                                <UserRound className="w-4 h-4 text-primary" />
                              </div>
                            )}
                            <div>
                              <p className="font-medium">{booking.nurses?.full_name}</p>
                              <p className="text-xs text-muted-foreground">{booking.nurses?.qualification}</p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className="text-sm">{booking.service_needed}</span>
                        </TableCell>
                        <TableCell>
                          <div>
                            <p className="font-medium">{format(new Date(booking.preferred_date), "dd MMM yyyy")}</p>
                            <p className="text-xs text-muted-foreground">{booking.preferred_time}</p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge className={statusConfig[booking.status]?.color || ""}>
                            {statusConfig[booking.status]?.label || booking.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                              setSelectedBooking(booking);
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

      {/* Booking Detail Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Booking Details</DialogTitle>
          </DialogHeader>

          {selectedBooking && (
            <div className="space-y-6 mt-4">
              {/* Status Badge */}
              <div className="flex items-center justify-between">
                <Badge className={statusConfig[selectedBooking.status]?.color || ""}>
                  {statusConfig[selectedBooking.status]?.label}
                </Badge>
                <span className="text-sm text-muted-foreground">
                  Booked on {format(new Date(selectedBooking.created_at), "dd MMM yyyy")}
                </span>
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
                    <span className="font-medium">{selectedBooking.patient_name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Phone</span>
                    <span className="font-medium">{selectedBooking.patient_phone}</span>
                  </div>
                  {selectedBooking.patient_address && (
                    <div className="pt-2">
                      <span className="text-muted-foreground block mb-1">Address</span>
                      <div className="flex items-start gap-2">
                        <MapPin className="w-4 h-4 text-primary mt-0.5" />
                        <span className="text-sm">{selectedBooking.patient_address}</span>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Nurse Info */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base flex items-center gap-2">
                    <UserRound className="w-4 h-4" />
                    Nurse Information
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-4">
                    {selectedBooking.nurses?.photo_url ? (
                      <img src={selectedBooking.nurses.photo_url} alt="" className="w-16 h-16 rounded-full object-cover" />
                    ) : (
                      <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                        <UserRound className="w-8 h-8 text-primary" />
                      </div>
                    )}
                    <div>
                      <p className="font-semibold text-lg">{selectedBooking.nurses?.full_name}</p>
                      <p className="text-muted-foreground">{selectedBooking.nurses?.qualification}</p>
                      {selectedBooking.nurses?.city && (
                        <p className="text-sm text-muted-foreground">{selectedBooking.nurses.city}</p>
                      )}
                    </div>
                  </div>
                  {selectedBooking.nurses?.phone && (
                    <div className="mt-4 flex items-center gap-2">
                      <Phone className="w-4 h-4 text-muted-foreground" />
                      <span className="text-sm">{selectedBooking.nurses.phone}</span>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Service Details */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">Service Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Service Needed</span>
                    <span className="font-medium">{selectedBooking.service_needed}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Preferred Date</span>
                    <span className="font-medium">{format(new Date(selectedBooking.preferred_date), "dd MMM yyyy")}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Preferred Time</span>
                    <span className="font-medium">{selectedBooking.preferred_time}</span>
                  </div>
                </CardContent>
              </Card>

              {selectedBooking.notes && (
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base">Patient Notes</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm">{selectedBooking.notes}</p>
                  </CardContent>
                </Card>
              )}

              {selectedBooking.nurse_notes && (
                <Card className="border-primary/20">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base">Nurse Notes</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm">{selectedBooking.nurse_notes}</p>
                  </CardContent>
                </Card>
              )}

              {/* Status Update Actions */}
              {selectedBooking.status !== 'completed' && selectedBooking.status !== 'cancelled' && (
                <div className="flex gap-3">
                  {selectedBooking.status === 'pending' && (
                    <Button
                      className="flex-1 bg-blue-600 hover:bg-blue-700"
                      onClick={() => handleUpdateStatus(selectedBooking.id, 'confirmed')}
                      disabled={isUpdating}
                    >
                      {isUpdating ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <CheckCircle className="w-4 h-4 mr-2" />}
                      Confirm
                    </Button>
                  )}
                  {selectedBooking.status === 'confirmed' && (
                    <Button
                      className="flex-1 bg-green-600 hover:bg-green-700"
                      onClick={() => handleUpdateStatus(selectedBooking.id, 'completed')}
                      disabled={isUpdating}
                    >
                      {isUpdating ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <CheckCircle className="w-4 h-4 mr-2" />}
                      Mark Completed
                    </Button>
                  )}
                  <Button
                    variant="destructive"
                    onClick={() => handleUpdateStatus(selectedBooking.id, 'cancelled')}
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

export default AdminNurseBookings;