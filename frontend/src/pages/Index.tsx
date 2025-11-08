import { Navbar } from "@/components/Navbar";
import { Hero } from "@/components/Hero";
import { Features } from "@/components/Features";
import { AppPreview } from "@/components/AppPreview";
import { Footer } from "@/components/Footer";

const Index = () => {
  return (
    <div className="smooth-scroll">
      <Navbar />
      <Hero />
      <Features />
      <AppPreview />
      <Footer />
    </div>
  );
};

export default Index;
