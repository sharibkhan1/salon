import { Card, CardContent } from "@/components/ui/card";

const services = [
  {
    title: "Hair Styling",
    description: "Expert cuts, colors, and styling for all hair types with premium products.",
    image: "/hero-salon.jpg",
    price: "From $85"
  },
  {
    title: "Grooming",
    description: "Professional men's grooming including beard styling and precision cuts.",
    image: "/hero-salon.jpg",
    price: "From $65"
  },
  {
    title: "Spa Treatments",
    description: "Relaxing spa experiences designed to rejuvenate and refresh.",
    image: "/hero-salon.jpg",
    price: "From $120"
  },
  {
    title: "Makeup Artistry",
    description: "Professional makeup application for special occasions and events.",
    image: "/hero-salon.jpg",
    price: "From $95"
  },
  {
    title: "Skincare",
    description: "Advanced skincare treatments tailored to your unique needs.",
    image: "/hero-salon.jpg",
    price: "From $110"
  }
];

export const ServicesSection = () => {
  return (
    <section className="py-20 lg:py-32 bg-gradient-cream">
      <div className="container mx-auto px-6 lg:px-8">
        <div className="text-center mb-16 animate-fade-in">
          <h2 className="text-4xl lg:text-6xl font-playfair font-bold text-foreground mb-6">
            Our Services
          </h2>
          <p className="text-xl text-muted-foreground font-montserrat max-w-3xl mx-auto">
            Discover our comprehensive range of luxury beauty and grooming services, 
            each designed to elevate your personal style.
          </p>
        </div>
        
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {services.map((service, index) => (
            <Card 
              key={service.title}
              className="group bg-secondary rounded-t-2xl rounded-b-4xl py-0 border-border hover:luxury-shadow transition-all duration-500 overflow-hidden hover-scale"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <div className="relative h-64 overflow-hidden">
                <div className={`absolute inset-0 overflow-hidden`}>
                  <img 
                    src={service.image}
                    alt={service.title}
                    className="w-full h-full rounded-b-4xl object-cover group-hover:scale-110 transition-transform duration-700"
                  />
                </div>
                <div className="absolute top-4 right-4 bg-primary text-primary-foreground px-3 py-1 rounded-full text-sm font-montserrat font-medium">
                  {service.price}
                </div>
              </div>
              
              <CardContent className="px-6 py-3 space-y-4">
                <h3 className="text-2xl font-playfair font-semibold text-foreground">
                  {service.title}
                </h3>
                <p className="text-muted-foreground font-montserrat leading-relaxed">
                  {service.description}
                </p>
                <div className="w-12 h-0.5 bg-gradient-gold rounded-full"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};