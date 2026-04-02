import { useState, useEffect } from "react";
import AdminLayout from "@/components/admin/AdminLayout";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Upload, Trash2, Download, Smartphone, RefreshCw, Loader2 } from "lucide-react";

interface AppVersion {
  id: string;
  version_name: string;
  version_code: number;
  file_url: string;
  file_size_mb: number | null;
  release_notes: string | null;
  is_active: boolean;
  download_count: number;
  created_at: string;
}

const AppVersions = () => {
  const [versions, setVersions] = useState<AppVersion[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [versionName, setVersionName] = useState("");
  const [versionCode, setVersionCode] = useState("");
  const [releaseNotes, setReleaseNotes] = useState("");
  const [apkFile, setApkFile] = useState<File | null>(null);

  const fetchVersions = async () => {
    const { data, error } = await supabase
      .from("app_versions")
      .select("*")
      .order("version_code", { ascending: false });
    if (data) setVersions(data);
    if (error) console.error(error);
    setLoading(false);
  };

  useEffect(() => {
    fetchVersions();
  }, []);

  const handleUpload = async () => {
    if (!apkFile || !versionName || !versionCode) {
      toast.error("Please fill version name, version code, and select an APK file");
      return;
    }

    setUploading(true);
    try {
      const fileName = `mypaklabs-v${versionName}.apk`;
      const fileSizeMb = parseFloat((apkFile.size / (1024 * 1024)).toFixed(2));

      // Upload APK to storage
      const { error: uploadError } = await supabase.storage
        .from("app-releases")
        .upload(fileName, apkFile, { upsert: true, contentType: "application/vnd.android.package-archive" });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: urlData } = supabase.storage
        .from("app-releases")
        .getPublicUrl(fileName);

      // Deactivate old versions
      await supabase
        .from("app_versions")
        .update({ is_active: false } as any)
        .eq("is_active", true);

      // Insert new version record
      const { error: insertError } = await supabase
        .from("app_versions")
        .insert({
          version_name: versionName,
          version_code: parseInt(versionCode),
          file_url: urlData.publicUrl,
          file_size_mb: fileSizeMb,
          release_notes: releaseNotes || null,
          is_active: true,
        } as any);

      if (insertError) throw insertError;

      toast.success("APK uploaded successfully!");
      setVersionName("");
      setVersionCode("");
      setReleaseNotes("");
      setApkFile(null);
      // Reset file input
      const fileInput = document.getElementById("apk-file") as HTMLInputElement;
      if (fileInput) fileInput.value = "";
      fetchVersions();
    } catch (error: any) {
      console.error(error);
      toast.error("Failed to upload APK: " + error.message);
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (version: AppVersion) => {
    if (!confirm(`Delete version ${version.version_name}?`)) return;

    try {
      // Extract filename from URL
      const fileName = `mypaklabs-v${version.version_name}.apk`;

      // Delete from storage
      await supabase.storage.from("app-releases").remove([fileName]);

      // Delete record
      await supabase.from("app_versions").delete().eq("id", version.id);

      toast.success("Version deleted");
      fetchVersions();
    } catch (error: any) {
      toast.error("Failed to delete: " + error.message);
    }
  };

  const handleSetActive = async (version: AppVersion) => {
    try {
      // Deactivate all
      await supabase
        .from("app_versions")
        .update({ is_active: false } as any)
        .neq("id", "00000000-0000-0000-0000-000000000000");

      // Activate selected
      await supabase
        .from("app_versions")
        .update({ is_active: true } as any)
        .eq("id", version.id);

      toast.success(`Version ${version.version_name} set as active`);
      fetchVersions();
    } catch (error: any) {
      toast.error("Failed to update: " + error.message);
    }
  };

  return (
    <AdminLayout>
      <div className="p-4 md:p-6 space-y-6">
        <div className="flex items-center gap-3">
          <Smartphone className="w-6 h-6 text-primary" />
          <h1 className="text-2xl font-bold">App Version Manager</h1>
        </div>

        {/* Upload New Version */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Upload className="w-5 h-5" />
              Upload New APK
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="version-name">Version Name *</Label>
                <Input
                  id="version-name"
                  placeholder="e.g. 1.0.0"
                  value={versionName}
                  onChange={(e) => setVersionName(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="version-code">Version Code *</Label>
                <Input
                  id="version-code"
                  type="number"
                  placeholder="e.g. 1"
                  value={versionCode}
                  onChange={(e) => setVersionCode(e.target.value)}
                />
              </div>
            </div>
            <div>
              <Label htmlFor="release-notes">Release Notes</Label>
              <Textarea
                id="release-notes"
                placeholder="What's new in this version..."
                value={releaseNotes}
                onChange={(e) => setReleaseNotes(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="apk-file">APK File *</Label>
              <Input
                id="apk-file"
                type="file"
                accept=".apk"
                onChange={(e) => setApkFile(e.target.files?.[0] || null)}
              />
              {apkFile && (
                <p className="text-xs text-muted-foreground mt-1">
                  {apkFile.name} ({(apkFile.size / (1024 * 1024)).toFixed(2)} MB)
                </p>
              )}
            </div>
            <Button onClick={handleUpload} disabled={uploading} className="w-full md:w-auto">
              {uploading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Uploading...
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4 mr-2" />
                  Upload APK
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Existing Versions */}
        <Card>
          <CardHeader>
            <CardTitle>All Versions</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin" />
              </div>
            ) : versions.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">No APK versions uploaded yet</p>
            ) : (
              <div className="space-y-3">
                {versions.map((v) => (
                  <div
                    key={v.id}
                    className="flex flex-col md:flex-row md:items-center justify-between gap-3 p-4 border rounded-lg"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold">v{v.version_name}</span>
                        <Badge variant="outline">Code: {v.version_code}</Badge>
                        {v.is_active && (
                          <Badge className="bg-green-100 text-green-700">Active</Badge>
                        )}
                        {v.file_size_mb && (
                          <Badge variant="secondary">{v.file_size_mb} MB</Badge>
                        )}
                      </div>
                      {v.release_notes && (
                        <p className="text-sm text-muted-foreground mt-1">{v.release_notes}</p>
                      )}
                      <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                        <span>{new Date(v.created_at).toLocaleDateString()}</span>
                        <span className="flex items-center gap-1">
                          <Download className="w-3 h-3" /> {v.download_count} downloads
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {!v.is_active && (
                        <Button variant="outline" size="sm" onClick={() => handleSetActive(v)}>
                          <RefreshCw className="w-4 h-4 mr-1" />
                          Set Active
                        </Button>
                      )}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => window.open(v.file_url, "_blank")}
                      >
                        <Download className="w-4 h-4 mr-1" />
                        Download
                      </Button>
                      <Button variant="destructive" size="sm" onClick={() => handleDelete(v)}>
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
};

export default AppVersions;
