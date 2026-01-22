import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Play, Lock, CheckCircle, Star, Clock, Users, ChevronRight, BookOpen, Swords, Flag, Crown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";

interface Lesson {
  id: string;
  title: string;
  description: string;
  duration: string;
  thumbnail: string;
  videoUrl: string;
  completed: boolean;
  locked: boolean;
}

interface LessonCategory {
  id: string;
  name: string;
  icon: React.ElementType;
  description: string;
  color: string;
  lessons: Lesson[];
  skillLevel: "beginner" | "intermediate" | "advanced";
}

const lessonCategories: LessonCategory[] = [
  {
    id: "openings",
    name: "Chess Openings",
    icon: Flag,
    description: "Learn how to start your games strong!",
    color: "from-primary to-primary/70",
    skillLevel: "beginner",
    lessons: [
      {
        id: "1",
        title: "The Italian Game",
        description: "A classic opening for beginners! Learn to control the center and develop your pieces.",
        duration: "5 min",
        thumbnail: "🏰",
        videoUrl: "https://www.youtube.com/embed/Ao9ipmsDdgA",
        completed: false,
        locked: false,
      },
      {
        id: "2",
        title: "The London System",
        description: "A solid and easy-to-learn opening that works against almost anything!",
        duration: "6 min",
        thumbnail: "🎩",
        videoUrl: "https://www.youtube.com/embed/sL3SOPZyY74",
        completed: false,
        locked: false,
      },
      {
        id: "3",
        title: "King's Indian Attack",
        description: "A flexible opening system that's great for attacking players!",
        duration: "7 min",
        thumbnail: "👑",
        videoUrl: "https://www.youtube.com/embed/S4cNq5-kgz4",
        completed: false,
        locked: true,
      },
      {
        id: "4",
        title: "The Scotch Game",
        description: "Open up the position and create attacking chances early!",
        duration: "5 min",
        thumbnail: "⚔️",
        videoUrl: "https://www.youtube.com/embed/S4cNq5-kgz4",
        completed: false,
        locked: true,
      },
    ],
  },
  {
    id: "tactics",
    name: "Chess Tactics",
    icon: Swords,
    description: "Master the art of winning material and checkmates!",
    color: "from-secondary to-secondary/70",
    skillLevel: "intermediate",
    lessons: [
      {
        id: "5",
        title: "Forks & Double Attacks",
        description: "Attack two pieces at once! One of the most powerful tactics in chess.",
        duration: "6 min",
        thumbnail: "🍴",
        videoUrl: "https://www.youtube.com/embed/S4cNq5-kgz4",
        completed: false,
        locked: false,
      },
      {
        id: "6",
        title: "Pins & Skewers",
        description: "Learn how to trap pieces and win material with these sneaky tactics!",
        duration: "7 min",
        thumbnail: "📌",
        videoUrl: "https://www.youtube.com/embed/S4cNq5-kgz4",
        completed: false,
        locked: false,
      },
      {
        id: "7",
        title: "Discovered Attacks",
        description: "Unleash hidden attacks by moving one piece to reveal another!",
        duration: "6 min",
        thumbnail: "🎭",
        videoUrl: "https://www.youtube.com/embed/S4cNq5-kgz4",
        completed: false,
        locked: true,
      },
      {
        id: "8",
        title: "Back Rank Checkmates",
        description: "Deliver devastating checkmates on the enemy king's back rank!",
        duration: "5 min",
        thumbnail: "💀",
        videoUrl: "https://www.youtube.com/embed/S4cNq5-kgz4",
        completed: false,
        locked: true,
      },
    ],
  },
  {
    id: "endgames",
    name: "Endgame Mastery",
    icon: Crown,
    description: "Learn to convert your advantages into wins!",
    color: "from-accent to-accent/70",
    skillLevel: "advanced",
    lessons: [
      {
        id: "9",
        title: "King & Pawn Endgames",
        description: "The foundation of all endgames. Learn the key concepts!",
        duration: "8 min",
        thumbnail: "♔",
        videoUrl: "https://www.youtube.com/embed/S4cNq5-kgz4",
        completed: false,
        locked: false,
      },
      {
        id: "10",
        title: "Rook Endgames",
        description: "Rook endings are the most common! Master the Lucena and Philidor positions.",
        duration: "10 min",
        thumbnail: "♖",
        videoUrl: "https://www.youtube.com/embed/S4cNq5-kgz4",
        completed: false,
        locked: false,
      },
      {
        id: "11",
        title: "Queen vs Pawn",
        description: "Learn the techniques to stop pawns from promoting!",
        duration: "6 min",
        thumbnail: "♕",
        videoUrl: "https://www.youtube.com/embed/S4cNq5-kgz4",
        completed: false,
        locked: true,
      },
      {
        id: "12",
        title: "Checkmate Patterns",
        description: "Never miss a checkmate again! Learn the essential patterns.",
        duration: "7 min",
        thumbnail: "🏆",
        videoUrl: "https://www.youtube.com/embed/S4cNq5-kgz4",
        completed: false,
        locked: true,
      },
    ],
  },
];

