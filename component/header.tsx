"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { LogOut } from "lucide-react";
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
        <Link href="/" className="font-heading text-2xl font-bold text-luxury-gold">
          Luxe Salon
        </Link>
        
        <div className="hidden md:flex items-center space-x-8">
          <Link 
            href="/" 
            className={`text-sm font-medium transition-colors hover:text-luxury-gold ${
              location === "/" ? "text-luxury-gold" : "text-foreground"
            }`}
          >
            Home
          </Link>
          <Link 
            href="/appointment" 
            className={`text-sm font-medium transition-colors hover:text-luxury-gold ${
              location === "/appointment" ? "text-luxury-gold" : "text-foreground"
            }`}
          >
            Book Appointment
          </Link>
          {user && (
            <Link 
              href="/bookings" 
              className={`text-sm font-medium transition-colors hover:text-luxury-gold ${
                location === "/bookings" ? "text-luxury-gold" : "text-foreground"
              }`}
            >
              My Bookings
            </Link>
          )}
          {user && user.role === "admin" && (
            <Link 
              href={`/admin/${user.id}/sal`}
              className={`text-sm font-medium transition-colors hover:text-luxury-gold ${
                location.startsWith("/admin") ? "text-luxury-gold" : "text-foreground"
              }`}
            >
              Admin Panel
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
                    Logout
                    <LogOut className="h-4 w-4" />
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