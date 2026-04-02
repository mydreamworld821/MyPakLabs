import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Download, Share2, Star, Shield, Zap, CheckCircle, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { AppReviewsSection } from "@/components/reviews/AppReviewsSection";
import appIcon from "@/assets/playstore-icon.png";
import { toast } from "sonner";

interface AppVersion {
  id: string;
  version_name: string;
  file_url: string;
  file_size_mb: number | null;
  release_notes: string | null;
  download_count: number;
}

const DownloadApp = () => {
  const [version, setVersion] = useState<AppVersion | null>(null);
  const [loading, setLoading] = useState(true);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setTimeout(() => setMounted(true), 50);
    const fetchVersion = async () => {
      const { data } = await supabase
        .from("app_versions")
        .select("id, version_name, file_url, file_size_mb, release_notes, download_count")
        .eq("is_active", true)
        .order("version_code", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (data) setVersion(data as AppVersion);
      setLoading(false);
    };
    fetchVersion();
  }, []);

  const handleDownload = async () => {
    if (!version) return;
    await supabase.rpc("increment_download_count" as any, { version_id: version.id });
    window.open(version.file_url, "_blank");
  };

  const handleShare = async () => {
    const shareUrl = window.location.href;
    if (navigator.share) {
      try {
        await navigator.share({
          title: "MyPakLabs - Healthcare App",
          text: "Download MyPakLabs app for lab tests, nurses & pharmacies near you!",
          url: shareUrl,
        });
      } catch {
        // cancelled
      }
    } else {
      await navigator.clipboard.writeText(shareUrl);
      toast.success("Link copied to clipboard!");
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      {/* Hero gradient header - with pt to clear sticky navbar */}
      <div
        className={`bg-gradient-to-br from-primary via-primary/90 to-primary/70 pt-20 pb-10 transition-all duration-700 ${
          mounted ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-4"
        }`}
      >
        <div className="container mx-auto px-4 text-center text-primary-foreground">
          <div className="inline-flex items-center gap-2 bg-white/15 backdrop-blur-sm rounded-full px-4 py-1.5 mb-4">
            <Zap className="w-4 h-4" />
            <span className="text-sm font-medium">Free Download</span>
          </div>
          <h1 className="text-3xl md:text-4xl font-bold">Download MyPakLabs App</h1>
          <p className="text-sm md:text-base opacity-90 mt-2 max-w-xl mx-auto">
            Your complete healthcare companion — labs, nurses, pharmacies & more
          </p>
        </div>
      </div>

      <main className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 items-start">
          {/* LEFT: App Card */}
          <div
            className={`lg:col-span-2 transition-all duration-700 delay-200 ${
              mounted ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-8"
            }`}
          >
            <Card className="overflow-hidden shadow-xl border-0 lg:sticky lg:top-24">
              <div className="bg-gradient-to-br from-primary via-primary/90 to-primary/70 p-6 text-primary-foreground text-center">
                <div className="w-24 h-24 bg-white rounded-3xl mx-auto mb-4 p-2 shadow-xl hover:scale-105 transition-transform duration-300">
                  <img src={appIcon} alt="MyPakLabs" className="w-full h-full object-contain" />
                </div>
                <h2 className="text-2xl font-bold">MyPakLabs</h2>
                <p className="text-sm opacity-90 mt-1">Your Complete Healthcare Companion</p>
                <div className="flex items-center justify-center gap-1 mt-2">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <Star key={i} className="w-4 h-4 fill-yellow-300 text-yellow-300" />
                  ))}
                </div>
                {version && (
                  <p className="text-xs opacity-70 mt-2">
                    Version {version.version_name} • {version.download_count}+ downloads
                  </p>
                )}
              </div>

              <CardContent className="p-6 space-y-5">
                {loading ? (
                  <div className="h-32 animate-pulse bg-muted rounded-xl" />
                ) : version ? (
                  <>
                    <div className="space-y-3">
                      {[
                        "Book lab tests at discounted rates",
                        "Find & book home nurses nearby",
                        "Order medicines from local pharmacies",
                        "Consult doctors online",
                        "Track all bookings in one place",
                      ].map((feature, idx) => (
                        <div
                          key={feature}
                          className="flex items-start gap-2.5 transition-all duration-500"
                          style={{
                            transitionDelay: `${400 + idx * 100}ms`,
                            opacity: mounted ? 1 : 0,
                            transform: mounted ? "translateX(0)" : "translateX(-12px)",
                          }}
                        >
                          <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 shrink-0" />
                          <span className="text-sm text-muted-foreground">{feature}</span>
                        </div>
                      ))}
                    </div>

                    <div className="flex items-center justify-center gap-5 text-xs text-muted-foreground">
                      {version.file_size_mb && (
                        <span className="flex items-center gap-1">
                          <Zap className="w-3.5 h-3.5 text-primary" />
                          {version.file_size_mb} MB
                        </span>
                      )}
                      <span>📱 Android</span>
                      <span className="flex items-center gap-1">
                        <Shield className="w-3.5 h-3.5 text-green-600" />
                        Secure
                      </span>
                    </div>

                    {version.release_notes && (
                      <div className="text-sm text-muted-foreground bg-muted/60 p-3 rounded-xl border">
                        <span className="font-semibold text-foreground">What's new: </span>
                        {version.release_notes}
                      </div>
                    )}

                    <div className="flex gap-3">
                      <Button
                        onClick={handleDownload}
                        className="flex-1 gap-2 h-12 text-base font-semibold rounded-xl hover:scale-[1.02] transition-transform"
                        size="lg"
                      >
                        <Download className="w-5 h-5" />
                        Download APK
                      </Button>
                      <Button
                        variant="outline"
                        onClick={handleShare}
                        className="h-12 px-5 rounded-xl hover:scale-105 transition-transform"
                        size="lg"
                      >
                        <Share2 className="w-5 h-5" />
                      </Button>
                    </div>
                  </>
                ) : (
                  <div className="text-center py-8">
                    <p className="text-muted-foreground">No version available yet.</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* RIGHT: App Reviews */}
          <div
            className={`lg:col-span-3 transition-all duration-700 delay-[400ms] ${
              mounted ? "opacity-100 translate-x-0" : "opacity-0 translate-x-8"
            }`}
          >
            <Card className="border-0 shadow-lg">
              <CardContent className="p-6">
                <div className="flex items-center gap-2 mb-6">
                  <MessageSquare className="h-6 w-6 text-primary" />
                  <h2 className="text-xl font-bold">App Ratings & Reviews</h2>
                </div>
                <AppReviewsSection />
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default DownloadApp;
