"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar } from "@/components/ui/calendar";
import { toast } from "sonner";
import { X, Calendar as CalendarIcon, Clock } from "lucide-react";
import { TIME_SLOTS } from "@/lib/timeslot";

interface RescheduleModalProps {
  isOpen: boolean;
  onClose: () => void;
  appointment: {
    id: string;
    service: {
      name: string;
    };
    appointment: {
      date: string;
      time: string;
    };
  };
  onReschedule: (appointmentId: string, newDate: string, newTime: string) => Promise<void>;
}

export default function RescheduleModal({ 
  isOpen, 
  onClose, 
  appointment, 
  onReschedule 
}: RescheduleModalProps) {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [selectedTime, setSelectedTime] = useState<string>("");
  const [isRescheduling, setIsRescheduling] = useState(false);

  if (!isOpen) return null;

  const handleReschedule = async () => {
    if (!selectedDate || !selectedTime) {
      toast.error("Please select both date and time");
      return;
    }

    setIsRescheduling(true);
    try {
      await onReschedule(appointment.id, selectedDate.toISOString(), selectedTime);
      onClose();
      setSelectedDate(undefined);
      setSelectedTime("");
    } catch (error) {
      console.error("Reschedule error:", error);
    } finally {
      setIsRescheduling(false);
    }
  };

  const formatCurrentDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-4xl max-h-[90vh] overflow-y-auto luxury-shadow">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <div>
            <CardTitle className="text-2xl font-playfair font-bold text-luxury-dark">
              Reschedule Appointment
            </CardTitle>
            <p className="text-muted-foreground mt-1">
              {appointment.service.name}
            </p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="h-8 w-8 p-0"
          >
            <X className="h-4 w-4" />
          </Button>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Current Appointment Details */}
          <div className="bg-luxury-cream/50 p-4 rounded-lg">
            <h3 className="font-semibold text-luxury-dark mb-2 flex items-center">
              <CalendarIcon className="h-4 w-4 mr-2" />
              Current Appointment
            </h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-muted-foreground">Date:</span>
                <p className="font-medium">{formatCurrentDate(appointment.appointment.date)}</p>
              </div>
              <div>
                <span className="text-muted-foreground">Time:</span>
                <p className="font-medium">{appointment.appointment.time}</p>
              </div>
            </div>
          </div>

          {/* New Date & Time Selection */}
          <div className="grid lg:grid-cols-2 gap-8">
            <div className="space-y-4">
              <h3 className="text-xl font-playfair font-semibold flex items-center">
                <CalendarIcon className="h-5 w-5 mr-2 text-luxury-gold" />
                Select New Date
              </h3>
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={setSelectedDate}
                disabled={(date) => date < new Date()}
                className="rounded-xl border luxury-shadow"
              />
            </div>
            
            <div className="space-y-4">
              <h3 className="text-xl font-playfair font-semibold flex items-center">
                <Clock className="h-5 w-5 mr-2 text-luxury-gold" />
                Select New Time
              </h3>
              <div className="grid grid-cols-2 gap-3">
                {TIME_SLOTS.map((time) => (
                  <button
                    key={time}
                    onClick={() => setSelectedTime(time)}
                    className={`p-3 rounded-lg border transition-all duration-300 font-medium cursor-pointer ${
                      selectedTime === time
                        ? "border-luxury-gold bg-luxury-gold text-white"
                        : "border-border hover:border-luxury-gold/50 hover:bg-luxury-gold/10"
                    }`}
                  >
                    {time}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Selected New Appointment Preview */}
          {selectedDate && selectedTime && (
            <div className="bg-luxury-gold/10 p-4 rounded-lg border border-luxury-gold/20">
              <h3 className="font-semibold text-luxury-dark mb-2">
                New Appointment Details
              </h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">New Date:</span>
                  <p className="font-medium">{formatCurrentDate(selectedDate.toISOString())}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">New Time:</span>
                  <p className="font-medium">{selectedTime}</p>
                </div>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex justify-end space-x-3 pt-4 border-t">
            <Button
              variant="outline"
              onClick={onClose}
              disabled={isRescheduling}
              className="cursor-pointer"
            >
              Cancel
            </Button>
            <Button
              onClick={handleReschedule}
              disabled={!selectedDate || !selectedTime || isRescheduling}
              className="bg-luxury-gold hover:bg-luxury-gold/90 cursor-pointer"
            >
              {isRescheduling ? (
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Rescheduling...</span>
                </div>
              ) : (
                "Confirm Reschedule"
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
