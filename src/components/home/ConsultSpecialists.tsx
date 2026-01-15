import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { ChevronRight, Stethoscope, Heart, Brain, Eye, Baby, Bone, Ear, Activity, Smile, User } from "lucide-react";

interface Specialization {
  id: string;
  name: string;
  slug: string;
  icon_name: string | null;
  icon_url: string | null;
}

// Icon mapping for specializations
const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  Stethoscope,
  Heart,
  Brain,
  Eye,
  Baby,
  Bone,
  Ear,
  Activity,
  Smile,
  User,
};

// Custom icon colors based on specialization type
const getIconStyle = (name: string): { bg: string; color: string } => {
  const lowerName = name.toLowerCase();
  if (lowerName.includes('cardio') || lowerName.includes('heart')) {
    return { bg: 'bg-red-100', color: 'text-red-500' };
  }
  if (lowerName.includes('neuro') || lowerName.includes('brain') || lowerName.includes('psych')) {
    return { bg: 'bg-purple-100', color: 'text-purple-500' };
  }
  if (lowerName.includes('eye') || lowerName.includes('ophthal')) {
    return { bg: 'bg-blue-100', color: 'text-blue-500' };
  }
  if (lowerName.includes('child') || lowerName.includes('pediatr') || lowerName.includes('baby')) {
    return { bg: 'bg-pink-100', color: 'text-pink-500' };
  }
  if (lowerName.includes('bone') || lowerName.includes('ortho')) {
    return { bg: 'bg-amber-100', color: 'text-amber-600' };
  }
  if (lowerName.includes('ent') || lowerName.includes('ear')) {
    return { bg: 'bg-orange-100', color: 'text-orange-500' };
  }
  if (lowerName.includes('derm') || lowerName.includes('skin')) {
    return { bg: 'bg-rose-100', color: 'text-rose-500' };
  }
  if (lowerName.includes('gyne') || lowerName.includes('women')) {
    return { bg: 'bg-fuchsia-100', color: 'text-fuchsia-500' };
  }
  if (lowerName.includes('dental') || lowerName.includes('dentist')) {
    return { bg: 'bg-cyan-100', color: 'text-cyan-500' };
  }
  if (lowerName.includes('gastro') || lowerName.includes('stomach')) {
    return { bg: 'bg-yellow-100', color: 'text-yellow-600' };
  }
  if (lowerName.includes('lung') || lowerName.includes('pulmo')) {
    return { bg: 'bg-sky-100', color: 'text-sky-500' };
  }
  if (lowerName.includes('uro')) {
    return { bg: 'bg-indigo-100', color: 'text-indigo-500' };
  }
  return { bg: 'bg-primary/10', color: 'text-primary' };
};

interface ConsultSpecialistsProps {
  className?: string;
  maxItems?: number;
}

const ConsultSpecialists = ({ className = "", maxItems = 14 }: ConsultSpecialistsProps) => {
  const [specializations, setSpecializations] = useState<Specialization[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchSpecializations = async () => {
      try {
        const { data, error } = await supabase
          .from("doctor_specializations")
          .select("id, name, slug, icon_name, icon_url")
          .eq("is_active", true)
          .order("display_order", { ascending: true })
          .limit(maxItems);

        if (error) throw error;
        if (data) setSpecializations(data);
      } catch (error) {
        console.error("Error fetching specializations:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchSpecializations();
  }, [maxItems]);

  const handleSpecializationClick = (slug: string, name: string) => {
    // Navigate to find doctors page with specialization filter
    navigate(`/find-doctors?specialization=${slug}`);
  };

  if (loading) {
    return (
      <div className={className}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base md:text-lg font-semibold text-foreground">
            Consult Best Doctors Online
          </h2>
        </div>
        <div className="grid grid-cols-4 md:grid-cols-7 gap-3">
          {[...Array(14)].map((_, i) => (
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
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-base md:text-lg font-semibold text-foreground">
          Consult Best Doctors Online
        </h2>
        <Link 
          to="/find-doctors" 
          className="text-primary text-sm font-medium flex items-center gap-1 hover:underline"
        >
          View All <ChevronRight className="w-4 h-4" />
        </Link>
      </div>

      <div className="grid grid-cols-4 md:grid-cols-7 gap-2 md:gap-3">
        {specializations.map((spec) => {
          const IconComponent = spec.icon_name && iconMap[spec.icon_name] 
            ? iconMap[spec.icon_name] 
            : Stethoscope;
          const styles = getIconStyle(spec.name);

          return (
            <button
              key={spec.id}
              onClick={() => handleSpecializationClick(spec.slug, spec.name)}
              className="flex flex-col items-center gap-1.5 md:gap-2 group cursor-pointer"
            >
              <div 
                className={`w-14 h-14 md:w-16 md:h-16 rounded-full ${styles.bg} flex items-center justify-center 
                  group-hover:scale-110 group-hover:shadow-md transition-all duration-300`}
              >
                {spec.icon_url ? (
                  <img 
                    src={spec.icon_url} 
                    alt={spec.name} 
                    className="w-8 h-8 md:w-10 md:h-10 object-contain"
                  />
                ) : (
                  <IconComponent className={`w-6 h-6 md:w-7 md:h-7 ${styles.color}`} />
                )}
              </div>
              <span className="text-[10px] md:text-xs text-center font-medium text-muted-foreground group-hover:text-primary transition-colors line-clamp-2 leading-tight">
                {spec.name}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default ConsultSpecialists;
