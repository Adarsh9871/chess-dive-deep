import { motion } from "framer-motion";
import { ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

const programs = [
  {
    level: "BEGINNER",
    title: "Beginners",
    description: "Specialized course for our early learners, with little or no exposure.",
    image: "https://images.unsplash.com/photo-1529699211952-734e80c4d42b?w=400&h=300&fit=crop",
    color: "from-amber-500/80 to-amber-600/80",
  },
  {
    level: "INTERMEDIATE - 1",
    title: "Intermediate",
    description: "This course takes kids to the next level by teaching them different strategies and tactics.",
    image: "https://images.unsplash.com/photo-1586165368502-1bad197a6461?w=400&h=300&fit=crop",
    color: "from-sky-500/80 to-sky-600/80",
  },
  {
    level: "ADVANCED",
    title: "Advanced",
    description: "Kids will master opening plays, middle and end games which will make them a very tough opponent.",
    image: "https://images.unsplash.com/photo-1580541832626-2a7131ee809f?w=400&h=300&fit=crop",
    color: "from-slate-600/80 to-slate-700/80",
  },
];

const OurProgramsSection = () => {
  return (
    <section className="py-16 md:py-24 bg-background">
      <div className="container px-4 mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <h2 className="text-3xl md:text-4xl font-display font-bold text-foreground mb-3">
            Our Programs
          </h2>
          <p className="text-muted-foreground text-lg">
            A variety of courses for any skill level
          </p>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-6 md:gap-8 max-w-5xl mx-auto">
          {programs.map((program, index) => (
            <motion.div
              key={program.level}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              className="group"
            >
              <div className="relative overflow-hidden rounded-2xl mb-4 aspect-[4/3]">
                <img
                  src={program.image}
                  alt={program.title}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                />
                <div className={`absolute inset-0 bg-gradient-to-t ${program.color} flex items-end justify-center pb-6`}>
                  <span className="text-white font-display font-bold text-lg tracking-wide">
                    {program.level}
                  </span>
                </div>
              </div>
              
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="font-display font-bold text-lg text-foreground mb-1">
                    {program.title}
                  </h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {program.description}
                  </p>
                </div>
                <Button
                  size="icon"
                  className="flex-shrink-0 rounded-full bg-primary hover:bg-primary/90 h-10 w-10"
                >
                  <ChevronRight className="w-5 h-5" />
                </Button>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default OurProgramsSection;
