import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { Loader2, Mail } from "lucide-react";

interface PrescriptionEmailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  patientName: string;
  patientEmail?: string;
  prescription: string;
}

export function PrescriptionEmailDialog({
  open,
  onOpenChange,
  patientName,
  patientEmail,
  prescription,
}: PrescriptionEmailDialogProps) {
  const [recipientEmail, setRecipientEmail] = useState(patientEmail || "");
  const [subject, setSubject] = useState(`Prescription for ${patientName}`);
  const [additionalMessage, setAdditionalMessage] = useState("");
  const [isSending, setIsSending] = useState(false);

  const handleSend = async () => {
    if (!recipientEmail) {
      toast({
        title: "Error",
        description: "Please enter a recipient email address",
        variant: "destructive",
      });
      return;
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(recipientEmail)) {
      toast({
        title: "Error",
        description: "Please enter a valid email address",
        variant: "destructive",
      });
      return;
    }

    setIsSending(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      // Get doctor's profile
      const { data: profile } = await supabase
        .from("profiles")
        .select("first_name, last_name, specialty, clinic_name, clinic_address, license_number, phone")
        .eq("user_id", user.id)
        .maybeSingle();

      const doctorName = profile 
        ? `Dr. ${profile.first_name || ''} ${profile.last_name || ''}`.trim() 
        : "Your Healthcare Provider";
      
      const clinicName = profile?.clinic_name || "";
      const clinicAddress = profile?.clinic_address || "";
      const specialty = profile?.specialty || "";
      const licenseNumber = profile?.license_number || "";
      const phone = profile?.phone || "";

      const { error } = await supabase.functions.invoke("send-prescription-email", {
        body: {
          recipientEmail,
          subject,
          patientName,
          prescription,
          additionalMessage,
          doctorName,
          clinicName,
          clinicAddress,
          specialty,
          licenseNumber,
          phone,
        },
      });

      if (error) throw error;

      toast({
        title: "Email Sent",
        description: `Prescription successfully sent to ${recipientEmail}`,
      });
      onOpenChange(false);
    } catch (error: any) {
      console.error("Error sending email:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to send email",
        variant: "destructive",
      });
    } finally {
      setIsSending(false);
    }
  };

  // Strip HTML for preview
  const plainTextPreview = prescription
    .replace(/<[^>]*>/g, '')
    .replace(/&nbsp;/g, ' ')
    .trim();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Email Prescription
          </DialogTitle>
          <DialogDescription>
            Send the prescription to a patient or pharmacy via email.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="recipient">Recipient Email *</Label>
            <Input
              id="recipient"
              type="email"
              placeholder="patient@example.com"
              value={recipientEmail}
              onChange={(e) => setRecipientEmail(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="subject">Subject</Label>
            <Input
              id="subject"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="message">Additional Message (Optional)</Label>
            <Textarea
              id="message"
              placeholder="Add any additional notes or instructions for the recipient..."
              value={additionalMessage}
              onChange={(e) => setAdditionalMessage(e.target.value)}
              className="min-h-[100px]"
            />
          </div>

          <div className="bg-muted/50 p-3 rounded-lg text-sm">
            <p className="font-medium mb-2">Prescription Preview:</p>
            <p className="text-muted-foreground">
              {plainTextPreview.slice(0, 200)}{plainTextPreview.length > 200 ? "..." : ""}
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSending}>
            Cancel
          </Button>
          <Button onClick={handleSend} disabled={isSending}>
            {isSending ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Sending...
              </>
            ) : (
              <>
                <Mail className="h-4 w-4 mr-2" />
                Send Email
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
