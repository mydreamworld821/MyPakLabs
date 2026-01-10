import { useState, useEffect } from "react";
import AdminLayout from "@/components/admin/AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
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
  Store, 
  Eye,
  CheckCircle,
  XCircle,
  AlertCircle,
  Loader2,
  Phone,
  MapPin,
  Clock,
  Star,
  Truck
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

interface MedicalStore {
  id: string;
  user_id: string | null;
  name: string;
  owner_name: string;
  license_number: string;
  cnic: string | null;
  phone: string;
  email: string | null;
  city: string;
  area: string;
  full_address: string;
  location_lat: number | null;
  location_lng: number | null;
  logo_url: string | null;
  cover_image_url: string | null;
  delivery_available: boolean;
  is_24_hours: boolean;
  opening_time: string;
  closing_time: string;
  is_featured: boolean;
  featured_order: number;
  rating: number;
  review_count: number;
  status: string;
  admin_notes: string | null;
  is_active: boolean;
  created_at: string;
}

const AdminMedicalStores = () => {
  const { user } = useAuth();
  const [stores, setStores] = useState<MedicalStore[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedStore, setSelectedStore] = useState<MedicalStore | null>(null);
  const [showDialog, setShowDialog] = useState(false);
  const [adminNotes, setAdminNotes] = useState("");
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    fetchStores();
  }, [statusFilter]);

  const fetchStores = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from("medical_stores")
        .select("*")
        .order("created_at", { ascending: false });

      if (statusFilter !== "all") {
        query = query.eq("status", statusFilter);
      }

      const { data, error } = await query;
      if (error) throw error;
      setStores(data || []);
    } catch (error) {
      console.error("Error fetching stores:", error);
      toast.error("Failed to load medical stores");
    } finally {
      setLoading(false);
    }
  };

  const handleViewStore = (store: MedicalStore) => {
    setSelectedStore(store);
    setAdminNotes(store.admin_notes || "");
    setShowDialog(true);
  };

  const handleUpdateStatus = async (status: string) => {
    if (!selectedStore || !user) return;

    setUpdating(true);
    try {
      const updateData: any = {
        status,
        admin_notes: adminNotes,
        reviewed_by: user.id,
        reviewed_at: new Date().toISOString(),
      };

      // If approving, also assign pharmacy role to the user
      if (status === "approved" && selectedStore.user_id) {
        const { error: roleError } = await supabase
          .from("user_roles")
          .upsert({
            user_id: selectedStore.user_id,
            role: "pharmacy"
          }, { onConflict: "user_id,role" });

        if (roleError) console.error("Failed to assign pharmacy role:", roleError);
      }

      const { error } = await supabase
        .from("medical_stores")
        .update(updateData)
        .eq("id", selectedStore.id);

      if (error) throw error;

      toast.success(`Store ${status === "approved" ? "approved" : status === "rejected" ? "rejected" : "updated"} successfully`);
      setShowDialog(false);
      fetchStores();
    } catch (error: any) {
      toast.error(error.message || "Failed to update store status");
    } finally {
      setUpdating(false);
    }
  };

  const handleToggleFeatured = async (store: MedicalStore) => {
    try {
      const { error } = await supabase
        .from("medical_stores")
        .update({ is_featured: !store.is_featured })
        .eq("id", store.id);

      if (error) throw error;
      toast.success(store.is_featured ? "Removed from featured" : "Added to featured");
      fetchStores();
    } catch (error: any) {
      toast.error(error.message || "Failed to update featured status");
    }
  };

  const handleToggleActive = async (store: MedicalStore) => {
    try {
      const { error } = await supabase
        .from("medical_stores")
        .update({ is_active: !store.is_active })
        .eq("id", store.id);

      if (error) throw error;
      toast.success(store.is_active ? "Store disabled" : "Store enabled");
      fetchStores();
    } catch (error: any) {
      toast.error(error.message || "Failed to update store status");
    }
  };

  const filteredStores = stores.filter(store =>
    store.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    store.city?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    store.phone?.includes(searchQuery) ||
    store.license_number?.toLowerCase().includes(searchQuery.toLowerCase())
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
    all: stores.length,
    pending: stores.filter(s => s.status === "pending").length,
    approved: stores.filter(s => s.status === "approved").length,
    rejected: stores.filter(s => s.status === "rejected").length,
    suspended: stores.filter(s => s.status === "suspended").length,
  };

  return (
    <AdminLayout>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Store className="w-5 h-5 text-emerald-600" />
            <h1 className="text-lg font-bold">Medical Store Management</h1>
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
              className={`cursor-pointer transition-colors ${statusFilter === stat.key ? "border-emerald-500" : ""}`}
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
              placeholder="Search by name, city, phone, or license..."
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
            ) : filteredStores.length === 0 ? (
              <div className="text-center py-12">
                <Store className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
                <p className="text-sm text-muted-foreground">No medical stores found</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-xs">Store</TableHead>
                    <TableHead className="text-xs">Location</TableHead>
                    <TableHead className="text-xs">License</TableHead>
                    <TableHead className="text-xs">Delivery</TableHead>
                    <TableHead className="text-xs">Status</TableHead>
                    <TableHead className="text-xs">Featured</TableHead>
                    <TableHead className="text-xs">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredStores.map((store) => (
                    <TableRow key={store.id} className={!store.is_active ? "opacity-50" : ""}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center overflow-hidden">
                            {store.logo_url ? (
                              <img src={store.logo_url} alt="" className="w-full h-full object-cover" />
                            ) : (
                              <Store className="w-4 h-4 text-emerald-600" />
                            )}
                          </div>
                          <div>
                            <p className="text-xs font-medium">{store.name}</p>
                            <p className="text-[10px] text-muted-foreground">{store.phone}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-xs">
                        <div>
                          <p>{store.city}</p>
                          <p className="text-[10px] text-muted-foreground">{store.area}</p>
                        </div>
                      </TableCell>
                      <TableCell className="text-xs">{store.license_number}</TableCell>
                      <TableCell>
                        {store.delivery_available ? (
                          <Badge variant="outline" className="text-[10px] bg-blue-50">
                            <Truck className="w-3 h-3 mr-1" />
                            Yes
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-[10px]">No</Badge>
                        )}
                      </TableCell>
                      <TableCell>{getStatusBadge(store.status)}</TableCell>
                      <TableCell>
                        <Button
                          variant={store.is_featured ? "default" : "outline"}
                          size="sm"
                          className="h-6 text-[10px]"
                          onClick={() => handleToggleFeatured(store)}
                        >
                          {store.is_featured ? <Star className="w-3 h-3 fill-current" /> : <Star className="w-3 h-3" />}
                        </Button>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-7 text-xs"
                            onClick={() => handleViewStore(store)}
                          >
                            <Eye className="w-3 h-3 mr-1" />
                            Review
                          </Button>
                          <Button
                            variant={store.is_active ? "destructive" : "default"}
                            size="sm"
                            className="h-7 text-xs"
                            onClick={() => handleToggleActive(store)}
                          >
                            {store.is_active ? "Disable" : "Enable"}
                          </Button>
                        </div>
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
              <DialogTitle className="text-sm">Review Medical Store Application</DialogTitle>
            </DialogHeader>
            
            {selectedStore && (
              <div className="space-y-4">
                {/* Store Info */}
                <div className="flex items-start gap-4">
                  <div className="w-16 h-16 rounded-lg bg-emerald-100 flex items-center justify-center overflow-hidden">
                    {selectedStore.logo_url ? (
                      <img src={selectedStore.logo_url} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <Store className="w-6 h-6 text-emerald-600" />
                    )}
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold">{selectedStore.name}</h3>
                    <p className="text-xs text-muted-foreground">Owner: {selectedStore.owner_name}</p>
                    <div className="flex flex-wrap gap-2 mt-2">
                      <Badge variant="outline" className="text-[10px]">
                        <Phone className="w-3 h-3 mr-1" />
                        {selectedStore.phone}
                      </Badge>
                      <Badge variant="outline" className="text-[10px]">
                        <MapPin className="w-3 h-3 mr-1" />
                        {selectedStore.city}, {selectedStore.area}
                      </Badge>
                    </div>
                  </div>
                  {getStatusBadge(selectedStore.status)}
                </div>

                {/* Details Grid */}
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div className="p-2 bg-muted rounded">
                    <p className="text-muted-foreground">License Number</p>
                    <p className="font-medium">{selectedStore.license_number}</p>
                  </div>
                  {selectedStore.cnic && (
                    <div className="p-2 bg-muted rounded">
                      <p className="text-muted-foreground">CNIC</p>
                      <p className="font-medium">{selectedStore.cnic}</p>
                    </div>
                  )}
                  <div className="p-2 bg-muted rounded">
                    <p className="text-muted-foreground">Timing</p>
                    <p className="font-medium flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {selectedStore.is_24_hours ? "24/7" : `${selectedStore.opening_time} - ${selectedStore.closing_time}`}
                    </p>
                  </div>
                  <div className="p-2 bg-muted rounded">
                    <p className="text-muted-foreground">Delivery</p>
                    <p className="font-medium flex items-center gap-1">
                      <Truck className="w-3 h-3" />
                      {selectedStore.delivery_available ? "Available" : "Not Available"}
                    </p>
                  </div>
                </div>

                {/* Address */}
                <div className="p-2 bg-muted rounded text-xs">
                  <p className="text-muted-foreground">Full Address</p>
                  <p className="font-medium">{selectedStore.full_address}</p>
                  {selectedStore.location_lat && selectedStore.location_lng && (
                    <a 
                      href={`https://www.google.com/maps?q=${selectedStore.location_lat},${selectedStore.location_lng}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary text-[10px] underline mt-1 inline-block"
                    >
                      View on Google Maps
                    </a>
                  )}
                </div>

                {/* Store Image */}
                {selectedStore.cover_image_url && (
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Store Image</p>
                    <img 
                      src={selectedStore.cover_image_url} 
                      alt="Store" 
                      className="w-full h-32 object-cover rounded-lg"
                    />
                  </div>
                )}

                {/* Admin Notes */}
                <div>
                  <p className="text-xs font-semibold mb-2">Admin Notes</p>
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
                  {selectedStore.status === "pending" && (
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
                  {selectedStore.status === "approved" && (
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
                  {selectedStore.status === "suspended" && (
                    <Button
                      onClick={() => handleUpdateStatus("approved")}
                      disabled={updating}
                      className="flex-1 bg-green-600 hover:bg-green-700"
                    >
                      {updating ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : <CheckCircle className="w-4 h-4 mr-1" />}
                      Reactivate
                    </Button>
                  )}
                  {selectedStore.status === "rejected" && (
                    <Button
                      onClick={() => handleUpdateStatus("approved")}
                      disabled={updating}
                      className="flex-1 bg-green-600 hover:bg-green-700"
                    >
                      {updating ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : <CheckCircle className="w-4 h-4 mr-1" />}
                      Approve
                    </Button>
                  )}
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
};

export default AdminMedicalStores;