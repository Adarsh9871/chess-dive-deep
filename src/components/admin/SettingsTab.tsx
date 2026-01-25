import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Settings, Save, RefreshCw, Shield, Mail, Globe } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";

interface Setting {
  key: string;
  value: string | number | boolean;
  description: string | null;
}

const SettingsTab = () => {
  const { user } = useAuth();
  const [settings, setSettings] = useState<Record<string, Setting>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    const { data, error } = await supabase
      .from("admin_settings")
      .select("key, value, description");

    if (error) {
      toast.error("Failed to fetch settings");
      return;
    }

    const settingsMap: Record<string, Setting> = {};
    data?.forEach(s => {
      settingsMap[s.key] = {
        key: s.key,
        value: typeof s.value === 'string' ? JSON.parse(s.value) : s.value,
        description: s.description,
      };
    });
    setSettings(settingsMap);
    setLoading(false);
  };

  const updateSetting = async (key: string, value: string | number | boolean) => {
    setSaving(true);
    
    const { error } = await supabase
      .from("admin_settings")
      .update({ value: JSON.stringify(value), updated_by: user?.id })
      .eq("key", key);

    if (error) {
      toast.error(`Failed to update ${key}`);
      setSaving(false);
      return;
    }

    setSettings(prev => ({
      ...prev,
      [key]: { ...prev[key], value }
    }));
    
    toast.success("Setting updated");
    setSaving(false);
  };

  const getValue = (key: string, defaultValue: string | number | boolean = "") => {
    return settings[key]?.value ?? defaultValue;
  };

  if (loading) {
    return <div className="flex justify-center py-8"><div className="animate-spin w-6 h-6 border-2 border-primary border-t-transparent rounded-full" /></div>;
  }

  return (
    <div className="space-y-6">
      {/* General Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="w-5 h-5" />
            General Settings
          </CardTitle>
          <CardDescription>Basic site configuration</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>Site Name</Label>
              <Input 
                value={String(getValue("site_name", "ChessPals"))}
                onChange={e => setSettings(prev => ({
                  ...prev,
                  site_name: { ...prev.site_name, value: e.target.value }
                }))}
                onBlur={e => updateSetting("site_name", e.target.value)}
              />
            </div>
            <div>
              <Label>Contact Email</Label>
              <Input 
                type="email"
                value={String(getValue("contact_email", ""))}
                onChange={e => setSettings(prev => ({
                  ...prev,
                  contact_email: { ...prev.contact_email, value: e.target.value }
                }))}
                onBlur={e => updateSetting("contact_email", e.target.value)}
              />
            </div>
            <div className="md:col-span-2">
              <Label>Site Description</Label>
              <Input 
                value={String(getValue("site_description", ""))}
                onChange={e => setSettings(prev => ({
                  ...prev,
                  site_description: { ...prev.site_description, value: e.target.value }
                }))}
                onBlur={e => updateSetting("site_description", e.target.value)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Booking Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="w-5 h-5" />
            Booking Settings
          </CardTitle>
          <CardDescription>Configure session booking options</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>Default Session Duration (minutes)</Label>
              <Input 
                type="number"
                value={Number(getValue("default_session_duration", 60))}
                onChange={e => setSettings(prev => ({
                  ...prev,
                  default_session_duration: { ...prev.default_session_duration, value: Number(e.target.value) }
                }))}
                onBlur={e => updateSetting("default_session_duration", Number(e.target.value))}
              />
            </div>
            <div>
              <Label>Booking Advance Days</Label>
              <Input 
                type="number"
                value={Number(getValue("booking_advance_days", 30))}
                onChange={e => setSettings(prev => ({
                  ...prev,
                  booking_advance_days: { ...prev.booking_advance_days, value: Number(e.target.value) }
                }))}
                onBlur={e => updateSetting("booking_advance_days", Number(e.target.value))}
                placeholder="How many days ahead users can book"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Access Control */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5" />
            Access Control
          </CardTitle>
          <CardDescription>Manage site access and features</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Allow New Registrations</p>
              <p className="text-sm text-muted-foreground">Enable or disable new user signups</p>
            </div>
            <Switch 
              checked={Boolean(getValue("allow_registrations", true))}
              onCheckedChange={v => updateSetting("allow_registrations", v)}
            />
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Maintenance Mode</p>
              <p className="text-sm text-muted-foreground">Put site in maintenance mode (only admins can access)</p>
            </div>
            <Switch 
              checked={Boolean(getValue("maintenance_mode", false))}
              onCheckedChange={v => updateSetting("maintenance_mode", v)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Admin Credentials (Password change would need edge function) */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="w-5 h-5" />
            Admin Account
          </CardTitle>
          <CardDescription>Manage your admin credentials</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>Current Email</Label>
            <Input value={user?.email || ""} disabled className="bg-muted" />
          </div>
          <div>
            <Label>New Password</Label>
            <div className="flex gap-2">
              <Input type="password" id="new-password" placeholder="Enter new password" />
              <Button 
                variant="outline"
                onClick={async () => {
                  const password = (document.getElementById("new-password") as HTMLInputElement).value;
                  if (password.length < 6) {
                    toast.error("Password must be at least 6 characters");
                    return;
                  }
                  const { error } = await supabase.auth.updateUser({ password });
                  if (error) {
                    toast.error("Failed to update password");
                    return;
                  }
                  toast.success("Password updated successfully");
                  (document.getElementById("new-password") as HTMLInputElement).value = "";
                }}
              >
                <Save className="w-4 h-4 mr-2" />
                Update
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Refresh All */}
      <div className="flex justify-end">
        <Button variant="outline" onClick={fetchSettings} disabled={loading}>
          <RefreshCw className="w-4 h-4 mr-2" />
          Refresh Settings
        </Button>
      </div>
    </div>
  );
};

export default SettingsTab;
