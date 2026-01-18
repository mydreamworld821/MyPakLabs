import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Package, Check, ArrowRight } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { useSectionConfig } from "@/hooks/useHomepageSections";

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
  const { config, loading: configLoading } = useSectionConfig("health_packages");

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
          .limit(config?.max_items || 6);

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

    if (!configLoading) {
      fetchPackages();
    }
  }, [config?.max_items, configLoading]);

  // Don't render if section is hidden
  if (!configLoading && config && !config.is_visible) {
    return null;
  }

  const getGridClasses = () => {
    if (!config) return "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3";
    
    const cols: Record<number, string> = {
      1: "grid-cols-1",
      2: "grid-cols-2",
      3: "grid-cols-3",
      4: "grid-cols-4",
      5: "grid-cols-5",
      6: "grid-cols-6",
    };
    
    return `grid ${cols[config.columns_mobile] || "grid-cols-1"} md:${cols[config.columns_tablet] || "grid-cols-2"} lg:${cols[config.columns_desktop] || "grid-cols-3"}`;
  };

  const getSectionStyle = (): React.CSSProperties => {
    if (!config) return {};
    return {
      paddingTop: `${config.section_padding_y}px`,
      paddingBottom: `${config.section_padding_y}px`,
      backgroundColor: config.background_color !== 'transparent' ? config.background_color : undefined,
      background: config.background_gradient || undefined,
    };
  };

  const getCardStyle = (): React.CSSProperties => {
    if (!config) return {};
    return {
      minHeight: config.card_height ? `${config.card_height}px` : undefined,
      borderRadius: `${config.card_border_radius}px`,
    };
  };

  if (loading || configLoading) {
    return (
      <section className="bg-muted/30" style={getSectionStyle()}>
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-2xl font-bold flex items-center gap-2">
                <Package className="h-6 w-6 text-primary" />
                {config?.title || "Health Packages"}
              </h2>
              <p className="text-muted-foreground">
                {config?.subtitle || "Comprehensive health checkups at best prices"}
              </p>
            </div>
          </div>
          <div className={getGridClasses()} style={{ gap: `${config?.items_gap || 24}px` }}>
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
    <section style={getSectionStyle()}>
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-2xl font-bold flex items-center gap-2" style={{ color: config?.text_color !== 'inherit' ? config?.text_color : undefined }}>
              <Package className="h-6 w-6 text-primary" />
              {config?.title || "Health Packages"}
            </h2>
            <p className="text-muted-foreground">
              {config?.subtitle || "Comprehensive health checkups at best prices"}
            </p>
          </div>
          <Link to="/health-packages">
            <Button variant="outline">
              View All
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
        </div>

        <div className={getGridClasses()} style={{ gap: `${config?.items_gap || 24}px` }}>
          {packages.map(pkg => (
            <Link
              key={pkg.id}
              to={`/labs/${pkg.lab?.slug || pkg.lab?.id}`}
            >
              <Card 
                className="h-full hover:shadow-lg transition-shadow overflow-hidden group"
                style={getCardStyle()}
              >
                <div 
                  className="p-4"
                  style={{ 
                    background: config?.accent_color 
                      ? `linear-gradient(to right, ${config.accent_color}15, ${config.accent_color}08)` 
                      : 'linear-gradient(to right, hsl(var(--primary) / 0.1), hsl(var(--primary) / 0.05))'
                  }}
                >
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
                    <span 
                      className="text-xl font-bold"
                      style={{ color: config?.accent_color || 'hsl(var(--primary))' }}
                    >
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
