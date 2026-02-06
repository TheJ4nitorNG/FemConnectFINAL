import { User, StatusUpdate } from "@shared/schema";
import { Link } from "wouter";
import { MapPin, Clock, Heart } from "lucide-react";
import { motion } from "framer-motion";
import { useQuery } from "@tanstack/react-query";

interface StatusWithUser extends StatusUpdate {
  user: User | undefined;
}

interface CompatibilityResult {
  compatibility: number;
  matches: { field: string; label: string; match: boolean }[];
  total: number;
  answeredQuestions: boolean;
}

interface UserCardProps {
  user: User;
  index?: number;
}

// Generate a deterministic gradient based on username for avatar background
const getGradient = (name: string) => {
  const gradients = [
    "from-pink-400 to-rose-500",
    "from-purple-400 to-indigo-500",
    "from-blue-400 to-cyan-500",
    "from-teal-400 to-emerald-500",
    "from-orange-400 to-amber-500"
  ];
  const index = name.charCodeAt(0) % gradients.length;
  return gradients[index];
};

export function UserCard({ user, index = 0 }: UserCardProps) {
  const { data: allStatuses = [] } = useQuery<StatusWithUser[]>({
    queryKey: ["/api/status"],
    staleTime: 60000,
  });
  
  const { data: compatibility } = useQuery<CompatibilityResult>({
    queryKey: ["/api/users", user.id, "compatibility"],
    staleTime: 300000,
  });
  
  const userStatus = allStatuses.find(s => s.userId === user.id);
  
  const bannerUrl = user.bannerPicture 
    ? `/objects/${user.bannerPicture.replace("/objects/", "")}`
    : null;
  const profileUrl = user.profilePicture
    ? `/objects/${user.profilePicture.replace("/objects/", "")}`
    : null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05, duration: 0.4 }}
    >
      <Link href={`/profile/${user.id}`} className="block group h-full">
        <div className="
          bg-white dark:bg-gray-800 rounded-3xl overflow-hidden border border-purple-100/50 dark:border-gray-700 shadow-sm hover:shadow-xl hover:-translate-y-1 
          transition-all duration-300 h-full flex flex-col
        ">
          <div 
            className={`h-32 relative ${!bannerUrl ? `bg-gradient-to-r ${getGradient(user.username)}` : ''}`}
            style={bannerUrl ? { backgroundImage: `url(${bannerUrl})`, backgroundSize: 'cover', backgroundPosition: 'center' } : {}}
          >
             <div className="absolute -bottom-10 left-6">
               <div className="w-20 h-20 rounded-2xl bg-white p-1 shadow-lg transform rotate-3 group-hover:rotate-0 transition-transform duration-300">
                  {profileUrl ? (
                    <img 
                      src={profileUrl} 
                      alt={user.username} 
                      className="w-full h-full rounded-xl object-cover"
                    />
                  ) : (
                    <div className={`w-full h-full rounded-xl bg-gradient-to-br ${getGradient(user.username)} opacity-80 flex items-center justify-center`}>
                      <span className="text-2xl font-bold text-white uppercase">{user.username.slice(0, 2)}</span>
                    </div>
                  )}
               </div>
             </div>
          </div>
          
          <div className="pt-12 pb-6 px-6 flex-1 flex flex-col">
            <div className="flex justify-between items-start mb-2">
              <div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">
                  {user.username}
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">{user.age} years old</p>
              </div>
              <div className="flex flex-col items-end gap-1">
                <span className="px-3 py-1 rounded-full text-xs font-semibold bg-purple-50 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 border border-purple-100 dark:border-purple-800">
                  {user.role}
                </span>
                {compatibility && (
                  compatibility.answeredQuestions ? (
                    <div 
                      className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${
                        compatibility.compatibility >= 70 
                          ? "bg-pink-50 dark:bg-pink-900/30 text-pink-600 dark:text-pink-400" 
                          : compatibility.compatibility >= 40
                          ? "bg-amber-50 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400"
                          : "bg-gray-50 dark:bg-gray-700 text-gray-500 dark:text-gray-400"
                      }`}
                      title="Match compatibility based on your questionnaire answers"
                      data-testid={`compatibility-${user.id}`}
                    >
                      <Heart className="w-3 h-3" />
                      <span>{compatibility.compatibility}%</span>
                    </div>
                  ) : (
                    <div 
                      className="flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-gray-50 dark:bg-gray-700 text-gray-400 dark:text-gray-500"
                      title="Fill out your match questions to see compatibility"
                      data-testid={`compatibility-${user.id}`}
                    >
                      <Heart className="w-3 h-3" />
                      <span>?%</span>
                    </div>
                  )
                )}
              </div>
            </div>
            
            {userStatus && (
              <div className="flex items-start gap-1.5 mb-3">
                <Clock className="w-3.5 h-3.5 text-gray-400 mt-0.5 flex-shrink-0" />
                <p className="text-xs text-gray-700 dark:text-gray-300 italic line-clamp-2">{userStatus.content}</p>
              </div>
            )}
            
            <div className="flex items-center gap-1 text-gray-500 dark:text-gray-400 text-sm mb-4">
              <MapPin className="w-3.5 h-3.5" />
              <span>{user.location}</span>
            </div>
            
            {user.bio && (
              <p className="text-gray-600 dark:text-gray-300 text-sm line-clamp-3 mb-4 flex-1">
                {user.bio}
              </p>
            )}

            <div className="mt-auto pt-4 border-t border-gray-50 dark:border-gray-700">
               <span className="text-sm font-semibold text-pink-500 group-hover:underline decoration-2 underline-offset-2">
                 View Profile &rarr;
               </span>
            </div>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}