const Lessons = () => {
  const [selectedLesson, setSelectedLesson] = useState<Lesson | null>(null);
  const [completedLessons, setCompletedLessons] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState("openings");

  const handleLessonClick = (lesson: Lesson) => {
    if (lesson.locked) {
      toast.info("🔒 Complete previous lessons to unlock!", {
        description: "Keep learning to access more content!",
      });
      return;
    }
    setSelectedLesson(lesson);
  };

  const markAsComplete = () => {
    if (selectedLesson && !completedLessons.includes(selectedLesson.id)) {
      setCompletedLessons([...completedLessons, selectedLesson.id]);
      toast.success("🌟 Lesson completed! Great job!", {
        description: "You're one step closer to becoming a chess master!",
      });
    }
  };

  const totalLessons = lessonCategories.reduce((acc, cat) => acc + cat.lessons.length, 0);
  const progressPercent = (completedLessons.length / totalLessons) * 100;

  const getSkillLevelColor = (level: string) => {
    switch (level) {
      case "beginner": return "bg-secondary text-secondary-foreground";
      case "intermediate": return "bg-accent text-accent-foreground";
      case "advanced": return "bg-destructive text-destructive-foreground";
      default: return "bg-muted text-muted-foreground";
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />
      
      <main className="flex-1 pt-20 md:pt-24 pb-12">
        <div className="container mx-auto px-4">
          {/* Header */}
          <motion.div
            className="text-center mb-8"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="flex items-center justify-center gap-2 mb-2">
              <BookOpen className="w-6 h-6 text-primary" />
              <Badge variant="secondary" className="text-sm">
                Video Lessons
              </Badge>
            </div>
            <h1 className="text-3xl md:text-5xl font-display font-bold text-foreground mb-2">
              Learn Chess the Fun Way! 🎓
            </h1>
            <p className="text-muted-foreground font-nunito text-lg">
              Watch interactive lessons and become a chess champion!
            </p>
          </motion.div>

          {/* Progress Bar */}
          <motion.div
            className="max-w-2xl mx-auto mb-8"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
          >
            <Card className="bg-gradient-to-r from-primary/10 to-secondary/10 border-2 border-primary/20">
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <BookOpen className="w-5 h-5 text-primary" />
                    <span className="font-display font-bold text-foreground">
                      {completedLessons.length}/{totalLessons} Lessons
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Star className="w-5 h-5 text-gold fill-gold" />
                    <span className="font-display font-bold text-gold">{completedLessons.length * 10} XP</span>
                  </div>
                </div>
                <Progress value={progressPercent} className="h-3" />
              </CardContent>
            </Card>
          </motion.div>

          {/* Video Player Modal */}
          <AnimatePresence>
            {selectedLesson && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4"
                onClick={() => setSelectedLesson(null)}
              >
                <motion.div
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.9, opacity: 0 }}
                  className="bg-card rounded-2xl overflow-hidden max-w-4xl w-full"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="relative aspect-video bg-black">
                    <iframe
                      src={selectedLesson.videoUrl}
                      title={selectedLesson.title}
                      className="w-full h-full"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                    />
                  </div>
                  <div className="p-6">
                    <h2 className="text-2xl font-display font-bold text-foreground mb-2">
                      {selectedLesson.title}
                    </h2>
                    <p className="text-muted-foreground mb-4">{selectedLesson.description}</p>
                    <div className="flex gap-3">
                      <Button
                        onClick={markAsComplete}
                        disabled={completedLessons.includes(selectedLesson.id)}
                        className="gap-2"
                      >
                        {completedLessons.includes(selectedLesson.id) ? (
                          <>
                            <CheckCircle className="w-4 h-4" />
                            Completed!
                          </>
                        ) : (
                          <>
                            <CheckCircle className="w-4 h-4" />
                            Mark as Complete
                          </>
                        )}
                      </Button>
                      <Button variant="outline" onClick={() => setSelectedLesson(null)}>
                        Close
                      </Button>
                    </div>
                  </div>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Lesson Categories */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="max-w-6xl mx-auto">
            <TabsList className="grid grid-cols-3 mb-8 h-auto p-1">
              {lessonCategories.map((category) => (
                <TabsTrigger
                  key={category.id}
                  value={category.id}
                  className="flex items-center gap-2 py-3 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
                >
                  <category.icon className="w-5 h-5" />
                  <span className="hidden sm:inline">{category.name}</span>
                </TabsTrigger>
              ))}
            </TabsList>

            {lessonCategories.map((category) => (
              <TabsContent key={category.id} value={category.id}>
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  {/* Category Header */}
                  <Card className={`mb-8 bg-gradient-to-r ${category.color} text-white overflow-hidden`}>
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className="w-16 h-16 rounded-2xl bg-white/20 flex items-center justify-center">
                            <category.icon className="w-8 h-8" />
                          </div>
                          <div>
                            <Badge className={`mb-1 ${getSkillLevelColor(category.skillLevel)}`}>
                              {category.skillLevel.charAt(0).toUpperCase() + category.skillLevel.slice(1)}
                            </Badge>
                            <h2 className="text-2xl font-display font-bold">{category.name}</h2>
                            <p className="text-white/80">{category.description}</p>
                          </div>
                        </div>
                        <div className="hidden md:flex items-center gap-2">
                          <Users className="w-5 h-5" />
                          <span className="text-sm">{Math.floor(Math.random() * 5000 + 1000)} students</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Lessons Grid */}
                  <div className="grid md:grid-cols-2 gap-6">
                    {category.lessons.map((lesson, index) => {
                      const isCompleted = completedLessons.includes(lesson.id);
                      
                      return (
                        <motion.div
                          key={lesson.id}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.1 }}
                        >
                          <Card
                            className={`cursor-pointer transition-all hover:shadow-lg ${
                              lesson.locked ? "opacity-60" : ""
                            } ${isCompleted ? "ring-2 ring-secondary" : ""}`}
                            onClick={() => handleLessonClick(lesson)}
                          >
                            <CardContent className="p-0">
                              <div className="flex">
                                {/* Thumbnail */}
                                <div className={`w-24 sm:w-32 bg-gradient-to-br ${category.color} flex items-center justify-center text-4xl`}>
                                  {lesson.locked ? (
                                    <Lock className="w-8 h-8 text-white/60" />
                                  ) : (
                                    <span>{lesson.thumbnail}</span>
                                  )}
                                </div>
                                
                                {/* Content */}
                                <div className="flex-1 p-4">
                                  <div className="flex items-start justify-between gap-2">
                                    <div className="flex-1">
                                      <h3 className="font-display font-bold text-foreground mb-1 line-clamp-1">
                                        {lesson.title}
                                      </h3>
                                      <p className="text-sm text-muted-foreground line-clamp-2 mb-2">
                                        {lesson.description}
                                      </p>
                                      <div className="flex items-center gap-3 text-xs text-muted-foreground">
                                        <span className="flex items-center gap-1">
                                          <Clock className="w-3 h-3" />
                                          {lesson.duration}
                                        </span>
                                        {isCompleted && (
                                          <span className="flex items-center gap-1 text-secondary">
                                            <CheckCircle className="w-3 h-3" />
                                            Completed
                                          </span>
                                        )}
                                      </div>
                                    </div>
                                    
                                    {/* Play Button */}
                                    <Button
                                      size="icon"
                                      variant={lesson.locked ? "outline" : "default"}
                                      className="shrink-0"
                                      disabled={lesson.locked}
                                    >
                                      {lesson.locked ? (
                                        <Lock className="w-4 h-4" />
                                      ) : (
                                        <Play className="w-4 h-4" />
                                      )}
                                    </Button>
                                  </div>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        </motion.div>
                      );
                    })}
                  </div>
                </motion.div>
              </TabsContent>
            ))}
          </Tabs>

          {/* Bottom CTA */}
          <motion.div
            className="mt-12 text-center"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <Card className="max-w-2xl mx-auto bg-gradient-to-r from-gold/20 to-gold-dark/20 border-2 border-gold/30">
              <CardContent className="p-6">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <Crown className="w-6 h-6 text-gold" />
                  <span className="font-display font-bold text-gold">Gold Membership</span>
                </div>
                <h3 className="text-xl font-display font-bold text-foreground mb-2">
                  Unlock All 150+ Lessons!
                </h3>
                <p className="text-muted-foreground mb-4">
                  Get unlimited access to all lessons, puzzles, and exclusive content.
                </p>
                <Button className="bg-gold hover:bg-gold-dark text-gold-foreground gap-2">
                  Upgrade to Gold
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Lessons;
