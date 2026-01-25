import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, Pencil, Trash2, FileText, Eye } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { format } from "date-fns";
import { useAuth } from "@/hooks/useAuth";

interface Blog {
  id: string;
  title: string;
  slug: string;
  content: string;
  excerpt: string | null;
  cover_image_url: string | null;
  is_published: boolean;
  published_at: string | null;
  tags: string[];
  views: number;
  created_at: string;
}

const BlogsTab = () => {
  const { user } = useAuth();
  const [blogs, setBlogs] = useState<Blog[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingBlog, setEditingBlog] = useState<Blog | null>(null);
  
  const [form, setForm] = useState({
    title: "",
    slug: "",
    content: "",
    excerpt: "",
    cover_image_url: "",
    tags: "",
    is_published: false,
  });

  useEffect(() => {
    fetchBlogs();
  }, []);

  const fetchBlogs = async () => {
    const { data, error } = await supabase
      .from("blogs")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      toast.error("Failed to fetch blogs");
      return;
    }

    setBlogs(data || []);
    setLoading(false);
  };

  const generateSlug = (title: string) => {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");
  };

  const resetForm = () => {
    setForm({
      title: "",
      slug: "",
      content: "",
      excerpt: "",
      cover_image_url: "",
      tags: "",
      is_published: false,
    });
    setEditingBlog(null);
  };

  const openEdit = (blog: Blog) => {
    setEditingBlog(blog);
    setForm({
      title: blog.title,
      slug: blog.slug,
      content: blog.content,
      excerpt: blog.excerpt || "",
      cover_image_url: blog.cover_image_url || "",
      tags: blog.tags.join(", "),
      is_published: blog.is_published,
    });
    setDialogOpen(true);
  };

  const handleSubmit = async () => {
    if (!form.title.trim() || !form.content.trim()) {
      toast.error("Title and content are required");
      return;
    }

    const slug = form.slug || generateSlug(form.title);

    const blogData = {
      title: form.title,
      slug,
      content: form.content,
      excerpt: form.excerpt || null,
      cover_image_url: form.cover_image_url || null,
      tags: form.tags.split(",").map(t => t.trim()).filter(Boolean),
      is_published: form.is_published,
      published_at: form.is_published ? new Date().toISOString() : null,
      author_id: user?.id,
    };

    if (editingBlog) {
      const { error } = await supabase
        .from("blogs")
        .update(blogData)
        .eq("id", editingBlog.id);

      if (error) {
        toast.error("Failed to update blog");
        return;
      }
      toast.success("Blog updated");
    } else {
      const { error } = await supabase
        .from("blogs")
        .insert(blogData);

      if (error) {
        if (error.code === "23505") {
          toast.error("A blog with this slug already exists");
        } else {
          toast.error("Failed to create blog");
        }
        return;
      }
      toast.success("Blog created");
    }

    setDialogOpen(false);
    resetForm();
    fetchBlogs();
  };

  const deleteBlog = async (id: string) => {
    if (!confirm("Are you sure you want to delete this blog?")) return;

    const { error } = await supabase.from("blogs").delete().eq("id", id);
    if (error) {
      toast.error("Failed to delete blog");
      return;
    }
    toast.success("Blog deleted");
    fetchBlogs();
  };

  const togglePublish = async (blog: Blog) => {
    const { error } = await supabase
      .from("blogs")
      .update({ 
        is_published: !blog.is_published,
        published_at: !blog.is_published ? new Date().toISOString() : null
      })
      .eq("id", blog.id);

    if (error) {
      toast.error("Failed to update status");
      return;
    }
    fetchBlogs();
  };

  if (loading) {
    return <div className="flex justify-center py-8"><div className="animate-spin w-6 h-6 border-2 border-primary border-t-transparent rounded-full" /></div>;
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5" />
              Blog Management
            </CardTitle>
            <CardDescription>Write and publish blog posts</CardDescription>
          </div>
          <Dialog open={dialogOpen} onOpenChange={(open) => { setDialogOpen(open); if (!open) resetForm(); }}>
            <DialogTrigger asChild>
              <Button><Plus className="w-4 h-4 mr-2" /> New Blog Post</Button>
            </DialogTrigger>
            <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>{editingBlog ? "Edit Blog Post" : "Create New Blog Post"}</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div>
                  <Label>Title *</Label>
                  <Input 
                    value={form.title} 
                    onChange={e => {
                      setForm({
                        ...form, 
                        title: e.target.value,
                        slug: editingBlog ? form.slug : generateSlug(e.target.value)
                      });
                    }} 
                    placeholder="10 Tips to Improve Your Chess Game" 
                  />
                </div>
                <div>
                  <Label>Slug</Label>
                  <Input value={form.slug} onChange={e => setForm({...form, slug: e.target.value})} placeholder="10-tips-to-improve-your-chess-game" />
                </div>
                <div>
                  <Label>Excerpt</Label>
                  <Textarea value={form.excerpt} onChange={e => setForm({...form, excerpt: e.target.value})} rows={2} placeholder="Brief summary shown in listings..." />
                </div>
                <div>
                  <Label>Content *</Label>
                  <Textarea value={form.content} onChange={e => setForm({...form, content: e.target.value})} rows={12} placeholder="Write your blog content here... (Markdown supported)" />
                </div>
                <div>
                  <Label>Cover Image URL</Label>
                  <Input value={form.cover_image_url} onChange={e => setForm({...form, cover_image_url: e.target.value})} placeholder="https://..." />
                </div>
                <div>
                  <Label>Tags (comma-separated)</Label>
                  <Input value={form.tags} onChange={e => setForm({...form, tags: e.target.value})} placeholder="chess, strategy, tips" />
                </div>
                <div className="flex items-center gap-2">
                  <Switch checked={form.is_published} onCheckedChange={v => setForm({...form, is_published: v})} />
                  <Label>Publish immediately</Label>
                </div>
                <Button onClick={handleSubmit} className="w-full">{editingBlog ? "Update Blog Post" : "Create Blog Post"}</Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Title</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Views</TableHead>
              <TableHead>Published</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {blogs.map(b => (
              <TableRow key={b.id}>
                <TableCell>
                  <div>
                    <p className="font-medium">{b.title}</p>
                    <p className="text-xs text-muted-foreground">/{b.slug}</p>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge 
                    variant={b.is_published ? "default" : "secondary"} 
                    className="cursor-pointer" 
                    onClick={() => togglePublish(b)}
                  >
                    {b.is_published ? "Published" : "Draft"}
                  </Badge>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-1 text-muted-foreground">
                    <Eye className="w-3 h-3" />
                    {b.views}
                  </div>
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {b.published_at ? format(new Date(b.published_at), "MMM d, yyyy") : "-"}
                </TableCell>
                <TableCell>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="sm" onClick={() => openEdit(b)}><Pencil className="w-4 h-4" /></Button>
                    <Button variant="ghost" size="sm" onClick={() => deleteBlog(b.id)}><Trash2 className="w-4 h-4 text-destructive" /></Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        {blogs.length === 0 && <p className="text-center py-8 text-muted-foreground">No blog posts yet. Write your first post!</p>}
      </CardContent>
    </Card>
  );
};

export default BlogsTab;
