import ThreeBackground from "@/components/Threebackground";
import Hero from "../components/landing/Hero";
import Navbar from "../components/Navbar";
import HowItWorks from "@/components/landing/HowItWorks";
import Testimonials from "@/components/landing/Testimonial";
import Footer from "@/components/Footer";

const Landing = () => {
  return (
    <main>
        <ThreeBackground />
        <Navbar />
      <Hero />
      <HowItWorks />
      <Testimonials />
      <Footer />
    </main>
  );
};

export default Landing;