import { Link } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Star, MapPin, ArrowRight } from "lucide-react";
import type { Lab } from "@/data/mockData";

interface LabCardProps {
  lab: Lab;
}

const LabCard = ({ lab }: LabCardProps) => {
  return (
    <Card variant="interactive" className="overflow-hidden group">
      {/* Discount Banner */}
      <div className="relative h-32 gradient-hero flex items-center justify-center">
        <div className="text-center text-primary-foreground">
          <div className="text-4xl font-bold">{lab.discount}%</div>
          <div className="text-sm opacity-90">DISCOUNT</div>
        </div>
        <Badge 
          variant="discount" 
          className="absolute top-3 right-3 bg-card/95 backdrop-blur"
        >
          Save up to Rs. {Math.round(lab.discount * 50)}
        </Badge>
      </div>

      <CardContent className="p-5">
        <div className="space-y-4">
          {/* Lab Name & Rating */}
          <div>
            <h3 className="text-lg font-bold text-foreground group-hover:text-primary transition-colors">
              {lab.name}
            </h3>
            <div className="flex items-center gap-3 mt-1">
              <div className="flex items-center gap-1">
                <Star className="w-4 h-4 fill-medical-orange text-medical-orange" />
                <span className="text-sm font-semibold">{lab.rating}</span>
                <span className="text-xs text-muted-foreground">({lab.reviewCount.toLocaleString()})</span>
              </div>
              <div className="flex items-center gap-1 text-muted-foreground">
                <MapPin className="w-3 h-3" />
                <span className="text-xs">{lab.city}</span>
              </div>
            </div>
          </div>

          {/* Description */}
          <p className="text-sm text-muted-foreground line-clamp-2">
            {lab.description}
          </p>

          {/* Popular Tests */}
          <div className="flex flex-wrap gap-1">
            {lab.popularTests.slice(0, 3).map((test) => (
              <Badge key={test} variant="secondary" className="text-xs">
                {test}
              </Badge>
            ))}
            {lab.popularTests.length > 3 && (
              <Badge variant="outline" className="text-xs">
                +{lab.popularTests.length - 3} more
              </Badge>
            )}
          </div>

          {/* Branches */}
          <div className="text-xs text-muted-foreground">
            <span className="font-medium">{lab.branches.length} branches:</span>{" "}
            {lab.branches.slice(0, 3).join(", ")}
            {lab.branches.length > 3 && ` +${lab.branches.length - 3} more`}
          </div>

          {/* CTA */}
          <Link to={`/labs/${lab.id}`}>
            <Button className="w-full group/btn">
              View Tests & Prices
              <ArrowRight className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform" />
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  );
};

export default LabCard;
