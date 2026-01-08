import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
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
  User,
  Mail,
  Phone,
  MapPin,
  Edit2,
  Save,
  Loader2,
  ShoppingCart,
  FileText,
  CheckCircle,
  Clock,
  XCircle,
  Eye,
  Building2,
  Calendar,
  ArrowLeft,
  Heart,
  AlertCircle,
  Pill,
  Stethoscope,
} from "lucide-react";

interface Profile {
  id: string;
  user_id: string;
  full_name: string | null;
  phone: string | null;
  city: string | null;
  avatar_url: string | null;
  medical_history: string | null;
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
  lab_id: string;
  tests: OrderTest[];
  original_total: number;
  discount_percentage: number | null;
  discounted_total: number;
  status: string;
  validity_date: string;
  notes: string | null;
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

const Profile = () => {
  const navigate = useNavigate();
  const { user, isLoading: authLoading } = useAuth();
  
  const [profile, setProfile] = useState<Profile | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isEditingMedical, setIsEditingMedical] = useState(false);
  const [isSavingMedical, setIsSavingMedical] = useState(false);
  
  // Edit form state
  const [editForm, setEditForm] = useState({
    full_name: "",
    phone: "",
    city: "",
    newEmail: "",
  });
  const [medicalHistory, setMedicalHistory] = useState({
    conditions: "",
    allergies: "",
    medications: "",
    notes: "",
  });
  const [isChangingEmail, setIsChangingEmail] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth");
      return;
    }

    if (user) {
      fetchProfileAndOrders();
    }
  }, [user, authLoading, navigate]);

  const fetchProfileAndOrders = async () => {
    try {
      // Fetch profile
      const { data: profileData, error: profileError } = await supabase
        .from("profiles")
        .select("*")
        .eq("user_id", user?.id)
        .maybeSingle();

      if (profileError) throw profileError;
      
      setProfile(profileData);
      if (profileData) {
        setEditForm({
          full_name: profileData.full_name || "",
          phone: profileData.phone || "",
          city: profileData.city || "",
          newEmail: "",
        });
        // Parse medical history JSON or use as plain text
        if (profileData.medical_history) {
          try {
            const parsed = JSON.parse(profileData.medical_history);
            setMedicalHistory({
              conditions: parsed.conditions || "",
              allergies: parsed.allergies || "",
              medications: parsed.medications || "",
              notes: parsed.notes || "",
            });
          } catch {
            // If not JSON, treat as plain notes
            setMedicalHistory({
              conditions: "",
              allergies: "",
              medications: "",
              notes: profileData.medical_history,
            });
          }
        }
      }

      // Fetch orders
      const { data: ordersData, error: ordersError } = await supabase
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

      if (ordersError) throw ordersError;
      
      const parsedOrders = (ordersData || []).map(o => ({
        ...o,
        tests: Array.isArray(o.tests) ? o.tests as unknown as OrderTest[] : []
      }));
      
      setOrders(parsedOrders);
    } catch (error) {
      console.error("Error fetching profile:", error);
      toast.error("Failed to load profile");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveProfile = async () => {
    if (!user) return;
    
    setIsSaving(true);
    try {
      const { error } = await supabase
        .from("profiles")
        .update({
          full_name: editForm.full_name.trim() || null,
          phone: editForm.phone.trim() || null,
          city: editForm.city.trim() || null,
        })
        .eq("user_id", user.id);

      if (error) throw error;

      setProfile(prev => prev ? {
        ...prev,
        full_name: editForm.full_name.trim() || null,
        phone: editForm.phone.trim() || null,
        city: editForm.city.trim() || null,
      } : null);
      
      setIsEditing(false);
      toast.success("Profile updated successfully!");
    } catch (error) {
      console.error("Error updating profile:", error);
      toast.error("Failed to update profile");
    } finally {
      setIsSaving(false);
    }
  };

  const handleChangeEmail = async () => {
    if (!editForm.newEmail.trim()) {
      toast.error("Please enter a new email address");
      return;
    }

    setIsSaving(true);
    try {
      const { error } = await supabase.auth.updateUser({
        email: editForm.newEmail.trim(),
      });

      if (error) throw error;

      toast.success("Verification email sent! Please check your new email to confirm the change.");
      setIsChangingEmail(false);
      setEditForm(prev => ({ ...prev, newEmail: "" }));
    } catch (error: any) {
      console.error("Error changing email:", error);
      toast.error(error.message || "Failed to change email");
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveMedicalHistory = async () => {
    if (!user) return;
    
    setIsSavingMedical(true);
    try {
      const medicalData = JSON.stringify(medicalHistory);
      
      const { error } = await supabase
        .from("profiles")
        .update({
          medical_history: medicalData,
        })
        .eq("user_id", user.id);

      if (error) throw error;

      setProfile(prev => prev ? {
        ...prev,
        medical_history: medicalData,
      } : null);
      
      setIsEditingMedical(false);
      toast.success("Medical history saved successfully!");
    } catch (error) {
      console.error("Error saving medical history:", error);
      toast.error("Failed to save medical history");
    } finally {
      setIsSavingMedical(false);
    }
  };

  const handleViewOrder = (order: Order) => {
    setSelectedOrder(order);
    setIsDialogOpen(true);
  };

  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const totalSpent = orders.reduce((sum, o) => sum + o.discounted_total, 0);
  const completedOrders = orders.filter(o => o.status === "completed").length;

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
            My Profile
          </h1>
          <p className="text-primary-foreground/80">
            Manage your account and view your order history
          </p>
        </div>
      </section>

      {/* Content */}
      <section className="py-8">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Profile Card */}
            <div className="lg:col-span-1">
              <Card>
                <CardHeader className="text-center pb-4">
                  <div className="w-24 h-24 mx-auto rounded-full bg-primary/10 flex items-center justify-center mb-4">
                    <User className="w-12 h-12 text-primary" />
                  </div>
                  <CardTitle className="text-xl">
                    {profile?.full_name || "User"}
                  </CardTitle>
                  <p className="text-sm text-muted-foreground">{user?.email}</p>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Stats */}
                  <div className="grid grid-cols-2 gap-4 pb-4 border-b">
                    <div className="text-center">
                      <p className="text-2xl font-bold text-primary">{orders.length}</p>
                      <p className="text-xs text-muted-foreground">Total Orders</p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-bold text-green-600">Rs. {totalSpent.toLocaleString()}</p>
                      <p className="text-xs text-muted-foreground">Total Spent</p>
                    </div>
                  </div>

                  {/* Contact Info */}
                  {isEditing ? (
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="full_name">Full Name</Label>
                        <Input
                          id="full_name"
                          value={editForm.full_name}
                          onChange={(e) => setEditForm(prev => ({ ...prev, full_name: e.target.value }))}
                          placeholder="Enter your full name"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="phone">Phone Number</Label>
                        <Input
                          id="phone"
                          value={editForm.phone}
                          onChange={(e) => setEditForm(prev => ({ ...prev, phone: e.target.value }))}
                          placeholder="Enter your phone number"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="city">City</Label>
                        <Input
                          id="city"
                          value={editForm.city}
                          onChange={(e) => setEditForm(prev => ({ ...prev, city: e.target.value }))}
                          placeholder="Enter your city"
                        />
                      </div>
                      <div className="flex gap-2">
                        <Button
                          className="flex-1"
                          onClick={handleSaveProfile}
                          disabled={isSaving}
                        >
                          {isSaving ? (
                            <Loader2 className="w-4 h-4 animate-spin mr-2" />
                          ) : (
                            <Save className="w-4 h-4 mr-2" />
                          )}
                          Save
                        </Button>
                        <Button
                          variant="outline"
                          onClick={() => setIsEditing(false)}
                          disabled={isSaving}
                        >
                          Cancel
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                        <Mail className="w-4 h-4 text-muted-foreground" />
                        <div className="flex-1 min-w-0">
                          <p className="text-xs text-muted-foreground">Email</p>
                          <p className="text-sm font-medium truncate">{user?.email}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                        <Phone className="w-4 h-4 text-muted-foreground" />
                        <div className="flex-1">
                          <p className="text-xs text-muted-foreground">Phone</p>
                          <p className="text-sm font-medium">{profile?.phone || "Not set"}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                        <MapPin className="w-4 h-4 text-muted-foreground" />
                        <div className="flex-1">
                          <p className="text-xs text-muted-foreground">City</p>
                          <p className="text-sm font-medium">{profile?.city || "Not set"}</p>
                        </div>
                      </div>
                      <Button
                        variant="outline"
                        className="w-full"
                        onClick={() => setIsEditing(true)}
                      >
                        <Edit2 className="w-4 h-4 mr-2" />
                        Edit Profile
                      </Button>
                      <Button
                        variant="ghost"
                        className="w-full"
                        onClick={() => setIsChangingEmail(true)}
                      >
                        <Mail className="w-4 h-4 mr-2" />
                        Change Email
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Orders & History */}
            <div className="lg:col-span-2">
              <Tabs defaultValue="orders" className="space-y-4">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="orders" className="gap-2">
                    <ShoppingCart className="w-4 h-4" />
                    <span className="hidden sm:inline">Orders</span> ({orders.length})
                  </TabsTrigger>
                  <TabsTrigger value="medical" className="gap-2">
                    <Heart className="w-4 h-4" />
                    <span className="hidden sm:inline">Medical</span>
                  </TabsTrigger>
                  <TabsTrigger value="activity" className="gap-2">
                    <FileText className="w-4 h-4" />
                    <span className="hidden sm:inline">Activity</span>
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="orders">
                  <Card>
                    <CardHeader>
                      <CardTitle>Order History</CardTitle>
                    </CardHeader>
                    <CardContent className="p-0">
                      {orders.length === 0 ? (
                        <div className="flex flex-col items-center justify-center p-8 text-center">
                          <ShoppingCart className="w-12 h-12 text-muted-foreground/30 mb-4" />
                          <p className="text-muted-foreground">No orders yet</p>
                          <Button className="mt-4" onClick={() => navigate("/labs")}>
                            Browse Labs
                          </Button>
                        </div>
                      ) : (
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
                                      <span className="font-mono text-xs">{order.unique_id}</span>
                                    </TableCell>
                                    <TableCell>
                                      <div className="flex items-center gap-2">
                                        {order.labs?.logo_url ? (
                                          <img src={order.labs.logo_url} alt="" className="w-6 h-6 rounded object-cover" />
                                        ) : (
                                          <Building2 className="w-4 h-4 text-muted-foreground" />
                                        )}
                                        <span className="text-sm">{order.labs?.name || "N/A"}</span>
                                      </div>
                                    </TableCell>
                                    <TableCell>{order.tests.length}</TableCell>
                                    <TableCell className="font-medium">
                                      Rs. {order.discounted_total.toLocaleString()}
                                    </TableCell>
                                    <TableCell>
                                      <Badge className={`${config.color} text-xs`}>
                                        <StatusIcon className="w-3 h-3 mr-1" />
                                        {config.label}
                                      </Badge>
                                    </TableCell>
                                    <TableCell className="text-sm text-muted-foreground">
                                      {format(new Date(order.created_at), "dd MMM")}
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
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="medical">
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between">
                      <CardTitle className="flex items-center gap-2">
                        <Heart className="w-5 h-5 text-red-500" />
                        Medical History
                      </CardTitle>
                      {!isEditingMedical && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setIsEditingMedical(true)}
                        >
                          <Edit2 className="w-4 h-4 mr-2" />
                          Edit
                        </Button>
                      )}
                    </CardHeader>
                    <CardContent className="space-y-6">
                      <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-4 flex items-start gap-3">
                        <AlertCircle className="w-5 h-5 text-yellow-600 shrink-0 mt-0.5" />
                        <div>
                          <p className="text-sm font-medium text-yellow-800">Private & Secure</p>
                          <p className="text-xs text-yellow-700">
                            This information is encrypted and only visible to you and authorized healthcare providers.
                          </p>
                        </div>
                      </div>

                      {isEditingMedical ? (
                        <div className="space-y-4">
                          <div className="space-y-2">
                            <Label className="flex items-center gap-2">
                              <Stethoscope className="w-4 h-4" />
                              Medical Conditions
                            </Label>
                            <Textarea
                              value={medicalHistory.conditions}
                              onChange={(e) => setMedicalHistory(prev => ({ ...prev, conditions: e.target.value }))}
                              placeholder="E.g., Diabetes, Hypertension, Asthma..."
                              rows={3}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label className="flex items-center gap-2">
                              <AlertCircle className="w-4 h-4" />
                              Allergies
                            </Label>
                            <Textarea
                              value={medicalHistory.allergies}
                              onChange={(e) => setMedicalHistory(prev => ({ ...prev, allergies: e.target.value }))}
                              placeholder="E.g., Penicillin, Peanuts, Latex..."
                              rows={2}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label className="flex items-center gap-2">
                              <Pill className="w-4 h-4" />
                              Current Medications
                            </Label>
                            <Textarea
                              value={medicalHistory.medications}
                              onChange={(e) => setMedicalHistory(prev => ({ ...prev, medications: e.target.value }))}
                              placeholder="E.g., Metformin 500mg, Aspirin 75mg..."
                              rows={3}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label className="flex items-center gap-2">
                              <FileText className="w-4 h-4" />
                              Additional Notes
                            </Label>
                            <Textarea
                              value={medicalHistory.notes}
                              onChange={(e) => setMedicalHistory(prev => ({ ...prev, notes: e.target.value }))}
                              placeholder="Any other relevant health information..."
                              rows={3}
                            />
                          </div>
                          <div className="flex gap-2">
                            <Button
                              className="flex-1"
                              onClick={handleSaveMedicalHistory}
                              disabled={isSavingMedical}
                            >
                              {isSavingMedical ? (
                                <Loader2 className="w-4 h-4 animate-spin mr-2" />
                              ) : (
                                <Save className="w-4 h-4 mr-2" />
                              )}
                              Save Medical History
                            </Button>
                            <Button
                              variant="outline"
                              onClick={() => setIsEditingMedical(false)}
                              disabled={isSavingMedical}
                            >
                              Cancel
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          <div className="p-4 rounded-lg border bg-muted/30">
                            <div className="flex items-center gap-2 mb-2">
                              <Stethoscope className="w-4 h-4 text-primary" />
                              <span className="font-medium text-sm">Medical Conditions</span>
                            </div>
                            <p className="text-sm text-muted-foreground">
                              {medicalHistory.conditions || "No conditions recorded"}
                            </p>
                          </div>
                          <div className="p-4 rounded-lg border bg-muted/30">
                            <div className="flex items-center gap-2 mb-2">
                              <AlertCircle className="w-4 h-4 text-red-500" />
                              <span className="font-medium text-sm">Allergies</span>
                            </div>
                            <p className="text-sm text-muted-foreground">
                              {medicalHistory.allergies || "No allergies recorded"}
                            </p>
                          </div>
                          <div className="p-4 rounded-lg border bg-muted/30">
                            <div className="flex items-center gap-2 mb-2">
                              <Pill className="w-4 h-4 text-blue-500" />
                              <span className="font-medium text-sm">Current Medications</span>
                            </div>
                            <p className="text-sm text-muted-foreground">
                              {medicalHistory.medications || "No medications recorded"}
                            </p>
                          </div>
                          <div className="p-4 rounded-lg border bg-muted/30">
                            <div className="flex items-center gap-2 mb-2">
                              <FileText className="w-4 h-4 text-muted-foreground" />
                              <span className="font-medium text-sm">Additional Notes</span>
                            </div>
                            <p className="text-sm text-muted-foreground">
                              {medicalHistory.notes || "No additional notes"}
                            </p>
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="activity">
                  <Card>
                    <CardHeader>
                      <CardTitle>Recent Activity</CardTitle>
                    </CardHeader>
                    <CardContent>
                      {orders.length === 0 ? (
                        <p className="text-muted-foreground text-center py-8">No activity yet</p>
                      ) : (
                        <div className="space-y-4">
                          {orders.slice(0, 10).map((order) => {
                            const config = statusConfig[order.status] || statusConfig.pending;
                            return (
                              <div key={order.id} className="flex items-start gap-4 pb-4 border-b last:border-0">
                                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${config.color}`}>
                                  <ShoppingCart className="w-5 h-5" />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="font-medium">
                                    Order placed at {order.labs?.name || "Lab"}
                                  </p>
                                  <p className="text-sm text-muted-foreground">
                                    {order.tests.length} test(s) • Rs. {order.discounted_total.toLocaleString()}
                                  </p>
                                  <p className="text-xs text-muted-foreground mt-1">
                                    {format(new Date(order.created_at), "dd MMM yyyy, hh:mm a")}
                                  </p>
                                </div>
                                <Badge className={config.color}>{config.label}</Badge>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            </div>
          </div>
        </div>
      </section>

      <Footer />

      {/* Change Email Dialog */}
      <Dialog open={isChangingEmail} onOpenChange={setIsChangingEmail}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Change Email Address</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Current Email</Label>
              <Input value={user?.email || ""} disabled />
            </div>
            <div className="space-y-2">
              <Label htmlFor="newEmail">New Email Address</Label>
              <Input
                id="newEmail"
                type="email"
                value={editForm.newEmail}
                onChange={(e) => setEditForm(prev => ({ ...prev, newEmail: e.target.value }))}
                placeholder="Enter new email address"
              />
            </div>
            <p className="text-sm text-muted-foreground">
              A verification link will be sent to your new email address. You'll need to confirm it to complete the change.
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsChangingEmail(false)}>
              Cancel
            </Button>
            <Button onClick={handleChangeEmail} disabled={isSaving}>
              {isSaving ? (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              ) : null}
              Send Verification
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Order Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Order Details</DialogTitle>
          </DialogHeader>

          {selectedOrder && (
            <div className="space-y-6 mt-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Order ID</p>
                  <p className="font-mono font-bold text-lg">{selectedOrder.unique_id}</p>
                </div>
                <Badge className={statusConfig[selectedOrder.status]?.color || ""}>
                  {statusConfig[selectedOrder.status]?.label}
                </Badge>
              </div>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    {selectedOrder.labs?.logo_url ? (
                      <img src={selectedOrder.labs.logo_url} alt="" className="w-12 h-12 rounded-lg object-cover" />
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
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Profile;
