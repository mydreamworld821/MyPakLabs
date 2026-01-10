import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import {
  Search,
  MapPin,
  User,
  Stethoscope,
  Scissors,
  TestTube,
  FlaskConical,
  Loader2,
  X,
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface SearchResult {
  id: string;
  name: string;
  type: "doctor" | "specialization" | "surgery" | "test" | "lab";
  slug?: string;
  subtitle?: string;
}

interface GlobalSearchProps {
  className?: string;
}

const GlobalSearch = ({ className }: GlobalSearchProps) => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCity, setSelectedCity] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const cities = [
    "Karachi",
    "Lahore",
    "Islamabad",
    "Rawalpindi",
    "Faisalabad",
    "Multan",
    "Peshawar",
    "Quetta",
  ];

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchQuery.trim().length >= 2) {
        performSearch(searchQuery.trim());
      } else {
        setResults([]);
        setShowDropdown(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  const performSearch = async (query: string) => {
    setLoading(true);
    try {
      const searchTerm = `%${query}%`;
      const allResults: SearchResult[] = [];

      // Search doctors
      const { data: doctors } = await supabase
        .from("doctors")
        .select("id, full_name, qualification, city")
        .eq("status", "approved")
        .ilike("full_name", searchTerm)
        .limit(5);

      if (doctors) {
        doctors.forEach((doc) => {
          allResults.push({
            id: doc.id,
            name: doc.full_name,
            type: "doctor",
            subtitle: `${doc.qualification || "Doctor"}${doc.city ? ` • ${doc.city}` : ""}`,
          });
        });
      }

      // Search specializations
      const { data: specializations } = await supabase
        .from("doctor_specializations")
        .select("id, name, slug")
        .eq("is_active", true)
        .ilike("name", searchTerm)
        .limit(5);

      if (specializations) {
        specializations.forEach((spec) => {
          allResults.push({
            id: spec.id,
            name: spec.name,
            type: "specialization",
            slug: spec.slug,
            subtitle: "Medical Specialization",
          });
        });
      }

      // Search surgeries
      const { data: surgeries } = await supabase
        .from("surgeries")
        .select("id, name, slug, discount_percentage")
        .eq("is_active", true)
        .ilike("name", searchTerm)
        .limit(5);

      if (surgeries) {
        surgeries.forEach((surgery) => {
          allResults.push({
            id: surgery.id,
            name: surgery.name,
            type: "surgery",
            slug: surgery.slug,
            subtitle: surgery.discount_percentage
              ? `${surgery.discount_percentage}% Discount Available`
              : "Surgical Procedure",
          });
        });
      }

      // Search tests
      const { data: tests } = await supabase
        .from("tests")
        .select("id, name, slug, category")
        .eq("is_active", true)
        .ilike("name", searchTerm)
        .limit(5);

      if (tests) {
        tests.forEach((test) => {
          allResults.push({
            id: test.id,
            name: test.name,
            type: "test",
            slug: test.slug,
            subtitle: test.category || "Lab Test",
          });
        });
      }

      // Search labs
      const { data: labs } = await supabase
        .from("labs")
        .select("id, name, slug, discount_percentage")
        .eq("is_active", true)
        .ilike("name", searchTerm)
        .limit(5);

      if (labs) {
        labs.forEach((lab) => {
          allResults.push({
            id: lab.id,
            name: lab.name,
            type: "lab",
            slug: lab.slug,
            subtitle: lab.discount_percentage
              ? `Up to ${lab.discount_percentage}% Discount`
              : "Diagnostic Laboratory",
          });
        });
      }

      setResults(allResults);
      setShowDropdown(allResults.length > 0);
    } catch (error) {
      console.error("Search error:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleResultClick = (result: SearchResult) => {
    setShowDropdown(false);
    setSearchQuery("");

    switch (result.type) {
      case "doctor":
        navigate(`/doctor/${result.id}`);
        break;
      case "specialization":
        navigate(`/find-doctors?specialization=${result.slug}`);
        break;
      case "surgery":
        navigate(`/surgery/${result.slug}`);
        break;
      case "test":
        navigate(`/labs?test=${result.slug}`);
        break;
      case "lab":
        navigate(`/lab/${result.slug}`);
        break;
    }
  };

  const getIcon = (type: SearchResult["type"]) => {
    switch (type) {
      case "doctor":
        return <User className="w-4 h-4" />;
      case "specialization":
        return <Stethoscope className="w-4 h-4" />;
      case "surgery":
        return <Scissors className="w-4 h-4" />;
      case "test":
        return <TestTube className="w-4 h-4" />;
      case "lab":
        return <FlaskConical className="w-4 h-4" />;
    }
  };

  const getTypeBadge = (type: SearchResult["type"]) => {
    const badges = {
      doctor: { label: "Doctor", color: "bg-blue-100 text-blue-700" },
      specialization: { label: "Specialty", color: "bg-purple-100 text-purple-700" },
      surgery: { label: "Surgery", color: "bg-green-100 text-green-700" },
      test: { label: "Test", color: "bg-orange-100 text-orange-700" },
      lab: { label: "Lab", color: "bg-primary/10 text-primary" },
    };
    return badges[type];
  };

  const handleSearch = () => {
    if (searchQuery.trim()) {
      navigate(`/labs?search=${encodeURIComponent(searchQuery)}`);
      setShowDropdown(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSearch();
    }
    if (e.key === "Escape") {
      setShowDropdown(false);
    }
  };

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      <div className="flex flex-col sm:flex-row gap-2 bg-white rounded-xl p-2 shadow-2xl">
        {/* City Selector */}
        <div className="flex items-center gap-2 px-3 py-2 sm:border-r border-gray-200">
          <MapPin className="w-5 h-5 text-primary" />
          <Select value={selectedCity} onValueChange={setSelectedCity}>
            <SelectTrigger className="border-0 shadow-none bg-transparent min-w-[120px] h-10 focus:ring-0 text-gray-700 font-medium">
              <SelectValue placeholder="Select City" />
            </SelectTrigger>
            <SelectContent>
              {cities.map((city) => (
                <SelectItem key={city} value={city}>
                  {city}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Search Input */}
        <div className="flex-1 flex items-center gap-2 relative">
          {loading ? (
            <Loader2 className="w-5 h-5 text-gray-400 ml-2 animate-spin" />
          ) : (
            <Search className="w-5 h-5 text-gray-400 ml-2" />
          )}
          <Input
            ref={inputRef}
            type="text"
            placeholder="Search doctors, surgeries, tests, labs..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={handleKeyPress}
            onFocus={() => {
              if (results.length > 0) setShowDropdown(true);
            }}
            className="border-0 shadow-none bg-transparent focus-visible:ring-0 text-gray-700 placeholder:text-gray-400 h-10 text-base"
          />
          {searchQuery && (
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 shrink-0"
              onClick={() => {
                setSearchQuery("");
                setResults([]);
                setShowDropdown(false);
              }}
            >
              <X className="w-4 h-4" />
            </Button>
          )}
          <Button onClick={handleSearch} size="lg" className="shrink-0 px-6 rounded-lg">
            <Search className="w-4 h-4 mr-2" />
            Search
          </Button>
        </div>
      </div>

      {/* Search Results Dropdown */}
      {showDropdown && results.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-2xl border border-gray-100 overflow-hidden z-50 max-h-[400px] overflow-y-auto">
          <div className="p-2">
            <p className="text-xs text-muted-foreground px-3 py-2">
              Found {results.length} result{results.length !== 1 ? "s" : ""}
            </p>
            {results.map((result) => {
              const badge = getTypeBadge(result.type);
              return (
                <button
                  key={`${result.type}-${result.id}`}
                  onClick={() => handleResultClick(result)}
                  className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-muted/50 rounded-lg transition-colors text-left"
                >
                  <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center shrink-0">
                    {getIcon(result.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-sm truncate">
                        {result.name}
                      </span>
                      <Badge className={`text-[10px] px-1.5 py-0 ${badge.color}`}>
                        {badge.label}
                      </Badge>
                    </div>
                    {result.subtitle && (
                      <p className="text-xs text-muted-foreground truncate">
                        {result.subtitle}
                      </p>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default GlobalSearch;
