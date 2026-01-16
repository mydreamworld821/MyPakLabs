import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import AdminLayout from "@/components/admin/AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { toast } from "@/hooks/use-toast";
import { Plus, Pencil, Trash2, Eye, Heart, MessageCircle, Image, Link } from "lucide-react";
import { format } from "date-fns";
import ImageUpload from "@/components/admin/ImageUpload";

interface HealthPost {
  id: string;
  title: string;
  content: string;
  excerpt: string | null;
  featured_image_url: string | null;
  author_type: string;
  is_published: boolean;
  likes_count: number;
  comments_count: number;
  views_count: number;
  tags: string[] | null;
  created_at: string;
  updated_at: string;
}

const HealthPosts = () => {
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingPost, setEditingPost] = useState<HealthPost | null>(null);
  const [formData, setFormData] = useState({
    title: "",
    content: "",
    excerpt: "",
    featured_image_url: "",
    is_published: false,
    tags: "",
  });

  const { data: posts, isLoading } = useQuery({
    queryKey: ["health-posts-admin"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("health_posts")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as HealthPost[];
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) throw new Error("Not authenticated");

      const { error } = await supabase.from("health_posts").insert({
        title: data.title,
        content: data.content,
        excerpt: data.excerpt || null,
        featured_image_url: data.featured_image_url || null,
        is_published: data.is_published,
        tags: data.tags ? data.tags.split(",").map((t) => t.trim()) : null,
        author_id: userData.user.id,
        author_type: "admin",
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["health-posts-admin"] });
      toast({ title: "Success", description: "Post created successfully" });
      resetForm();
    },
    onError: (error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: typeof formData }) => {
      const { error } = await supabase
        .from("health_posts")
        .update({
          title: data.title,
          content: data.content,
          excerpt: data.excerpt || null,
          featured_image_url: data.featured_image_url || null,
          is_published: data.is_published,
          tags: data.tags ? data.tags.split(",").map((t) => t.trim()) : null,
        })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["health-posts-admin"] });
      toast({ title: "Success", description: "Post updated successfully" });
      resetForm();
    },
    onError: (error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("health_posts").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["health-posts-admin"] });
      toast({ title: "Success", description: "Post deleted successfully" });
    },
    onError: (error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const resetForm = () => {
    setFormData({
      title: "",
      content: "",
      excerpt: "",
      featured_image_url: "",
      is_published: false,
      tags: "",
    });
    setEditingPost(null);
    setIsDialogOpen(false);
  };

  const handleEdit = (post: HealthPost) => {
    setEditingPost(post);
    setFormData({
      title: post.title,
      content: post.content,
      excerpt: post.excerpt || "",
      featured_image_url: post.featured_image_url || "",
      is_published: post.is_published,
      tags: post.tags?.join(", ") || "",
    });
    setIsDialogOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim() || !formData.content.trim()) {
      toast({ title: "Error", description: "Title and content are required", variant: "destructive" });
      return;
    }

    if (editingPost) {
      updateMutation.mutate({ id: editingPost.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const insertLink = () => {
    const url = prompt("Enter URL:");
    if (url) {
      const linkText = prompt("Enter link text:") || url;
      const linkHtml = `<a href="${url}" target="_blank" rel="noopener noreferrer" class="text-primary underline">${linkText}</a>`;
      setFormData({ ...formData, content: formData.content + linkHtml });
    }
  };

  const insertImage = () => {
    const imageUrl = prompt("Enter image URL:");
    if (imageUrl) {
      const imageHtml = `<img src="${imageUrl}" alt="Image" class="max-w-full h-auto rounded-lg my-4" />`;
      setFormData({ ...formData, content: formData.content + imageHtml });
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Health Hub Posts</h1>
            <p className="text-muted-foreground">Manage health articles and stories</p>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => resetForm()}>
                <Plus className="w-4 h-4 mr-2" />
                New Post
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>{editingPost ? "Edit Post" : "Create New Post"}</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="title">Title</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="Enter post title"
                  />
                </div>

                <div>
                  <Label htmlFor="excerpt">Excerpt (Short summary)</Label>
                  <Textarea
                    id="excerpt"
                    value={formData.excerpt}
                    onChange={(e) => setFormData({ ...formData, excerpt: e.target.value })}
                    placeholder="Brief summary of the post"
                    rows={2}
                  />
                </div>

                <ImageUpload
                  label="Featured Image"
                  bucket="health-posts"
                  folder="featured"
                  currentUrl={formData.featured_image_url}
                  onUpload={(url) => setFormData({ ...formData, featured_image_url: url })}
                  aspectRatio="banner"
                  skipCrop={true}
                />

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <Label htmlFor="content">Content</Label>
                    <div className="flex gap-2">
                      <Button type="button" variant="outline" size="sm" onClick={insertLink}>
                        <Link className="w-4 h-4 mr-1" />
                        Add Link
                      </Button>
                      <Button type="button" variant="outline" size="sm" onClick={insertImage}>
                        <Image className="w-4 h-4 mr-1" />
                        Add Image
                      </Button>
                    </div>
                  </div>
                  <Textarea
                    id="content"
                    value={formData.content}
                    onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                    placeholder="Write your health article here... You can use HTML for formatting. No word limit!"
                    rows={15}
                    className="font-mono text-sm"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Supports HTML formatting. Use &lt;b&gt;bold&lt;/b&gt;, &lt;i&gt;italic&lt;/i&gt;, &lt;h2&gt;headings&lt;/h2&gt;, etc.
                  </p>
                </div>

                <div>
                  <Label htmlFor="tags">Tags (comma separated)</Label>
                  <Input
                    id="tags"
                    value={formData.tags}
                    onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                    placeholder="health, nutrition, fitness"
                  />
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    id="is_published"
                    checked={formData.is_published}
                    onCheckedChange={(checked) => setFormData({ ...formData, is_published: checked })}
                  />
                  <Label htmlFor="is_published">Publish immediately</Label>
                </div>

                <div className="flex justify-end gap-2">
                  <Button type="button" variant="outline" onClick={resetForm}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>
                    {editingPost ? "Update" : "Create"} Post
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>All Posts</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-8">Loading...</div>
            ) : posts?.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No posts yet. Create your first health article!
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Title</TableHead>
                    <TableHead>Author</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Engagement</TableHead>
                    <TableHead>Updated</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {posts?.map((post) => (
                    <TableRow key={post.id}>
                      <TableCell className="font-medium max-w-[200px] truncate">
                        {post.title}
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary">{post.author_type}</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={post.is_published ? "default" : "outline"}>
                          {post.is_published ? "Published" : "Draft"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-3 text-sm text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Heart className="w-4 h-4" /> {post.likes_count}
                          </span>
                          <span className="flex items-center gap-1">
                            <MessageCircle className="w-4 h-4" /> {post.comments_count}
                          </span>
                          <span className="flex items-center gap-1">
                            <Eye className="w-4 h-4" /> {post.views_count}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {format(new Date(post.updated_at), "MMM d, yyyy")}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleEdit(post)}
                          >
                            <Pencil className="w-4 h-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => {
                              if (confirm("Delete this post?")) {
                                deleteMutation.mutate(post.id);
                              }
                            }}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
};

export default HealthPosts;
