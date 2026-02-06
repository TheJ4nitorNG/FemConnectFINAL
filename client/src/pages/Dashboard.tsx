import { useState, useMemo } from "react";
import { useUsers } from "@/hooks/use-users";
import { UserCard } from "@/components/UserCard";
import { FilterBar } from "@/components/FilterBar";
import { Loader2, UserX, Search, X } from "lucide-react";
import { Layout } from "@/components/Layout";
import { Input } from "@/components/ui/input";

export default function Dashboard() {
  const [filters, setFilters] = useState({ role: "All", location: "All" });
  const [searchQuery, setSearchQuery] = useState("");
  const { data: users, isLoading, error } = useUsers(filters);

  const filteredUsers = useMemo(() => {
    if (!users || !searchQuery.trim()) return users;
    const query = searchQuery.toLowerCase().trim();
    return users.filter(user => 
      user.username.toLowerCase().includes(query) ||
      user.bio?.toLowerCase().includes(query)
    );
  }, [users, searchQuery]);

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl md:text-4xl font-display font-bold text-gray-900 dark:text-white">
              Discover People
            </h1>
            <p className="text-gray-500 dark:text-gray-400 mt-2">
              Find someone who matches your vibe.
            </p>
          </div>
          
          <div className="relative w-full md:w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              type="text"
              placeholder="Search by username..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 pr-10 bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700"
              data-testid="input-user-search"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                data-testid="button-clear-search"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        <FilterBar 
          filters={filters} 
          onChange={(key, value) => setFilters(prev => ({ ...prev, [key]: value }))} 
        />

        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <Loader2 className="w-10 h-10 text-purple-500 animate-spin mb-4" />
            <p className="text-gray-500 dark:text-gray-400 font-medium">Finding potential matches...</p>
          </div>
        ) : error ? (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-800 rounded-xl p-6 text-center text-red-600 dark:text-red-400">
            Failed to load users. Please try again later.
          </div>
        ) : filteredUsers?.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center bg-white dark:bg-gray-800 rounded-3xl border border-dashed border-gray-200 dark:border-gray-700">
            <div className="w-16 h-16 bg-gray-50 dark:bg-gray-700 rounded-full flex items-center justify-center mb-4">
              <UserX className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
              {searchQuery ? "No users found" : "No matches found"}
            </h3>
            <p className="text-gray-500 dark:text-gray-400 max-w-sm">
              {searchQuery 
                ? `No users matching "${searchQuery}". Try a different search term.`
                : "Try adjusting your filters to see more people. New users are joining every day!"}
            </p>
            <button 
              onClick={() => {
                setFilters({ role: "All", location: "All" });
                setSearchQuery("");
              }}
              className="mt-6 px-6 py-2 bg-purple-100 dark:bg-purple-900/50 text-purple-700 dark:text-purple-300 rounded-lg font-medium hover:bg-purple-200 dark:hover:bg-purple-900 transition-colors"
              data-testid="button-clear-all-filters"
            >
              Clear All
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredUsers?.map((user, idx) => (
              <UserCard key={user.id} user={user} index={idx} />
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
}
