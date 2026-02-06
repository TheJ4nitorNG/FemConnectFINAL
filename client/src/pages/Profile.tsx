import { useState } from "react";
import { useRoute, useLocation } from "wouter";
import { useUser, useUpdateUser } from "@/hooks/use-users";
import { Layout } from "@/components/Layout";
import { Loader2, MapPin, Calendar, Flag, User, AlertCircle, Camera, MessageCircle, Pencil, Check, X, Plus, Trash2, Clock, Send } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { useUpload } from "@/hooks/use-upload";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import type { ProfilePicture, StatusUpdate, User as UserType } from "@shared/schema";
import { SEEKING_TYPES, RELATIONSHIP_TYPES, GAMING_PLATFORMS, MEETING_PREFERENCES } from "@shared/schema";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Heart } from "lucide-react";

interface StatusWithUser extends StatusUpdate {
  user: UserType | undefined;
}

export default function Profile() {
  const [, params] = useRoute("/profile/:id");
  const [, setLocation] = useLocation();
  const id = parseInt(params?.id || "0");
  const { user: currentUser } = useAuth();
  const { data: user, isLoading, error } = useUser(id);
  const updateUser = useUpdateUser();
  const { toast } = useToast();
  const { uploadFile, isUploading } = useUpload();
  const isOwnProfile = currentUser?.id === id;
  
  const [isEditingUsername, setIsEditingUsername] = useState(false);
  const [newUsername, setNewUsername] = useState("");
  const [isEditingBio, setIsEditingBio] = useState(false);
  const [newBio, setNewBio] = useState("");
  const [selectedPicture, setSelectedPicture] = useState<string | null>(null);
  const [isEditingStatus, setIsEditingStatus] = useState(false);
  const [newStatus, setNewStatus] = useState("");
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isEditingMatchQuestions, setIsEditingMatchQuestions] = useState(false);
  const [matchQuestions, setMatchQuestions] = useState({
    seekingType: "",
    relationshipType: "",
    meetingPreference: "",
    gamingPlatform: "",
    catOrDog: "",
    drinking: "",
    smoking: "",
  });

  const { data: profilePictures = [] } = useQuery<ProfilePicture[]>({
    queryKey: [`/api/users/${id}/pictures`],
    enabled: !!id,
  });
  
  const { data: allStatuses = [] } = useQuery<StatusWithUser[]>({
    queryKey: ["/api/status"],
  });
  
  const userStatus = allStatuses.find(s => s.userId === id);
  
  const postStatusMutation = useMutation({
    mutationFn: async (content: string) => {
      const res = await apiRequest("POST", "/api/status", { content });
      return res.json();
    },
    onSuccess: () => {
      setNewStatus("");
      setIsEditingStatus(false);
      queryClient.invalidateQueries({ queryKey: ["/api/status"] });
      toast({ title: "Status posted!", description: "Your status will expire in 12 hours." });
    },
    onError: () => {
      toast({ title: "Failed to post status", variant: "destructive" });
    },
  });
  
  const deleteStatusMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("DELETE", "/api/status");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/status"] });
      toast({ title: "Status deleted" });
    },
  });

  const deleteAccountMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("DELETE", "/api/account");
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "Account deleted", description: "Your account has been permanently deleted." });
      setLocation("/");
      window.location.reload();
    },
    onError: (error: Error) => {
      toast({ title: "Failed to delete account", description: error.message, variant: "destructive" });
    },
  });

  const addPictureMutation = useMutation({
    mutationFn: async (objectPath: string) => {
      const res = await apiRequest("POST", "/api/profile-pictures", { objectPath });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/users/${id}/pictures`] });
      toast({ title: "Success", description: "Picture added to your profile!" });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const deletePictureMutation = useMutation({
    mutationFn: async (pictureId: number) => {
      await apiRequest("DELETE", `/api/profile-pictures/${pictureId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/users/${id}/pictures`] });
      toast({ title: "Success", description: "Picture removed from your profile!" });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const handleAddPicture = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const response = await uploadFile(file);
      if (!response) throw new Error("Upload failed");
      await addPictureMutation.mutateAsync(response.objectPath);
    } catch (err) {
      toast({ title: "Error", description: "Failed to upload image", variant: "destructive" });
    }
  };

  const goToMessages = () => {
    setLocation(`/messages?user=${id}`);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, field: "profilePicture" | "bannerPicture") => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const response = await uploadFile(file);
      if (!response) throw new Error("Upload failed");
      
      await updateUser.mutateAsync({ [field]: response.objectPath });
      toast({ title: "Success", description: `${field === "profilePicture" ? "Profile" : "Banner"} picture updated!` });
    } catch (err) {
      toast({ 
        title: "Error", 
        description: "Failed to upload image",
        variant: "destructive"
      });
    }
  };

  const handleReport = () => {
    toast({
      title: "Report Submitted",
      description: "Thank you for keeping our community safe. We will review this profile.",
    });
  };
  
  const handleUsernameEdit = () => {
    setNewUsername(user?.username || "");
    setIsEditingUsername(true);
  };
  
  const handleUsernameSave = async () => {
    if (!newUsername.trim()) return;
    try {
      await updateUser.mutateAsync({ username: newUsername.trim() });
      toast({ title: "Success", description: "Username updated successfully!" });
      setIsEditingUsername(false);
      queryClient.invalidateQueries({ queryKey: ["/api/user"] });
      queryClient.invalidateQueries({ queryKey: ["/api/users", id] });
    } catch (err: any) {
      toast({
        title: "Error",
        description: err.message || "Failed to update username",
        variant: "destructive",
      });
    }
  };
  
  const handleUsernameCancel = () => {
    setIsEditingUsername(false);
    setNewUsername("");
  };

  const handleBioEdit = () => {
    setNewBio(user?.bio || "");
    setIsEditingBio(true);
  };

  const handleBioSave = async () => {
    try {
      await updateUser.mutateAsync({ bio: newBio.trim() });
      toast({ title: "Success", description: "Bio updated successfully!" });
      setIsEditingBio(false);
      queryClient.invalidateQueries({ queryKey: ["/api/user"] });
      queryClient.invalidateQueries({ queryKey: ["/api/users", id] });
    } catch (err: any) {
      toast({
        title: "Error",
        description: err.message || "Failed to update bio",
        variant: "destructive",
      });
    }
  };

  const handleBioCancel = () => {
    setIsEditingBio(false);
    setNewBio("");
  };

  const handleMatchQuestionsEdit = () => {
    setMatchQuestions({
      seekingType: user?.seekingType || "",
      relationshipType: user?.relationshipType || "",
      meetingPreference: user?.meetingPreference || "",
      gamingPlatform: user?.gamingPlatform || "",
      catOrDog: user?.catOrDog || "",
      drinking: user?.drinking || "",
      smoking: user?.smoking || "",
    });
    setIsEditingMatchQuestions(true);
  };

  const handleMatchQuestionsSave = async () => {
    try {
      await updateUser.mutateAsync(matchQuestions);
      toast({ title: "Success", description: "Match preferences updated!" });
      setIsEditingMatchQuestions(false);
      queryClient.invalidateQueries({ queryKey: ["/api/user"] });
      queryClient.invalidateQueries({ queryKey: ["/api/users", id] });
    } catch (err: any) {
      toast({
        title: "Error",
        description: err.message || "Failed to update preferences",
        variant: "destructive",
      });
    }
  };

  if (isLoading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-[60vh]">
          <Loader2 className="w-10 h-10 text-purple-500 animate-spin" />
        </div>
      </Layout>
    );
  }

  if (error || !user) {
    return (
      <Layout>
        <div className="flex flex-col items-center justify-center h-[60vh] text-center">
          <AlertCircle className="w-12 h-12 text-red-400 mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">User Not Found</h2>
          <p className="text-gray-500">This profile might have been deleted or doesn't exist.</p>
        </div>
      </Layout>
    );
  }

  const bannerUrl = user.bannerPicture 
    ? `/objects/${user.bannerPicture.replace("/objects/", "")}`
    : null;

  return (
    <Layout>
      <div className="max-w-4xl mx-auto">
        <div className="bg-white dark:bg-gray-900 rounded-[2rem] shadow-xl overflow-hidden border border-purple-100 dark:border-purple-900">
          {/* Header/Cover */}
          <div 
            className={`h-48 md:h-64 relative group ${!bannerUrl ? 'bg-gradient-to-r from-pink-400 via-purple-400 to-indigo-400' : ''}`}
            style={bannerUrl ? { backgroundImage: `url(${bannerUrl})`, backgroundSize: 'cover', backgroundPosition: 'center' } : {}}
          >
            {isOwnProfile && (
              <label className="absolute inset-0 flex items-center justify-center bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                <div className="bg-white/90 p-3 rounded-full shadow-lg flex items-center gap-2">
                  <Camera className="w-5 h-5 text-purple-600" />
                  <span className="text-sm font-bold text-purple-600 pr-1">Change Banner</span>
                </div>
                <input type="file" className="hidden" accept="image/*" onChange={(e) => handleFileUpload(e, "bannerPicture")} />
              </label>
            )}

            <div className="absolute -bottom-16 left-8 md:left-12">
              <div className="w-32 h-32 md:w-40 md:h-40 rounded-3xl bg-white p-2 shadow-xl relative group/avatar">
                 <div className="w-full h-full rounded-2xl bg-gray-100 flex items-center justify-center overflow-hidden bg-gradient-to-br from-gray-100 to-gray-200">
                    {user.profilePicture ? (
                      <img src={`/objects/${user.profilePicture.replace("/objects/", "")}`} alt={user.username} className="w-full h-full object-cover" />
                    ) : (
                      <User className="w-16 h-16 text-gray-400" />
                    )}
                 </div>
                 {isOwnProfile && (
                   <label className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover/avatar:opacity-100 transition-opacity cursor-pointer rounded-3xl">
                     <Camera className="w-8 h-8 text-white" />
                     <input type="file" className="hidden" accept="image/*" onChange={(e) => handleFileUpload(e, "profilePicture")} />
                   </label>
                 )}
              </div>
            </div>
          </div>

          {/* Profile Content */}
          <div className="pt-20 px-8 md:px-12 pb-12">
            <div className="flex flex-col md:flex-row justify-between items-start gap-4 mb-8">
              <div>
                {isOwnProfile && isEditingUsername ? (
                  <div className="flex items-center gap-2 mb-2">
                    <Input
                      value={newUsername}
                      onChange={(e) => setNewUsername(e.target.value)}
                      className="text-2xl font-bold w-64"
                      placeholder="Enter new username"
                      data-testid="input-edit-username"
                    />
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={handleUsernameSave}
                      disabled={updateUser.isPending}
                      data-testid="button-save-username"
                    >
                      <Check className="w-5 h-5 text-green-600" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={handleUsernameCancel}
                      data-testid="button-cancel-username"
                    >
                      <X className="w-5 h-5 text-red-500" />
                    </Button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 mb-2">
                    <h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-gray-100">
                      {user.username}
                    </h1>
                    {isOwnProfile && (
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={handleUsernameEdit}
                        data-testid="button-edit-username"
                      >
                        <Pencil className="w-4 h-4 text-gray-500" />
                      </Button>
                    )}
                  </div>
                )}
                <div className="flex flex-wrap items-center gap-3">
                   <span className="flex items-center gap-1.5 px-3 py-1 bg-purple-100 dark:bg-purple-800 text-purple-800 dark:text-purple-100 rounded-lg text-sm font-medium border border-purple-200 dark:border-purple-700">
                     <User className="w-4 h-4" /> {user.role}
                   </span>
                   <span className="flex items-center gap-1.5 px-3 py-1 bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-100 rounded-lg text-sm font-medium border border-gray-200 dark:border-gray-600">
                     <MapPin className="w-4 h-4" /> {user.location}
                   </span>
                   <span className="flex items-center gap-1.5 px-3 py-1 bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-100 rounded-lg text-sm font-medium border border-gray-200 dark:border-gray-600">
                     <Calendar className="w-4 h-4" /> {user.age} years old
                   </span>
                </div>
                
                {/* Status Update Section */}
                {isOwnProfile && isEditingStatus ? (
                  <div className="mt-4 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                    <div className="flex items-start gap-2">
                      <Clock className="w-4 h-4 text-gray-400 mt-2 flex-shrink-0" />
                      <div className="flex-1">
                        <Input
                          value={newStatus}
                          onChange={(e) => setNewStatus(e.target.value)}
                          placeholder="What's happening? (280 chars max)"
                          maxLength={280}
                          className="mb-2"
                          data-testid="input-status"
                        />
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-muted-foreground">{newStatus.length}/280</span>
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => {
                                setIsEditingStatus(false);
                                setNewStatus("");
                              }}
                            >
                              Cancel
                            </Button>
                            <Button
                              size="sm"
                              onClick={() => postStatusMutation.mutate(newStatus.trim())}
                              disabled={!newStatus.trim() || postStatusMutation.isPending}
                              data-testid="button-post-status"
                            >
                              {postStatusMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : userStatus ? (
                  <div className="mt-4 flex items-start gap-2">
                    <Clock className="w-4 h-4 text-gray-500 dark:text-gray-400 mt-0.5 flex-shrink-0" />
                    <div className="flex-1">
                      <p className="text-sm text-gray-900 dark:text-gray-100 italic mobile-text-fix">{userStatus.content}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Expires in 12 hours</p>
                    </div>
                    {isOwnProfile && (
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => deleteStatusMutation.mutate()}
                        disabled={deleteStatusMutation.isPending}
                        data-testid="button-delete-status"
                      >
                        <X className="w-4 h-4 text-gray-500" />
                      </Button>
                    )}
                  </div>
                ) : isOwnProfile ? (
                  <Button
                    variant="outline"
                    size="sm"
                    className="mt-4"
                    onClick={() => setIsEditingStatus(true)}
                    data-testid="button-set-status"
                  >
                    <Clock className="w-4 h-4 mr-2" />
                    Set your status
                  </Button>
                ) : null}
              </div>
              
              <div className="flex items-center gap-2">
                {!isOwnProfile && (
                  <Button
                    onClick={goToMessages}
                    data-testid="button-send-message"
                  >
                    <MessageCircle className="w-4 h-4 mr-2" />
                    Message
                  </Button>
                )}
                <button 
                  onClick={handleReport}
                  className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  data-testid="button-report-profile"
                >
                  <Flag className="w-4 h-4" />
                  Report
                </button>
              </div>
            </div>

            <div className="grid md:grid-cols-3 gap-8 md:gap-12">
              <div className="md:col-span-2 space-y-8">
                <section>
                  <div className="flex items-center justify-between mb-4 border-b border-gray-100 dark:border-gray-700 pb-2">
                    <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100">About Me</h3>
                    {isOwnProfile && !isEditingBio && (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={handleBioEdit}
                        data-testid="button-edit-bio"
                      >
                        <Pencil className="w-4 h-4 mr-1" />
                        Edit
                      </Button>
                    )}
                  </div>
                  {isOwnProfile && isEditingBio ? (
                    <div className="space-y-3">
                      <Textarea
                        value={newBio}
                        onChange={(e) => setNewBio(e.target.value)}
                        placeholder="Tell others about yourself..."
                        className="min-h-[120px] text-base text-gray-900 dark:text-gray-100"
                        data-testid="input-edit-bio"
                      />
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          onClick={handleBioSave}
                          disabled={updateUser.isPending}
                          data-testid="button-save-bio"
                        >
                          <Check className="w-4 h-4 mr-1" />
                          Save
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={handleBioCancel}
                          data-testid="button-cancel-bio"
                        >
                          <X className="w-4 h-4 mr-1" />
                          Cancel
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <p className="text-gray-900 dark:text-gray-100 leading-relaxed whitespace-pre-line text-lg mobile-text-fix">
                      {user.bio || "This user hasn't written a bio yet."}
                    </p>
                  )}
                </section>

                {isOwnProfile && (
                  <section>
                    <div className="flex items-center justify-between mb-4 border-b border-gray-100 dark:border-gray-700 pb-2">
                      <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                        <Heart className="w-5 h-5 text-pink-500" />
                        Match Questions
                      </h3>
                      {!isEditingMatchQuestions && (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={handleMatchQuestionsEdit}
                          data-testid="button-edit-match-questions"
                        >
                          <Pencil className="w-4 h-4 mr-1" />
                          Edit
                        </Button>
                      )}
                    </div>
                    
                    {isEditingMatchQuestions ? (
                      <div className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">What are you seeking?</label>
                            <Select value={matchQuestions.seekingType} onValueChange={(v) => setMatchQuestions(prev => ({ ...prev, seekingType: v }))}>
                              <SelectTrigger data-testid="select-seeking-type">
                                <SelectValue placeholder="Select..." />
                              </SelectTrigger>
                              <SelectContent>
                                {SEEKING_TYPES.map((type) => (
                                  <SelectItem key={type} value={type}>{type}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Relationship type</label>
                            <Select value={matchQuestions.relationshipType} onValueChange={(v) => setMatchQuestions(prev => ({ ...prev, relationshipType: v }))}>
                              <SelectTrigger data-testid="select-relationship-type">
                                <SelectValue placeholder="Select..." />
                              </SelectTrigger>
                              <SelectContent>
                                {RELATIONSHIP_TYPES.map((type) => (
                                  <SelectItem key={type} value={type}>{type}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Meeting preference</label>
                            <Select value={matchQuestions.meetingPreference} onValueChange={(v) => setMatchQuestions(prev => ({ ...prev, meetingPreference: v }))}>
                              <SelectTrigger data-testid="select-meeting-preference">
                                <SelectValue placeholder="Select..." />
                              </SelectTrigger>
                              <SelectContent>
                                {MEETING_PREFERENCES.map((type) => (
                                  <SelectItem key={type} value={type}>{type}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Gaming platform</label>
                            <Select value={matchQuestions.gamingPlatform} onValueChange={(v) => setMatchQuestions(prev => ({ ...prev, gamingPlatform: v }))}>
                              <SelectTrigger data-testid="select-gaming-platform">
                                <SelectValue placeholder="Select..." />
                              </SelectTrigger>
                              <SelectContent>
                                {GAMING_PLATFORMS.map((type) => (
                                  <SelectItem key={type} value={type}>{type}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Cat or Dog person?</label>
                            <Select value={matchQuestions.catOrDog} onValueChange={(v) => setMatchQuestions(prev => ({ ...prev, catOrDog: v }))}>
                              <SelectTrigger data-testid="select-cat-or-dog">
                                <SelectValue placeholder="Select..." />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="Cat">Cat</SelectItem>
                                <SelectItem value="Dog">Dog</SelectItem>
                                <SelectItem value="Both">Both</SelectItem>
                                <SelectItem value="Neither">Neither</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Drinking</label>
                            <Select value={matchQuestions.drinking} onValueChange={(v) => setMatchQuestions(prev => ({ ...prev, drinking: v }))}>
                              <SelectTrigger data-testid="select-drinking">
                                <SelectValue placeholder="Select..." />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="Never">Never</SelectItem>
                                <SelectItem value="Socially">Socially</SelectItem>
                                <SelectItem value="Regularly">Regularly</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Smoking</label>
                            <Select value={matchQuestions.smoking} onValueChange={(v) => setMatchQuestions(prev => ({ ...prev, smoking: v }))}>
                              <SelectTrigger data-testid="select-smoking">
                                <SelectValue placeholder="Select..." />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="Never">Never</SelectItem>
                                <SelectItem value="Sometimes">Sometimes</SelectItem>
                                <SelectItem value="Regularly">Regularly</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                        <div className="flex gap-2 pt-2">
                          <Button
                            size="sm"
                            onClick={handleMatchQuestionsSave}
                            disabled={updateUser.isPending}
                            data-testid="button-save-match-questions"
                          >
                            <Check className="w-4 h-4 mr-1" />
                            Save
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setIsEditingMatchQuestions(false)}
                            data-testid="button-cancel-match-questions"
                          >
                            <X className="w-4 h-4 mr-1" />
                            Cancel
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                        {user.seekingType || user.relationshipType || user.meetingPreference ? (
                          <div className="flex flex-wrap gap-2">
                            {user.seekingType && <span className="px-2 py-1 bg-pink-50 dark:bg-pink-900/30 text-pink-600 dark:text-pink-400 rounded-full text-xs">{user.seekingType}</span>}
                            {user.relationshipType && <span className="px-2 py-1 bg-purple-50 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 rounded-full text-xs">{user.relationshipType}</span>}
                            {user.meetingPreference && <span className="px-2 py-1 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-full text-xs">{user.meetingPreference}</span>}
                            {user.gamingPlatform && <span className="px-2 py-1 bg-green-50 dark:bg-green-900/30 text-green-600 dark:text-green-400 rounded-full text-xs">{user.gamingPlatform}</span>}
                          </div>
                        ) : (
                          <p className="text-gray-400 italic">No match questions answered yet. Fill these out to see compatibility with other users!</p>
                        )}
                      </div>
                    )}
                  </section>
                )}

                <section>
                  <div className="flex items-center justify-between mb-4 border-b border-gray-100 dark:border-gray-700 pb-2">
                    <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100">Photos</h3>
                    {isOwnProfile && profilePictures.length < 6 && (
                      <label className="cursor-pointer">
                        <Button size="sm" variant="default" asChild>
                          <span>
                            <Plus className="w-4 h-4 mr-1" />
                            Add Photo
                          </span>
                        </Button>
                        <input
                          type="file"
                          className="hidden"
                          accept="image/*"
                          onChange={handleAddPicture}
                          disabled={isUploading || addPictureMutation.isPending}
                          data-testid="input-add-photo"
                        />
                      </label>
                    )}
                  </div>
                  
                  {profilePictures.length > 0 ? (
                    <div className="grid grid-cols-3 gap-3">
                      {profilePictures.map((pic) => (
                        <div
                          key={pic.id}
                          className="relative aspect-square rounded-xl overflow-hidden group cursor-pointer"
                          onClick={() => setSelectedPicture(`/objects/${pic.objectPath.replace("/objects/", "")}`)}
                          data-testid={`photo-${pic.id}`}
                        >
                          <img
                            src={`/objects/${pic.objectPath.replace("/objects/", "")}`}
                            alt="Profile photo"
                            className="w-full h-full object-cover"
                          />
                          {isOwnProfile && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                deletePictureMutation.mutate(pic.id);
                              }}
                              className="absolute top-2 right-2 p-1.5 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                              disabled={deletePictureMutation.isPending}
                              data-testid={`button-delete-photo-${pic.id}`}
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-400 text-sm">No photos uploaded yet.</p>
                  )}
                </section>
              </div>

              <div className="md:col-span-1 space-y-4">
                 <div className="bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/30 dark:to-pink-900/30 rounded-2xl p-6 border border-purple-100 dark:border-purple-800">
                    <h3 className="font-bold text-gray-900 dark:text-white mb-4 mobile-text-fix">Safety Tips</h3>
                    <ul className="space-y-3 text-sm text-gray-900 dark:text-gray-200 mobile-text-fix">
                       <li className="flex gap-2">
                         <span className="text-purple-500 dark:text-purple-400">•</span>
                         <span className="mobile-text-fix">Never share financial info</span>
                       </li>
                       <li className="flex gap-2">
                         <span className="text-purple-500 dark:text-purple-400">•</span>
                         <span className="mobile-text-fix">Meet in public places first</span>
                       </li>
                       <li className="flex gap-2">
                         <span className="text-purple-500 dark:text-purple-400">•</span>
                         <span className="mobile-text-fix">Trust your instincts</span>
                       </li>
                    </ul>
                 </div>

                 {isOwnProfile && (
                   <div className="bg-red-50 dark:bg-red-900/20 rounded-2xl p-6 border border-red-100 dark:border-red-800">
                     <h3 className="font-bold text-red-700 dark:text-red-400 mb-2">Delete Account</h3>
                     <p className="text-sm text-red-600 dark:text-red-300 mb-4">
                       Permanently delete your account and all associated data. This action cannot be undone.
                     </p>
                     {!showDeleteConfirm ? (
                       <Button 
                         variant="destructive" 
                         size="sm"
                         onClick={() => setShowDeleteConfirm(true)}
                         data-testid="button-show-delete-account"
                       >
                         <Trash2 className="w-4 h-4 mr-1" />
                         Delete My Account
                       </Button>
                     ) : (
                       <div className="space-y-3">
                         <p className="text-sm font-medium text-red-700 dark:text-red-300">
                           Are you sure? This will permanently delete your account, messages, and photos.
                         </p>
                         <div className="flex gap-2">
                           <Button
                             variant="destructive"
                             size="sm"
                             onClick={() => deleteAccountMutation.mutate()}
                             disabled={deleteAccountMutation.isPending}
                             data-testid="button-confirm-delete-account"
                           >
                             {deleteAccountMutation.isPending ? (
                               <Loader2 className="w-4 h-4 animate-spin mr-1" />
                             ) : (
                               <Trash2 className="w-4 h-4 mr-1" />
                             )}
                             Yes, Delete Forever
                           </Button>
                           <Button
                             variant="outline"
                             size="sm"
                             onClick={() => setShowDeleteConfirm(false)}
                             data-testid="button-cancel-delete-account"
                           >
                             Cancel
                           </Button>
                         </div>
                       </div>
                     )}
                   </div>
                 )}
              </div>
            </div>

            {selectedPicture && (
              <div
                className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4"
                onClick={() => setSelectedPicture(null)}
              >
                <div className="relative max-w-4xl max-h-[90vh]">
                  <img
                    src={selectedPicture}
                    alt="Full size"
                    className="max-w-full max-h-[90vh] object-contain rounded-lg"
                  />
                  <button
                    onClick={() => setSelectedPicture(null)}
                    className="absolute top-4 right-4 p-2 bg-white/20 hover:bg-white/30 rounded-full text-white transition-colors"
                    data-testid="button-close-lightbox"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
}
