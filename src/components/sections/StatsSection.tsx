import { motion } from "framer-motion";
import { Users, School, Gamepad2, Puzzle, BookOpen } from "lucide-react";

const stats = [
  { icon: Users, value: "12M+", label: "Happy Kids", color: "text-primary" },
  { icon: School, value: "28,000+", label: "Schools", color: "text-secondary" },
  { icon: Gamepad2, value: "91M+", label: "Games Played", color: "text-gold" },
  { icon: Puzzle, value: "113M+", label: "Puzzles Solved", color: "text-accent" },
  { icon: BookOpen, value: "16M+", label: "Lessons Taken", color: "text-grass" },
];

const StatsSection = () => {
  return (
    <section className="bg-card py-12 md:py-16 relative -mt-1">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-6 md:gap-4">
          {stats.map((stat, index) => (
            <motion.div
              key={stat.label}
              className="flex flex-col items-center text-center p-4"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
            >
              <div className={`mb-3 ${stat.color}`}>
                <stat.icon className="w-10 h-10 md:w-12 md:h-12" strokeWidth={1.5} />
              </div>
              <span className={`text-2xl md:text-3xl font-display font-bold ${stat.color}`}>
                {stat.value}
              </span>
              <span className="text-sm md:text-base text-muted-foreground font-nunito font-medium mt-1">
                {stat.label}
              </span>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default StatsSection;
