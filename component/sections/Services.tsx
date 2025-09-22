import { Button } from "@/components/ui/button";
import { Scissors, Sparkles, Crown, Palette, Flower2, ShieldCheck } from "lucide-react";
import Link from "next/link";

const Services = () => {
  const services = [
    {
      icon: Scissors,
      title: "Hair Styling",
      description: "Precision cuts and sophisticated styling by master stylists using premium techniques.",
      price: "Starting at $150"
    },
    {
      icon: Crown,
      title: "Premium Grooming",
      description: "Executive grooming services including beard sculpting and traditional hot towel treatments.",
      price: "Starting at $120"
    },
    {
      icon: Sparkles,
      title: "Bridal Beauty",
      description: "Complete bridal transformation with makeup, hair styling, and pre-wedding consultations.",
      price: "Starting at $350"
    },
    {
      icon: Flower2,
      title: "Luxury Spa",
      description: "Rejuvenating facial treatments and relaxation therapies in our private spa suites.",
      price: "Starting at $200"
    },
    {
      icon: Palette,
      title: "Color Artistry",
      description: "Expert color correction, highlighting, and creative color transformations.",
      price: "Starting at $180"
    },
    {
      icon: ShieldCheck,
      title: "Skincare Consultation",
      description: "Personalized skincare analysis and treatment plans by certified aestheticians.",
      price: "Starting at $100"
    }
  ];

  return (
    <section className="luxury-section">
      <div className="luxury-container">
        <div className="text-center mb-16">
          <h2 className="font-heading text-4xl md:text-5xl font-bold text-luxury-dark mb-6">
            Our <span className="text-luxury-gold">Signature</span> Services
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Each service is crafted to perfection, delivered in our luxurious environment 
            by certified professionals using only the finest products.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {services.map((service, index) => (
            <div key={index} className="group bg-card rounded-xl p-8 shadow-subtle hover:shadow-elegant transition-all duration-300 hover:-translate-y-2">
              <div className="flex items-center justify-center w-16 h-16 bg-luxury-gold/10 rounded-full mb-6 group-hover:bg-luxury-gold/20 transition-colors">
                <service.icon className="h-8 w-8 text-luxury-gold" />
              </div>
              
              <h3 className="font-heading text-xl font-semibold text-luxury-dark mb-3">
                {service.title}
              </h3>
              
              <p className="text-muted-foreground mb-4 leading-relaxed">
                {service.description}
              </p>
              
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-luxury-gold">
                  {service.price}
                </span>
                <Link href="/appointment">
                  <Button variant="elegant" size="sm">
                    Book Now
                  </Button>
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Services;