import { useState, useEffect } from "react";
import AdminLayout from "@/components/admin/AdminLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
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
import { Search, FileText, Loader2, Eye, Check, X, FlaskConical } from "lucide-react";
import { format } from "date-fns";
import { useSignedUrl } from "@/hooks/useSignedUrl";

interface Test {
  id: string;
  name: string;
  category: string | null;
  sample_type: string | null;
}

interface ApprovedTest {
  test_id: string;
  test_name: string;
  price: number;
}

interface Prescription {
  id: string;
  user_id: string;
  lab_id: string | null;
  image_url: string;
  status: string;
  admin_notes: string | null;
  approved_tests: ApprovedTest[] | null;
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
  const [tests, setTests] = useState<Test[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedPrescription, setSelectedPrescription] = useState<Prescription | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [adminNotes, setAdminNotes] = useState("");
  const [isUpdating, setIsUpdating] = useState(false);
  const [selectedTests, setSelectedTests] = useState<ApprovedTest[]>([]);
  const [testPrices, setTestPrices] = useState<Record<string, number>>({});
  const [testSearch, setTestSearch] = useState("");

  const { signedUrl, isLoading: isLoadingUrl } = useSignedUrl(
    selectedPrescription?.image_url || ""
  );

  useEffect(() => {
    fetchPrescriptions();
    fetchTests();
  }, []);

  const fetchPrescriptions = async () => {
    try {
      const { data, error } = await supabase
        .from("prescriptions")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      
      // Parse approved_tests from JSON
      const parsedData = (data || []).map(p => ({
        ...p,
        approved_tests: Array.isArray(p.approved_tests) ? p.approved_tests as unknown as ApprovedTest[] : null
      }));
      
      setPrescriptions(parsedData);
    } catch (error) {
      console.error("Error fetching prescriptions:", error);
      toast.error("Failed to fetch prescriptions");
    } finally {
      setIsLoading(false);
    }
  };

  const fetchTests = async () => {
    try {
      const { data, error } = await supabase
        .from("tests")
        .select("id, name, category, sample_type")
        .eq("is_active", true)
        .order("name");

      if (error) throw error;
      setTests(data || []);
    } catch (error) {
      console.error("Error fetching tests:", error);
    }
  };

  const handleViewPrescription = (prescription: Prescription) => {
    setSelectedPrescription(prescription);
    setAdminNotes(prescription.admin_notes || "");
    setSelectedTests(prescription.approved_tests || []);
    
    // Initialize prices from existing approved tests
    const prices: Record<string, number> = {};
    (prescription.approved_tests || []).forEach(t => {
      prices[t.test_id] = t.price;
    });
    setTestPrices(prices);
    setTestSearch("");
    setIsDialogOpen(true);
  };

  const handleTestToggle = (test: Test, checked: boolean) => {
    if (checked) {
      const defaultPrice = testPrices[test.id] || 0;
      setSelectedTests(prev => [...prev, { 
        test_id: test.id, 
        test_name: test.name, 
        price: defaultPrice 
      }]);
      if (!testPrices[test.id]) {
        setTestPrices(prev => ({ ...prev, [test.id]: 0 }));
      }
    } else {
      setSelectedTests(prev => prev.filter(t => t.test_id !== test.id));
    }
  };

  const handlePriceChange = (testId: string, price: number) => {
    setTestPrices(prev => ({ ...prev, [testId]: price }));
    setSelectedTests(prev => 
      prev.map(t => t.test_id === testId ? { ...t, price } : t)
    );
  };

