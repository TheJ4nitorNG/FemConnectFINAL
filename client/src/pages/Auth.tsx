import { useState, useEffect, useRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useAuth } from "@/hooks/use-auth";
import { Link, useLocation } from "wouter";
import { api, ROLES, LOCATIONS, SUBREGIONS, REGIONS } from "@shared/routes";
import { SEEKING_TYPES, RELATIONSHIP_TYPES, GAMING_PLATFORMS, INPUT_PREFERENCES, MEETING_PREFERENCES } from "@shared/schema";
import { Loader2, ArrowRight, ShieldCheck, ArrowLeft, Check, Circle, Upload, Camera } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useUpload } from "@/hooks/use-upload";

export default function AuthPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [, setLocation] = useLocation();
  const { user } = useAuth();

  // Redirect if already logged in
  if (user) {
    setLocation("/");
    return null;
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
          <p className="text-gray-500 mt-2">Find your perfect match today</p>
        </div>

        <div className="bg-white rounded-3xl shadow-xl border border-white/50 backdrop-blur-sm overflow-hidden">
          <div className="flex border-b border-gray-100">
            <button
              onClick={() => setIsLogin(true)}
              className={`flex-1 py-4 text-sm font-semibold transition-colors ${
                isLogin ? "text-purple-600 bg-purple-50/50" : "text-gray-500 hover:text-gray-700"
              }`}
            >
              Sign In
            </button>
            <button
              onClick={() => setIsLogin(false)}
              className={`flex-1 py-4 text-sm font-semibold transition-colors ${
                !isLogin ? "text-purple-600 bg-purple-50/50" : "text-gray-500 hover:text-gray-700"
              }`}
            >
              Create Account
            </button>
          </div>

          <div className="p-6 sm:p-8">
            <AnimatePresence mode="wait">
              {isLogin ? (
                <motion.div
                  key="login"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ duration: 0.2 }}
                >
                  <LoginForm />
                </motion.div>
              ) : (
                <motion.div
                  key="register"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.2 }}
                >
                  <RegisterForm />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
}

