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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Eye, Check, X, Loader2, UserRound, Star, ExternalLink, FileText } from "lucide-react";
import { format } from "date-fns";

interface Doctor {
  id: string;
  full_name: string;
  gender: string | null;
  date_of_birth: string | null;
  pmc_number: string;
  specialization_id: string | null;
  sub_specialty: string | null;
  experience_years: number | null;
  qualification: string | null;
  registration_council: string | null;
  hospital_name: string | null;
  clinic_name: string | null;
  clinic_address: string | null;
  city: string | null;
  consultation_type: string | null;
  consultation_fee: number | null;
  followup_fee: number | null;
  available_days: string[] | null;
  available_time_start: string | null;
  available_time_end: string | null;
  appointment_duration: number | null;
  emergency_available: boolean | null;
  phone: string | null;
  email: string | null;
  whatsapp_number: string | null;
  video_consultation: boolean | null;
  preferred_platform: string | null;
  online_consultation_fee: number | null;
  photo_url: string | null;
  bio: string | null;
  areas_of_expertise: string[] | null;
  services_offered: string[] | null;
  languages_spoken: string[] | null;
  degree_certificate_url: string | null;
  pmc_certificate_url: string | null;
  cnic_url: string | null;
  status: string;
  is_featured: boolean | null;
  rating: number | null;
  admin_notes: string | null;
  created_at: string;
  specialization?: { name: string } | null;
}

