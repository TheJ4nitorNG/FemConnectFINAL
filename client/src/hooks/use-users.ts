import { useQuery, useMutation } from "@tanstack/react-query";
import { api, buildUrl } from "@shared/routes";
import type { User } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";

interface UserFilters {
  role?: string;
  location?: string;
}

export function useUsers(filters?: UserFilters) {
  // Construct query key based on filters to enable caching per filter set
  const queryKey = [api.users.list.path, filters];

  return useQuery({
    queryKey,
    queryFn: async () => {
      const url = new URL(api.users.list.path, window.location.origin);
      if (filters?.role && filters.role !== "All") url.searchParams.append("role", filters.role);
      if (filters?.location && filters.location !== "All") url.searchParams.append("location", filters.location);
      
      const res = await fetch(url.toString());
      if (!res.ok) throw new Error("Failed to fetch users");
      return api.users.list.responses[200].parse(await res.json());
    },
  });
}

export function useUser(id: number) {
  return useQuery({
    queryKey: [api.users.get.path, id],
    queryFn: async () => {
      const url = buildUrl(api.users.get.path, { id });
      const res = await fetch(url);
      if (!res.ok) throw new Error("Failed to fetch user");
      return api.users.get.responses[200].parse(await res.json());
    },
    enabled: !!id,
  });
}

export function useUpdateUser() {
  return useMutation({
    mutationFn: async (updates: Partial<User>) => {
      const res = await apiRequest("PATCH", "/api/user", updates);
      return res.json();
    },
    onSuccess: (updatedUser: User) => {
      queryClient.invalidateQueries({ queryKey: [api.users.get.path, updatedUser.id] });
      queryClient.invalidateQueries({ queryKey: ["/api/user"] });
    },
  });
}
