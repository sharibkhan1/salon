"use client";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Calendar } from "@/components/ui/calendar";
import { useAuth } from "@/hooks/useAuth";
import { TIME_SLOTS } from "@/lib/timeslot";

type Gender = "men" | "women";
type Service = {
  id: string;
  name: string;
  duration: string;
  price: string;
};

const menServices: Service[] = [
  { id: "haircut-men", name: "Premium Haircut", duration: "45 min", price: "$65" },
  { id: "beard-styling", name: "Beard Styling", duration: "30 min", price: "$45" },
  { id: "grooming-package", name: "Complete Grooming Package", duration: "90 min", price: "$120" }
];

const womenServices: Service[] = [
  { id: "haircut-women", name: "Haircut & Style", duration: "60 min", price: "$85" },
  { id: "hair-coloring", name: "Hair Coloring", duration: "120 min", price: "$150" },
  { id: "makeup", name: "Professional Makeup", duration: "45 min", price: "$95" },
  { id: "spa-treatment", name: "Spa Treatment", duration: "90 min", price: "$120" }
];

export default function Booking() {
  const navigate = useRouter();
  const { user, isLoading: isAuthLoading } = useAuth();
  const [currentStep, setCurrentStep] = useState(1);
  const [selectedGender, setSelectedGender] = useState<Gender | null>(null);
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [selectedTime, setSelectedTime] = useState<string>("");
  const [customerInfo, setCustomerInfo] = useState({
    name: "",
    email: "",
    phone: ""
  });
  const [timeSlotAvailability, setTimeSlotAvailability] = useState<{
    [key: string]: {
      available: boolean;
      availableArtists: number;
      totalArtists: number;
      status?: string;
    }
  }>({});
  const [isLoadingAvailability, setIsLoadingAvailability] = useState(false);

  // Check authentication and redirect if needed
  useEffect(() => {
    if (!isAuthLoading && !user) {
      // User is not logged in, redirect to login with redirect parameter
      navigate.push("/auth/login?redirect=" + encodeURIComponent("/appointment"));
      return;
    }

    if (user) {
      // Pre-fill customer info for logged-in users
      setCustomerInfo(prev => ({
        ...prev,
        name: user.name || "",
        email: user.email || "",
      }));
    }
  }, [user, isAuthLoading, navigate]);

  // Helper function to check if a time slot is in the past for today
  const isTimeSlotInPast = (timeSlot: string, selectedDate: Date): boolean => {
    const today = new Date();
    const isToday = selectedDate.toDateString() === today.toDateString();
    
    if (!isToday) return false; // Not today, so no slots are in the past
    
    // Parse the time slot
    const [time, period] = timeSlot.split(' ');
    const [hours, minutes] = time.split(':').map(Number);
    
    let hour24 = hours;
    if (period === 'PM' && hours !== 12) {
      hour24 += 12;
    } else if (period === 'AM' && hours === 12) {
      hour24 = 0;
    }
    
    // Create a date object for the time slot today
    const slotTime = new Date();
    slotTime.setHours(hour24, minutes, 0, 0);
    
    // Check if the slot time is in the past
    return slotTime <= today;
  };

  // Function to fetch time slot availability
  const fetchTimeSlotAvailability = async (date: Date, duration: string) => {
    if (!date || !duration) {
      return;
    }

    setIsLoadingAvailability(true);
    try {
      // Format date manually to avoid timezone issues
      const dateString = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
      // Get detailed availability using our enhanced API endpoint
      const response = await fetch(`/api/appointments?checkAvailability=true&date=${dateString}&duration=${encodeURIComponent(duration)}`);
      const data = await response.json();
      
      if (response.ok && data.detailedAvailability) {
        setTimeSlotAvailability(data.detailedAvailability);
      } else {
        // Fallback: get actual salon settings for default availability
        try {
          const settingsResponse = await fetch('/api/admin/salon-settings');
          const settingsData = await settingsResponse.json();
          const totalArtists = settingsData.numberOfStylists || 1;
          
          const defaultAvailability: { [key: string]: { available: boolean; availableArtists: number; totalArtists: number; status?: string } } = {};
          TIME_SLOTS.forEach(slot => {
            defaultAvailability[slot] = { available: true, availableArtists: totalArtists, totalArtists, status: 'available' };
          });
          setTimeSlotAvailability(defaultAvailability);
        } catch (settingsError) {
          console.error('Error fetching salon settings:', settingsError);
          // Final fallback
          const defaultAvailability: { [key: string]: { available: boolean; availableArtists: number; totalArtists: number; status?: string } } = {};
          TIME_SLOTS.forEach(slot => {
            defaultAvailability[slot] = { available: true, availableArtists: 1, totalArtists: 1, status: 'available' };
          });
          setTimeSlotAvailability(defaultAvailability);
        }
      }
    } catch (error) {
      console.error('Error fetching time slot availability:', error);
      // Set default availability on error - try to get salon settings first
      try {
        const settingsResponse = await fetch('/api/admin/salon-settings');
        const settingsData = await settingsResponse.json();
        const totalArtists = settingsData.numberOfStylists || 1;
        
        const defaultAvailability: { [key: string]: { available: boolean; availableArtists: number; totalArtists: number; status?: string } } = {};
        TIME_SLOTS.forEach(slot => {
          defaultAvailability[slot] = { available: true, availableArtists: totalArtists, totalArtists, status: 'available' };
        });
        setTimeSlotAvailability(defaultAvailability);
      } catch (settingsError) {
        console.error('Error fetching salon settings in fallback:', settingsError);
        // Final fallback
        const defaultAvailability: { [key: string]: { available: boolean; availableArtists: number; totalArtists: number; status?: string } } = {};
        TIME_SLOTS.forEach(slot => {
          defaultAvailability[slot] = { available: true, availableArtists: 1, totalArtists: 1, status: 'available' };
        });
        setTimeSlotAvailability(defaultAvailability);
      }
    } finally {
      setIsLoadingAvailability(false);
    }
  };

  // Fetch availability when date or service changes
  useEffect(() => {
    if (selectedDate && selectedService) {
      fetchTimeSlotAvailability(selectedDate, selectedService.duration);
    }
  }, [selectedDate, selectedService]);

  const handleNext = () => {
    if (currentStep < 5) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const [isBooking, setIsBooking] = useState(false);

  const handleConfirmBooking = async () => {
    setIsBooking(true);
    
    try {
      // Prepare appointment data
      const appointmentData = {
        customerInfo: {
          name: customerInfo.name,
          email: customerInfo.email,
          phone: customerInfo.phone,
        },
        serviceDetails: {
          id: selectedService?.id,
          name: selectedService?.name,
          duration: selectedService?.duration,
          price: selectedService?.price,
          gender: selectedGender,
        },
        appointmentDetails: {
          date: selectedDate ? `${selectedDate.getFullYear()}-${String(selectedDate.getMonth() + 1).padStart(2, '0')}-${String(selectedDate.getDate()).padStart(2, '0')}` : '',
          time: selectedTime,
        },
      };
      // Send to API
      const response = await fetch('/api/appointments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(appointmentData),
      });

      const data = await response.json();

      if (response.ok) {
        toast.success("Booking confirmed! We'll see you soon.");
        setCurrentStep(6);
      } else {
        toast.error(data.error || "Booking failed. Please try again.");
      }
    } catch (error) {
      console.error('Booking error:', error);
      toast.error("Something went wrong. Please try again.");
    } finally {
      setIsBooking(false);
    }
  };

  const getServices = () => selectedGender === "men" ? menServices : womenServices;

  // Show loading while checking authentication
  if (isAuthLoading) {
    return (
      <div className="min-h-screen bg-gradient-elegant flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-luxury-gold border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading your appointment...</p>
        </div>
      </div>
    );
  }

  // If not authenticated, don't render anything (redirect will happen)
  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen cursor-default bg-gradient-elegant py-12">
      <div className="container mx-auto px-6 mt-20 lg:px-8">
        <div className="text-center mb-12">
          <h1 className="text-4xl lg:text-6xl font-playfair font-bold text-foreground mb-4">
            Book Your Appointment
          </h1>
          <p className="text-xl text-muted-foreground font-montserrat">
            Your luxury experience is just a few steps away
          </p>
        </div>

        {/* Progress Bar */}
        <div className="max-w-2xl mx-auto mb-12">
  <div className="flex flex-wrap items-center justify-center cursor-default">
    {[1, 2, 3, 4, 5].map((step) => (
      <div key={step} className="flex items-center mb-4 md:mb-0">
        <div
          className={`w-10 h-10 rounded-full flex items-center justify-center font-montserrat font-semibold ${
            currentStep >= step
              ? "bg-primary text-primary-foreground"
              : "bg-gradient-hero text-muted"
          }`}
        >
          {step}
        </div>
        {step < 5 && (
          <div
            className={`h-1 w-16 mx-2 ${
              currentStep > step ? "bg-primary" : "bg-gradient-hero"
            }`}
          ></div>
        )}
      </div>
    ))}
  </div>
</div>




        <div className="max-w-4xl mx-auto">
          {/* Step 1: Gender Selection */}
          {currentStep === 1 && (
            <Card className="luxury-shadow">
              <CardHeader>
                <CardTitle className="text-3xl cursor-default font-playfair text-center">
                  <h1>Select Your Preference</h1>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid  md:grid-cols-2 gap-6">
                  <button
                    onClick={() => {
                      setSelectedGender("men");
                      handleNext();
                    }}
                    className={`p-8 rounded-2xl border-2 transition-all hover:shadow-lg hover:shadow-luxury duration-300 hover:bg-secondary/10 cursor-pointer ${
                      selectedGender === "men"
                        ? "border-primary bg-primary/10"
                        : "border-border hover:border-primary/50"
                    }`}
                  >
                    <div className="text-center space-y-4">
                      <div className="w-16 h-16 bg-primary rounded-full mx-auto flex items-center justify-center">
                        <svg className="w-8 h-8 text-primary-foreground" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M12 2C13.1 2 14 2.9 14 4C14 5.1 13.1 6 12 6C10.9 6 10 5.1 10 4C10 2.9 10.9 2 12 2ZM21 9V7L15 7V9L16 9V16L11 16V18L17 18V22H15V24H17H19H21V22H19V18H21V16L21 9H21ZM7 9V7L3 7V9L4 9V16L1 16V18L7 18V22H5V24H7H9H11V22H9V18H11V16L7 9H7Z"/>
                        </svg>
                      </div>
                      <h3 className="text-2xl font-playfair font-semibold">Men&apos;s Services</h3>
                      <p className="text-muted-foreground font-montserrat">
                        Premium grooming and styling services
                      </p>
                    </div>
                  </button>

                  <button
                    onClick={() => {
                      setSelectedGender("women");
                      handleNext();
                    }}
                    className={`p-8 rounded-2xl border-2 transition-all hover:shadow-lg hover:shadow-luxury duration-300 hover:bg-secondary/10 cursor-pointer ${
                      selectedGender === "women"
                        ? "border-primary bg-primary/10"
                        : "border-border hover:border-primary/50"
                    }`}
                  >
                    <div className="text-center space-y-4">
                      <div className="w-16 h-16 bg-primary rounded-full mx-auto flex items-center justify-center">
                        <svg className="w-8 h-8 text-primary-foreground" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M12 4C13.1 4 14 4.9 14 6C14 7.1 13.1 8 12 8C10.9 8 10 7.1 10 6C10 4.9 10.9 4 12 4ZM12 10C13.3 10 15.5 10.4 17 11.4V22H15V15H9V22H7V11.4C8.5 10.4 10.7 10 12 10Z"/>
                        </svg>
                      </div>
                      <h3 className="text-2xl font-playfair font-semibold">Women&apos;s Services</h3>
                      <p className="text-muted-foreground font-montserrat">
                        Luxury beauty and wellness treatments
                      </p>
                    </div>
                  </button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Step 2: Service Selection */}
          {currentStep === 2 && (
            <Card className="luxury-shadow">
              <CardHeader>
                <CardTitle className="text-3xl cursor-default font-playfair text-center">
                  <h1>Choose Your Service</h1>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-2 gap-4">
                  {getServices().map((service) => (
                    <button
                      key={service.id}
                      onClick={() => setSelectedService(service)}
                      className={`p-6 rounded-xl border-2 text-left cursor-pointer transition-all duration-300 hover:shadow-lg hover:shadow-luxury ${
                        selectedService?.id === service.id
                          ? "border-primary bg-primary/10"
                          : "border-border hover:bg-secondary/20 hover:border-primary/50"
                      }`}
                    >
                      <div className="space-y-2">
                        <h3 className="text-xl font-playfair font-semibold">{service.name}</h3>
                        <div className="flex justify-between text-sm text-muted-foreground font-montserrat">
                          <span>{service.duration}</span>
                          <span className="text-primary font-semibold">{service.price}</span>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
                <div className="flex justify-between mt-8">
                  <Button variant="outline" className="cursor-pointer" onClick={handleBack}>
                    Back
                  </Button>
                  <Button 
                    onClick={handleNext} 
                    disabled={!selectedService}
                    className="bg-primary cursor-pointer  hover:bg-primary/90"
                  >
                    Continue
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Step 3: Date & Time Selection */}
          {currentStep === 3 && (
            <Card className="luxury-shadow">
              <CardHeader>
                <CardTitle className="text-3xl cursor-default font-playfair text-center">
                  <h1>Select Date & Time</h1>
                </CardTitle>
                {selectedDate && selectedService && Object.keys(timeSlotAvailability).length > 0 && (
                  <div className="text-center mt-4">
                    <div className="inline-flex items-center space-x-2 px-4 py-2 bg-primary/10 rounded-full">
                      <span className="text-sm font-medium text-primary">
                        Salon has {Object.values(timeSlotAvailability)[0]?.totalArtists || 1} hair stylists available
                      </span>
                    </div>
                  </div>
                )}
              </CardHeader>
              <CardContent>
                <div className="grid lg:grid-cols-2 gap-8">
                  <div className="space-y-4">
                    <h3 className="text-xl font-playfair font-semibold">Choose Date</h3>
                    <Calendar
                      mode="single"
                      selected={selectedDate}
                      onSelect={setSelectedDate}
                      disabled={(date) => date < new Date()}
                      className="rounded-xl border luxury-shadow"
                    />
                  </div>
                  
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-xl font-playfair font-semibold">Available Times</h3>
                      {isLoadingAvailability && (
                        <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                          <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                          <span>Checking availability...</span>
                        </div>
                      )}
                    </div>

                      {/* Legend */}
                      <div className="flex flex-wrap items-center justify-center gap-4 text-xs text-muted-foreground mt-4 p-3 bg-muted/30 rounded-lg">
                      <div className="flex items-center space-x-1">
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                        <span>All stylists available</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                        <span>Some stylists available</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                        <span>Fully booked</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                        <span>Duration conflict</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <div className="w-2 h-2 bg-gray-500 rounded-full"></div>
                        <span>Time passed</span>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                      {TIME_SLOTS.map((time) => {
                        const slotInfo = timeSlotAvailability[time];
                        const isAvailable = slotInfo?.available ?? true;
                        const availableArtists = slotInfo?.availableArtists ?? 1;
                        const totalArtists = slotInfo?.totalArtists ?? 1;
                        const status = slotInfo?.status ?? 'available';
                        
                        // Check if this time slot is in the past for today
                        const isInPast = selectedDate ? isTimeSlotInPast(time, selectedDate) : false;
                        const finalAvailable = isAvailable && !isInPast;
                        
                        // Determine display text and colors based on status
                        let displayText = `${availableArtists}/${totalArtists} stylists available`;
                        let statusColor = 'bg-green-500';
                        let borderColor = "border-border hover:border-primary/50 hover:bg-primary/10 cursor-pointer";
                        
                        if (isInPast) {
                          displayText = 'Time Passed';
                          statusColor = 'bg-gray-500';
                          borderColor = "border-gray-200 bg-gray-50 text-gray-400 cursor-not-allowed opacity-60";
                        } else if (status === 'fully_booked') {
                          displayText = 'Fully Booked';
                          statusColor = 'bg-red-500';
                          borderColor = "border-red-200 bg-red-50 text-red-400 cursor-not-allowed opacity-60";
                        } else if (status === 'duration_conflict') {
                          displayText = 'Duration Conflict';
                          statusColor = 'bg-orange-500';
                          borderColor = "border-orange-200 bg-orange-50 text-orange-400 cursor-not-allowed opacity-60";
                        } else if (availableArtists < totalArtists) {
                          statusColor = 'bg-yellow-500';
                        }
                        
                        return (
                          <button
                            key={time}
                            onClick={() => finalAvailable ? setSelectedTime(time) : null}
                            disabled={!finalAvailable}
                            className={`p-3 rounded-lg border transition-all duration-300 font-montserrat relative ${
                              !finalAvailable
                                ? borderColor
                                : selectedTime === time
                                ? "border-primary bg-primary/80 text-primary-foreground cursor-pointer"
                                : borderColor
                            }`}
                          >
                            <div className="flex flex-col items-center space-y-1">
                              <span className="font-semibold">{time}</span>
                              <div className="text-xs">
                                {!finalAvailable ? (
                                  <span className={`font-medium ${
                                    isInPast ? 'text-gray-500' : 
                                    status === 'duration_conflict' ? 'text-orange-500' : 'text-red-500'
                                  }`}>
                                    {displayText}
                                  </span>
                                ) : (
                                  <span className={`${selectedTime === time ? 'text-primary-foreground/80' : 'text-muted-foreground'}`}>
                                    {displayText}
                                  </span>
                                )}
                              </div>
                            </div>
                            
                            {/* Status indicator */}
                            <div className={`absolute top-1 right-1 w-2 h-2 rounded-full ${statusColor}`}></div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
                
                <div className="flex justify-between mt-8">
                  <Button variant="outline" className="cursor-pointer" onClick={handleBack}>
                    Back
                  </Button>
                  <Button 
                    onClick={handleNext} 
                    disabled={!selectedDate || !selectedTime}
                    className="bg-primary cursor-pointer hover:bg-primary/90"
                  >
                    Continue
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Step 4: Customer Information */}
          {currentStep === 4 && (
            <Card className="luxury-shadow">
              <CardHeader>
                <CardTitle className="text-3xl cursor-default font-playfair text-center">
                  <h1>Your Information</h1>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-6 max-w-md mx-auto">
                  <div className="space-y-2">
                    <Label htmlFor="name" className="font-montserrat">Full Name</Label>
                    <Input
                      id="name"
                      type="text"
                      value={customerInfo.name}
                      onChange={(e) => setCustomerInfo({...customerInfo, name: e.target.value})}
                      className="font-montserrat py-5"
                      placeholder="Enter your full name"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="email" className="font-montserrat">Email Address</Label>
                    <Input
                      id="email"
                      type="email"
                      value={customerInfo.email}
                      onChange={(e) => setCustomerInfo({...customerInfo, email: e.target.value})}
                      className="font-montserrat py-5"
                      placeholder="Enter your email"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="phone" className="font-montserrat">Phone Number</Label>
                    <Input
                      id="phone"
                      type="tel"
                      value={customerInfo.phone}
                      onChange={(e) => setCustomerInfo({...customerInfo, phone: e.target.value})}
                      className="font-montserrat py-5"
                      placeholder="Enter your phone number"
                    />
                  </div>
                </div>
                
                <div className="flex justify-between mt-8">
                  <Button variant="outline" className="cursor-pointer" onClick={handleBack}>
                    Back
                  </Button>
                  <Button 
                    onClick={handleNext} 
                    disabled={!customerInfo.name || !customerInfo.email || !customerInfo.phone}
                    className="bg-primary cursor-pointer hover:bg-primary/90"
                  >
                    Review Booking
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Step 5: Booking Summary */}
          {currentStep === 5 && (
            <Card className="luxury-shadow">
              <CardHeader>
                <CardTitle className="text-3xl cursor-default font-playfair text-center">
                  <h1>Booking Summary</h1>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-6 max-w-2xl mx-auto">
                  <div className="bg-gradient-cream p-6 rounded-xl">
                    <div className="grid md:grid-cols-2 gap-6">
                      <div className="space-y-4">
                        <h3 className="text-xl font-playfair font-semibold text-primary">Service Details</h3>
                        <div className="space-y-2 font-montserrat">
                          <p><span className="text-muted-foreground">Service:</span> {selectedService?.name}</p>
                          <p><span className="text-muted-foreground">Duration:</span> {selectedService?.duration}</p>
                          <p><span className="text-muted-foreground">Price:</span> {selectedService?.price}</p>
                        </div>
                      </div>
                      
                      <div className="space-y-4">
                        <h3 className="text-xl font-playfair font-semibold text-primary">Appointment Details</h3>
                        <div className="space-y-2 font-montserrat">
                          <p><span className="text-muted-foreground">Date:</span> {selectedDate?.toLocaleDateString()}</p>
                          <p><span className="text-muted-foreground">Time:</span> {selectedTime}</p>
                          <p><span className="text-muted-foreground">Client:</span> {customerInfo.name}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="text-center">
                    <p className="text-muted-foreground font-montserrat mb-6">
                      Please review your booking details above. A confirmation email will be sent to {customerInfo.email}.
                    </p>
                  </div>
                </div>
                
                <div className="flex justify-between mt-8">
                  <Button variant="outline" className="cursor-pointer" onClick={handleBack}>
                    Back
                  </Button>
                  <Button 
                    onClick={handleConfirmBooking}
                    disabled={isBooking}
                    className="bg-primary cursor-pointer hover:bg-primary/90 shadow-luxury px-8"
                  >
                    {isBooking ? (
                      <div className="flex items-center space-x-2">
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        <span>Booking...</span>
                      </div>
                    ) : (
                      "Confirm Booking"
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Step 6: Confirmation */}
          {currentStep === 6 && (
            <Card className="luxury-shadow">
              <CardContent className="text-center space-y-8 py-12">
                <div className="w-20 h-20 bg-primary rounded-full mx-auto flex items-center justify-center luxury-glow">
                  <svg className="w-10 h-10 text-primary-foreground" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/>
                  </svg>
                </div>
                
                <div className="space-y-4">
                  <h2 className="text-4xl font-playfair font-bold text-foreground">
                    Thank You!
                  </h2>
                  <p className="text-xl text-primary font-playfair">
                    Your luxury experience is confirmed.
                  </p>
                  <p className="text-muted-foreground font-montserrat max-w-lg mx-auto">
                    We&apos;ve sent a confirmation email to {customerInfo.email}. We look forward to 
                    providing you with an exceptional experience at Tangerine Beauty Salon.
                  </p>
                </div>
                
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Button 
                    onClick={() => navigate.push('/')}
                    className="bg-primary cursor-pointer hover:bg-primary/90"
                  >
                    Return Home
                  </Button>
                  <Button 
                    variant="outline"
                    onClick={() => window.location.reload()}
                    className="cursor-pointer"
                  >
                    Book Another Appointment
                  </Button>
                  <Button 
                    variant="outline"
                    onClick={() => navigate.push('/bookings')}
                    className="cursor-pointer"
                  >
                    My Appointments
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}