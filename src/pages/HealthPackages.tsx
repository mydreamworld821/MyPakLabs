import { useState, useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Package, Check, ArrowLeft, Search, X, SlidersHorizontal, Star } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";

interface Lab {
  id: string;
  name: string;
  slug: string;
  logo_url: string | null;
  rating?: number;
}

interface TestItem {
  name: string;
  details?: string;
}

interface HealthPackage {
  id: string;
  name: string;
  description: string | null;
  original_price: number;
  discount_percentage: number;
  discounted_price: number;
  tests_included: TestItem[];
  is_featured: boolean;
  lab?: Lab;
}

const HealthPackages = () => {
  const [packages, setPackages] = useState<HealthPackage[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedLab, setSelectedLab] = useState<string>("all");
  const [priceRange, setPriceRange] = useState<string>("all");
  const [sortBy, setSortBy] = useState<string>("featured");

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
            tests_included,
            is_featured,
            lab:labs(id, name, slug, logo_url, rating)
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

  // Get unique labs for filter
  const uniqueLabs = useMemo(() => {
    const labs = packages
      .filter(pkg => pkg.lab)
      .map(pkg => pkg.lab!)
      .filter((lab, index, self) => self.findIndex(l => l.id === lab.id) === index)
      .sort((a, b) => a.name.localeCompare(b.name));
    return labs;
  }, [packages]);

  // Filter and sort packages
  const filteredPackages = useMemo(() => {
    let result = [...packages];

    // Search filter (package name or lab name)
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        pkg =>
          pkg.name.toLowerCase().includes(query) ||
          pkg.lab?.name.toLowerCase().includes(query) ||
          pkg.description?.toLowerCase().includes(query)
      );
    }

    // Lab filter
    if (selectedLab !== "all") {
      result = result.filter(pkg => pkg.lab?.id === selectedLab);
    }

    // Price range filter
    if (priceRange !== "all") {
      switch (priceRange) {
        case "under-2000":
          result = result.filter(pkg => pkg.discounted_price < 2000);
          break;
        case "2000-5000":
          result = result.filter(pkg => pkg.discounted_price >= 2000 && pkg.discounted_price <= 5000);
          break;
        case "5000-10000":
          result = result.filter(pkg => pkg.discounted_price >= 5000 && pkg.discounted_price <= 10000);
          break;
        case "above-10000":
          result = result.filter(pkg => pkg.discounted_price > 10000);
          break;
      }
    }

    // Sorting
    switch (sortBy) {
      case "price-low":
        result.sort((a, b) => a.discounted_price - b.discounted_price);
        break;
      case "price-high":
        result.sort((a, b) => b.discounted_price - a.discounted_price);
        break;
      case "rating":
        result.sort((a, b) => (b.lab?.rating || 0) - (a.lab?.rating || 0));
        break;
      case "discount":
        result.sort((a, b) => b.discount_percentage - a.discount_percentage);
        break;
      case "featured":
      default:
        // Already sorted by featured in query
        break;
    }

    return result;
  }, [packages, searchQuery, selectedLab, priceRange, sortBy]);

  const clearFilters = () => {
    setSearchQuery("");
    setSelectedLab("all");
    setPriceRange("all");
    setSortBy("featured");
  };

  const hasActiveFilters = searchQuery || selectedLab !== "all" || priceRange !== "all" || sortBy !== "featured";

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      
      <main className="flex-1 pt-20">
        <div className="container mx-auto px-4 py-8">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-4 mb-6">
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

          {/* Search Bar */}
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search health packages by name, lab, or description..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 pr-10 h-12 text-base"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                <X className="h-5 w-5" />
              </button>
            )}
          </div>

          {/* Filters Row */}
          <div className="flex flex-col sm:flex-row gap-3 mb-6">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <SlidersHorizontal className="h-4 w-4" />
              <span className="hidden sm:inline">Filters:</span>
            </div>
            
            <div className="flex-1 grid grid-cols-2 sm:grid-cols-3 gap-3">
              {/* Lab Filter */}
              <Select value={selectedLab} onValueChange={setSelectedLab}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="All Labs" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Labs</SelectItem>
                  {uniqueLabs.map((lab) => (
                    <SelectItem key={lab.id} value={lab.id}>
                      {lab.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Price Range Filter */}
              <Select value={priceRange} onValueChange={setPriceRange}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Price Range" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Prices</SelectItem>
                  <SelectItem value="under-2000">Under Rs. 2,000</SelectItem>
                  <SelectItem value="2000-5000">Rs. 2,000 - 5,000</SelectItem>
                  <SelectItem value="5000-10000">Rs. 5,000 - 10,000</SelectItem>
                  <SelectItem value="above-10000">Above Rs. 10,000</SelectItem>
                </SelectContent>
              </Select>

              {/* Sort By */}
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-full col-span-2 sm:col-span-1">
                  <SelectValue placeholder="Sort By" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="featured">Featured First</SelectItem>
                  <SelectItem value="price-low">Price: Low to High</SelectItem>
                  <SelectItem value="price-high">Price: High to Low</SelectItem>
                  <SelectItem value="rating">Lab Rating</SelectItem>
                  <SelectItem value="discount">Best Discount</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {hasActiveFilters && (
              <Button variant="outline" size="sm" onClick={clearFilters} className="shrink-0">
                <X className="h-4 w-4 mr-1" />
                Clear All
              </Button>
            )}
          </div>

          {/* Results Count */}
          {!loading && (
            <p className="text-sm text-muted-foreground mb-4">
              Showing {filteredPackages.length} of {packages.length} packages
              {searchQuery && ` for "${searchQuery}"`}
            </p>
          )}

          {/* Package Grid */}
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3, 4, 5, 6].map(i => (
                <Skeleton key={i} className="h-64 rounded-lg" />
              ))}
            </div>
          ) : filteredPackages.length === 0 ? (
            <div className="text-center py-12">
              <Package className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
              <h2 className="text-xl font-semibold mb-2">
                {hasActiveFilters ? "No Packages Found" : "No Health Packages Available"}
              </h2>
              <p className="text-muted-foreground mb-4">
                {hasActiveFilters 
                  ? "Try adjusting your search or filters." 
                  : "Check back later for new packages."}
              </p>
              {hasActiveFilters && (
                <Button variant="outline" onClick={clearFilters}>
                  Clear All Filters
                </Button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredPackages.map(pkg => (
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
                          <div className="flex items-center gap-2">
                            <p className="text-sm text-muted-foreground">{pkg.lab?.name}</p>
                            {pkg.lab?.rating && pkg.lab.rating > 0 && (
                              <span className="flex items-center gap-0.5 text-xs text-amber-600">
                                <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                                {pkg.lab.rating.toFixed(1)}
                              </span>
                            )}
                          </div>
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

                      <div className="pt-2 border-t flex items-center gap-2">
                        <span className="text-xl font-bold text-primary">
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
