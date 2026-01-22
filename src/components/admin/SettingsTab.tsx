import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { 
  Settings, 
  Calendar, 
  Key, 
  Eye, 
  EyeOff, 
  Save, 
  RefreshCw,
  CheckCircle,
  XCircle,
  ExternalLink
} from "lucide-react";

interface CredentialStatus {
  hasClientId: boolean;
  hasClientSecret: boolean;
  hasRefreshToken: boolean;
  lastVerified?: string;
}

const SettingsTab = () => {
  const [loading, setLoading] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [showSecrets, setShowSecrets] = useState(false);
  const [credentialStatus, setCredentialStatus] = useState<CredentialStatus>({
    hasClientId: false,
    hasClientSecret: false,
    hasRefreshToken: false,
  });

  // Form fields
  const [clientId, setClientId] = useState("");
  const [clientSecret, setClientSecret] = useState("");
  const [refreshToken, setRefreshToken] = useState("");

  useEffect(() => {
    checkCredentialStatus();
  }, []);

  const checkCredentialStatus = async () => {
    // Test the edge function to see if credentials are configured
    try {
      setVerifying(true);
      const { data, error } = await supabase.functions.invoke('create-calendar-event', {
        body: { 
          action: 'verify',
          summary: 'Test',
          startTime: new Date().toISOString(),
          endTime: new Date().toISOString(),
        }
      });

      if (error) {
        // If there's an error, credentials might not be configured
        setCredentialStatus({
          hasClientId: false,
          hasClientSecret: false,
          hasRefreshToken: false,
        });
      } else {
        setCredentialStatus({
          hasClientId: true,
          hasClientSecret: true,
          hasRefreshToken: true,
          lastVerified: new Date().toISOString(),
        });
      }
    } catch (e) {
      console.log("Credential check error:", e);
    } finally {
      setVerifying(false);
    }
  };

  const testCalendarConnection = async () => {
    setVerifying(true);
    try {
      const { data, error } = await supabase.functions.invoke('create-calendar-event', {
        body: {
          summary: 'Test Calendar Connection',
          description: 'This is a test event to verify Google Calendar integration',
          startTime: new Date(Date.now() + 3600000).toISOString(), // 1 hour from now
          endTime: new Date(Date.now() + 7200000).toISOString(), // 2 hours from now
          addMeetLink: true,
        }
      });

      if (error) {
        toast.error(`Connection failed: ${error.message}`);
        return;
      }

      if (data?.success) {
        toast.success("Google Calendar is working! Test event created with Meet link.");
        setCredentialStatus({
          hasClientId: true,
          hasClientSecret: true,
          hasRefreshToken: true,
          lastVerified: new Date().toISOString(),
        });
      } else {
        toast.error(data?.error || "Connection test failed");
      }
    } catch (e) {
      toast.error("Failed to test connection");
    } finally {
      setVerifying(false);
    }
  };

  const allConfigured = credentialStatus.hasClientId && 
                        credentialStatus.hasClientSecret && 
                        credentialStatus.hasRefreshToken;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="w-5 h-5" />
            Admin Settings
          </CardTitle>
          <CardDescription>
            Configure API integrations and system settings
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="calendar" className="space-y-4">
            <TabsList>
              <TabsTrigger value="calendar" className="gap-2">
                <Calendar className="w-4 h-4" />
                Google Calendar
              </TabsTrigger>
            </TabsList>

            <TabsContent value="calendar" className="space-y-6">
              {/* Status Card */}
              <Card className={`border-2 ${allConfigured ? 'border-emerald-200 bg-emerald-50/50' : 'border-amber-200 bg-amber-50/50'}`}>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {allConfigured ? (
                        <div className="w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center">
                          <CheckCircle className="w-6 h-6 text-emerald-600" />
                        </div>
                      ) : (
                        <div className="w-12 h-12 rounded-full bg-amber-100 flex items-center justify-center">
                          <XCircle className="w-6 h-6 text-amber-600" />
                        </div>
                      )}
                      <div>
                        <h3 className="font-semibold">
                          {allConfigured ? 'Google Calendar Connected' : 'Google Calendar Not Configured'}
                        </h3>
                        <p className="text-sm text-muted-foreground">
                          {allConfigured 
                            ? 'Meet links will be automatically created for classes' 
                            : 'Configure credentials to enable automatic Meet link generation'}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={testCalendarConnection}
                        disabled={verifying}
                      >
                        {verifying ? (
                          <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                        ) : (
                          <RefreshCw className="w-4 h-4 mr-2" />
                        )}
                        Test Connection
                      </Button>
                    </div>
                  </div>

                  {credentialStatus.lastVerified && (
                    <p className="text-xs text-muted-foreground mt-3">
                      Last verified: {new Date(credentialStatus.lastVerified).toLocaleString()}
                    </p>
                  )}
                </CardContent>
              </Card>

              {/* Credential Status */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Key className="w-4 h-4 text-muted-foreground" />
                        <span className="text-sm font-medium">Client ID</span>
                      </div>
                      <Badge variant={credentialStatus.hasClientId ? "default" : "secondary"}>
                        {credentialStatus.hasClientId ? "Configured" : "Missing"}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Key className="w-4 h-4 text-muted-foreground" />
                        <span className="text-sm font-medium">Client Secret</span>
                      </div>
                      <Badge variant={credentialStatus.hasClientSecret ? "default" : "secondary"}>
                        {credentialStatus.hasClientSecret ? "Configured" : "Missing"}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Key className="w-4 h-4 text-muted-foreground" />
                        <span className="text-sm font-medium">Refresh Token</span>
                      </div>
                      <Badge variant={credentialStatus.hasRefreshToken ? "default" : "secondary"}>
                        {credentialStatus.hasRefreshToken ? "Configured" : "Missing"}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Setup Instructions */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Setup Instructions</CardTitle>
                  <CardDescription>
                    To configure Google Calendar integration, you need to set up secrets through Lovable's settings
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3 text-sm">
                    <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
                      <span className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold shrink-0">1</span>
                      <div>
                        <p className="font-medium">Create a Google Cloud Project</p>
                        <p className="text-muted-foreground">Go to Google Cloud Console and create a new project with Calendar API enabled</p>
                        <a 
                          href="https://console.cloud.google.com" 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-primary hover:underline inline-flex items-center gap-1 mt-1"
                        >
                          Open Google Cloud Console
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      </div>
                    </div>

                    <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
                      <span className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold shrink-0">2</span>
                      <div>
                        <p className="font-medium">Create OAuth 2.0 Credentials</p>
                        <p className="text-muted-foreground">Navigate to APIs & Services → Credentials → Create OAuth client ID (Web application)</p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
                      <span className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold shrink-0">3</span>
                      <div>
                        <p className="font-medium">Get a Refresh Token</p>
                        <p className="text-muted-foreground">Use the OAuth 2.0 Playground to get a refresh token with Calendar scope</p>
                        <a 
                          href="https://developers.google.com/oauthplayground" 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-primary hover:underline inline-flex items-center gap-1 mt-1"
                        >
                          Open OAuth Playground
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      </div>
                    </div>

                    <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
                      <span className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold shrink-0">4</span>
                      <div>
                        <p className="font-medium">Add Secrets in Lovable</p>
                        <p className="text-muted-foreground">Go to Settings → Secrets and add the following:</p>
                        <ul className="list-disc list-inside mt-2 text-muted-foreground">
                          <li><code className="bg-muted px-1 rounded">GOOGLE_CLIENT_ID</code></li>
                          <li><code className="bg-muted px-1 rounded">GOOGLE_CLIENT_SECRET</code></li>
                          <li><code className="bg-muted px-1 rounded">GOOGLE_REFRESH_TOKEN</code></li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default SettingsTab;
