import { useState, useEffect, useRef, useCallback } from "react";
import { createPortal } from "react-dom";
import { useNavigate } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
  Brain,
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
  const { cities: dbCities, loading: citiesLoading } = useCities();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCity, setSelectedCity] = useState("");
  const [categorizedResults, setCategorizedResults] = useState<CategorizedResults | null>(null);
  const [searchIntent, setSearchIntent] = useState<string>("");
  const [expandedKeywords, setExpandedKeywords] = useState<string[]>([]);
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

  // Keep dropdown positioned above everything
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
  }, [showDropdown, showRecent, categorizedResults]);

  // Debounced intelligent search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchQuery.trim().length >= 2) {
        performIntelligentSearch(searchQuery.trim());
        setShowRecent(false);
      } else {
        setCategorizedResults(null);
        setSearchIntent("");
        setExpandedKeywords([]);
        setShowDropdown(false);
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
      setExpandedKeywords(data.expanded_keywords || []);
      setShowDropdown(data.total_results > 0);
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
    setShowDropdown(false);
    setShowRecent(false);
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
    setShowRecent(false);
    inputRef.current?.focus();
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
      case "hospital":
        return <Building2 className="w-4 h-4" />;
      case "nurse":
        return <Heart className="w-4 h-4" />;
    }
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
          // Fallback to doctors as most common intent
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
    if (categorizedResults && getAllResults().length > 0) {
      setShowDropdown(true);
    } else if (searchQuery.trim().length < 2 && recentSearches.length > 0) {
      setShowRecent(true);
    }
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

  const allResults = getAllResults();
  const shouldShowDropdown = showDropdown && allResults.length > 0 && dropdownPos;
  const shouldShowRecent = showRecent && !showDropdown && dropdownPos;

  // Render categorized results section
  const renderCategorySection = (title: string, results: SearchResult[], icon: React.ReactNode) => {
    if (results.length === 0) return null;
    return (
      <div className="mb-3">
        <div className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-muted-foreground uppercase tracking-wider">
          {icon}
          {title}
          <span className="ml-auto bg-muted px-1.5 py-0.5 rounded-full text-[10px]">
            {results.length}
          </span>
        </div>
        {results.slice(0, 5).map((result) => {
          const badge = getTypeBadge(result.type);
          return (
            <button
              key={`${result.type}-${result.id}`}
              onClick={() => handleResultClick(result)}
              className="w-full flex items-center gap-3 px-3 py-2 hover:bg-muted/50 rounded-lg transition-colors text-left"
            >
              <div className="w-9 h-9 rounded-full bg-muted flex items-center justify-center shrink-0">
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
    );
  };

  return (
    <div className={`relative z-[100] ${className}`} ref={dropdownRef}>
      {/* Modern Search Bar Container */}
      <div className="relative">
        {/* Main Search Input Container */}
        <div className="flex items-center bg-white rounded-full shadow-xl border-2 border-primary/20 hover:border-primary/40 transition-all duration-300 overflow-hidden">
          {/* Search Icon */}
          <div className="pl-4 pr-2">
            {loading ? (
              <Loader2 className="w-5 h-5 text-primary animate-spin" />
            ) : (
              <Search className="w-5 h-5 text-primary" />
            )}
          </div>
          
          {/* Search Input */}
          <Input
            ref={inputRef}
            type="text"
            placeholder="Search doctors, labs, tests, hospitals..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={handleKeyPress}
            onFocus={handleInputFocus}
            className="border-0 shadow-none bg-transparent focus-visible:ring-0 text-black placeholder:text-gray-400 h-14 text-base flex-1 min-w-0 caret-primary font-medium"
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
                setShowDropdown(false);
              }}
            >
              <X className="w-4 h-4 text-gray-500" />
            </Button>
          )}
          
          {/* Divider */}
          <div className="h-8 w-px bg-gray-200 mx-2" />
          
          {/* Compact City Selector */}
          <Select value={selectedCity} onValueChange={setSelectedCity}>
            <SelectTrigger className="border-0 shadow-none bg-transparent w-auto min-w-[70px] max-w-[100px] h-10 focus:ring-0 text-gray-700 text-sm font-medium gap-1 [&>span]:truncate">
              <MapPin className="w-3.5 h-3.5 text-primary shrink-0" />
              <SelectValue placeholder={citiesLoading ? "..." : "City"} />
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
          
          {/* Voice Search Button */}
          {voiceSupported && (
            <Button
              variant="ghost"
              size="icon"
              className={`h-10 w-10 shrink-0 rounded-full transition-colors ${isListening ? 'bg-red-100 text-red-600 hover:bg-red-200' : 'hover:bg-gray-100 text-gray-500'}`}
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
          
          {/* Search Button */}
          <Button 
            onClick={handleSearch} 
            className="shrink-0 h-10 px-5 sm:px-6 rounded-full mr-2 bg-primary hover:bg-primary/90 shadow-lg"
          >
            <Search className="w-4 h-4 sm:mr-2" />
            <span className="hidden sm:inline font-semibold">Search</span>
          </Button>
        </div>
        
        {/* AI Badge */}
        <div className="absolute -top-2 left-4 flex items-center gap-1 bg-gradient-to-r from-violet-500 to-primary text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-md">
          <Sparkles className="w-3 h-3" />
          AI-Powered
        </div>
      </div>

      {/* AI-Powered Search Results Dropdown */}
      {shouldShowDropdown && categorizedResults
        ? createPortal(
            <div
              ref={dropdownMenuRef}
              className="fixed bg-white rounded-xl shadow-2xl border border-gray-100 overflow-hidden z-[9999] max-h-[500px] overflow-y-auto"
              style={{ top: dropdownPos.top, left: dropdownPos.left, width: dropdownPos.width }}
            >
              <div className="p-3">
                {/* AI Intent Badge */}
                <div className="flex items-center gap-2 mb-3 pb-2 border-b border-gray-100">
                  <div className="flex items-center gap-1.5 text-xs text-primary font-medium">
                    <Sparkles className="w-3.5 h-3.5" />
                    AI-Powered Search
                  </div>
                  {searchIntent && (
                    <Badge variant="secondary" className="text-[10px] px-2 py-0.5">
                      Intent: {searchIntent}
                    </Badge>
                  )}
                  <span className="ml-auto text-xs text-muted-foreground">
                    {allResults.length} results
                  </span>
                </div>

                {/* Expanded Keywords */}
                {expandedKeywords.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mb-3">
                    {expandedKeywords.slice(0, 6).map((keyword, idx) => (
                      <Badge 
                        key={idx} 
                        variant="outline" 
                        className="text-[10px] px-2 py-0.5 bg-muted/50"
                      >
                        {keyword}
                      </Badge>
                    ))}
                  </div>
                )}

                {/* Categorized Results */}
                {renderCategorySection("Doctors", categorizedResults.doctors, <User className="w-3 h-3" />)}
                {renderCategorySection("Specializations", categorizedResults.specializations, <Stethoscope className="w-3 h-3" />)}
                {renderCategorySection("Labs & Tests", categorizedResults.labs_tests, <TestTube className="w-3 h-3" />)}
                {renderCategorySection("Hospitals", categorizedResults.hospitals, <Building2 className="w-3 h-3" />)}
                {renderCategorySection("Nurses", categorizedResults.nurses, <Heart className="w-3 h-3" />)}
                {renderCategorySection("Surgeries", categorizedResults.surgeries, <Scissors className="w-3 h-3" />)}
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
                      <span className="text-xs text-muted-foreground flex items-center gap-1.5">
                        <Clock className="w-3 h-3" />
                        Recent Searches
                      </span>
                      <button
                        onClick={clearRecentSearches}
                        className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1"
                      >
                        <Trash2 className="w-3 h-3" />
                        Clear
                      </button>
                    </div>
                    {recentSearches.map((recent, index) => (
                      <div
                        key={index}
                        className="flex items-center gap-2 px-3 py-2 hover:bg-muted/50 rounded-lg group"
                      >
                        <button
                          onClick={() => handleRecentSearchClick(recent.query)}
                          className="flex-1 flex items-center gap-3 text-left"
                        >
                          <Clock className="w-4 h-4 text-muted-foreground" />
                          <span className="text-sm">{recent.query}</span>
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            removeRecentSearch(recent.query);
                          }}
                          className="opacity-0 group-hover:opacity-100 p-1 hover:bg-muted rounded transition-opacity"
                        >
                          <X className="w-3 h-3 text-muted-foreground" />
                        </button>
                      </div>
                    ))}
                    <div className="border-t border-gray-100 my-2" />
                  </>
                )}

                {/* Trending Searches */}
                <div className="px-3 py-2">
                  <span className="text-xs text-muted-foreground flex items-center gap-1.5">
                    <TrendingUp className="w-3 h-3" />
                    Trending Searches
                  </span>
                </div>
                <div className="flex flex-wrap gap-2 px-3 pb-2">
                  {TRENDING_SUGGESTIONS.map((suggestion, index) => (
                    <button
                      key={index}
                      onClick={() => handleTrendingClick(suggestion)}
                      className="px-3 py-1.5 text-sm bg-muted/50 hover:bg-muted rounded-full transition-colors"
                    >
                      {suggestion.text}
                    </button>
                  ))}
                </div>

                {/* Quick Categories */}
                <div className="border-t border-gray-100 mt-2 pt-2">
                  <div className="px-3 py-2">
                    <span className="text-xs text-muted-foreground">Browse Categories</span>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 px-2 pb-2">
                    {POPULAR_CATEGORIES.map((category, index) => (
                      <button
                        key={index}
                        onClick={() => handleCategoryClick(category)}
                        className="flex flex-col items-center gap-1.5 p-3 hover:bg-muted/50 rounded-lg transition-colors"
                      >
                        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                          {getIconForCategory(category.icon)}
                        </div>
                        <span className="text-xs font-medium">{category.text}</span>
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
