import { useState, useEffect } from "react";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";
import { Search, Scissors, Phone, ImageIcon } from "lucide-react";

interface Surgery {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  image_url: string | null;
  image_position_x: number;
  image_position_y: number;
  discount_percentage: number;
  hospital_discount_percentage: number;
  doctor_discount_percentage: number;
  price_range: string | null;
}

const Surgeries = () => {
  const [surgeries, setSurgeries] = useState<Surgery[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    fetchSurgeries();
  }, []);

  const fetchSurgeries = async () => {
    try {
      const { data, error } = await supabase
        .from("surgeries")
        .select("*")
        .eq("is_active", true)
        .order("display_order", { ascending: true });

      if (error) throw error;
      setSurgeries(data || []);
    } catch (error) {
      console.error("Failed to fetch surgeries:", error);
    } finally {
      setLoading(false);
    }
  };

  const filteredSurgeries = surgeries.filter((surgery) =>
    surgery.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getTotalDiscount = (surgery: Surgery) => {
    return (
      surgery.discount_percentage +
      surgery.hospital_discount_percentage +
      surgery.doctor_discount_percentage
    );
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="pt-20 pb-8">
        {/* Header Section */}
        <div className="bg-primary text-primary-foreground py-10">
          <div className="container mx-auto px-4 text-center">
            <h1 className="text-2xl md:text-3xl font-bold mb-2">
              Verified Health Treatments, Procedures, Surgeries in Pakistan
            </h1>
            <p className="text-primary-foreground/80">
              Find the best surgical procedures with exclusive discounts
            </p>
          </div>
        </div>

        <div className="container mx-auto px-4 py-8">
          {/* Search Bar */}
          <div className="max-w-xl mx-auto mb-8">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search surgeries and procedures..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          {/* Surgeries Grid */}
          {loading ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {[...Array(8)].map((_, i) => (
                <Card key={i}>
                  <Skeleton className="h-24 rounded-t-lg" />
                  <CardContent className="p-3 space-y-2">
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-5 w-16" />
                    <Skeleton className="h-8 w-full" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : filteredSurgeries.length === 0 ? (
            <div className="text-center py-16">
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                <Scissors className="w-8 h-8 text-primary" />
              </div>
              <h2 className="text-lg font-semibold mb-2">
                {searchQuery ? "No surgeries found" : "Coming Soon!"}
              </h2>
              <p className="text-sm text-muted-foreground max-w-md mx-auto">
                {searchQuery
                  ? "Try adjusting your search query"
                  : "Surgical procedures will be available here soon."}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {filteredSurgeries.map((surgery) => (
                <Card
                  key={surgery.id}
                  className="overflow-hidden hover:shadow-md transition-shadow"
                >
                  {/* Image Section - Compact */}
                  <div className="relative h-24 bg-gradient-to-br from-muted to-muted/50">
                    {surgery.image_url ? (
                      <img
                        src={surgery.image_url}
                        alt={surgery.name}
                        className="w-full h-full object-cover"
                        style={{
                          objectPosition: `${surgery.image_position_x}% ${surgery.image_position_y}%`,
                        }}
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <ImageIcon className="w-8 h-8 text-muted-foreground/50" />
                      </div>
                    )}
                    
                    {/* Logo Overlay */}
                    <div className="absolute top-2 left-2 bg-background/90 backdrop-blur-sm px-1.5 py-0.5 rounded flex items-center gap-1">
                      <img
                        src="/images/mypaklabs-logo.png"
                        alt="MyPakLabs"
                        className="h-3 w-auto"
                      />
                    </div>
                  </div>

                  <CardContent className="p-3">
                    {/* Surgery Name */}
                    <h3 className="font-medium text-sm mb-1.5 line-clamp-2 leading-tight">
                      {surgery.name}
                    </h3>

                    {/* Discount Badge */}
                    {getTotalDiscount(surgery) > 0 && (
                      <Badge className="bg-primary text-primary-foreground text-xs px-1.5 py-0.5 mb-2">
                        {getTotalDiscount(surgery)}% Discount
                      </Badge>
                    )}

                    {/* Get Free Call */}
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-2">
                      <Phone className="w-3 h-3" />
                      Get free call
                    </div>

                    {/* CTA Button */}
                    <Button 
                      variant="outline" 
                      size="sm"
                      className="w-full text-xs h-7 border-primary text-primary hover:bg-primary hover:text-primary-foreground"
                    >
                      Get Information
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Surgeries;
