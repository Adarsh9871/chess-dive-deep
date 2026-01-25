import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, Pencil, Trash2, Video, Clock, GripVertical } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";

interface Program {
  id: string;
  title: string;
}

interface Lesson {
  id: string;
  program_id: string | null;
  title: string;
  description: string | null;
  content: string | null;
  video_url: string | null;
  order_index: number;
  duration_minutes: number | null;
  is_free: boolean;
  is_published: boolean;
  program?: Program;
}

const LessonsTab = () => {
  const { user } = useAuth();
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [programs, setPrograms] = useState<Program[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingLesson, setEditingLesson] = useState<Lesson | null>(null);
  const [filterProgram, setFilterProgram] = useState<string>("all");
  
  const [form, setForm] = useState({
    program_id: "",
    title: "",
    description: "",
    content: "",
    video_url: "",
    order_index: 0,
    duration_minutes: 15,
    is_free: false,
    is_published: false,
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    const [lessonsRes, programsRes] = await Promise.all([
      supabase.from("lessons").select("*, program:programs(id, title)").order("order_index"),
      supabase.from("programs").select("id, title").order("title"),
    ]);

    if (lessonsRes.error) toast.error("Failed to fetch lessons");
    if (programsRes.error) toast.error("Failed to fetch programs");

    setLessons(lessonsRes.data || []);
    setPrograms(programsRes.data || []);
    setLoading(false);
  };

  const resetForm = () => {
    setForm({
      program_id: "",
      title: "",
      description: "",
      content: "",
      video_url: "",
      order_index: lessons.length,
      duration_minutes: 15,
      is_free: false,
      is_published: false,
    });
    setEditingLesson(null);
  };

  const openEdit = (lesson: Lesson) => {
    setEditingLesson(lesson);
    setForm({
      program_id: lesson.program_id || "",
      title: lesson.title,
      description: lesson.description || "",
      content: lesson.content || "",
      video_url: lesson.video_url || "",
      order_index: lesson.order_index,
      duration_minutes: lesson.duration_minutes || 15,
      is_free: lesson.is_free,
      is_published: lesson.is_published,
    });
    setDialogOpen(true);
  };

  const handleSubmit = async () => {
    if (!form.title.trim()) {
      toast.error("Title is required");
      return;
    }

    const lessonData = {
      program_id: form.program_id || null,
      title: form.title,
      description: form.description || null,
      content: form.content || null,
      video_url: form.video_url || null,
      order_index: form.order_index,
      duration_minutes: form.duration_minutes,
      is_free: form.is_free,
      is_published: form.is_published,
      created_by: user?.id,
    };

    if (editingLesson) {
      const { error } = await supabase
        .from("lessons")
        .update(lessonData)
        .eq("id", editingLesson.id);

      if (error) {
        toast.error("Failed to update lesson");
        return;
      }
      toast.success("Lesson updated");
    } else {
      const { error } = await supabase
        .from("lessons")
        .insert(lessonData);

      if (error) {
        toast.error("Failed to create lesson");
        return;
      }
      toast.success("Lesson created");
    }

    setDialogOpen(false);
    resetForm();
    fetchData();
  };

  const deleteLesson = async (id: string) => {
    if (!confirm("Are you sure you want to delete this lesson?")) return;

    const { error } = await supabase.from("lessons").delete().eq("id", id);
    if (error) {
      toast.error("Failed to delete lesson");
      return;
    }
    toast.success("Lesson deleted");
    fetchData();
  };

  const togglePublish = async (lesson: Lesson) => {
    const { error } = await supabase
      .from("lessons")
      .update({ is_published: !lesson.is_published })
      .eq("id", lesson.id);

    if (error) {
      toast.error("Failed to update status");
      return;
    }
    fetchData();
  };

  const filteredLessons = filterProgram === "all" 
    ? lessons 
    : filterProgram === "none"
    ? lessons.filter(l => !l.program_id)
    : lessons.filter(l => l.program_id === filterProgram);

  if (loading) {
    return <div className="flex justify-center py-8"><div className="animate-spin w-6 h-6 border-2 border-primary border-t-transparent rounded-full" /></div>;
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Video className="w-5 h-5" />
              Lessons Management
            </CardTitle>
            <CardDescription>Upload and manage lesson content</CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Select value={filterProgram} onValueChange={setFilterProgram}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Filter by program" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Programs</SelectItem>
                <SelectItem value="none">No Program</SelectItem>
                {programs.map(p => (
                  <SelectItem key={p.id} value={p.id}>{p.title}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Dialog open={dialogOpen} onOpenChange={(open) => { setDialogOpen(open); if (!open) resetForm(); }}>
              <DialogTrigger asChild>
                <Button><Plus className="w-4 h-4 mr-2" /> Add Lesson</Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>{editingLesson ? "Edit Lesson" : "Create New Lesson"}</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div>
                    <Label>Program</Label>
                    <Select value={form.program_id} onValueChange={v => setForm({...form, program_id: v})}>
                      <SelectTrigger><SelectValue placeholder="Select a program (optional)" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">No Program (Standalone)</SelectItem>
                        {programs.map(p => (
                          <SelectItem key={p.id} value={p.id}>{p.title}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Title *</Label>
                    <Input value={form.title} onChange={e => setForm({...form, title: e.target.value})} placeholder="Introduction to Chess" />
                  </div>
                  <div>
                    <Label>Description</Label>
                    <Textarea value={form.description} onChange={e => setForm({...form, description: e.target.value})} rows={2} placeholder="Brief description..." />
                  </div>
                  <div>
                    <Label>Content</Label>
                    <Textarea value={form.content} onChange={e => setForm({...form, content: e.target.value})} rows={6} placeholder="Lesson content (Markdown supported)..." />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Video URL</Label>
                      <Input value={form.video_url} onChange={e => setForm({...form, video_url: e.target.value})} placeholder="https://youtube.com/..." />
                    </div>
                    <div>
                      <Label>Duration (minutes)</Label>
                      <Input type="number" value={form.duration_minutes} onChange={e => setForm({...form, duration_minutes: Number(e.target.value)})} />
                    </div>
                    <div>
                      <Label>Order Index</Label>
                      <Input type="number" value={form.order_index} onChange={e => setForm({...form, order_index: Number(e.target.value)})} />
                    </div>
                  </div>
                  <div className="flex items-center gap-6">
                    <div className="flex items-center gap-2">
                      <Switch checked={form.is_free} onCheckedChange={v => setForm({...form, is_free: v})} />
                      <Label>Free lesson</Label>
                    </div>
                    <div className="flex items-center gap-2">
                      <Switch checked={form.is_published} onCheckedChange={v => setForm({...form, is_published: v})} />
                      <Label>Published</Label>
                    </div>
                  </div>
                  <Button onClick={handleSubmit} className="w-full">{editingLesson ? "Update Lesson" : "Create Lesson"}</Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-8">#</TableHead>
              <TableHead>Lesson</TableHead>
              <TableHead>Program</TableHead>
              <TableHead>Duration</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredLessons.map(l => (
              <TableRow key={l.id}>
                <TableCell>
                  <div className="flex items-center gap-1 text-muted-foreground">
                    <GripVertical className="w-4 h-4" />
                    {l.order_index}
                  </div>
                </TableCell>
                <TableCell>
                  <div>
                    <p className="font-medium">{l.title}</p>
                    {l.video_url && <Badge variant="outline" className="text-xs mt-1"><Video className="w-3 h-3 mr-1" />Video</Badge>}
                  </div>
                </TableCell>
                <TableCell>
                  <span className="text-sm text-muted-foreground">{l.program?.title || "-"}</span>
                </TableCell>
                <TableCell>
                  {l.duration_minutes && (
                    <div className="flex items-center gap-1 text-sm text-muted-foreground">
                      <Clock className="w-3 h-3" />
                      {l.duration_minutes}m
                    </div>
                  )}
                </TableCell>
                <TableCell>
                  <div className="flex gap-1">
                    {l.is_free && <Badge variant="secondary">Free</Badge>}
                    <Badge 
                      variant={l.is_published ? "default" : "outline"} 
                      className="cursor-pointer" 
                      onClick={() => togglePublish(l)}
                    >
                      {l.is_published ? "Published" : "Draft"}
                    </Badge>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="sm" onClick={() => openEdit(l)}><Pencil className="w-4 h-4" /></Button>
                    <Button variant="ghost" size="sm" onClick={() => deleteLesson(l.id)}><Trash2 className="w-4 h-4 text-destructive" /></Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        {filteredLessons.length === 0 && <p className="text-center py-8 text-muted-foreground">No lessons found. Create your first lesson!</p>}
      </CardContent>
    </Card>
  );
};

export default LessonsTab;
