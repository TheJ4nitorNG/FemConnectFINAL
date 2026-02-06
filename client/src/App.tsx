import { Switch, Route, Redirect } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { useAuth } from "@/hooks/use-auth";
import { Loader2 } from "lucide-react";
import { ThemeProvider } from "@/components/ThemeProvider";
import { InstallPrompt } from "@/components/InstallPrompt";

import Landing from "@/pages/Landing";
import AuthPage from "@/pages/Auth";
import Dashboard from "@/pages/Dashboard";
import Profile from "@/pages/Profile";
import Messages from "@/pages/Messages";
import ResetPassword from "@/pages/ResetPassword";
import Admin from "@/pages/Admin";
import CompleteProfile from "@/pages/CompleteProfile";
import PrivacyPolicy from "@/pages/PrivacyPolicy";
import TermsOfService from "@/pages/TermsOfService";
import NotFound from "@/pages/not-found";

const PROFILE_PICTURE_REQUIRED_AFTER = new Date("2026-01-08T00:00:00Z");

// Check if a user is required to have a profile picture (created after the cutoff date)
// IMPORTANT: If createdAt is missing, treat as existing user (not required) to avoid locking out legacy accounts
function isProfilePictureRequired(user: { createdAt?: Date | string | null; profilePicture?: string | null }) {
  if (user.profilePicture) return false;
  if (!user.createdAt) return false; // Existing users without createdAt are NOT required
  const createdAt = new Date(user.createdAt);
  return createdAt >= PROFILE_PICTURE_REQUIRED_AFTER;
}

// Wrapper for protected routes
function ProtectedRoute({ component: Component, allowWithoutProfilePic = false }: { component: React.ComponentType; allowWithoutProfilePic?: boolean }) {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="w-12 h-12 text-purple-500 animate-spin" />
      </div>
    );
  }

  if (!user) {
    return <Redirect to="/login" />;
  }

  if (!allowWithoutProfilePic && isProfilePictureRequired(user)) {
    return <Redirect to="/complete-profile" />;
  }

  return <Component />;
}

function Router() {
  const { user, isLoading } = useAuth();

  if (isLoading) {
     return (
       <div className="min-h-screen flex items-center justify-center bg-white">
         <div className="animate-pulse flex flex-col items-center gap-4">
           <div className="w-12 h-12 bg-gray-200 rounded-full"></div>
           <div className="h-4 w-32 bg-gray-200 rounded"></div>
         </div>
       </div>
     );
  }

  return (
    <Switch>
      <Route path="/">
        {user ? (isProfilePictureRequired(user) ? <Redirect to="/complete-profile" /> : <Dashboard />) : <Landing />}
      </Route>
      
      <Route path="/login" component={AuthPage} />
      <Route path="/register" component={AuthPage} />
      <Route path="/reset-password" component={ResetPassword} />
      <Route path="/privacy" component={PrivacyPolicy} />
      <Route path="/terms" component={TermsOfService} />
      <Route path="/complete-profile">
        {() => <ProtectedRoute component={CompleteProfile} allowWithoutProfilePic={true} />}
      </Route>
      
      {/* Protected Routes */}
      <Route path="/dashboard">
         {() => <ProtectedRoute component={Dashboard} />}
      </Route>
      
      <Route path="/profile/:id">
         {() => <ProtectedRoute component={Profile} />}
      </Route>

      <Route path="/messages">
         {() => <ProtectedRoute component={Messages} />}
      </Route>

      <Route path="/admin">
         {() => <ProtectedRoute component={Admin} />}
      </Route>

      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <Router />
        <InstallPrompt />
        <Toaster />
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
