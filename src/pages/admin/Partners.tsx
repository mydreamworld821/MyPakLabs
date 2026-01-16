import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import AdminLayout from "@/components/admin/AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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
  DialogFooter,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";
import {
  Check,
  X,
  Eye,
  Trash2,
  Building2,
  Search,
  ExternalLink,
  Clock,
  ArrowUp,
  ArrowDown,
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

interface Partner {
  id: string;
  company_name: string;
  logo_url: string | null;
  website_url: string | null;
  contact_email: string | null;
  contact_phone: string | null;
  partner_type: string | null;
  description: string | null;
  is_approved: boolean;
  display_order: number;
  created_at: string;
}

const AdminPartners = () => {
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "pending" | "approved">("all");
  const [selectedPartner, setSelectedPartner] = useState<Partner | null>(null);

  const { data: partners, isLoading } = useQuery({
    queryKey: ["admin-partners"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("partners")
        .select("*")
        .order("display_order", { ascending: true });

      if (error) throw error;
      return data as Partner[];
    },
  });

  const updatePartner = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<Partner> }) => {
      const { error } = await supabase.from("partners").update(updates).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-partners"] });
      toast.success("Partner updated");
    },
    onError: () => {
      toast.error("Failed to update partner");
    },
  });

  const deletePartner = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("partners").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-partners"] });
      setSelectedPartner(null);
      toast.success("Partner deleted");
    },
    onError: () => {
      toast.error("Failed to delete partner");
    },
  });

  const handleApprove = (partner: Partner) => {
    updatePartner.mutate({ id: partner.id, updates: { is_approved: true } });
  };

  const handleReject = (partner: Partner) => {
    updatePartner.mutate({ id: partner.id, updates: { is_approved: false } });
  };

  const handleMoveUp = (partner: Partner) => {
    const newOrder = Math.max(0, partner.display_order - 1);
    updatePartner.mutate({ id: partner.id, updates: { display_order: newOrder } });
  };

  const handleMoveDown = (partner: Partner) => {
    updatePartner.mutate({ id: partner.id, updates: { display_order: partner.display_order + 1 } });
  };

  const filteredPartners = partners?.filter((p) => {
    const matchesSearch =
      p.company_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.contact_email?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus =
      statusFilter === "all" ||
      (statusFilter === "pending" && !p.is_approved) ||
      (statusFilter === "approved" && p.is_approved);
    return matchesSearch && matchesStatus;
  });

  const pendingCount = partners?.filter((p) => !p.is_approved).length || 0;
  const approvedCount = partners?.filter((p) => p.is_approved).length || 0;

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Building2 className="h-6 w-6" />
            Partner Management
          </h1>
          <p className="text-muted-foreground">
            {pendingCount > 0 && (
              <span className="text-yellow-600 font-medium">{pendingCount} pending • </span>
            )}
            Manage partner registrations and display order
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-yellow-600">{pendingCount}</div>
              <div className="text-sm text-muted-foreground">Pending Approval</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-green-600">{approvedCount}</div>
              <div className="text-sm text-muted-foreground">Approved Partners</div>
            </CardContent>
          </Card>
          <Card className="col-span-2 md:col-span-1">
            <CardContent className="p-4">
              <div className="text-2xl font-bold">{partners?.length || 0}</div>
              <div className="text-sm text-muted-foreground">Total Registrations</div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search by name or email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
          <div className="flex gap-2">
            <Button
              variant={statusFilter === "all" ? "default" : "outline"}
              size="sm"
              onClick={() => setStatusFilter("all")}
            >
              All
            </Button>
            <Button
              variant={statusFilter === "pending" ? "default" : "outline"}
              size="sm"
              onClick={() => setStatusFilter("pending")}
            >
              <Clock className="w-4 h-4 mr-1" />
              Pending
            </Button>
            <Button
              variant={statusFilter === "approved" ? "default" : "outline"}
              size="sm"
              onClick={() => setStatusFilter("approved")}
            >
              <Check className="w-4 h-4 mr-1" />
              Approved
            </Button>
          </div>
        </div>

        {/* Table */}
        {isLoading ? (
          <div className="space-y-2">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-16" />
            ))}
          </div>
        ) : filteredPartners?.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center text-muted-foreground">
              <Building2 className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>No partners found</p>
            </CardContent>
          </Card>
        ) : (
          <div className="border rounded-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[60px]">Logo</TableHead>
                  <TableHead>Company</TableHead>
                  <TableHead className="hidden md:table-cell">Type</TableHead>
                  <TableHead className="hidden lg:table-cell">Contact</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-[180px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredPartners?.map((partner) => (
                  <TableRow key={partner.id}>
                    <TableCell>
                      {partner.logo_url ? (
                        <img
                          src={partner.logo_url}
                          alt={partner.company_name}
                          className="w-10 h-10 object-contain rounded"
                        />
                      ) : (
                        <div className="w-10 h-10 bg-muted rounded flex items-center justify-center">
                          <Building2 className="w-5 h-5 text-muted-foreground" />
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="font-medium">{partner.company_name}</div>
                      <div className="text-xs text-muted-foreground">
                        {formatDistanceToNow(new Date(partner.created_at), { addSuffix: true })}
                      </div>
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      <Badge variant="outline" className="capitalize">
                        {partner.partner_type}
                      </Badge>
                    </TableCell>
                    <TableCell className="hidden lg:table-cell">
                      <div className="text-sm">{partner.contact_email}</div>
                    </TableCell>
                    <TableCell>
                      {partner.is_approved ? (
                        <Badge className="bg-green-100 text-green-800">
                          <Check className="w-3 h-3 mr-1" />
                          Approved
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="bg-yellow-100 text-yellow-800">
                          <Clock className="w-3 h-3 mr-1" />
                          Pending
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => setSelectedPartner(partner)}
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                        {partner.is_approved ? (
                          <>
                            <Button
                              size="icon"
                              variant="ghost"
                              onClick={() => handleMoveUp(partner)}
                            >
                              <ArrowUp className="w-4 h-4" />
                            </Button>
                            <Button
                              size="icon"
                              variant="ghost"
                              onClick={() => handleMoveDown(partner)}
                            >
                              <ArrowDown className="w-4 h-4" />
                            </Button>
                          </>
                        ) : (
                          <>
                            <Button
                              size="icon"
                              variant="ghost"
                              className="text-green-600"
                              onClick={() => handleApprove(partner)}
                            >
                              <Check className="w-4 h-4" />
                            </Button>
                            <Button
                              size="icon"
                              variant="ghost"
                              className="text-destructive"
                              onClick={() => deletePartner.mutate(partner.id)}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>

      {/* Detail Dialog */}
      <Dialog open={!!selectedPartner} onOpenChange={() => setSelectedPartner(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Partner Details</DialogTitle>
          </DialogHeader>
          {selectedPartner && (
            <div className="space-y-4">
              {selectedPartner.logo_url && (
                <div className="flex justify-center">
                  <img
                    src={selectedPartner.logo_url}
                    alt={selectedPartner.company_name}
                    className="h-16 max-w-[200px] object-contain"
                  />
                </div>
              )}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Company</p>
                  <p className="font-medium">{selectedPartner.company_name}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Type</p>
                  <Badge variant="outline" className="capitalize">
                    {selectedPartner.partner_type}
                  </Badge>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Email</p>
                  <p className="font-medium">{selectedPartner.contact_email || "-"}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Phone</p>
                  <p className="font-medium">{selectedPartner.contact_phone || "-"}</p>
                </div>
              </div>
              {selectedPartner.website_url && (
                <div>
                  <p className="text-sm text-muted-foreground">Website</p>
                  <a
                    href={selectedPartner.website_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary flex items-center gap-1"
                  >
                    {selectedPartner.website_url}
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              )}
              {selectedPartner.description && (
                <div>
                  <p className="text-sm text-muted-foreground">Description</p>
                  <p className="bg-muted p-3 rounded-md text-sm">{selectedPartner.description}</p>
                </div>
              )}
              <div>
                <p className="text-sm text-muted-foreground">Display Order</p>
                <Input
                  type="number"
                  value={selectedPartner.display_order}
                  onChange={(e) => {
                    const newOrder = parseInt(e.target.value) || 0;
                    updatePartner.mutate({
                      id: selectedPartner.id,
                      updates: { display_order: newOrder },
                    });
                    setSelectedPartner({ ...selectedPartner, display_order: newOrder });
                  }}
                  className="w-24"
                />
              </div>
            </div>
          )}
          <DialogFooter className="gap-2">
            <Button
              variant="destructive"
              onClick={() => {
                if (selectedPartner) {
                  deletePartner.mutate(selectedPartner.id);
                }
              }}
            >
              <Trash2 className="w-4 h-4 mr-1" />
              Delete
            </Button>
            {selectedPartner && !selectedPartner.is_approved && (
              <Button
                onClick={() => {
                  handleApprove(selectedPartner);
                  setSelectedPartner(null);
                }}
              >
                <Check className="w-4 h-4 mr-1" />
                Approve
              </Button>
            )}
            {selectedPartner && selectedPartner.is_approved && (
              <Button
                variant="outline"
                onClick={() => {
                  handleReject(selectedPartner);
                  setSelectedPartner(null);
                }}
              >
                <X className="w-4 h-4 mr-1" />
                Unapprove
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
};

export default AdminPartners;
