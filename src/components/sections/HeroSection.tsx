import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { Play, BookOpen, Star } from "lucide-react";
import { Link } from "react-router-dom";

// Floating cloud component
const Cloud = ({ className, delay = 0, size = "md" }: { className: string; delay?: number; size?: "sm" | "md" | "lg" }) => {
  const sizes = {
    sm: "w-20 h-12 md:w-28 md:h-16",
    md: "w-32 h-20 md:w-40 md:h-24",
    lg: "w-40 h-24 md:w-56 md:h-32"
  };

  return (
    <motion.div
      className={`absolute ${sizes[size]} ${className}`}
      initial={{ opacity: 0, x: -20 }}
      animate={{ 
        opacity: [0.8, 0.95, 0.8], 
        x: [0, 10, 0],
        y: [0, -5, 0]
      }}
      transition={{ 
        delay, 
        duration: 8,
        repeat: Infinity,
        ease: "easeInOut"
      }}
    >
      <svg viewBox="0 0 200 100" className="w-full h-full drop-shadow-lg">
        <ellipse cx="50" cy="55" rx="45" ry="28" fill="white" fillOpacity="0.95" />
        <ellipse cx="95" cy="45" rx="50" ry="35" fill="white" />
        <ellipse cx="140" cy="55" rx="42" ry="26" fill="white" fillOpacity="0.92" />
        <ellipse cx="95" cy="65" rx="55" ry="22" fill="white" />
      </svg>
    </motion.div>
  );
};

// Animated chess piece character
const ChessPieceCharacter = ({ 
  emoji, 
  className, 
  delay = 0,
  bounceIntensity = 10
}: { 
  emoji: string; 
  className: string; 
  delay?: number;
  bounceIntensity?: number;
}) => (
  <motion.div
    className={`absolute ${className}`}
    initial={{ opacity: 0, y: 30, scale: 0.8 }}
    animate={{ 
      opacity: 1, 
      y: [0, -bounceIntensity, 0],
      scale: 1,
      rotate: [-3, 3, -3]
    }}
    transition={{ 
      delay,
      duration: 3,
      repeat: Infinity,
      ease: "easeInOut"
    }}
  >
    <span className="text-5xl md:text-7xl drop-shadow-xl filter">{emoji}</span>
  </motion.div>
);

// Star sparkle effect
const Sparkle = ({ className, delay = 0 }: { className: string; delay?: number }) => (
  <motion.div
    className={`absolute ${className}`}
    initial={{ opacity: 0, scale: 0 }}
    animate={{ 
      opacity: [0, 1, 0],
      scale: [0.5, 1.2, 0.5],
      rotate: [0, 180, 360]
    }}
    transition={{ 
      delay,
      duration: 2,
      repeat: Infinity,
      ease: "easeInOut"
    }}
  >
    <Star className="w-4 h-4 md:w-6 md:h-6 text-gold fill-gold" />
  </motion.div>
);

// Fun badge component
const FunBadge = ({ text, className }: { text: string; className?: string }) => (
  <motion.div
    className={`inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gold text-foreground font-bold text-sm shadow-lg ${className}`}
    initial={{ opacity: 0, scale: 0.8 }}
    animate={{ opacity: 1, scale: 1 }}
    transition={{ delay: 0.6 }}
  >
    <span>⭐</span>
    {text}
    <span>⭐</span>
  </motion.div>
);

