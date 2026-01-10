import { useState, useEffect, useRef, useCallback } from "react";
import { createPortal } from "react-dom";
import { useNavigate } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import useCities from "@/hooks/useCities";
import {
  Search,
  MapPin,
  User,
  Stethoscope,
  Scissors,
  TestTube,
  FlaskConical,
  Building2,
  Loader2,
  X,
  Heart,
  Mic,
  MicOff,
  Clock,
  Trash2,
  TrendingUp,
  Sparkles,
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
  type: "doctor" | "specialization" | "surgery" | "test" | "lab" | "hospital" | "city" | "nurse";
  slug?: string;
  subtitle?: string;
}

interface RecentSearch {
  query: string;
  timestamp: number;
}

interface GlobalSearchProps {
  className?: string;
}

const RECENT_SEARCHES_KEY = "mypaklabs_recent_searches";
const MAX_RECENT_SEARCHES = 5;

// Popular/trending search suggestions
const TRENDING_SUGGESTIONS = [
  { text: "Blood Test", type: "test" as const },
  { text: "Cardiologist", type: "specialization" as const },
  { text: "COVID Test", type: "test" as const },
  { text: "Home Nursing", type: "nurse" as const },
  { text: "X-Ray", type: "test" as const },
  { text: "General Physician", type: "specialization" as const },
  { text: "Diabetes Test", type: "test" as const },
  { text: "Dentist", type: "specialization" as const },
];

const POPULAR_CATEGORIES = [
  { text: "Doctors", icon: "doctor", route: "/find-doctors" },
  { text: "Nurses", icon: "nurse", route: "/find-nurses" },
  { text: "Lab Tests", icon: "test", route: "/labs" },
  { text: "Hospitals", icon: "hospital", route: "/hospitals" },
  { text: "Surgeries", icon: "surgery", route: "/surgeries" },
];

