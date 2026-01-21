import { useState } from "react";
import { motion } from "framer-motion";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Phone, Mail, MessageCircle, MapPin } from "lucide-react";
import { toast } from "sonner";

const contactMethods = [
  {
    icon: Phone,
    title: "Phone",
    value: "+1 (555) 123-4567",
    link: "tel:+15551234567",
    color: "bg-green-100 text-green-600",
  },
  {
    icon: MessageCircle,
    title: "WhatsApp",
    value: "Chat with us",
    link: "https://wa.me/15551234567",
    color: "bg-emerald-100 text-emerald-600",
  },
  {
    icon: Mail,
    title: "Email",
    value: "hello@fiverkids.com",
    link: "mailto:hello@fiverkids.com",
    color: "bg-blue-100 text-blue-600",
  },
  {
    icon: MapPin,
    title: "Location",
    value: "Online Classes Worldwide",
    link: "#",
    color: "bg-purple-100 text-purple-600",
  },
];

const Contact = () => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    message: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    // Simulate form submission
    await new Promise((resolve) => setTimeout(resolve, 1000));

    toast.success("Message sent! We'll get back to you soon.");
    setFormData({ name: "", email: "", phone: "", message: "" });
    setIsSubmitting(false);
  };

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
                Contact Us
              </h1>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                Have questions about our chess classes? We'd love to hear from you. 
                Reach out and we'll respond as soon as possible.
              </p>
            </motion.div>
          </div>
        </section>

        {/* Contact Methods */}
        <section className="py-12 bg-muted/50">
          <div className="container px-4 mx-auto">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto">
              {contactMethods.map((method, index) => (
                <motion.a
                  key={method.title}
                  href={method.link}
                  target={method.link.startsWith("http") ? "_blank" : undefined}
                  rel={method.link.startsWith("http") ? "noopener noreferrer" : undefined}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="block"
                >
                  <Card className="h-full text-center hover:shadow-lg transition-shadow cursor-pointer hover:border-accent">
                    <CardContent className="p-4">
                      <div className={`w-12 h-12 rounded-full ${method.color} flex items-center justify-center mx-auto mb-3`}>
                        <method.icon className="w-5 h-5" />
                      </div>
                      <h3 className="font-semibold text-foreground mb-1">
                        {method.title}
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        {method.value}
                      </p>
                    </CardContent>
                  </Card>
                </motion.a>
              ))}
            </div>
          </div>
        </section>

        {/* Contact Form */}
        <section className="py-16 md:py-24">
          <div className="container px-4 mx-auto">
            <div className="max-w-xl mx-auto">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
                <Card>
                  <CardHeader>
                    <CardTitle className="text-center">Send us a Message</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-4">
                      <div className="grid md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="name">Your Name</Label>
                          <Input
                            id="name"
                            placeholder="John Doe"
                            value={formData.name}
                            onChange={(e) =>
                              setFormData({ ...formData, name: e.target.value })
                            }
                            required
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="email">Email Address</Label>
                          <Input
                            id="email"
                            type="email"
                            placeholder="john@example.com"
                            value={formData.email}
                            onChange={(e) =>
                              setFormData({ ...formData, email: e.target.value })
                            }
                            required
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="phone">Phone Number (Optional)</Label>
                        <Input
                          id="phone"
                          type="tel"
                          placeholder="+1 (555) 123-4567"
                          value={formData.phone}
                          onChange={(e) =>
                            setFormData({ ...formData, phone: e.target.value })
                          }
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="message">Your Message</Label>
                        <Textarea
                          id="message"
                          placeholder="Tell us about your child and what you're looking for..."
                          rows={4}
                          value={formData.message}
                          onChange={(e) =>
                            setFormData({ ...formData, message: e.target.value })
                          }
                          required
                        />
                      </div>

                      <Button
                        type="submit"
                        className="w-full"
                        disabled={isSubmitting}
                      >
                        {isSubmitting ? "Sending..." : "Send Message"}
                      </Button>
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

export default Contact;
