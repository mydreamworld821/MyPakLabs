import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { X, Download, Star, Shield, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import appIcon from "@/assets/playstore-icon.png";

interface AppVersion {
  id: string;
  version_name: string;
  file_url: string;
  file_size_mb: number | null;
  release_notes: string | null;
}

const AppDownloadPopup = () => {
  const [version, setVersion] = useState<AppVersion | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const dismissed = sessionStorage.getItem("apk-popup-dismissed");
    if (dismissed) return;

    const fetchVersion = async () => {
      const { data } = await supabase
        .from("app_versions")
        .select("id, version_name, file_url, file_size_mb, release_notes")
        .eq("is_active", true)
        .order("version_code", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (data) {
        setVersion(data as AppVersion);
        setTimeout(() => setVisible(true), 2000);
      }
    };

    fetchVersion();
  }, []);

  const handleDismiss = () => {
    setVisible(false);
    sessionStorage.setItem("apk-popup-dismissed", "true");
  };

  const handleDownload = () => {
    handleDismiss();
    window.location.href = "/download";
  };

  if (!visible || !version) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[9999] animate-in fade-in duration-300"
        onClick={handleDismiss}
      />

      {/* Popup */}
      <div className="fixed bottom-0 left-0 right-0 md:bottom-auto md:top-1/2 md:left-1/2 md:-translate-x-1/2 md:-translate-y-1/2 md:max-w-lg z-[10000] animate-in slide-in-from-bottom duration-500 md:slide-in-from-bottom-0 md:fade-in">
        <div className="bg-background rounded-t-3xl md:rounded-3xl shadow-2xl border overflow-hidden">
          {/* Header with gradient and app icon */}
          <div className="bg-gradient-to-br from-primary via-primary/90 to-primary/70 p-6 text-primary-foreground relative">
            <button
              onClick={handleDismiss}
              className="absolute top-4 right-4 p-1.5 rounded-full bg-white/10 hover:bg-white/25 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-4">
              <div className="w-20 h-20 bg-white rounded-2xl flex items-center justify-center shadow-xl p-1.5 shrink-0">
                <img 
                  src={appIcon} 
                  alt="MyPakLabs" 
                  className="w-full h-full object-contain"
                />
              </div>
              <div>
                <h3 className="text-xl font-bold tracking-tight">MyPakLabs</h3>
                <p className="text-sm opacity-90 mt-0.5">Version {version.version_name}</p>
                <div className="flex items-center gap-1 mt-1.5">
                  {[1,2,3,4,5].map(i => (
                    <Star key={i} className="w-3.5 h-3.5 fill-yellow-300 text-yellow-300" />
                  ))}
                  <span className="text-xs opacity-80 ml-1">Healthcare App</span>
                </div>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="p-6 space-y-5">
            <div>
              <h4 className="font-semibold text-base text-foreground mb-1.5">
                Get the full experience on your phone
              </h4>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Book lab tests, find nurses & pharmacies near you — faster, easier, and with exclusive app-only features.
              </p>
            </div>

            {version.release_notes && (
              <div className="text-sm text-muted-foreground bg-muted/60 p-3 rounded-xl border">
                <span className="font-semibold text-foreground">What's new:</span>{" "}
                {version.release_notes}
              </div>
            )}

            <div className="flex items-center gap-5 text-xs text-muted-foreground">
              {version.file_size_mb && (
                <span className="flex items-center gap-1.5">
                  <Zap className="w-3.5 h-3.5 text-primary" />
                  {version.file_size_mb} MB
                </span>
              )}
              <span className="flex items-center gap-1.5">📱 Android</span>
              <span className="flex items-center gap-1.5">
                <Shield className="w-3.5 h-3.5 text-green-600" />
                Verified & Secure
              </span>
            </div>

            <div className="flex gap-3 pt-1">
              <Button onClick={handleDownload} className="flex-1 gap-2 h-12 text-base font-semibold rounded-xl" size="lg">
                <Download className="w-5 h-5" />
                Download App
              </Button>
              <Button variant="outline" onClick={handleDismiss} className="h-12 px-6 rounded-xl" size="lg">
                Later
              </Button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default AppDownloadPopup;
