import { motion } from "framer-motion";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const faqs = [
  {
    question: "How do your online Classes work?",
    answer: "As a first step, we do a free assessment class for your child and understand their background and strengths and recommend a program. Next step is Coach Matching. We assign you a coach and if you are unhappy with the experience, we switch the coaches until you are 100% satisfied! As your child learns and matures, we will invite you to join our free tournaments where he can play other kids of his age/level and improve his game.",
  },
  {
    question: "How do your online Classes work?",
    answer: "Our online classes are conducted via video call with interactive screen sharing. The coach guides your child through lessons, puzzles, and practice games in real-time.",
  },
  {
    question: "Can a 5 year old learn?",
    answer: "5 years is the perfect age to start kids on as the brain is developing, and greatly contributes to helping kids boost their IQ and improve their focus. We have taught 100s of 5 year olds and are so confident that they will be able to learn the game that we offer 100% money back guarantee, on any remaining classes. Oh and 5 year olds are capable of a lot of things. Don't underestimate them ;)",
  },
  {
    question: "Do you provide make up classes?",
    answer: "Yes, we do provide make up classes. If we are not unable to schedule the make up class, we will provide a refund. We also allow for 1 last minute health emergency cancellation, other last minute requests will be treated as a missed class.",
  },
];

const FAQSection = () => {
  return (
    <section className="py-16 md:py-24 bg-background">
      <div className="container px-4 mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <h2 className="text-3xl md:text-4xl font-display font-bold text-foreground">
            Frequently Ask Question
          </h2>
        </motion.div>

        <div className="grid lg:grid-cols-2 gap-8 lg:gap-16 max-w-6xl mx-auto items-center">
          {/* Illustration */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="relative hidden lg:block"
          >
            <div className="relative">
              {/* Question mark illustration - simplified with CSS */}
              <div className="relative w-64 h-80 mx-auto">
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-[12rem] text-accent/30 font-bold">?</span>
                </div>
                {/* Chat bubbles */}
                <div className="absolute top-8 right-4 bg-white rounded-full p-3 shadow-lg">
                  <div className="flex gap-1">
                    <span className="w-2 h-2 bg-accent rounded-full" />
                    <span className="w-2 h-2 bg-accent rounded-full" />
                    <span className="w-2 h-2 bg-accent rounded-full" />
                  </div>
                </div>
                <div className="absolute bottom-20 right-0 bg-white rounded-full p-2 shadow-lg">
                  <div className="flex gap-0.5">
                    <span className="w-1.5 h-1.5 bg-muted-foreground/40 rounded-full" />
                    <span className="w-1.5 h-1.5 bg-muted-foreground/40 rounded-full" />
                  </div>
                </div>
                {/* Checkmark */}
                <div className="absolute bottom-4 left-8 w-8 h-8 rounded-full border-2 border-accent flex items-center justify-center">
                  <svg className="w-4 h-4 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
              </div>
            </div>
          </motion.div>

          {/* FAQ Accordion */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
          >
            <Accordion type="single" collapsible className="space-y-3">
              {faqs.map((faq, index) => (
                <AccordionItem
                  key={index}
                  value={`item-${index}`}
                  className="border border-border rounded-xl px-4 bg-card data-[state=open]:border-accent"
                >
                  <AccordionTrigger className="text-left font-display font-semibold text-foreground hover:no-underline py-4">
                    {faq.question}
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground pb-4 leading-relaxed">
                    {faq.answer}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default FAQSection;
