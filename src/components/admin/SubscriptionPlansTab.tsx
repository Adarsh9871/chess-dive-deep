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
import { Plus, Pencil, Trash2, Crown, Star, DollarSign } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Plan {
  id: string;
  name: string;
  description: string | null;
  price_monthly: number;
  price_yearly: number | null;
  features: string[];
  is_popular: boolean;
  is_active: boolean;
  stripe_price_id_monthly: string | null;
  stripe_price_id_yearly: string | null;
}

const SubscriptionPlansTab = () => {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState<Plan | null>(null);
  
  const [form, setForm] = useState({
    name: "",
    description: "",
    price_monthly: 0,
    price_yearly: 0,
    features: "",
    is_popular: false,
    is_active: true,
    stripe_price_id_monthly: "",
    stripe_price_id_yearly: "",
  });

  useEffect(() => {
    fetchPlans();
  }, []);

  const fetchPlans = async () => {
    const { data, error } = await supabase
      .from("subscription_plans")
      .select("*")
      .order("price_monthly");

    if (error) {
      toast.error("Failed to fetch plans");
      return;
    }

    setPlans(data?.map(p => ({
      ...p,
      features: Array.isArray(p.features) ? (p.features as string[]) : []
    })) || []);
    setLoading(false);
  };

  const resetForm = () => {
    setForm({
      name: "",
      description: "",
      price_monthly: 0,
      price_yearly: 0,
      features: "",
      is_popular: false,
      is_active: true,
      stripe_price_id_monthly: "",
      stripe_price_id_yearly: "",
    });
    setEditingPlan(null);
  };

  const openEdit = (plan: Plan) => {
    setEditingPlan(plan);
    setForm({
      name: plan.name,
      description: plan.description || "",
      price_monthly: plan.price_monthly,
      price_yearly: plan.price_yearly || 0,
      features: plan.features.join("\n"),
      is_popular: plan.is_popular,
      is_active: plan.is_active,
      stripe_price_id_monthly: plan.stripe_price_id_monthly || "",
      stripe_price_id_yearly: plan.stripe_price_id_yearly || "",
    });
    setDialogOpen(true);
  };

  const handleSubmit = async () => {
    if (!form.name.trim()) {
      toast.error("Plan name is required");
      return;
    }

    const planData = {
      name: form.name,
      description: form.description || null,
      price_monthly: form.price_monthly,
      price_yearly: form.price_yearly || null,
      features: form.features.split("\n").filter(f => f.trim()),
      is_popular: form.is_popular,
      is_active: form.is_active,
      stripe_price_id_monthly: form.stripe_price_id_monthly || null,
      stripe_price_id_yearly: form.stripe_price_id_yearly || null,
    };

    if (editingPlan) {
      const { error } = await supabase
        .from("subscription_plans")
        .update(planData)
        .eq("id", editingPlan.id);

      if (error) {
        toast.error("Failed to update plan");
        return;
      }
      toast.success("Plan updated");
    } else {
      const { error } = await supabase
        .from("subscription_plans")
        .insert(planData);

      if (error) {
        toast.error("Failed to create plan");
        return;
      }
      toast.success("Plan created");
    }

    setDialogOpen(false);
    resetForm();
    fetchPlans();
  };

  const deletePlan = async (id: string) => {
    if (!confirm("Are you sure? This will affect users with this subscription.")) return;

    const { error } = await supabase.from("subscription_plans").delete().eq("id", id);
    if (error) {
      toast.error("Failed to delete plan");
      return;
    }
    toast.success("Plan deleted");
    fetchPlans();
  };

  const toggleActive = async (id: string, isActive: boolean) => {
    const { error } = await supabase
      .from("subscription_plans")
      .update({ is_active: !isActive })
      .eq("id", id);

    if (error) {
      toast.error("Failed to update status");
      return;
    }
    fetchPlans();
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
              <Crown className="w-5 h-5" />
              Subscription Plans
            </CardTitle>
            <CardDescription>Manage pricing tiers and features</CardDescription>
          </div>
          <Dialog open={dialogOpen} onOpenChange={(open) => { setDialogOpen(open); if (!open) resetForm(); }}>
            <DialogTrigger asChild>
              <Button><Plus className="w-4 h-4 mr-2" /> Add Plan</Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>{editingPlan ? "Edit Plan" : "Create New Plan"}</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div>
                  <Label>Plan Name *</Label>
                  <Input value={form.name} onChange={e => setForm({...form, name: e.target.value})} placeholder="Pro Plan" />
                </div>
                <div>
                  <Label>Description</Label>
                  <Textarea value={form.description} onChange={e => setForm({...form, description: e.target.value})} rows={2} placeholder="Best for serious learners" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Monthly Price ($)</Label>
                    <Input type="number" step="0.01" value={form.price_monthly} onChange={e => setForm({...form, price_monthly: Number(e.target.value)})} />
                  </div>
                  <div>
                    <Label>Yearly Price ($)</Label>
                    <Input type="number" step="0.01" value={form.price_yearly} onChange={e => setForm({...form, price_yearly: Number(e.target.value)})} placeholder="Optional" />
                  </div>
                </div>
                <div>
                  <Label>Features (one per line)</Label>
                  <Textarea value={form.features} onChange={e => setForm({...form, features: e.target.value})} rows={5} placeholder="Unlimited lessons&#10;Priority support&#10;1-on-1 coaching" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Stripe Monthly Price ID</Label>
                    <Input value={form.stripe_price_id_monthly} onChange={e => setForm({...form, stripe_price_id_monthly: e.target.value})} placeholder="price_..." />
                  </div>
                  <div>
                    <Label>Stripe Yearly Price ID</Label>
                    <Input value={form.stripe_price_id_yearly} onChange={e => setForm({...form, stripe_price_id_yearly: e.target.value})} placeholder="price_..." />
                  </div>
                </div>
                <div className="flex items-center gap-6">
                  <div className="flex items-center gap-2">
                    <Switch checked={form.is_popular} onCheckedChange={v => setForm({...form, is_popular: v})} />
                    <Label>Mark as Popular</Label>
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch checked={form.is_active} onCheckedChange={v => setForm({...form, is_active: v})} />
                    <Label>Active</Label>
                  </div>
                </div>
                <Button onClick={handleSubmit} className="w-full">{editingPlan ? "Update Plan" : "Create Plan"}</Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Plan</TableHead>
              <TableHead>Monthly</TableHead>
              <TableHead>Yearly</TableHead>
              <TableHead>Features</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {plans.map(p => (
              <TableRow key={p.id}>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{p.name}</span>
                    {p.is_popular && <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-1">
                    <DollarSign className="w-3 h-3" />
                    {p.price_monthly}
                  </div>
                </TableCell>
                <TableCell>
                  {p.price_yearly ? (
                    <div className="flex items-center gap-1">
                      <DollarSign className="w-3 h-3" />
                      {p.price_yearly}
                    </div>
                  ) : "-"}
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">{p.features.length} features</TableCell>
                <TableCell>
                  <Badge 
                    variant={p.is_active ? "default" : "secondary"} 
                    className="cursor-pointer" 
                    onClick={() => toggleActive(p.id, p.is_active)}
                  >
                    {p.is_active ? "Active" : "Inactive"}
                  </Badge>
                </TableCell>
                <TableCell>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="sm" onClick={() => openEdit(p)}><Pencil className="w-4 h-4" /></Button>
                    <Button variant="ghost" size="sm" onClick={() => deletePlan(p.id)}><Trash2 className="w-4 h-4 text-destructive" /></Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        {plans.length === 0 && <p className="text-center py-8 text-muted-foreground">No subscription plans yet</p>}
      </CardContent>
    </Card>
  );
};

export default SubscriptionPlansTab;
