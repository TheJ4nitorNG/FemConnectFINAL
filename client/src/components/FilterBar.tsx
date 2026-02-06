import { ROLES, LOCATIONS } from "@shared/schema";
import { Filter, X } from "lucide-react";

interface FilterBarProps {
  filters: { role: string; location: string };
  onChange: (key: 'role' | 'location', value: string) => void;
}

export function FilterBar({ filters, onChange }: FilterBarProps) {
  return (
    <div className="bg-white dark:bg-gray-800 p-4 rounded-2xl shadow-sm border border-purple-100 dark:border-gray-700 mb-8">
      <div className="flex flex-col sm:flex-row gap-4 items-center">
        <div className="flex items-center gap-2 text-purple-900 dark:text-purple-300 font-medium min-w-[100px]">
          <Filter className="w-5 h-5 text-pink-500" />
          <span>Filters</span>
        </div>

        <div className="flex-1 w-full grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="relative">
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Looking For</label>
            <select
              value={filters.role}
              onChange={(e) => onChange("role", e.target.value)}
              className="w-full pl-3 pr-8 py-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm font-medium text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 outline-none transition-all appearance-none cursor-pointer hover:bg-white dark:hover:bg-gray-700"
            >
              <option value="All">All Roles</option>
              {ROLES.map((role) => (
                <option key={role} value={role}>{role}</option>
              ))}
            </select>
          </div>

          <div className="relative">
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Location</label>
            <select
              value={filters.location}
              onChange={(e) => onChange("location", e.target.value)}
              className="w-full pl-3 pr-8 py-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm font-medium text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 outline-none transition-all appearance-none cursor-pointer hover:bg-white dark:hover:bg-gray-700"
            >
              <option value="All">Anywhere</option>
              {LOCATIONS.map((loc) => (
                <option key={loc} value={loc}>{loc}</option>
              ))}
            </select>
          </div>
        </div>

        {(filters.role !== "All" || filters.location !== "All") && (
           <button 
             onClick={() => {
               onChange("role", "All");
               onChange("location", "All");
             }}
             className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors self-end sm:self-center"
             title="Clear filters"
           >
             <X className="w-5 h-5" />
           </button>
        )}
      </div>
    </div>
  );
}
