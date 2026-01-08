import { useState, useEffect } from "react";
import AdminLayout from "@/components/admin/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Search, ShoppingCart, Loader2, Eye, User, Phone, Building2, Calendar, Clock, Download, Printer } from "lucide-react";
import { format } from "date-fns";
import { generateBookingPDF } from "@/utils/generateBookingPDF";

interface PatientProfile {
  full_name: string | null;
  phone: string | null;
}

interface LabInfo {
  name: string;
}

interface OrderTest {
  test_id: string;
  test_name: string;
  price: number;
  discounted_price?: number;
}

interface Order {
  id: string;
  unique_id: string;
  user_id: string;
  lab_id: string;
  tests: OrderTest[];
  original_total: number;
  discount_percentage: number | null;
  discounted_total: number;
  status: string;
  validity_date: string;
  notes: string | null;
  created_at: string;
  profiles?: PatientProfile | null;
  labs?: LabInfo | null;
}

const statusColors: Record<string, string> = {
  pending: "bg-yellow-500/10 text-yellow-600 border-yellow-500/20",
  confirmed: "bg-blue-500/10 text-blue-600 border-blue-500/20",
  completed: "bg-green-500/10 text-green-600 border-green-500/20",
  cancelled: "bg-red-500/10 text-red-600 border-red-500/20"
};

