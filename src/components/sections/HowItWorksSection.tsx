import { motion } from "framer-motion";
import { Users, UserCheck, Video } from "lucide-react";

const features = [
  {
    icon: Users,
    title: "2K Students Taught",
    description: "Our teachers have taught over two thousand 5-15 year olds to play both online and offline.",
    color: "bg-amber-100 text-amber-600",
    image: "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=400&h=300&fit=crop",
  },
  {
    icon: UserCheck,
    title: "Coach Matching",
    description: "We offer coach matching to find the best coach for your child. Your classes are \"not counted\" unless you are happy with your coach.",
    color: "bg-sky-100 text-sky-600",
    image: "https://images.unsplash.com/photo-1571260899304-425eee4c7efc?w=400&h=300&fit=crop",
  },
  {
    icon: Video,
    title: "1:1 Classes",
    description: "1:1 classes that work with your schedule. And we offer 100% money back if you are unhappy for any reason at all.",
    color: "bg-violet-100 text-violet-600",
    image: "https://images.unsplash.com/photo-1588702547919-26089e690ecc?w=400&h=300&fit=crop",
  },
];

const HowItWorksSection = () => {
  return (
    <section className="py-16 md:py-24 bg-muted/50 rounded-t-[3rem]">
      <div className="container px-4 mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <h2 className="text-3xl md:text-4xl font-display font-bold text-foreground">
            How it Works
          </h2>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          {features.map((feature, index) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.15 }}
              className="text-center"
            >
              <div className="relative overflow-hidden rounded-2xl mb-6 aspect-[4/3] mx-auto max-w-xs">
                <img
                  src={feature.image}
                  alt={feature.title}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
              </div>
              
              <h3 className="font-display font-bold text-xl text-foreground mb-3">
                {feature.title}
              </h3>
              <div className="w-12 h-0.5 bg-primary mx-auto mb-4" />
              <p className="text-muted-foreground text-sm leading-relaxed max-w-xs mx-auto">
                {feature.description}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default HowItWorksSection;
