import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Download, Share2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import appIcon from "@/assets/playstore-icon.png";
import { toast } from "sonner";

interface AppVersion {
  id: string;
  version_name: string;
  file_url: string;
  file_size_mb: number | null;
}

const AppDownloadBanner = () => {
  const [version, setVersion] = useState<AppVersion | null>(null);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    const hidden = sessionStorage.getItem("apk-banner-dismissed");
    if (hidden) {
      setDismissed(true);
      return;
    }

    const fetch = async () => {
      const { data } = await supabase
        .from("app_versions")
        .select("id, version_name, file_url, file_size_mb")
        .eq("is_active", true)
        .order("version_code", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (data) setVersion(data as AppVersion);
    };
    fetch();
  }, []);

  const handleDismiss = () => {
    setDismissed(true);
    sessionStorage.setItem("apk-banner-dismissed", "true");
  };

  const handleDownload = async () => {
    if (!version) return;
    await supabase.rpc("increment_download_count" as any, { version_id: version.id });
    window.open(version.file_url, "_blank");
  };

  const handleShare = async () => {
    const shareUrl = `${window.location.origin}/download`;
    if (navigator.share) {
      try {
        await navigator.share({
          title: "MyPakLabs - Healthcare App",
          text: "Download MyPakLabs app for lab tests, nurses & pharmacies near you!",
          url: shareUrl,
        });
      } catch {
        // user cancelled
      }
    } else {
      await navigator.clipboard.writeText(shareUrl);
      toast.success("Download link copied to clipboard!");
    }
  };

  if (dismissed || !version) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-[999] animate-in slide-in-from-bottom duration-500">
      <div className="bg-primary text-primary-foreground px-3 py-2.5 flex items-center gap-3 shadow-lg">
        <img src={appIcon} alt="MyPakLabs" className="w-10 h-10 rounded-xl bg-white p-0.5 shrink-0" />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold truncate">MyPakLabs App</p>
          <p className="text-[10px] opacity-80">Book labs, nurses & more</p>
        </div>
        <Button
          size="sm"
          variant="secondary"
          className="h-8 px-3 text-xs font-semibold shrink-0"
          onClick={handleShare}
        >
          <Share2 className="w-3.5 h-3.5 mr-1" />
          Share
        </Button>
        <Button
          size="sm"
          className="h-8 px-3 text-xs font-semibold bg-white text-primary hover:bg-white/90 shrink-0"
          onClick={handleDownload}
        >
          <Download className="w-3.5 h-3.5 mr-1" />
          Get
        </Button>
        <button onClick={handleDismiss} className="p-1 opacity-70 hover:opacity-100 shrink-0">
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

export default AppDownloadBanner;
