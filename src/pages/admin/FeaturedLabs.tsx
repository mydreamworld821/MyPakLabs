import { useState, useEffect } from "react";
import AdminLayout from "@/components/admin/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Star, Loader2, Building2, ArrowUp, ArrowDown, Plus, X, Percent } from "lucide-react";

interface Lab {
  id: string;
  name: string;
  slug: string;
  logo_url: string | null;
  discount_percentage: number | null;
  rating: number | null;
  review_count: number | null;
  is_featured: boolean | null;
  featured_order: number | null;
  is_active: boolean | null;
}

type SortBy = "discount" | "rating" | "reviews" | "order";

const AdminFeaturedLabs = () => {
  const [labs, setLabs] = useState<Lab[]>([]);
  const [featuredLabs, setFeaturedLabs] = useState<Lab[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [sortBy, setSortBy] = useState<SortBy>("order");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedLabId, setSelectedLabId] = useState<string>("");
  const [featuredOrder, setFeaturedOrder] = useState<number>(1);

  useEffect(() => {
    fetchLabs();
  }, []);

  const fetchLabs = async () => {
    try {
      const { data, error } = await supabase
        .from("labs")
        .select("id, name, slug, logo_url, discount_percentage, rating, review_count, is_featured, featured_order, is_active")
        .eq("is_active", true)
        .order("name");

      if (error) throw error;

      const allLabs = (data || []) as Lab[];
      setLabs(allLabs);
      
      // Filter featured labs
      const featured = allLabs
        .filter(lab => lab.is_featured)
        .sort((a, b) => (a.featured_order || 0) - (b.featured_order || 0));
      setFeaturedLabs(featured);
    } catch (error: any) {
      console.error("Error fetching labs:", error);
      toast.error("Failed to load labs");
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddFeatured = async () => {
    if (!selectedLabId) {
      toast.error("Please select a lab");
      return;
    }

    setIsSaving(true);
    try {
      const { error } = await supabase
        .from("labs")
        .update({ 
          is_featured: true, 
          featured_order: featuredOrder 
        })
        .eq("id", selectedLabId);

      if (error) throw error;

      toast.success("Lab added to featured");
      setIsDialogOpen(false);
      setSelectedLabId("");
      setFeaturedOrder(featuredLabs.length + 1);
      fetchLabs();
    } catch (error: any) {
      console.error("Error adding featured lab:", error);
      toast.error("Failed to add featured lab");
    } finally {
      setIsSaving(false);
    }
  };

  const handleRemoveFeatured = async (labId: string) => {
    try {
      const { error } = await supabase
        .from("labs")
        .update({ is_featured: false, featured_order: 0 })
        .eq("id", labId);

      if (error) throw error;

      toast.success("Lab removed from featured");
      fetchLabs();
    } catch (error: any) {
      console.error("Error removing featured lab:", error);
      toast.error("Failed to remove featured lab");
    }
  };

  const handleUpdateOrder = async (labId: string, newOrder: number) => {
    try {
      const { error } = await supabase
        .from("labs")
        .update({ featured_order: newOrder })
        .eq("id", labId);

      if (error) throw error;

      toast.success("Order updated");
      fetchLabs();
    } catch (error: any) {
      console.error("Error updating order:", error);
      toast.error("Failed to update order");
    }
  };

  const handleMoveUp = async (index: number) => {
    if (index === 0) return;
    const currentLab = featuredLabs[index];
    const prevLab = featuredLabs[index - 1];
    
    await Promise.all([
      supabase.from("labs").update({ featured_order: prevLab.featured_order }).eq("id", currentLab.id),
      supabase.from("labs").update({ featured_order: currentLab.featured_order }).eq("id", prevLab.id)
    ]);
    
    fetchLabs();
  };

  const handleMoveDown = async (index: number) => {
    if (index === featuredLabs.length - 1) return;
    const currentLab = featuredLabs[index];
    const nextLab = featuredLabs[index + 1];
    
    await Promise.all([
      supabase.from("labs").update({ featured_order: nextLab.featured_order }).eq("id", currentLab.id),
      supabase.from("labs").update({ featured_order: currentLab.featured_order }).eq("id", nextLab.id)
    ]);
    
    fetchLabs();
  };

  const getSortedFeaturedLabs = () => {
    const sorted = [...featuredLabs];
    switch (sortBy) {
      case "discount":
        return sorted.sort((a, b) => (b.discount_percentage || 0) - (a.discount_percentage || 0));
      case "rating":
        return sorted.sort((a, b) => (b.rating || 0) - (a.rating || 0));
      case "reviews":
        return sorted.sort((a, b) => (b.review_count || 0) - (a.review_count || 0));
      case "order":
      default:
        return sorted.sort((a, b) => (a.featured_order || 0) - (b.featured_order || 0));
    }
  };

  const availableLabs = labs.filter(
    lab => !lab.is_featured && 
    lab.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold">Featured Labs</h1>
            <p className="text-muted-foreground">Manage which labs appear on the homepage</p>
          </div>
          <Button onClick={() => {
            setIsDialogOpen(true);
            setFeaturedOrder(featuredLabs.length + 1);
          }}>
            <Plus className="w-4 h-4 mr-2" />
            Add Featured Lab
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <Star className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Featured Labs</p>
                  <p className="text-2xl font-bold">{featuredLabs.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-green-500/10">
                  <Percent className="w-5 h-5 text-green-500" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Avg. Discount</p>
                  <p className="text-2xl font-bold">
                    {featuredLabs.length > 0 
                      ? Math.round(featuredLabs.reduce((sum, lab) => sum + (lab.discount_percentage || 0), 0) / featuredLabs.length)
                      : 0}%
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-yellow-500/10">
                  <Star className="w-5 h-5 text-yellow-500" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Avg. Rating</p>
                  <p className="text-2xl font-bold">
                    {featuredLabs.length > 0 
                      ? (featuredLabs.reduce((sum, lab) => sum + (lab.rating || 0), 0) / featuredLabs.length).toFixed(1)
                      : 0}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Featured Labs Table */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Featured Labs ({featuredLabs.length})</CardTitle>
            <Select value={sortBy} onValueChange={(v) => setSortBy(v as SortBy)}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="order">Display Order</SelectItem>
                <SelectItem value="discount">Discount %</SelectItem>
                <SelectItem value="rating">Rating</SelectItem>
                <SelectItem value="reviews">Reviews</SelectItem>
              </SelectContent>
            </Select>
          </CardHeader>
          <CardContent>
            {featuredLabs.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Building2 className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p>No featured labs yet</p>
                <p className="text-sm">Add labs to feature them on the homepage</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">Order</TableHead>
                    <TableHead>Lab</TableHead>
                    <TableHead className="text-center">Discount</TableHead>
                    <TableHead className="text-center">Rating</TableHead>
                    <TableHead className="text-center">Reviews</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {getSortedFeaturedLabs().map((lab, index) => (
                    <TableRow key={lab.id}>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Input
                            type="number"
                            value={lab.featured_order || 0}
                            onChange={(e) => handleUpdateOrder(lab.id, parseInt(e.target.value) || 0)}
                            className="w-16 h-8 text-center"
                            min={1}
                          />
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center overflow-hidden">
                            {lab.logo_url ? (
                              <img src={lab.logo_url} alt={lab.name} className="max-w-full max-h-full object-contain" />
                            ) : (
                              <Building2 className="w-5 h-5 text-muted-foreground" />
                            )}
                          </div>
                          <span className="font-medium">{lab.name}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge variant="outline" className="text-primary border-primary">
                          {lab.discount_percentage || 0}% OFF
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center">
                        <div className="flex items-center justify-center gap-1">
                          <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                          <span>{lab.rating || 0}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                        {(lab.review_count || 0).toLocaleString()}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleMoveUp(index)}
                            disabled={index === 0}
                          >
                            <ArrowUp className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleMoveDown(index)}
                            disabled={index === featuredLabs.length - 1}
                          >
                            <ArrowDown className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleRemoveFeatured(lab.id)}
                            className="text-destructive hover:text-destructive"
                          >
                            <X className="w-4 h-4" />
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

        {/* Add Featured Lab Dialog */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Add Featured Lab</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Search & Select Lab</Label>
                <Input
                  placeholder="Search labs..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label>Select Lab</Label>
                <Select value={selectedLabId} onValueChange={setSelectedLabId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose a lab..." />
                  </SelectTrigger>
                  <SelectContent>
                    {availableLabs.map((lab) => (
                      <SelectItem key={lab.id} value={lab.id}>
                        <div className="flex items-center gap-2">
                          <span>{lab.name}</span>
                          {lab.discount_percentage && lab.discount_percentage > 0 && (
                            <Badge variant="secondary" className="text-xs">
                              {lab.discount_percentage}% OFF
                            </Badge>
                          )}
                          {lab.rating && (
                            <span className="text-xs text-muted-foreground">
                              ⭐ {lab.rating}
                            </span>
                          )}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Display Order</Label>
                <Input
                  type="number"
                  min={1}
                  value={featuredOrder}
                  onChange={(e) => setFeaturedOrder(parseInt(e.target.value) || 1)}
                />
                <p className="text-xs text-muted-foreground">
                  Lower numbers appear first on the homepage
                </p>
              </div>

              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleAddFeatured} disabled={isSaving || !selectedLabId}>
                  {isSaving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  Add to Featured
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
};

export default AdminFeaturedLabs;
