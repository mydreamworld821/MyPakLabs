import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronRight } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useSectionConfig } from "@/hooks/useHomepageSections";

interface HealthCondition {
  id: string;
  name: string;
  urdu: string;
  searchQuery: string;
  icon: string;
  color: string;
}

// Common health conditions for search
const healthConditions: HealthCondition[] = [
  { id: "fever", name: "Fever", urdu: "بخار", searchQuery: "fever general physician", icon: "🤒", color: "bg-red-100" },
  { id: "heart", name: "Heart Attack", urdu: "دل کا دورہ", searchQuery: "heart cardiologist", icon: "❤️", color: "bg-rose-100" },
  { id: "pregnancy", name: "Pregnancy", urdu: "حمل", searchQuery: "pregnancy gynecologist", icon: "🤰", color: "bg-pink-100" },
  { id: "blood-pressure", name: "High Blood Pressure", urdu: "بلند فشار خون", searchQuery: "blood pressure hypertension cardiologist", icon: "💉", color: "bg-blue-100" },
  { id: "piles", name: "Piles", urdu: "بواسیر", searchQuery: "piles hemorrhoids general surgeon", icon: "🩺", color: "bg-purple-100" },
  { id: "diarrhea", name: "Diarrhea", urdu: "دست", searchQuery: "diarrhea gastroenterologist", icon: "🤢", color: "bg-yellow-100" },
  { id: "acne", name: "Acne", urdu: "کیل مہاسے", searchQuery: "acne skin dermatologist", icon: "👤", color: "bg-amber-100" },
  { id: "diabetes", name: "Diabetes", urdu: "ذیابیطس", searchQuery: "diabetes sugar endocrinologist", icon: "🍬", color: "bg-orange-100" },
  { id: "obesity", name: "Obesity", urdu: "موٹاپا", searchQuery: "obesity weight nutritionist", icon: "⚖️", color: "bg-green-100" },
  { id: "asthma", name: "Asthma", urdu: "دمہ", searchQuery: "asthma breathing pulmonologist", icon: "🌬️", color: "bg-sky-100" },
  { id: "migraine", name: "Migraine", urdu: "درد شقیقہ", searchQuery: "migraine headache neurologist", icon: "🤕", color: "bg-indigo-100" },
  { id: "kidney", name: "Kidney Disease", urdu: "گردے کی بیماری", searchQuery: "kidney nephrologist", icon: "🫘", color: "bg-teal-100" },
  { id: "thyroid", name: "Thyroid", urdu: "تھائیرائیڈ", searchQuery: "thyroid endocrinologist", icon: "🦋", color: "bg-violet-100" },
  { id: "depression", name: "Depression", urdu: "ڈپریشن", searchQuery: "depression anxiety psychiatrist", icon: "😔", color: "bg-slate-100" },
  { id: "back-pain", name: "Back Pain", urdu: "کمر درد", searchQuery: "back pain orthopedic", icon: "🦴", color: "bg-amber-100" },
  { id: "eye-problem", name: "Eye Problems", urdu: "آنکھوں کے مسائل", searchQuery: "eye vision ophthalmologist", icon: "👁️", color: "bg-cyan-100" },
  { id: "dental", name: "Dental Issues", urdu: "دانتوں کے مسائل", searchQuery: "dental teeth dentist", icon: "🦷", color: "bg-emerald-100" },
  { id: "child-health", name: "Child Health", urdu: "بچوں کی صحت", searchQuery: "child pediatrician", icon: "👶", color: "bg-pink-100" },
  { id: "ent", name: "ENT Problems", urdu: "کان ناک گلا", searchQuery: "ear nose throat ent", icon: "👂", color: "bg-orange-100" },
  { id: "skin-allergy", name: "Skin Allergy", urdu: "جلد کی الرجی", searchQuery: "skin allergy rash dermatologist", icon: "🤧", color: "bg-lime-100" },
];

interface SearchByConditionProps {
  className?: string;
  maxItems?: number;
}

