"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Calendar, Clock, User, Phone, Mail, Package, CalendarX, RefreshCw, X, Edit, Check } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import RescheduleModal from "@/components/RescheduleModal";

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
}

interface Appointment {
  id: string;
  customer: {
    name: string;
    email: string;
    phone: string;
  };
  service: {
    id: string;
    name: string;
    duration: string;
    price: string;
    gender: string;
  };
  appointment: {
    date: string;
    time: string;
    status: 'pending' | 'confirmed' | 'completed' | 'cancelled' | 'rescheduled';
  };
  rescheduleHistory?: Array<{
    oldDate: string;
    oldTime: string;
    newDate: string;
    newTime: string;
    rescheduledBy: 'user' | 'admin';
    rescheduledAt: string;
    reason?: string;
  }>;
  createdAt: string;
}

export default function BookingsPage() {
  const router = useRouter();
  const { user, isLoading: isAuthLoading } = useAuth();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [cancellingId, setCancellingId] = useState<string | null>(null);
  const [rescheduleModal, setRescheduleModal] = useState<{
    isOpen: boolean;
    appointment: Appointment | null;
  }>({ isOpen: false, appointment: null });
  const [confirmingId, setConfirmingId] = useState<string | null>(null);

  useEffect(() => {
    if (!isAuthLoading && !user) {
      router.push("/auth/login");
      return;
    }

    if (user) {
      fetchAppointments(user.email);
    }
  }, [user, isAuthLoading, router]);

  const fetchAppointments = async (email: string) => {
    try {
      const response = await fetch(`/api/appointments?email=${encodeURIComponent(email)}`);
      const data = await response.json();

      if (response.ok) {
        setAppointments(data.appointments || []);
      } else {
        toast.error("Failed to fetch appointments");
      }
    } catch (error) {
      console.error("Error fetching appointments:", error);
      toast.error("Something went wrong while fetching appointments");
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  const handleRefresh = () => {
    if (user) {
      setIsRefreshing(true);
      fetchAppointments(user.email);
    }
  };

  const handleCancelAppointment = async (appointmentId: string) => {
    setCancellingId(appointmentId);
    
    try {
      const response = await fetch(`/api/appointments/${appointmentId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: 'cancelled' }),
      });

      const data = await response.json();

      if (response.ok) {
        toast.success("Appointment cancelled successfully");
        // Update the appointment in the local state
        setAppointments(prev => 
          prev.map(apt => 
            apt.id === appointmentId 
              ? { ...apt, appointment: { ...apt.appointment, status: 'cancelled' } }
              : apt
          )
        );
      } else {
        toast.error(data.error || "Failed to cancel appointment");
      }
    } catch (error) {
      console.error("Error cancelling appointment:", error);
      toast.error("Something went wrong while cancelling appointment");
    } finally {
      setCancellingId(null);
    }
  };

  const handleReschedule = async (appointmentId: string, newDate: string, newTime: string) => {
    try {
      const response = await fetch(`/api/appointments/${appointmentId}/reschedule`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          newDate, 
          newTime, 
          rescheduledBy: 'user' 
        }),
      });

      const data = await response.json();

      if (response.ok) {
        toast.success("Appointment rescheduled successfully");
        // Update the appointment in the local state
        setAppointments(prev => 
          prev.map(apt => 
            apt.id === appointmentId 
              ? { 
                  ...apt, 
                  appointment: { 
                    ...apt.appointment, 
                    date: newDate, 
                    time: newTime, 
                    status: 'rescheduled' 
                  } 
                }
              : apt
          )
        );
      } else {
        toast.error(data.error || "Failed to reschedule appointment");
        throw new Error(data.error);
      }
    } catch (error) {
      console.error("Error rescheduling appointment:", error);
      toast.error("Something went wrong while rescheduling appointment");
      throw error;
    }
  };

  const handleConfirmRescheduled = async (appointmentId: string) => {
    setConfirmingId(appointmentId);
    
    try {
      const response = await fetch(`/api/appointments/${appointmentId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: 'confirmed' }),
      });

      const data = await response.json();

      if (response.ok) {
        toast.success("Appointment confirmed successfully");
        // Update the appointment in the local state
        setAppointments(prev => 
          prev.map(apt => 
            apt.id === appointmentId 
              ? { ...apt, appointment: { ...apt.appointment, status: 'confirmed' } }
              : apt
          )
        );
      } else {
        toast.error(data.error || "Failed to confirm appointment");
      }
    } catch (error) {
      console.error("Error confirming appointment:", error);
      toast.error("Something went wrong while confirming appointment");
    } finally {
      setConfirmingId(null);
    }
  };

  const openRescheduleModal = (appointment: Appointment) => {
    setRescheduleModal({ isOpen: true, appointment });
  };

  const closeRescheduleModal = () => {
    setRescheduleModal({ isOpen: false, appointment: null });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'confirmed':
        return 'text-green-600 bg-green-50 border-green-200';
      case 'completed':
        return 'text-blue-600 bg-blue-50 border-blue-200';
      case 'cancelled':
        return 'text-red-600 bg-red-50 border-red-200';
      case 'rescheduled':
        return 'text-purple-600 bg-purple-50 border-purple-200';
      default:
        return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  if (isAuthLoading || isLoading) {
    return (
      <div className="min-h-screen bg-gradient-elegant flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-luxury-gold border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading your appointments...</p>
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
          <h1 className="text-4xl lg:text-6xl font-heading font-bold text-foreground mb-4">
            My Bookings
          </h1>
          <p className="text-xl text-muted-foreground font-body">
            Manage your salon appointments
          </p>
        </div>

        <div className="max-w-6xl mx-auto">
          {/* Header Actions */}
          <div className="flex flex-col sm:flex-row justify-between items-center mb-8 gap-4">
            <div className="flex items-center space-x-2">
              <User className="h-5 w-5 text-luxury-gold" />
              <span className="text-lg font-medium">Welcome back, {user?.name}</span>
            </div>
            <div className="flex items-center space-x-3">
              <Button
                variant="outline"
                size="sm"
                onClick={handleRefresh}
                disabled={isRefreshing}
                className="flex items-center cursor-pointer space-x-2"
              >
                <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                <span>Refresh</span>
              </Button>
              <Button
                variant="luxury"
                size="sm"
                onClick={() => router.push('/appointment')}
                className="flex items-center cursor-pointer  space-x-2"
              >
                <Calendar className="h-4 w-4" />
                <span>Book New</span>
              </Button>
            </div>
          </div>

          {/* Appointments List */}
          {appointments.length > 0 ? (
            <div className="space-y-6">
              {appointments.map((appointment) => (
                <Card key={appointment.id} className="shadow-luxury border-0 bg-white/95 backdrop-blur-sm">
                  <CardHeader className="pb-4">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                      <CardTitle className="font-heading text-xl text-luxury-dark">
                        {appointment.service.name}
                      </CardTitle>
                        <div className="flex flex-col items-end space-y-2">
                          {appointment.appointment.status !== 'rescheduled' ? (
                            <span className={`px-3 py-1 rounded-full text-sm cursor-default font-medium border ${getStatusColor(appointment.appointment.status)}`}>
                              {appointment.appointment.status.charAt(0).toUpperCase() + appointment.appointment.status.slice(1)}
                            </span>
                          ) : (
                            <span className={`px-3 py-1 rounded-full text-sm cursor-default font-medium border ${getStatusColor(appointment.appointment.status)}`}>
                              Rescheduled by {appointment.rescheduleHistory && appointment.rescheduleHistory.length > 0 
                                ? (appointment.rescheduleHistory[appointment.rescheduleHistory.length - 1].rescheduledBy === 'admin' ? 'Admin' : 'User')
                                : 'Unknown'}
                            </span>
                          )}
                        </div>
                    </div>
                  </CardHeader>
                  
                  <CardContent>
                    <div className="grid md:grid-cols-2 gap-6">
                      {/* Service Details */}
                      <div className="space-y-4">
                        <h3 className="font-heading text-lg font-semibold text-luxury-gold flex items-center">
                          <Package className="h-4 w-4 mr-2" />
                          Service Details
                        </h3>
                        <div className="space-y-2 text-sm">
                          <div className="flex gap-x-2 justify-start">
                            <span className="text-muted-foreground">Duration:</span>
                            <span className="font-medium">{appointment.service.duration}</span>
                          </div>
                          <div className="flex gap-x-2 justify-start">
                            <span className="text-muted-foreground">Price:</span>
                            <span className="font-medium text-luxury-gold">{appointment.service.price}</span>
                          </div>
                          <div className="flex gap-x-2 justify-start">
                            <span className="text-muted-foreground">Category:</span>
                            <span className="font-medium capitalize">{appointment.service.gender}&apos;s Service</span>
                          </div>
                        </div>
                      </div>

                      {/* Appointment Details */}
                      <div className="space-y-4">
                        <h3 className="font-heading text-lg font-semibold text-luxury-gold flex items-center">
                          <Calendar className="h-4 w-4 mr-2" />
                          Appointment Details
                        </h3>
                        <div className="space-y-2 text-sm">
                          <div className="flex items-center space-x-2">
                            <Calendar className="h-4 w-4 text-muted-foreground" />
                            <span className="font-medium">{formatDate(appointment.appointment.date)}</span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Clock className="h-4 w-4 text-muted-foreground" />
                            <span className="font-medium">{appointment.appointment.time}</span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Mail className="h-4 w-4 text-muted-foreground" />
                            <span className="text-muted-foreground">{appointment.customer.email}</span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Phone className="h-4 w-4 text-muted-foreground" />
                            <span className="text-muted-foreground">{appointment.customer.phone}</span>
                          </div>
                        </div>
                      </div>
                    </div>

{/* Action Buttons */}
{(appointment.appointment.status === 'pending' || 
  appointment.appointment.status === 'confirmed' || 
  appointment.appointment.status === 'rescheduled') && (
  <div className="mt-6 pt-4 border-t border-border">
    <div className="flex flex-wrap gap-3">
      {/* Cancel button (for pending, confirmed, and rescheduled) */}
      <Button
        variant="outline"
        size="sm"
        onClick={() => handleCancelAppointment(appointment.id)}
        disabled={cancellingId === appointment.id}
        className="flex items-center space-x-2 text-red-600 cursor-pointer hover:text-red-600 border-red-200 hover:bg-red-50"
      >
        {cancellingId === appointment.id ? (
          <div className="w-4 h-4 border-2 border-red-600 border-t-transparent rounded-full animate-spin"></div>
        ) : (
          <X className="h-4 w-4" />
        )}
        <span>Cancel</span>
      </Button>

      {/* Reschedule button (only for pending) */}
      {appointment.appointment.status === 'pending' && (
        <Button
          variant="outline"
          size="sm"
          onClick={() => openRescheduleModal(appointment)}
          className="flex items-center space-x-2 text-blue-600 cursor-pointer hover:text-blue-600 border-blue-200 hover:bg-blue-50"
        >
          <Edit className="h-4 w-4" />
          <span>Reschedule</span>
        </Button>
      )}

      {/* Confirm button (only for rescheduled) */}
      {appointment.appointment.status === 'rescheduled' && (
        <Button
          variant="outline"
          size="sm"
          onClick={() => handleConfirmRescheduled(appointment.id)}
          disabled={confirmingId === appointment.id}
          className="flex items-center space-x-2 text-green-600 cursor-pointer hover:text-green-600 border-green-200 hover:bg-green-50"
        >
          {confirmingId === appointment.id ? (
            <div className="w-4 h-4 border-2 border-green-600 border-t-transparent rounded-full animate-spin"></div>
          ) : (
            <Check className="h-4 w-4" />
          )}
          <span>Confirm</span>
        </Button>
      )}
    </div>
  </div>
)}


                    {/* Booking Date */}
                    <div className="mt-4 pt-4 border-t border-border">
                      <p className="text-xs text-muted-foreground">
                        Booked on {new Date(appointment.createdAt).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            /* Empty State */
            <Card className="shadow-luxury border-0 bg-white/95 backdrop-blur-sm">
              <CardContent className="text-center py-16">
                <div className="space-y-6 flex flex-col items-center justify-center">
                  <div className="w-24 h-24 bg-luxury-cream rounded-full mx-auto flex items-center justify-center">
                    <CalendarX className="h-12 w-12 text-luxury-gold" />
                  </div>
                  
                  <div className="space-y-2">
                    <h3 className="font-heading text-2xl font-semibold text-luxury-dark">
                      No Appointments Yet
                    </h3>
                    <p className="text-muted-foreground max-w-md mx-auto">
                      You haven&apos;t booked any appointments yet. Start your luxury experience by booking your first appointment.
                    </p>
                  </div>

                  <Button
                    variant="luxury"
                    size="lg"
                    onClick={() => router.push('/appointment')}
                    className="flex items-center space-x-2 cursor-pointer"
                  >
                    <Calendar className="h-5 w-5" />
                    <span>Book Your First Appointment</span>
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Reschedule Modal */}
      {rescheduleModal.appointment && (
        <RescheduleModal
          isOpen={rescheduleModal.isOpen}
          onClose={closeRescheduleModal}
          appointment={rescheduleModal.appointment}
          onReschedule={handleReschedule}
        />
      )}
    </div>
  );
}
