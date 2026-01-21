import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { format } from "date-fns";
import { RefreshCw, CheckCircle, XCircle, AlertCircle } from "lucide-react";

interface MakeupRequest {
  id: string;
  original_class_id: string;
  student_id: string;
  requested_date: string;
  requested_time: string;
  status: string;
  reason: string | null;
  created_at: string;
  student_name?: string;
}

const MakeupRequestsAdminTab = () => {
  const [requests, setRequests] = useState<MakeupRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);

  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    const { data: requestsData } = await supabase
      .from("makeup_requests")
      .select("*")
      .order("created_at", { ascending: false });

    const { data: profiles } = await supabase
      .from("profiles")
      .select("user_id, display_name");

    if (requestsData && profiles) {
      const enriched = requestsData.map(r => ({
        ...r,
        student_name: profiles.find(p => p.user_id === r.student_id)?.display_name || 'Unknown Student',
      }));
      setRequests(enriched);
    }

    setLoading(false);
  };

  const processRequest = async (id: string, status: 'approved' | 'rejected') => {
    setProcessingId(id);
    const request = requests.find(r => r.id === id);

    const { error } = await supabase
      .from("makeup_requests")
      .update({ status })
      .eq("id", id);

    if (error) {
      toast.error("Failed to process request");
      setProcessingId(null);
      return;
    }

    // If approved, create makeup class
    if (status === 'approved' && request) {
      // Get original class info
      const { data: originalClass } = await supabase
        .from("classes")
        .select("coach_id")
        .eq("id", request.original_class_id)
        .single();

      if (originalClass) {
        await supabase.from("classes").insert({
          coach_id: originalClass.coach_id,
          student_id: request.student_id,
          scheduled_date: request.requested_date,
          scheduled_time: request.requested_time,
          status: 'makeup',
          is_makeup: true,
          original_class_id: request.original_class_id,
          notes: `Makeup class: ${request.reason || 'Rescheduled from original class'}`,
        });
      }
    }

    // Send notification
    try {
      if (request) {
        await supabase.functions.invoke('send-notification', {
          body: {
            userId: request.student_id,
            type: status === 'approved' ? 'makeup_approved' : 'makeup_rejected',
            title: status === 'approved' ? 'Makeup Class Approved!' : 'Makeup Request Declined',
            message: status === 'approved' 
              ? `Your makeup class for ${format(new Date(request.requested_date), "MMMM d")} at ${request.requested_time} has been approved. See you there!`
              : `Your makeup class request for ${format(new Date(request.requested_date), "MMMM d")} was declined. Please submit a new request with different timing.`,
            relatedId: id
          }
        });
      }
    } catch (e) {
      console.log("Notification send failed:", e);
    }

    toast.success(status === 'approved' ? "Makeup class approved!" : "Request rejected");
    setProcessingId(null);
    fetchRequests();
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved':
        return <Badge className="bg-green-500">Approved</Badge>;
      case 'rejected':
        return <Badge variant="destructive">Rejected</Badge>;
      default:
        return <Badge variant="secondary">Pending</Badge>;
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <div className="animate-spin w-6 h-6 border-2 border-primary border-t-transparent rounded-full" />
        </CardContent>
      </Card>
    );
  }

  const pendingRequests = requests.filter(r => r.status === 'pending');
  const processedRequests = requests.filter(r => r.status !== 'pending');

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <RefreshCw className="w-5 h-5" />
            Makeup Class Requests
            {pendingRequests.length > 0 && (
              <Badge variant="destructive" className="ml-2">
                {pendingRequests.length}
              </Badge>
            )}
          </CardTitle>
          <CardDescription>
            Review and approve makeup class requests from students
          </CardDescription>
        </CardHeader>
        <CardContent>
          {pendingRequests.length > 0 ? (
            <div className="space-y-4">
              {pendingRequests.map((r) => (
                <div
                  key={r.id}
                  className="p-4 rounded-lg border bg-background"
                >
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-start gap-3">
                      <AlertCircle className="w-5 h-5 text-yellow-500 mt-0.5" />
                      <div>
                        <p className="font-medium">{r.student_name}</p>
                        <p className="text-sm text-muted-foreground">
                          Requests: {format(new Date(r.requested_date), "EEEE, MMMM d")} at {r.requested_time}
                        </p>
                        {r.reason && (
                          <p className="text-sm text-muted-foreground mt-1">
                            <strong>Reason:</strong> {r.reason}
                          </p>
                        )}
                        <p className="text-xs text-muted-foreground mt-1">
                          Submitted {format(new Date(r.created_at), "MMM d, h:mm a")}
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        onClick={() => processRequest(r.id, 'approved')}
                        disabled={processingId === r.id}
                        className="bg-green-600 hover:bg-green-700"
                      >
                        <CheckCircle className="w-4 h-4 mr-1" />
                        Approve
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => processRequest(r.id, 'rejected')}
                        disabled={processingId === r.id}
                      >
                        <XCircle className="w-4 h-4 mr-1" />
                        Reject
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <CheckCircle className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p>No pending makeup requests</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* History */}
      <Card>
        <CardHeader>
          <CardTitle>Request History</CardTitle>
        </CardHeader>
        <CardContent>
          {processedRequests.length > 0 ? (
            <div className="space-y-2">
              {processedRequests.map((r) => (
                <div
                  key={r.id}
                  className="flex items-center justify-between p-3 rounded-lg border bg-muted/30"
                >
                  <div>
                    <p className="text-sm font-medium">{r.student_name}</p>
                    <p className="text-xs text-muted-foreground">
                      {format(new Date(r.requested_date), "MMM d")} at {r.requested_time}
                    </p>
                  </div>
                  {getStatusBadge(r.status)}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-center py-4 text-muted-foreground">No processed requests</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default MakeupRequestsAdminTab;
