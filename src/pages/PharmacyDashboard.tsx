import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { 
  Store, 
  Package, 
  Clock, 
  CheckCircle,
  XCircle,
  Truck,
  Loader2,
  AlertCircle,
  Settings,
  TrendingUp,
  Phone,
  MapPin
} from "lucide-react";
import { Json } from "@/integrations/supabase/types";

interface MedicalStore {
  id: string;
  name: string;
  status: string;
  logo_url: string | null;
  city: string;
  area: string;
  is_active: boolean;
}

interface Medicine {
  name: string;
  strength: string;
  quantity: number;
  notes?: string;
}

interface MedicineOrder {
  id: string;
  unique_id: string;
  user_id: string;
  prescription_url: string | null;
  medicines: Json;
  delivery_address: string;
  status: string;
  pharmacy_notes: string | null;
  estimated_price: number | null;
  final_price: number | null;
  estimated_delivery_time: string | null;
  created_at: string;
}

const PharmacyDashboard = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [store, setStore] = useState<MedicalStore | null>(null);
  const [orders, setOrders] = useState<MedicineOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("pending");

  useEffect(() => {
    if (!user) {
      navigate("/auth", { state: { from: "/pharmacy-dashboard" } });
      return;
    }
    fetchStoreAndOrders();
  }, [user, navigate]);

  const fetchStoreAndOrders = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      // Fetch store
      const { data: storeData, error: storeError } = await supabase
        .from("medical_stores")
        .select("*")
        .eq("user_id", user.id)
        .single();

      if (storeError) {
        if (storeError.code === "PGRST116") {
          // No store found
          setStore(null);
        } else {
          throw storeError;
        }
      } else {
        setStore(storeData);
        
        // Fetch orders if store exists
        if (storeData?.id) {
          const { data: ordersData, error: ordersError } = await supabase
            .from("medicine_orders")
            .select("*")
            .eq("store_id", storeData.id)
            .order("created_at", { ascending: false });

          if (ordersError) throw ordersError;
          setOrders(ordersData || []);
        }
      }
    } catch (error) {
      console.error("Error fetching data:", error);
      toast.error("Failed to load dashboard");
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateOrderStatus = async (orderId: string, status: string, additionalData?: any) => {
    try {
      const updateData: any = { status, ...additionalData };
      
      if (status === "preparing") {
        updateData.prepared_at = new Date().toISOString();
      } else if (status === "out_for_delivery") {
        updateData.dispatched_at = new Date().toISOString();
      } else if (status === "delivered") {
        updateData.pharmacy_confirmed_at = new Date().toISOString();
      } else if (status === "cancelled") {
        updateData.cancelled_at = new Date().toISOString();
      }

      const { error } = await supabase
        .from("medicine_orders")
        .update(updateData)
        .eq("id", orderId);

      if (error) throw error;
      
      toast.success(`Order ${status === "cancelled" ? "cancelled" : "updated"} successfully`);
      fetchStoreAndOrders();
    } catch (error: any) {
      toast.error(error.message || "Failed to update order");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <main className="pt-16 flex items-center justify-center min-h-[60vh]">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </main>
      </div>
    );
  }

  // No store registered
  if (!store) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <main className="pt-16">
          <div className="container mx-auto px-4 py-12 text-center">
            <Store className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <h1 className="text-xl font-bold mb-2">No Store Registered</h1>
            <p className="text-muted-foreground mb-6">
              You haven't registered a medical store yet.
            </p>
            <Button onClick={() => navigate("/pharmacy-register")}>
              Register Your Store
            </Button>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  // Store pending approval
  if (store.status === "pending") {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <main className="pt-16">
          <div className="container mx-auto px-4 py-12 text-center">
            <div className="w-16 h-16 rounded-full bg-yellow-100 flex items-center justify-center mx-auto mb-4">
              <Clock className="w-8 h-8 text-yellow-600" />
            </div>
            <h1 className="text-xl font-bold mb-2">Application Under Review</h1>
            <p className="text-muted-foreground mb-2">
              Your store registration is being reviewed by our team.
            </p>
            <p className="text-sm text-muted-foreground">
              You'll receive a notification once approved (usually within 24-48 hours).
            </p>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  // Store rejected
  if (store.status === "rejected") {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <main className="pt-16">
          <div className="container mx-auto px-4 py-12 text-center">
            <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
              <XCircle className="w-8 h-8 text-red-600" />
            </div>
            <h1 className="text-xl font-bold mb-2">Application Rejected</h1>
            <p className="text-muted-foreground mb-6">
              Unfortunately, your store registration was not approved.
              Please contact support for more information.
            </p>
            <Button variant="outline" onClick={() => navigate("/help")}>
              Contact Support
            </Button>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  const orderCounts = {
    pending: orders.filter(o => o.status === "pending").length,
    accepted: orders.filter(o => o.status === "accepted").length,
    preparing: orders.filter(o => o.status === "preparing").length,
    out_for_delivery: orders.filter(o => o.status === "out_for_delivery").length,
    completed: orders.filter(o => o.status === "completed").length,
  };

  const getFilteredOrders = () => {
    switch (activeTab) {
      case "pending":
        return orders.filter(o => o.status === "pending");
      case "active":
        return orders.filter(o => ["accepted", "preparing", "out_for_delivery"].includes(o.status));
      case "completed":
        return orders.filter(o => o.status === "completed");
      default:
        return orders;
    }
  };

  const getStatusBadge = (status: string) => {
    const config: Record<string, { className: string; label: string }> = {
      pending: { className: "bg-yellow-100 text-yellow-700", label: "Pending" },
      accepted: { className: "bg-blue-100 text-blue-700", label: "Accepted" },
      preparing: { className: "bg-purple-100 text-purple-700", label: "Preparing" },
      out_for_delivery: { className: "bg-orange-100 text-orange-700", label: "Out for Delivery" },
      delivered: { className: "bg-emerald-100 text-emerald-700", label: "Delivered" },
      completed: { className: "bg-green-100 text-green-700", label: "Completed" },
      cancelled: { className: "bg-red-100 text-red-700", label: "Cancelled" },
    };
    const c = config[status] || { className: "bg-gray-100 text-gray-700", label: status };
    return <Badge className={c.className}>{c.label}</Badge>;
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="pt-16 pb-8">
        <div className="container mx-auto px-4 py-6">
          {/* Store Header */}
          <Card className="mb-6">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-lg bg-emerald-100 flex items-center justify-center">
                    {store.logo_url ? (
                      <img src={store.logo_url} alt="" className="w-full h-full object-cover rounded-lg" />
                    ) : (
                      <Store className="w-6 h-6 text-emerald-600" />
                    )}
                  </div>
                  <div>
                    <h1 className="font-bold">{store.name}</h1>
                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                      <MapPin className="w-3 h-3" />
                      {store.area}, {store.city}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge className={store.is_active ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}>
                    {store.is_active ? "Active" : "Inactive"}
                  </Badge>
                  <Button variant="outline" size="sm">
                    <Settings className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6">
            <Card>
              <CardContent className="p-3 text-center">
                <p className="text-xl font-bold text-yellow-600">{orderCounts.pending}</p>
                <p className="text-xs text-muted-foreground">New Orders</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-3 text-center">
                <p className="text-xl font-bold text-blue-600">{orderCounts.accepted}</p>
                <p className="text-xs text-muted-foreground">Accepted</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-3 text-center">
                <p className="text-xl font-bold text-purple-600">{orderCounts.preparing}</p>
                <p className="text-xs text-muted-foreground">Preparing</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-3 text-center">
                <p className="text-xl font-bold text-orange-600">{orderCounts.out_for_delivery}</p>
                <p className="text-xs text-muted-foreground">Out for Delivery</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-3 text-center">
                <p className="text-xl font-bold text-green-600">{orderCounts.completed}</p>
                <p className="text-xs text-muted-foreground">Completed</p>
              </CardContent>
            </Card>
          </div>

          {/* Orders */}
          <Card>
            <CardHeader className="py-3">
              <CardTitle className="text-sm">Orders</CardTitle>
            </CardHeader>
            <CardContent>
              <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="grid grid-cols-3 mb-4">
                  <TabsTrigger value="pending" className="text-xs">
                    New ({orderCounts.pending})
                  </TabsTrigger>
                  <TabsTrigger value="active" className="text-xs">
                    Active ({orderCounts.accepted + orderCounts.preparing + orderCounts.out_for_delivery})
                  </TabsTrigger>
                  <TabsTrigger value="completed" className="text-xs">
                    Completed ({orderCounts.completed})
                  </TabsTrigger>
                </TabsList>

                <div className="space-y-3">
                  {getFilteredOrders().length === 0 ? (
                    <div className="text-center py-8">
                      <Package className="w-10 h-10 text-muted-foreground mx-auto mb-2" />
                      <p className="text-sm text-muted-foreground">No orders in this category</p>
                    </div>
                  ) : (
                    getFilteredOrders().map((order) => {
                      const medicines = (Array.isArray(order.medicines) ? order.medicines : []) as unknown as Medicine[];
                      return (
                        <Card key={order.id} className="border">
                          <CardContent className="p-4">
                            <div className="flex items-start justify-between mb-3">
                              <div>
                                <p className="font-semibold text-sm">Order #{order.unique_id}</p>
                                <p className="text-xs text-muted-foreground">
                                  {new Date(order.created_at).toLocaleDateString()}
                                </p>
                              </div>
                              {getStatusBadge(order.status)}
                            </div>

                            {/* Medicines */}
                            {medicines.length > 0 && (
                              <div className="mb-3">
                                <p className="text-xs font-medium mb-1">Medicines:</p>
                                <div className="space-y-1">
                                  {medicines.map((med, idx) => (
                                    <p key={idx} className="text-xs text-muted-foreground">
                                      • {med.name} {med.strength} × {med.quantity}
                                    </p>
                                  ))}
                                </div>
                              </div>
                            )}

                            {/* Prescription */}
                            {order.prescription_url && (
                              <div className="mb-3">
                                <Button 
                                  variant="outline" 
                                  size="sm" 
                                  className="text-xs"
                                  onClick={() => window.open(order.prescription_url!, "_blank")}
                                >
                                  View Prescription
                                </Button>
                              </div>
                            )}

                            {/* Delivery Address */}
                            <div className="mb-3 p-2 bg-muted rounded text-xs">
                              <p className="font-medium flex items-center gap-1">
                                <MapPin className="w-3 h-3" />
                                Delivery Address
                              </p>
                              <p className="text-muted-foreground">{order.delivery_address}</p>
                            </div>

                            {/* Actions */}
                            <div className="flex gap-2">
                              {order.status === "pending" && (
                                <>
                                  <Button 
                                    size="sm" 
                                    className="flex-1 text-xs bg-emerald-600 hover:bg-emerald-700"
                                    onClick={() => handleUpdateOrderStatus(order.id, "accepted")}
                                  >
                                    <CheckCircle className="w-3 h-3 mr-1" />
                                    Accept
                                  </Button>
                                  <Button 
                                    size="sm" 
                                    variant="destructive"
                                    className="flex-1 text-xs"
                                    onClick={() => handleUpdateOrderStatus(order.id, "cancelled", { cancellation_reason: "Out of stock" })}
                                  >
                                    <XCircle className="w-3 h-3 mr-1" />
                                    Reject
                                  </Button>
                                </>
                              )}
                              {order.status === "accepted" && (
                                <Button 
                                  size="sm" 
                                  className="flex-1 text-xs"
                                  onClick={() => handleUpdateOrderStatus(order.id, "preparing")}
                                >
                                  <Package className="w-3 h-3 mr-1" />
                                  Start Preparing
                                </Button>
                              )}
                              {order.status === "preparing" && (
                                <Button 
                                  size="sm" 
                                  className="flex-1 text-xs"
                                  onClick={() => handleUpdateOrderStatus(order.id, "out_for_delivery")}
                                >
                                  <Truck className="w-3 h-3 mr-1" />
                                  Out for Delivery
                                </Button>
                              )}
                              {order.status === "out_for_delivery" && (
                                <Button 
                                  size="sm" 
                                  className="flex-1 text-xs bg-green-600 hover:bg-green-700"
                                  onClick={() => handleUpdateOrderStatus(order.id, "delivered")}
                                >
                                  <CheckCircle className="w-3 h-3 mr-1" />
                                  Mark Delivered
                                </Button>
                              )}
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })
                  )}
                </div>
              </Tabs>
            </CardContent>
          </Card>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default PharmacyDashboard;