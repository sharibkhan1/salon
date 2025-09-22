"use client";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";

export const CTASection = () => {
  const navigate = useRouter();

  return (
    <section className="py-20 lg:py-32 bg-foreground text-background relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-r from-foreground via-foreground/95 to-foreground"></div>
      
      {/* Decorative elements */}
      <div className="absolute top-20 left-20 w-32 h-32 bg-primary rounded-full opacity-10 luxury-glow"></div>
      <div className="absolute bottom-20 right-20 w-24 h-24 bg-accent rounded-full opacity-15 luxury-glow"></div>
      <div className="absolute top-1/2 left-1/4 w-16 h-16 bg-primary rounded-full opacity-5"></div>
      
      <div className="container mx-auto px-6 lg:px-8 relative z-10">
        <div className="text-center space-y-8 animate-fade-in">
          <h2 className="text-4xl lg:text-7xl font-playfair font-bold text-background leading-tight">
            Your Transformation
            <span className="block text-primary">Awaits</span>
          </h2>
          
          <p className="text-xl lg:text-2xl text-background/80 font-montserrat font-light max-w-3xl mx-auto">
            Step into a world where luxury meets artistry. Book your appointment today and discover 
            the difference that true elegance makes.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center pt-8">
            <Button 
              size="lg"
              onClick={() => navigate.push('/appointment')}
              className="bg-primary cursor-pointer hover:bg-primary/90 text-primary-foreground font-montserrat font-semibold px-12 py-6 text-xl luxury-shadow hover:luxury-glow transition-all duration-300 hover-scale"
            >
              Book Appointment
            </Button>
            
            <div className="flex items-center space-x-2 text-background/60 font-montserrat">
              <span className="w-2 h-2 bg-primary rounded-full"></span>
              <span className="text-sm">Available 7 days a week</span>
            </div>
          </div>
          
          <div className="pt-12">
            <div className="flex flex-col sm:flex-row justify-center items-center space-y-4 sm:space-y-0 sm:space-x-12 text-background/60 font-montserrat">
              <div className="flex items-center space-x-2">
                <svg className="w-5 h-5 text-primary" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/>
                </svg>
                <span>Expert Stylists</span>
              </div>
              
              <div className="flex items-center space-x-2">
                <svg className="w-5 h-5 text-primary" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/>
                </svg>
                <span>Premium Products</span>
              </div>
              
              <div className="flex items-center space-x-2">
                <svg className="w-5 h-5 text-primary" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/>
                </svg>
                <span>Luxury Experience</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};