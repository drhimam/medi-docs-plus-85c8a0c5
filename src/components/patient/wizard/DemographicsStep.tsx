import { useState, useRef } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Camera, Upload, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface DemographicsStepProps {
  register: any;
  watch: any;
  setValue: any;
  errors: any;
}

export const DemographicsStep = ({ register, watch, setValue, errors }: DemographicsStepProps) => {
  const gender = watch("gender");
  const bloodGroup = watch("blood_group");
  const firstName = watch("first_name") || "";
  const lastName = watch("last_name") || "";
  const photoUrl = watch("photo_url");
  
  const [uploading, setUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(photoUrl || null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [showCamera, setShowCamera] = useState(false);
  const [stream, setStream] = useState<MediaStream | null>(null);

  const getInitials = () => {
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase() || "?";
  };

  const handleFileUpload = async (file: File) => {
    if (!file) return;
    
    if (!file.type.startsWith("image/")) {
      toast.error("Please upload an image file");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image size must be less than 5MB");
      return;
    }

    setUploading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const fileExt = file.name.split(".").pop();
      const fileName = `${user.id}/${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from("patient-photos")
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const { data: urlData } = await supabase.storage
        .from("patient-photos")
        .createSignedUrl(fileName, 60 * 60 * 24 * 365);

      if (urlData?.signedUrl) {
        setValue("photo_url", fileName);
        setPreviewUrl(urlData.signedUrl);
        toast.success("Photo uploaded successfully");
      }
    } catch (error: any) {
      toast.error(error.message || "Failed to upload photo");
    } finally {
      setUploading(false);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileUpload(file);
    }
  };

  const startCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: "user" } 
      });
      setStream(mediaStream);
      setShowCamera(true);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
    } catch (error) {
      toast.error("Could not access camera. Please check permissions.");
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
    setShowCamera(false);
  };

  const capturePhoto = () => {
    if (!videoRef.current) return;

    const canvas = document.createElement("canvas");
    canvas.width = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;
    const ctx = canvas.getContext("2d");
    
    if (ctx) {
      ctx.drawImage(videoRef.current, 0, 0);
      canvas.toBlob(async (blob) => {
        if (blob) {
          const file = new File([blob], "camera-capture.jpg", { type: "image/jpeg" });
          await handleFileUpload(file);
          stopCamera();
        }
      }, "image/jpeg", 0.9);
    }
  };

  const removePhoto = async () => {
    const currentPath = watch("photo_url");
    if (currentPath) {
      try {
        await supabase.storage.from("patient-photos").remove([currentPath]);
      } catch (error) {
        console.error("Error removing photo:", error);
      }
    }
    setValue("photo_url", "");
    setPreviewUrl(null);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Demographics</CardTitle>
        <CardDescription>Basic patient information and contact details</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Photo Upload Section */}
        <div className="flex flex-col items-center gap-4 pb-4 border-b">
          <div className="relative">
            {showCamera ? (
              <div className="relative">
                <video 
                  ref={videoRef} 
                  autoPlay 
                  playsInline 
                  className="w-32 h-32 rounded-full object-cover"
                />
                <div className="flex gap-2 mt-2 justify-center">
                  <Button type="button" size="sm" onClick={capturePhoto}>
                    Capture
                  </Button>
                  <Button type="button" size="sm" variant="outline" onClick={stopCamera}>
                    Cancel
                  </Button>
                </div>
              </div>
            ) : (
              <>
                <Avatar className="w-32 h-32">
                  <AvatarImage src={previewUrl || undefined} alt="Patient photo" />
                  <AvatarFallback className="text-2xl">{getInitials()}</AvatarFallback>
                </Avatar>
                {previewUrl && (
                  <Button
                    type="button"
                    variant="destructive"
                    size="icon"
                    className="absolute -top-1 -right-1 h-6 w-6 rounded-full"
                    onClick={removePhoto}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                )}
              </>
            )}
          </div>
          
          {!showCamera && (
            <div className="flex gap-2">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleFileSelect}
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
              >
                <Upload className="h-4 w-4 mr-2" />
                {uploading ? "Uploading..." : "Upload Photo"}
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={startCamera}
                disabled={uploading}
              >
                <Camera className="h-4 w-4 mr-2" />
                Take Photo
              </Button>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="first_name">First Name *</Label>
            <Input
              id="first_name"
              {...register("first_name")}
            />
            {errors.first_name && (
              <p className="text-sm text-destructive mt-1">{errors.first_name.message}</p>
            )}
          </div>
          <div>
            <Label htmlFor="last_name">Last Name *</Label>
            <Input
              id="last_name"
              {...register("last_name")}
            />
            {errors.last_name && (
              <p className="text-sm text-destructive mt-1">{errors.last_name.message}</p>
            )}
          </div>
          <div>
            <Label htmlFor="date_of_birth">Date of Birth *</Label>
            <Input
              id="date_of_birth"
              type="date"
              {...register("date_of_birth")}
            />
            {errors.date_of_birth && (
              <p className="text-sm text-destructive mt-1">{errors.date_of_birth.message}</p>
            )}
          </div>
          <div>
            <Label htmlFor="gender">Gender *</Label>
            <Select
              value={gender}
              onValueChange={(value) => setValue("gender", value as "MALE" | "FEMALE" | "OTHER")}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="MALE">Male</SelectItem>
                <SelectItem value="FEMALE">Female</SelectItem>
                <SelectItem value="OTHER">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="contact_number">Contact Number * (digits only)</Label>
            <Input
              id="contact_number"
              placeholder="1234567890"
              {...register("contact_number")}
            />
            {errors.contact_number && (
              <p className="text-sm text-destructive mt-1">{errors.contact_number.message}</p>
            )}
          </div>
          <div>
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              {...register("email")}
            />
            {errors.email && (
              <p className="text-sm text-destructive mt-1">{errors.email.message}</p>
            )}
          </div>
          <div>
            <Label htmlFor="health_card_number">Health Card / Insurance No.</Label>
            <Input
              id="health_card_number"
              placeholder="Enter health card or insurance number"
              {...register("health_card_number")}
            />
          </div>
          <div>
            <Label htmlFor="blood_group">Blood Group</Label>
            <Select
              value={bloodGroup}
              onValueChange={(value) => setValue("blood_group", value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select blood group" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="A+">A+</SelectItem>
                <SelectItem value="A-">A-</SelectItem>
                <SelectItem value="B+">B+</SelectItem>
                <SelectItem value="B-">B-</SelectItem>
                <SelectItem value="AB+">AB+</SelectItem>
                <SelectItem value="AB-">AB-</SelectItem>
                <SelectItem value="O+">O+</SelectItem>
                <SelectItem value="O-">O-</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <div>
          <Label htmlFor="address">Address</Label>
          <Textarea
            id="address"
            {...register("address")}
            rows={3}
          />
        </div>
      </CardContent>
    </Card>
  );
};