import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { UserPlus, Loader2, Mail, User, Lock } from "lucide-react";

const CreateCoachTab = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [creating, setCreating] = useState(false);

  const handleCreateCoach = async () => {
    if (!email || !password || !displayName) {
      toast.error("Please fill in all fields");
      return;
    }

    if (password.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }

    setCreating(true);

    try {
      // Create the user via Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/`,
          data: {
            display_name: displayName,
          }
        }
      });

      if (authError) {
        toast.error(authError.message);
        setCreating(false);
        return;
      }

      if (!authData.user) {
        toast.error("Failed to create user");
        setCreating(false);
        return;
      }

      const newUserId = authData.user.id;

      // Update the profile with display name
      await supabase
        .from("profiles")
        .update({ display_name: displayName, email: email })
        .eq("user_id", newUserId);

      // Delete the default student role and add coach role
      await supabase
        .from("user_roles")
        .delete()
        .eq("user_id", newUserId);

      const { error: roleError } = await supabase
        .from("user_roles")
        .insert({ user_id: newUserId, role: "coach" });

      if (roleError) {
        toast.error("User created but failed to assign coach role");
        setCreating(false);
        return;
      }

      toast.success(`Coach "${displayName}" created successfully!`);
      setEmail("");
      setPassword("");
      setDisplayName("");
    } catch (error) {
      toast.error("An error occurred while creating the coach");
    }

    setCreating(false);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <UserPlus className="w-5 h-5 text-primary" />
          Create New Coach
        </CardTitle>
        <CardDescription>
          Create a new coach account with login credentials
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="max-w-md space-y-4">
          <div className="space-y-2">
            <Label htmlFor="displayName" className="flex items-center gap-2">
              <User className="w-4 h-4" />
              Coach Name
            </Label>
            <Input
              id="displayName"
              placeholder="Enter coach's full name"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email" className="flex items-center gap-2">
              <Mail className="w-4 h-4" />
              Email Address
            </Label>
            <Input
              id="email"
              type="email"
              placeholder="coach@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password" className="flex items-center gap-2">
              <Lock className="w-4 h-4" />
              Password
            </Label>
            <Input
              id="password"
              type="password"
              placeholder="Min 6 characters"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          <Button
            onClick={handleCreateCoach}
            disabled={creating}
            className="w-full"
          >
            {creating ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Creating Coach...
              </>
            ) : (
              <>
                <UserPlus className="w-4 h-4 mr-2" />
                Create Coach Account
              </>
            )}
          </Button>

          <p className="text-xs text-muted-foreground text-center">
            The coach will receive an email to confirm their account and can then log in.
          </p>
        </div>
      </CardContent>
    </Card>
  );
};

export default CreateCoachTab;
