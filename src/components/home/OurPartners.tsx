import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Link } from "react-router-dom";
import { ChevronRight } from "lucide-react";

interface Partner {
  id: string;
  company_name: string;
  logo_url: string | null;
  website_url: string | null;
}

const OurPartners = () => {
  const [partners, setPartners] = useState<Partner[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchPartners = async () => {
      const { data, error } = await supabase
        .from("partners")
        .select("id, company_name, logo_url, website_url")
        .eq("is_approved", true)
        .order("display_order", { ascending: true });

      if (!error && data) {
        setPartners(data);
      }
      setIsLoading(false);
    };

    fetchPartners();
  }, []);

  if (isLoading) return null;

  // Double the partners for seamless infinite scroll
  const scrollPartners = partners.length > 0 ? [...partners, ...partners] : [];

  return (
    <section className="py-8 md:py-12 bg-background border-t border-border">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg md:text-xl font-semibold text-foreground">
            Our Partners
          </h2>
          <Link
            to="/partner-registration"
            className="flex items-center gap-1 text-sm text-primary hover:text-primary/80 transition-colors font-medium"
          >
            Become a Partner
            <ChevronRight className="w-4 h-4" />
          </Link>
        </div>

        {partners.length === 0 ? (
          /* Empty state - Call to action */
          <div className="text-center py-8 bg-muted/30 rounded-xl border border-border">
            <p className="text-muted-foreground mb-4">
              Join our network of trusted partners - Banks, Hospitals, Companies & more!
            </p>
            <Link
              to="/partner-registration"
              className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 transition-colors"
            >
              Register Your Organization
              <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
        ) : (
          /* Scrolling Logos */
          <div className="relative overflow-hidden">
            {/* Fade edges */}
            <div className="absolute left-0 top-0 bottom-0 w-16 bg-gradient-to-r from-background to-transparent z-10" />
            <div className="absolute right-0 top-0 bottom-0 w-16 bg-gradient-to-l from-background to-transparent z-10" />

            {/* Marquee container */}
            <div className="flex animate-marquee">
              {scrollPartners.map((partner, index) => (
                <div
                  key={`${partner.id}-${index}`}
                  className="flex-shrink-0 px-6 md:px-10"
                >
                  {partner.website_url ? (
                    <a
                      href={partner.website_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block hover:opacity-80 transition-all duration-300"
                    >
                      {partner.logo_url ? (
                        <img
                          src={partner.logo_url}
                          alt={partner.company_name}
                          className="h-14 md:h-20 w-auto max-w-[160px] md:max-w-[200px] object-contain"
                        />
                      ) : (
                        <span className="text-lg font-semibold text-muted-foreground">
                          {partner.company_name}
                        </span>
                      )}
                    </a>
                  ) : (
                    <div>
                      {partner.logo_url ? (
                        <img
                          src={partner.logo_url}
                          alt={partner.company_name}
                          className="h-14 md:h-20 w-auto max-w-[160px] md:max-w-[200px] object-contain"
                        />
                      ) : (
                        <span className="text-lg font-semibold text-muted-foreground">
                          {partner.company_name}
                        </span>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </section>
  );
};

export default OurPartners;
