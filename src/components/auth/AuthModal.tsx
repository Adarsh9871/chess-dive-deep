import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Mail, Lock, User, Loader2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  redirectAfterAuth?: boolean;
}

const AuthModal = ({ isOpen, onClose, onSuccess, redirectAfterAuth = true }: AuthModalProps) => {
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { signIn, signUp } = useAuth();
  const navigate = useNavigate();

  const checkUserRoleAndRedirect = async (userId: string) => {
    if (!redirectAfterAuth) return;
    
    const { data: roles } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", userId);

    if (roles && roles.length > 0) {
      const isAdmin = roles.some(r => r.role === 'admin');
      const isCoach = roles.some(r => r.role === 'coach');
      
      if (isAdmin) {
        navigate("/admin");
      } else if (isCoach) {
        navigate("/dashboard");
      } else {
        navigate("/dashboard");
      }
    } else {
      navigate("/dashboard");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error("Please fill in all required fields");
      return;
    }
    setIsLoading(true);

    try {
      if (mode === "login") {
        const { error } = await signIn(email, password);
        if (error) {
          toast.error(error.message || "Login failed");
        } else {
          toast.success("Welcome back! 🎉");
          onSuccess?.();
          onClose();
          resetForm();
          
          // Get user and redirect based on role
          const { data: { user } } = await supabase.auth.getUser();
          if (user) {
            await checkUserRoleAndRedirect(user.id);
          }
        }
      } else {
        const { data, error } = await signUp(email, password, username);
        if (error) {
          toast.error(error.message || "Signup failed");
        } else {
          toast.success("Account created! Welcome to ChessPals! 🎉");
          onSuccess?.();
          onClose();
          resetForm();
          
          // Redirect new users to dashboard
          if (data?.user && redirectAfterAuth) {
            navigate("/dashboard");
          }
        }
      }
    } catch (err) {
      console.error("Auth error:", err);
      toast.error("Something went wrong. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    setEmail("");
    setPassword("");
    setUsername("");
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
          onClick={handleClose}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="bg-card rounded-3xl border-2 border-border shadow-2xl w-full max-w-md p-6 sm:p-8"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-display font-bold text-foreground">
                {mode === "login" ? "Welcome Back!" : "Join ChessPals!"}
              </h2>
              <Button variant="ghost" size="icon" onClick={handleClose}>
                <X className="w-5 h-5" />
              </Button>
            </div>

            {/* Emoji */}
            <div className="text-center mb-6">
              <span className="text-6xl">{mode === "login" ? "👋" : "🎉"}</span>
              <p className="text-muted-foreground mt-2">
                {mode === "login"
                  ? "Sign in to schedule games and track progress"
                  : "Create an account to start your chess journey"}
              </p>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              {mode === "signup" && (
                <div className="space-y-2">
                  <Label htmlFor="username" className="flex items-center gap-2">
                    <User className="w-4 h-4 text-primary" />
                    Username
                  </Label>
                  <Input
                    id="username"
                    type="text"
                    placeholder="ChessChamp123"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="h-12"
                  />
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="email" className="flex items-center gap-2">
                  <Mail className="w-4 h-4 text-primary" />
                  Email
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="your@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="h-12"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="flex items-center gap-2">
                  <Lock className="w-4 h-4 text-primary" />
                  Password
                </Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                  className="h-12"
                />
              </div>

              <Button
                type="submit"
                size="lg"
                className="w-full h-14 text-lg"
                disabled={isLoading}
              >
                {isLoading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : mode === "login" ? (
                  "Sign In"
                ) : (
                  "Create Account"
                )}
              </Button>
            </form>

            {/* Toggle mode */}
            <div className="mt-6 text-center">
              <p className="text-muted-foreground">
                {mode === "login" ? "Don't have an account?" : "Already have an account?"}
                <Button
                  variant="link"
                  className="text-primary font-bold pl-1"
                  onClick={() => setMode(mode === "login" ? "signup" : "login")}
                >
                  {mode === "login" ? "Sign Up" : "Sign In"}
                </Button>
              </p>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default AuthModal;
