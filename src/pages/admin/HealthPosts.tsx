import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import AdminLayout from "@/components/admin/AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "@/hooks/use-toast";
import { Plus, Pencil, Trash2, Eye, Heart, MessageCircle, Image, Link, Calendar, User } from "lucide-react";
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
  const [viewingPost, setViewingPost] = useState<HealthPost | null>(null);
  const [deletingPost, setDeletingPost] = useState<HealthPost | null>(null);
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
      setDeletingPost(null);
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

        {/* Posts Grid */}
        {isLoading ? (
          <div className="text-center py-8">Loading...</div>
        ) : posts?.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            No posts yet. Create your first health article!
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {posts?.map((post) => (
              <Card key={post.id} className="overflow-hidden hover:shadow-md transition-shadow">
                {post.featured_image_url && (
                  <div className="aspect-video bg-muted overflow-hidden">
                    <img
                      src={post.featured_image_url}
                      alt={post.title}
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}
                <CardContent className="p-4 space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="font-semibold line-clamp-2 flex-1">{post.title}</h3>
                    <Badge variant={post.is_published ? "default" : "outline"} className="shrink-0">
                      {post.is_published ? "Published" : "Draft"}
                    </Badge>
                  </div>

                  {post.excerpt && (
                    <p className="text-sm text-muted-foreground line-clamp-2">{post.excerpt}</p>
                  )}

                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <User className="w-3 h-3" />
                      {post.author_type}
                    </span>
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {format(new Date(post.updated_at), "MMM d, yyyy")}
                    </span>
                  </div>

                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Heart className="w-3 h-3" /> {post.likes_count}
                    </span>
                    <span className="flex items-center gap-1">
                      <MessageCircle className="w-3 h-3" /> {post.comments_count}
                    </span>
                    <span className="flex items-center gap-1">
                      <Eye className="w-3 h-3" /> {post.views_count}
                    </span>
                  </div>

                  {post.tags && post.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {post.tags.slice(0, 3).map((tag) => (
                        <Badge key={tag} variant="secondary" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                      {post.tags.length > 3 && (
                        <Badge variant="secondary" className="text-xs">
                          +{post.tags.length - 3}
                        </Badge>
                      )}
                    </div>
                  )}

                  <div className="flex items-center gap-2 pt-2 border-t">
                    <Button
                      size="sm"
                      variant="outline"
                      className="flex-1"
                      onClick={() => setViewingPost(post)}
                    >
                      <Eye className="w-4 h-4 mr-1" />
                      View
                    </Button>
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
                      onClick={() => setDeletingPost(post)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* View Post Dialog */}
        <Dialog open={!!viewingPost} onOpenChange={() => setViewingPost(null)}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{viewingPost?.title}</DialogTitle>
            </DialogHeader>
            {viewingPost && (
              <div className="space-y-4">
                {viewingPost.featured_image_url && (
                  <img
                    src={viewingPost.featured_image_url}
                    alt={viewingPost.title}
                    className="w-full rounded-lg max-h-80 object-cover"
                  />
                )}

                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <User className="w-4 h-4" />
                    {viewingPost.author_type}
                  </span>
                  <span className="flex items-center gap-1">
                    <Calendar className="w-4 h-4" />
                    {format(new Date(viewingPost.created_at), "MMM d, yyyy 'at' h:mm a")}
                  </span>
                  <Badge variant={viewingPost.is_published ? "default" : "outline"}>
                    {viewingPost.is_published ? "Published" : "Draft"}
                  </Badge>
                </div>

                <div className="flex items-center gap-4 text-sm">
                  <span className="flex items-center gap-1">
                    <Heart className="w-4 h-4 text-red-500" /> {viewingPost.likes_count} likes
                  </span>
                  <span className="flex items-center gap-1">
                    <MessageCircle className="w-4 h-4 text-blue-500" /> {viewingPost.comments_count} comments
                  </span>
                  <span className="flex items-center gap-1">
                    <Eye className="w-4 h-4 text-green-500" /> {viewingPost.views_count} views
                  </span>
                </div>

                {viewingPost.tags && viewingPost.tags.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {viewingPost.tags.map((tag) => (
                      <Badge key={tag} variant="secondary">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                )}

                <div
                  className="prose prose-sm max-w-none"
                  dangerouslySetInnerHTML={{ __html: viewingPost.content }}
                />

                <div className="flex justify-end gap-2 pt-4 border-t">
                  <Button variant="outline" onClick={() => setViewingPost(null)}>
                    Close
                  </Button>
                  <Button onClick={() => {
                    handleEdit(viewingPost);
                    setViewingPost(null);
                  }}>
                    <Pencil className="w-4 h-4 mr-2" />
                    Edit Post
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation Dialog */}
        <AlertDialog open={!!deletingPost} onOpenChange={() => setDeletingPost(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Post</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete "{deletingPost?.title}"? This action cannot be undone.
                All comments and likes associated with this post will also be deleted.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                onClick={() => deletingPost && deleteMutation.mutate(deletingPost.id)}
                disabled={deleteMutation.isPending}
              >
                {deleteMutation.isPending ? "Deleting..." : "Delete"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </AdminLayout>
  );
};

export default HealthPosts;
