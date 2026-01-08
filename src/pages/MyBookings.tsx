import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { format } from "date-fns";
import {
  ShoppingCart,
  Loader2,
  Eye,
  ArrowLeft,
  Building2,
  Calendar,
  Clock,
  CheckCircle,
  XCircle,
  Download,
  FileText,
  Printer,
} from "lucide-react";
import { generateBookingPDF } from "@/utils/generateBookingPDF";

interface OrderTest {
  test_id: string;
  test_name: string;
  price: number;
  discounted_price?: number;
}

interface Order {
  id: string;
  unique_id: string;
  lab_id: string;
  tests: OrderTest[];
  original_total: number;
  discount_percentage: number | null;
  discounted_total: number;
  status: string;
  validity_date: string;
  notes: string | null;
  pdf_url: string | null;
  created_at: string;
  labs?: {
    name: string;
    logo_url: string | null;
  } | null;
}

const statusConfig: Record<string, { icon: any; color: string; label: string }> = {
  pending: {
    icon: Clock,
    color: "bg-yellow-500/10 text-yellow-600 border-yellow-500/20",
    label: "Pending"
  },
  confirmed: {
    icon: CheckCircle,
    color: "bg-blue-500/10 text-blue-600 border-blue-500/20",
    label: "Confirmed"
  },
  completed: {
    icon: CheckCircle,
    color: "bg-green-500/10 text-green-600 border-green-500/20",
    label: "Completed"
  },
  cancelled: {
    icon: XCircle,
    color: "bg-red-500/10 text-red-600 border-red-500/20",
    label: "Cancelled"
  }
};

interface UserProfile {
  full_name: string | null;
  phone: string | null;
  city: string | null;
  age: number | null;
  gender: string | null;
}

