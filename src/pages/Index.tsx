import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import HeroSection from "@/components/sections/HeroSection";
import StatsSection from "@/components/sections/StatsSection";
import FeaturesSection from "@/components/sections/FeaturesSection";
import OurProgramsSection from "@/components/sections/OurProgramsSection";
import HowItWorksSection from "@/components/sections/HowItWorksSection";
import WhyKidsLoveSection from "@/components/sections/WhyKidsLoveSection";
import FAQSection from "@/components/sections/FAQSection";
import GoldMembershipSection from "@/components/sections/GoldMembershipSection";

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main>
        <HeroSection />
        <StatsSection />
        <OurProgramsSection />
        <FeaturesSection />
        <HowItWorksSection />
        <WhyKidsLoveSection />
        <FAQSection />
        <GoldMembershipSection />
      </main>
      <Footer />
    </div>
  );
};

export default Index;
