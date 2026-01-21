import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import {
  BookOpen,
  Users,
  Calendar,
  Clock,
  Video,
  Trophy,
  Target,
  Lightbulb,
  Brain,
  Award,
  CheckCircle2,
  Gift,
  Phone,
  Mail,
  MessageCircle,
  ChevronRight,
  Star,
  Sparkles,
  GraduationCap,
  BarChart3,
} from "lucide-react";
import { Link } from "react-router-dom";

const curriculumMonths = [
  {
    month: 1,
    title: "Understanding",
    topics: ["Chessboard basics", "Piece movement", "Rules", "Technique"],
    icon: BookOpen,
    color: "bg-primary",
  },
  {
    month: 2,
    title: "Learning",
    topics: ["Opening strategies", "Tactical Motifs", "Basic Tactical Vision"],
    icon: Lightbulb,
    color: "bg-secondary",
  },
  {
    month: 3,
    title: "Intuition",
    topics: ["Tactical patterns", "Forks", "Pins", "Skewers"],
    icon: Brain,
    color: "bg-accent",
  },
  {
    month: 4,
    title: "Analyzing",
    topics: ["Endgame principles", "Strategic planning"],
    icon: Target,
    color: "bg-gold",
  },
  {
    month: 5,
    title: "Tournament Prep",
    topics: ["Chess etiquette", "Time management", "Tournament rules"],
    icon: Clock,
    color: "bg-primary",
  },
  {
    month: 6,
    title: "Competition",
    topics: ["Chess Tournament", "Awards Ceremony", "Certificate Distribution"],
    icon: Trophy,
    color: "bg-secondary",
  },
];

const learningSteps = [
  { num: 1, title: "Learning Theory", icon: BookOpen },
  { num: 2, title: "Putting Concepts into Action", icon: Target },
  { num: 3, title: "Sharpening Thinking Skills", icon: Brain },
  { num: 4, title: "Using Strategies in Real Play", icon: Lightbulb },
  { num: 5, title: "Interactive Play Sessions", icon: Users },
  { num: 6, title: "Game Review & Reflection", icon: BarChart3 },
  { num: 7, title: "Chess Tournaments", icon: Trophy },
];

const programDetails = [
  { icon: Calendar, label: "Duration", value: "6 months" },
  { icon: Video, label: "Mode", value: "Online (via Zoom)" },
  { icon: Clock, label: "Frequency", value: "1 session per week" },
  { icon: Users, label: "Session Duration", value: "50 minutes" },
];

const specialOffers = [
  { title: "Refer a Friend", desc: "Both students pay ₹1299/month", savings: "₹100 off each" },
  { title: "Sibling Discount", desc: "₹1349 per sibling per month", savings: "₹50 off each" },
  { title: "Neighbor's Discount", desc: "₹1349 per student per month", savings: "₹50 off" },
];

const learningOutcomes = [
  "Master the fundamentals of chess, including piece movement, opening strategies, and endgames.",
  "Develop problem-solving, focus, and decision-making skills.",
  "Participate in mini-tournaments to test their learning and compete in a friendly environment.",
];

const whyChooseUs = [
  { icon: Video, text: "Interactive Learning: Live sessions with certified chess coaches on Zoom" },
  { icon: BookOpen, text: "Comprehensive Curriculum: Tailored for beginners with progression tracking" },
  { icon: Users, text: "Inclusive and Scalable: A uniform curriculum for thousands of students" },
  { icon: Trophy, text: "End-of-Program Mini-Tournament: Students showcase their skills" },
];

const implementationPlan = [
  {
    title: "Centralized Online Delivery",
    points: ["Students from all schools attend simultaneously via Zoom", "Each session accommodates 6 students"],
  },
  {
    title: "Batch Organization",
    points: ["Batches of 6 students divided by grade or skill levels"],
  },
  {
    title: "Tracking and Engagement",
    points: ["Attendance, progress, and participation monitored through automated tools"],
  },
  {
    title: "End-of-Program Recognition",
    points: ["Certificates of Achievement for all students", "Awards for mini tournament participants"],
  },
];

