"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { 
  Calendar, 
  Clock, 
  User, 
  Phone, 
  Mail, 
  Package, 
  ChevronLeft, 
  ChevronRight,
  RefreshCw,
  Shield,
  Filter,
  Search,
  Edit,
  Check,
  X
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import RescheduleModal from "@/components/RescheduleModal";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

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
  userId?: string;
}

interface PaginationInfo {
  currentPage: number;
  totalPages: number;
  totalAppointments: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

export default function AdminPage() {
  const router = useRouter();
  const { user, isLoading: isAuthLoading } = useAuth();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [pagination, setPagination] = useState<PaginationInfo>({
    currentPage: 1,
    totalPages: 1,
    totalAppointments: 0,
    hasNextPage: false,
    hasPrevPage: false
  });
  const [filters, setFilters] = useState({
    status: '',
    search: '',
    date: ''
  });
  const [updatingStatus, setUpdatingStatus] = useState<string | null>(null);
  const [rescheduleModal, setRescheduleModal] = useState<{
    isOpen: boolean;
    appointment: Appointment | null;
  }>({ isOpen: false, appointment: null });

  const fetchAppointments = useCallback(async (page: number = 1) => {
    if (page === 1) {
      setIsLoading(true);
    } else {
      setIsRefreshing(true);
    }

    try {
      const queryParams = new URLSearchParams({
        page: page.toString(),
        limit: '10',
        sortBy: 'createdAt',
        sortOrder: 'desc'
      });

      // Add filters if they exist
      if (filters.status) queryParams.append('status', filters.status);
      if (filters.search) queryParams.append('search', filters.search);
      if (filters.date) queryParams.append('date', filters.date);

      const response = await fetch(`/api/admin/appointments?${queryParams}`);
      const data = await response.json();

      if (response.ok) {
        setAppointments(data.appointments || []);
        setPagination(data.pagination || {
          currentPage: page,
          totalPages: 1,
          totalAppointments: 0,
          hasNextPage: false,
          hasPrevPage: false
        });
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
  }, [filters]);

  // Check admin access
  useEffect(() => {
    if (!isAuthLoading && (!user || user.role !== 'admin')) {
      toast.error("Access denied. Admin privileges required.");
      router.push("/");
      return;
    }

    if (user && user.role === 'admin') {
      fetchAppointments(1);
    }
  }, [user, isAuthLoading, router, fetchAppointments]);

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= pagination.totalPages) {
      fetchAppointments(newPage);
    }
  };

  const handleFilterChange = (key: string, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const applyFilters = () => {
    fetchAppointments(1);
  };

  const clearFilters = () => {
    setFilters({ status: '', search: '', date: '' });
    setTimeout(() => fetchAppointments(1), 100);
  };

  const handleStatusUpdate = async (appointmentId: string, newStatus: string) => {
    setUpdatingStatus(appointmentId);
    
    try {
      const response = await fetch('/api/admin/appointments', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ appointmentId, status: newStatus }),
      });

      const data = await response.json();

      if (response.ok) {
        toast.success(`Appointment status updated to ${newStatus}`);
        // Update the appointment in the local state
        setAppointments(prev => 
          prev.map(apt => 
            apt.id === appointmentId 
              ? { ...apt, appointment: { ...apt.appointment, status: newStatus as 'pending' | 'confirmed' | 'completed' | 'cancelled' | 'rescheduled' } }
              : apt
          )
        );
      } else {
        toast.error(data.error || "Failed to update appointment status");
      }
    } catch (error) {
      console.error("Error updating appointment status:", error);
      toast.error("Something went wrong while updating appointment status");
    } finally {
      setUpdatingStatus(null);
    }
  };

  const handleAdminReschedule = async (appointmentId: string, newDate: string, newTime: string) => {
    try {
      const response = await fetch(`/api/appointments/${appointmentId}/reschedule`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          newDate, 
          newTime, 
          rescheduledBy: 'admin' 
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
                    status: 'rescheduled' as 'pending' | 'confirmed' | 'completed' | 'cancelled' | 'rescheduled'
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
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  if (isAuthLoading || isRefreshing) {
    return (
      <div className="min-h-screen bg-gradient-elegant flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-luxury-gold border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading admin dashboard...</p>
        </div>
      </div>
    );
  }

  if (!user || user.role !== 'admin') {
    return null;
  }

  return (
    <div className="min-h-screen cursor-default bg-gradient-elegant py-12">
      <div className="container mx-auto px-6 mt-20 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center mb-4">
            <Shield className="h-8 w-8 text-luxury-gold mr-3" />
            <h1 className="text-4xl lg:text-6xl font-heading font-bold text-foreground">
              Admin Dashboard
            </h1>
          </div>
          <p className="text-xl text-muted-foreground font-body">
            Manage all salon appointments
          </p>
        </div>

        <div className="max-w-7xl mx-auto">
          {/* Filters and Actions */}
          <Card className="shadow-luxury border-0 bg-white/95 backdrop-blur-sm mb-8">
            <CardHeader>
              <CardTitle className="font-heading text-xl text-luxury-dark flex items-center">
                <Filter className="h-5 w-5 mr-2" />
                Filters & Actions
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-4 gap-4 mb-4">
                <div className="space-y-2">
                  <Label htmlFor="search">Search</Label>
                  <Input
                    id="search"
                    placeholder="Customer name or email"
                    value={filters.search}
                    onChange={(e) => handleFilterChange('search', e.target.value)}
                    className="h-10"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="status">Status</Label>
                  <select
                    id="status"
                    value={filters.status}
                    onChange={(e) => handleFilterChange('status', e.target.value)}
                    className="w-full h-10 px-3 rounded-md cursor-pointer border border-border bg-background"
                  >
                    <option value="">All Statuses</option>
                    <option value="pending">Pending</option>
                    <option value="confirmed">Confirmed</option>
                    <option value="completed">Completed</option>
                    <option value="cancelled">Cancelled</option>
                    <option value="rescheduled">Rescheduled</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="date">Date</Label>
                  <Input
                    id="date"
                    type="date"
                    value={filters.date}
                    onChange={(e) => handleFilterChange('date', e.target.value)}
                    className="h-10"
                  />
                </div>
                <div className="space-y-2">
                  <Label>&nbsp;</Label>
                  <div className="flex space-x-2">
                    <Button
                      onClick={applyFilters}
                      variant="luxury"
                      size="sm"
                      className="flex cursor-pointer items-center space-x-1"
                    >
                      <Search className="h-4 w-4" />
                      <span>Apply</span>
                    </Button>
                    <Button
                      onClick={clearFilters}
                      variant="outline"
                      size="sm"
                      className="cursor-pointer"
                    >
                      Clear
                    </Button>
                  </div>
                </div>
              </div>

              <div className="flex justify-between items-center">
                <div className="text-sm text-muted-foreground">
                  Showing {appointments.length} of {pagination.totalAppointments} appointments
                </div>
                <Button
                  onClick={() => fetchAppointments(pagination.currentPage)}
                  disabled={isRefreshing}
                  variant="outline"
                  size="sm"
                  className="flex items-center cursor-pointer space-x-2"
                >
                  <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                  <span>Refresh</span>
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Appointments List */}
          {appointments.length > 0 || isLoading? (
            <div className="space-y-6">
              {appointments.map((appointment) => (
                <Card key={appointment.id} className="shadow-luxury border-0 bg-white/95 backdrop-blur-sm">
                  <CardHeader className="pb-4 cursor-default">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                      <div>
                        <CardTitle className="font-heading text-xl text-luxury-dark">
                          {appointment.service.name}
                        </CardTitle>
                        <p className="text-sm text-muted-foreground mt-1">
                          Booked on {new Date(appointment.createdAt).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </p>
                      </div>
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
                    <div className="grid cursor-default md:grid-cols-3 gap-6">
                      {/* Customer Details */}
                      <div className="space-y-4">
                        <h3 className="font-heading text-lg font-semibold text-luxury-gold flex items-center">
                          <User className="h-4 w-4 mr-2" />
                          Customer Details
                        </h3>
                        <div className="space-y-2 text-sm">
                          <div className="flex items-center space-x-2">
                            <User className="h-4 w-4 text-muted-foreground" />
                            <span className="font-medium">{appointment.customer.name}</span>
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

                      {/* Service Details */}
                      <div className="space-y-4">
                        <h3 className="font-heading text-lg font-semibold text-luxury-gold flex items-center">
                          <Package className="h-4 w-4 mr-2" />
                          Service Details
                        </h3>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-start gap-x-2">
                            <span className="text-muted-foreground">Duration:</span>
                            <span className="font-medium">{appointment.service.duration}</span>
                          </div>
                          <div className="flex justify-start gap-x-2">
                            <span className="text-muted-foreground">Price:</span>
                            <span className="font-medium text-luxury-gold">{appointment.service.price}</span>
                          </div>
                          <div className="flex justify-start gap-x-2">
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
                        </div>
                      </div>
                    </div>

                    {/* Admin Action Buttons */}
                    {(appointment.appointment.status === 'pending' || appointment.appointment.status === 'confirmed' || appointment.appointment.status === 'rescheduled') && (
  <div className="mt-6 pt-4 border-t border-border">
    <div className="flex flex-wrap gap-2">
      {/* Confirm button (only if not already confirmed) */}
      {appointment.appointment.status !== 'confirmed' && (
        <Button
          variant="outline"
          size="sm"
          onClick={() => handleStatusUpdate(appointment.id, 'confirmed')}
          disabled={updatingStatus === appointment.id}
          className="flex items-center space-x-1 text-green-600 cursor-pointer hover:text-green-600 border-green-200 hover:bg-green-50"
        >
          {updatingStatus === appointment.id ? (
            <div className="w-3 h-3 border-2 border-green-600 border-t-transparent rounded-full animate-spin"></div>
          ) : (
            <Check className="h-3 w-3" />
          )}
          <span>Confirm</span>
        </Button>
      )}

      {/* Complete button - always show for actionable appointments */}
      <Button
        variant="outline"
        size="sm"
        onClick={() => handleStatusUpdate(appointment.id, 'completed')}
        disabled={updatingStatus === appointment.id}
        className="flex items-center space-x-1 text-blue-600 cursor-pointer hover:text-blue-600 border-blue-200 hover:bg-blue-50"
      >
        {updatingStatus === appointment.id ? (
          <div className="w-3 h-3 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
        ) : (
          <Check className="h-3 w-3" />
        )}
        <span>Complete</span>
      </Button>

      {/* Cancel button - always show for actionable appointments */}
      <Button
        variant="outline"
        size="sm"
        onClick={() => handleStatusUpdate(appointment.id, 'cancelled')}
        disabled={updatingStatus === appointment.id}
        className="flex items-center space-x-1 text-red-600 cursor-pointer hover:text-red-600 border-red-200 hover:bg-red-50"
      >
        {updatingStatus === appointment.id ? (
          <div className="w-3 h-3 border-2 border-red-600 border-t-transparent rounded-full animate-spin"></div>
        ) : (
          <X className="h-3 w-3" />
        )}
        <span>Cancel</span>
      </Button>

       {/* Reschedule (only if not completed/cancelled) */}
       <Button
         variant="outline"
         size="sm"
         onClick={() => openRescheduleModal(appointment)}
         className="flex items-center space-x-1 text-purple-600 cursor-pointer hover:text-purple-600 border-purple-200 hover:bg-purple-50"
       >
         <Edit className="h-3 w-3" />
         <span>Reschedule</span>
       </Button>
    </div>
  </div>
)}

                  </CardContent>
                </Card>
              ))}

              {/* Pagination */}
              <Card className="shadow-luxury border-0 bg-white/95 backdrop-blur-sm">
                <CardContent className="py-6">
                  <div className="flex items-center justify-between">
                    <div className="text-sm text-muted-foreground">
                      Page {pagination.currentPage} of {pagination.totalPages}
                    </div>
                    <div className="flex items-center space-x-2">
                      <Button
                        onClick={() => handlePageChange(pagination.currentPage - 1)}
                        disabled={!pagination.hasPrevPage}
                        variant="outline"
                        size="sm"
                        className="flex items-center space-x-1"
                      >
                        <ChevronLeft className="h-4 w-4" />
                      </Button>
                      <span className="px-4 py-2 text-sm font-medium">
                        {pagination.currentPage}
                      </span>
                      <Button
                        onClick={() => handlePageChange(pagination.currentPage + 1)}
                        disabled={!pagination.hasNextPage}
                        variant="outline"
                        size="sm"
                        className="flex items-center space-x-1"
                      >
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          ) : (
            /* Empty State */
            <Card className="shadow-luxury border-0 bg-white/95 backdrop-blur-sm">
              <CardContent className="text-center py-16">
                <div className="space-y-6">
                  <div className="w-24 h-24 bg-luxury-cream rounded-full mx-auto flex items-center justify-center">
                    <Calendar className="h-12 w-12 text-luxury-gold" />
                  </div>
                  
                  <div className="space-y-2">
                    <h3 className="font-heading text-2xl font-semibold text-luxury-dark">
                      No Appointments Found
                    </h3>
                    <p className="text-muted-foreground max-w-md mx-auto">
                      No appointments match your current filters. Try adjusting your search criteria.
                    </p>
                  </div>

                  <Button
                    variant="luxury"
                    size="lg"
                    onClick={clearFilters}
                    className="flex items-center space-x-2"
                  >
                    <RefreshCw className="h-5 w-5" />
                    <span>Clear Filters</span>
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
          onReschedule={handleAdminReschedule}
        />
      )}
    </div>
  );
}