const HeroSection = () => {
  return (
    <section className="relative min-h-[90vh] md:min-h-screen overflow-hidden pt-20 pb-32">
      {/* Sky gradient background */}
      <div className="absolute inset-0 hero-gradient" />
      
      {/* Animated clouds */}
      <Cloud className="top-16 left-[2%]" delay={0} size="lg" />
      <Cloud className="top-28 right-[5%]" delay={0.3} size="md" />
      <Cloud className="top-[35%] left-[10%]" delay={0.6} size="sm" />
      <Cloud className="top-[25%] right-[15%]" delay={0.8} size="sm" />
      <Cloud className="top-[45%] right-[3%]" delay={1} size="md" />

      {/* Sparkle effects */}
      <Sparkle className="top-32 left-[20%]" delay={0.5} />
      <Sparkle className="top-48 right-[25%]" delay={1.2} />
      <Sparkle className="top-[40%] left-[35%]" delay={1.8} />
      <Sparkle className="top-[30%] right-[30%]" delay={2.5} />

      {/* Chess piece characters */}
      <ChessPieceCharacter emoji="♔" className="bottom-[28%] left-[5%] md:left-[8%]" delay={0.3} bounceIntensity={8} />
      <ChessPieceCharacter emoji="♕" className="bottom-[32%] right-[5%] md:right-[10%]" delay={0.5} bounceIntensity={12} />
      <ChessPieceCharacter emoji="♘" className="bottom-[22%] left-[20%] hidden md:block" delay={0.7} bounceIntensity={10} />
      <ChessPieceCharacter emoji="♗" className="bottom-[26%] right-[20%] hidden md:block" delay={0.9} bounceIntensity={6} />
      <ChessPieceCharacter emoji="♖" className="bottom-[35%] left-[35%] hidden lg:block" delay={1.1} bounceIntensity={8} />
      <ChessPieceCharacter emoji="♙" className="bottom-[20%] right-[35%] hidden lg:block text-4xl md:text-5xl" delay={1.3} bounceIntensity={14} />

      {/* Main Content */}
      <div className="container mx-auto px-4 pt-8 md:pt-20 relative z-10">
        <div className="max-w-4xl mx-auto text-center">
          {/* Fun badge */}
          <FunBadge text="Best Chess Platform for Kids" className="mb-6" />
          
          <motion.h1
            className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-display font-bold text-white mb-6"
            style={{
              textShadow: "3px 3px 0 rgba(0,0,0,0.2), 6px 6px 0 rgba(0,0,0,0.1)"
            }}
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            The <span className="text-gold">#1</span> Chess Site
            <br />
            <span className="text-gold">for Kids!</span>
          </motion.h1>

          <motion.p
            className="text-lg md:text-xl lg:text-2xl text-white/90 mb-8 md:mb-10 max-w-2xl mx-auto font-nunito leading-relaxed"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            Join millions of kids learning chess the fun way! 
            <br className="hidden sm:block" />
            Play games, solve puzzles, and become a chess champion.
          </motion.p>

          {/* Stats row */}
          <motion.div
            className="flex flex-wrap justify-center gap-6 md:gap-10 mb-8 md:mb-10"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
          >
            <div className="text-center">
              <p className="text-3xl md:text-4xl font-display font-bold text-white">10M+</p>
              <p className="text-sm md:text-base text-white/80">Kids Playing</p>
            </div>
            <div className="text-center">
              <p className="text-3xl md:text-4xl font-display font-bold text-white">100K+</p>
              <p className="text-sm md:text-base text-white/80">Lessons</p>
            </div>
            <div className="text-center">
              <p className="text-3xl md:text-4xl font-display font-bold text-white">50+</p>
              <p className="text-sm md:text-base text-white/80">Countries</p>
            </div>
          </motion.div>

          <motion.div
            className="flex flex-col sm:flex-row gap-4 justify-center"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
          >
            <Button 
              variant="hero" 
              size="xl" 
              className="group shadow-xl hover:shadow-2xl transition-all" 
              asChild
            >
              <Link to="/play">
                <Play className="w-5 h-5 transition-transform group-hover:scale-110" />
                Play Now - It's Free!
              </Link>
            </Button>
            <Button 
              variant="heroSecondary" 
              size="xl" 
              className="group shadow-lg"
              asChild
            >
              <Link to="/lessons">
                <BookOpen className="w-5 h-5 transition-transform group-hover:scale-110" />
                Learn Chess
              </Link>
            </Button>
          </motion.div>

          {/* Trust badges */}
          <motion.div
            className="mt-8 md:mt-12 flex flex-wrap justify-center gap-4 text-white/70 text-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8 }}
          >
            <span className="flex items-center gap-1">✓ 100% Safe for Kids</span>
            <span className="flex items-center gap-1">✓ No Ads</span>
            <span className="flex items-center gap-1">✓ Parent Controls</span>
          </motion.div>
        </div>
      </div>

      {/* Grass hill at bottom */}
      <div className="absolute bottom-0 left-0 right-0">
        <svg
          viewBox="0 0 1440 150"
          className="w-full h-24 md:h-32"
          preserveAspectRatio="none"
        >
          <path
            d="M0,80 C240,140 480,20 720,80 C960,140 1200,40 1440,80 L1440,150 L0,150 Z"
            fill="hsl(142, 70%, 35%)"
          />
          <path
            d="M0,100 C360,150 720,60 1080,100 C1260,120 1380,90 1440,100 L1440,150 L0,150 Z"
            fill="hsl(142, 70%, 40%)"
          />
        </svg>
      </div>
    </section>
  );
};

export default HeroSection;
