import { useState, useEffect } from "react";
import AdminLayout from "@/components/admin/AdminLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
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
  Heart, 
  Star,
  Search,
  Loader2,
  ArrowUp,
  ArrowDown,
  MapPin
} from "lucide-react";

interface Nurse {
  id: string;
  full_name: string;
  photo_url: string | null;
  qualification: string;
  city: string;
  experience_years: number;
  per_visit_fee: number;
  rating: number;
  is_featured: boolean;
  featured_order: number;
}

const AdminFeaturedNurses = () => {
  const [nurses, setNurses] = useState<Nurse[]>([]);
  const [featuredNurses, setFeaturedNurses] = useState<Nurse[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [updating, setUpdating] = useState<string | null>(null);

  useEffect(() => {
    fetchNurses();
  }, []);

  const fetchNurses = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("nurses")
        .select("*")
        .eq("status", "approved")
        .order("featured_order", { ascending: true });

      if (error) throw error;

      const allNurses = data || [];
      setNurses(allNurses.filter(n => !n.is_featured));
      setFeaturedNurses(allNurses.filter(n => n.is_featured).sort((a, b) => a.featured_order - b.featured_order));
    } catch (error) {
      console.error("Error fetching nurses:", error);
      toast.error("Failed to load nurses");
    } finally {
      setLoading(false);
    }
  };

  const handleToggleFeatured = async (nurse: Nurse) => {
    setUpdating(nurse.id);
    try {
      const newFeaturedOrder = nurse.is_featured ? 0 : featuredNurses.length + 1;
      
      const { error } = await supabase
        .from("nurses")
        .update({ 
          is_featured: !nurse.is_featured,
          featured_order: newFeaturedOrder
        })
        .eq("id", nurse.id);

      if (error) throw error;

      toast.success(nurse.is_featured ? "Removed from featured" : "Added to featured");
      fetchNurses();
    } catch (error: any) {
      toast.error(error.message || "Failed to update");
    } finally {
      setUpdating(null);
    }
  };

  const handleMoveUp = async (nurse: Nurse, index: number) => {
    if (index === 0) return;
    
    setUpdating(nurse.id);
    try {
      const prevNurse = featuredNurses[index - 1];
      
      await Promise.all([
        supabase.from("nurses").update({ featured_order: index }).eq("id", nurse.id),
        supabase.from("nurses").update({ featured_order: index + 1 }).eq("id", prevNurse.id)
      ]);

      toast.success("Order updated");
      fetchNurses();
    } catch (error: any) {
      toast.error(error.message || "Failed to update order");
    } finally {
      setUpdating(null);
    }
  };

  const handleMoveDown = async (nurse: Nurse, index: number) => {
    if (index === featuredNurses.length - 1) return;
    
    setUpdating(nurse.id);
    try {
      const nextNurse = featuredNurses[index + 1];
      
      await Promise.all([
        supabase.from("nurses").update({ featured_order: index + 2 }).eq("id", nurse.id),
        supabase.from("nurses").update({ featured_order: index + 1 }).eq("id", nextNurse.id)
      ]);

      toast.success("Order updated");
      fetchNurses();
    } catch (error: any) {
      toast.error(error.message || "Failed to update order");
    } finally {
      setUpdating(null);
    }
  };

  const filteredNurses = nurses.filter(nurse =>
    nurse.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    nurse.city?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <AdminLayout>
      <div className="space-y-6 p-6">
        <div className="flex items-center gap-2">
          <Heart className="w-5 h-5 text-rose-600" />
          <h1 className="text-lg font-bold">Featured Nurses</h1>
        </div>

        {/* Featured Nurses Section */}
        <Card>
          <CardContent className="p-4">
            <h2 className="text-sm font-semibold mb-3 flex items-center gap-2">
              <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
              Currently Featured ({featuredNurses.length})
            </h2>
            
            {loading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin" />
              </div>
            ) : featuredNurses.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">
                No featured nurses yet. Add nurses from the list below.
              </p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-xs w-12">Order</TableHead>
                    <TableHead className="text-xs">Nurse</TableHead>
                    <TableHead className="text-xs">City</TableHead>
                    <TableHead className="text-xs">Fee</TableHead>
                    <TableHead className="text-xs w-24">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {featuredNurses.map((nurse, index) => (
                    <TableRow key={nurse.id}>
                      <TableCell className="text-xs font-medium">{index + 1}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full bg-rose-100 flex items-center justify-center overflow-hidden">
                            {nurse.photo_url ? (
                              <img src={nurse.photo_url} alt="" className="w-full h-full object-cover" />
                            ) : (
                              <Heart className="w-4 h-4 text-rose-600" />
                            )}
                          </div>
                          <div>
                            <p className="text-xs font-medium">{nurse.full_name}</p>
                            <p className="text-[10px] text-muted-foreground">{nurse.qualification}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-xs">{nurse.city}</TableCell>
                      <TableCell className="text-xs">PKR {nurse.per_visit_fee?.toLocaleString()}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7"
                            onClick={() => handleMoveUp(nurse, index)}
                            disabled={index === 0 || updating === nurse.id}
                          >
                            <ArrowUp className="w-3 h-3" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7"
                            onClick={() => handleMoveDown(nurse, index)}
                            disabled={index === featuredNurses.length - 1 || updating === nurse.id}
                          >
                            <ArrowDown className="w-3 h-3" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-7 text-xs text-rose-600"
                            onClick={() => handleToggleFeatured(nurse)}
                            disabled={updating === nurse.id}
                          >
                            Remove
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

        {/* Available Nurses Section */}
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-semibold">Available Nurses</h2>
              <div className="relative w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search nurses..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 text-xs h-8"
                />
              </div>
            </div>

            {loading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin" />
              </div>
            ) : filteredNurses.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">
                No approved nurses available
              </p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-xs">Nurse</TableHead>
                    <TableHead className="text-xs">City</TableHead>
                    <TableHead className="text-xs">Experience</TableHead>
                    <TableHead className="text-xs">Rating</TableHead>
                    <TableHead className="text-xs w-24">Feature</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredNurses.map((nurse) => (
                    <TableRow key={nurse.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full bg-rose-100 flex items-center justify-center overflow-hidden">
                            {nurse.photo_url ? (
                              <img src={nurse.photo_url} alt="" className="w-full h-full object-cover" />
                            ) : (
                              <Heart className="w-4 h-4 text-rose-600" />
                            )}
                          </div>
                          <div>
                            <p className="text-xs font-medium">{nurse.full_name}</p>
                            <p className="text-[10px] text-muted-foreground">{nurse.qualification}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1 text-xs">
                          <MapPin className="w-3 h-3" />
                          {nurse.city}
                        </div>
                      </TableCell>
                      <TableCell className="text-xs">{nurse.experience_years} years</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1 text-xs">
                          <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                          {nurse.rating || "New"}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-7 text-xs"
                          onClick={() => handleToggleFeatured(nurse)}
                          disabled={updating === nurse.id}
                        >
                          {updating === nurse.id ? (
                            <Loader2 className="w-3 h-3 animate-spin" />
                          ) : (
                            <>
                              <Star className="w-3 h-3 mr-1" />
                              Add
                            </>
                          )}
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
};

export default AdminFeaturedNurses;
