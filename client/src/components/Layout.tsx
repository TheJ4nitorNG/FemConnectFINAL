import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { LogOut, User, Search, MessageCircle, Shield, Camera, X, Sun, Moon, Menu } from "lucide-react";
import { useState } from "react";
import { useTheme } from "./ThemeProvider";
import logoImg from "@/assets/logo-header.png";

const PROFILE_PICTURE_REQUIRED_AFTER = new Date("2026-01-08T00:00:00Z");

export function Layout({ children }: { children: React.ReactNode }) {
  const { user, logout } = useAuth();
  const [location, setLocation] = useLocation();
  const [bannerDismissed, setBannerDismissed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { theme, toggleTheme } = useTheme();

  if (!user) return <>{children}</>;

  const isExistingUserWithoutPic = !user.profilePicture && user.createdAt && new Date(user.createdAt) < PROFILE_PICTURE_REQUIRED_AFTER;
  const showProfilePicBanner = isExistingUserWithoutPic && !bannerDismissed;

  const navItems = [
    { href: "/", label: "Discover", icon: Search },
    { href: "/messages", label: "Messages", icon: MessageCircle },
    { href: `/profile/${user.id}`, label: "My Profile", icon: User },
    ...(user.isAdmin ? [{ href: "/admin", label: "Mod Panel", icon: Shield }] : []),
  ];

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <nav className="sticky top-0 z-50 bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border-b border-purple-100 dark:border-purple-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <Link href="/" className="flex items-center gap-2 group cursor-pointer">
              <img src={logoImg} alt="FemConnect" className="h-14 w-auto group-hover:scale-105 transition-transform" />
            </Link>

            <div className="flex items-center gap-4 md:gap-6">
              <div className="hidden md:flex items-center gap-1">
                {navItems.map((item) => {
                  const isActive = location === item.href;
                  return (
                    <Link key={item.href} href={item.href}>
                      <div className={`
                        flex items-center gap-2 px-4 py-2 rounded-full cursor-pointer transition-all duration-200
                        ${isActive 
                          ? "bg-purple-100 dark:bg-purple-900/50 text-purple-700 dark:text-purple-300 font-medium" 
                          : "text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white"}
                      `}>
                        <item.icon className="w-4 h-4" />
                        <span>{item.label}</span>
                      </div>
                    </Link>
                  );
                })}
              </div>

              <div className="h-6 w-px bg-gray-200 dark:bg-gray-700 hidden md:block" />

              <div className="flex items-center gap-2 md:gap-3">
                <button
                  onClick={toggleTheme}
                  className="p-2 text-gray-500 dark:text-gray-400 hover:text-purple-600 dark:hover:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-900/30 rounded-full transition-colors"
                  title={theme === "light" ? "Switch to dark mode" : "Switch to light mode"}
                  data-testid="button-theme-toggle"
                >
                  {theme === "light" ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
                </button>
                
                <span className="text-sm font-medium text-gray-600 dark:text-gray-300 hidden sm:block">
                  Hi, {user.username}
                </span>
                
                <button
                  onClick={() => logout()}
                  className="p-2 text-gray-500 dark:text-gray-400 hover:text-red-500 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-full transition-colors"
                  title="Logout"
                  data-testid="button-logout"
                >
                  <LogOut className="w-5 h-5" />
                </button>
                
                <button
                  onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                  className="md:hidden p-2 text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors"
                  data-testid="button-mobile-menu"
                >
                  <Menu className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
          
          {mobileMenuOpen && (
            <div className="md:hidden border-t border-gray-100 dark:border-gray-800 py-2">
              {navItems.map((item) => {
                const isActive = location === item.href;
                return (
                  <Link key={item.href} href={item.href}>
                    <div 
                      onClick={() => setMobileMenuOpen(false)}
                      className={`
                        flex items-center gap-3 px-4 py-3 cursor-pointer transition-all
                        ${isActive 
                          ? "bg-purple-50 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 font-medium" 
                          : "text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800"}
                      `}
                    >
                      <item.icon className="w-5 h-5" />
                      <span>{item.label}</span>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </nav>

      {showProfilePicBanner && (
        <div className="bg-gradient-to-r from-pink-500 to-purple-500 text-white px-4 py-3">
          <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <Camera className="w-5 h-5 shrink-0" />
              <p className="text-sm font-medium">
                Please add a profile picture to verify you're a real person and improve your experience!
              </p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={() => setLocation(`/profile/${user.id}`)}
                className="px-3 py-1.5 bg-white text-purple-600 text-sm font-medium rounded-lg hover:bg-purple-50 transition-colors"
                data-testid="button-add-profile-pic"
              >
                Add Photo
              </button>
              <button
                onClick={() => setBannerDismissed(true)}
                className="p-1 hover:bg-white/20 rounded transition-colors"
                title="Dismiss"
                data-testid="button-dismiss-banner"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-enter">
        {children}
      </main>
    </div>
  );
}