const AdminOrders = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [isUpdating, setIsUpdating] = useState<string | null>(null);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      // Fetch orders with labs
      const { data: ordersData, error: ordersError } = await supabase
        .from("orders")
        .select(`
          *,
          labs:lab_id (
            name
          )
        `)
        .order("created_at", { ascending: false });

      if (ordersError) throw ordersError;

      // Get unique user_ids to fetch profiles
      const userIds = [...new Set((ordersData || []).map(o => o.user_id))];
      
      // Fetch profiles separately
      const { data: profilesData } = await supabase
        .from("profiles")
        .select("user_id, full_name, phone")
        .in("user_id", userIds);

      // Create a map of user_id to profile
      const profilesMap = new Map(
        (profilesData || []).map(p => [p.user_id, p])
      );

      // Attach profiles to orders
      const ordersWithProfiles = (ordersData || []).map(order => ({
        ...order,
        tests: Array.isArray(order.tests) ? order.tests as unknown as OrderTest[] : [],
        profiles: profilesMap.get(order.user_id) || null,
      }));

      setOrders(ordersWithProfiles);
    } catch (error) {
      console.error("Error fetching orders:", error);
      toast.error("Failed to fetch orders");
    } finally {
      setIsLoading(false);
    }
  };

  const handleStatusChange = async (orderId: string, newStatus: string) => {
    setIsUpdating(orderId);

    try {
      const { error } = await supabase
        .from("orders")
        .update({ status: newStatus as any })
        .eq("id", orderId);

      if (error) throw error;
      toast.success("Order status updated");
      fetchOrders();
    } catch (error) {
      console.error("Error updating order:", error);
      toast.error("Failed to update order status");
    } finally {
      setIsUpdating(null);
    }
  };

  const handleViewOrder = (order: Order) => {
    setSelectedOrder(order);
    setIsDialogOpen(true);
  };

  const filteredOrders = orders.filter(order => {
    const patientName = order.profiles?.full_name?.toLowerCase() || '';
    const patientPhone = order.profiles?.phone?.toLowerCase() || '';
    const searchLower = searchQuery.toLowerCase();
    const matchesSearch = order.unique_id.toLowerCase().includes(searchLower) || 
                          patientName.includes(searchLower) ||
                          patientPhone.includes(searchLower);
    const matchesStatus = statusFilter === "all" || order.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // Calculate stats for business growth
  const totalOrders = orders.length;
  const confirmedOrders = orders.filter(o => o.status === 'confirmed' || o.status === 'completed').length;
  const totalRevenue = orders.filter(o => o.status === 'confirmed' || o.status === 'completed')
    .reduce((sum, o) => sum + o.discounted_total, 0);
  const totalSavings = orders.filter(o => o.status === 'confirmed' || o.status === 'completed')
    .reduce((sum, o) => sum + (o.original_total - o.discounted_total), 0);

  return (
    <AdminLayout>
      <div className="p-6 lg:p-8">
        <div className="mb-6">
          <h1 className="text-2xl lg:text-3xl font-bold">Orders</h1>
          <p className="text-muted-foreground mt-1">
            Manage and track customer orders - Business Growth Dashboard
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardContent className="p-4">
              <p className="text-sm text-muted-foreground">Total Orders</p>
              <p className="text-2xl font-bold">{totalOrders}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-sm text-muted-foreground">Availed Discounts</p>
              <p className="text-2xl font-bold text-green-600">{confirmedOrders}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-sm text-muted-foreground">Total Revenue</p>
              <p className="text-2xl font-bold text-primary">Rs. {totalRevenue.toLocaleString()}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-sm text-muted-foreground">Customer Savings</p>
              <p className="text-2xl font-bold text-green-600">Rs. {totalSavings.toLocaleString()}</p>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card className="mb-6">
          <CardContent className="p-4">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search by order ID, patient name, or phone..."
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
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="confirmed">Confirmed (Availed)</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Orders Table */}
        <Card>
          <CardContent className="p-0">
            {isLoading ? (
              <div className="flex items-center justify-center p-8">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
              </div>
            ) : filteredOrders.length === 0 ? (
              <div className="flex flex-col items-center justify-center p-8 text-center">
                <ShoppingCart className="w-12 h-12 text-muted-foreground mb-4" />
                <p className="text-muted-foreground">No orders found</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Order ID</TableHead>
                      <TableHead>Patient</TableHead>
                      <TableHead>Lab</TableHead>
                      <TableHead>Tests</TableHead>
                      <TableHead>Total</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredOrders.map((order) => (
                      <TableRow key={order.id}>
                        <TableCell>
                          <span className="font-mono font-medium text-sm">{order.unique_id}</span>
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            <div className="flex items-center gap-1.5">
                              <User className="w-3.5 h-3.5 text-muted-foreground" />
                              <span className="font-medium text-sm">
                                {order.profiles?.full_name || 'Unknown'}
                              </span>
                            </div>
                            {order.profiles?.phone && (
                              <div className="flex items-center gap-1.5">
                                <Phone className="w-3.5 h-3.5 text-muted-foreground" />
                                <span className="text-xs text-muted-foreground">
                                  {order.profiles.phone}
                                </span>
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className="text-sm">{order.labs?.name || 'N/A'}</span>
                        </TableCell>
                        <TableCell>
                          <span className="text-sm">
                            {order.tests.length} tests
                          </span>
                        </TableCell>
                        <TableCell>
                          <div>
                            <p className="font-medium">Rs. {order.discounted_total.toLocaleString()}</p>
                            {order.discount_percentage && order.discount_percentage > 0 && (
                              <p className="text-xs text-muted-foreground line-through">
                                Rs. {order.original_total.toLocaleString()}
                              </p>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Select
                            value={order.status}
                            onValueChange={(value) => handleStatusChange(order.id, value)}
                            disabled={isUpdating === order.id}
                          >
                            <SelectTrigger className={`w-[130px] border ${statusColors[order.status] || ""}`}>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="pending">Pending</SelectItem>
                              <SelectItem value="confirmed">Confirmed</SelectItem>
                              <SelectItem value="completed">Completed</SelectItem>
                              <SelectItem value="cancelled">Cancelled</SelectItem>
                            </SelectContent>
                          </Select>
                        </TableCell>
                        <TableCell>
                          {format(new Date(order.created_at), "dd MMM yyyy")}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button variant="ghost" size="icon" onClick={() => handleViewOrder(order)}>
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

        {/* View Order Dialog */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Order Details</DialogTitle>
            </DialogHeader>

            {selectedOrder && (
              <div className="space-y-6 mt-4">
                {/* Order Header */}
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Order ID</p>
                    <p className="font-mono font-bold text-lg">{selectedOrder.unique_id}</p>
                  </div>
                  <Badge className={statusColors[selectedOrder.status] || ""}>
                    {selectedOrder.status.charAt(0).toUpperCase() + selectedOrder.status.slice(1)}
                  </Badge>
                </div>

                {/* Patient Info */}
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                        <User className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <p className="font-semibold">{selectedOrder.profiles?.full_name || "Unknown"}</p>
                        {selectedOrder.profiles?.phone && (
                          <p className="text-sm text-muted-foreground flex items-center gap-1">
                            <Phone className="w-3 h-3" />
                            {selectedOrder.profiles.phone}
                          </p>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Lab Info */}
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                        <Building2 className="w-6 h-6 text-primary" />
                      </div>
                      <div>
                        <p className="font-semibold">{selectedOrder.labs?.name || "Unknown Lab"}</p>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {format(new Date(selectedOrder.created_at), "dd MMM yyyy")}
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            Valid till {format(new Date(selectedOrder.validity_date), "dd MMM yyyy")}
                          </span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Tests */}
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base">Tests Booked</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {selectedOrder.tests.map((test, index) => (
                        <div key={index} className="flex justify-between py-2 border-b last:border-0">
                          <span>{test.test_name}</span>
                          <div className="text-right">
                            {test.discounted_price && test.discounted_price < test.price ? (
                              <>
                                <span className="font-medium">Rs. {test.discounted_price}</span>
                                <span className="text-xs text-muted-foreground line-through ml-2">Rs. {test.price}</span>
                              </>
                            ) : (
                              <span className="font-medium">Rs. {test.price}</span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="border-t mt-4 pt-4 space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Subtotal</span>
                        <span>Rs. {selectedOrder.original_total.toLocaleString()}</span>
                      </div>
                      {selectedOrder.discount_percentage && selectedOrder.discount_percentage > 0 && (
                        <div className="flex justify-between text-sm text-green-600">
                          <span>Discount ({selectedOrder.discount_percentage}%)</span>
                          <span>-Rs. {(selectedOrder.original_total - selectedOrder.discounted_total).toLocaleString()}</span>
                        </div>
                      )}
                      <div className="flex justify-between font-bold text-lg border-t pt-2">
                        <span>Total</span>
                        <span>Rs. {selectedOrder.discounted_total.toLocaleString()}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* PDF/Print Actions */}
                <div className="flex gap-3">
                  <Button 
                    className="flex-1" 
                    onClick={() => {
                      generateBookingPDF({
                        uniqueId: selectedOrder.unique_id,
                        labName: selectedOrder.labs?.name || 'Lab',
                        patientName: selectedOrder.profiles?.full_name || undefined,
                        patientPhone: selectedOrder.profiles?.phone || undefined,
                        tests: selectedOrder.tests.map(t => ({
                          name: t.test_name,
                          originalPrice: t.price,
                          discountedPrice: t.discounted_price || t.price
                        })),
                        totalOriginal: selectedOrder.original_total,
                        totalDiscounted: selectedOrder.discounted_total,
                        totalSavings: selectedOrder.original_total - selectedOrder.discounted_total,
                        discountPercentage: selectedOrder.discount_percentage || 0,
                        bookingDate: format(new Date(selectedOrder.created_at), 'dd/MM/yyyy'),
                      });
                    }}
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Download PDF
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={() => window.print()}
                  >
                    <Printer className="w-4 h-4 mr-2" />
                    Print
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

export default AdminOrders;
