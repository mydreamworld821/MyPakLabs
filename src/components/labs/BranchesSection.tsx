import { useState, useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  MapPin,
  Phone,
  Clock,
  Mail,
  ExternalLink,
  Building2,
  Search,
  Map,
  X,
} from "lucide-react";

interface Branch {
  id: string;
  city: string;
  name: string;
  address: string;
  phone: string;
  email?: string;
  google_maps_url?: string;
  timing?: string;
}

interface BranchesSectionProps {
  branches: Branch[];
  labName: string;
}

const BranchesSection = ({ branches, labName }: BranchesSectionProps) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [showMap, setShowMap] = useState(false);

  // Filter branches based on search query
  const filteredBranches = useMemo(() => {
    if (!searchQuery.trim()) return branches;
    
    const query = searchQuery.toLowerCase();
    return branches.filter(
      (branch) =>
        branch.city.toLowerCase().includes(query) ||
        branch.name.toLowerCase().includes(query) ||
        branch.address?.toLowerCase().includes(query)
    );
  }, [branches, searchQuery]);

  // Get unique cities from filtered branches
  const cities = useMemo(() => {
    return [...new Set(filteredBranches.map((b) => b.city))];
  }, [filteredBranches]);

  // Generate Google Maps embed URL with all branch markers
  const mapEmbedUrl = useMemo(() => {
    // Create a search query with all branch addresses for a multi-location map
    const branchesWithMaps = branches.filter((b) => b.google_maps_url || b.address);
    if (branchesWithMaps.length === 0) return null;

    // Use the first branch's location or lab name for the map center
    const firstBranch = branchesWithMaps[0];
    const searchQuery = firstBranch.address 
      ? `${labName} ${firstBranch.city}` 
      : labName;
    
    return `https://www.google.com/maps/embed/v1/search?key=AIzaSyBFw0Qbyq9zTFTd-tUY6dZWTgaQzuU17R8&q=${encodeURIComponent(searchQuery)}&zoom=10`;
  }, [branches, labName]);

  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold text-base flex items-center gap-2">
            <Building2 className="w-4 h-4 text-primary" />
            Our Locations
            <Badge variant="secondary" className="text-xs">
              {branches.length}
            </Badge>
          </h3>
          {mapEmbedUrl && (
            <Button
              variant={showMap ? "default" : "outline"}
              size="sm"
              onClick={() => setShowMap(!showMap)}
              className="text-xs h-7"
            >
              <Map className="w-3 h-3 mr-1" />
              {showMap ? "Hide Map" : "View Map"}
            </Button>
          )}
        </div>

        {/* Map Preview */}
        {showMap && mapEmbedUrl && (
          <div className="mb-4 rounded-lg overflow-hidden border">
            <iframe
              src={mapEmbedUrl}
              width="100%"
              height="200"
              style={{ border: 0 }}
              allowFullScreen
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              title={`${labName} Locations Map`}
            />
            <div className="bg-muted/50 p-2 text-xs text-muted-foreground text-center">
              Click on individual branches below for exact locations
            </div>
          </div>
        )}

        {/* Search Input */}
        <div className="relative mb-3">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Search by city, branch name, or area..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-8 pr-8 h-9 text-sm"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Search Results Count */}
        {searchQuery && (
          <p className="text-xs text-muted-foreground mb-2">
            Found {filteredBranches.length} branch{filteredBranches.length !== 1 ? "es" : ""} 
            {cities.length > 0 && ` in ${cities.length} cit${cities.length !== 1 ? "ies" : "y"}`}
          </p>
        )}

        {/* Branches List */}
        {filteredBranches.length === 0 ? (
          <div className="text-center py-6 text-muted-foreground">
            <MapPin className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No branches found matching "{searchQuery}"</p>
            <Button
              variant="link"
              size="sm"
              onClick={() => setSearchQuery("")}
              className="mt-1"
            >
              Clear search
            </Button>
          </div>
        ) : (
          <Accordion type="single" collapsible className="w-full" defaultValue={cities[0]}>
            {cities.map((city) => {
              const cityBranches = filteredBranches.filter((b) => b.city === city);
              return (
                <AccordionItem key={city} value={city} className="border-b last:border-b-0">
                  <AccordionTrigger className="py-2 text-sm hover:no-underline">
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-primary" />
                      <span>{city}</span>
                      <Badge variant="secondary" className="ml-1 text-xs">
                        {cityBranches.length}
                      </Badge>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="pb-3">
                    <div className="space-y-3">
                      {cityBranches.map((branch) => (
                        <div
                          key={branch.id}
                          className="bg-muted/50 rounded-lg p-3 space-y-2"
                        >
                          <p className="font-medium text-sm">{branch.name}</p>
                          {branch.address && (
                            <p className="text-xs text-muted-foreground">
                              {branch.address}
                            </p>
                          )}
                          <div className="flex flex-wrap gap-2">
                            {branch.phone && (
                              <a
                                href={`tel:${branch.phone}`}
                                className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
                              >
                                <Phone className="w-3 h-3" />
                                {branch.phone}
                              </a>
                            )}
                            {branch.email && (
                              <a
                                href={`mailto:${branch.email}`}
                                className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
                              >
                                <Mail className="w-3 h-3" />
                                {branch.email}
                              </a>
                            )}
                          </div>
                          {branch.timing && (
                            <p className="text-xs text-muted-foreground flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {branch.timing}
                            </p>
                          )}
                          {branch.google_maps_url && (
                            <a
                              href={branch.google_maps_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
                            >
                              <ExternalLink className="w-3 h-3" />
                              View on Google Maps
                            </a>
                          )}
                        </div>
                      ))}
                    </div>
                  </AccordionContent>
                </AccordionItem>
              );
            })}
          </Accordion>
        )}
      </CardContent>
    </Card>
  );
};

export default BranchesSection;
