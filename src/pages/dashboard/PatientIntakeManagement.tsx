import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { format } from "date-fns";
import { 
  Plus, 
  Send, 
  Copy, 
  Eye, 
  Check, 
  X, 
  Trash2, 
  RefreshCw,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Mail
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";

interface IntakeSubmission {
  id: string;
  intake_token: string;
  patient_email: string;
  patient_name: string | null;
  status: string;
  form_data: any;
  expires_at: string;
  submitted_at: string | null;
  reviewed_at: string | null;
  created_at: string;
}

const PatientIntakeManagement = () => {
  const [submissions, setSubmissions] = useState<IntakeSubmission[]>([]);
  const [loading, setLoading] = useState(true);
  const [showNewDialog, setShowNewDialog] = useState(false);
  const [showViewDialog, setShowViewDialog] = useState(false);
  const [showApproveDialog, setShowApproveDialog] = useState(false);
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [selectedSubmission, setSelectedSubmission] = useState<IntakeSubmission | null>(null);
  const [patientEmail, setPatientEmail] = useState("");
  const [patientName, setPatientName] = useState("");
  const [sending, setSending] = useState(false);
  const [generatedLink, setGeneratedLink] = useState("");
  const [activeTab, setActiveTab] = useState("pending");
  const [profile, setProfile] = useState<any>(null);

  useEffect(() => {
    fetchSubmissions();
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data } = await supabase
          .from("profiles")
          .select("*")
          .eq("user_id", user.id)
          .single();
        setProfile(data);
      }
    } catch (error) {
      console.error("Error fetching profile:", error);
    }
  };

  const fetchSubmissions = async () => {
    try {
      const { data, error } = await supabase
        .from("patient_intake_submissions")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setSubmissions(data || []);
    } catch (error: any) {
      toast.error("Failed to fetch intake submissions");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const generateIntakeLink = async (sendEmail: boolean) => {
    if (!patientEmail) {
      toast.error("Patient email is required");
      return;
    }

    setSending(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      // Create the intake submission
      const { data: newSubmission, error } = await supabase
        .from("patient_intake_submissions")
        .insert({
          user_id: user.id,
          patient_email: patientEmail,
          patient_name: patientName || null,
        })
        .select()
        .single();

      if (error) throw error;

      const intakeUrl = `${window.location.origin}/patient-intake/${newSubmission.intake_token}`;
      setGeneratedLink(intakeUrl);

      if (sendEmail) {
        // Send email via edge function
        const response = await supabase.functions.invoke("send-patient-intake-invite", {
          body: {
            patientEmail,
            patientName: patientName || undefined,
            intakeToken: newSubmission.intake_token,
            clinicName: profile?.clinic_name,
            doctorName: profile?.first_name && profile?.last_name 
              ? `${profile.first_name} ${profile.last_name}` 
              : undefined,
          },
        });

        if (response.error) {
          throw new Error("Failed to send email");
        }

        toast.success("Intake form link sent to patient");
      } else {
        toast.success("Intake form link generated");
      }

      fetchSubmissions();
    } catch (error: any) {
      toast.error(error.message || "Failed to generate intake link");
    } finally {
      setSending(false);
    }
  };

  const copyLink = () => {
    navigator.clipboard.writeText(generatedLink);
    toast.success("Link copied to clipboard");
  };

  const handleApprove = async () => {
    if (!selectedSubmission) return;

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      // Transform form data for patient insert
      const formData = selectedSubmission.form_data;
      
      const patientData = {
        user_id: user.id,
        first_name: formData.first_name,
        last_name: formData.last_name,
        date_of_birth: formData.date_of_birth,
        gender: formData.gender,
        contact_number: formData.contact_number,
        email: formData.email || null,
        address: formData.address || null,
        blood_group: formData.blood_group || null,
        health_card_number: formData.health_card_number || null,
        medical_history_ongoing: formData.medical_history_ongoing || null,
        medical_history_past: formData.medical_history_past || null,
        surgical_history: formData.surgical_history || null,
        hospitalization_history: formData.hospitalization_history || null,
        family_history: formData.family_history || null,
        mental_health_history: formData.mental_health_history || null,
        birth_history: formData.birth_history || null,
        developmental_history: formData.developmental_history || null,
        childhood_illnesses: formData.childhood_illnesses || null,
        accidents_injuries: formData.accidents_injuries || null,
        menstrual_pregnancy_history: formData.menstrual_pregnancy_history || null,
        preventive_screening_history: formData.preventive_screening_history || null,
        ongoing_medications: formData.ongoing_medications 
          ? formData.ongoing_medications.split(",").map((m: string) => m.trim()).filter(Boolean) 
          : [],
        supplements: formData.supplements 
          ? formData.supplements.split(",").map((s: string) => s.trim()).filter(Boolean) 
          : [],
        vaccinations: formData.vaccinations 
          ? formData.vaccinations.split(",").map((v: string) => v.trim()).filter(Boolean) 
          : [],
        allergic_history_food: formData.allergic_history_food 
          ? formData.allergic_history_food.split(",").map((a: string) => a.trim()).filter(Boolean) 
          : [],
        allergic_history_drug: formData.allergic_history_drug 
          ? formData.allergic_history_drug.split(",").map((a: string) => a.trim()).filter(Boolean) 
          : [],
        allergic_history_env: formData.allergic_history_env 
          ? formData.allergic_history_env.split(",").map((a: string) => a.trim()).filter(Boolean) 
          : [],
        smoking_status: formData.smoking_status,
        alcohol_consumption: formData.alcohol_consumption,
        recreational_drug_use: formData.recreational_drug_use || null,
        exercise_habits: formData.exercise_habits || null,
        diet: formData.diet || null,
        occupation: formData.occupation || null,
        living_environment: formData.living_environment || null,
        completion_status: "completed",
      };

      // Insert patient
      const { error: patientError } = await supabase
        .from("patients")
        .insert([patientData]);

      if (patientError) throw patientError;

      // Update submission status
      const { error: updateError } = await supabase
        .from("patient_intake_submissions")
        .update({ 
          status: "approved",
          reviewed_at: new Date().toISOString(),
          reviewed_by: user.id,
        })
        .eq("id", selectedSubmission.id);

      if (updateError) throw updateError;

      toast.success("Patient intake approved and added to patients");
      setShowApproveDialog(false);
      setSelectedSubmission(null);
      fetchSubmissions();
    } catch (error: any) {
      toast.error(error.message || "Failed to approve intake");
    }
  };

  const handleReject = async () => {
    if (!selectedSubmission) return;

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { error } = await supabase
        .from("patient_intake_submissions")
        .update({ 
          status: "rejected",
          reviewed_at: new Date().toISOString(),
          reviewed_by: user.id,
        })
        .eq("id", selectedSubmission.id);

      if (error) throw error;

      toast.success("Patient intake rejected");
      setShowRejectDialog(false);
      setSelectedSubmission(null);
      fetchSubmissions();
    } catch (error: any) {
      toast.error("Failed to reject intake");
    }
  };

  const handleDelete = async (submission: IntakeSubmission) => {
    try {
      const { error } = await supabase
        .from("patient_intake_submissions")
        .delete()
        .eq("id", submission.id);

      if (error) throw error;
      toast.success("Intake submission deleted");
      fetchSubmissions();
    } catch (error: any) {
      toast.error("Failed to delete submission");
    }
  };

  const resendInvite = async (submission: IntakeSubmission) => {
    try {
      const response = await supabase.functions.invoke("send-patient-intake-invite", {
        body: {
          patientEmail: submission.patient_email,
          patientName: submission.patient_name || undefined,
          intakeToken: submission.intake_token,
          clinicName: profile?.clinic_name,
          doctorName: profile?.first_name && profile?.last_name 
            ? `${profile.first_name} ${profile.last_name}` 
            : undefined,
        },
      });

      if (response.error) throw new Error("Failed to send email");
      toast.success("Invite resent successfully");
    } catch (error: any) {
      toast.error("Failed to resend invite");
    }
  };

  const getStatusBadge = (submission: IntakeSubmission) => {
    const isExpired = new Date(submission.expires_at) < new Date();
    
    if (submission.status === "approved") {
      return <Badge className="bg-green-500"><CheckCircle className="h-3 w-3 mr-1" /> Approved</Badge>;
    }
    if (submission.status === "rejected") {
      return <Badge variant="destructive"><XCircle className="h-3 w-3 mr-1" /> Rejected</Badge>;
    }
    if (submission.status === "submitted") {
      return <Badge className="bg-blue-500"><AlertCircle className="h-3 w-3 mr-1" /> Awaiting Review</Badge>;
    }
    if (isExpired) {
      return <Badge variant="secondary"><Clock className="h-3 w-3 mr-1" /> Expired</Badge>;
    }
    return <Badge variant="outline"><Clock className="h-3 w-3 mr-1" /> Pending</Badge>;
  };

  const filteredSubmissions = submissions.filter(s => {
    if (activeTab === "pending") return s.status === "pending" && new Date(s.expires_at) > new Date();
    if (activeTab === "submitted") return s.status === "submitted";
    if (activeTab === "approved") return s.status === "approved";
    if (activeTab === "rejected") return s.status === "rejected";
    return true;
  });

  const pendingCount = submissions.filter(s => s.status === "pending" && new Date(s.expires_at) > new Date()).length;
  const submittedCount = submissions.filter(s => s.status === "submitted").length;

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Patient Intake Management</h1>
          <p className="text-muted-foreground">Send intake forms to patients and manage submissions</p>
        </div>
        <Button onClick={() => {
          setShowNewDialog(true);
          setPatientEmail("");
          setPatientName("");
          setGeneratedLink("");
        }}>
          <Plus className="h-4 w-4 mr-2" />
          New Intake Request
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="pending">
            Pending {pendingCount > 0 && <Badge variant="secondary" className="ml-2">{pendingCount}</Badge>}
          </TabsTrigger>
          <TabsTrigger value="submitted">
            Awaiting Review {submittedCount > 0 && <Badge className="ml-2 bg-blue-500">{submittedCount}</Badge>}
          </TabsTrigger>
          <TabsTrigger value="approved">Approved</TabsTrigger>
          <TabsTrigger value="rejected">Rejected</TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="mt-4">
          <Card>
            <CardContent className="p-0">
              {loading ? (
                <div className="p-8 text-center text-muted-foreground">Loading...</div>
              ) : filteredSubmissions.length === 0 ? (
                <div className="p-8 text-center text-muted-foreground">
                  No submissions found in this category
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Patient</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead>Expires</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredSubmissions.map((submission) => (
                      <TableRow key={submission.id}>
                        <TableCell className="font-medium">
                          {submission.patient_name || "—"}
                        </TableCell>
                        <TableCell>{submission.patient_email}</TableCell>
                        <TableCell>{getStatusBadge(submission)}</TableCell>
                        <TableCell>{format(new Date(submission.created_at), "MMM d, yyyy")}</TableCell>
                        <TableCell>{format(new Date(submission.expires_at), "MMM d, yyyy")}</TableCell>
                        <TableCell className="text-right space-x-2">
                          {submission.status === "submitted" && (
                            <>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => {
                                  setSelectedSubmission(submission);
                                  setShowViewDialog(true);
                                }}
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                className="text-green-600"
                                onClick={() => {
                                  setSelectedSubmission(submission);
                                  setShowApproveDialog(true);
                                }}
                              >
                                <Check className="h-4 w-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                className="text-destructive"
                                onClick={() => {
                                  setSelectedSubmission(submission);
                                  setShowRejectDialog(true);
                                }}
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </>
                          )}
                          {submission.status === "pending" && new Date(submission.expires_at) > new Date() && (
                            <>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => {
                                  const link = `${window.location.origin}/patient-intake/${submission.intake_token}`;
                                  navigator.clipboard.writeText(link);
                                  toast.success("Link copied");
                                }}
                              >
                                <Copy className="h-4 w-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => resendInvite(submission)}
                              >
                                <Mail className="h-4 w-4" />
                              </Button>
                            </>
                          )}
                          {(submission.status === "approved" || submission.status === "rejected") && (
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => {
                                setSelectedSubmission(submission);
                                setShowViewDialog(true);
                              }}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                          )}
                          <Button
                            size="sm"
                            variant="ghost"
                            className="text-destructive"
                            onClick={() => handleDelete(submission)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* New Intake Dialog */}
      <Dialog open={showNewDialog} onOpenChange={setShowNewDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Send Patient Intake Form</DialogTitle>
            <DialogDescription>
              Enter the patient's email to send them an intake form link
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="patientEmail">Patient Email *</Label>
              <Input
                id="patientEmail"
                type="email"
                value={patientEmail}
                onChange={(e) => setPatientEmail(e.target.value)}
                placeholder="patient@example.com"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="patientName">Patient Name (Optional)</Label>
              <Input
                id="patientName"
                value={patientName}
                onChange={(e) => setPatientName(e.target.value)}
                placeholder="John Doe"
              />
            </div>
            {generatedLink && (
              <div className="space-y-2">
                <Label>Generated Link</Label>
                <div className="flex gap-2">
                  <Input value={generatedLink} readOnly />
                  <Button variant="outline" onClick={copyLink}>
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </div>
          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button
              variant="outline"
              onClick={() => generateIntakeLink(false)}
              disabled={sending || !patientEmail}
            >
              <Copy className="h-4 w-4 mr-2" />
              Generate Link Only
            </Button>
            <Button
              onClick={() => generateIntakeLink(true)}
              disabled={sending || !patientEmail}
            >
              <Send className="h-4 w-4 mr-2" />
              {sending ? "Sending..." : "Send Email"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Submission Dialog */}
      <Dialog open={showViewDialog} onOpenChange={setShowViewDialog}>
        <DialogContent className="max-w-2xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle>Patient Intake Submission</DialogTitle>
            <DialogDescription>
              {selectedSubmission?.patient_name || selectedSubmission?.patient_email}
            </DialogDescription>
          </DialogHeader>
          <ScrollArea className="max-h-[60vh]">
            {selectedSubmission?.form_data && (
              <div className="space-y-4 pr-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-muted-foreground">First Name</Label>
                    <p className="font-medium">{selectedSubmission.form_data.first_name}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Last Name</Label>
                    <p className="font-medium">{selectedSubmission.form_data.last_name}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Date of Birth</Label>
                    <p className="font-medium">{selectedSubmission.form_data.date_of_birth}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Gender</Label>
                    <p className="font-medium">{selectedSubmission.form_data.gender}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Contact Number</Label>
                    <p className="font-medium">{selectedSubmission.form_data.contact_number}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Email</Label>
                    <p className="font-medium">{selectedSubmission.form_data.email || "—"}</p>
                  </div>
                </div>
                
                {selectedSubmission.form_data.address && (
                  <div>
                    <Label className="text-muted-foreground">Address</Label>
                    <p className="font-medium">{selectedSubmission.form_data.address}</p>
                  </div>
                )}

                {selectedSubmission.form_data.medical_history_ongoing && (
                  <div>
                    <Label className="text-muted-foreground">Current Medical Conditions</Label>
                    <p className="font-medium">{selectedSubmission.form_data.medical_history_ongoing}</p>
                  </div>
                )}

                {selectedSubmission.form_data.ongoing_medications && (
                  <div>
                    <Label className="text-muted-foreground">Current Medications</Label>
                    <p className="font-medium">{selectedSubmission.form_data.ongoing_medications}</p>
                  </div>
                )}

                {selectedSubmission.form_data.allergic_history_drug && (
                  <div>
                    <Label className="text-muted-foreground">Drug Allergies</Label>
                    <p className="font-medium">{selectedSubmission.form_data.allergic_history_drug}</p>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-muted-foreground">Smoking Status</Label>
                    <p className="font-medium">{selectedSubmission.form_data.smoking_status}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Alcohol Consumption</Label>
                    <p className="font-medium">{selectedSubmission.form_data.alcohol_consumption}</p>
                  </div>
                </div>
              </div>
            )}
          </ScrollArea>
          {selectedSubmission?.status === "submitted" && (
            <DialogFooter>
              <Button
                variant="outline"
                className="text-destructive"
                onClick={() => {
                  setShowViewDialog(false);
                  setShowRejectDialog(true);
                }}
              >
                <X className="h-4 w-4 mr-2" />
                Reject
              </Button>
              <Button
                className="bg-green-600 hover:bg-green-700"
                onClick={() => {
                  setShowViewDialog(false);
                  setShowApproveDialog(true);
                }}
              >
                <Check className="h-4 w-4 mr-2" />
                Approve & Add Patient
              </Button>
            </DialogFooter>
          )}
        </DialogContent>
      </Dialog>

      {/* Approve Dialog */}
      <AlertDialog open={showApproveDialog} onOpenChange={setShowApproveDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Approve Patient Intake</AlertDialogTitle>
            <AlertDialogDescription>
              This will create a new patient record with the submitted information. Are you sure you want to approve this intake?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleApprove} className="bg-green-600 hover:bg-green-700">
              Approve & Add Patient
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Reject Dialog */}
      <AlertDialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Reject Patient Intake</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to reject this intake submission? The patient will not be added to your records.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleReject} className="bg-destructive hover:bg-destructive/90">
              Reject
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default PatientIntakeManagement;
