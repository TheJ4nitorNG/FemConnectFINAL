import { Link } from "wouter";
import { motion } from "framer-motion";
import { Heart, ShieldCheck, Sparkles } from "lucide-react";
import logoImg from "@/assets/logo-header.png";

export default function Landing() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-50 to-white flex flex-col">
      {/* Hero Section */}
      <div className="flex-1 flex flex-col justify-center items-center px-4 sm:px-6 lg:px-8 py-12 sm:py-24 text-center max-w-5xl mx-auto">
        
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5 }}
          className="mb-8"
        >
          <img src={logoImg} alt="FemConnect" className="w-auto" style={{ height: '300px' }} />
        </motion.div>

        <motion.h1 
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.6 }}
          className="text-4xl sm:text-6xl font-display font-bold text-gray-900 mb-2 tracking-tight leading-tight"
        >
          Find the perfect{" "}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-500">
            Femboy snuggle buddy!
          </span>
        </motion.h1>
        
        <motion.p
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.3, duration: 0.6 }}
          className="text-lg sm:text-xl text-gray-500 italic mb-6"
        >
          head pats may be required
        </motion.p>

        <motion.p
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.4, duration: 0.6 }}
          className="text-xl text-gray-600 mb-10 max-w-2xl mx-auto leading-relaxed"
        >
          A safe, inclusive, and fun space for Femboys and admirers to meet, chat, and connect. 
          Join our verified 18+ community today.
        </motion.p>

        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.6, duration: 0.6 }}
          className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto"
        >
          <Link href="/register">
            <div className="px-8 py-4 bg-gray-900 text-white rounded-xl font-bold text-lg hover:bg-gray-800 hover:scale-105 hover:shadow-lg transition-all cursor-pointer flex items-center justify-center gap-2">
              <Sparkles className="w-5 h-5" />
              Join the Community
            </div>
          </Link>
          <Link href="/login">
            <div className="px-8 py-4 bg-white text-gray-900 border-2 border-gray-100 rounded-xl font-bold text-lg hover:border-purple-200 hover:bg-purple-50 transition-all cursor-pointer">
              Sign In
            </div>
          </Link>
        </motion.div>
      </div>

      {/* Features Grid */}
      <div className="bg-white py-16 sm:py-24 border-t border-purple-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-3 gap-8">
            <FeatureCard 
              icon={<ShieldCheck className="w-8 h-8 text-emerald-500" />}
              title="Safe & Secure"
              description="We prioritize your safety with 18+ verification and active community moderation."
            />
            <FeatureCard 
              icon={<Heart className="w-8 h-8 text-pink-500" />}
              title="Inclusive Space"
              description="Whether you're a femboy or an admirer, find people who appreciate you for you."
            />
            <FeatureCard 
              icon={<Sparkles className="w-8 h-8 text-purple-500" />}
              title="Genuine Connections"
              description="No bots, no spam. Just real people looking for real connections and friendship."
            />
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="text-sm text-gray-400">
              © 2026 FemConnect. All rights reserved.
            </div>
            <div className="flex gap-6 text-sm">
              <Link href="/privacy">
                <span className="text-gray-400 hover:text-white transition-colors cursor-pointer" data-testid="link-privacy">
                  Privacy Policy
                </span>
              </Link>
              <Link href="/terms">
                <span className="text-gray-400 hover:text-white transition-colors cursor-pointer" data-testid="link-terms">
                  Terms of Service
                </span>
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

function FeatureCard({ icon, title, description }: { icon: React.ReactNode, title: string, description: string }) {
  return (
    <div className="p-8 rounded-3xl bg-purple-50/50 border border-purple-100 hover:shadow-lg transition-all duration-300">
      <div className="bg-white w-16 h-16 rounded-2xl flex items-center justify-center shadow-sm mb-6">
        {icon}
      </div>
      <h3 className="text-xl font-bold text-gray-900 mb-3">{title}</h3>
      <p className="text-gray-600 leading-relaxed">
        {description}
      </p>
    </div>
  );
}
