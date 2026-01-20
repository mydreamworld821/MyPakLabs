import { useState } from "react";
import AdminLayout from "@/components/admin/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  FileText,
  Shield,
  Building,
  Plus,
  Edit,
  Trash2,
  Eye,
  GripVertical,
  ExternalLink,
  Loader2,
} from "lucide-react";
import { useAdminLegalPages, LegalPage, LegalPageSection } from "@/hooks/useLegalPages";
import { toast } from "sonner";

const iconOptions = [
  { value: "FileText", label: "Document", icon: FileText },
  { value: "Shield", label: "Shield", icon: Shield },
  { value: "Building", label: "Building", icon: Building },
];

const LegalPages = () => {
  const { pages, isLoading, createPage, updatePage, deletePage } = useAdminLegalPages();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingPage, setEditingPage] = useState<LegalPage | null>(null);
  const [formData, setFormData] = useState({
    page_type: "",
    title: "",
    subtitle: "",
    badge_text: "Legal",
    icon_name: "FileText",
    route_path: "",
    footer_section: "legal" as "legal" | "partners",
    footer_label: "",
    show_in_footer: true,
    is_active: true,
    last_updated: "January 2026",
    sections: [] as LegalPageSection[],
  });

  const resetForm = () => {
    setFormData({
      page_type: "",
      title: "",
      subtitle: "",
      badge_text: "Legal",
      icon_name: "FileText",
      route_path: "",
      footer_section: "legal",
      footer_label: "",
      show_in_footer: true,
      is_active: true,
      last_updated: "January 2026",
      sections: [],
    });
    setEditingPage(null);
  };

  const handleEdit = (page: LegalPage) => {
    setEditingPage(page);
    setFormData({
      page_type: page.page_type,
      title: page.title,
      subtitle: page.subtitle || "",
      badge_text: page.badge_text || "Legal",
      icon_name: page.icon_name || "FileText",
      route_path: page.route_path,
      footer_section: page.footer_section,
      footer_label: page.footer_label || "",
      show_in_footer: page.show_in_footer,
      is_active: page.is_active,
      last_updated: page.last_updated || "January 2026",
      sections: page.sections || [],
    });
    setIsDialogOpen(true);
  };

  const handleAddSection = () => {
    setFormData(prev => ({
      ...prev,
      sections: [...prev.sections, { title: "", content: "" }],
    }));
  };

  const handleRemoveSection = (index: number) => {
    setFormData(prev => ({
      ...prev,
      sections: prev.sections.filter((_, i) => i !== index),
    }));
  };

  const handleSectionChange = (index: number, field: "title" | "content", value: string) => {
    setFormData(prev => ({
      ...prev,
      sections: prev.sections.map((section, i) =>
        i === index ? { ...section, [field]: value } : section
      ),
    }));
  };

  const handleSubmit = async () => {
    if (!formData.title || !formData.route_path || !formData.page_type) {
      toast.error("Please fill in all required fields");
      return;
    }

    const payload = {
      ...formData,
      subtitle: formData.subtitle || null,
      footer_label: formData.footer_label || formData.title,
    };

    if (editingPage) {
      await updatePage.mutateAsync({ id: editingPage.id, ...payload });
    } else {
      await createPage.mutateAsync(payload);
    }

    setIsDialogOpen(false);
    resetForm();
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this page?")) return;
    await deletePage.mutateAsync(id);
  };

  const getIconComponent = (iconName: string) => {
    const option = iconOptions.find(o => o.value === iconName);
    const IconComponent = option?.icon || FileText;
    return <IconComponent className="h-4 w-4" />;
  };

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Legal Pages</h1>
            <p className="text-muted-foreground">
              Manage Terms, Privacy Policy, and Partner Terms
            </p>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={(open) => {
            setIsDialogOpen(open);
            if (!open) resetForm();
          }}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Add New Page
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl max-h-[90vh]">
              <DialogHeader>
                <DialogTitle>
                  {editingPage ? "Edit Legal Page" : "Create Legal Page"}
                </DialogTitle>
              </DialogHeader>
              <ScrollArea className="max-h-[70vh] pr-4">
                <div className="space-y-6 pt-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Page Type *</Label>
                      <Select
                        value={formData.page_type}
                        onValueChange={(v) => setFormData(prev => ({ ...prev, page_type: v }))}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="terms">Terms & Conditions</SelectItem>
                          <SelectItem value="privacy">Privacy Policy</SelectItem>
                          <SelectItem value="partner_lab">Partner Lab Terms</SelectItem>
                          <SelectItem value="partner_nurse">Partner Nurse Terms</SelectItem>
                          <SelectItem value="partner_pharmacy">Partner Pharmacy Terms</SelectItem>
                          <SelectItem value="partner_doctor">Partner Doctor Terms</SelectItem>
                          <SelectItem value="other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Icon</Label>
                      <Select
                        value={formData.icon_name}
                        onValueChange={(v) => setFormData(prev => ({ ...prev, icon_name: v }))}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {iconOptions.map(opt => (
                            <SelectItem key={opt.value} value={opt.value}>
                              <span className="flex items-center gap-2">
                                <opt.icon className="h-4 w-4" />
                                {opt.label}
                              </span>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Title *</Label>
                      <Input
                        value={formData.title}
                        onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                        placeholder="e.g. Terms & Conditions"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Subtitle</Label>
                      <Input
                        value={formData.subtitle}
                        onChange={(e) => setFormData(prev => ({ ...prev, subtitle: e.target.value }))}
                        placeholder="e.g. For Patients"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Route Path *</Label>
                      <Input
                        value={formData.route_path}
                        onChange={(e) => setFormData(prev => ({ ...prev, route_path: e.target.value }))}
                        placeholder="e.g. /terms"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Badge Text</Label>
                      <Input
                        value={formData.badge_text}
                        onChange={(e) => setFormData(prev => ({ ...prev, badge_text: e.target.value }))}
                        placeholder="e.g. Legal"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Footer Section</Label>
                      <Select
                        value={formData.footer_section}
                        onValueChange={(v: "legal" | "partners") => setFormData(prev => ({ ...prev, footer_section: v }))}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="legal">Legal</SelectItem>
                          <SelectItem value="partners">Partners</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Footer Label</Label>
                      <Input
                        value={formData.footer_label}
                        onChange={(e) => setFormData(prev => ({ ...prev, footer_label: e.target.value }))}
                        placeholder="Label shown in footer"
                      />
                    </div>
                  </div>

                  <div className="flex gap-6">
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={formData.is_active}
                        onCheckedChange={(v) => setFormData(prev => ({ ...prev, is_active: v }))}
                      />
                      <Label>Active</Label>
                    </div>
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={formData.show_in_footer}
                        onCheckedChange={(v) => setFormData(prev => ({ ...prev, show_in_footer: v }))}
                      />
                      <Label>Show in Footer</Label>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <Label className="text-lg">Sections</Label>
                      <Button type="button" variant="outline" size="sm" onClick={handleAddSection}>
                        <Plus className="h-4 w-4 mr-1" />
                        Add Section
                      </Button>
                    </div>

                    {formData.sections.map((section, index) => (
                      <Card key={index}>
                        <CardContent className="pt-4 space-y-3">
                          <div className="flex items-center gap-2">
                            <GripVertical className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm font-medium">Section {index + 1}</span>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              className="ml-auto text-destructive"
                              onClick={() => handleRemoveSection(index)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                          <Input
                            placeholder="Section Title"
                            value={section.title}
                            onChange={(e) => handleSectionChange(index, "title", e.target.value)}
                          />
                          <Textarea
                            placeholder="Section Content"
                            value={section.content}
                            onChange={(e) => handleSectionChange(index, "content", e.target.value)}
                            rows={3}
                          />
                        </CardContent>
                      </Card>
                    ))}

                    {formData.sections.length === 0 && (
                      <p className="text-muted-foreground text-center py-8">
                        No sections yet. Click "Add Section" to start.
                      </p>
                    )}
                  </div>

                  <Button
                    className="w-full"
                    onClick={handleSubmit}
                    disabled={createPage.isPending || updatePage.isPending}
                  >
                    {(createPage.isPending || updatePage.isPending) ? "Saving..." : "Save Page"}
                  </Button>
                </div>
              </ScrollArea>
            </DialogContent>
          </Dialog>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>All Legal Pages</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Page</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Route</TableHead>
                  <TableHead>Footer</TableHead>
                  <TableHead>Sections</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pages.map((page) => (
                  <TableRow key={page.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {getIconComponent(page.icon_name || "FileText")}
                        <div>
                          <p className="font-medium">{page.title}</p>
                          {page.subtitle && (
                            <p className="text-xs text-muted-foreground">{page.subtitle}</p>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="capitalize">
                      {page.page_type.replace("_", " ")}
                    </TableCell>
                    <TableCell>
                      <code className="text-xs bg-muted px-2 py-1 rounded">{page.route_path}</code>
                    </TableCell>
                    <TableCell>
                      {page.show_in_footer ? (
                        <Badge variant="secondary" className="capitalize">
                          {page.footer_section}
                        </Badge>
                      ) : (
                        <span className="text-muted-foreground">Hidden</span>
                      )}
                    </TableCell>
                    <TableCell>{page.sections?.length || 0}</TableCell>
                    <TableCell>
                      {page.is_active ? (
                        <Badge className="bg-green-100 text-green-700">Active</Badge>
                      ) : (
                        <Badge variant="secondary">Inactive</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => window.open(page.route_path, "_blank")}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEdit(page)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-destructive"
                          onClick={() => handleDelete(page.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                {pages.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8">
                      <p className="text-muted-foreground">No legal pages yet</p>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
};

export default LegalPages;
