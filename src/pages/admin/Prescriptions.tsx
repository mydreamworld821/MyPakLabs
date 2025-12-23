import { useState, useEffect } from "react";
import AdminLayout from "@/components/admin/AdminLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Search, FileText, Loader2, Eye, Check, X } from "lucide-react";
import { format } from "date-fns";
import { useSignedUrl } from "@/hooks/useSignedUrl";

interface Prescription {
  id: string;
  user_id: string;
  lab_id: string | null;
  image_url: string;
  status: string;
  admin_notes: string | null;
  reviewed_at: string | null;
  created_at: string;
}

const statusColors: Record<string, string> = {
  pending_review: "bg-yellow-500/10 text-yellow-600 border-yellow-500/20",
  approved: "bg-green-500/10 text-green-600 border-green-500/20",
  rejected: "bg-red-500/10 text-red-600 border-red-500/20"
};

const AdminPrescriptions = () => {
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedPrescription, setSelectedPrescription] = useState<Prescription | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [adminNotes, setAdminNotes] = useState("");
  const [isUpdating, setIsUpdating] = useState(false);

  const { signedUrl, isLoading: isLoadingUrl } = useSignedUrl(
    selectedPrescription?.image_url || ""
  );

  useEffect(() => {
    fetchPrescriptions();
  }, []);

  const fetchPrescriptions = async () => {
    try {
      const { data, error } = await supabase
        .from("prescriptions")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setPrescriptions(data || []);
    } catch (error) {
      console.error("Error fetching prescriptions:", error);
      toast.error("Failed to fetch prescriptions");
    } finally {
      setIsLoading(false);
    }
  };

  const handleViewPrescription = (prescription: Prescription) => {
    setSelectedPrescription(prescription);
    setAdminNotes(prescription.admin_notes || "");
    setIsDialogOpen(true);
  };

  const handleUpdateStatus = async (status: "approved" | "rejected") => {
    if (!selectedPrescription) return;

    setIsUpdating(true);

    try {
      const { error } = await supabase
        .from("prescriptions")
        .update({
          status: status as any,
          admin_notes: adminNotes || null,
          reviewed_at: new Date().toISOString()
        })
        .eq("id", selectedPrescription.id);

      if (error) throw error;
      
      toast.success(`Prescription ${status}`);
      setIsDialogOpen(false);
      fetchPrescriptions();
    } catch (error) {
      console.error("Error updating prescription:", error);
      toast.error("Failed to update prescription");
    } finally {
      setIsUpdating(false);
    }
  };

  const filteredPrescriptions = prescriptions.filter(prescription => {
    const matchesSearch = prescription.id.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === "all" || prescription.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <AdminLayout>
      <div className="p-6 lg:p-8">
        <div className="mb-6">
          <h1 className="text-2xl lg:text-3xl font-bold">Prescriptions</h1>
          <p className="text-muted-foreground mt-1">
            Review and approve uploaded prescriptions
          </p>
        </div>

        {/* Filters */}
        <Card className="mb-6">
          <CardContent className="p-4">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search prescriptions..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full sm:w-[180px]">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="pending_review">Pending Review</SelectItem>
                  <SelectItem value="approved">Approved</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Prescriptions Table */}
        <Card>
          <CardContent className="p-0">
            {isLoading ? (
              <div className="flex items-center justify-center p-8">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
              </div>
            ) : filteredPrescriptions.length === 0 ? (
              <div className="flex flex-col items-center justify-center p-8 text-center">
                <FileText className="w-12 h-12 text-muted-foreground mb-4" />
                <p className="text-muted-foreground">No prescriptions found</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>ID</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Notes</TableHead>
                      <TableHead>Submitted</TableHead>
                      <TableHead>Reviewed</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredPrescriptions.map((prescription) => (
                      <TableRow key={prescription.id}>
                        <TableCell>
                          <span className="font-mono text-sm">
                            {prescription.id.slice(0, 8)}...
                          </span>
                        </TableCell>
                        <TableCell>
                          <Badge className={statusColors[prescription.status] || ""}>
                            {prescription.status.replace("_", " ")}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <span className="text-sm text-muted-foreground">
                            {prescription.admin_notes
                              ? prescription.admin_notes.slice(0, 30) + "..."
                              : "—"}
                          </span>
                        </TableCell>
                        <TableCell>
                          {format(new Date(prescription.created_at), "dd MMM yyyy")}
                        </TableCell>
                        <TableCell>
                          {prescription.reviewed_at
                            ? format(new Date(prescription.reviewed_at), "dd MMM yyyy")
                            : "—"}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleViewPrescription(prescription)}
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* View Prescription Dialog */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Review Prescription</DialogTitle>
            </DialogHeader>

            {selectedPrescription && (
              <div className="space-y-4 mt-4">
                {/* Prescription Image */}
                <div className="border rounded-lg overflow-hidden">
                  {isLoadingUrl ? (
                    <div className="flex items-center justify-center h-64 bg-muted">
                      <Loader2 className="w-8 h-8 animate-spin text-primary" />
                    </div>
                  ) : signedUrl ? (
                    <img
                      src={signedUrl}
                      alt="Prescription"
                      className="w-full max-h-96 object-contain bg-muted"
                    />
                  ) : (
                    <div className="flex items-center justify-center h-64 bg-muted text-muted-foreground">
                      Unable to load prescription image
                    </div>
                  )}
                </div>

                {/* Admin Notes */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">Admin Notes</label>
                  <Textarea
                    value={adminNotes}
                    onChange={(e) => setAdminNotes(e.target.value)}
                    placeholder="Add notes about this prescription..."
                    rows={3}
                  />
                </div>

                {/* Action Buttons */}
                {selectedPrescription.status === "pending_review" && (
                  <div className="flex gap-2 pt-4">
                    <Button
                      variant="outline"
                      className="flex-1 text-red-600 border-red-200 hover:bg-red-50"
                      onClick={() => handleUpdateStatus("rejected")}
                      disabled={isUpdating}
                    >
                      <X className="w-4 h-4 mr-2" />
                      Reject
                    </Button>
                    <Button
                      className="flex-1"
                      onClick={() => handleUpdateStatus("approved")}
                      disabled={isUpdating}
                    >
                      {isUpdating ? (
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      ) : (
                        <Check className="w-4 h-4 mr-2" />
                      )}
                      Approve
                    </Button>
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

export default AdminPrescriptions;
