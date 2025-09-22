import { Button } from "@/components/ui/button";
import Link from "next/link";

const Hero = () => {
  return (
    <section className="relative h-screen flex items-center justify-center overflow-hidden">
      {/* Background Image */}
      <div 
        className="absolute inset-0 bg-cover bg-center bg-no-repeat parallax-bg"
        style={{ backgroundImage: "url('/hero-salon.jpg')" }}
      />
      <div className="absolute inset-0 bg-black/30 w-screen h-screen bg-center "/>
      {/* Overlay */}
      <div className="absolute inset-0 luxury-backdrop" />
      
      {/* Content */}
      <div className="relative z-10 text-center text-luxury-light max-w-4xl mx-auto px-4">
        <h1 className="font-heading text-5xl md:text-7xl font-bold mb-6 luxury-text-shadow fade-in">
          Experience <span className="gradient-white-to-gold">Luxury</span>
          <br />
          <span className="text-luxury-gold">Beyond 
            <span className="gradient-gold-to-white ml-2">Beauty</span>
          </span>
        </h1>
        
        <p className="text-xl md:text-2xl mb-8 font-light fade-in-delay-1">
          Unisex Salon for the Modern Gentleman & Elegant Woman
        </p>
        
        <div className="fade-in-delay-2">
          <Link href="/appointment">
            <Button variant="hero" size="xl" className="px-12 cursor-pointer">
              Book Appointment
            </Button>
          </Link>
        </div>
      </div>
      
      {/* Scroll Indicator */}
      <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 animate-bounce">
        <div className="w-6 h-10 border-2 border-luxury-light rounded-full flex justify-center">
          <div className="w-1 h-3 bg-luxury-light rounded-full mt-2 animate-pulse" />
        </div>
      </div>
    </section>
  );
};

export default Hero;