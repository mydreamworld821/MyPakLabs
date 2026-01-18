import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Package, Check, ChevronDown, ChevronUp } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { cn } from "@/lib/utils";

interface TestItem {
  name: string;
  details?: string;
}

export interface HealthPackage {
  id: string;
  name: string;
  description: string | null;
  original_price: number;
  discount_percentage: number;
  discounted_price: number;
  tests_included: TestItem[];
  is_featured: boolean;
}

interface HealthPackagesSectionProps {
  labId: string;
  labName: string;
  selectedPackageIds?: string[];
  onSelectionChange?: (packages: HealthPackage[]) => void;
}

const HealthPackagesSection = ({
  labId,
  labName,
  selectedPackageIds = [],
  onSelectionChange,
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
            tests_included,
            is_featured
          `)
          .eq("lab_id", labId)
          .eq("is_active", true)
          .order("is_featured", { ascending: false })
          .order("featured_order", { ascending: true });

        if (error) throw error;
        setPackages((data || []).map(pkg => ({
          ...pkg,
          tests_included: (pkg.tests_included as unknown as TestItem[]) || []
        })));
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

  const togglePackageSelection = (pkg: HealthPackage) => {
    if (!onSelectionChange) return;
    
    const isSelected = selectedPackageIds.includes(pkg.id);
    let updatedPackages: HealthPackage[];
    
    if (isSelected) {
      updatedPackages = packages.filter(p => 
        selectedPackageIds.includes(p.id) && p.id !== pkg.id
      );
    } else {
      const currentlySelected = packages.filter(p => selectedPackageIds.includes(p.id));
      updatedPackages = [...currentlySelected, pkg];
    }
    
    onSelectionChange(updatedPackages);
  };

  if (loading) {
    return (
      <div className="space-y-4 mt-6">
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
    <div className="space-y-4 mt-6">
      <h2 className="text-xl font-semibold flex items-center gap-2">
        <Package className="h-5 w-5 text-primary" />
        Health Packages by {labName}
      </h2>
      <p className="text-sm text-muted-foreground">
        Select one or more packages to add to your order
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {packages.map(pkg => {
          const isExpanded = expandedPackages.has(pkg.id);
          const isSelected = selectedPackageIds.includes(pkg.id);

          return (
            <Card
              key={pkg.id}
              className={cn(
                "relative overflow-hidden transition-all cursor-pointer",
                isSelected ? "ring-2 ring-primary bg-primary/5" : "hover:border-primary/50",
                pkg.is_featured ? "border-primary/50" : ""
              )}
              onClick={() => togglePackageSelection(pkg)}
            >
              {pkg.is_featured && (
                <div className="absolute top-0 right-0">
                  <Badge className="rounded-none rounded-bl-lg bg-gradient-to-r from-yellow-500 to-orange-500">
                    ⭐ Featured
                  </Badge>
                </div>
              )}

              <CardHeader className="pb-2">
                <div className="flex items-start gap-3">
                  <Checkbox
                    checked={isSelected}
                    onCheckedChange={() => togglePackageSelection(pkg)}
                    className="mt-1 shrink-0"
                    onClick={(e) => e.stopPropagation()}
                  />
                  <div className="flex-1">
                    <CardTitle className="text-lg pr-16">{pkg.name}</CardTitle>
                    {pkg.description && (
                      <p className="text-sm text-muted-foreground mt-1">{pkg.description}</p>
                    )}
                  </div>
                </div>
              </CardHeader>

              <CardContent className="space-y-4">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-2xl font-bold text-primary">
                      Rs. {pkg.discounted_price.toLocaleString()}
                    </span>
                    {pkg.discount_percentage > 0 && (
                      <>
                        <span className="text-sm text-muted-foreground line-through">
                          Rs. {pkg.original_price.toLocaleString()}
                        </span>
                        <Badge variant="secondary" className="text-xs">
                          {pkg.discount_percentage}% OFF
                        </Badge>
                      </>
                    )}
                  </div>
                  {isSelected && (
                    <Badge variant="success" className="gap-1">
                      <Check className="h-3 w-3" />
                      Selected
                    </Badge>
                  )}
                </div>

                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Check className="h-4 w-4 text-green-500" />
                  <span>{pkg.tests_included?.length || 0} tests included</span>
                </div>

                <Collapsible 
                  open={isExpanded} 
                  onOpenChange={() => toggleExpanded(pkg.id)}
                >
                  <CollapsibleTrigger asChild onClick={(e) => e.stopPropagation()}>
                    <Button variant="ghost" size="sm" className="w-full justify-between">
                      <span>View included tests</span>
                      {isExpanded ? (
                        <ChevronUp className="h-4 w-4" />
                      ) : (
                        <ChevronDown className="h-4 w-4" />
                      )}
                    </Button>
                  </CollapsibleTrigger>
                  <CollapsibleContent className="mt-2" onClick={(e) => e.stopPropagation()}>
                    <div className="bg-muted/50 rounded-lg p-3 space-y-2 max-h-48 overflow-y-auto">
                      {pkg.tests_included?.map((test, index) => (
                        <div key={index} className="flex items-start gap-2 text-sm">
                          <Check className="h-3 w-3 text-green-500 mt-1 shrink-0" />
                          <div>
                            <span className="font-medium">{test.name}</span>
                            {test.details && (
                              <span className="text-muted-foreground ml-1">({test.details})</span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </CollapsibleContent>
                </Collapsible>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
};

export default HealthPackagesSection;