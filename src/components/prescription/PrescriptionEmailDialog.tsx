import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { Loader2, Mail, ChevronDown, Paperclip } from "lucide-react";
import { generatePrescriptionPDFBase64 } from "@/lib/prescriptionExport";

interface PrescriptionEmailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  patientName: string;
  patientEmail?: string;
  patientId: string;
  patientAge?: string;
  patientContact?: string;
  patientAddress?: string;
  prescription: string;
  pdfSettings?: any;
  logoDataUrl?: string;
  signatureDataUrl?: string;
}

export function PrescriptionEmailDialog({
  open,
  onOpenChange,
  patientName,
  patientEmail,
  patientId,
  patientAge,
  patientContact,
  patientAddress,
  prescription,
  pdfSettings,
  logoDataUrl,
  signatureDataUrl,
}: PrescriptionEmailDialogProps) {
  const [recipientEmail, setRecipientEmail] = useState(patientEmail || "");
  const [ccEmail, setCcEmail] = useState("");
  const [bccEmail, setBccEmail] = useState("");
  const [subject, setSubject] = useState(`Prescription for ${patientName}`);
  const [additionalMessage, setAdditionalMessage] = useState("");
  const [attachPdf, setAttachPdf] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [showCcBcc, setShowCcBcc] = useState(false);

  const validateEmails = (emailString: string): boolean => {
    if (!emailString.trim()) return true;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const emails = emailString.split(',').map(e => e.trim()).filter(e => e);
    return emails.every(email => emailRegex.test(email));
  };

  const handleSend = async () => {
    if (!recipientEmail) {
      toast({
        title: "Error",
        description: "Please enter a recipient email address",
        variant: "destructive",
      });
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(recipientEmail)) {
      toast({
        title: "Error",
        description: "Please enter a valid recipient email address",
        variant: "destructive",
      });
      return;
    }

    if (!validateEmails(ccEmail)) {
      toast({
        title: "Error",
        description: "Please enter valid CC email addresses (comma-separated)",
        variant: "destructive",
      });
      return;
    }

    if (!validateEmails(bccEmail)) {
      toast({
        title: "Error",
        description: "Please enter valid BCC email addresses (comma-separated)",
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

      // Generate PDF if requested
      let pdfBase64: string | undefined;
      if (attachPdf) {
        pdfBase64 = await generatePrescriptionPDFBase64(
          prescription,
          patientId,
          patientName,
          patientAge,
          patientContact,
          patientAddress,
          pdfSettings,
          logoDataUrl,
          signatureDataUrl
        );
      }

      const { error } = await supabase.functions.invoke("send-prescription-email", {
        body: {
          recipientEmail,
          ccEmails: ccEmail ? ccEmail.split(',').map(e => e.trim()).filter(e => e) : [],
          bccEmails: bccEmail ? bccEmail.split(',').map(e => e.trim()).filter(e => e) : [],
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
          pdfBase64,
          pdfFilename: pdfBase64 ? `Prescription_${patientName.replace(/\s+/g, "_")}.pdf` : undefined,
        },
      });

      if (error) throw error;

      toast({
        title: "Email Sent",
        description: `Prescription successfully sent to ${recipientEmail}${ccEmail ? ` (CC: ${ccEmail})` : ''}`,
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
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
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

          <Collapsible open={showCcBcc} onOpenChange={setShowCcBcc}>
            <CollapsibleTrigger asChild>
              <Button variant="ghost" size="sm" className="text-muted-foreground p-0 h-auto">
                <ChevronDown className={`h-4 w-4 mr-1 transition-transform ${showCcBcc ? 'rotate-180' : ''}`} />
                {showCcBcc ? 'Hide' : 'Add'} CC/BCC
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="space-y-3 mt-3">
              <div className="space-y-2">
                <Label htmlFor="cc">CC (comma-separated)</Label>
                <Input
                  id="cc"
                  type="text"
                  placeholder="pharmacy@example.com, doctor@example.com"
                  value={ccEmail}
                  onChange={(e) => setCcEmail(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  Copy to pharmacy or referring physician
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="bcc">BCC (comma-separated)</Label>
                <Input
                  id="bcc"
                  type="text"
                  placeholder="records@clinic.com"
                  value={bccEmail}
                  onChange={(e) => setBccEmail(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  Hidden copy for record keeping
                </p>
              </div>
            </CollapsibleContent>
          </Collapsible>

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
              className="min-h-[80px]"
            />
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="attachPdf"
              checked={attachPdf}
              onCheckedChange={(checked) => setAttachPdf(checked as boolean)}
            />
            <Label htmlFor="attachPdf" className="flex items-center gap-2 cursor-pointer">
              <Paperclip className="h-4 w-4" />
              Attach PDF version of prescription
            </Label>
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
