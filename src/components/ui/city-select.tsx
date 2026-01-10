import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import useCities from "@/hooks/useCities";

interface CitySelectProps {
  value: string;
  onValueChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  showAllOption?: boolean;
  allOptionLabel?: string;
}

export const CitySelect = ({
  value,
  onValueChange,
  placeholder = "Select city",
  disabled = false,
  className,
  showAllOption = false,
  allOptionLabel = "All Cities"
}: CitySelectProps) => {
  const { cities, provinces, loading } = useCities();

  if (loading) {
    return (
      <Select disabled>
        <SelectTrigger className={className}>
          <SelectValue placeholder="Loading..." />
        </SelectTrigger>
      </Select>
    );
  }

  return (
    <Select value={value} onValueChange={onValueChange} disabled={disabled}>
      <SelectTrigger className={className}>
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        {showAllOption && (
          <SelectItem value="all">{allOptionLabel}</SelectItem>
        )}
        {provinces.map((province) => {
          const provinceCities = cities.filter(c => c.province_id === province.id);
          if (provinceCities.length === 0) return null;

          return (
            <div key={province.id}>
              <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground bg-muted/50">
                {province.name}
              </div>
              {provinceCities.map((city) => (
                <SelectItem key={city.id} value={city.name}>
                  {city.name}
                </SelectItem>
              ))}
            </div>
          );
        })}
        {cities.length === 0 && (
          <div className="px-2 py-4 text-center text-sm text-muted-foreground">
            No cities available
          </div>
        )}
      </SelectContent>
    </Select>
  );
};

export default CitySelect;
