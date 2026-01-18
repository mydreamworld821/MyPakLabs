import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Package, Check, ArrowRight } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

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

interface FeaturedPackage {
  id: string;
  name: string;
  description: string | null;
  discounted_price: number;
  tests_included: TestItem[];
  lab?: Lab;
}

const FeaturedHealthPackages = () => {
  const [packages, setPackages] = useState<FeaturedPackage[]>([]);
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
            lab:labs(id, name, slug, logo_url)
          `)
          .eq("is_featured", true)
          .eq("is_active", true)
          .order("featured_order", { ascending: true })
          .limit(6);

        if (error) throw error;
        setPackages((data || []).map(pkg => ({
          ...pkg,
          tests_included: (pkg.tests_included as unknown as TestItem[]) || []
        })));
      } catch (error) {
        console.error("Error fetching featured packages:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchPackages();
  }, []);

  if (loading) {
    return (
      <section className="py-12 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between mb-8">
            <div>
            <h2 className="text-2xl font-bold flex items-center gap-2">
              <Package className="h-6 w-6 text-primary" />
              Health Packages
            </h2>
              <p className="text-muted-foreground">
                Comprehensive health checkups at best prices
              </p>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map(i => (
              <Skeleton key={i} className="h-64 rounded-lg" />
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (packages.length === 0) {
    return null;
  }

  return (
    <section className="py-12 bg-muted/30">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-2xl font-bold flex items-center gap-2">
              <Package className="h-6 w-6 text-primary" />
              Health Packages
            </h2>
            <p className="text-muted-foreground">
              Comprehensive health checkups at best prices
            </p>
          </div>
          <Link to="/health-packages">
            <Button variant="outline">
              View All
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
        </div>

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
                    <div>
                      <h3 className="font-semibold line-clamp-1">{pkg.name}</h3>
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
      </div>
    </section>
  );
};

export default FeaturedHealthPackages;