  const handleUpdateStatus = async (status: "approved" | "rejected") => {
    if (!selectedPrescription) return;

    if (status === "approved" && selectedTests.length === 0) {
      toast.error("Please select at least one test to approve");
      return;
    }

    setIsUpdating(true);

    try {
      const updateData: any = {
        status: status,
        admin_notes: adminNotes || null,
        reviewed_at: new Date().toISOString()
      };

      if (status === "approved") {
        updateData.approved_tests = selectedTests;
      }

      const { error } = await supabase
        .from("prescriptions")
        .update(updateData)
        .eq("id", selectedPrescription.id);

      if (error) throw error;
      
      toast.success(`Prescription ${status}${status === "approved" ? ` with ${selectedTests.length} test(s)` : ""}`);
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

  const filteredTests = tests.filter(test => 
    test.name.toLowerCase().includes(testSearch.toLowerCase()) ||
    (test.category?.toLowerCase().includes(testSearch.toLowerCase()))
  );

  const isTestSelected = (testId: string) => selectedTests.some(t => t.test_id === testId);

  return (
    <AdminLayout>
      <div className="p-6 lg:p-8">
        <div className="mb-6">
          <h1 className="text-2xl lg:text-3xl font-bold">Prescriptions</h1>
          <p className="text-muted-foreground mt-1">
            Review prescriptions and approve tests for patients
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
                      <TableHead>Approved Tests</TableHead>
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
                          {prescription.approved_tests && prescription.approved_tests.length > 0 ? (
                            <span className="text-sm font-medium text-primary">
                              {prescription.approved_tests.length} test(s)
                            </span>
                          ) : (
                            <span className="text-sm text-muted-foreground">—</span>
                          )}
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
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Review Prescription</DialogTitle>
            </DialogHeader>

            {selectedPrescription && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-4">
                {/* Left: Prescription Image */}
                <div className="space-y-4">
                  <h3 className="font-semibold">Prescription Image</h3>
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
                </div>

                {/* Right: Test Selection */}
                <div className="space-y-4">
                  <h3 className="font-semibold flex items-center gap-2">
                    <FlaskConical className="w-4 h-4" />
                    Select Tests to Approve
                  </h3>
                  
                  {/* Test Search */}
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      placeholder="Search tests..."
                      value={testSearch}
                      onChange={(e) => setTestSearch(e.target.value)}
                      className="pl-10"
                    />
                  </div>

                  {/* Selected Tests Summary */}
                  {selectedTests.length > 0 && (
                    <Card className="bg-primary/5 border-primary/20">
                      <CardContent className="p-3">
                        <p className="text-sm font-medium text-primary mb-2">
                          {selectedTests.length} test(s) selected
                        </p>
                        <div className="space-y-1">
                          {selectedTests.map(test => (
                            <div key={test.test_id} className="flex justify-between text-sm">
                              <span className="truncate flex-1">{test.test_name}</span>
                              <span className="font-medium">Rs. {test.price}</span>
                            </div>
                          ))}
                          <div className="border-t pt-1 mt-2 flex justify-between font-semibold">
                            <span>Total</span>
                            <span>Rs. {selectedTests.reduce((sum, t) => sum + t.price, 0)}</span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {/* Test List */}
                  <div className="border rounded-lg max-h-64 overflow-y-auto">
                    {filteredTests.length === 0 ? (
                      <div className="p-4 text-center text-muted-foreground">
                        No tests found
                      </div>
                    ) : (
                      <div className="divide-y">
                        {filteredTests.map(test => (
                          <div key={test.id} className="p-3 hover:bg-muted/50">
                            <div className="flex items-start gap-3">
                              <Checkbox
                                checked={isTestSelected(test.id)}
                                onCheckedChange={(checked) => handleTestToggle(test, checked as boolean)}
                              />
                              <div className="flex-1 min-w-0">
                                <p className="font-medium text-sm">{test.name}</p>
                                {test.category && (
                                  <p className="text-xs text-muted-foreground">{test.category}</p>
                                )}
                              </div>
                              {isTestSelected(test.id) && (
                                <div className="flex items-center gap-1">
                                  <span className="text-xs text-muted-foreground">Rs.</span>
                                  <Input
                                    type="number"
                                    value={testPrices[test.id] || 0}
                                    onChange={(e) => handlePriceChange(test.id, Number(e.target.value))}
                                    className="w-20 h-7 text-sm"
                                    min={0}
                                  />
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Action Buttons - Full Width */}
                {selectedPrescription.status === "pending_review" && (
                  <div className="col-span-full flex gap-2 pt-4 border-t">
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
                      disabled={isUpdating || selectedTests.length === 0}
                    >
                      {isUpdating ? (
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      ) : (
                        <Check className="w-4 h-4 mr-2" />
                      )}
                      Approve with {selectedTests.length} Test(s)
                    </Button>
                  </div>
                )}

                {/* Show approved tests for already reviewed prescriptions */}
                {selectedPrescription.status !== "pending_review" && selectedPrescription.approved_tests && (
                  <div className="col-span-full border-t pt-4">
                    <h4 className="font-medium mb-2">Approved Tests</h4>
                    <div className="space-y-1">
                      {selectedPrescription.approved_tests.map(test => (
                        <div key={test.test_id} className="flex justify-between text-sm p-2 bg-muted rounded">
                          <span>{test.test_name}</span>
                          <span className="font-medium">Rs. {test.price}</span>
                        </div>
                      ))}
                    </div>
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