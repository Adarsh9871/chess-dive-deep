import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { CreditCard, Search, Download, DollarSign, TrendingUp, Users } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { format } from "date-fns";

interface Payment {
  id: string;
  user_id: string;
  amount: number;
  currency: string;
  status: string;
  payment_type: string;
  description: string | null;
  created_at: string;
  user_name?: string;
}

interface Subscription {
  id: string;
  user_id: string;
  status: string;
  billing_interval: string;
  current_period_end: string | null;
  plan?: {
    name: string;
    price_monthly: number;
  };
  user_name?: string;
}

const PaymentHistoryTab = () => {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [stats, setStats] = useState({ total: 0, thisMonth: 0, activeSubscriptions: 0 });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    // Fetch payments with profiles
    const { data: paymentsData } = await supabase
      .from("payment_history")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(100);

    // Fetch subscriptions with plans
    const { data: subsData } = await supabase
      .from("user_subscriptions")
      .select("*, plan:subscription_plans(name, price_monthly)")
      .order("created_at", { ascending: false });

    // Fetch profiles for user names
    const { data: profiles } = await supabase
      .from("profiles")
      .select("user_id, display_name");

    const profileMap = new Map(profiles?.map(p => [p.user_id, p.display_name]) || []);

    const enrichedPayments = paymentsData?.map(p => ({
      ...p,
      user_name: profileMap.get(p.user_id) || "Unknown"
    })) || [];

    const enrichedSubs = subsData?.map(s => ({
      ...s,
      user_name: profileMap.get(s.user_id) || "Unknown"
    })) || [];

    setPayments(enrichedPayments);
    setSubscriptions(enrichedSubs);

    // Calculate stats
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    
    const total = enrichedPayments
      .filter(p => p.status === "completed")
      .reduce((sum, p) => sum + Number(p.amount), 0);
    
    const thisMonth = enrichedPayments
      .filter(p => p.status === "completed" && new Date(p.created_at) >= monthStart)
      .reduce((sum, p) => sum + Number(p.amount), 0);
    
    const activeSubscriptions = enrichedSubs.filter(s => s.status === "active").length;

    setStats({ total, thisMonth, activeSubscriptions });
    setLoading(false);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed": case "active": return "default";
      case "pending": return "secondary";
      case "failed": case "cancelled": case "expired": return "destructive";
      default: return "outline";
    }
  };

  const filteredPayments = payments.filter(p => {
    const matchesSearch = p.user_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         p.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || p.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  if (loading) {
    return <div className="flex justify-center py-8"><div className="animate-spin w-6 h-6 border-2 border-primary border-t-transparent rounded-full" /></div>;
  }

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-primary/10">
                <DollarSign className="w-6 h-6 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Revenue</p>
                <p className="text-2xl font-bold">${stats.total.toFixed(2)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-green-500/10">
                <TrendingUp className="w-6 h-6 text-green-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">This Month</p>
                <p className="text-2xl font-bold">${stats.thisMonth.toFixed(2)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-blue-500/10">
                <Users className="w-6 h-6 text-blue-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Active Subscriptions</p>
                <p className="text-2xl font-bold">{stats.activeSubscriptions}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Active Subscriptions */}
      <Card>
        <CardHeader>
          <CardTitle>Active Subscriptions</CardTitle>
          <CardDescription>Currently active subscriber accounts</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User</TableHead>
                <TableHead>Plan</TableHead>
                <TableHead>Billing</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Renews</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {subscriptions.filter(s => s.status === "active").slice(0, 10).map(s => (
                <TableRow key={s.id}>
                  <TableCell className="font-medium">{s.user_name}</TableCell>
                  <TableCell>{s.plan?.name || "Unknown"}</TableCell>
                  <TableCell className="capitalize">{s.billing_interval}</TableCell>
                  <TableCell><Badge variant={getStatusColor(s.status)}>{s.status}</Badge></TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {s.current_period_end ? format(new Date(s.current_period_end), "MMM d, yyyy") : "-"}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          {subscriptions.filter(s => s.status === "active").length === 0 && (
            <p className="text-center py-8 text-muted-foreground">No active subscriptions yet</p>
          )}
        </CardContent>
      </Card>

      {/* Payment History */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="w-5 h-5" />
                Payment History
              </CardTitle>
              <CardDescription>All payment transactions</CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input 
                  placeholder="Search..." 
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  className="pl-9 w-48"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="failed">Failed</SelectItem>
                  <SelectItem value="refunded">Refunded</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>User</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredPayments.map(p => (
                <TableRow key={p.id}>
                  <TableCell className="text-sm text-muted-foreground">
                    {format(new Date(p.created_at), "MMM d, h:mm a")}
                  </TableCell>
                  <TableCell className="font-medium">{p.user_name}</TableCell>
                  <TableCell className="text-sm">{p.description || "-"}</TableCell>
                  <TableCell><Badge variant="outline" className="capitalize">{p.payment_type.replace("_", " ")}</Badge></TableCell>
                  <TableCell className="font-medium">
                    {p.payment_type === "refund" ? "-" : ""}${Number(p.amount).toFixed(2)} {p.currency}
                  </TableCell>
                  <TableCell><Badge variant={getStatusColor(p.status)}>{p.status}</Badge></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          {filteredPayments.length === 0 && (
            <p className="text-center py-8 text-muted-foreground">No payments found</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default PaymentHistoryTab;
