import { useState } from "react";
import { motion } from "framer-motion";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format } from "date-fns";
import { Calendar as CalendarIcon, MessageCircle, Check, Gift } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const benefits = [
  "Free 30-minute assessment class",
  "Understand your child's current level",
  "Get personalized learning recommendations",
  "Meet our expert coaches",
  "No obligation to continue",
];

const ageGroups = ["4 - 5 years", "6 - 9 years", "10 - 12 years", "12 - 15 years", "15 - 20 years"];
const timeSlots = ["9:00 AM", "10:00 AM", "11:00 AM", "2:00 PM", "3:00 PM", "4:00 PM", "5:00 PM"];

const DemoClass = () => {
  const [date, setDate] = useState<Date>();
  const [formData, setFormData] = useState({
    parentName: "",
    childName: "",
    email: "",
    phone: "",
    ageGroup: "",
    timeSlot: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!date) {
      toast.error("Please select a date for your demo class");
      return;
    }

    setIsSubmitting(true);
    await new Promise((resolve) => setTimeout(resolve, 1000));

    toast.success("Demo class booked! Check your email for confirmation.");
    setFormData({
      parentName: "",
      childName: "",
      email: "",
      phone: "",
      ageGroup: "",
      timeSlot: "",
    });
    setDate(undefined);
    setIsSubmitting(false);
  };

  const openWhatsApp = () => {
    const message = encodeURIComponent(
      "Hi! I'm interested in booking a free demo chess class for my child."
    );
    window.open(`https://wa.me/15551234567?text=${message}`, "_blank");
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main>
        {/* Hero Section */}
        <section className="py-16 md:py-24 bg-gradient-to-b from-primary/10 to-background">
          <div className="container px-4 mx-auto">
            <div className="grid lg:grid-cols-2 gap-12 items-center max-w-6xl mx-auto">
              <motion.div
                initial={{ opacity: 0, x: -30 }}
                animate={{ opacity: 1, x: 0 }}
              >
                <div className="inline-flex items-center gap-2 bg-primary/10 rounded-full px-4 py-1.5 mb-6">
                  <Gift className="w-4 h-4 text-primary" />
                  <span className="text-sm font-medium text-primary">Free Trial Class</span>
                </div>

                <h1 className="text-4xl md:text-5xl font-display font-bold text-foreground mb-4">
                  Book Your Free Demo Class
                </h1>
                <p className="text-lg text-muted-foreground mb-8">
                  Experience our teaching methodology with a complimentary 30-minute 
                  assessment class. No payment required, no obligation to continue.
                </p>

                <ul className="space-y-3 mb-8">
                  {benefits.map((benefit) => (
                    <li key={benefit} className="flex items-center gap-3">
                      <div className="w-5 h-5 rounded-full bg-secondary/20 flex items-center justify-center flex-shrink-0">
                        <Check className="w-3 h-3 text-secondary" />
                      </div>
                      <span className="text-foreground">{benefit}</span>
                    </li>
                  ))}
                </ul>

                <Button
                  onClick={openWhatsApp}
                  variant="outline"
                  className="border-green-500 text-green-600 hover:bg-green-50"
                >
                  <MessageCircle className="w-4 h-4 mr-2" />
                  Book via WhatsApp
                </Button>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, x: 30 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 }}
              >
                <Card className="shadow-xl">
                  <CardHeader>
                    <CardTitle className="text-center">Schedule Your Demo</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-4">
                      <div className="grid md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="parentName">Parent's Name</Label>
                          <Input
                            id="parentName"
                            placeholder="Your name"
                            value={formData.parentName}
                            onChange={(e) =>
                              setFormData({ ...formData, parentName: e.target.value })
                            }
                            required
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="childName">Child's Name</Label>
                          <Input
                            id="childName"
                            placeholder="Child's name"
                            value={formData.childName}
                            onChange={(e) =>
                              setFormData({ ...formData, childName: e.target.value })
                            }
                            required
                          />
                        </div>
                      </div>

                      <div className="grid md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="email">Email</Label>
                          <Input
                            id="email"
                            type="email"
                            placeholder="your@email.com"
                            value={formData.email}
                            onChange={(e) =>
                              setFormData({ ...formData, email: e.target.value })
                            }
                            required
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="phone">Phone</Label>
                          <Input
                            id="phone"
                            type="tel"
                            placeholder="+1 (555) 123-4567"
                            value={formData.phone}
                            onChange={(e) =>
                              setFormData({ ...formData, phone: e.target.value })
                            }
                            required
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label>Child's Age Group</Label>
                        <Select
                          value={formData.ageGroup}
                          onValueChange={(value) =>
                            setFormData({ ...formData, ageGroup: value })
                          }
                        >
                          <SelectTrigger className="bg-background">
                            <SelectValue placeholder="Select age group" />
                          </SelectTrigger>
                          <SelectContent className="bg-background z-50">
                            {ageGroups.map((age) => (
                              <SelectItem key={age} value={age}>
                                {age}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="grid md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Preferred Date</Label>
                          <Popover>
                            <PopoverTrigger asChild>
                              <Button
                                variant="outline"
                                className={cn(
                                  "w-full justify-start text-left font-normal",
                                  !date && "text-muted-foreground"
                                )}
                              >
                                <CalendarIcon className="mr-2 h-4 w-4" />
                                {date ? format(date, "PPP") : "Pick a date"}
                              </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0 bg-background z-50">
                              <Calendar
                                mode="single"
                                selected={date}
                                onSelect={setDate}
                                disabled={(date) => date < new Date()}
                                initialFocus
                              />
                            </PopoverContent>
                          </Popover>
                        </div>

                        <div className="space-y-2">
                          <Label>Preferred Time</Label>
                          <Select
                            value={formData.timeSlot}
                            onValueChange={(value) =>
                              setFormData({ ...formData, timeSlot: value })
                            }
                          >
                            <SelectTrigger className="bg-background">
                              <SelectValue placeholder="Select time" />
                            </SelectTrigger>
                            <SelectContent className="bg-background z-50">
                              {timeSlots.map((time) => (
                                <SelectItem key={time} value={time}>
                                  {time}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      <Button
                        type="submit"
                        className="w-full"
                        size="lg"
                        disabled={isSubmitting}
                      >
                        {isSubmitting ? "Booking..." : "Book Free Demo Class"}
                      </Button>

                      <p className="text-xs text-center text-muted-foreground">
                        By booking, you agree to our terms and privacy policy.
                      </p>
                    </form>
                  </CardContent>
                </Card>
              </motion.div>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default DemoClass;
