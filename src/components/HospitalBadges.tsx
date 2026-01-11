import { Link } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Building2 } from "lucide-react";

interface HospitalInfo {
  hospital_id: string;
  hospital_name: string;
  hospital_slug?: string;
  department?: string | null;
  is_current: boolean;
}

interface HospitalBadgesProps {
  hospitals: HospitalInfo[];
  showDepartment?: boolean;
  className?: string;
}

export const HospitalBadges = ({
  hospitals,
  showDepartment = false,
  className = "",
}: HospitalBadgesProps) => {
  if (!hospitals || hospitals.length === 0) return null;

  const currentHospitals = hospitals.filter(h => h.is_current);
  const pastHospitals = hospitals.filter(h => !h.is_current);

  const renderHospitalBadge = (hospital: HospitalInfo) => {
    const content = (
      <Badge
        variant={hospital.is_current ? "default" : "secondary"}
        className={`text-xs cursor-pointer hover:bg-primary/80 transition-colors ${
          hospital.is_current ? "" : "bg-muted text-muted-foreground hover:bg-muted/80"
        }`}
      >
        <Building2 className="w-3 h-3 mr-1" />
        {hospital.hospital_name}
        {showDepartment && hospital.department && (
          <span className="ml-1 opacity-75">({hospital.department})</span>
        )}
      </Badge>
    );

    // Only link if we have a valid slug (not a custom hospital)
    if (hospital.hospital_slug) {
      return (
        <Link
          key={hospital.hospital_id}
          to={`/hospital/${hospital.hospital_slug}`}
          className="inline-block"
        >
          {content}
        </Link>
      );
    }

    return (
      <span key={hospital.hospital_id} className="inline-block">
        {content}
      </span>
    );
  };

  return (
    <div className={`space-y-2 ${className}`}>
      {currentHospitals.length > 0 && (
        <div>
          <p className="text-[10px] text-muted-foreground mb-1">Currently Working At</p>
          <div className="flex flex-wrap gap-1.5">
            {currentHospitals.map(renderHospitalBadge)}
          </div>
        </div>
      )}
      {pastHospitals.length > 0 && (
        <div>
          <p className="text-[10px] text-muted-foreground mb-1">Previously Worked At</p>
          <div className="flex flex-wrap gap-1.5">
            {pastHospitals.map(renderHospitalBadge)}
          </div>
        </div>
      )}
    </div>
  );
};

export default HospitalBadges;
