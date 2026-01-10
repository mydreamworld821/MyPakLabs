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
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <Card key={i}>
                  <Skeleton className="h-48 rounded-t-lg" />
                  <CardContent className="p-4 space-y-3">
                    <Skeleton className="h-6 w-3/4" />
                    <Skeleton className="h-6 w-20" />
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-10 w-full" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : filteredSurgeries.length === 0 ? (
            <div className="text-center py-16">
              <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-6">
                <Scissors className="w-10 h-10 text-primary" />
              </div>
              <h2 className="text-xl font-semibold mb-2">
                {searchQuery ? "No surgeries found" : "Coming Soon!"}
              </h2>
              <p className="text-muted-foreground max-w-md mx-auto">
                {searchQuery
                  ? "Try adjusting your search query"
                  : "Surgical procedures will be available here soon."}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredSurgeries.map((surgery) => (
                <Card
                  key={surgery.id}
                  className="overflow-hidden hover:shadow-lg transition-shadow"
                >
                  {/* Image Section */}
                  <div className="relative h-48 bg-gradient-to-br from-muted to-muted/50">
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
                        <ImageIcon className="w-16 h-16 text-muted-foreground/50" />
                      </div>
                    )}
                    
                    {/* Logo Overlay */}
                    <div className="absolute top-3 left-3 bg-background/90 backdrop-blur-sm px-2 py-1 rounded flex items-center gap-1">
                      <img
                        src="/images/mypaklabs-logo.png"
                        alt="MyPakLabs"
                        className="h-5 w-auto"
                      />
                    </div>
                  </div>

                  <CardContent className="p-4">
                    {/* Surgery Name */}
                    <h3 className="font-semibold text-lg mb-2 line-clamp-2">
                      {surgery.name}
                    </h3>

                    {/* Discount Badge */}
                    {getTotalDiscount(surgery) > 0 && (
                      <Badge className="bg-primary text-primary-foreground mb-3">
                        {getTotalDiscount(surgery)}% Discount
                      </Badge>
                    )}

                    {/* Price Range if available */}
                    {surgery.price_range && (
                      <p className="text-sm text-muted-foreground mb-2">
                        {surgery.price_range}
                      </p>
                    )}

                    {/* Get Free Call */}
                    <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
                      <Phone className="w-4 h-4" />
                      Get free call
                    </div>

                    {/* CTA Button */}
                    <Button variant="outline" className="w-full border-primary text-primary hover:bg-primary hover:text-primary-foreground">
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
