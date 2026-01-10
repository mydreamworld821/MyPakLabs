import { useState, useEffect } from "react";
import AdminLayout from "@/components/admin/AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { 
  Search, 
  Heart, 
  Eye,
  CheckCircle,
  XCircle,
  AlertCircle,
  Loader2,
  FileText,
  Phone,
  MapPin,
  Clock,
  Star
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

interface Nurse {
  id: string;
  full_name: string;
  photo_url: string | null;
  qualification: string;
  experience_years: number;
  city: string;
  phone: string;
  email: string;
  pnc_number: string;
  services_offered: string[];
  per_visit_fee: number;
  status: string;
  created_at: string;
  admin_notes: string | null;
  degree_certificate_url: string | null;
  pnc_card_url: string | null;
  is_featured: boolean;
}

const AdminNurses = () => {
  const { user } = useAuth();
  const [nurses, setNurses] = useState<Nurse[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedNurse, setSelectedNurse] = useState<Nurse | null>(null);
  const [showDialog, setShowDialog] = useState(false);
  const [adminNotes, setAdminNotes] = useState("");
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    fetchNurses();
  }, [statusFilter]);

  const fetchNurses = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from("nurses")
        .select("*")
        .order("created_at", { ascending: false });

      if (statusFilter !== "all") {
        query = query.eq("status", statusFilter);
      }

      const { data, error } = await query;
      if (error) throw error;
      setNurses(data || []);
    } catch (error) {
      console.error("Error fetching nurses:", error);
      toast.error("Failed to load nurses");
    } finally {
      setLoading(false);
    }
  };

  const handleViewNurse = (nurse: Nurse) => {
    setSelectedNurse(nurse);
    setAdminNotes(nurse.admin_notes || "");
    setShowDialog(true);
  };

  const handleUpdateStatus = async (status: string) => {
    if (!selectedNurse || !user) return;

    setUpdating(true);
    try {
      const { error } = await supabase
        .from("nurses")
        .update({
          status,
          admin_notes: adminNotes,
          reviewed_by: user.id,
          reviewed_at: new Date().toISOString(),
        })
        .eq("id", selectedNurse.id);

      if (error) throw error;

      toast.success(`Nurse ${status === "approved" ? "approved" : status === "rejected" ? "rejected" : "updated"} successfully`);
      setShowDialog(false);
      fetchNurses();
    } catch (error: any) {
      toast.error(error.message || "Failed to update nurse status");
    } finally {
      setUpdating(false);
    }
  };

  const handleToggleFeatured = async (nurse: Nurse) => {
    try {
      const { error } = await supabase
        .from("nurses")
        .update({ is_featured: !nurse.is_featured })
        .eq("id", nurse.id);

      if (error) throw error;
      toast.success(nurse.is_featured ? "Removed from featured" : "Added to featured");
      fetchNurses();
    } catch (error: any) {
      toast.error(error.message || "Failed to update featured status");
    }
  };

  const getSignedUrl = async (path: string) => {
    if (!path) return null;
    const { data } = await supabase.storage
      .from("nurse-documents")
      .createSignedUrl(path, 3600);
    return data?.signedUrl;
  };

  const handleViewDocument = async (path: string | null, label: string) => {
    if (!path) {
      toast.error(`${label} not uploaded`);
      return;
    }
    
    const url = await getSignedUrl(path);
    if (url) {
      window.open(url, "_blank");
    } else {
      toast.error("Failed to load document");
    }
  };

  const filteredNurses = nurses.filter(nurse =>
    nurse.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    nurse.city?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    nurse.phone?.includes(searchQuery)
  );

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "approved":
        return <Badge className="bg-green-100 text-green-700">Approved</Badge>;
      case "rejected":
        return <Badge variant="destructive">Rejected</Badge>;
      case "suspended":
        return <Badge className="bg-orange-100 text-orange-700">Suspended</Badge>;
      default:
        return <Badge variant="secondary">Pending</Badge>;
    }
  };

  const statusCounts = {
    all: nurses.length,
    pending: nurses.filter(n => n.status === "pending").length,
    approved: nurses.filter(n => n.status === "approved").length,
    rejected: nurses.filter(n => n.status === "rejected").length,
    suspended: nurses.filter(n => n.status === "suspended").length,
  };

  return (
    <AdminLayout>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Heart className="w-5 h-5 text-rose-600" />
            <h1 className="text-lg font-bold">Nurse Management</h1>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          {[
            { label: "All", value: statusCounts.all, key: "all" },
            { label: "Pending", value: statusCounts.pending, key: "pending", color: "text-yellow-600" },
            { label: "Approved", value: statusCounts.approved, key: "approved", color: "text-green-600" },
            { label: "Rejected", value: statusCounts.rejected, key: "rejected", color: "text-red-600" },
            { label: "Suspended", value: statusCounts.suspended, key: "suspended", color: "text-orange-600" },
          ].map((stat) => (
            <Card 
              key={stat.key} 
              className={`cursor-pointer transition-colors ${statusFilter === stat.key ? "border-rose-500" : ""}`}
              onClick={() => setStatusFilter(stat.key)}
            >
              <CardContent className="p-3 text-center">
                <p className={`text-xl font-bold ${stat.color || ""}`}>{stat.value}</p>
                <p className="text-xs text-muted-foreground">{stat.label}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Search */}
        <div className="flex gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search by name, city, or phone..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 text-xs h-9"
            />
          </div>
        </div>

        {/* Table */}
        <Card>
          <CardContent className="p-0">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-6 h-6 animate-spin" />
              </div>
            ) : filteredNurses.length === 0 ? (
              <div className="text-center py-12">
                <Heart className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
                <p className="text-sm text-muted-foreground">No nurses found</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-xs">Nurse</TableHead>
                    <TableHead className="text-xs">Qualification</TableHead>
                    <TableHead className="text-xs">City</TableHead>
                    <TableHead className="text-xs">Fee</TableHead>
                    <TableHead className="text-xs">Status</TableHead>
                    <TableHead className="text-xs">Featured</TableHead>
                    <TableHead className="text-xs">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredNurses.map((nurse) => (
                    <TableRow key={nurse.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full bg-rose-100 flex items-center justify-center overflow-hidden">
                            {nurse.photo_url ? (
                              <img src={nurse.photo_url} alt="" className="w-full h-full object-cover" />
                            ) : (
                              <Heart className="w-4 h-4 text-rose-600" />
                            )}
                          </div>
                          <div>
                            <p className="text-xs font-medium">{nurse.full_name}</p>
                            <p className="text-[10px] text-muted-foreground">{nurse.phone}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-xs">{nurse.qualification}</TableCell>
                      <TableCell className="text-xs">{nurse.city}</TableCell>
                      <TableCell className="text-xs">PKR {nurse.per_visit_fee?.toLocaleString()}</TableCell>
                      <TableCell>{getStatusBadge(nurse.status)}</TableCell>
                      <TableCell>
                        <Button
                          variant={nurse.is_featured ? "default" : "outline"}
                          size="sm"
                          className="h-6 text-[10px]"
                          onClick={() => handleToggleFeatured(nurse)}
                        >
                          {nurse.is_featured ? <Star className="w-3 h-3 fill-current" /> : <Star className="w-3 h-3" />}
                        </Button>
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-7 text-xs"
                          onClick={() => handleViewNurse(nurse)}
                        >
                          <Eye className="w-3 h-3 mr-1" />
                          Review
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* Review Dialog */}
        <Dialog open={showDialog} onOpenChange={setShowDialog}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-sm">Review Nurse Application</DialogTitle>
            </DialogHeader>
            
            {selectedNurse && (
              <div className="space-y-4">
                {/* Nurse Info */}
                <div className="flex items-start gap-4">
                  <div className="w-16 h-16 rounded-full bg-rose-100 flex items-center justify-center overflow-hidden">
                    {selectedNurse.photo_url ? (
                      <img src={selectedNurse.photo_url} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <Heart className="w-6 h-6 text-rose-600" />
                    )}
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold">{selectedNurse.full_name}</h3>
                    <p className="text-xs text-muted-foreground">{selectedNurse.qualification}</p>
                    <div className="flex flex-wrap gap-2 mt-2">
                      <Badge variant="outline" className="text-[10px]">
                        <Phone className="w-3 h-3 mr-1" />
                        {selectedNurse.phone}
                      </Badge>
                      <Badge variant="outline" className="text-[10px]">
                        <MapPin className="w-3 h-3 mr-1" />
                        {selectedNurse.city}
                      </Badge>
                      <Badge variant="outline" className="text-[10px]">
                        PNC: {selectedNurse.pnc_number}
                      </Badge>
                    </div>
                  </div>
                  {getStatusBadge(selectedNurse.status)}
                </div>

                {/* Services */}
                <div>
                  <h4 className="text-xs font-semibold mb-2">Services Offered</h4>
                  <div className="flex flex-wrap gap-1">
                    {selectedNurse.services_offered?.map((service, idx) => (
                      <Badge key={idx} variant="secondary" className="text-[10px]">
                        {service}
                      </Badge>
                    ))}
                  </div>
                </div>

                {/* Documents */}
                <div>
                  <h4 className="text-xs font-semibold mb-2">Documents</h4>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-xs"
                      onClick={() => handleViewDocument(selectedNurse.degree_certificate_url, "Degree Certificate")}
                    >
                      <FileText className="w-3 h-3 mr-1" />
                      Degree Certificate
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-xs"
                      onClick={() => handleViewDocument(selectedNurse.pnc_card_url, "PNC Card")}
                    >
                      <FileText className="w-3 h-3 mr-1" />
                      PNC Card
                    </Button>
                  </div>
                </div>

                {/* Admin Notes */}
                <div>
                  <h4 className="text-xs font-semibold mb-2">Admin Notes</h4>
                  <Textarea
                    value={adminNotes}
                    onChange={(e) => setAdminNotes(e.target.value)}
                    placeholder="Add notes about this application..."
                    className="text-xs"
                    rows={3}
                  />
                </div>

                {/* Action Buttons */}
                <div className="flex gap-2 pt-4 border-t">
                  {selectedNurse.status === "pending" && (
                    <>
                      <Button
                        onClick={() => handleUpdateStatus("approved")}
                        disabled={updating}
                        className="flex-1 bg-green-600 hover:bg-green-700"
                      >
                        {updating ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : <CheckCircle className="w-4 h-4 mr-1" />}
                        Approve
                      </Button>
                      <Button
                        variant="destructive"
                        onClick={() => handleUpdateStatus("rejected")}
                        disabled={updating}
                        className="flex-1"
                      >
                        {updating ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : <XCircle className="w-4 h-4 mr-1" />}
                        Reject
                      </Button>
                    </>
                  )}
                  {selectedNurse.status === "approved" && (
                    <Button
                      variant="outline"
                      onClick={() => handleUpdateStatus("suspended")}
                      disabled={updating}
                      className="flex-1 border-orange-500 text-orange-600"
                    >
                      {updating ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : <AlertCircle className="w-4 h-4 mr-1" />}
                      Suspend
                    </Button>
                  )}
                  {selectedNurse.status === "suspended" && (
                    <Button
                      onClick={() => handleUpdateStatus("approved")}
                      disabled={updating}
                      className="flex-1 bg-green-600 hover:bg-green-700"
                    >
                      {updating ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : <CheckCircle className="w-4 h-4 mr-1" />}
                      Reactivate
                    </Button>
                  )}
                  {selectedNurse.status === "rejected" && (
                    <Button
                      onClick={() => handleUpdateStatus("approved")}
                      disabled={updating}
                      className="flex-1 bg-green-600 hover:bg-green-700"
                    >
                      {updating ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : <CheckCircle className="w-4 h-4 mr-1" />}
                      Approve
                    </Button>
                  )}
                  <Button
                    variant="outline"
                    onClick={() => handleUpdateStatus(selectedNurse.status)}
                    disabled={updating}
                  >
                    Save Notes
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
};

export default AdminNurses;
