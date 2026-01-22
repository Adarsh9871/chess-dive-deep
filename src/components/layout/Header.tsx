import { Button } from "@/components/ui/button";
import { Crown, Menu, X, LogOut, User, LayoutDashboard } from "lucide-react";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import AuthModal from "@/components/auth/AuthModal";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authMode, setAuthMode] = useState<"login" | "signup">("login");
  const location = useLocation();
  const navigate = useNavigate();
  const { user, signOut, loading } = useAuth();

  const navItems = [
    { label: "Play", href: "/play" },
    { label: "Lessons", href: "/lessons" },
    { label: "Program", href: "/program" },
    { label: "Puzzles", href: "/puzzles" },
    { label: "Explore", href: "/explore" },
    { label: "About", href: "/about" },
    { label: "Contact", href: "/contact" },
  ];

  const isActive = (href: string) => {
    if (href.startsWith("/#")) return false;
    return location.pathname === href;
  };

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  const openLogin = () => {
    setAuthMode("login");
    setShowAuthModal(true);
    setIsMenuOpen(false);
  };

  const openSignup = () => {
    setAuthMode("signup");
    setShowAuthModal(true);
    setIsMenuOpen(false);
  };

  const userInitials = user?.email?.charAt(0).toUpperCase() || "U";

  return (
    <>
      <header className="fixed top-0 left-0 right-0 z-50 bg-card/90 backdrop-blur-md shadow-sm">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16 md:h-20">
            {/* Logo */}
            <Link to="/" className="flex items-center gap-2 group">
              <div className="relative">
                <Crown className="w-8 h-8 text-gold transition-transform group-hover:scale-110" />
              </div>
              <span className="text-xl md:text-2xl font-display font-bold text-foreground">
                Chess<span className="text-primary">Pals</span>
              </span>
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center gap-1">
              {navItems.map((item) => (
                <Button
                  key={item.label}
                  variant={isActive(item.href) ? "navAccent" : "nav"}
                  asChild
                >
                  {item.href.startsWith("/#") ? (
                    <a href={item.href}>{item.label}</a>
                  ) : (
                    <Link to={item.href}>{item.label}</Link>
                  )}
                </Button>
              ))}
            </nav>

            {/* Desktop CTAs */}
            <div className="hidden md:flex items-center gap-3">
              {loading ? (
                <div className="w-20 h-10 bg-muted animate-pulse rounded-lg" />
              ) : user ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="flex items-center gap-2">
                      <Avatar className="w-8 h-8">
                        <AvatarFallback className="bg-primary text-primary-foreground text-sm">
                          {userInitials}
                        </AvatarFallback>
                      </Avatar>
                      <span className="font-nunito font-semibold max-w-[120px] truncate">
                        {user.email?.split("@")[0]}
                      </span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-48">
                    <DropdownMenuItem asChild>
                      <Link to="/dashboard" className="flex items-center gap-2">
                        <LayoutDashboard className="w-4 h-4" />
                        Dashboard
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link to="/admin" className="flex items-center gap-2">
                        <User className="w-4 h-4" />
                        Admin Panel
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleSignOut} className="text-destructive">
                      <LogOut className="w-4 h-4 mr-2" />
                      Sign Out
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : (
                <>
                  <Button variant="ghost" className="font-nunito font-semibold" onClick={openLogin}>
                    Log In
                  </Button>
                  <Button variant="default" size="lg" onClick={openSignup}>
                    Sign Up Free
                  </Button>
                </>
              )}
            </div>

            {/* Mobile Menu Button */}
            <button
              className="md:hidden p-2 rounded-lg hover:bg-muted transition-colors"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              aria-label="Toggle menu"
            >
              {isMenuOpen ? (
                <X className="w-6 h-6 text-foreground" />
              ) : (
                <Menu className="w-6 h-6 text-foreground" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        <AnimatePresence>
          {isMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="md:hidden bg-card border-t border-border overflow-hidden"
            >
              <nav className="container mx-auto px-4 py-4 flex flex-col gap-2">
                {navItems.map((item) =>
                  item.href.startsWith("/#") ? (
                    <a
                      key={item.label}
                      href={item.href}
                      className={`py-3 px-4 rounded-xl hover:bg-muted font-display font-semibold text-foreground transition-colors`}
                      onClick={() => setIsMenuOpen(false)}
                    >
                      {item.label}
                    </a>
                  ) : (
                    <Link
                      key={item.label}
                      to={item.href}
                      className={`py-3 px-4 rounded-xl hover:bg-muted font-display font-semibold transition-colors ${
                        isActive(item.href) ? "bg-primary/10 text-primary" : "text-foreground"
                      }`}
                      onClick={() => setIsMenuOpen(false)}
                    >
                      {item.label}
                    </Link>
                  )
                )}
                <div className="flex flex-col gap-2 mt-4 pt-4 border-t border-border">
                  {user ? (
                    <>
                      <Link
                        to="/dashboard"
                        className="py-3 px-4 rounded-xl hover:bg-muted font-display font-semibold text-foreground transition-colors flex items-center gap-2"
                        onClick={() => setIsMenuOpen(false)}
                      >
                        <LayoutDashboard className="w-4 h-4" />
                        Dashboard
                      </Link>
                      <Link
                        to="/admin"
                        className="py-3 px-4 rounded-xl hover:bg-muted font-display font-semibold text-foreground transition-colors flex items-center gap-2"
                        onClick={() => setIsMenuOpen(false)}
                      >
                        <User className="w-4 h-4" />
                        Admin Panel
                      </Link>
                      <Button variant="destructive" className="w-full" onClick={handleSignOut}>
                        <LogOut className="w-4 h-4 mr-2" />
                        Sign Out
                      </Button>
                    </>
                  ) : (
                    <>
                      <Button variant="outline" className="w-full" onClick={openLogin}>
                        Log In
                      </Button>
                      <Button variant="default" className="w-full" onClick={openSignup}>
                        Sign Up Free
                      </Button>
                    </>
                  )}
                </div>
              </nav>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      <AuthModal isOpen={showAuthModal} onClose={() => setShowAuthModal(false)} />
    </>
  );
};

export default Header;
