import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import AdminLayout from "@/components/admin/AdminLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";
import {
  AlertTriangle,
  Search,
  Loader2,
  Eye,
  MapPin,
  Clock,
  DollarSign,
  Phone,
  Star,
  RefreshCw,
  Filter,
  ExternalLink,
  Users,
  CheckCircle2,
  XCircle
} from "lucide-react";

interface EmergencyRequest {
  id: string;
  patient_name: string;
  patient_phone: string;
  location_lat: number;
  location_lng: number;
  location_address: string | null;
  city: string | null;
  services_needed: string[];
  urgency: string;
  patient_offer_price: number | null;
  notes: string | null;
  status: string;
  accepted_nurse_id: string | null;
  patient_rating: number | null;
  patient_review: string | null;
  tip_amount: number | null;
  admin_notes: string | null;
  created_at: string;
  completed_at: string | null;
  cancelled_at: string | null;
}

interface NurseOffer {
  id: string;
  offered_price: number;
  eta_minutes: number;
  message: string | null;
  status: string;
  distance_km: number | null;
  created_at: string;
  nurse: {
    id: string;
    full_name: string;
    qualification: string;
    phone: string | null;
  };
}

const SERVICES_MAP: Record<string, string> = {
  iv_cannula: "IV Cannula",
  injection: "Injection",
  wound_dressing: "Wound Dressing",
  medication_administration: "Medication",
  vital_signs: "Vital Signs",
  catheterization: "Catheterization",
  nebulization: "Nebulization",
  blood_sugar: "Blood Sugar",
  elderly_care: "Elderly Care",
  post_surgical: "Post-Surgical",
};

const STATUS_COLORS: Record<string, string> = {
  live: "bg-green-500",
  accepted: "bg-blue-500",
  in_progress: "bg-orange-500",
  completed: "bg-emerald-500",
  cancelled: "bg-gray-500",
};

