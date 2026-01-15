import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
} from "@/components/ui/dialog";
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
  type: "doctor" | "specialization" | "surgery" | "test" | "lab" | "hospital" | "nurse";
  slug?: string;
  subtitle?: string;
  relevance_score?: number;
  category?: string;
}

interface CategorizedResults {
  doctors: SearchResult[];
  labs_tests: SearchResult[];
  hospitals: SearchResult[];
  specializations: SearchResult[];
  surgeries: SearchResult[];
  nurses: SearchResult[];
}

interface IntelligentSearchResponse {
  intent: string;
  expanded_keywords: string[];
  total_results: number;
  results: CategorizedResults;
  error?: string;
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

// Popular specializations for suggestions
const POPULAR_SPECIALIZATIONS = [
  { text: "Gynecologist", type: "specialization" as const },
  { text: "Skin Specialist", type: "specialization" as const },
  { text: "Child Specialist", type: "specialization" as const },
  { text: "Neurologist", type: "specialization" as const },
  { text: "Orthopedic Surgeon", type: "specialization" as const },
  { text: "Gastroenterologist", type: "specialization" as const },
  { text: "Endocrinologist", type: "specialization" as const },
  { text: "Cardiologist", type: "specialization" as const },
];

const GlobalSearch = ({ className }: GlobalSearchProps) => {
  const navigate = useNavigate();
  const { cities: dbCities, loading: citiesLoading } = useCities();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCity, setSelectedCity] = useState("");
  const [categorizedResults, setCategorizedResults] = useState<CategorizedResults | null>(null);
  const [searchIntent, setSearchIntent] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const modalInputRef = useRef<HTMLInputElement>(null);
  
  // Voice search state
  const [isListening, setIsListening] = useState(false);
  const [voiceSupported, setVoiceSupported] = useState(false);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const recognitionRef = useRef<any>(null);
  
  // Recent searches state
  const [recentSearches, setRecentSearches] = useState<RecentSearch[]>([]);

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

  // Focus input when modal opens
  useEffect(() => {
    if (isOpen && modalInputRef.current) {
      setTimeout(() => {
        modalInputRef.current?.focus();
      }, 100);
    }
  }, [isOpen]);

