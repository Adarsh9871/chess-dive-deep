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
import { Plus, Pencil, Trash2, BookOpen, DollarSign } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { format } from "date-fns";
import { useAuth } from "@/hooks/useAuth";

interface Program {
  id: string;
  title: string;
  description: string | null;
  short_description: string | null;
  price: number;
  is_subscription: boolean;
  subscription_interval: string | null;
  features: string[];
  level: string;
  duration_weeks: number | null;
  is_active: boolean;
  image_url: string | null;
  created_at: string;
}

const ProgramsTab = () => {
  const { user } = useAuth();
  const [programs, setPrograms] = useState<Program[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingProgram, setEditingProgram] = useState<Program | null>(null);
  
  const [form, setForm] = useState({
    title: "",
    description: "",
    short_description: "",
    price: 0,
    is_subscription: false,
    subscription_interval: "monthly",
    features: "",
    level: "beginner",
    duration_weeks: 4,
    is_active: true,
    image_url: "",
  });

  useEffect(() => {
    fetchPrograms();
  }, []);

  const fetchPrograms = async () => {
    const { data, error } = await supabase
      .from("programs")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      toast.error("Failed to fetch programs");
      return;
    }

    setPrograms(data?.map(p => ({
      ...p,
      features: Array.isArray(p.features) ? (p.features as string[]) : []
    })) || []);
    setLoading(false);
  };

  const resetForm = () => {
    setForm({
      title: "",
      description: "",
      short_description: "",
      price: 0,
      is_subscription: false,
      subscription_interval: "monthly",
      features: "",
      level: "beginner",
      duration_weeks: 4,
      is_active: true,
      image_url: "",
    });
    setEditingProgram(null);
  };

  const openEdit = (program: Program) => {
    setEditingProgram(program);
    setForm({
      title: program.title,
      description: program.description || "",
      short_description: program.short_description || "",
      price: program.price,
      is_subscription: program.is_subscription,
      subscription_interval: program.subscription_interval || "monthly",
      features: program.features.join("\n"),
      level: program.level,
      duration_weeks: program.duration_weeks || 4,
      is_active: program.is_active,
      image_url: program.image_url || "",
    });
    setDialogOpen(true);
  };

  const handleSubmit = async () => {
    if (!form.title.trim()) {
      toast.error("Title is required");
      return;
    }

    const programData = {
      title: form.title,
      description: form.description,
      short_description: form.short_description,
      price: form.price,
      is_subscription: form.is_subscription,
      subscription_interval: form.is_subscription ? form.subscription_interval : null,
      features: form.features.split("\n").filter(f => f.trim()),
      level: form.level,
      duration_weeks: form.duration_weeks,
      is_active: form.is_active,
      image_url: form.image_url || null,
      created_by: user?.id,
    };

    if (editingProgram) {
      const { error } = await supabase
        .from("programs")
        .update(programData)
        .eq("id", editingProgram.id);

      if (error) {
        toast.error("Failed to update program");
        return;
      }
      toast.success("Program updated");
    } else {
      const { error } = await supabase
        .from("programs")
        .insert(programData);

      if (error) {
        toast.error("Failed to create program");
        return;
      }
      toast.success("Program created");
    }

    setDialogOpen(false);
    resetForm();
    fetchPrograms();
  };

  const deleteProgram = async (id: string) => {
    if (!confirm("Are you sure? This will also delete all lessons in this program.")) return;

    const { error } = await supabase.from("programs").delete().eq("id", id);
    if (error) {
      toast.error("Failed to delete program");
      return;
    }
    toast.success("Program deleted");
    fetchPrograms();
  };

  const toggleActive = async (id: string, isActive: boolean) => {
    const { error } = await supabase
      .from("programs")
      .update({ is_active: !isActive })
      .eq("id", id);

    if (error) {
      toast.error("Failed to update status");
      return;
    }
    fetchPrograms();
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
              <BookOpen className="w-5 h-5" />
              Programs Management
            </CardTitle>
            <CardDescription>Create and manage chess programs/courses</CardDescription>
          </div>
          <Dialog open={dialogOpen} onOpenChange={(open) => { setDialogOpen(open); if (!open) resetForm(); }}>
            <DialogTrigger asChild>
              <Button><Plus className="w-4 h-4 mr-2" /> Add Program</Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>{editingProgram ? "Edit Program" : "Create New Program"}</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2">
                    <Label>Title *</Label>
                    <Input value={form.title} onChange={e => setForm({...form, title: e.target.value})} placeholder="Chess Fundamentals" />
                  </div>
                  <div className="col-span-2">
                    <Label>Short Description</Label>
                    <Input value={form.short_description} onChange={e => setForm({...form, short_description: e.target.value})} placeholder="Brief tagline..." />
                  </div>
                  <div className="col-span-2">
                    <Label>Full Description</Label>
                    <Textarea value={form.description} onChange={e => setForm({...form, description: e.target.value})} rows={3} placeholder="Detailed description..." />
                  </div>
                  <div>
                    <Label>Level</Label>
                    <Select value={form.level} onValueChange={v => setForm({...form, level: v})}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="beginner">Beginner</SelectItem>
                        <SelectItem value="intermediate">Intermediate</SelectItem>
                        <SelectItem value="advanced">Advanced</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Duration (weeks)</Label>
                    <Input type="number" value={form.duration_weeks} onChange={e => setForm({...form, duration_weeks: Number(e.target.value)})} />
                  </div>
                  <div>
                    <Label>Price ($)</Label>
                    <Input type="number" step="0.01" value={form.price} onChange={e => setForm({...form, price: Number(e.target.value)})} />
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch checked={form.is_subscription} onCheckedChange={v => setForm({...form, is_subscription: v})} />
                    <Label>Subscription-based</Label>
                  </div>
                  {form.is_subscription && (
                    <div>
                      <Label>Billing Interval</Label>
                      <Select value={form.subscription_interval} onValueChange={v => setForm({...form, subscription_interval: v})}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="monthly">Monthly</SelectItem>
                          <SelectItem value="yearly">Yearly</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                  <div className="col-span-2">
                    <Label>Features (one per line)</Label>
                    <Textarea value={form.features} onChange={e => setForm({...form, features: e.target.value})} rows={4} placeholder="10 video lessons&#10;Practice exercises&#10;Certificate" />
                  </div>
                  <div className="col-span-2">
                    <Label>Image URL</Label>
                    <Input value={form.image_url} onChange={e => setForm({...form, image_url: e.target.value})} placeholder="https://..." />
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch checked={form.is_active} onCheckedChange={v => setForm({...form, is_active: v})} />
                    <Label>Active (visible to users)</Label>
                  </div>
                </div>
                <Button onClick={handleSubmit} className="w-full">{editingProgram ? "Update Program" : "Create Program"}</Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Program</TableHead>
              <TableHead>Level</TableHead>
              <TableHead>Price</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Created</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {programs.map(p => (
              <TableRow key={p.id}>
                <TableCell>
                  <div>
                    <p className="font-medium">{p.title}</p>
                    <p className="text-xs text-muted-foreground">{p.short_description || "No description"}</p>
                  </div>
                </TableCell>
                <TableCell><Badge variant="outline">{p.level}</Badge></TableCell>
                <TableCell>
                  <div className="flex items-center gap-1">
                    <DollarSign className="w-3 h-3" />
                    {p.price}
                    {p.is_subscription && <span className="text-xs text-muted-foreground">/{p.subscription_interval}</span>}
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant={p.is_active ? "default" : "secondary"} className="cursor-pointer" onClick={() => toggleActive(p.id, p.is_active)}>
                    {p.is_active ? "Active" : "Inactive"}
                  </Badge>
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">{format(new Date(p.created_at), "MMM d, yyyy")}</TableCell>
                <TableCell>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="sm" onClick={() => openEdit(p)}><Pencil className="w-4 h-4" /></Button>
                    <Button variant="ghost" size="sm" onClick={() => deleteProgram(p.id)}><Trash2 className="w-4 h-4 text-destructive" /></Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        {programs.length === 0 && <p className="text-center py-8 text-muted-foreground">No programs yet. Create your first program!</p>}
      </CardContent>
    </Card>
  );
};

export default ProgramsTab;