const GlobalSearch = ({ className }: GlobalSearchProps) => {
  const navigate = useNavigate();
  const { cities: dbCities, provinces, loading: citiesLoading } = useCities();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCity, setSelectedCity] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [dropdownPos, setDropdownPos] = useState<{ top: number; left: number; width: number } | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const dropdownMenuRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  
  // Voice search state
  const [isListening, setIsListening] = useState(false);
  const [voiceSupported, setVoiceSupported] = useState(false);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const recognitionRef = useRef<any>(null);
  
  // Recent searches state
  const [recentSearches, setRecentSearches] = useState<RecentSearch[]>([]);
  const [showRecent, setShowRecent] = useState(false);
  
  // Autocomplete suggestions state
  const [autocompleteSuggestions, setAutocompleteSuggestions] = useState<string[]>([]);

  // Check for Web Speech API support
  useEffect(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const SpeechRecognitionAPI = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognitionAPI) {
      setVoiceSupported(true);
      recognitionRef.current = new SpeechRecognitionAPI();
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = true;
      recognitionRef.current.lang = 'en-US';
      
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      recognitionRef.current.onresult = (event: any) => {
        const transcript = Array.from(event.results)
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          .map((result: any) => result[0].transcript)
          .join('');
        setSearchQuery(transcript);
      };
      
      recognitionRef.current.onend = () => {
        setIsListening(false);
      };
      
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      recognitionRef.current.onerror = (event: any) => {
        console.error('Speech recognition error:', event.error);
        setIsListening(false);
      };
    }
    
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.abort();
      }
    };
  }, []);

  // Load recent searches from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem(RECENT_SEARCHES_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as RecentSearch[];
        setRecentSearches(parsed);
      }
    } catch (error) {
      console.error('Error loading recent searches:', error);
    }
  }, []);

  // Save recent searches to localStorage
  const saveRecentSearch = useCallback((query: string) => {
    if (!query.trim()) return;
    
    const newSearch: RecentSearch = {
      query: query.trim(),
      timestamp: Date.now(),
    };
    
    setRecentSearches(prev => {
      // Remove duplicate if exists
      const filtered = prev.filter(s => s.query.toLowerCase() !== query.toLowerCase());
      // Add new search at the beginning
      const updated = [newSearch, ...filtered].slice(0, MAX_RECENT_SEARCHES);
      // Save to localStorage
      try {
        localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(updated));
      } catch (error) {
        console.error('Error saving recent searches:', error);
      }
      return updated;
    });
  }, []);

  const clearRecentSearches = useCallback(() => {
    setRecentSearches([]);
    try {
      localStorage.removeItem(RECENT_SEARCHES_KEY);
    } catch (error) {
      console.error('Error clearing recent searches:', error);
    }
  }, []);

  const removeRecentSearch = useCallback((query: string) => {
    setRecentSearches(prev => {
      const updated = prev.filter(s => s.query !== query);
      try {
        localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(updated));
      } catch (error) {
        console.error('Error updating recent searches:', error);
      }
      return updated;
    });
  }, []);

  // Toggle voice search
  const toggleVoiceSearch = useCallback(() => {
    if (!recognitionRef.current) return;
    
    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      try {
        recognitionRef.current.start();
        setIsListening(true);
      } catch (error) {
        console.error('Error starting speech recognition:', error);
      }
    }
  }, [isListening]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      const inSearch = dropdownRef.current?.contains(target);
      const inMenu = dropdownMenuRef.current?.contains(target);
      if (!inSearch && !inMenu) {
        setShowDropdown(false);
        setShowRecent(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Keep dropdown positioned above everything (fixed to viewport)
  useEffect(() => {
    const updatePos = () => {
      const el = dropdownRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      setDropdownPos({
        top: rect.bottom + 8,
        left: rect.left,
        width: rect.width,
      });
    };

    if (showDropdown || showRecent) {
      updatePos();
      window.addEventListener("scroll", updatePos, true);
      window.addEventListener("resize", updatePos);
      return () => {
        window.removeEventListener("scroll", updatePos, true);
        window.removeEventListener("resize", updatePos);
      };
    }
  }, [showDropdown, showRecent, results.length, searchQuery]);

  // Generate autocomplete suggestions based on query
  const generateAutocompleteSuggestions = useCallback((query: string) => {
    if (!query.trim()) {
      setAutocompleteSuggestions([]);
      return;
    }
    
    const queryLower = query.toLowerCase();
    const suggestions: string[] = [];
    
    // Match from trending suggestions
    TRENDING_SUGGESTIONS.forEach(item => {
      if (item.text.toLowerCase().includes(queryLower)) {
        suggestions.push(item.text);
      }
    });
    
    // Match from recent searches
    recentSearches.forEach(recent => {
      if (recent.query.toLowerCase().includes(queryLower) && !suggestions.includes(recent.query)) {
        suggestions.push(recent.query);
      }
    });
    
    // Add common medical terms that match
    const commonTerms = [
      "Blood Test", "CBC Test", "Thyroid Test", "Liver Function Test", "Kidney Function Test",
      "Sugar Test", "Cholesterol Test", "Vitamin D Test", "HbA1c Test", "Urine Test",
      "General Physician", "Cardiologist", "Dermatologist", "Gynecologist", "Pediatrician",
      "Orthopedic", "Neurologist", "Psychiatrist", "ENT Specialist", "Ophthalmologist",
      "Home Nursing", "ICU Nurse", "Elder Care", "Post Surgery Care", "Wound Care",
      "X-Ray", "MRI Scan", "CT Scan", "Ultrasound", "ECG",
    ];
    
    commonTerms.forEach(term => {
      if (term.toLowerCase().includes(queryLower) && !suggestions.includes(term)) {
        suggestions.push(term);
      }
    });
    
    setAutocompleteSuggestions(suggestions.slice(0, 5));
  }, [recentSearches]);

  // Debounced search - also trigger when city changes
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchQuery.trim().length >= 2) {
        performSearch(searchQuery.trim());
        generateAutocompleteSuggestions(searchQuery.trim());
        setShowRecent(false);
      } else if (searchQuery.trim().length === 1) {
        generateAutocompleteSuggestions(searchQuery.trim());
        setResults([]);
        setShowDropdown(false);
      } else {
        setResults([]);
        setAutocompleteSuggestions([]);
        setShowDropdown(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery, selectedCity, generateAutocompleteSuggestions]);

  const performSearch = async (query: string) => {
    setLoading(true);
    try {
      // Split query into words for flexible matching (e.g., "aqib" matches "Muhammad Aqib")
      const queryWords = query.toLowerCase().split(/\s+/).filter(w => w.length > 0);
      const searchTerm = `%${query}%`;
      const allResults: SearchResult[] = [];
      const cityFilter = selectedCity && selectedCity !== "all" ? selectedCity : null;

      // Search cities from local state (already fetched)
      const matchingCities = dbCities.filter(city => {
        const cityLower = city.name.toLowerCase();
        return queryWords.some(word => cityLower.includes(word));
      });
      matchingCities.slice(0, 3).forEach(city => {
        const province = provinces.find(p => p.id === city.province_id);
        allResults.push({
          id: city.id,
          name: city.name,
          type: "city",
          subtitle: province?.name || "City",
        });
      });

      // Search doctors - use OR for each word to match partial names
      // e.g., "aqib" will match "Muhammad Aqib"
      let doctorsQuery = supabase
        .from("doctors")
        .select("id, full_name, qualification, city")
        .eq("status", "approved")
        .ilike("full_name", searchTerm)
        .limit(5);
      
      if (cityFilter) {
        doctorsQuery = doctorsQuery.eq("city", cityFilter);
      }
      
      const { data: doctors } = await doctorsQuery;
      
      // Also search with individual words for better matching
      const additionalDoctorIds = new Set<string>();
      if (queryWords.length > 0) {
        for (const word of queryWords) {
          if (word.length >= 2) {
            let wordQuery = supabase
              .from("doctors")
              .select("id, full_name, qualification, city")
              .eq("status", "approved")
              .ilike("full_name", `%${word}%`)
              .limit(5);
            
            if (cityFilter) {
              wordQuery = wordQuery.eq("city", cityFilter);
            }
            
            const { data: wordDoctors } = await wordQuery;
            if (wordDoctors) {
              wordDoctors.forEach(doc => {
                if (!doctors?.find(d => d.id === doc.id)) {
                  additionalDoctorIds.add(doc.id);
                  allResults.push({
                    id: doc.id,
                    name: doc.full_name,
                    type: "doctor",
                    subtitle: `${doc.qualification || "Doctor"}${doc.city ? ` • ${doc.city}` : ""}`,
                  });
                }
              });
            }
          }
        }
      }

      if (doctors) {
        doctors.forEach((doc) => {
          if (!additionalDoctorIds.has(doc.id)) {
            allResults.push({
              id: doc.id,
              name: doc.full_name,
              type: "doctor",
              subtitle: `${doc.qualification || "Doctor"}${doc.city ? ` • ${doc.city}` : ""}`,
            });
          }
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

      // Search labs (with optional city filter via cities array)
      let labsQuery = supabase
        .from("labs")
        .select("id, name, slug, discount_percentage, cities")
        .eq("is_active", true)
        .ilike("name", searchTerm)
        .limit(5);
      
      const { data: labs } = await labsQuery;

      if (labs) {
        labs.forEach((lab) => {
          // Filter by city if selected
          if (cityFilter && lab.cities && !lab.cities.includes(cityFilter)) {
            return;
          }
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

      // Search hospitals (with optional city filter)
      let hospitalsQuery = supabase
        .from("hospitals")
        .select("id, name, slug, city")
        .eq("is_active", true)
        .ilike("name", searchTerm)
        .limit(5);
      
      if (cityFilter) {
        hospitalsQuery = hospitalsQuery.eq("city", cityFilter);
      }
      
      const { data: hospitals } = await hospitalsQuery;

      if (hospitals) {
        hospitals.forEach((hospital) => {
          allResults.push({
            id: hospital.id,
            name: hospital.name,
            type: "hospital",
            slug: hospital.slug,
            subtitle: hospital.city || "Hospital",
          });
        });
      }

      // Search nurses - use flexible word matching like doctors
      let nursesQuery = supabase
        .from("nurses")
        .select("id, full_name, qualification, city, services_offered")
        .eq("status", "approved")
        .ilike("full_name", searchTerm)
        .limit(5);
      
      if (cityFilter) {
        nursesQuery = nursesQuery.eq("city", cityFilter);
      }
      
      const { data: nurses } = await nursesQuery;
      
      // Also search with individual words for better nurse matching
      const additionalNurseIds = new Set<string>();
      if (queryWords.length > 0) {
        for (const word of queryWords) {
          if (word.length >= 2) {
            let wordQuery = supabase
              .from("nurses")
              .select("id, full_name, qualification, city, services_offered")
              .eq("status", "approved")
              .ilike("full_name", `%${word}%`)
              .limit(5);
            
            if (cityFilter) {
              wordQuery = wordQuery.eq("city", cityFilter);
            }
            
            const { data: wordNurses } = await wordQuery;
            if (wordNurses) {
              wordNurses.forEach(nurse => {
                if (!nurses?.find(n => n.id === nurse.id)) {
                  additionalNurseIds.add(nurse.id);
                  allResults.push({
                    id: nurse.id,
                    name: nurse.full_name,
                    type: "nurse",
                    subtitle: `${nurse.qualification || "Nurse"}${nurse.city ? ` • ${nurse.city}` : ""}`,
                  });
                }
              });
            }
          }
        }
      }

      if (nurses) {
        nurses.forEach((nurse) => {
          if (!additionalNurseIds.has(nurse.id)) {
            allResults.push({
              id: nurse.id,
              name: nurse.full_name,
              type: "nurse",
              subtitle: `${nurse.qualification || "Nurse"}${nurse.city ? ` • ${nurse.city}` : ""}`,
            });
          }
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
    // Save to recent searches
    saveRecentSearch(result.name);
    
    setShowDropdown(false);
    setShowRecent(false);
    setSearchQuery("");

    switch (result.type) {
      case "city":
        navigate(`/find-doctors?city=${result.name}`);
        break;
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
      case "hospital":
        navigate(`/hospital/${result.slug}`);
        break;
      case "nurse":
        navigate(`/nurse/${result.id}`);
        break;
    }
  };

  const handleRecentSearchClick = (query: string) => {
    setSearchQuery(query);
    setShowRecent(false);
    inputRef.current?.focus();
  };

  const getIcon = (type: SearchResult["type"]) => {
    switch (type) {
      case "city":
        return <MapPin className="w-4 h-4" />;
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
      case "hospital":
        return <Building2 className="w-4 h-4" />;
      case "nurse":
        return <Heart className="w-4 h-4" />;
    }
  };

  const getTypeBadge = (type: SearchResult["type"]) => {
    const badges: Record<SearchResult["type"], { label: string; color: string }> = {
      city: { label: "City", color: "bg-teal-100 text-teal-700" },
      doctor: { label: "Doctor", color: "bg-blue-100 text-blue-700" },
      specialization: { label: "Specialty", color: "bg-purple-100 text-purple-700" },
      surgery: { label: "Surgery", color: "bg-green-100 text-green-700" },
      test: { label: "Test", color: "bg-orange-100 text-orange-700" },
      lab: { label: "Lab", color: "bg-primary/10 text-primary" },
      hospital: { label: "Hospital", color: "bg-red-100 text-red-700" },
      nurse: { label: "Nurse", color: "bg-pink-100 text-pink-700" },
    };
    return badges[type];
  };

  const handleSearch = () => {
    if (searchQuery.trim()) {
      saveRecentSearch(searchQuery.trim());
      const queryLower = searchQuery.toLowerCase().trim();
      
      // Count results by type to determine the best destination
      const typeCounts: Record<string, number> = {};
      results.forEach(r => {
        typeCounts[r.type] = (typeCounts[r.type] || 0) + 1;
      });
      
      // Find the dominant result type
      let dominantType = '';
      let maxCount = 0;
      Object.entries(typeCounts).forEach(([type, count]) => {
        if (count > maxCount) {
          maxCount = count;
          dominantType = type;
        }
      });
      
      // Navigation priority: keyword detection first, then results-based, then smart defaults
      // 1. Check for explicit keywords in query
      if (queryLower.includes('nurse') || queryLower.includes('nursing') || queryLower.includes('home care') || queryLower.includes('caregiver')) {
        navigate(`/find-nurses?search=${encodeURIComponent(searchQuery)}`);
      } else if (queryLower.includes('doctor') || queryLower.includes('dr.') || queryLower.includes('dr ') || queryLower.includes('physician')) {
        navigate(`/find-doctors?search=${encodeURIComponent(searchQuery)}`);
      } else if (queryLower.includes('hospital') || queryLower.includes('clinic') || queryLower.includes('medical center')) {
        navigate(`/hospitals?search=${encodeURIComponent(searchQuery)}`);
      } else if (queryLower.includes('surgery') || queryLower.includes('operation') || queryLower.includes('surgical')) {
        navigate(`/surgeries?search=${encodeURIComponent(searchQuery)}`);
      } else if (queryLower.includes('lab') || queryLower.includes('laboratory') || queryLower.includes('diagnostic')) {
        navigate(`/labs?search=${encodeURIComponent(searchQuery)}`);
      } else if (queryLower.includes('test') || queryLower.includes('blood') || queryLower.includes('urine') || queryLower.includes('x-ray') || queryLower.includes('mri') || queryLower.includes('ct scan') || queryLower.includes('ultrasound') || queryLower.includes('ecg') || queryLower.includes('cbc')) {
        navigate(`/labs?search=${encodeURIComponent(searchQuery)}`);
      } 
      // 2. Navigate based on dominant result type if results exist
      else if (results.length > 0) {
        switch (dominantType || results[0].type) {
          case "doctor":
          case "specialization":
            navigate(`/find-doctors?search=${encodeURIComponent(searchQuery)}`);
            break;
          case "nurse":
            navigate(`/find-nurses?search=${encodeURIComponent(searchQuery)}`);
            break;
          case "hospital":
            navigate(`/hospitals?search=${encodeURIComponent(searchQuery)}`);
            break;
          case "surgery":
            navigate(`/surgeries?search=${encodeURIComponent(searchQuery)}`);
            break;
          case "city":
            navigate(`/find-doctors?city=${results[0].name}`);
            break;
          case "test":
            navigate(`/labs?search=${encodeURIComponent(searchQuery)}`);
            break;
          case "lab":
            navigate(`/labs?search=${encodeURIComponent(searchQuery)}`);
            break;
          default:
            navigate(`/labs?search=${encodeURIComponent(searchQuery)}`);
            break;
        }
      } 
      // 3. Default fallback - go to doctors as the most common search intent
      else {
        navigate(`/find-doctors?search=${encodeURIComponent(searchQuery)}`);
      }
      
      setShowDropdown(false);
      setShowRecent(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSearch();
    }
    if (e.key === "Escape") {
      setShowDropdown(false);
      setShowRecent(false);
    }
  };

  const handleInputFocus = () => {
    if (results.length > 0) {
      setShowDropdown(true);
    } else if (searchQuery.trim().length < 2 && recentSearches.length > 0) {
      setShowRecent(true);
    }
  };

  const handleAutocompleteSuggestionClick = (suggestion: string) => {
    setSearchQuery(suggestion);
    setAutocompleteSuggestions([]);
    inputRef.current?.focus();
  };

  const handleTrendingClick = (suggestion: { text: string; type: string }) => {
    setSearchQuery(suggestion.text);
    setShowRecent(false);
    inputRef.current?.focus();
  };

  const handleCategoryClick = (category: { route: string }) => {
    navigate(category.route);
    setShowRecent(false);
  };

  const getIconForCategory = (icon: string) => {
    switch (icon) {
      case "doctor": return <User className="w-4 h-4" />;
      case "nurse": return <Heart className="w-4 h-4" />;
      case "test": return <TestTube className="w-4 h-4" />;
      case "hospital": return <Building2 className="w-4 h-4" />;
      case "surgery": return <Scissors className="w-4 h-4" />;
      default: return <Search className="w-4 h-4" />;
    }
  };

  const shouldShowDropdown = showDropdown && results.length > 0 && dropdownPos;
  const shouldShowRecent = showRecent && !showDropdown && dropdownPos;
  const hasAutocompleteSuggestions = autocompleteSuggestions.length > 0 && searchQuery.trim().length >= 1 && !showDropdown;

  return (
    <div className={`relative z-[100] ${className}`} ref={dropdownRef}>
      <div className="flex flex-col sm:flex-row gap-2 bg-white rounded-xl p-2 shadow-2xl">
        {/* City Selector */}
        <div className="flex items-center gap-2 px-3 py-2 sm:border-r border-gray-200">
          <MapPin className="w-5 h-5 text-primary" />
          <Select value={selectedCity} onValueChange={setSelectedCity}>
            <SelectTrigger className="border-0 shadow-none bg-transparent min-w-[120px] h-10 focus:ring-0 text-gray-700 font-medium">
              <SelectValue placeholder={citiesLoading ? "Loading..." : "Select City"} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Cities</SelectItem>
              {dbCities.map((city) => (
                <SelectItem key={city.id} value={city.name}>
                  {city.name}
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
            placeholder="Search doctors, nurses, surgeries, tests, labs, hospitals..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={handleKeyPress}
            onFocus={handleInputFocus}
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
          
          {/* Voice Search Button */}
          {voiceSupported && (
            <Button
              variant="ghost"
              size="icon"
              className={`h-8 w-8 shrink-0 transition-colors ${isListening ? 'bg-red-100 text-red-600 hover:bg-red-200' : 'hover:bg-muted'}`}
              onClick={toggleVoiceSearch}
              title={isListening ? "Stop listening" : "Voice search"}
            >
              {isListening ? (
                <MicOff className="w-4 h-4 animate-pulse" />
              ) : (
                <Mic className="w-4 h-4" />
              )}
            </Button>
          )}
          
          <Button onClick={handleSearch} size="lg" className="shrink-0 px-6 rounded-lg">
            <Search className="w-4 h-4 mr-2" />
            Search
          </Button>
        </div>
      </div>

      {/* Search Results Dropdown */}
      {shouldShowDropdown
        ? createPortal(
            <div
              ref={dropdownMenuRef}
              className="fixed bg-white rounded-xl shadow-2xl border border-gray-100 overflow-hidden z-[9999] max-h-[400px] overflow-y-auto"
              style={{ top: dropdownPos.top, left: dropdownPos.left, width: dropdownPos.width }}
            >
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
                          <span className="font-medium text-sm truncate">{result.name}</span>
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
            </div>,
            document.body,
          )
        : null}

      {/* Autocomplete Suggestions Dropdown */}
      {hasAutocompleteSuggestions && dropdownPos
        ? createPortal(
            <div
              ref={dropdownMenuRef}
              className="fixed bg-white rounded-xl shadow-2xl border border-gray-100 overflow-hidden z-[9999]"
              style={{ top: dropdownPos.top, left: dropdownPos.left, width: dropdownPos.width }}
            >
              <div className="p-2">
                <p className="text-xs text-muted-foreground px-3 py-2 flex items-center gap-1.5">
                  <Sparkles className="w-3 h-3" />
                  Suggestions
                </p>
                {autocompleteSuggestions.map((suggestion, index) => (
                  <button
                    key={index}
                    onClick={() => handleAutocompleteSuggestionClick(suggestion)}
                    className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-muted/50 rounded-lg transition-colors text-left"
                  >
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                      <Search className="w-4 h-4 text-primary" />
                    </div>
                    <span className="font-medium text-sm">{suggestion}</span>
                  </button>
                ))}
              </div>
            </div>,
            document.body,
          )
        : null}

      {/* Recent Searches & Trending Dropdown */}
      {shouldShowRecent
        ? createPortal(
            <div
              ref={dropdownMenuRef}
              className="fixed bg-white rounded-xl shadow-2xl border border-gray-100 overflow-hidden z-[9999] max-h-[500px] overflow-y-auto"
              style={{ top: dropdownPos.top, left: dropdownPos.left, width: dropdownPos.width }}
            >
              <div className="p-2">
                {/* Recent Searches Section */}
                {recentSearches.length > 0 && (
                  <>
                    <div className="flex items-center justify-between px-3 py-2">
                      <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                        <Clock className="w-3 h-3" />
                        Recent Searches
                      </p>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 text-xs text-muted-foreground hover:text-destructive"
                        onClick={clearRecentSearches}
                      >
                        <Trash2 className="w-3 h-3 mr-1" />
                        Clear
                      </Button>
                    </div>
                    {recentSearches.map((recent) => (
                      <div
                        key={recent.timestamp}
                        className="flex items-center gap-3 px-3 py-2.5 hover:bg-muted/50 rounded-lg transition-colors group"
                      >
                        <button
                          onClick={() => handleRecentSearchClick(recent.query)}
                          className="flex-1 flex items-center gap-3 text-left"
                        >
                          <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center shrink-0">
                            <Clock className="w-4 h-4 text-muted-foreground" />
                          </div>
                          <span className="font-medium text-sm truncate">{recent.query}</span>
                        </button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={(e) => {
                            e.stopPropagation();
                            removeRecentSearch(recent.query);
                          }}
                        >
                          <X className="w-3 h-3" />
                        </Button>
                      </div>
                    ))}
                    <div className="border-t border-gray-100 my-2" />
                  </>
                )}

                {/* Trending Searches Section */}
                <div className="px-3 py-2">
                  <p className="text-xs text-muted-foreground flex items-center gap-1.5 mb-2">
                    <TrendingUp className="w-3 h-3" />
                    Trending Searches
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {TRENDING_SUGGESTIONS.map((suggestion, index) => (
                      <Badge
                        key={index}
                        variant="secondary"
                        className="cursor-pointer hover:bg-primary/20 transition-colors"
                        onClick={() => handleTrendingClick(suggestion)}
                      >
                        {suggestion.text}
                      </Badge>
                    ))}
                  </div>
                </div>

                <div className="border-t border-gray-100 my-2" />

                {/* Quick Categories Section */}
                <div className="px-3 py-2">
                  <p className="text-xs text-muted-foreground mb-2">Browse Categories</p>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {POPULAR_CATEGORIES.map((category, index) => (
                      <button
                        key={index}
                        onClick={() => handleCategoryClick(category)}
                        className="flex items-center gap-2 p-2 rounded-lg bg-muted/50 hover:bg-primary/10 transition-colors text-sm font-medium"
                      >
                        {getIconForCategory(category.icon)}
                        {category.text}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>,
            document.body,
          )
        : null}
    </div>
  );
};

export default GlobalSearch;