  // Save recent searches to localStorage
  const saveRecentSearch = useCallback((query: string) => {
    if (!query.trim()) return;
    
    const newSearch: RecentSearch = {
      query: query.trim(),
      timestamp: Date.now(),
    };
    
    setRecentSearches(prev => {
      const filtered = prev.filter(s => s.query.toLowerCase() !== query.toLowerCase());
      const updated = [newSearch, ...filtered].slice(0, MAX_RECENT_SEARCHES);
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

  // Debounced intelligent search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchQuery.trim().length >= 2) {
        performIntelligentSearch(searchQuery.trim());
      } else {
        setCategorizedResults(null);
        setSearchIntent("");
      }
    }, 400);

    return () => clearTimeout(timer);
  }, [searchQuery, selectedCity]);

  const performIntelligentSearch = async (query: string) => {
    setLoading(true);
    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/intelligent-search`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({
            query,
            city: selectedCity || undefined,
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        console.error("Search error:", errorData.error);
        return;
      }

      const data: IntelligentSearchResponse = await response.json();
      
      setCategorizedResults(data.results);
      setSearchIntent(data.intent);
    } catch (error) {
      console.error("Search error:", error);
    } finally {
      setLoading(false);
    }
  };

  // Get all results flattened for total count
  const getAllResults = (): SearchResult[] => {
    if (!categorizedResults) return [];
    return [
      ...categorizedResults.doctors,
      ...categorizedResults.specializations,
      ...categorizedResults.labs_tests,
      ...categorizedResults.hospitals,
      ...categorizedResults.nurses,
      ...categorizedResults.surgeries,
    ];
  };

  const handleResultClick = (result: SearchResult) => {
    saveRecentSearch(result.name);
    setIsOpen(false);
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
    modalInputRef.current?.focus();
  };

  const handleSuggestionClick = (suggestion: { text: string; type: string }) => {
    setSearchQuery(suggestion.text);
    modalInputRef.current?.focus();
  };

  const getTypeBadge = (type: SearchResult["type"]) => {
    const badges: Record<SearchResult["type"], { label: string; color: string }> = {
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
      
      // Navigate based on detected intent
      switch (searchIntent) {
        case "doctor":
          navigate(`/find-doctors?search=${encodeURIComponent(searchQuery)}`);
          break;
        case "nurse":
          navigate(`/find-nurses?search=${encodeURIComponent(searchQuery)}`);
          break;
        case "test":
          navigate(`/labs?search=${encodeURIComponent(searchQuery)}`);
          break;
        case "hospital":
          navigate(`/hospitals?search=${encodeURIComponent(searchQuery)}`);
          break;
        case "surgery":
          navigate(`/surgeries?search=${encodeURIComponent(searchQuery)}`);
          break;
        default:
          navigate(`/find-doctors?search=${encodeURIComponent(searchQuery)}`);
      }
      
      setIsOpen(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSearch();
    }
    if (e.key === "Escape") {
      setIsOpen(false);
    }
  };

  const allResults = getAllResults();
  const hasResults = allResults.length > 0;
  const showSuggestions = !hasResults && searchQuery.trim().length < 2;

  return (
    <>
      {/* Trigger Search Bar */}
      <div className={`relative z-[100] ${className}`}>
        <button
          onClick={() => setIsOpen(true)}
          className="w-full flex items-center bg-white rounded-lg shadow-xl border border-gray-200 overflow-hidden hover:shadow-2xl transition-shadow cursor-text"
        >
          {/* City Preview */}
          <div className="flex items-center border-r border-gray-200 bg-gray-50/50 px-4 py-3">
            <MapPin className="w-4 h-4 text-primary mr-2" />
            <span className="text-sm text-gray-700 font-medium">
              {selectedCity || "All Cities"}
            </span>
          </div>
          
          {/* Search Placeholder */}
          <div className="flex-1 flex items-center px-4 py-3">
            <Search className="w-5 h-5 text-gray-400 mr-3" />
            <span className="text-gray-400 text-base">
              Search for doctors, hospitals, specialties, services...
            </span>
          </div>
          
          {/* Search Button */}
          <div className="shrink-0 px-6 py-3 bg-amber-500 text-white font-semibold">
            Search
          </div>
        </button>
      </div>

      {/* Search Modal */}
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="sm:max-w-[600px] p-0 gap-0 overflow-hidden bg-white">
          {/* Modal Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
            <h2 className="font-semibold text-gray-800">Search for doctors</h2>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 rounded-full"
              onClick={() => setIsOpen(false)}
            >
              <X className="w-4 h-4" />
            </Button>
          </div>

          {/* City Selector */}
          <div className="px-4 py-3 border-b border-gray-100">
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-gray-400" />
              <Select value={selectedCity} onValueChange={setSelectedCity}>
                <SelectTrigger className="flex-1 border-0 shadow-none bg-transparent h-auto p-0 focus:ring-0 text-gray-800 text-sm font-medium">
                  <SelectValue placeholder={citiesLoading ? "Loading..." : "Select City"} />
                </SelectTrigger>
                <SelectContent className="max-h-[300px] bg-white z-[9999]">
                  <SelectItem value="all">All Cities</SelectItem>
                  {dbCities.map((city) => (
                    <SelectItem key={city.id} value={city.name}>
                      {city.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              {/* Detect Location Button */}
              <Button
                variant="outline"
                size="sm"
                className="h-8 px-3 text-primary border-primary/30 rounded-full text-xs font-medium hover:bg-primary/10"
                onClick={() => {
                  if (navigator.geolocation) {
                    navigator.geolocation.getCurrentPosition(() => {
                      setSelectedCity("all");
                    });
                  }
                }}
              >
                <MapPin className="w-3 h-3 mr-1" />
                Detect
              </Button>
            </div>
          </div>

          {/* Search Input */}
          <div className="px-4 py-3 border-b border-gray-100">
            <div className="flex items-center gap-3">
              {loading ? (
                <Loader2 className="w-5 h-5 text-gray-400 animate-spin shrink-0" />
              ) : (
                <Search className="w-5 h-5 text-gray-400 shrink-0" />
              )}
              <Input
                ref={modalInputRef}
                type="text"
                placeholder="Search for doctors, hospitals, specialties, services, diseases"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={handleKeyPress}
                className="border-0 shadow-none bg-transparent focus-visible:ring-0 text-black placeholder:text-gray-400 h-10 text-base flex-1 p-0 caret-primary font-medium"
              />
              
              {/* Clear Button */}
              {searchQuery && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 shrink-0 rounded-full hover:bg-gray-100"
                  onClick={() => {
                    setSearchQuery("");
                    setCategorizedResults(null);
                  }}
                >
                  <X className="w-4 h-4 text-gray-500" />
                </Button>
              )}
              
              {/* Voice Search Button */}
              {voiceSupported && (
                <Button
                  variant="ghost"
                  size="icon"
                  className={`h-8 w-8 shrink-0 rounded-full transition-colors ${isListening ? 'bg-red-100 text-red-600 hover:bg-red-200' : 'hover:bg-gray-100 text-gray-500'}`}
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
            </div>
          </div>

          {/* Results / Suggestions Area */}
          <div className="max-h-[400px] overflow-y-auto">
            {/* Show Search Results */}
            {hasResults && (
              <div className="divide-y divide-gray-50">
                {allResults.slice(0, 10).map((result) => {
                  const badge = getTypeBadge(result.type);
                  return (
                    <button
                      key={`${result.type}-${result.id}`}
                      onClick={() => handleResultClick(result)}
                      className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors text-left"
                    >
                      <Search className="w-4 h-4 text-gray-400 shrink-0" />
                      <span className="flex-1 text-sm font-medium text-gray-800">
                        {result.name}
                      </span>
                      <Badge className={`text-xs px-2 py-0.5 ${badge.color}`}>
                        {badge.label}
                      </Badge>
                    </button>
                  );
                })}
              </div>
            )}

            {/* Loading State */}
            {loading && (
              <div className="px-4 py-8 text-center text-gray-500">
                <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2" />
                <p className="text-sm">Searching...</p>
              </div>
            )}

            {/* Show Suggestions when no results or empty query */}
            {showSuggestions && !loading && (
              <div className="py-2">
                {/* Recent Searches */}
                {recentSearches.length > 0 && (
                  <div className="mb-2">
                    <div className="flex items-center justify-between px-4 py-2">
                      <span className="text-xs text-gray-500 flex items-center gap-1.5">
                        <Clock className="w-3 h-3" />
                        Recent Searches
                      </span>
                      <button
                        onClick={clearRecentSearches}
                        className="text-xs text-gray-400 hover:text-gray-600 flex items-center gap-1"
                      >
                        <Trash2 className="w-3 h-3" />
                        Clear
                      </button>
                    </div>
                    {recentSearches.map((recent, index) => (
                      <div
                        key={index}
                        className="flex items-center gap-2 px-4 py-2 hover:bg-gray-50 group"
                      >
                        <button
                          onClick={() => handleRecentSearchClick(recent.query)}
                          className="flex-1 flex items-center gap-3 text-left"
                        >
                          <Clock className="w-4 h-4 text-gray-400" />
                          <span className="text-sm text-gray-700">{recent.query}</span>
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            removeRecentSearch(recent.query);
                          }}
                          className="opacity-0 group-hover:opacity-100 p-1 hover:bg-gray-200 rounded transition-opacity"
                        >
                          <X className="w-3 h-3 text-gray-400" />
                        </button>
                      </div>
                    ))}
                    <div className="border-t border-gray-100 my-2" />
                  </div>
                )}

                {/* Popular Specializations */}
                <div className="px-4 py-2">
                  <span className="text-xs text-gray-500 flex items-center gap-1.5">
                    <TrendingUp className="w-3 h-3" />
                    Popular Specialties
                  </span>
                </div>
                <div className="divide-y divide-gray-50">
                  {POPULAR_SPECIALIZATIONS.map((suggestion, index) => (
                    <button
                      key={index}
                      onClick={() => handleSuggestionClick(suggestion)}
                      className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors text-left"
                    >
                      <Search className="w-4 h-4 text-gray-400 shrink-0" />
                      <span className="flex-1 text-sm font-medium text-blue-600">
                        {suggestion.text}
                      </span>
                      <span className="text-xs text-gray-400">Specialty</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* No Results State */}
            {!loading && !hasResults && searchQuery.trim().length >= 2 && (
              <div className="px-4 py-8 text-center text-gray-500">
                <Search className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                <p className="text-sm">No results found for "{searchQuery}"</p>
                <p className="text-xs text-gray-400 mt-1">Try different keywords</p>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default GlobalSearch;
