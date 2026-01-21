import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { Crown, Check, Sparkles } from "lucide-react";

const benefits = [
  "Unlimited Puzzles",
  "All Video Lessons",
  "Daily Workouts",
  "Game History",
  "No Ads Ever",
  "Priority Support",
];

const GoldMembershipSection = () => {
  return (
    <section className="py-16 md:py-24 bg-muted relative overflow-hidden">
      {/* Decorative background elements */}
      <div className="absolute top-0 left-0 w-64 h-64 bg-gold/10 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2" />
      <div className="absolute bottom-0 right-0 w-80 h-80 bg-primary/10 rounded-full blur-3xl translate-x-1/2 translate-y-1/2" />

      <div className="container mx-auto px-4 relative z-10">
        <div className="max-w-4xl mx-auto">
          <motion.div
            className="bg-card rounded-3xl card-shadow overflow-hidden"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <div className="grid md:grid-cols-2 gap-8">
              {/* Left side - Content */}
              <div className="p-8 md:p-12 flex flex-col justify-center">
                <div className="flex items-center gap-3 mb-4">
                  <Crown className="w-10 h-10 text-gold" />
                  <Sparkles className="w-6 h-6 text-gold animate-pulse" />
                </div>

                <h2 className="text-3xl md:text-4xl font-display font-bold text-foreground mb-4">
                  Unlock Your{" "}
                  <span className="text-gold">Gold</span>{" "}
                  Potential
                </h2>

                <p className="text-muted-foreground font-nunito mb-6">
                  Get unlimited access to everything! Become a Gold Member and accelerate your chess journey.
                </p>

                <ul className="grid grid-cols-2 gap-3 mb-8">
                  {benefits.map((benefit) => (
                    <li key={benefit} className="flex items-center gap-2 font-nunito">
                      <Check className="w-5 h-5 text-secondary flex-shrink-0" />
                      <span className="text-sm text-foreground">{benefit}</span>
                    </li>
                  ))}
                </ul>

                <Button variant="gold" size="xl" className="w-full md:w-auto text-foreground font-bold">
                  <Crown className="w-5 h-5" />
                  Upgrade to Gold
                </Button>
              </div>

              {/* Right side - Visual */}
              <div className="relative gold-gradient p-8 md:p-12 flex items-center justify-center min-h-[300px]">
                <motion.div
                  className="text-8xl md:text-9xl"
                  animate={{ 
                    y: [0, -10, 0],
                    rotate: [-2, 2, -2],
                  }}
                  transition={{
                    duration: 4,
                    repeat: Infinity,
                    ease: "easeInOut",
                  }}
                >
                  👑
                </motion.div>

                {/* Floating chess pieces */}
                <motion.span
                  className="absolute top-8 right-8 text-4xl opacity-80"
                  animate={{ y: [0, -8, 0] }}
                  transition={{ duration: 3, repeat: Infinity, delay: 0.5 }}
                >
                  ♔
                </motion.span>
                <motion.span
                  className="absolute bottom-12 left-8 text-3xl opacity-80"
                  animate={{ y: [0, -6, 0] }}
                  transition={{ duration: 2.5, repeat: Infinity, delay: 1 }}
                >
                  ♕
                </motion.span>
                <motion.span
                  className="absolute top-1/2 right-12 text-2xl opacity-60"
                  animate={{ y: [0, -5, 0] }}
                  transition={{ duration: 2, repeat: Infinity, delay: 0.3 }}
                >
                  ♘
                </motion.span>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default GoldMembershipSection;
