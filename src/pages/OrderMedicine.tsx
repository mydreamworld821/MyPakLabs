import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { 
  Store, 
  MapPin, 
  Loader2,
  ArrowLeft,
  Upload,
  Plus,
  Trash2,
  FileImage,
  ShoppingCart,
  Pill,
  FileText
} from "lucide-react";

interface MedicalStore {
  id: string;
  name: string;
  logo_url: string | null;
  city: string;
  area: string;
  phone: string;
  delivery_available: boolean;
}

interface Medicine {
  name: string;
  quantity: number;
  notes: string;
}

const OrderMedicine = () => {
  const { storeId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [store, setStore] = useState<MedicalStore | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState("prescription");
  
  // Prescription upload state
  const [prescriptionFile, setPrescriptionFile] = useState<File | null>(null);
  const [prescriptionPreview, setPrescriptionPreview] = useState<string | null>(null);
  const [uploadingPrescription, setUploadingPrescription] = useState(false);
  
  // Manual medicines state
  const [medicines, setMedicines] = useState<Medicine[]>([{ name: "", quantity: 1, notes: "" }]);
  
  // Common fields
  const [deliveryAddress, setDeliveryAddress] = useState("");
  const [orderNotes, setOrderNotes] = useState("");

  useEffect(() => {
    if (!user) {
      toast.error("Please login to order medicines");
      navigate("/auth");
      return;
    }
    if (storeId) fetchStore();
  }, [storeId, user]);

  const fetchStore = async () => {
    try {
      const { data, error } = await supabase
        .from("medical_stores")
        .select("id, name, logo_url, city, area, phone, delivery_available")
        .eq("id", storeId)
        .eq("status", "approved")
        .eq("is_active", true)
        .single();

      if (error) throw error;
      setStore(data);
    } catch (error) {
      console.error("Error fetching store:", error);
      toast.error("Pharmacy not found");
      navigate("/pharmacies");
    } finally {
      setLoading(false);
    }
  };

  const handlePrescriptionChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith("image/") && file.type !== "application/pdf") {
        toast.error("Please upload an image or PDF file");
        return;
      }
      if (file.size > 10 * 1024 * 1024) {
        toast.error("File size should be less than 10MB");
        return;
      }
      setPrescriptionFile(file);
      if (file.type.startsWith("image/")) {
        setPrescriptionPreview(URL.createObjectURL(file));
      } else {
        setPrescriptionPreview(null);
      }
    }
  };

  const removePrescription = () => {
    setPrescriptionFile(null);
    setPrescriptionPreview(null);
  };

  const addMedicine = () => {
    setMedicines([...medicines, { name: "", quantity: 1, notes: "" }]);
  };

  const removeMedicine = (index: number) => {
    if (medicines.length > 1) {
      setMedicines(medicines.filter((_, i) => i !== index));
    }
  };

  const updateMedicine = (index: number, field: keyof Medicine, value: string | number) => {
    const updated = [...medicines];
    updated[index] = { ...updated[index], [field]: value };
    setMedicines(updated);
  };

  const generateUniqueId = () => {
    const timestamp = Date.now().toString(36).toUpperCase();
    const random = Math.random().toString(36).substring(2, 6).toUpperCase();
    return `MED-${timestamp}-${random}`;
  };

  const uploadPrescriptionFile = async () => {
    if (!prescriptionFile || !user) return null;
    
    setUploadingPrescription(true);
    try {
      const fileExt = prescriptionFile.name.split('.').pop();
      const fileName = `${user.id}/${Date.now()}.${fileExt}`;
      
      const { error } = await supabase.storage
        .from("medicine-prescriptions")
        .upload(fileName, prescriptionFile);
      
      if (error) throw error;
      
      const { data: { publicUrl } } = supabase.storage
        .from("medicine-prescriptions")
        .getPublicUrl(fileName);
      
      return publicUrl;
    } catch (error) {
      console.error("Error uploading prescription:", error);
      throw error;
    } finally {
      setUploadingPrescription(false);
    }
  };

  const handleSubmit = async () => {
    if (!user || !store) return;
    
    if (!deliveryAddress.trim()) {
      toast.error("Please enter your delivery address");
      return;
    }
    
    if (activeTab === "prescription" && !prescriptionFile) {
      toast.error("Please upload your prescription");
      return;
    }
    
    if (activeTab === "manual") {
      const validMedicines = medicines.filter(m => m.name.trim());
      if (validMedicines.length === 0) {
        toast.error("Please add at least one medicine");
        return;
      }
    }
    
    setSubmitting(true);
    try {
      let prescriptionUrl: string | null = null;
      
      if (activeTab === "prescription" && prescriptionFile) {
        prescriptionUrl = await uploadPrescriptionFile();
      }
      
      const validMedicines = activeTab === "manual" 
        ? medicines.filter(m => m.name.trim()).map(m => ({
            name: m.name.trim(),
            quantity: m.quantity,
            notes: m.notes.trim()
          }))
        : [];
      
      const { error } = await supabase.from("medicine_orders").insert({
        user_id: user.id,
        store_id: store.id,
        unique_id: generateUniqueId(),
        prescription_url: prescriptionUrl,
        medicines: validMedicines,
        delivery_address: deliveryAddress.trim(),
        notes: orderNotes.trim() || null,
        status: "pending"
      });
      
      if (error) throw error;
      
      toast.success("Order placed successfully! The pharmacy will contact you shortly.");
      navigate("/my-bookings");
    } catch (error) {
      console.error("Error placing order:", error);
      toast.error("Failed to place order. Please try again.");
    } finally {
      setSubmitting(false);
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

  if (!store) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <main className="pt-16">
          <div className="container mx-auto px-4 py-12 text-center">
            <Store className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h1 className="text-xl font-bold mb-2">Pharmacy Not Found</h1>
            <Button onClick={() => navigate("/pharmacies")}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Pharmacies
            </Button>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="pt-16 pb-8">
        <div className="container mx-auto px-4 py-6">
          <Button 
            variant="ghost" 
            className="mb-4"
            onClick={() => navigate(`/pharmacy/${store.id}`)}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to {store.name}
          </Button>

          <div className="grid lg:grid-cols-3 gap-6">
            {/* Order Form */}
            <div className="lg:col-span-2 space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <ShoppingCart className="w-5 h-5" />
                    Order Medicine
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <Tabs value={activeTab} onValueChange={setActiveTab}>
                    <TabsList className="grid w-full grid-cols-2 mb-6">
                      <TabsTrigger value="prescription" className="flex items-center gap-2">
                        <FileImage className="w-4 h-4" />
                        Upload Prescription
                      </TabsTrigger>
                      <TabsTrigger value="manual" className="flex items-center gap-2">
                        <Pill className="w-4 h-4" />
                        Add Manually
                      </TabsTrigger>
                    </TabsList>

                    <TabsContent value="prescription" className="space-y-4">
                      <div>
                        <Label>Prescription Image/PDF</Label>
                        <p className="text-sm text-muted-foreground mb-3">
                          Upload a clear photo or scan of your prescription
                        </p>
                        
                        {prescriptionFile ? (
                          <div className="border rounded-lg p-4">
                            <div className="flex items-center justify-between mb-3">
                              <div className="flex items-center gap-2">
                                <FileText className="w-5 h-5 text-emerald-600" />
                                <span className="text-sm font-medium">{prescriptionFile.name}</span>
                                <Badge variant="secondary">
                                  {(prescriptionFile.size / 1024 / 1024).toFixed(2)} MB
                                </Badge>
                              </div>
                              <Button variant="ghost" size="sm" onClick={removePrescription}>
                                <Trash2 className="w-4 h-4 text-red-500" />
                              </Button>
                            </div>
                            {prescriptionPreview && (
                              <img 
                                src={prescriptionPreview} 
                                alt="Prescription preview" 
                                className="max-h-64 rounded-lg object-contain mx-auto"
                              />
                            )}
                          </div>
                        ) : (
                          <label className="flex flex-col items-center justify-center w-full h-40 border-2 border-dashed rounded-lg cursor-pointer hover:bg-muted/50 transition-colors">
                            <Upload className="w-8 h-8 text-muted-foreground mb-2" />
                            <span className="text-sm text-muted-foreground">Click to upload prescription</span>
                            <span className="text-xs text-muted-foreground mt-1">JPG, PNG or PDF (max 10MB)</span>
                            <input 
                              type="file" 
                              className="hidden" 
                              accept="image/*,.pdf"
                              onChange={handlePrescriptionChange}
                            />
                          </label>
                        )}
                      </div>
                    </TabsContent>

                    <TabsContent value="manual" className="space-y-4">
                      <div>
                        <Label>Medicines List</Label>
                        <p className="text-sm text-muted-foreground mb-3">
                          Add medicines you need. The pharmacy will confirm availability and pricing.
                        </p>
                        
                        <div className="space-y-3">
                          {medicines.map((medicine, index) => (
                            <div key={index} className="flex gap-2 items-start">
                              <div className="flex-1">
                                <Input
                                  placeholder="Medicine name"
                                  value={medicine.name}
                                  onChange={(e) => updateMedicine(index, "name", e.target.value)}
                                />
                              </div>
                              <div className="w-20">
                                <Input
                                  type="number"
                                  min={1}
                                  placeholder="Qty"
                                  value={medicine.quantity}
                                  onChange={(e) => updateMedicine(index, "quantity", parseInt(e.target.value) || 1)}
                                />
                              </div>
                              <div className="flex-1">
                                <Input
                                  placeholder="Notes (optional)"
                                  value={medicine.notes}
                                  onChange={(e) => updateMedicine(index, "notes", e.target.value)}
                                />
                              </div>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => removeMedicine(index)}
                                disabled={medicines.length === 1}
                              >
                                <Trash2 className="w-4 h-4 text-red-500" />
                              </Button>
                            </div>
                          ))}
                        </div>
                        
                        <Button variant="outline" className="mt-3" onClick={addMedicine}>
                          <Plus className="w-4 h-4 mr-2" />
                          Add Another Medicine
                        </Button>
                      </div>
                    </TabsContent>
                  </Tabs>
                </CardContent>
              </Card>

              {/* Delivery Details */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base">
                    <MapPin className="w-5 h-5" />
                    Delivery Details
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label>Delivery Address *</Label>
                    <Textarea
                      placeholder="Enter your complete delivery address..."
                      value={deliveryAddress}
                      onChange={(e) => setDeliveryAddress(e.target.value)}
                      className="mt-1.5"
                      rows={3}
                    />
                  </div>
                  
                  <div>
                    <Label>Additional Notes (Optional)</Label>
                    <Textarea
                      placeholder="Any special instructions for the pharmacy..."
                      value={orderNotes}
                      onChange={(e) => setOrderNotes(e.target.value)}
                      className="mt-1.5"
                      rows={2}
                    />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Order Summary */}
            <div>
              <Card className="sticky top-20">
                <CardHeader>
                  <CardTitle className="text-base">Order Summary</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Pharmacy Info */}
                  <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                    <div className="w-12 h-12 rounded-lg bg-emerald-100 flex items-center justify-center overflow-hidden">
                      {store.logo_url ? (
                        <img src={store.logo_url} alt={store.name} className="w-full h-full object-cover" />
                      ) : (
                        <Store className="w-6 h-6 text-emerald-600" />
                      )}
                    </div>
                    <div>
                      <p className="font-medium text-sm">{store.name}</p>
                      <p className="text-xs text-muted-foreground">{store.area}, {store.city}</p>
                    </div>
                  </div>

                  {/* Order Type */}
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Order Type</span>
                    <Badge variant="outline">
                      {activeTab === "prescription" ? "Prescription" : "Manual Entry"}
                    </Badge>
                  </div>

                  {/* Items count */}
                  {activeTab === "manual" && (
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Medicines</span>
                      <span>{medicines.filter(m => m.name.trim()).length} items</span>
                    </div>
                  )}

                  {/* Delivery */}
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Delivery</span>
                    <Badge variant={store.delivery_available ? "default" : "secondary"}>
                      {store.delivery_available ? "Available" : "Pickup Only"}
                    </Badge>
                  </div>

                  <div className="border-t pt-4">
                    <p className="text-xs text-muted-foreground mb-4">
                      The pharmacy will review your order and contact you with the final price and availability.
                    </p>
                    
                    <Button 
                      className="w-full bg-emerald-600 hover:bg-emerald-700"
                      onClick={handleSubmit}
                      disabled={submitting || uploadingPrescription}
                    >
                      {submitting || uploadingPrescription ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Placing Order...
                        </>
                      ) : (
                        <>
                          <ShoppingCart className="w-4 h-4 mr-2" />
                          Place Order
                        </>
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default OrderMedicine;
