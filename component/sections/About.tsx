const About = () => {
  return (
    <section className="luxury-section bg-secondary relative overflow-hidden">
      <div className="absolute top-20 left-20 w-32 h-32 bg-primary rounded-full opacity-10 luxury-glow"></div>
      <div className="absolute bottom-40 right-20 w-24 h-24 bg-primary rounded-full opacity-15 luxury-glow"></div>
      <div className="absolute top-1/2 left-1/4 w-16 h-16 bg-primary rounded-full opacity-5"></div>
      
      <div className="luxury-container relative z-10">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="font-heading text-4xl md:text-5xl font-bold text-luxury-dark mb-8">
            Where <span className="text-luxury-gold">Elegance</span> Meets Expertise
          </h2>

          <div className="space-y-6 text-lg text-muted-foreground leading-relaxed">
            <p>
              At Tangerine Beauty Salon, we redefine the art of beauty and grooming. Our exclusive sanctuary 
              caters to discerning individuals who appreciate the finest in luxury experiences.
            </p>

            <p>
              With over a decade of excellence, our team of master stylists and beauty artisans 
              have crafted transformations for celebrities, executives, and tastemakers who demand 
              nothing but perfection.
            </p>

            <p>
              Step into our world where every detail is curated for your comfort, every service 
              is delivered with precision, and every moment is designed to elevate your natural beauty.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-16">
            <div className="text-center">
              <div className="text-3xl font-bold text-luxury-gold mb-2">10+</div>
              <div className="text-sm uppercase tracking-wider text-muted-foreground">
                Years Excellence
              </div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-luxury-gold mb-2">500+</div>
              <div className="text-sm uppercase tracking-wider text-muted-foreground">
                Elite Clients
              </div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-luxury-gold mb-2">15+</div>
              <div className="text-sm uppercase tracking-wider text-muted-foreground">
                Expert Stylists
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default About;
