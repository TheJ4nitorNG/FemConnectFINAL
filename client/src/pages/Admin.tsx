import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { useLocation } from "wouter";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { User } from "@shared/schema";
import { Layout } from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Shield, ShieldOff, Trash2, UserCheck, UserX, Search, Users, ShieldAlert, Mail, Loader2 } from "lucide-react";

export default function Admin() {
  const { user, isLoading: authLoading } = useAuth();
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");

  const isAdmin = user?.isAdmin === true;

  const { data: allUsers = [], isLoading } = useQuery<User[]>({
    queryKey: ["/api/admin/users"],
    enabled: !authLoading && isAdmin,
  });

  const shadowBanMutation = useMutation({
    mutationFn: async ({ userId, banned }: { userId: number; banned: boolean }) => {
      const res = await apiRequest("POST", `/api/admin/users/${userId}/shadow-ban`, { banned });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      toast({ title: "Success", description: "User shadow ban status updated" });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const deleteUserMutation = useMutation({
    mutationFn: async (userId: number) => {
      await apiRequest("DELETE", `/api/admin/users/${userId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      toast({ title: "Success", description: "User permanently deleted" });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const setAdminMutation = useMutation({
    mutationFn: async ({ userId, isAdmin }: { userId: number; isAdmin: boolean }) => {
      const res = await apiRequest("POST", `/api/admin/users/${userId}/set-admin`, { isAdmin });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      toast({ title: "Success", description: "User admin status updated" });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const sendRemindersMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/admin/send-profile-pic-reminders", {});
      return res.json();
    },
    onSuccess: (data: { message: string; sent: number; failed: number; total: number }) => {
      toast({ 
        title: "Emails Sent", 
        description: data.message 
      });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  if (authLoading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="animate-pulse">Loading...</div>
        </div>
      </Layout>
    );
  }

  if (!isAdmin) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <Card className="max-w-md">
            <CardContent className="pt-6 text-center">
              <ShieldAlert className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <h2 className="text-xl font-semibold mb-2">Access Denied</h2>
              <p className="text-muted-foreground mb-4">
                You don't have permission to view this page. Only moderators can access the admin panel.
              </p>
              <Button onClick={() => navigate("/dashboard")} data-testid="button-back-dashboard">
                Back to Dashboard
              </Button>
            </CardContent>
          </Card>
        </div>
      </Layout>
    );
  }

  const filteredUsers = allUsers.filter(
    (u) =>
      u.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const stats = {
    total: allUsers.length,
    shadowBanned: allUsers.filter((u) => u.isShadowBanned).length,
    admins: allUsers.filter((u) => u.isAdmin).length,
  };

  return (
    <Layout>
      <div className="max-w-6xl mx-auto p-4 space-y-6">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Shield className="w-6 h-6" />
              Moderator Panel
            </h1>
            <p className="text-muted-foreground">Manage users and keep the community safe</p>
          </div>
          <Button
            variant="outline"
            onClick={() => sendRemindersMutation.mutate()}
            disabled={sendRemindersMutation.isPending}
            data-testid="button-send-reminders"
          >
            {sendRemindersMutation.isPending ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Mail className="w-4 h-4 mr-2" />
            )}
            Send Profile Pic Reminders
          </Button>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2">
              <CardTitle className="text-sm font-medium">Total Users</CardTitle>
              <Users className="w-4 h-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold" data-testid="text-total-users">{stats.total}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2">
              <CardTitle className="text-sm font-medium">Shadow Banned</CardTitle>
              <ShieldOff className="w-4 h-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold" data-testid="text-shadow-banned">{stats.shadowBanned}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2">
              <CardTitle className="text-sm font-medium">Moderators</CardTitle>
              <Shield className="w-4 h-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold" data-testid="text-moderators">{stats.admins}</div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>User Management</CardTitle>
            <div className="relative mt-2">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search by username or email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
                data-testid="input-search-users"
              />
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-8 text-muted-foreground">Loading users...</div>
            ) : filteredUsers.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">No users found</div>
            ) : (
              <div className="space-y-3">
                {filteredUsers.map((targetUser) => (
                  <div
                    key={targetUser.id}
                    className="flex items-center justify-between gap-4 p-3 rounded-lg border flex-wrap"
                    data-testid={`row-user-${targetUser.id}`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
                        {targetUser.profilePicture ? (
                          <img
                            src={targetUser.profilePicture}
                            alt={targetUser.username}
                            className="w-10 h-10 rounded-full object-cover"
                          />
                        ) : (
                          <span className="text-sm font-medium">
                            {targetUser.username.charAt(0).toUpperCase()}
                          </span>
                        )}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span
                            className="font-medium truncate cursor-pointer hover:underline"
                            onClick={() => navigate(`/profile/${targetUser.id}`)}
                            data-testid={`link-user-${targetUser.id}`}
                          >
                            {targetUser.username}
                          </span>
                          {targetUser.isAdmin && (
                            <Badge variant="default" className="text-xs">
                              <Shield className="w-3 h-3 mr-1" />
                              Mod
                            </Badge>
                          )}
                          {targetUser.isShadowBanned && (
                            <Badge variant="destructive" className="text-xs">
                              Shadow Banned
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground truncate">{targetUser.email}</p>
                      </div>
                    </div>

                    {targetUser.id !== user.id && (
                      <div className="flex items-center gap-2 flex-wrap">
                        <Button
                          size="sm"
                          variant={targetUser.isShadowBanned ? "default" : "outline"}
                          onClick={() =>
                            shadowBanMutation.mutate({
                              userId: targetUser.id,
                              banned: !targetUser.isShadowBanned,
                            })
                          }
                          disabled={shadowBanMutation.isPending}
                          data-testid={`button-shadow-ban-${targetUser.id}`}
                        >
                          {targetUser.isShadowBanned ? (
                            <>
                              <UserCheck className="w-4 h-4 mr-1" />
                              Unban
                            </>
                          ) : (
                            <>
                              <UserX className="w-4 h-4 mr-1" />
                              Shadow Ban
                            </>
                          )}
                        </Button>

                        <Button
                          size="sm"
                          variant={targetUser.isAdmin ? "destructive" : "outline"}
                          onClick={() =>
                            setAdminMutation.mutate({
                              userId: targetUser.id,
                              isAdmin: !targetUser.isAdmin,
                            })
                          }
                          disabled={setAdminMutation.isPending}
                          data-testid={`button-set-admin-${targetUser.id}`}
                        >
                          {targetUser.isAdmin ? (
                            <>
                              <ShieldOff className="w-4 h-4 mr-1" />
                              Remove Mod
                            </>
                          ) : (
                            <>
                              <Shield className="w-4 h-4 mr-1" />
                              Make Mod
                            </>
                          )}
                        </Button>

                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button
                              size="sm"
                              variant="destructive"
                              data-testid={`button-delete-${targetUser.id}`}
                            >
                              <Trash2 className="w-4 h-4 mr-1" />
                              Delete
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Delete User Account</AlertDialogTitle>
                              <AlertDialogDescription>
                                This will permanently delete <strong>{targetUser.username}</strong>'s
                                account and all their data (messages, pictures, etc). This action cannot
                                be undone.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel data-testid="button-cancel-delete">Cancel</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => deleteUserMutation.mutate(targetUser.id)}
                                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                data-testid="button-confirm-delete"
                              >
                                Delete Permanently
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
