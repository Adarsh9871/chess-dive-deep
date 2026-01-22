import { motion } from "framer-motion";
import { Users, Bot, Video, Puzzle } from "lucide-react";
import { Link } from "react-router-dom";
import { toast } from "sonner";

const features = [
  {
    icon: Users,
    title: "Play Kids",
    description: "Play chess with kids from around the world at any time!",
    color: "bg-primary",
    hoverColor: "hover:bg-primary/90",
    link: "/play",
    available: true,
  },
  {
    icon: Bot,
    title: "Play Bots",
    description: "Challenge a bot at any level, from gentle beginner to master!",
    color: "bg-secondary",
    hoverColor: "hover:bg-secondary/90",
    link: "/play",
    available: true,
  },
  {
    icon: Video,
    title: "Watch Lessons",
    description: "150+ interactive lessons help you learn new skills.",
    color: "bg-accent",
    hoverColor: "hover:bg-accent/90",
    link: "/lessons",
    available: true,
  },
  {
    icon: Puzzle,
    title: "Solve Puzzles",
    description: "Improve your game by solving thousands of chess puzzles!",
    color: "bg-gold",
    hoverColor: "hover:bg-gold-dark",
    link: "/puzzles",
    available: true,
  },
];

const FeaturesSection = () => {
  const handleUnavailable = (title: string) => {
    toast.info(`${title} coming soon! 🚀`, {
      description: "We're working hard to bring you this feature.",
    });
  };

  return (
    <section className="py-16 md:py-24 bg-muted" id="play">
      <div className="container mx-auto px-4">
        <motion.div
          className="text-center mb-12 md:mb-16"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
        >
          <h2 className="text-3xl md:text-5xl font-display font-bold text-foreground mb-4">
            Play Chess with Other Kids
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto font-nunito">
            Learning with ChessPals is fun! Play games, watch video lessons, and solve fun puzzles!
          </p>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8">
          {features.map((feature, index) => (
            <motion.div
              key={feature.title}
              className="group"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
            >
              {feature.available ? (
                <Link to={feature.link}>
                  <div className="bg-card rounded-3xl p-6 md:p-8 card-shadow bounce-hover cursor-pointer h-full relative overflow-hidden">
                    {/* Chess Board Pattern Background */}
                    <div className="relative mb-6 h-40 rounded-2xl overflow-hidden">
                      <div className="absolute inset-0 grid grid-cols-4 grid-rows-4">
                        {[...Array(16)].map((_, i) => (
                          <div
                            key={i}
                            className={`${
                              (Math.floor(i / 4) + i) % 2 === 0
                                ? "bg-board-light"
                                : "bg-board-dark"
                            }`}
                          />
                        ))}
                      </div>
                      <div className={`absolute inset-0 ${feature.color} opacity-80 flex items-center justify-center transition-opacity group-hover:opacity-100`}>
                        <feature.icon className="w-16 h-16 text-card transition-transform group-hover:scale-110" strokeWidth={1.5} />
                      </div>
                    </div>

                    <h3 className="text-xl md:text-2xl font-display font-bold text-foreground mb-2 group-hover:text-primary transition-colors">
                      {feature.title}
                    </h3>
                    <p className="text-muted-foreground font-nunito">
                      {feature.description}
                    </p>

                    {/* Play indicator */}
                    <div className="absolute top-4 right-4 bg-secondary text-secondary-foreground text-xs font-bold px-2 py-1 rounded-full">
                      Play Now!
                    </div>
                  </div>
                </Link>
              ) : (
                <div
                  onClick={() => handleUnavailable(feature.title)}
                  className="bg-card rounded-3xl p-6 md:p-8 card-shadow bounce-hover cursor-pointer h-full relative overflow-hidden"
                >
                  {/* Chess Board Pattern Background */}
                  <div className="relative mb-6 h-40 rounded-2xl overflow-hidden">
                    <div className="absolute inset-0 grid grid-cols-4 grid-rows-4">
                      {[...Array(16)].map((_, i) => (
                        <div
                          key={i}
                          className={`${
                            (Math.floor(i / 4) + i) % 2 === 0
                              ? "bg-board-light"
                              : "bg-board-dark"
                          }`}
                        />
                      ))}
                    </div>
                    <div className={`absolute inset-0 ${feature.color} opacity-80 flex items-center justify-center`}>
                      <feature.icon className="w-16 h-16 text-card" strokeWidth={1.5} />
                    </div>
                  </div>

                  <h3 className="text-xl md:text-2xl font-display font-bold text-foreground mb-2 group-hover:text-primary transition-colors">
                    {feature.title}
                  </h3>
                  <p className="text-muted-foreground font-nunito">
                    {feature.description}
                  </p>

                  {/* Coming soon badge */}
                  <div className="absolute top-4 right-4 bg-muted text-muted-foreground text-xs font-bold px-2 py-1 rounded-full">
                    Coming Soon
                  </div>
                </div>
              )}
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FeaturesSection;
