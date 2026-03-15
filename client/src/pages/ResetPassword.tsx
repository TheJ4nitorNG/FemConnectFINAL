import { useState, useEffect } from "react";
import { Link, useLocation, useSearch } from "wouter";
import { Loader2, ShieldCheck, AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

export default function ResetPassword() {
  const [, setLocation] = useLocation();
  const search = useSearch();
  const token = new URLSearchParams(search).get("token");
  
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");
  const { toast } = useToast();

  useEffect(() => {
    if (!token) {
      setError("Invalid reset link. Please request a new password reset.");
    }
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (password.length < 10) {
      toast({ title: "Password must be at least 10 characters", variant: "destructive" });
      return;
    }
    
    if (password !== confirmPassword) {
      toast({ title: "That doesn't match!", variant: "destructive" });
      return;
    }

    setIsSubmitting(true);
    setError("");
    
    try {
      const response = await apiRequest("POST", "/api/auth/password-reset/confirm", { 
        token, 
        password 
      });
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || "FAILED! womp womp");
      }
      
      setSuccess(true);
    } catch (err: any) {
      setError(err.message || "OOPS! Try that again");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-50 via-white to-purple-50 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <Link href="/">
              <h1 className="text-3xl font-display font-bold cursor-pointer hover:opacity-80 transition-opacity bg-clip-text text-transparent bg-gradient-to-r from-pink-600 to-purple-600">
                FemConnect
              </h1>
            </Link>
          </div>

          <div className="bg-white rounded-3xl shadow-xl border border-white/50 backdrop-blur-sm p-8 text-center">
            <div className="w-16 h-16 mx-auto bg-green-100 rounded-full flex items-center justify-center mb-4">
              <ShieldCheck className="w-8 h-8 text-green-600" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">You did it!</h2>
            <p className="text-gray-600 mb-6">
              Your password has been successfully reset. Nao use it to log in.
            </p>
            <Link href="/login">
              <button
                data-testid="button-go-to-login"
                className="w-full py-3.5 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl font-bold shadow-lg hover:shadow-xl hover:scale-[1.01] active:scale-[0.99] transition-all"
              >
                Go to Login
              </button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (error && !token) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-50 via-white to-purple-50 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <Link href="/">
              <h1 className="text-3xl font-display font-bold cursor-pointer hover:opacity-80 transition-opacity bg-clip-text text-transparent bg-gradient-to-r from-pink-600 to-purple-600">
                FemConnect
              </h1>
            </Link>
          </div>

          <div className="bg-white rounded-3xl shadow-xl border border-white/50 backdrop-blur-sm p-8 text-center">
            <div className="w-16 h-16 mx-auto bg-red-100 rounded-full flex items-center justify-center mb-4">
              <AlertCircle className="w-8 h-8 text-red-600" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">That's not teh right link!</h2>
            <p className="text-gray-600 mb-6">
              {error}
            </p>
            <Link href="/login">
              <button
                data-testid="button-back-to-login"
                className="w-full py-3.5 bg-gradient-to-r from-gray-900 to-gray-800 text-white rounded-xl font-bold shadow-lg hover:shadow-xl hover:scale-[1.01] active:scale-[0.99] transition-all"
              >
                Back to Login
              </button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-white to-purple-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/">
            <h1 className="text-3xl font-display font-bold cursor-pointer hover:opacity-80 transition-opacity bg-clip-text text-transparent bg-gradient-to-r from-pink-600 to-purple-600">
              FemConnect
            </h1>
          </Link>
        </div>

        <div className="bg-white rounded-3xl shadow-xl border border-white/50 backdrop-blur-sm p-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-2 text-center">Set New Password</h2>
          <p className="text-gray-600 mb-6 text-center text-sm">
            Make a new password, n make it STRONK.
          </p>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">New Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                data-testid="input-new-password"
                className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-200 focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 outline-none transition-all"
                placeholder="Enter da new pass"
                minLength={10}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Confirm Password</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                data-testid="input-confirm-password"
                className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-200 focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 outline-none transition-all"
                placeholder="Confirm dat shi"
                minLength={10}
              />
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              data-testid="button-reset-password"
              className="w-full py-3.5 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl font-bold shadow-lg hover:shadow-xl hover:scale-[1.01] active:scale-[0.99] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isSubmitting ? <Loader2 className="animate-spin w-5 h-5" /> : "Reset teh password"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
