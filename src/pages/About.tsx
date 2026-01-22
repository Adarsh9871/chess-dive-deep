import { motion } from "framer-motion";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Star, Award, Users, Trophy } from "lucide-react";

const coaches = [
  {
    name: "Coach Jagadish",
    title: "Head Coach",
    rating: 2100,
    students: 500,
    image: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=300&h=300&fit=crop",
    achievements: ["FIDE Rated", "10+ Years Experience", "National Champion 2018"],
    description: "Passionate about teaching chess to young minds. Specializes in opening theory and tactical play.",
  },
  {
    name: "Coach Sarah",
    title: "Senior Coach",
    rating: 1950,
    students: 350,
    image: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=300&h=300&fit=crop",
    achievements: ["WFM Title", "Youth Coach Specialist", "State Champion 2020"],
    description: "Expert in teaching beginners and young children. Makes learning chess fun and engaging.",
  },
  {
    name: "Coach Mike",
    title: "Tactics Specialist",
    rating: 2050,
    students: 280,
    image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&h=300&fit=crop",
    achievements: ["CM Title", "Puzzle Master", "Online Coach of the Year"],
    description: "Focuses on tactical training and calculation. Helps students spot winning combinations.",
  },
];

const About = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main>
        {/* Hero Section */}
        <section className="py-16 md:py-24 bg-gradient-to-b from-accent/10 to-background">
          <div className="container px-4 mx-auto text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <h1 className="text-4xl md:text-5xl font-display font-bold text-foreground mb-4">
                About Our Coaches
              </h1>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                Meet our team of experienced chess coaches dedicated to helping your child 
                master the game and develop critical thinking skills.
              </p>
            </motion.div>
          </div>
        </section>

        {/* Stats */}
        <section className="py-12 bg-muted/50">
          <div className="container px-4 mx-auto">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-4xl mx-auto">
              {[
                { icon: Users, value: "2,000+", label: "Students Taught" },
                { icon: Trophy, value: "50+", label: "Tournament Wins" },
                { icon: Star, value: "4.9", label: "Average Rating" },
                { icon: Award, value: "10+", label: "Years Experience" },
              ].map((stat, index) => (
                <motion.div
                  key={stat.label}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="text-center"
                >
                  <stat.icon className="w-8 h-8 text-primary mx-auto mb-2" />
                  <p className="text-2xl font-display font-bold text-foreground">
                    {stat.value}
                  </p>
                  <p className="text-sm text-muted-foreground">{stat.label}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Coaches */}
        <section className="py-16 md:py-24">
          <div className="container px-4 mx-auto">
            <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
              {coaches.map((coach, index) => (
                <motion.div
                  key={coach.name}
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.15 }}
                >
                  <Card className="h-full hover:shadow-lg transition-shadow">
                    <CardContent className="p-6 text-center">
                      <div className="relative w-32 h-32 mx-auto mb-4">
                        <img
                          src={coach.image}
                          alt={coach.name}
                          className="w-full h-full object-cover rounded-full border-4 border-primary/20"
                        />
                        <div className="absolute -bottom-2 left-1/2 -translate-x-1/2">
                          <Badge variant="secondary" className="bg-primary text-primary-foreground">
                            {coach.rating} ELO
                          </Badge>
                        </div>
                      </div>

                      <h3 className="font-display font-bold text-xl text-foreground mb-1">
                        {coach.name}
                      </h3>
                      <p className="text-sm text-accent font-medium mb-3">
                        {coach.title}
                      </p>
                      <p className="text-sm text-muted-foreground mb-4">
                        {coach.description}
                      </p>

                      <div className="flex flex-wrap gap-2 justify-center mb-4">
                        {coach.achievements.map((achievement) => (
                          <Badge key={achievement} variant="outline" className="text-xs">
                            {achievement}
                          </Badge>
                        ))}
                      </div>

                      <p className="text-xs text-muted-foreground">
                        <Users className="w-3 h-3 inline mr-1" />
                        {coach.students}+ students taught
                      </p>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default About;
