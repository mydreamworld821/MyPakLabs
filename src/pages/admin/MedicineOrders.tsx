import { useState, useEffect } from "react";
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
  Clock,
  Store,
  User,
  Phone,
  MapPin,
  CheckCircle,
  XCircle,
  Filter,
  Pill,
  FileText,
  Truck,
  Package,
  ExternalLink,
} from "lucide-react";

interface Medicine {
  name: string;
  quantity: number;
  notes?: string;
}

interface MedicineOrder {
  id: string;
  unique_id: string;
  user_id: string;
  store_id: string;
  prescription_url: string | null;
  medicines: Medicine[];
  delivery_address: string;
  notes: string | null;
  status: string;
  estimated_price: number | null;
  final_price: number | null;
  pharmacy_notes: string | null;
  created_at: string;
  pharmacy_confirmed_at: string | null;
  prepared_at: string | null;
  dispatched_at: string | null;
  user_confirmed_at: string | null;
  cancelled_at: string | null;
  medical_stores: {
    id: string;
    name: string;
    logo_url: string | null;
    phone: string;
    city: string;
    area: string;
  } | null;
}

const statusConfig: Record<string, { color: string; label: string; icon: any }> = {
  pending: { color: "bg-yellow-500/10 text-yellow-600 border-yellow-500/20", label: "Pending", icon: Clock },
  accepted: { color: "bg-blue-500/10 text-blue-600 border-blue-500/20", label: "Accepted", icon: CheckCircle },
  preparing: { color: "bg-indigo-500/10 text-indigo-600 border-indigo-500/20", label: "Preparing", icon: Package },
  out_for_delivery: { color: "bg-purple-500/10 text-purple-600 border-purple-500/20", label: "Out for Delivery", icon: Truck },
  delivered: { color: "bg-green-500/10 text-green-600 border-green-500/20", label: "Delivered", icon: CheckCircle },
  cancelled: { color: "bg-red-500/10 text-red-600 border-red-500/20", label: "Cancelled", icon: XCircle },
  rejected: { color: "bg-red-500/10 text-red-600 border-red-500/20", label: "Rejected", icon: XCircle },
};

