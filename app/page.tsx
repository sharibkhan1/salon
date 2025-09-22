import Hero from "@/component/sections/Hero";
import About from "@/component/sections/About";
import Gallery from "@/component/sections/Gallery";
import Testimonials from "@/component/sections/Testimonials";
import { Footer } from "@/component/sections/Footer";
import { CTASection } from "@/component/sections/CallToAction";
import { ServicesSection } from "@/component/sections/OurService";

const Home = () => {
  return (
    <div className="min-h-screen">
      <main>
       <Hero />
         <About />
         <ServicesSection/>
        <Gallery />
        <Testimonials />
        <CTASection />
      </main>
      <Footer />
    </div>
  );
};

export default Home;