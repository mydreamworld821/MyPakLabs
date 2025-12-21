import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import LabCard from "@/components/labs/LabCard";
import { labs } from "@/data/mockData";
import { Search, SlidersHorizontal, MapPin, Building2 } from "lucide-react";

const Labs = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCity, setSelectedCity] = useState("all");
  const [sortBy, setSortBy] = useState("discount");

  const cities = [...new Set(labs.map((lab) => lab.city))];

  const filteredLabs = labs
    .filter((lab) => {
      const matchesSearch =
        lab.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        lab.city.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCity = selectedCity === "all" || lab.city === selectedCity;
      return matchesSearch && matchesCity;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case "discount":
          return b.discount - a.discount;
        case "rating":
          return b.rating - a.rating;
        case "name":
          return a.name.localeCompare(b.name);
        default:
          return 0;
      }
    });

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      {/* Header */}
      <section className="pt-24 pb-8 md:pt-28 md:pb-12 gradient-hero relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10" />
        <div className="container mx-auto px-4 relative">
          <div className="max-w-2xl">
            <Badge className="bg-primary-foreground/10 text-primary-foreground border-0 mb-4">
              <Building2 className="w-3 h-3 mr-1" />
              {labs.length} Partner Labs
            </Badge>
            <h1 className="text-3xl md:text-4xl font-bold text-primary-foreground mb-3">
              Browse Diagnostic Labs
            </h1>
            <p className="text-primary-foreground/80">
              Find the best discounts from top-rated labs across Pakistan
            </p>
          </div>
        </div>
      </section>

      {/* Filters */}
      <section className="py-6 border-b border-border sticky top-16 bg-background/95 backdrop-blur z-40">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <Input
                placeholder="Search labs by name or city..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 h-12"
              />
            </div>

            {/* City Filter */}
            <Select value={selectedCity} onValueChange={setSelectedCity}>
              <SelectTrigger className="w-full md:w-48 h-12">
                <MapPin className="w-4 h-4 mr-2 text-muted-foreground" />
                <SelectValue placeholder="All Cities" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Cities</SelectItem>
                {cities.map((city) => (
                  <SelectItem key={city} value={city}>
                    {city}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Sort */}
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-full md:w-48 h-12">
                <SlidersHorizontal className="w-4 h-4 mr-2 text-muted-foreground" />
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="discount">Highest Discount</SelectItem>
                <SelectItem value="rating">Best Rating</SelectItem>
                <SelectItem value="name">Name (A-Z)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </section>

      {/* Labs Grid */}
      <section className="py-8 md:py-12">
        <div className="container mx-auto px-4">
          {filteredLabs.length > 0 ? (
            <>
              <p className="text-sm text-muted-foreground mb-6">
                Showing {filteredLabs.length} lab{filteredLabs.length !== 1 ? "s" : ""}
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredLabs.map((lab) => (
                  <LabCard key={lab.id} lab={lab} />
                ))}
              </div>
            </>
          ) : (
            <div className="text-center py-16">
              <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
                <Building2 className="w-10 h-10 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-semibold mb-2">No labs found</h3>
              <p className="text-muted-foreground mb-4">
                Try adjusting your search or filters
              </p>
              <Button
                variant="outline"
                onClick={() => {
                  setSearchQuery("");
                  setSelectedCity("all");
                }}
              >
                Clear Filters
              </Button>
            </div>
          )}
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Labs;
