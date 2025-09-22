import { Star } from "lucide-react";

const Testimonials = () => {
  const testimonials = [
    {
      name: "Alexandra Sterling",
      title: "CEO, Sterling Enterprises",
      content: "Luxe Salon transformed not just my appearance, but my confidence. The attention to detail and luxury experience is unmatched.",
      rating: 5
    },
    {
      name: "Marcus Thompson",
      title: "Investment Banker",
      content: "As someone who values precision and quality, Luxe Salon exceeds every expectation. Their grooming services are simply exceptional.",
      rating: 4
    },
    {
      name: "Isabella Rodriguez",
      title: "Fashion Designer",
      content: "The artistry and elegance at Luxe Salon aligns perfectly with my aesthetic vision. They understand luxury at the highest level.",
      rating: 5
    }
  ];

  return (
    <section className="luxury-section">
      <div className="luxury-container">
        <div className="text-center mb-16">
          <h2 className="font-heading text-4xl md:text-5xl font-bold text-luxury-dark mb-6">
            What Our <span className="text-luxury-gold">Elite Clients</span> Say
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Don&apos;t just take our word for it. Hear from distinguished clients who trust us 
            with their most important moments.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {testimonials.map((testimonial, index) => (
          <div 
              key={index}
              className="group text-center space-y-6 p-8 bg-luxury-cream rounded-2xl shadow-subtle hover:shadow-elegant hover-scale transition-all duration-500"
              style={{ animationDelay: `${index * 200}ms` }}
            >  
              
              {/* Quote */}
              <div className="relative">
                <svg 
                  className="w-12 h-12 text-primary mx-auto mb-4 opacity-60" 
                  fill="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path d="M14.017 21v-7.391c0-5.704 3.731-9.57 8.983-10.609l.995 2.151c-2.432.917-3.995 3.638-3.995 5.849h4v10h-9.983zm-14.017 0v-7.391c0-5.704 3.748-9.57 9-10.609l.996 2.151c-2.433.917-3.996 3.638-3.996 5.849h3.983v10h-9.983z"/>
                </svg>
                
                <blockquote className="text-lg font-playfair italic text-foreground leading-relaxed">
                  &quot;{testimonial.content}&quot;
                </blockquote>
              </div>
              {/* <blockquote className="text-muted-foreground mb-6 leading-relaxed italic">
                "{testimonial.content}"
              </blockquote> */}
              
              {/* Author */}
              <div className="border-t border-border flex flex-col items-center justify-center pt-6">
                              {/* Stars */}
              <div className="flex items-center mb-6">
                {[...Array(testimonial.rating)].map((_, i) => (
                  <Star key={i} className="w-5 h-5 text-luxury-gold fill-current" />
                ))}
              </div>
                <div className="font-semibold text-luxury-dark">{testimonial.name}</div>
                <div className="text-sm text-muted-foreground">{testimonial.title}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Testimonials;