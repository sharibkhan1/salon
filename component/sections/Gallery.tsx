const Gallery = () => {
  const galleryImages = [
    {
      src: "/hero-salon.jpg",
      alt: "Professional hair styling session",
      title: "Hair Artistry"
    },
    {
      src: "/hero-salon.jpg",
      alt: "Luxury spa treatment room",
      title: "Spa Experience"
    },
    {
      src: "/hero-salon.jpg",
      alt: "Premium grooming services",
      title: "Grooming Excellence"
    }
  ];

  return (
    <section className="luxury-section bg-secondary">
      <div className="luxury-container">
      <div className="absolute top-20 left-20 w-32 h-32 bg-primary rounded-full opacity-10 luxury-glow"></div>
      <div className="absolute bottom-40 right-20 w-24 h-24 bg-primary rounded-full opacity-15 luxury-glow"></div>
      <div className="absolute top-1/2 left-1/4 w-16 h-16 bg-primary rounded-full opacity-5"></div>
        <div className="text-center mb-16">
          <h2 className="font-heading text-4xl md:text-5xl font-bold text-luxury-dark mb-6">
            Our <span className="text-luxury-gold">Luxury</span> Experience
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Step inside our world of elegance where every detail is crafted 
            to create an unforgettable beauty experience.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {galleryImages.map((image, index) => (
            <div key={index} className="group relative overflow-hidden rounded-xl shadow-elegant hover:shadow-luxury transition-all duration-500">
              <img 
                src={image.src} 
                alt={image.alt}
                className="w-full h-80 object-cover group-hover:scale-110 transition-transform duration-700"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-luxury-dark/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              <div className="absolute bottom-6 left-6 text-luxury-light transform translate-y-4 group-hover:translate-y-0 transition-transform duration-300 opacity-0 group-hover:opacity-100">
                <h3 className="font-heading text-xl font-semibold">{image.title}</h3>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Gallery;