function LoginForm() {
  const { login, isLoggingIn } = useAuth();
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const usernameRef = useRef<HTMLInputElement>(null);
  const passwordRef = useRef<HTMLInputElement>(null);
  const form = useForm<z.infer<typeof api.auth.login.input>>({
    resolver: zodResolver(api.auth.login.input),
    defaultValues: { username: "", password: "" },
  });

  // Force text color on iOS via JavaScript
  useEffect(() => {
    const forceColor = (el: HTMLInputElement | null) => {
      if (el) {
        el.style.setProperty('color', '#111827', 'important');
        el.style.setProperty('-webkit-text-fill-color', '#111827', 'important');
      }
    };
    forceColor(usernameRef.current);
    forceColor(passwordRef.current);
    
    // Also add input event listeners to keep forcing the color
    const handleInput = (e: Event) => {
      const target = e.target as HTMLInputElement;
      target.style.setProperty('color', '#111827', 'important');
      target.style.setProperty('-webkit-text-fill-color', '#111827', 'important');
    };
    
    usernameRef.current?.addEventListener('input', handleInput);
    passwordRef.current?.addEventListener('input', handleInput);
    
    return () => {
      usernameRef.current?.removeEventListener('input', handleInput);
      passwordRef.current?.removeEventListener('input', handleInput);
    };
  }, []);

  if (showForgotPassword) {
    return <ForgotPasswordForm onBack={() => setShowForgotPassword(false)} />;
  }

  return (
    <form onSubmit={form.handleSubmit((data) => login(data))} className="space-y-4">
      <div className="space-y-2">
        <label className="text-sm font-medium text-gray-700">Username</label>
        <input
          {...form.register("username")}
          ref={(e) => {
            form.register("username").ref(e);
            (usernameRef as any).current = e;
          }}
          data-testid="input-username"
          className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 outline-none transition-all ios-input-fix"
          placeholder="Enter your username"
          autoComplete="username"
        />
        {form.formState.errors.username && (
          <p className="text-xs text-red-500">{form.formState.errors.username.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium text-gray-700">Password</label>
        <input
          type="password"
          {...form.register("password")}
          ref={(e) => {
            form.register("password").ref(e);
            (passwordRef as any).current = e;
          }}
          data-testid="input-password"
          className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 outline-none transition-all ios-input-fix"
          placeholder="Enter your password"
          autoComplete="current-password"
        />
        {form.formState.errors.password && (
          <p className="text-xs text-red-500">{form.formState.errors.password.message}</p>
        )}
      </div>

      <div className="flex justify-end">
        <button
          type="button"
          onClick={() => setShowForgotPassword(true)}
          data-testid="link-forgot-password"
          className="text-sm text-purple-600 hover:text-purple-700 hover:underline"
        >
          Forgot password?
        </button>
      </div>

      <button
        type="submit"
        disabled={isLoggingIn}
        data-testid="button-login"
        className="w-full py-3.5 bg-gradient-to-r from-gray-900 to-gray-800 text-white rounded-xl font-bold shadow-lg hover:shadow-xl hover:scale-[1.01] active:scale-[0.99] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
      >
        {isLoggingIn ? <Loader2 className="animate-spin w-5 h-5" /> : "Sign In"}
      </button>
    </form>
  );
}

function ForgotPasswordForm({ onBack }: { onBack: () => void }) {
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      toast({ title: "Please enter your email address", variant: "destructive" });
      return;
    }

    setIsSubmitting(true);
    try {
      await apiRequest("POST", "/api/auth/password-reset/request", { email: email.trim() });
      setSubmitted(true);
    } catch (error) {
      toast({ title: "Something went wrong. Please try again.", variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className="space-y-4 text-center">
        <div className="w-16 h-16 mx-auto bg-green-100 rounded-full flex items-center justify-center">
          <ShieldCheck className="w-8 h-8 text-green-600" />
        </div>
        <h3 className="text-lg font-semibold text-gray-900">Check your email</h3>
        <p className="text-sm text-gray-600">
          If an account exists with that email, we've sent you a password reset link. Please check your inbox and spam folder.
        </p>
        <button
          onClick={onBack}
          className="text-sm text-purple-600 hover:text-purple-700 hover:underline flex items-center justify-center gap-1 mx-auto"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to login
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <button
        type="button"
        onClick={onBack}
        className="text-sm text-gray-600 hover:text-gray-900 flex items-center gap-1"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to login
      </button>

      <div className="text-center">
        <h3 className="text-lg font-semibold text-gray-900">Reset your password</h3>
        <p className="text-sm text-gray-600 mt-1">
          Enter your email address and we'll send you a link to reset your password.
        </p>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium text-gray-700">Email Address</label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          data-testid="input-forgot-email"
          className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 outline-none transition-all ios-input-fix"
          placeholder="Enter your email"
        />
      </div>

      <button
        type="submit"
        disabled={isSubmitting}
        data-testid="button-reset-request"
        className="w-full py-3.5 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl font-bold shadow-lg hover:shadow-xl hover:scale-[1.01] active:scale-[0.99] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
      >
        {isSubmitting ? <Loader2 className="animate-spin w-5 h-5" /> : "Send Reset Link"}
      </button>
    </form>
  );
}

const COMMUNITY_RULES = [
  "Treat everyone with respect and kindness. Harassment, hate speech, or discrimination will not be tolerated.",
  "All users must be 18 years or older. No exceptions.",
  "No unsolicited explicit content in messages. Always get consent before sharing NSFW material.",
  "Profile pictures must be of yourself. No fake profiles or catfishing.",
  "Do not share personal information of others without their consent.",
  "Report any suspicious or inappropriate behavior to our moderators.",
  "No spam, scams, or promotional content.",
  "Respect boundaries. If someone isn't interested, accept it gracefully.",
  "Keep conversations safe. Never share financial information or send money to other users.",
  "Have fun and be yourself! This is a community built on authenticity and connection.",
];

function RegisterForm() {
  const { register, isRegistering } = useAuth();
  const [step, setStep] = useState(1);
  const [rulesAgreed, setRulesAgreed] = useState(false);
  const { toast } = useToast();
  
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
    age: 18,
    location: LOCATIONS[0],
    subregion: "",
    role: ROLES[0],
    bio: "",
    hasAgreedToRules: false,
    connectionGoal: "",
    seekingType: "",
    gamesPlaying: "",
    idealFirstDate: "",
    catOrDog: "",
    gamingPlatform: "",
    relationshipType: "",
    drinking: "",
    smoking: "",
    phonePreference: "",
    cokeOrPepsi: "",
    inputPreference: "",
    meetingPreference: "",
    aboutMe: "",
  });

  const updateFormData = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleNext = () => {
    if (step === 1 && !rulesAgreed) {
      toast({ title: "Please agree to the community rules to continue", variant: "destructive" });
      return;
    }
    if (step === 2) {
      if (!formData.email || !formData.username || !formData.password || !formData.connectionGoal) {
        toast({ title: "Please fill in all required fields", variant: "destructive" });
        return;
      }
      if (formData.password.length < 6) {
        toast({ title: "Password must be at least 6 characters", variant: "destructive" });
        return;
      }
      if (formData.age < 18) {
        toast({ title: "You must be at least 18 years old", variant: "destructive" });
        return;
      }
      if (formData.connectionGoal.length < 10) {
        toast({ title: "Connection goal must be at least 10 characters", variant: "destructive" });
        return;
      }
    }
    setStep(prev => prev + 1);
  };

  const handleBack = () => {
    setStep(prev => prev - 1);
  };

  const handleSubmit = () => {
    const finalData = { 
      ...formData, 
      hasAgreedToRules: true,
      region: "NA" 
    };
    register(finalData as any);
  };

  const totalSteps = 3;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-6">
        {Array.from({ length: totalSteps }, (_, i) => (
          <div key={i} className="flex items-center">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all ${
              step > i + 1 ? "bg-green-500 text-white" :
              step === i + 1 ? "bg-purple-600 text-white" :
              "bg-gray-200 text-gray-500"
            }`}>
              {step > i + 1 ? <Check className="w-4 h-4" /> : i + 1}
            </div>
            {i < totalSteps - 1 && (
              <div className={`w-12 sm:w-20 h-1 mx-1 rounded ${
                step > i + 1 ? "bg-green-500" : "bg-gray-200"
              }`} />
            )}
          </div>
        ))}
      </div>

      <AnimatePresence mode="wait">
        {step === 1 && (
          <motion.div
            key="rules"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-4"
          >
            <h3 className="text-lg font-bold text-gray-900 text-center">Community Rules</h3>
            <p className="text-sm text-gray-600 text-center">Please read and agree to our community guidelines</p>
            
            <div className="max-h-60 overflow-y-auto space-y-3 p-3 bg-gray-50 rounded-lg border">
              {COMMUNITY_RULES.map((rule, index) => (
                <div key={index} className="flex gap-2 text-sm">
                  <span className="text-purple-600 font-bold shrink-0">{index + 1}.</span>
                  <span className="text-gray-700">{rule}</span>
                </div>
              ))}
            </div>

            <label className="flex items-center gap-3 cursor-pointer p-3 bg-purple-50 rounded-lg border-2 border-purple-200 hover:border-purple-400 transition-colors">
              <input
                type="checkbox"
                checked={rulesAgreed}
                onChange={(e) => setRulesAgreed(e.target.checked)}
                data-testid="checkbox-rules-agree"
                className="w-5 h-5 rounded border-gray-300 text-purple-600 focus:ring-purple-500"
              />
              <span className="text-sm font-medium text-purple-900">
                I have read and agree to follow these community rules
              </span>
            </label>

            <button
              type="button"
              onClick={handleNext}
              disabled={!rulesAgreed}
              data-testid="button-rules-continue"
              className="w-full py-3.5 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl font-bold shadow-lg hover:shadow-xl hover:scale-[1.01] active:scale-[0.99] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              I Agree - Continue <ArrowRight className="w-4 h-4" />
            </button>
          </motion.div>
        )}

        {step === 2 && (
          <motion.div
            key="account"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-4"
          >
            <h3 className="text-lg font-bold text-gray-900 text-center">Create Your Account</h3>
            
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Email Address *</label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => updateFormData("email", e.target.value)}
                data-testid="input-register-email"
                className="w-full px-3 py-2.5 rounded-lg border border-gray-200 focus:border-purple-500 outline-none ios-input-fix"
                placeholder="your@email.com"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Username *</label>
                <input
                  value={formData.username}
                  onChange={(e) => updateFormData("username", e.target.value)}
                  data-testid="input-register-username"
                  className="w-full px-3 py-2.5 rounded-lg border border-gray-200 focus:border-purple-500 outline-none ios-input-fix"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Age (18+) *</label>
                <input
                  type="number"
                  value={formData.age}
                  onChange={(e) => updateFormData("age", parseInt(e.target.value) || 18)}
                  data-testid="input-register-age"
                  className="w-full px-3 py-2.5 rounded-lg border border-gray-200 focus:border-purple-500 outline-none ios-input-fix"
                  min={18}
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Password *</label>
              <input
                type="password"
                value={formData.password}
                onChange={(e) => updateFormData("password", e.target.value)}
                data-testid="input-register-password"
                className="w-full px-3 py-2.5 rounded-lg border border-gray-200 focus:border-purple-500 outline-none ios-input-fix"
                placeholder="At least 6 characters"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Country *</label>
              <select
                value={formData.location}
                onChange={(e) => updateFormData("location", e.target.value)}
                data-testid="select-register-location"
                className="w-full px-3 py-2.5 rounded-lg border border-gray-200 focus:border-purple-500 outline-none ios-input-fix"
              >
                {Array.from(new Set(LOCATIONS)).map((loc) => (
                  <option key={loc} value={loc}>{loc}</option>
                ))}
              </select>
            </div>

            {SUBREGIONS[formData.location] && (
              <div className="space-y-2 animate-in fade-in slide-in-from-top-1">
                <label className="text-sm font-medium text-gray-700">State / Province</label>
                <select
                  value={formData.subregion}
                  onChange={(e) => updateFormData("subregion", e.target.value)}
                  data-testid="select-register-subregion"
                  className="w-full px-3 py-2.5 rounded-lg border border-gray-200 focus:border-purple-500 outline-none ios-input-fix"
                >
                  <option value="">Select...</option>
                  {SUBREGIONS[formData.location].map((sub) => (
                    <option key={sub} value={sub}>{sub}</option>
                  ))}
                </select>
              </div>
            )}

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">I identify as... *</label>
              <select
                value={formData.role}
                onChange={(e) => updateFormData("role", e.target.value)}
                data-testid="select-register-role"
                className="w-full px-3 py-2.5 rounded-lg border border-gray-200 focus:border-purple-500 outline-none ios-input-fix"
              >
                {ROLES.map((role) => (
                  <option key={role} value={role}>{role}</option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Connection Goal *</label>
              <input
                value={formData.connectionGoal}
                onChange={(e) => updateFormData("connectionGoal", e.target.value)}
                data-testid="input-register-connection-goal"
                className="w-full px-3 py-2.5 rounded-lg border border-gray-200 focus:border-purple-500 outline-none ios-input-fix"
                placeholder="What are you looking for? (min 10 chars)"
              />
            </div>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={handleBack}
                className="flex-1 py-3 border border-gray-300 text-gray-700 rounded-xl font-semibold hover:bg-gray-50 transition-colors flex items-center justify-center gap-2"
              >
                <ArrowLeft className="w-4 h-4" /> Back
              </button>
              <button
                type="button"
                onClick={handleNext}
                data-testid="button-account-continue"
                className="flex-1 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl font-bold shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-2"
              >
                Continue <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </motion.div>
        )}

        {step === 3 && (
          <motion.div
            key="questions"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-4"
          >
            <h3 className="text-lg font-bold text-gray-900 text-center">Match Questions</h3>
            <p className="text-sm text-gray-600 text-center">Help us find your perfect match!</p>

            <div className="max-h-80 overflow-y-auto space-y-4 pr-2">
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">I am a...</label>
                <select
                  value={formData.seekingType}
                  onChange={(e) => updateFormData("seekingType", e.target.value)}
                  data-testid="select-seeking-type"
                  className="w-full px-3 py-2.5 rounded-lg border border-gray-200 focus:border-purple-500 outline-none ios-input-fix"
                >
                  <option value="">Select...</option>
                  {SEEKING_TYPES.map((type) => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">What are you looking for?</label>
                <select
                  value={formData.relationshipType}
                  onChange={(e) => updateFormData("relationshipType", e.target.value)}
                  data-testid="select-relationship-type"
                  className="w-full px-3 py-2.5 rounded-lg border border-gray-200 focus:border-purple-500 outline-none ios-input-fix"
                >
                  <option value="">Select...</option>
                  {RELATIONSHIP_TYPES.map((type) => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Online or IRL?</label>
                <select
                  value={formData.meetingPreference}
                  onChange={(e) => updateFormData("meetingPreference", e.target.value)}
                  data-testid="select-meeting-preference"
                  className="w-full px-3 py-2.5 rounded-lg border border-gray-200 focus:border-purple-500 outline-none ios-input-fix"
                >
                  <option value="">Select...</option>
                  {MEETING_PREFERENCES.map((pref) => (
                    <option key={pref} value={pref}>{pref}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Gaming Platform</label>
                <select
                  value={formData.gamingPlatform}
                  onChange={(e) => updateFormData("gamingPlatform", e.target.value)}
                  data-testid="select-gaming-platform"
                  className="w-full px-3 py-2.5 rounded-lg border border-gray-200 focus:border-purple-500 outline-none ios-input-fix"
                >
                  <option value="">Select...</option>
                  {GAMING_PLATFORMS.map((platform) => (
                    <option key={platform} value={platform}>{platform}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Mouse & Keyboard or Controller?</label>
                <select
                  value={formData.inputPreference}
                  onChange={(e) => updateFormData("inputPreference", e.target.value)}
                  data-testid="select-input-preference"
                  className="w-full px-3 py-2.5 rounded-lg border border-gray-200 focus:border-purple-500 outline-none ios-input-fix"
                >
                  <option value="">Select...</option>
                  {INPUT_PREFERENCES.map((pref) => (
                    <option key={pref} value={pref}>{pref}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">What games are you playing?</label>
                <input
                  value={formData.gamesPlaying}
                  onChange={(e) => updateFormData("gamesPlaying", e.target.value)}
                  data-testid="input-games-playing"
                  className="w-full px-3 py-2.5 rounded-lg border border-gray-200 focus:border-purple-500 outline-none ios-input-fix"
                  placeholder="e.g. Valorant, Minecraft, Fortnite..."
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Ideal first date?</label>
                <input
                  value={formData.idealFirstDate}
                  onChange={(e) => updateFormData("idealFirstDate", e.target.value)}
                  data-testid="input-ideal-date"
                  className="w-full px-3 py-2.5 rounded-lg border border-gray-200 focus:border-purple-500 outline-none ios-input-fix"
                  placeholder="e.g. Coffee shop, gaming session, movie night..."
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Cat or Dog?</label>
                  <select
                    value={formData.catOrDog}
                    onChange={(e) => updateFormData("catOrDog", e.target.value)}
                    data-testid="select-cat-dog"
                    className="w-full px-3 py-2.5 rounded-lg border border-gray-200 focus:border-purple-500 outline-none ios-input-fix"
                  >
                    <option value="">Select...</option>
                    <option value="Cat">Cat</option>
                    <option value="Dog">Dog</option>
                    <option value="Both">Both</option>
                    <option value="Neither">Neither</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Coke or Pepsi?</label>
                  <select
                    value={formData.cokeOrPepsi}
                    onChange={(e) => updateFormData("cokeOrPepsi", e.target.value)}
                    data-testid="select-coke-pepsi"
                    className="w-full px-3 py-2.5 rounded-lg border border-gray-200 focus:border-purple-500 outline-none ios-input-fix"
                  >
                    <option value="">Select...</option>
                    <option value="Coke">Coke</option>
                    <option value="Pepsi">Pepsi</option>
                    <option value="Neither">Neither</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">iPhone or Android?</label>
                  <select
                    value={formData.phonePreference}
                    onChange={(e) => updateFormData("phonePreference", e.target.value)}
                    data-testid="select-phone"
                    className="w-full px-3 py-2.5 rounded-lg border border-gray-200 focus:border-purple-500 outline-none ios-input-fix"
                  >
                    <option value="">Select...</option>
                    <option value="iPhone">iPhone</option>
                    <option value="Android">Android</option>
                    <option value="Both">Both</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Do you drink?</label>
                  <select
                    value={formData.drinking}
                    onChange={(e) => updateFormData("drinking", e.target.value)}
                    data-testid="select-drinking"
                    className="w-full px-3 py-2.5 rounded-lg border border-gray-200 focus:border-purple-500 outline-none ios-input-fix"
                  >
                    <option value="">Select...</option>
                    <option value="Yes">Yes</option>
                    <option value="No">No</option>
                    <option value="Sometimes">Sometimes</option>
                  </select>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Do you smoke?</label>
                <select
                  value={formData.smoking}
                  onChange={(e) => updateFormData("smoking", e.target.value)}
                  data-testid="select-smoking"
                  className="w-full px-3 py-2.5 rounded-lg border border-gray-200 focus:border-purple-500 outline-none ios-input-fix"
                >
                  <option value="">Select...</option>
                  <option value="Yes">Yes</option>
                  <option value="No">No</option>
                  <option value="Sometimes">Sometimes</option>
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Tell us about yourself</label>
                <textarea
                  value={formData.aboutMe}
                  onChange={(e) => updateFormData("aboutMe", e.target.value)}
                  data-testid="textarea-about-me"
                  className="w-full px-3 py-2.5 rounded-lg bg-white border border-gray-200 focus:border-purple-500 outline-none h-24 resize-none [&]:text-black" style={{ color: "black", WebkitTextFillColor: "black", opacity: 1 }}
                  placeholder="Share your hobbies, interests, what makes you unique... (The more you write, the better matches you'll get!)"
                />
                <p className="text-xs text-gray-500">
                  {formData.aboutMe.length < 50 ? 
                    `${50 - formData.aboutMe.length} more characters recommended for better matches` :
                    "Great bio length!"
                  }
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 p-3 bg-blue-50 text-blue-800 rounded-lg text-xs">
              <ShieldCheck className="w-4 h-4 shrink-0" />
              <p>By registering, you confirm you are 18+ years of age.</p>
            </div>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={handleBack}
                className="flex-1 py-3 border border-gray-300 text-gray-700 rounded-xl font-semibold hover:bg-gray-50 transition-colors flex items-center justify-center gap-2"
              >
                <ArrowLeft className="w-4 h-4" /> Back
              </button>
              <button
                type="button"
                onClick={handleSubmit}
                disabled={isRegistering}
                data-testid="button-create-account"
                className="flex-1 py-3 bg-gradient-to-r from-pink-500 to-purple-600 text-white rounded-xl font-bold shadow-lg shadow-purple-500/25 hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isRegistering ? <Loader2 className="animate-spin w-5 h-5" /> : (
                  <>Create Account <ArrowRight className="w-4 h-4" /></>
                )}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
