import { motion } from "framer-motion";
import { Shield, Brain, Globe } from "lucide-react";

const reasons = [
  {
    icon: Shield,
    title: "Safe and Positive",
    points: [
      "No chat - completely safe environment",
      "Auto-generated usernames",
      "Child activity reports for parents",
    ],
    color: "text-secondary",
  },
  {
    icon: Brain,
    title: "Educational Screen Time",
    points: [
      "Healthy screen time parents approve",
      "Learn pattern recognition & problem solving",
      "Build patience and critical thinking",
    ],
    color: "text-accent",
  },
  {
    icon: Globe,
    title: "Personalized Learning",
    points: [
      "Lessons tailored to every skill level",
      "Translated into 30+ languages",
      "Personal instruction from coaches",
    ],
    color: "text-primary",
  },
];

const WhyKidsLoveSection = () => {
  return (
    <section className="py-16 md:py-24 bg-card" id="parents">
      <div className="container mx-auto px-4">
        <motion.div
          className="text-center mb-12 md:mb-16"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
        >
          <h2 className="text-3xl md:text-5xl font-display font-bold text-foreground mb-4">
            Why Kids <span className="text-primary">Love</span> ChessPals
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto font-nunito">
            A safe, fun, and educational chess experience designed just for kids
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-12">
          {reasons.map((reason, index) => (
            <motion.div
              key={reason.title}
              className="text-center md:text-left"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.15 }}
            >
              <div className={`inline-flex p-4 rounded-2xl bg-muted mb-6 ${reason.color}`}>
                <reason.icon className="w-10 h-10 md:w-12 md:h-12" strokeWidth={1.5} />
              </div>
              
              <h3 className="text-xl md:text-2xl font-display font-bold text-foreground mb-4">
                {reason.title}
              </h3>
              
              <ul className="space-y-3">
                {reason.points.map((point, i) => (
                  <li key={i} className="flex items-start gap-3 text-muted-foreground font-nunito">
                    <span className={`flex-shrink-0 w-2 h-2 rounded-full ${reason.color.replace('text-', 'bg-')} mt-2`} />
                    {point}
                  </li>
                ))}
              </ul>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default WhyKidsLoveSection;
