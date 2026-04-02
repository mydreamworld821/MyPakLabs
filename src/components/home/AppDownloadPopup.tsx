import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { X, Download, Smartphone, Star } from "lucide-react";
import { Button } from "@/components/ui/button";

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
        // Show popup after 2 seconds
        setTimeout(() => setVisible(true), 2000);
      }
    };

    fetchVersion();
  }, []);

  const handleDismiss = () => {
    setVisible(false);
    sessionStorage.setItem("apk-popup-dismissed", "true");
  };

  const handleDownload = async () => {
    if (!version) return;
    
    // Increment download count
    await supabase.rpc("increment_download_count" as any, { version_id: version.id });
    
    window.open(version.file_url, "_blank");
    handleDismiss();
  };

  if (!visible || !version) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[9999] animate-in fade-in duration-300"
        onClick={handleDismiss}
      />

      {/* Popup */}
      <div className="fixed bottom-0 left-0 right-0 md:bottom-auto md:top-1/2 md:left-1/2 md:-translate-x-1/2 md:-translate-y-1/2 md:max-w-md z-[10000] animate-in slide-in-from-bottom duration-500 md:slide-in-from-bottom-0 md:fade-in">
        <div className="bg-background rounded-t-2xl md:rounded-2xl shadow-2xl border overflow-hidden">
          {/* Header with gradient */}
          <div className="bg-gradient-to-r from-primary to-primary/80 p-5 text-primary-foreground relative">
            <button
              onClick={handleDismiss}
              className="absolute top-3 right-3 p-1 rounded-full hover:bg-white/20 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-3">
              <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center shadow-lg">
                <Smartphone className="w-7 h-7 text-primary" />
              </div>
              <div>
                <h3 className="text-lg font-bold">MyPakLabs App</h3>
                <p className="text-sm opacity-90">v{version.version_name}</p>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="p-5 space-y-4">
            <div className="flex items-center gap-1">
              {[1,2,3,4,5].map(i => (
                <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
              ))}
              <span className="text-sm text-muted-foreground ml-1">Healthcare App</span>
            </div>

            <p className="text-sm text-muted-foreground">
              Download our app for a better experience! Book lab tests, find doctors, nurses & pharmacies — all from your phone.
            </p>

            {version.release_notes && (
              <p className="text-xs text-muted-foreground bg-muted p-2 rounded-lg">
                <span className="font-medium">What's new:</span> {version.release_notes}
              </p>
            )}

            <div className="flex items-center gap-4 text-xs text-muted-foreground">
              {version.file_size_mb && <span>📦 {version.file_size_mb} MB</span>}
              <span>📱 Android</span>
              <span>🔒 Secure</span>
            </div>

            <div className="flex gap-3">
              <Button onClick={handleDownload} className="flex-1 gap-2" size="lg">
                <Download className="w-5 h-5" />
                Download APK
              </Button>
              <Button variant="outline" onClick={handleDismiss} size="lg">
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
