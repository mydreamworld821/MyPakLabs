import { useState, useEffect } from "react";
import AdminLayout from "@/components/admin/AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
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
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Eye, Check, X, Loader2, UserRound, Star } from "lucide-react";
import { format } from "date-fns";

interface Doctor {
  id: string;
  full_name: string;
  pmc_number: string;
  specialization_id: string | null;
  experience_years: number | null;
  qualification: string | null;
  clinic_name: string | null;
  clinic_address: string | null;
  city: string | null;
  phone: string | null;
  email: string | null;
  consultation_fee: number | null;
  availability: string | null;
  photo_url: string | null;
  about: string | null;
  status: string;
  is_featured: boolean | null;
  rating: number | null;
  admin_notes: string | null;
  created_at: string;
  specialization?: { name: string } | null;
}

interface Specialization {
  id: string;
  name: string;
}

const AdminDoctors = () => {
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [specializations, setSpecializations] = useState<Specialization[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDoctor, setSelectedDoctor] = useState<Doctor | null>(null);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [adminNotes, setAdminNotes] = useState("");

  const fetchData = async () => {
    try {
      const [{ data: doctorsData, error: doctorsError }, { data: specsData }] = await Promise.all([
        supabase
          .from("doctors")
          .select("*, specialization:doctor_specializations(name)")
          .order("created_at", { ascending: false }),
        supabase.from("doctor_specializations").select("id, name").eq("is_active", true),
      ]);

      if (doctorsError) throw doctorsError;
      setDoctors(doctorsData || []);
      setSpecializations(specsData || []);
    } catch (error: any) {
      toast.error("Failed to fetch data");
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleStatusUpdate = async (doctorId: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from("doctors")
        .update({
          status: newStatus,
          admin_notes: adminNotes || null,
          reviewed_at: new Date().toISOString(),
        })
        .eq("id", doctorId);

      if (error) throw error;
      toast.success(`Doctor ${newStatus}`);
      setIsViewDialogOpen(false);
      setAdminNotes("");
      fetchData();
    } catch (error: any) {
      toast.error(error.message || "Failed to update status");
    }
  };

  const handleToggleFeatured = async (doctorId: string, isFeatured: boolean) => {
    try {
      const { error } = await supabase
        .from("doctors")
        .update({ is_featured: !isFeatured })
        .eq("id", doctorId);

      if (error) throw error;
      toast.success(isFeatured ? "Removed from featured" : "Added to featured");
      fetchData();
    } catch (error: any) {
      toast.error("Failed to update featured status");
    }
  };

  const filteredDoctors = doctors.filter((doctor) => {
    const matchesStatus = statusFilter === "all" || doctor.status === statusFilter;
    const matchesSearch =
      doctor.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doctor.pmc_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doctor.city?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "approved":
        return <Badge className="bg-green-100 text-green-700 text-xs">Approved</Badge>;
      case "rejected":
        return <Badge className="bg-red-100 text-red-700 text-xs">Rejected</Badge>;
      default:
        return <Badge className="bg-yellow-100 text-yellow-700 text-xs">Pending</Badge>;
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-4">
        <div>
          <h1 className="text-lg font-bold text-foreground">Manage Doctors</h1>
          <p className="text-xs text-muted-foreground">
            Review and approve doctor registrations
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-2">
          <Input
            placeholder="Search by name, PMC, city..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="text-xs h-8 flex-1"
          />
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[140px] h-8 text-xs">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all" className="text-xs">All Status</SelectItem>
              <SelectItem value="pending" className="text-xs">Pending</SelectItem>
              <SelectItem value="approved" className="text-xs">Approved</SelectItem>
              <SelectItem value="rejected" className="text-xs">Rejected</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Card>
          <CardContent className="p-0">
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-5 h-5 animate-spin text-primary" />
              </div>
            ) : filteredDoctors.length === 0 ? (
              <div className="text-center py-8">
                <UserRound className="w-8 h-8 mx-auto text-muted-foreground mb-2" />
                <p className="text-xs text-muted-foreground">No doctors found</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-xs">Doctor</TableHead>
                    <TableHead className="text-xs">Specialization</TableHead>
                    <TableHead className="text-xs">PMC Number</TableHead>
                    <TableHead className="text-xs">City</TableHead>
                    <TableHead className="text-xs">Status</TableHead>
                    <TableHead className="text-xs">Featured</TableHead>
                    <TableHead className="text-xs text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredDoctors.map((doctor) => (
                    <TableRow key={doctor.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {doctor.photo_url ? (
                            <img
                              src={doctor.photo_url}
                              alt={doctor.full_name}
                              className="w-8 h-8 rounded-full object-cover"
                            />
                          ) : (
                            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                              <UserRound className="w-4 h-4 text-primary" />
                            </div>
                          )}
                          <div>
                            <p className="text-xs font-medium">{doctor.full_name}</p>
                            <p className="text-xs text-muted-foreground">{doctor.qualification}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-xs">
                        {doctor.specialization?.name || "-"}
                      </TableCell>
                      <TableCell className="text-xs">{doctor.pmc_number}</TableCell>
                      <TableCell className="text-xs">{doctor.city || "-"}</TableCell>
                      <TableCell>{getStatusBadge(doctor.status)}</TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7"
                          onClick={() => handleToggleFeatured(doctor.id, doctor.is_featured || false)}
                        >
                          <Star
                            className={`w-3 h-3 ${
                              doctor.is_featured ? "fill-yellow-400 text-yellow-400" : "text-muted-foreground"
                            }`}
                          />
                        </Button>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7"
                          onClick={() => {
                            setSelectedDoctor(doctor);
                            setAdminNotes(doctor.admin_notes || "");
                            setIsViewDialogOpen(true);
                          }}
                        >
                          <Eye className="w-3 h-3" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* Doctor Details Dialog */}
        <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
          <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-sm">Doctor Details</DialogTitle>
            </DialogHeader>
            {selectedDoctor && (
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  {selectedDoctor.photo_url ? (
                    <img
                      src={selectedDoctor.photo_url}
                      alt={selectedDoctor.full_name}
                      className="w-16 h-16 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                      <UserRound className="w-8 h-8 text-primary" />
                    </div>
                  )}
                  <div>
                    <h3 className="text-sm font-semibold">{selectedDoctor.full_name}</h3>
                    <p className="text-xs text-muted-foreground">{selectedDoctor.qualification}</p>
                    {getStatusBadge(selectedDoctor.status)}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <Label className="text-muted-foreground">PMC Number</Label>
                    <p className="font-medium">{selectedDoctor.pmc_number}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Specialization</Label>
                    <p className="font-medium">{selectedDoctor.specialization?.name || "-"}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Experience</Label>
                    <p className="font-medium">{selectedDoctor.experience_years} years</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Fee</Label>
                    <p className="font-medium">Rs. {selectedDoctor.consultation_fee}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">City</Label>
                    <p className="font-medium">{selectedDoctor.city || "-"}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Phone</Label>
                    <p className="font-medium">{selectedDoctor.phone || "-"}</p>
                  </div>
                  <div className="col-span-2">
                    <Label className="text-muted-foreground">Clinic</Label>
                    <p className="font-medium">{selectedDoctor.clinic_name}</p>
                    <p className="text-muted-foreground">{selectedDoctor.clinic_address}</p>
                  </div>
                  <div className="col-span-2">
                    <Label className="text-muted-foreground">Availability</Label>
                    <p className="font-medium">{selectedDoctor.availability || "-"}</p>
                  </div>
                  {selectedDoctor.about && (
                    <div className="col-span-2">
                      <Label className="text-muted-foreground">About</Label>
                      <p className="font-medium">{selectedDoctor.about}</p>
                    </div>
                  )}
                  <div className="col-span-2">
                    <Label className="text-muted-foreground">Registered</Label>
                    <p className="font-medium">
                      {format(new Date(selectedDoctor.created_at), "PPP")}
                    </p>
                  </div>
                </div>

                {selectedDoctor.status === "pending" && (
                  <div className="space-y-2 pt-2 border-t">
                    <div>
                      <Label className="text-xs">Admin Notes (optional)</Label>
                      <Textarea
                        value={adminNotes}
                        onChange={(e) => setAdminNotes(e.target.value)}
                        placeholder="Add notes about approval/rejection..."
                        className="text-xs min-h-[60px]"
                      />
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        className="text-xs flex-1"
                        onClick={() => handleStatusUpdate(selectedDoctor.id, "approved")}
                      >
                        <Check className="w-3 h-3 mr-1" />
                        Approve
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        className="text-xs flex-1"
                        onClick={() => handleStatusUpdate(selectedDoctor.id, "rejected")}
                      >
                        <X className="w-3 h-3 mr-1" />
                        Reject
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
};

export default AdminDoctors;