const SearchByCondition = ({ className = "", maxItems: propMaxItems = 7 }: SearchByConditionProps) => {
  const navigate = useNavigate();
  const [dialogOpen, setDialogOpen] = useState(false);
  const { config, loading: configLoading } = useSectionConfig("search_by_condition");

  // Use config max_items if available, otherwise fall back to prop
  const maxItems = config?.max_items ?? propMaxItems;
  const isVisible = config?.is_visible ?? true;
  const title = config?.title || "Search Doctor by Condition";
  const subtitle = config?.subtitle;
  
  const displayedConditions = healthConditions.slice(0, maxItems);

  const handleConditionClick = (condition: HealthCondition) => {
    // Navigate to find doctors page with search query
    navigate(`/find-doctors?search=${encodeURIComponent(condition.searchQuery)}`);
    setDialogOpen(false);
  };

  // Don't render if section is hidden
  if (!configLoading && !isVisible) {
    return null;
  }

  if (configLoading) {
    return (
      <div className={className} style={{ minHeight: '120px' }}>
        <div className="flex items-center justify-between mb-4">
          <div className="h-6 w-48 bg-muted animate-pulse rounded" />
        </div>
        <div className="grid grid-cols-4 md:grid-cols-7 gap-2 md:gap-3" style={{ minHeight: '72px' }}>
          {[...Array(7)].map((_, i) => (
            <div key={i} className="flex flex-col items-center gap-2">
              <div className="w-14 h-14 md:w-16 md:h-16 rounded-full bg-muted animate-pulse" />
              <div className="w-16 h-3 bg-muted rounded animate-pulse" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className={className}>
      <div className="flex items-center justify-between mb-2">
        <div>
          <h2 className="text-base md:text-lg font-semibold text-foreground">
            {title}
          </h2>
          {subtitle && (
            <p className="text-xs md:text-sm text-muted-foreground mt-0.5">{subtitle}</p>
          )}
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <button className="text-primary text-sm font-medium flex items-center gap-1 hover:underline">
              View All <ChevronRight className="w-4 h-4" />
            </button>
          </DialogTrigger>
          <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>All Health Conditions</DialogTitle>
            </DialogHeader>
            <div className="grid grid-cols-4 md:grid-cols-5 gap-4 mt-4">
              {healthConditions.map((condition) => (
                <button
                  key={condition.id}
                  onClick={() => handleConditionClick(condition)}
                  className="flex flex-col items-center gap-2 group cursor-pointer p-2 rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div 
                    className={`w-14 h-14 md:w-16 md:h-16 rounded-full ${condition.color} flex items-center justify-center 
                      group-hover:scale-110 group-hover:shadow-md transition-all duration-300`}
                  >
                    <span className="text-2xl md:text-3xl">{condition.icon}</span>
                  </div>
                  <div className="text-center">
                    <span className="text-xs font-medium text-foreground group-hover:text-primary transition-colors block">
                      {condition.name}
                    </span>
                    <span className="text-[10px] text-muted-foreground font-urdu">
                      {condition.urdu}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </DialogContent>
        </Dialog>
      </div>
      
      {/* Guiding intro line */}
      <p className="text-sm text-muted-foreground mb-4">
        Not sure which doctor to consult? Start here.
      </p>

      <div className="grid grid-cols-4 md:grid-cols-7 gap-2 md:gap-3" style={{ minHeight: '72px' }}>
        {displayedConditions.map((condition) => (
          <button
            key={condition.id}
            onClick={() => handleConditionClick(condition)}
            className="flex flex-col items-center gap-1.5 md:gap-2 group cursor-pointer"
          >
            <div 
              className={`w-14 h-14 md:w-16 md:h-16 rounded-full ${condition.color} flex items-center justify-center 
                group-hover:scale-110 group-hover:shadow-md transition-all duration-300`}
            >
              <span className="text-xl md:text-2xl">{condition.icon}</span>
            </div>
            <span className="text-[10px] md:text-xs text-center font-medium text-muted-foreground group-hover:text-primary transition-colors line-clamp-2 leading-tight">
              {condition.name}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
};

export default SearchByCondition;
