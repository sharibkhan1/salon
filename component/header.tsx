"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { CalendarCheck, CalendarPlus, Home, LogOut, Shield } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

const Header = () => {
  const location = usePathname();
  const router = useRouter();
  const { user, logout: authLogout } = useAuth();
  const [isLoading, setIsLoading] = useState(false);

  const handleLogout = async () => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/auth/logout", {
        method: "POST",
      });

      if (response.ok) {
        authLogout(); // Use the auth hook logout function
        toast.success("Logged out successfully");
        router.push("/");
      } else {
        toast.error("Logout failed");
      }
    } catch (error) {
      console.error("Logout error:", error);
      toast.error("Something went wrong");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50 px-4 bg-background/95 backdrop-blur-sm border-b border-border">
      <nav className="luxury-container flex items-center justify-between py-4">
        <Link href="/" className="font-heading text-xl md:text-2xl font-bold text-luxury-gold">
        <span className="hidden md:block">Tangerine Beauty </span>
        <span className="md:hidden">Tangerine</span>
        </Link>
        
        <div className="flex items-center space-x-4 md:space-x-8">
          <Link 
            href="/" 
            className={`text-sm font-medium transition-colors hover:text-luxury-gold ${
              location === "/" ? "text-luxury-gold" : "text-foreground"
            }`}
          >
            <span className="hidden md:block">Home</span>
            <span className="md:hidden"><Home className="h-6 w-6"/></span>
          </Link>
          <Link 
            href="/appointment" 
            className={`text-sm font-medium transition-colors hover:text-luxury-gold ${
              location === "/appointment" ? "text-luxury-gold" : "text-foreground"
            }`}
          >
            <span className="hidden md:block">Book Appointment</span>
            <span className="md:hidden"><CalendarPlus className="h-6 w-6"/></span>
          </Link>
          {user && (
            <Link 
              href="/bookings" 
              className={`text-sm font-medium transition-colors hover:text-luxury-gold ${
                location === "/bookings" ? "text-luxury-gold" : "text-foreground"
              }`}
            > 
              <span className="hidden md:block">My Bookings</span>
              <span className="md:hidden"><CalendarCheck className="h-6 w-6"/></span>
            </Link>
          )}
          {user && user.role === "admin" && (
            <Link 
              href={`/admin/${user.id}/sal`}
              className={`text-sm font-medium transition-colors hover:text-luxury-gold ${
                location.startsWith("/admin") ? "text-luxury-gold" : "text-foreground"
              }`}
            >
              <span className="hidden md:block">Admin Panel</span>
              <span className="md:hidden"><Shield className="h-6 w-6"/></span>
            </Link>
          )}
        </div>

        <div className="flex items-center space-x-4">
          {user ? (
            <div className="flex items-center space-x-3">
              <Button
                variant="luxury"
                size="sm"
                onClick={handleLogout}
                disabled={isLoading}
                className="py-2 px-4 cursor-pointer"
              >
                {isLoading ? (
                  <div className="w-4 h-4 border-2 border-luxury-gold border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <>
                    
                    <span className="hidden md:block">Logout</span>
                    <span className=""><LogOut className="h-4 w-4"/></span>
                  </>
                )}
              </Button>
            </div>
          ) : (
            <div className="flex items-center space-x-3">
              <Link href="/auth/login">
                <Button variant="ghost" size="sm" className="cursor-pointer">
                  Login
                </Button>
              </Link>
              <Link href="/auth/signin">
                <Button variant="luxury" size="sm" className="cursor-pointer">
                  Sign Up
                </Button>
              </Link>
            </div>
          )}
        </div>
      </nav>
    </header>
  );
};

export default Header;