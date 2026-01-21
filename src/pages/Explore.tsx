import { useState } from "react";
import { motion } from "framer-motion";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar, Clock, User } from "lucide-react";

const categories = ["All", "Chess Basics", "Openings", "Tactics", "Endgame"];
const levels = ["All", "Beginner", "Intermediate", "Advanced"];
const teachers = ["All", "Coach Jagadish", "Coach Sarah", "Coach Mike"];
const ageGroups = ["All", "4 - 5 yrs", "6 - 9 yrs", "10 - 12 yrs", "12 - 15 yrs", "15 - 20 yrs"];

const availableSlots = [
  { id: 1, date: "Tomorrow", time: "10:00 AM", teacher: "Coach Jagadish", level: "Beginner", spots: 3 },
  { id: 2, date: "Tomorrow", time: "2:00 PM", teacher: "Coach Sarah", level: "Intermediate", spots: 2 },
  { id: 3, date: "Jan 21", time: "11:00 AM", teacher: "Coach Mike", level: "Beginner", spots: 5 },
  { id: 4, date: "Jan 21", time: "4:00 PM", teacher: "Coach Jagadish", level: "Advanced", spots: 1 },
  { id: 5, date: "Jan 22", time: "9:00 AM", teacher: "Coach Sarah", level: "Beginner", spots: 4 },
  { id: 6, date: "Jan 22", time: "3:00 PM", teacher: "Coach Mike", level: "Intermediate", spots: 2 },
];

const Explore = () => {
  const [category, setCategory] = useState("All");
  const [level, setLevel] = useState("All");
  const [teacher, setTeacher] = useState("All");
  const [ageGroup, setAgeGroup] = useState("All");

  const filteredSlots = availableSlots.filter((slot) => {
    if (level !== "All" && slot.level !== level) return false;
    if (teacher !== "All" && slot.teacher !== teacher) return false;
    return true;
  });

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main>
        {/* Hero Section */}
        <section className="py-12 md:py-20 bg-gradient-to-b from-background to-muted/30">
          <div className="container px-4 mx-auto text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="max-w-3xl mx-auto"
            >
              <h1 className="text-4xl md:text-5xl font-display font-bold text-foreground mb-4">
                Explore & Get inspired
              </h1>
              <p className="text-lg text-muted-foreground mb-2">
                Live 1:1 Classes
              </p>
              <p className="text-muted-foreground">
                Join for best classes right now!
              </p>
            </motion.div>

            {/* Decorative elements */}
            <div className="relative max-w-2xl mx-auto mt-8">
              <img 
                src="https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=600&h=400&fit=crop"
                alt="Student learning"
                className="rounded-2xl shadow-xl mx-auto"
              />
            </div>
          </div>
        </section>

        {/* Filter Section */}
        <section className="py-12 bg-muted/50 rounded-t-[3rem] -mt-8">
          <div className="container px-4 mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="text-center mb-8"
            >
              <h2 className="text-3xl md:text-4xl font-display font-bold text-foreground mb-2">
                Choose a Convenient
              </h2>
              <h2 className="text-3xl md:text-4xl font-display font-bold text-foreground">
                Study Time
              </h2>
            </motion.div>

            {/* Filters */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto mb-12"
            >
              <div>
                <label className="text-sm text-muted-foreground mb-1.5 block">Category</label>
                <Select value={category} onValueChange={setCategory}>
                  <SelectTrigger className="bg-background border-accent/30 focus:border-accent">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-background z-50">
                    {categories.map((cat) => (
                      <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm text-muted-foreground mb-1.5 block">Levels</label>
                <Select value={level} onValueChange={setLevel}>
                  <SelectTrigger className="bg-background border-accent/30 focus:border-accent">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-background z-50">
                    {levels.map((lvl) => (
                      <SelectItem key={lvl} value={lvl}>{lvl}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm text-muted-foreground mb-1.5 block">Teachers</label>
                <Select value={teacher} onValueChange={setTeacher}>
                  <SelectTrigger className="bg-background border-accent/30 focus:border-accent">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-background z-50">
                    {teachers.map((t) => (
                      <SelectItem key={t} value={t}>{t}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm text-muted-foreground mb-1.5 block">Age Group</label>
                <Select value={ageGroup} onValueChange={setAgeGroup}>
                  <SelectTrigger className="bg-background border-accent/30 focus:border-accent">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-background z-50">
                    {ageGroups.map((age) => (
                      <SelectItem key={age} value={age}>{age}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </motion.div>

            {/* Available Slots */}
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4 max-w-5xl mx-auto">
              {filteredSlots.map((slot, index) => (
                <motion.div
                  key={slot.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 * index }}
                >
                  <Card className="hover:shadow-lg transition-shadow border-border hover:border-accent/30">
                    <CardContent className="p-5">
                      <div className="flex items-center gap-2 mb-3">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                          slot.level === "Beginner" ? "bg-green-100 text-green-700" :
                          slot.level === "Intermediate" ? "bg-blue-100 text-blue-700" :
                          "bg-purple-100 text-purple-700"
                        }`}>
                          {slot.level}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {slot.spots} spots left
                        </span>
                      </div>
                      
                      <div className="space-y-2 mb-4">
                        <div className="flex items-center gap-2 text-sm">
                          <User className="w-4 h-4 text-accent" />
                          <span>{slot.teacher}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                          <Calendar className="w-4 h-4 text-accent" />
                          <span>{slot.date}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                          <Clock className="w-4 h-4 text-accent" />
                          <span>{slot.time}</span>
                        </div>
                      </div>

                      <Button className="w-full" size="sm">
                        Book Class
                      </Button>
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

export default Explore;
