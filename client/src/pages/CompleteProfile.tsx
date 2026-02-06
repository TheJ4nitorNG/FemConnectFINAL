import { useState } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { useUpload } from "@/hooks/use-upload";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Loader2, Camera, User, CheckCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";

export default function CompleteProfile() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { uploadFile, isUploading, progress } = useUpload();
  const [uploadedPicture, setUploadedPicture] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  if (!user) {
    setLocation("/auth");
    return null;
  }

  if (user.profilePicture) {
    setLocation("/dashboard");
    return null;
  }

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast({ title: "Please select an image file", variant: "destructive" });
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      toast({ title: "Image must be less than 10MB", variant: "destructive" });
      return;
    }

    const response = await uploadFile(file);
    if (response) {
      setUploadedPicture(response.objectPath);
      toast({ title: "Photo uploaded successfully!" });
    }
  };

  const handleComplete = async () => {
    if (!uploadedPicture) {
      toast({ title: "Please upload a profile picture first", variant: "destructive" });
      return;
    }

    setIsSaving(true);
    try {
      await apiRequest("PATCH", "/api/user", { profilePicture: uploadedPicture });
      queryClient.invalidateQueries({ queryKey: ["/api/user"] });
      toast({ title: "Profile complete!", description: "Welcome to FemConnect!" });
      setLocation("/dashboard");
    } catch (err) {
      toast({ title: "Failed to save profile picture", variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  };

  const getPreviewUrl = () => {
    if (uploadedPicture) {
      return `/objects/${uploadedPicture.replace("/objects/", "")}`;
    }
    return null;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-white to-purple-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-display bg-clip-text text-transparent bg-gradient-to-r from-pink-600 to-purple-600">
            Almost there!
          </CardTitle>
          <CardDescription className="text-base">
            Upload a profile picture to complete your registration and prove you're a real person.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex flex-col items-center gap-4">
            <div className="relative">
              <Avatar className="w-32 h-32 border-4 border-purple-200">
                {getPreviewUrl() ? (
                  <AvatarImage src={getPreviewUrl()!} alt="Profile preview" />
                ) : (
                  <AvatarFallback className="bg-gradient-to-br from-pink-100 to-purple-100">
                    <User className="w-16 h-16 text-purple-300" />
                  </AvatarFallback>
                )}
              </Avatar>
              {uploadedPicture && (
                <div className="absolute -bottom-1 -right-1 bg-green-500 text-white rounded-full p-1">
                  <CheckCircle className="w-5 h-5" />
                </div>
              )}
            </div>

            <div className="flex flex-col items-center gap-2">
              <label htmlFor="profile-upload">
                <input
                  id="profile-upload"
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="hidden"
                  disabled={isUploading}
                  data-testid="input-profile-picture"
                />
                <Button
                  type="button"
                  variant="outline"
                  disabled={isUploading}
                  onClick={() => document.getElementById("profile-upload")?.click()}
                  data-testid="button-upload-picture"
                >
                  {isUploading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Uploading {progress}%
                    </>
                  ) : (
                    <>
                      <Camera className="w-4 h-4 mr-2" />
                      {uploadedPicture ? "Change Photo" : "Upload Photo"}
                    </>
                  )}
                </Button>
              </label>
              <p className="text-xs text-gray-500">JPG, PNG or GIF. Max 10MB.</p>
            </div>
          </div>

          <div className="bg-blue-50 text-blue-800 p-4 rounded-lg text-sm">
            <p className="font-medium mb-1">Why is this required?</p>
            <p className="text-blue-700">
              A profile picture helps verify you're a real person and makes our community safer for everyone.
            </p>
          </div>

          <Button
            onClick={handleComplete}
            disabled={!uploadedPicture || isSaving}
            className="w-full bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700"
            data-testid="button-complete-profile"
          >
            {isSaving ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              "Complete Registration"
            )}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
