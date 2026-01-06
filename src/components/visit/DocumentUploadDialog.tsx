import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useSubUser } from "@/hooks/useSubUser";
import { useActivityLog } from "@/hooks/useActivityLog";

interface DocumentUploadDialogProps {
  open: boolean;
  onClose: () => void;
  visitId: string;
  patientId: string;
  patientName?: string;
  onUploadSuccess: () => void;
}

export default function DocumentUploadDialog({
  open,
  onClose,
  visitId,
  patientId,
  patientName,
  onUploadSuccess,
}: DocumentUploadDialogProps) {
  const [documentDate, setDocumentDate] = useState("");
  const [documentType, setDocumentType] = useState("");
  const [description, setDescription] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const { isSubUser, getOwnerIdForLogging } = useSubUser();
  const { logActivity } = useActivityLog();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    // Validate file type
    const validTypes = ["application/pdf", "image/jpeg", "image/png", "image/gif"];
    if (!validTypes.includes(selectedFile.type)) {
      toast({
        title: "Invalid File Type",
        description: "Please upload a PDF, JPG, PNG, or GIF file",
        variant: "destructive",
      });
      return;
    }

    // Validate file size (1MB = 1048576 bytes)
    if (selectedFile.size > 1048576) {
      toast({
        title: "File Too Large",
        description: "File size must be less than 1MB",
        variant: "destructive",
      });
      return;
    }

    setFile(selectedFile);
  };

  const handleSubmit = async () => {
    if (!documentDate || !documentType || !description || !file) {
      toast({
        title: "Validation Error",
        description: "Please fill all required fields",
        variant: "destructive",
      });
      return;
    }

    setIsUploading(true);

    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("User not authenticated");

      // Upload file to storage
      const fileExt = file.name.split(".").pop();
      const fileName = `${user.id}/${visitId}/${Date.now()}.${fileExt}`;
      const { error: uploadError } = await supabase.storage
        .from("visit-documents")
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      // Create document record
      const { data: docData, error: dbError } = await supabase.from("documents").insert({
        visit_id: visitId,
        patient_id: patientId,
        user_id: user.id,
        document_date: documentDate,
        document_type: documentType,
        description,
        file_path: fileName,
        file_name: file.name,
        file_type: file.type,
        file_size: file.size,
        upload_date: new Date().toISOString(),
      }).select().single();

      if (dbError) throw dbError;

      // Log activity if sub-user
      if (isSubUser && docData) {
        const ownerId = await getOwnerIdForLogging();
        if (ownerId) {
          await logActivity(
            ownerId,
            "create",
            "document",
            docData.id,
            patientName || "Unknown Patient",
            `Uploaded ${documentType}: ${file.name}`
          );
        }
      }

      toast({
        title: "Success",
        description: "Document uploaded successfully",
      });

      onUploadSuccess();
      handleClose();
    } catch (error: any) {
      console.error("Upload error:", error);
      toast({
        title: "Upload Failed",
        description: error.message || "Failed to upload document",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleClose = () => {
    setDocumentDate("");
    setDocumentType("");
    setDescription("");
    setFile(null);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Upload Document</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div>
            <Label htmlFor="documentDate">Date on Document *</Label>
            <Input
              id="documentDate"
              type="date"
              value={documentDate}
              onChange={(e) => setDocumentDate(e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="documentType">Document Type *</Label>
            <Select value={documentType} onValueChange={setDocumentType}>
              <SelectTrigger>
                <SelectValue placeholder="Select document type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Report">Report</SelectItem>
                <SelectItem value="Requisition">Requisition</SelectItem>
                <SelectItem value="Letter">Letter</SelectItem>
                <SelectItem value="Notes">Notes</SelectItem>
                <SelectItem value="Hospital Record">Hospital Record</SelectItem>
                <SelectItem value="Other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="description">Description *</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Enter document description"
            />
          </div>
          <div>
            <Label htmlFor="file">Choose File *</Label>
            <Input
              id="file"
              type="file"
              accept=".pdf,.jpg,.jpeg,.png,.gif"
              onChange={handleFileChange}
            />
            <p className="text-xs text-muted-foreground mt-1">
              Accepted formats: PDF, JPG, PNG, GIF | Max size: 1MB
            </p>
            {file && <p className="text-sm mt-1">Selected: {file.name}</p>}
          </div>
          <div>
            <Label>Upload Date</Label>
            <Input value={new Date().toLocaleDateString()} disabled />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={isUploading}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isUploading}>
            {isUploading ? "Uploading..." : "Save"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
