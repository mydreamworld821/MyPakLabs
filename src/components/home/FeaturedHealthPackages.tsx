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

interface PackageTest {
  test_id: string;
  test_price: number;
  test?: { name: string };
}

interface FeaturedPackage {
  id: string;
  name: string;
  description: string | null;
  original_price: number;
  discount_percentage: number;
  discounted_price: number;
  lab?: Lab;
  package_tests?: PackageTest[];
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
            original_price,
            discount_percentage,
            discounted_price,
            lab:labs(id, name, slug, logo_url),
            package_tests(test_id, test_price, test:tests(name))
          `)
          .eq("is_featured", true)
          .eq("is_active", true)
          .order("featured_order", { ascending: true })
          .limit(6);

        if (error) throw error;
        setPackages(data || []);
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
                Featured Health Packages
              </h2>
              <p className="text-muted-foreground">
                Comprehensive health checkups at discounted prices
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
              Featured Health Packages
            </h2>
            <p className="text-muted-foreground">
              Comprehensive health checkups at discounted prices
            </p>
          </div>
          <Link to="/labs">
            <Button variant="outline">
              View All Labs
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {packages.map(pkg => {
            const savings = pkg.original_price - pkg.discounted_price;

            return (
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
                      {pkg.package_tests?.slice(0, 3).map(pt => (
                        <Badge key={pt.test_id} variant="secondary" className="text-xs">
                          {pt.test?.name}
                        </Badge>
                      ))}
                      {(pkg.package_tests?.length || 0) > 3 && (
                        <Badge variant="outline" className="text-xs">
                          +{(pkg.package_tests?.length || 0) - 3} more
                        </Badge>
                      )}
                    </div>

                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Check className="h-4 w-4 text-green-500" />
                      <span>{pkg.package_tests?.length || 0} tests included</span>
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xl font-bold text-primary">
                            Rs. {pkg.discounted_price.toLocaleString()}
                          </span>
                          <Badge variant="destructive" className="text-xs">
                            {pkg.discount_percentage}% OFF
                          </Badge>
                        </div>
                        <div className="flex items-center gap-2 text-xs">
                          <span className="text-muted-foreground line-through">
                            Rs. {pkg.original_price.toLocaleString()}
                          </span>
                          <span className="text-green-600 font-medium">
                            Save Rs. {savings.toLocaleString()}
                          </span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default FeaturedHealthPackages;