export default function AdminEmergencyRequests() {
  const [loading, setLoading] = useState(true);
  const [requests, setRequests] = useState<EmergencyRequest[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedRequest, setSelectedRequest] = useState<EmergencyRequest | null>(null);
  const [offers, setOffers] = useState<NurseOffer[]>([]);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [adminNotes, setAdminNotes] = useState("");
  const [stats, setStats] = useState({ live: 0, accepted: 0, completed: 0, cancelled: 0 });

  useEffect(() => {
    fetchRequests();

    // Subscribe to real-time updates
    const channel = supabase
      .channel('admin-emergency')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'emergency_nursing_requests',
        },
        () => fetchRequests()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [statusFilter]);

  const fetchRequests = async () => {
    setLoading(true);
    
    let query = supabase
      .from("emergency_nursing_requests")
      .select("*")
      .order("created_at", { ascending: false });

    if (statusFilter !== "all") {
      query = query.eq("status", statusFilter as "live" | "accepted" | "in_progress" | "completed" | "cancelled");
    }

    const { data } = await query;

    if (data) {
      setRequests(data);
      
      // Calculate stats
      const liveCount = data.filter(r => r.status === "live").length;
      const acceptedCount = data.filter(r => r.status === "accepted" || r.status === "in_progress").length;
      const completedCount = data.filter(r => r.status === "completed").length;
      const cancelledCount = data.filter(r => r.status === "cancelled").length;
      setStats({ live: liveCount, accepted: acceptedCount, completed: completedCount, cancelled: cancelledCount });
    }

    setLoading(false);
  };

  const fetchOffers = async (requestId: string) => {
    const { data } = await supabase
      .from("nurse_offers")
      .select(`
        *,
        nurse:nurses(id, full_name, qualification, phone)
      `)
      .eq("request_id", requestId)
      .order("created_at", { ascending: false });

    if (data) {
      setOffers(data as NurseOffer[]);
    }
  };

  const handleViewDetails = async (request: EmergencyRequest) => {
    setSelectedRequest(request);
    setAdminNotes(request.admin_notes || "");
    await fetchOffers(request.id);
    setDetailDialogOpen(true);
  };

  const handleSaveNotes = async () => {
    if (!selectedRequest) return;

    const { error } = await supabase
      .from("emergency_nursing_requests")
      .update({ admin_notes: adminNotes })
      .eq("id", selectedRequest.id);

    if (error) {
      toast({ title: "Error", description: "Failed to save notes", variant: "destructive" });
      return;
    }

    toast({ title: "Notes saved" });
  };

  const handleCancelRequest = async (requestId: string) => {
    const { error } = await supabase
      .from("emergency_nursing_requests")
      .update({
        status: "cancelled",
        cancelled_at: new Date().toISOString(),
      })
      .eq("id", requestId);

    if (error) {
      toast({ title: "Error", description: "Failed to cancel request", variant: "destructive" });
      return;
    }

    toast({ title: "Request cancelled" });
    setDetailDialogOpen(false);
    fetchRequests();
  };

  const filteredRequests = requests.filter(r =>
    r.patient_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    r.patient_phone.includes(searchQuery) ||
    (r.city && r.city.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const openInMaps = (lat: number, lng: number) => {
    window.open(`https://www.google.com/maps?q=${lat},${lng}`, "_blank");
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <AlertTriangle className="w-6 h-6 text-red-600" />
              Emergency Requests
            </h1>
            <p className="text-muted-foreground">
              Monitor and manage all emergency nursing requests
            </p>
          </div>
          <Button onClick={fetchRequests} variant="outline">
            <RefreshCw className="w-4 h-4 mr-2" /> Refresh
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="border-green-200 bg-green-50">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-green-600">Live Now</p>
                  <p className="text-2xl font-bold text-green-700">{stats.live}</p>
                </div>
                <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse" />
              </div>
            </CardContent>
          </Card>
          <Card className="border-blue-200 bg-blue-50">
            <CardContent className="p-4">
              <div>
                <p className="text-xs text-blue-600">In Progress</p>
                <p className="text-2xl font-bold text-blue-700">{stats.accepted}</p>
              </div>
            </CardContent>
          </Card>
          <Card className="border-emerald-200 bg-emerald-50">
            <CardContent className="p-4">
              <div>
                <p className="text-xs text-emerald-600">Completed</p>
                <p className="text-2xl font-bold text-emerald-700">{stats.completed}</p>
              </div>
            </CardContent>
          </Card>
          <Card className="border-gray-200 bg-gray-50">
            <CardContent className="p-4">
              <div>
                <p className="text-xs text-gray-600">Cancelled</p>
                <p className="text-2xl font-bold text-gray-700">{stats.cancelled}</p>
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
                  placeholder="Search by name, phone, city..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[180px]">
                  <Filter className="w-4 h-4 mr-2" />
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="live">Live</SelectItem>
                  <SelectItem value="accepted">Accepted</SelectItem>
                  <SelectItem value="in_progress">In Progress</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Requests Table */}
        <Card>
          <CardContent className="p-0">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin" />
              </div>
            ) : filteredRequests.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                No requests found
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Patient</TableHead>
                    <TableHead>Location</TableHead>
                    <TableHead>Services</TableHead>
                    <TableHead>Urgency</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredRequests.map((request) => (
                    <TableRow key={request.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium">{request.patient_name}</p>
                          <p className="text-xs text-muted-foreground">{request.patient_phone}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <MapPin className="w-4 h-4 text-muted-foreground" />
                          <span className="text-sm">{request.city || "GPS"}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {request.services_needed.slice(0, 2).map((s) => (
                            <Badge key={s} variant="secondary" className="text-xs">
                              {SERVICES_MAP[s] || s}
                            </Badge>
                          ))}
                          {request.services_needed.length > 2 && (
                            <Badge variant="outline" className="text-xs">
                              +{request.services_needed.length - 2}
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={
                          request.urgency === "critical" ? "bg-red-500" :
                          request.urgency === "within_1_hour" ? "bg-orange-500" :
                          "bg-blue-500"
                        }>
                          {request.urgency}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge className={STATUS_COLORS[request.status]}>
                          {request.status.replace("_", " ")}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          {new Date(request.created_at).toLocaleDateString()}
                          <br />
                          <span className="text-xs text-muted-foreground">
                            {new Date(request.created_at).toLocaleTimeString()}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button size="sm" variant="ghost" onClick={() => handleViewDetails(request)}>
                          <Eye className="w-4 h-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* Detail Dialog */}
        <Dialog open={detailDialogOpen} onOpenChange={setDetailDialogOpen}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Request Details</DialogTitle>
              <DialogDescription>
                ID: {selectedRequest?.id.slice(0, 8)}...
              </DialogDescription>
            </DialogHeader>

            {selectedRequest && (
              <div className="space-y-6">
                {/* Patient Info */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-xs text-muted-foreground">Patient</Label>
                    <p className="font-medium">{selectedRequest.patient_name}</p>
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">Phone</Label>
                    <p className="font-medium">{selectedRequest.patient_phone}</p>
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">Location</Label>
                    <div className="flex items-center gap-2">
                      <p className="font-medium">{selectedRequest.city || "GPS Location"}</p>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => openInMaps(selectedRequest.location_lat, selectedRequest.location_lng)}
                      >
                        <ExternalLink className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">Patient Offer</Label>
                    <p className="font-medium text-green-600">
                      {selectedRequest.patient_offer_price
                        ? `PKR ${selectedRequest.patient_offer_price.toLocaleString()}`
                        : "No offer"}
                    </p>
                  </div>
                </div>

                <div>
                  <Label className="text-xs text-muted-foreground">Services</Label>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {selectedRequest.services_needed.map((s) => (
                      <Badge key={s} variant="secondary">
                        {SERVICES_MAP[s] || s}
                      </Badge>
                    ))}
                  </div>
                </div>

                {selectedRequest.notes && (
                  <div>
                    <Label className="text-xs text-muted-foreground">Patient Notes</Label>
                    <p className="text-sm bg-muted p-2 rounded mt-1">{selectedRequest.notes}</p>
                  </div>
                )}

                {/* Offers */}
                <div>
                  <Label className="text-xs text-muted-foreground flex items-center gap-2">
                    <Users className="w-4 h-4" /> Nurse Offers ({offers.length})
                  </Label>
                  <div className="space-y-2 mt-2">
                    {offers.map((offer) => (
                      <div
                        key={offer.id}
                        className={`p-3 rounded-lg border ${
                          offer.status === "accepted" ? "border-green-500 bg-green-50" : "bg-muted"
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium">{offer.nurse.full_name}</p>
                            <p className="text-xs text-muted-foreground">{offer.nurse.qualification}</p>
                          </div>
                          <div className="text-right">
                            <p className="font-bold text-green-600">PKR {offer.offered_price.toLocaleString()}</p>
                            <p className="text-xs text-muted-foreground">{offer.eta_minutes} min ETA</p>
                          </div>
                        </div>
                        <div className="flex items-center justify-between mt-2">
                          <Badge className={
                            offer.status === "accepted" ? "bg-green-500" :
                            offer.status === "rejected" ? "bg-red-500" :
                            "bg-gray-500"
                          }>
                            {offer.status}
                          </Badge>
                          {offer.distance_km && (
                            <span className="text-xs text-muted-foreground">
                              {offer.distance_km} km away
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                    {offers.length === 0 && (
                      <p className="text-sm text-muted-foreground text-center py-4">
                        No offers received yet
                      </p>
                    )}
                  </div>
                </div>

                {/* Rating (if completed) */}
                {selectedRequest.patient_rating && (
                  <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
                    <Label className="text-xs text-amber-600">Patient Rating</Label>
                    <div className="flex items-center gap-2 mt-1">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          className={`w-5 h-5 ${
                            i < selectedRequest.patient_rating!
                              ? "fill-yellow-400 text-yellow-400"
                              : "text-gray-300"
                          }`}
                        />
                      ))}
                    </div>
                    {selectedRequest.patient_review && (
                      <p className="text-sm mt-2">"{selectedRequest.patient_review}"</p>
                    )}
                    {selectedRequest.tip_amount && (
                      <p className="text-sm font-medium text-green-600 mt-2">
                        Tip: PKR {selectedRequest.tip_amount.toLocaleString()}
                      </p>
                    )}
                  </div>
                )}

                {/* Admin Notes */}
                <div>
                  <Label>Admin Notes</Label>
                  <Textarea
                    value={adminNotes}
                    onChange={(e) => setAdminNotes(e.target.value)}
                    placeholder="Add internal notes..."
                    className="mt-1"
                  />
                  <Button size="sm" className="mt-2" onClick={handleSaveNotes}>
                    Save Notes
                  </Button>
                </div>

                {/* Actions */}
                {selectedRequest.status === "live" && (
                  <div className="flex gap-2 pt-4 border-t">
                    <Button
                      variant="destructive"
                      onClick={() => handleCancelRequest(selectedRequest.id)}
                    >
                      <XCircle className="w-4 h-4 mr-2" /> Force Cancel
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
}