const Program = () => {
  const openWhatsApp = () => {
    window.open("https://wa.me/919663456195?text=Hi! I'm interested in the √64 Chess In School program.", "_blank");
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main>
        {/* Hero Section */}
        <section className="relative min-h-[70vh] overflow-hidden pt-24 pb-16 hero-gradient">
          <div className="container mx-auto px-4 relative z-10">
            <motion.div
              className="max-w-4xl mx-auto text-center"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <Badge className="mb-6 bg-gold text-foreground px-6 py-2 text-lg font-display">
                √64 Project Chess In School
              </Badge>
              <h1 className="text-4xl md:text-6xl font-display font-bold text-white mb-6">
                Empowering Young Minds Through Chess
                <br />
                <span className="text-gold">— One Move at a Time!</span>
              </h1>
              <p className="text-xl text-white/90 mb-8 max-w-2xl mx-auto font-nunito">
                A comprehensive 6-month online chess program designed to develop cognitive skills, strategic thinking, and a love for the game.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button variant="hero" size="xl" asChild>
                  <Link to="/demo">
                    <GraduationCap className="w-5 h-5" />
                    Book Free Demo Class
                  </Link>
                </Button>
                <Button variant="heroSecondary" size="xl" onClick={openWhatsApp}>
                  <MessageCircle className="w-5 h-5" />
                  WhatsApp Us
                </Button>
              </div>
            </motion.div>
          </div>
          
          {/* Grass hill */}
          <div className="absolute bottom-0 left-0 right-0">
            <svg viewBox="0 0 1440 100" className="w-full h-16 md:h-24" preserveAspectRatio="none">
              <path d="M0,50 C360,100 720,20 1080,60 C1260,80 1380,40 1440,50 L1440,100 L0,100 Z" fill="hsl(var(--grass))" />
            </svg>
          </div>
        </section>

        {/* Learning Steps */}
        <section className="py-16 bg-muted">
          <div className="container mx-auto px-4">
            <motion.h2
              className="text-3xl md:text-4xl font-display font-bold text-center mb-12"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
            >
              Our 7-Step Learning Journey
            </motion.h2>
            <div className="flex flex-wrap justify-center gap-4">
              {learningSteps.map((step, index) => (
                <motion.div
                  key={step.num}
                  className="flex items-center gap-3 bg-card rounded-2xl px-5 py-4 shadow-md"
                  initial={{ opacity: 0, scale: 0.9 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                >
                  <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-bold">
                    {step.num}
                  </div>
                  <step.icon className="w-5 h-5 text-primary" />
                  <span className="font-nunito font-semibold text-sm">{step.title}</span>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Program Details */}
        <section className="py-16 bg-card">
          <div className="container mx-auto px-4">
            <motion.h2
              className="text-3xl md:text-4xl font-display font-bold text-center mb-4"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
            >
              Program Details
            </motion.h2>
            <motion.p
              className="text-muted-foreground text-center mb-12 max-w-2xl mx-auto"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
            >
              Everything you need to know about our chess learning program
            </motion.p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-4xl mx-auto">
              {programDetails.map((item, index) => (
                <motion.div
                  key={item.label}
                  className="text-center p-6 bg-muted rounded-2xl"
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                >
                  <item.icon className="w-10 h-10 text-primary mx-auto mb-4" />
                  <p className="text-2xl font-display font-bold text-foreground">{item.value}</p>
                  <p className="text-sm text-muted-foreground">{item.label}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Curriculum */}
        <section className="py-16 bg-muted">
          <div className="container mx-auto px-4">
            <motion.h2
              className="text-3xl md:text-4xl font-display font-bold text-center mb-4"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
            >
              6-Month Systematic Curriculum
            </motion.h2>
            <motion.p
              className="text-muted-foreground text-center mb-12 max-w-2xl mx-auto italic"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
            >
              "Repetition is the mother of learning, the father of action, which makes it the architect of accomplishment" — Zig Ziglar
            </motion.p>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
              {curriculumMonths.map((month, index) => (
                <motion.div
                  key={month.month}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                >
                  <Card className="h-full hover:shadow-lg transition-shadow">
                    <CardHeader className="pb-2">
                      <div className="flex items-center gap-3">
                        <div className={`w-12 h-12 rounded-xl ${month.color} flex items-center justify-center`}>
                          <month.icon className="w-6 h-6 text-white" />
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Month {month.month}</p>
                          <CardTitle className="text-xl">{month.title}</CardTitle>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <ul className="space-y-2">
                        {month.topics.map((topic) => (
                          <li key={topic} className="flex items-center gap-2 text-muted-foreground">
                            <CheckCircle2 className="w-4 h-4 text-secondary flex-shrink-0" />
                            {topic}
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Fee Structure */}
        <section className="py-16 bg-card">
          <div className="container mx-auto px-4">
            <motion.h2
              className="text-3xl md:text-4xl font-display font-bold text-center mb-4"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
            >
              Fee Structure
            </motion.h2>
            <motion.p
              className="text-muted-foreground text-center mb-12 max-w-2xl mx-auto italic"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
            >
              "Education is not a cost—it's the most powerful investment in our future" — John Dewey
            </motion.p>
            
            <div className="max-w-4xl mx-auto">
              {/* Main Fee Card */}
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
              >
                <Card className="relative overflow-hidden border-2 border-primary mb-8">
                  <div className="absolute top-0 right-0 bg-primary text-primary-foreground px-4 py-1 rounded-bl-xl font-bold text-sm">
                    POPULAR
                  </div>
                  <CardHeader className="text-center pb-2">
                    <CardTitle className="text-2xl">Monthly Fee</CardTitle>
                  </CardHeader>
                  <CardContent className="text-center">
                    <p className="text-5xl font-display font-bold text-primary mb-2">₹1,399</p>
                    <p className="text-muted-foreground">per student per month</p>
                    <div className="mt-6 p-4 bg-gold/10 rounded-xl">
                      <p className="font-bold text-foreground mb-2">🎉 5-Month Package Special!</p>
                      <p className="text-muted-foreground">Pay ₹5,596 for 4 months upfront</p>
                      <p className="text-muted-foreground">Get the 5th month at <span className="text-primary font-bold">50% off</span></p>
                      <p className="text-xl font-display font-bold text-secondary mt-2">Total: ₹6,295 (Save ₹700!)</p>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>

              {/* Special Offers */}
              <h3 className="text-2xl font-display font-bold text-center mb-6">Special Offers</h3>
              <div className="grid md:grid-cols-3 gap-4">
                {specialOffers.map((offer, index) => (
                  <motion.div
                    key={offer.title}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <Card className="h-full text-center hover:shadow-lg transition-shadow">
                      <CardContent className="pt-6">
                        <Gift className="w-10 h-10 text-gold mx-auto mb-4" />
                        <h4 className="font-display font-bold text-lg mb-2">{offer.title}</h4>
                        <p className="text-muted-foreground text-sm mb-2">{offer.desc}</p>
                        <Badge variant="secondary">{offer.savings}</Badge>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Learning Outcomes */}
        <section className="py-16 bg-muted">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto">
              <motion.h2
                className="text-3xl md:text-4xl font-display font-bold text-center mb-12"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
              >
                Learning Outcomes
              </motion.h2>
              <div className="space-y-4">
                {learningOutcomes.map((outcome, index) => (
                  <motion.div
                    key={index}
                    className="flex items-start gap-4 p-4 bg-card rounded-xl"
                    initial={{ opacity: 0, x: -20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center flex-shrink-0">
                      <CheckCircle2 className="w-5 h-5 text-secondary-foreground" />
                    </div>
                    <p className="text-foreground font-nunito">{outcome}</p>
                  </motion.div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Why Choose Us */}
        <section className="py-16 bg-card">
          <div className="container mx-auto px-4">
            <motion.h2
              className="text-3xl md:text-4xl font-display font-bold text-center mb-4"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
            >
              Why Choose Us?
            </motion.h2>
            <motion.p
              className="text-muted-foreground text-center mb-12 max-w-2xl mx-auto italic"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
            >
              "The best teachers are those who show you where to look but don't tell you what to see." — Alexandra K. Trenfor
            </motion.p>
            <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
              {whyChooseUs.map((item, index) => (
                <motion.div
                  key={index}
                  className="flex items-start gap-4 p-6 bg-muted rounded-2xl"
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                >
                  <div className="w-12 h-12 rounded-xl bg-primary flex items-center justify-center flex-shrink-0">
                    <item.icon className="w-6 h-6 text-primary-foreground" />
                  </div>
                  <p className="text-foreground font-nunito leading-relaxed">{item.text}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Implementation Plan */}
        <section className="py-16 bg-muted">
          <div className="container mx-auto px-4">
            <motion.h2
              className="text-3xl md:text-4xl font-display font-bold text-center mb-4"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
            >
              Implementation Plan
            </motion.h2>
            <motion.p
              className="text-muted-foreground text-center mb-12 max-w-2xl mx-auto italic"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
            >
              "Practice does not make perfect. Only perfect practice makes perfect." — Vince Lombardi
            </motion.p>
            <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
              {implementationPlan.map((plan, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                >
                  <Card className="h-full">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <span className="w-8 h-8 rounded-full bg-accent text-accent-foreground flex items-center justify-center text-sm font-bold">
                          {index + 1}
                        </span>
                        {plan.title}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ul className="space-y-2">
                        {plan.points.map((point, i) => (
                          <li key={i} className="flex items-start gap-2 text-muted-foreground">
                            <ChevronRight className="w-4 h-4 text-primary mt-1 flex-shrink-0" />
                            {point}
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Progress Tracking */}
        <section className="py-16 bg-card">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto">
              <motion.div
                className="bg-gradient-to-r from-primary/10 to-secondary/10 rounded-3xl p-8 md:p-12"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
              >
                <div className="flex flex-col md:flex-row items-center gap-8">
                  <div className="flex-1">
                    <h2 className="text-3xl font-display font-bold mb-4">
                      <BarChart3 className="inline w-8 h-8 text-primary mr-2" />
                      Quantitative Progress Tracking
                    </h2>
                    <p className="text-muted-foreground mb-4">
                      Visualize your progress using graphs on Lichess. You'll see incredible improvement within your first games!
                    </p>
                    <h3 className="font-display font-bold text-lg mb-3">Benefits:</h3>
                    <ul className="space-y-2">
                      <li className="flex items-center gap-2">
                        <Star className="w-5 h-5 text-gold" />
                        <span><strong>Motivation:</strong> Visual progress inspires consistency</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <Star className="w-5 h-5 text-gold" />
                        <span><strong>Transparency:</strong> Parents gain clear view of development</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <Star className="w-5 h-5 text-gold" />
                        <span><strong>Feedback:</strong> Coaches tailor lessons to specific needs</span>
                      </li>
                    </ul>
                  </div>
                  <div className="w-full md:w-auto">
                    <div className="bg-card rounded-2xl p-6 shadow-lg">
                      <div className="text-center">
                        <Sparkles className="w-16 h-16 text-gold mx-auto mb-4" />
                        <p className="font-display font-bold text-2xl text-foreground">Track Every Move</p>
                        <p className="text-muted-foreground">Real-time progress analytics</p>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        </section>

        {/* Contact CTA */}
        <section className="py-16 bg-primary">
          <div className="container mx-auto px-4">
            <motion.div
              className="max-w-4xl mx-auto text-center"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
            >
              <h2 className="text-3xl md:text-4xl font-display font-bold text-primary-foreground mb-6">
                Ready to Start Your Chess Journey?
              </h2>
              <p className="text-primary-foreground/90 text-lg mb-8">
                Contact us today to enroll your child in our chess program!
              </p>
              <div className="flex flex-col sm:flex-row gap-6 justify-center items-center mb-8">
                <a href="tel:+919663456195" className="flex items-center gap-2 text-primary-foreground hover:underline">
                  <Phone className="w-5 h-5" />
                  +91-9663456195
                </a>
                <a href="mailto:chessraghav2500@gmail.com" className="flex items-center gap-2 text-primary-foreground hover:underline">
                  <Mail className="w-5 h-5" />
                  chessraghav2500@gmail.com
                </a>
              </div>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button variant="heroSecondary" size="xl" asChild>
                  <Link to="/demo">
                    <GraduationCap className="w-5 h-5" />
                    Book Free Demo Class
                  </Link>
                </Button>
                <Button 
                  size="xl" 
                  className="bg-secondary hover:bg-secondary/90 text-secondary-foreground"
                  onClick={openWhatsApp}
                >
                  <MessageCircle className="w-5 h-5" />
                  WhatsApp Us
                </Button>
              </div>
            </motion.div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default Program;