const MyBookings = () => {
  const navigate = useNavigate();
  const { user, isLoading: authLoading } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth");
      return;
    }

    if (user) {
      fetchOrders();
      fetchProfile();
    }
  }, [user, authLoading, navigate]);

  const fetchProfile = async () => {
    if (!user) return;
    const { data } = await supabase
      .from("profiles")
      .select("full_name, phone, city, age, gender")
      .eq("user_id", user.id)
      .maybeSingle();
    if (data) setUserProfile(data);
  };

  const fetchOrders = async () => {
    try {
      const { data, error } = await supabase
        .from("orders")
        .select(`
          *,
          labs:lab_id (
            name,
            logo_url
          )
        `)
        .eq("user_id", user?.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      
      const parsedData = (data || []).map(o => ({
        ...o,
        tests: Array.isArray(o.tests) ? o.tests as unknown as OrderTest[] : []
      }));
      
      setOrders(parsedData);
    } catch (error) {
      console.error("Error fetching orders:", error);
      toast.error("Failed to fetch your bookings");
    } finally {
      setIsLoading(false);
    }
  };

  const handleViewOrder = (order: Order) => {
    setSelectedOrder(order);
    setIsDialogOpen(true);
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      {/* Header */}
      <section className="pt-24 pb-8 gradient-hero relative overflow-hidden">
        <div className="container mx-auto px-4 relative">
          <Button
            variant="ghost"
            className="text-primary-foreground/80 hover:text-primary-foreground hover:bg-primary-foreground/10 mb-4"
            onClick={() => navigate("/")}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Home
          </Button>
          <h1 className="text-3xl md:text-4xl font-bold text-primary-foreground mb-2">
            My Bookings
          </h1>
          <p className="text-primary-foreground/80">
            View your booking history and order details
          </p>
        </div>
      </section>

      {/* Content */}
      <section className="py-8">
        <div className="container mx-auto px-4">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : orders.length === 0 ? (
            <Card className="max-w-md mx-auto text-center p-8">
              <ShoppingCart className="w-16 h-16 text-muted-foreground/30 mx-auto mb-4" />
              <h2 className="text-xl font-semibold mb-2">No Bookings Yet</h2>
              <p className="text-muted-foreground mb-4">
                You haven't made any bookings yet. Browse labs and book your tests today!
              </p>
              <Button onClick={() => navigate("/labs")}>
                Browse Labs
              </Button>
            </Card>
          ) : (
            <div className="space-y-6">
              {/* Summary Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <Card>
                  <CardContent className="p-4 flex items-center gap-4">
                    <div className="w-12 h-12 rounded-lg bg-blue-500/10 flex items-center justify-center">
                      <ShoppingCart className="w-6 h-6 text-blue-500" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Total Bookings</p>
                      <p className="text-2xl font-bold">{orders.length}</p>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4 flex items-center gap-4">
                    <div className="w-12 h-12 rounded-lg bg-green-500/10 flex items-center justify-center">
                      <CheckCircle className="w-6 h-6 text-green-500" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Completed</p>
                      <p className="text-2xl font-bold">{orders.filter(o => o.status === "completed").length}</p>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4 flex items-center gap-4">
                    <div className="w-12 h-12 rounded-lg bg-yellow-500/10 flex items-center justify-center">
                      <Clock className="w-6 h-6 text-yellow-500" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Pending</p>
                      <p className="text-2xl font-bold">{orders.filter(o => o.status === "pending").length}</p>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Orders List */}
              <Card>
                <CardHeader>
                  <CardTitle>Booking History</CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Order ID</TableHead>
                          <TableHead>Lab</TableHead>
                          <TableHead>Tests</TableHead>
                          <TableHead>Total</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Date</TableHead>
                          <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {orders.map((order) => {
                          const config = statusConfig[order.status] || statusConfig.pending;
                          const StatusIcon = config.icon;

                          return (
                            <TableRow key={order.id}>
                              <TableCell>
                                <span className="font-mono font-medium text-sm">{order.unique_id}</span>
                              </TableCell>
                              <TableCell>
                                <div className="flex items-center gap-2">
                                  {order.labs?.logo_url ? (
                                    <img src={order.labs.logo_url} alt={order.labs.name} className="w-8 h-8 rounded object-cover" />
                                  ) : (
                                    <div className="w-8 h-8 rounded bg-primary/10 flex items-center justify-center">
                                      <Building2 className="w-4 h-4 text-primary" />
                                    </div>
                                  )}
                                  <span className="font-medium">{order.labs?.name || "Unknown Lab"}</span>
                                </div>
                              </TableCell>
                              <TableCell>
                                <span className="text-sm">{order.tests.length} test(s)</span>
                              </TableCell>
                              <TableCell>
                                <div>
                                  <p className="font-medium">Rs. {order.discounted_total.toLocaleString()}</p>
                                  {order.discount_percentage && order.discount_percentage > 0 && (
                                    <p className="text-xs text-green-600">-{order.discount_percentage}% off</p>
                                  )}
                                </div>
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
                                  onClick={() => handleViewOrder(order)}
                                >
                                  <Eye className="w-4 h-4" />
                                </Button>
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </section>

      <Footer />

      {/* View Order Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Booking Details</DialogTitle>
          </DialogHeader>

          {selectedOrder && (
            <div className="space-y-6 mt-4">
              {/* Order Header */}
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Order ID</p>
                  <p className="font-mono font-bold text-lg">{selectedOrder.unique_id}</p>
                </div>
                <Badge className={statusConfig[selectedOrder.status]?.color || ""}>
                  {statusConfig[selectedOrder.status]?.label}
                </Badge>
              </div>

              {/* Lab Info */}
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    {selectedOrder.labs?.logo_url ? (
                      <img src={selectedOrder.labs.logo_url} alt={selectedOrder.labs.name} className="w-12 h-12 rounded-lg object-cover" />
                    ) : (
                      <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                        <Building2 className="w-6 h-6 text-primary" />
                      </div>
                    )}
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

                  {/* Totals */}
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

              {/* Notes */}
              {selectedOrder.notes && (
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base">Notes</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">{selectedOrder.notes}</p>
                  </CardContent>
                </Card>
              )}

              {/* PDF/Print Actions */}
              <div className="flex gap-3">
                <Button 
                  className="flex-1" 
                  onClick={() => {
                    generateBookingPDF({
                      uniqueId: selectedOrder.unique_id,
                      labName: selectedOrder.labs?.name || 'Lab',
                      patientName: userProfile?.full_name || undefined,
                      patientPhone: userProfile?.phone || undefined,
                      patientCity: userProfile?.city || undefined,
                      patientAge: userProfile?.age || undefined,
                      patientGender: userProfile?.gender || undefined,
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
  );
};

export default MyBookings;
