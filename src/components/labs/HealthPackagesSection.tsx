import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Package, Check, ChevronDown, ChevronUp } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

interface Test {
  id: string;
  name: string;
  category: string | null;
}

interface PackageTest {
  test_id: string;
  test_price: number;
  test?: Test;
}

interface HealthPackage {
  id: string;
  name: string;
  description: string | null;
  original_price: number;
  discount_percentage: number;
  discounted_price: number;
  is_featured: boolean;
  package_tests?: PackageTest[];
}

interface HealthPackagesSectionProps {
  labId: string;
  labName: string;
  onSelectPackage?: (pkg: HealthPackage) => void;
  selectedPackageId?: string | null;
}

const HealthPackagesSection = ({
  labId,
  labName,
  onSelectPackage,
  selectedPackageId,
}: HealthPackagesSectionProps) => {
  const [packages, setPackages] = useState<HealthPackage[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedPackages, setExpandedPackages] = useState<Set<string>>(new Set());

  useEffect(() => {
    const fetchPackages = async () => {
      setLoading(true);
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
            is_featured,
            package_tests(test_id, test_price, test:tests(id, name, category))
          `)
          .eq("lab_id", labId)
          .eq("is_active", true)
          .order("is_featured", { ascending: false })
          .order("featured_order", { ascending: true });

        if (error) throw error;
        setPackages(data || []);
      } catch (error) {
        console.error("Error fetching packages:", error);
      } finally {
        setLoading(false);
      }
    };

    if (labId) {
      fetchPackages();
    }
  }, [labId]);

  const toggleExpanded = (packageId: string) => {
    const newExpanded = new Set(expandedPackages);
    if (newExpanded.has(packageId)) {
      newExpanded.delete(packageId);
    } else {
      newExpanded.add(packageId);
    }
    setExpandedPackages(newExpanded);
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <h2 className="text-xl font-semibold flex items-center gap-2">
          <Package className="h-5 w-5" />
          Health Packages
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2].map(i => (
            <Skeleton key={i} className="h-48 rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  if (packages.length === 0) {
    return null;
  }

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold flex items-center gap-2">
        <Package className="h-5 w-5 text-primary" />
        Health Packages by {labName}
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {packages.map(pkg => {
          const isExpanded = expandedPackages.has(pkg.id);
          const isSelected = selectedPackageId === pkg.id;
          const savings = pkg.original_price - pkg.discounted_price;

          return (
            <Card
              key={pkg.id}
              className={`relative overflow-hidden transition-all ${
                isSelected ? "ring-2 ring-primary" : ""
              } ${pkg.is_featured ? "border-primary/50" : ""}`}
            >
              {pkg.is_featured && (
                <div className="absolute top-0 right-0">
                  <Badge className="rounded-none rounded-bl-lg bg-gradient-to-r from-yellow-500 to-orange-500">
                    ⭐ Featured
                  </Badge>
                </div>
              )}

              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-start justify-between">
                  <span className="pr-16">{pkg.name}</span>
                </CardTitle>
                {pkg.description && (
                  <p className="text-sm text-muted-foreground">{pkg.description}</p>
                )}
              </CardHeader>

              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-2xl font-bold text-primary">
                        Rs. {pkg.discounted_price.toLocaleString()}
                      </span>
                      <Badge variant="destructive" className="text-xs">
                        {pkg.discount_percentage}% OFF
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <span className="line-through">Rs. {pkg.original_price.toLocaleString()}</span>
                      <span className="text-green-600 font-medium">
                        Save Rs. {savings.toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Check className="h-4 w-4 text-green-500" />
                  <span>{pkg.package_tests?.length || 0} tests included</span>
                </div>

                <Collapsible open={isExpanded} onOpenChange={() => toggleExpanded(pkg.id)}>
                  <CollapsibleTrigger asChild>
                    <Button variant="ghost" size="sm" className="w-full justify-between">
                      <span>View included tests</span>
                      {isExpanded ? (
                        <ChevronUp className="h-4 w-4" />
                      ) : (
                        <ChevronDown className="h-4 w-4" />
                      )}
                    </Button>
                  </CollapsibleTrigger>
                  <CollapsibleContent className="mt-2">
                    <div className="bg-muted/50 rounded-lg p-3 space-y-2 max-h-48 overflow-y-auto">
                      {pkg.package_tests?.map(pt => (
                        <div key={pt.test_id} className="flex items-center justify-between text-sm">
                          <div className="flex items-center gap-2">
                            <Check className="h-3 w-3 text-green-500" />
                            <span>{pt.test?.name}</span>
                          </div>
                          <span className="text-muted-foreground">
                            Rs. {pt.test_price.toLocaleString()}
                          </span>
                        </div>
                      ))}
                    </div>
                  </CollapsibleContent>
                </Collapsible>

                {onSelectPackage && (
                  <Button
                    className="w-full"
                    variant={isSelected ? "secondary" : "default"}
                    onClick={() => onSelectPackage(pkg)}
                  >
                    {isSelected ? "Selected" : "Select Package"}
                  </Button>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
};

export default HealthPackagesSection;
