import { useLocation, useParams } from "react-router-dom";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { FileText, Shield, Building, CheckCircle } from "lucide-react";
import { useLegalPage } from "@/hooks/useLegalPages";

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  FileText,
  Shield,
  Building,
};

const LegalPage = () => {
  const { slug } = useParams();
  const location = useLocation();
  // Use pathname directly for routes like /terms, /privacy, /partner-terms
  // For /legal/:slug routes, construct from slug
  const routePath = slug ? `/legal/${slug}` : location.pathname;
  const { data: page, isLoading, error } = useLegalPage(routePath);

  const IconComponent = page?.icon_name ? iconMap[page.icon_name] || FileText : FileText;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <main className="pt-24 pb-16">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto">
              <div className="text-center mb-12">
                <Skeleton className="w-16 h-16 rounded-2xl mx-auto mb-6" />
                <Skeleton className="w-24 h-6 mx-auto mb-4" />
                <Skeleton className="w-64 h-10 mx-auto mb-4" />
                <Skeleton className="w-48 h-4 mx-auto" />
              </div>
              <div className="space-y-6">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="w-full h-32" />
                ))}
              </div>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (error || !page) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <main className="pt-24 pb-16">
          <div className="container mx-auto px-4 text-center">
            <h1 className="text-2xl font-bold">Page Not Found</h1>
            <p className="text-muted-foreground mt-2">The requested legal page could not be found.</p>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <main className="pt-24 pb-16">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            {/* Header */}
            <div className="text-center mb-12">
              <div className="w-16 h-16 gradient-hero rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-glow">
                <IconComponent className="w-8 h-8 text-primary-foreground" />
              </div>
              {page.badge_text && (
                <Badge variant="secondary" className="mb-4">{page.badge_text}</Badge>
              )}
              <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
                {page.title}
              </h1>
              {page.subtitle && (
                <p className="text-muted-foreground">{page.subtitle}</p>
              )}
            </div>

            {/* Content */}
            <div className="space-y-6">
              {page.sections?.map((section, index) => (
                <Card key={index} variant="elevated">
                  <CardContent className="p-6">
                    <h2 className="text-lg font-semibold text-foreground mb-3 flex items-center gap-2">
                      <span className="w-8 h-8 gradient-hero rounded-lg flex items-center justify-center text-primary-foreground text-sm font-bold">
                        {index + 1}
                      </span>
                      {section.title}
                    </h2>
                    <p className="text-muted-foreground leading-relaxed whitespace-pre-line">
                      {section.content}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Contact Section for partner pages */}
            {page.page_type.startsWith("partner_") && (
              <Card variant="elevated" className="mt-8">
                <CardContent className="p-8 text-center">
                  <h2 className="text-xl font-semibold text-foreground mb-4">
                    Interested in Partnering with MyPakLabs?
                  </h2>
                  <p className="text-muted-foreground mb-6">
                    Contact our partnership team to discuss collaboration opportunities.
                  </p>
                  <div className="flex flex-col sm:flex-row gap-4 justify-center text-sm">
                    <a href="tel:+923167523434" className="text-primary hover:underline">
                      +92 316 7523434
                    </a>
                    <span className="hidden sm:inline text-muted-foreground">|</span>
                    <a href="mailto:support@mypaklabs.com" className="text-primary hover:underline">
                      support@mypaklabs.com
                    </a>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Last Updated */}
            {page.last_updated && (
              <p className="text-center text-sm text-muted-foreground mt-12">
                Last updated: {page.last_updated}
              </p>
            )}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default LegalPage;