const AdminMedicineOrders = () => {
  const [orders, setOrders] = useState<MedicineOrder[]>([]);
  const [filteredOrders, setFilteredOrders] = useState<MedicineOrder[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedOrder, setSelectedOrder] = useState<MedicineOrder | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    fetchOrders();
  }, []);

  useEffect(() => {
    filterOrders();
  }, [orders, searchQuery, statusFilter]);

  const fetchOrders = async () => {
    try {
      const { data, error } = await supabase
        .from("medicine_orders")
        .select(`
          *,
          medical_stores:store_id (
            id,
            name,
            logo_url,
            phone,
            city,
            area
          )
        `)
        .order("created_at", { ascending: false });

      if (error) throw error;
      
      const parsedOrders = (data || []).map(order => ({
        ...order,
        medicines: Array.isArray(order.medicines) ? order.medicines as unknown as Medicine[] : []
      }));
      
      setOrders(parsedOrders);
    } catch (error) {
      console.error("Error fetching orders:", error);
      toast.error("Failed to fetch orders");
    } finally {
      setIsLoading(false);
    }
  };

  const filterOrders = () => {
    let filtered = [...orders];

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (order) =>
          order.unique_id?.toLowerCase().includes(query) ||
          order.medical_stores?.name?.toLowerCase().includes(query) ||
          order.delivery_address?.toLowerCase().includes(query)
      );
    }

    if (statusFilter !== "all") {
      filtered = filtered.filter((order) => order.status === statusFilter);
    }

    setFilteredOrders(filtered);
  };

  const handleUpdateStatus = async (id: string, newStatus: string) => {
    setIsUpdating(true);
    try {
      const updateData: Record<string, any> = { status: newStatus };
      
      if (newStatus === 'accepted') {
        updateData.pharmacy_confirmed_at = new Date().toISOString();
      } else if (newStatus === 'preparing') {
        updateData.prepared_at = new Date().toISOString();
      } else if (newStatus === 'out_for_delivery') {
        updateData.dispatched_at = new Date().toISOString();
      } else if (newStatus === 'delivered') {
        updateData.user_confirmed_at = new Date().toISOString();
      } else if (newStatus === 'cancelled' || newStatus === 'rejected') {
        updateData.cancelled_at = new Date().toISOString();
      }

      const { error } = await supabase
        .from("medicine_orders")
        .update(updateData)
        .eq("id", id);

      if (error) throw error;

      toast.success(`Order ${newStatus.replace('_', ' ')}`);
      fetchOrders();
      setIsDialogOpen(false);
    } catch (error) {
      console.error("Error updating order:", error);
      toast.error("Failed to update order");
    } finally {
      setIsUpdating(false);
    }
  };

  const stats = {
    total: orders.length,
    pending: orders.filter((o) => o.status === "pending").length,
    accepted: orders.filter((o) => o.status === "accepted").length,
    preparing: orders.filter((o) => o.status === "preparing").length,
    out_for_delivery: orders.filter((o) => o.status === "out_for_delivery").length,
    delivered: orders.filter((o) => o.status === "delivered").length,
    cancelled: orders.filter((o) => o.status === "cancelled" || o.status === "rejected").length,
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
          <h1 className="text-2xl font-bold">Medicine Orders</h1>
          <p className="text-muted-foreground">Manage all pharmacy medicine orders</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="text-center">
                <p className="text-2xl font-bold">{stats.total}</p>
                <p className="text-xs text-muted-foreground">Total</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-center">
                <p className="text-2xl font-bold text-yellow-600">{stats.pending}</p>
                <p className="text-xs text-muted-foreground">Pending</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-center">
                <p className="text-2xl font-bold text-blue-600">{stats.accepted}</p>
                <p className="text-xs text-muted-foreground">Accepted</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-center">
                <p className="text-2xl font-bold text-indigo-600">{stats.preparing}</p>
                <p className="text-xs text-muted-foreground">Preparing</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-center">
                <p className="text-2xl font-bold text-purple-600">{stats.out_for_delivery}</p>
                <p className="text-xs text-muted-foreground">Delivering</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-center">
                <p className="text-2xl font-bold text-green-600">{stats.delivered}</p>
                <p className="text-xs text-muted-foreground">Delivered</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-center">
                <p className="text-2xl font-bold text-red-600">{stats.cancelled}</p>
                <p className="text-xs text-muted-foreground">Cancelled</p>
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
                  placeholder="Search by order ID, pharmacy, or customer..."
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
                  <SelectItem value="accepted">Accepted</SelectItem>
                  <SelectItem value="preparing">Preparing</SelectItem>
                  <SelectItem value="out_for_delivery">Out for Delivery</SelectItem>
                  <SelectItem value="delivered">Delivered</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Orders Table */}
        <Card>
          <CardHeader>
            <CardTitle>Orders ({filteredOrders.length})</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Order ID</TableHead>
                    <TableHead>Delivery Address</TableHead>
                    <TableHead>Pharmacy</TableHead>
                    <TableHead>Items</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredOrders.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                        No orders found
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredOrders.map((order) => {
                      const config = statusConfig[order.status] || statusConfig.pending;
                      const StatusIcon = config.icon;
                      return (
                        <TableRow key={order.id}>
                          <TableCell>
                            <span className="font-mono font-medium text-sm">{order.unique_id}</span>
                          </TableCell>
                          <TableCell>
                            <div>
                              <p className="font-medium text-xs truncate max-w-[150px]">{order.delivery_address}</p>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              {order.medical_stores?.logo_url ? (
                                <img src={order.medical_stores.logo_url} alt="" className="w-8 h-8 rounded object-cover" />
                              ) : (
                                <div className="w-8 h-8 rounded bg-emerald-100 flex items-center justify-center">
                                  <Store className="w-4 h-4 text-emerald-600" />
                                </div>
                              )}
                              <div>
                                <p className="font-medium">{order.medical_stores?.name}</p>
                                <p className="text-xs text-muted-foreground">{order.medical_stores?.area}</p>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            {order.prescription_url ? (
                              <Badge variant="outline" className="gap-1">
                                <FileText className="w-3 h-3" />
                                Prescription
                              </Badge>
                            ) : (
                              <span className="text-sm">{order.medicines.length} medicine(s)</span>
                            )}
                          </TableCell>
                          <TableCell>
                            <Badge className={config.color}>
                              <StatusIcon className="w-3 h-3 mr-1" />
                              {config.label}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <span className="text-sm">{format(new Date(order.created_at), "dd MMM yyyy")}</span>
                          </TableCell>
                          <TableCell className="text-right">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => {
                                setSelectedOrder(order);
                                setIsDialogOpen(true);
                              }}
                            >
                              <Eye className="w-4 h-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Order Detail Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Order Details - {selectedOrder?.unique_id}</DialogTitle>
          </DialogHeader>

          {selectedOrder && (
            <div className="space-y-6 mt-4">
              {/* Status */}
              <div className="flex items-center justify-between">
                <Badge className={statusConfig[selectedOrder.status]?.color || ""}>
                  {statusConfig[selectedOrder.status]?.label || selectedOrder.status}
                </Badge>
                <span className="text-sm text-muted-foreground">
                  {format(new Date(selectedOrder.created_at), "dd MMM yyyy, hh:mm a")}
                </span>
              </div>

              {/* Customer Info */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base flex items-center gap-2">
                    <User className="w-4 h-4" />
                    Customer Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="pt-2">
                    <span className="text-muted-foreground block mb-1">Delivery Address</span>
                    <div className="flex items-start gap-2">
                      <MapPin className="w-4 h-4 text-primary mt-0.5" />
                      <span className="text-sm">{selectedOrder.delivery_address}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Pharmacy Info */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Store className="w-4 h-4" />
                    Pharmacy Information
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-4">
                    {selectedOrder.medical_stores?.logo_url ? (
                      <img src={selectedOrder.medical_stores.logo_url} alt="" className="w-16 h-16 rounded-lg object-cover" />
                    ) : (
                      <div className="w-16 h-16 rounded-lg bg-emerald-100 flex items-center justify-center">
                        <Store className="w-8 h-8 text-emerald-600" />
                      </div>
                    )}
                    <div>
                      <p className="font-semibold text-lg">{selectedOrder.medical_stores?.name}</p>
                      <p className="text-muted-foreground">{selectedOrder.medical_stores?.area}, {selectedOrder.medical_stores?.city}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <Phone className="w-3 h-3 text-muted-foreground" />
                        <span className="text-sm">{selectedOrder.medical_stores?.phone}</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Order Details */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Pill className="w-4 h-4" />
                    Order Details
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {selectedOrder.prescription_url && (
                    <div>
                      <p className="text-sm text-muted-foreground mb-2">Prescription</p>
                      <a 
                        href={selectedOrder.prescription_url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 text-primary hover:underline"
                      >
                        <FileText className="w-4 h-4" />
                        View Prescription
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                  )}
                  
                  {selectedOrder.medicines.length > 0 && (
                    <div>
                      <p className="text-sm text-muted-foreground mb-2">Medicines</p>
                      <div className="space-y-2">
                        {selectedOrder.medicines.map((med, idx) => (
                          <div key={idx} className="flex items-center justify-between p-2 bg-muted/50 rounded">
                            <div>
                              <p className="font-medium">{med.name}</p>
                              {med.notes && <p className="text-xs text-muted-foreground">{med.notes}</p>}
                            </div>
                            <Badge variant="secondary">Qty: {med.quantity}</Badge>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {selectedOrder.notes && (
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Customer Notes</p>
                      <p className="text-sm bg-muted/50 p-2 rounded">{selectedOrder.notes}</p>
                    </div>
                  )}

                  {selectedOrder.pharmacy_notes && (
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Pharmacy Notes</p>
                      <p className="text-sm bg-muted/50 p-2 rounded">{selectedOrder.pharmacy_notes}</p>
                    </div>
                  )}

                  {(selectedOrder.estimated_price || selectedOrder.final_price) && (
                    <div className="pt-2 border-t">
                      {selectedOrder.estimated_price && (
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Estimated Price</span>
                          <span>Rs. {selectedOrder.estimated_price.toLocaleString()}</span>
                        </div>
                      )}
                      {selectedOrder.final_price && (
                        <div className="flex justify-between font-medium mt-1">
                          <span>Final Price</span>
                          <span>Rs. {selectedOrder.final_price.toLocaleString()}</span>
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Actions */}
              {!['delivered', 'cancelled', 'rejected'].includes(selectedOrder.status) && (
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base">Update Status</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-2">
                      {selectedOrder.status === 'pending' && (
                        <>
                          <Button 
                            size="sm" 
                            onClick={() => handleUpdateStatus(selectedOrder.id, 'accepted')}
                            disabled={isUpdating}
                          >
                            Accept Order
                          </Button>
                          <Button 
                            size="sm" 
                            variant="destructive"
                            onClick={() => handleUpdateStatus(selectedOrder.id, 'rejected')}
                            disabled={isUpdating}
                          >
                            Reject
                          </Button>
                        </>
                      )}
                      {selectedOrder.status === 'accepted' && (
                        <Button 
                          size="sm" 
                          onClick={() => handleUpdateStatus(selectedOrder.id, 'preparing')}
                          disabled={isUpdating}
                        >
                          Start Preparing
                        </Button>
                      )}
                      {selectedOrder.status === 'preparing' && (
                        <Button 
                          size="sm" 
                          onClick={() => handleUpdateStatus(selectedOrder.id, 'out_for_delivery')}
                          disabled={isUpdating}
                        >
                          Out for Delivery
                        </Button>
                      )}
                      {selectedOrder.status === 'out_for_delivery' && (
                        <Button 
                          size="sm" 
                          onClick={() => handleUpdateStatus(selectedOrder.id, 'delivered')}
                          disabled={isUpdating}
                        >
                          Mark Delivered
                        </Button>
                      )}
                      {!['delivered', 'cancelled', 'rejected'].includes(selectedOrder.status) && (
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => handleUpdateStatus(selectedOrder.id, 'cancelled')}
                          disabled={isUpdating}
                        >
                          Cancel Order
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
};

export default AdminMedicineOrders;