const AdminDoctors = () => {
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDoctor, setSelectedDoctor] = useState<Doctor | null>(null);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [adminNotes, setAdminNotes] = useState("");
  const [documentUrls, setDocumentUrls] = useState<{ [key: string]: string }>({});

  const fetchData = async () => {
    try {
      const { data: doctorsData, error: doctorsError } = await supabase
        .from("doctors")
        .select("*, specialization:doctor_specializations(name)")
        .order("created_at", { ascending: false });

      if (doctorsError) throw doctorsError;
      setDoctors(doctorsData || []);
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

  const getSignedUrl = async (path: string) => {
    if (!path) return "";
    
    // Check if it's already a full URL
    if (path.startsWith("http")) return path;
    
    const { data, error } = await supabase.storage
      .from("doctor-documents")
      .createSignedUrl(path, 3600); // 1 hour expiry
    
    if (error) {
      console.error("Error getting signed URL:", error);
      return "";
    }
    return data.signedUrl;
  };

  const loadDocumentUrls = async (doctor: Doctor) => {
    const urls: { [key: string]: string } = {};
    
    if (doctor.degree_certificate_url) {
      urls.degree = await getSignedUrl(doctor.degree_certificate_url);
    }
    if (doctor.pmc_certificate_url) {
      urls.pmc = await getSignedUrl(doctor.pmc_certificate_url);
    }
    if (doctor.cnic_url) {
      urls.cnic = await getSignedUrl(doctor.cnic_url);
    }
    
    setDocumentUrls(urls);
  };

  const handleViewDoctor = async (doctor: Doctor) => {
    setSelectedDoctor(doctor);
    setAdminNotes(doctor.admin_notes || "");
    setDocumentUrls({});
    setIsViewDialogOpen(true);
    await loadDocumentUrls(doctor);
  };

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

  const InfoRow = ({ label, value }: { label: string; value: React.ReactNode }) => (
    <div className="grid grid-cols-2 gap-2 py-1 border-b border-muted last:border-0">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className="text-xs font-medium">{value || "-"}</span>
    </div>
  );

  const DocumentLink = ({ url, label }: { url: string; label: string }) => (
    url ? (
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center gap-1 text-xs text-primary hover:underline"
      >
        <FileText className="w-3 h-3" />
        {label}
        <ExternalLink className="w-3 h-3" />
      </a>
    ) : (
      <span className="text-xs text-muted-foreground">Not uploaded</span>
    )
  );

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
                          onClick={() => handleViewDoctor(doctor)}
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
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-sm">Doctor Details</DialogTitle>
            </DialogHeader>
            {selectedDoctor && (
              <div className="space-y-4">
                {/* Header */}
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

                <Tabs defaultValue="personal" className="w-full">
                  <TabsList className="grid grid-cols-5 h-8">
                    <TabsTrigger value="personal" className="text-xs">Personal</TabsTrigger>
                    <TabsTrigger value="professional" className="text-xs">Professional</TabsTrigger>
                    <TabsTrigger value="practice" className="text-xs">Practice</TabsTrigger>
                    <TabsTrigger value="schedule" className="text-xs">Schedule</TabsTrigger>
                    <TabsTrigger value="documents" className="text-xs">Documents</TabsTrigger>
                  </TabsList>

                  <TabsContent value="personal" className="space-y-1 mt-3">
                    <InfoRow label="Full Name" value={selectedDoctor.full_name} />
                    <InfoRow label="Gender" value={selectedDoctor.gender} />
                    <InfoRow 
                      label="Date of Birth" 
                      value={selectedDoctor.date_of_birth ? format(new Date(selectedDoctor.date_of_birth), "PPP") : null} 
                    />
                    <InfoRow label="Email" value={selectedDoctor.email} />
                    <InfoRow label="Phone" value={selectedDoctor.phone} />
                    <InfoRow label="WhatsApp" value={selectedDoctor.whatsapp_number} />
                    <InfoRow label="Languages" value={selectedDoctor.languages_spoken?.join(", ")} />
                  </TabsContent>

                  <TabsContent value="professional" className="space-y-1 mt-3">
                    <InfoRow label="Specialization" value={selectedDoctor.specialization?.name} />
                    <InfoRow label="Sub-Specialty" value={selectedDoctor.sub_specialty} />
                    <InfoRow label="Qualification" value={selectedDoctor.qualification} />
                    <InfoRow label="Experience" value={`${selectedDoctor.experience_years} years`} />
                    <InfoRow label="PMC Number" value={selectedDoctor.pmc_number} />
                    <InfoRow label="Council" value={selectedDoctor.registration_council} />
                    <InfoRow label="Bio" value={selectedDoctor.bio} />
                    <InfoRow label="Expertise" value={selectedDoctor.areas_of_expertise?.join(", ")} />
                    <InfoRow label="Services" value={selectedDoctor.services_offered?.join(", ")} />
                  </TabsContent>

                  <TabsContent value="practice" className="space-y-1 mt-3">
                    <InfoRow label="Hospital" value={selectedDoctor.hospital_name} />
                    <InfoRow label="Clinic" value={selectedDoctor.clinic_name} />
                    <InfoRow label="Address" value={selectedDoctor.clinic_address} />
                    <InfoRow label="City" value={selectedDoctor.city} />
                    <InfoRow label="Consultation Type" value={selectedDoctor.consultation_type} />
                    <InfoRow label="Consultation Fee" value={`Rs. ${selectedDoctor.consultation_fee}`} />
                    <InfoRow label="Follow-up Fee" value={selectedDoctor.followup_fee ? `Rs. ${selectedDoctor.followup_fee}` : null} />
                    <InfoRow label="Video Consultation" value={selectedDoctor.video_consultation ? "Yes" : "No"} />
                    {selectedDoctor.video_consultation && (
                      <>
                        <InfoRow label="Platform" value={selectedDoctor.preferred_platform} />
                        <InfoRow label="Online Fee" value={selectedDoctor.online_consultation_fee ? `Rs. ${selectedDoctor.online_consultation_fee}` : null} />
                      </>
                    )}
                  </TabsContent>

                  <TabsContent value="schedule" className="space-y-1 mt-3">
                    <InfoRow label="Available Days" value={selectedDoctor.available_days?.join(", ")} />
                    <InfoRow 
                      label="Timing" 
                      value={`${selectedDoctor.available_time_start} - ${selectedDoctor.available_time_end}`} 
                    />
                    <InfoRow label="Appointment Duration" value={`${selectedDoctor.appointment_duration} minutes`} />
                    <InfoRow label="Emergency Available" value={selectedDoctor.emergency_available ? "Yes" : "No"} />
                    <InfoRow 
                      label="Registered On" 
                      value={format(new Date(selectedDoctor.created_at), "PPP")} 
                    />
                  </TabsContent>

                  <TabsContent value="documents" className="space-y-3 mt-3">
                    <div className="p-3 bg-muted rounded-lg">
                      <p className="text-xs font-medium mb-2">Verification Documents</p>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-muted-foreground">Degree Certificate</span>
                          <DocumentLink url={documentUrls.degree || ""} label="View" />
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-muted-foreground">PMC Certificate</span>
                          <DocumentLink url={documentUrls.pmc || ""} label="View" />
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-muted-foreground">CNIC</span>
                          <DocumentLink url={documentUrls.cnic || ""} label="View" />
                        </div>
                      </div>
                    </div>
                  </TabsContent>
                </Tabs>

                {/* Approval Actions */}
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
