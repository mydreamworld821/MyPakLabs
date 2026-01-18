import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Package, Check, ArrowLeft } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";

interface Lab {
  id: string;
  name: string;
  slug: string;
  logo_url: string | null;
}

interface TestItem {
  name: string;
  details?: string;
}

interface HealthPackage {
  id: string;
  name: string;
  description: string | null;
  discounted_price: number;
  tests_included: TestItem[];
  is_featured: boolean;
  lab?: Lab;
}

const HealthPackages = () => {
  const [packages, setPackages] = useState<HealthPackage[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPackages = async () => {
      try {
        const { data, error } = await supabase
          .from("health_packages")
          .select(`
            id,
            name,
            description,
            discounted_price,
            tests_included,
            is_featured,
            lab:labs(id, name, slug, logo_url)
          `)
          .eq("is_active", true)
          .order("is_featured", { ascending: false })
          .order("featured_order", { ascending: true })
          .order("name", { ascending: true });

        if (error) throw error;
        setPackages((data || []).map(pkg => ({
          ...pkg,
          tests_included: (pkg.tests_included as unknown as TestItem[]) || []
        })));
      } catch (error) {
        console.error("Error fetching health packages:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchPackages();
  }, []);

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      
      <main className="flex-1 pt-20">
        <div className="container mx-auto px-4 py-8">
          <div className="flex flex-col sm:flex-row sm:items-center gap-4 mb-8">
            <Link to="/">
              <Button variant="ghost" size="icon" className="shrink-0">
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </Link>
            <div className="flex-1">
              <h1 className="text-2xl sm:text-3xl font-bold flex items-center gap-2 flex-wrap">
                <Package className="h-7 w-7 sm:h-8 sm:w-8 text-primary shrink-0" />
                <span>Health Packages</span>
              </h1>
              <p className="text-muted-foreground mt-1">
                Comprehensive health checkups at best prices
              </p>
            </div>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3, 4, 5, 6].map(i => (
                <Skeleton key={i} className="h-64 rounded-lg" />
              ))}
            </div>
          ) : packages.length === 0 ? (
            <div className="text-center py-12">
              <Package className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
              <h2 className="text-xl font-semibold mb-2">No Health Packages Available</h2>
              <p className="text-muted-foreground">Check back later for new packages.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {packages.map(pkg => (
                <Link
                  key={pkg.id}
                  to={`/labs/${pkg.lab?.slug || pkg.lab?.id}`}
                >
                  <Card className="h-full hover:shadow-lg transition-shadow overflow-hidden group">
                    <div className="bg-gradient-to-r from-primary/10 to-primary/5 p-4">
                      <div className="flex items-center gap-3">
                        {pkg.lab?.logo_url ? (
                          <img
                            src={pkg.lab.logo_url}
                            alt={pkg.lab.name}
                            className="h-10 w-10 rounded-lg object-contain bg-white p-1"
                          />
                        ) : (
                          <div className="h-10 w-10 rounded-lg bg-primary/20 flex items-center justify-center">
                            <Package className="h-5 w-5 text-primary" />
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <h3 className="font-semibold line-clamp-1">{pkg.name}</h3>
                            {pkg.is_featured && (
                              <Badge variant="secondary" className="text-xs shrink-0">
                                Featured
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground">{pkg.lab?.name}</p>
                        </div>
                      </div>
                    </div>

                    <CardContent className="p-4 space-y-4">
                      {pkg.description && (
                        <p className="text-sm text-muted-foreground line-clamp-2">
                          {pkg.description}
                        </p>
                      )}

                      <div className="flex flex-wrap gap-1">
                        {pkg.tests_included?.slice(0, 3).map((test, index) => (
                          <Badge key={index} variant="secondary" className="text-xs">
                            {test.name}
                          </Badge>
                        ))}
                        {(pkg.tests_included?.length || 0) > 3 && (
                          <Badge variant="outline" className="text-xs">
                            +{(pkg.tests_included?.length || 0) - 3} more
                          </Badge>
                        )}
                      </div>

                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Check className="h-4 w-4 text-green-500" />
                        <span>{pkg.tests_included?.length || 0} tests included</span>
                      </div>

                      <div className="pt-2 border-t">
                        <span className="text-xl font-bold text-primary">
                          Rs. {pkg.discounted_price.toLocaleString()}
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default HealthPackages;
