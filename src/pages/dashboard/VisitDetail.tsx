import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Save, X, FileText, Download, Eye, Edit, MoreHorizontal } from "lucide-react";
import { toast } from "sonner";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import jsPDF from "jspdf";

interface Visit {
  id: string;
  visit_date: string;
  visit_type: string;
  reason_for_visit: string;
  status: string;
  hpi: string | null;
  ros: string | null;
  vital_signs_bp: string | null;
  vital_signs_pulse: string | null;
  vital_signs_temp: string | null;
  vital_signs_respiratory_rate: string | null;
  vital_signs_spo2: string | null;
  vital_signs_weight: string | null;
  vital_signs_height: string | null;
  vital_signs_bmi: string | null;
  vital_signs_general_appearance: string | null;
  physical_examination: string | null;
  soap_subjective: string | null;
  soap_objective: string | null;
  soap_assessment: string | null;
  soap_plan: string | null;
  prescription: string | null;
  patient_id: string;
}

interface Patient {
  first_name: string;
  last_name: string;
  date_of_birth: string;
  gender: string;
  blood_group: string | null;
  contact_number: string;
  medical_history_ongoing: string | null;
  ongoing_medications: any;
  allergic_history_drug: any;
}

interface Document {
  id: string;
  document_date: string;
  description: string;
  upload_date: string;
  document_type: string;
  visit_id: string;
  file_name: string;
}

const VisitDetail = () => {
  const { patientId, visitId } = useParams();
  const navigate = useNavigate();
  const [visit, setVisit] = useState<Visit | null>(null);
  const [patient, setPatient] = useState<Patient | null>(null);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [isViewMode, setIsViewMode] = useState(true);
  const [soapData, setSOAPData] = useState({
    subjective: "",
    objective: "",
    assessment: "",
    plan: "",
  });
  const [prescriptionContent, setPrescriptionContent] = useState("");

  useEffect(() => {
    fetchData();
    fetchDocuments();
  }, [visitId, patientId]);

  const fetchData = async () => {
    try {
      // Fetch visit
      const { data: visitData, error: visitError } = await supabase
        .from("visits")
        .select("*")
        .eq("id", visitId)
        .single();

      if (visitError) throw visitError;
      setVisit(visitData);
      
      // Fetch patient
      const { data: patientData, error: patientError } = await supabase
        .from("patients")
        .select("first_name, last_name, date_of_birth, gender, blood_group, contact_number, medical_history_ongoing, ongoing_medications, allergic_history_drug")
        .eq("id", patientId)
        .single();

      if (patientError) throw patientError;
      setPatient(patientData);
      
      // Load SOAP data and prescription from visit
      if (visitData) {
        setSOAPData({
          subjective: visitData.soap_subjective || "",
          objective: visitData.soap_objective || "",
          assessment: visitData.soap_assessment || "",
          plan: visitData.soap_plan || "",
        });
        setPrescriptionContent(visitData.prescription || "");
      }
    } catch (error: any) {
      toast.error("Failed to load visit");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const fetchDocuments = async () => {
    try {
      const { data, error } = await supabase
        .from("documents")
        .select("*")
        .eq("visit_id", visitId)
        .order("document_date", { ascending: false });

      if (error) throw error;
      setDocuments(data || []);
    } catch (error: any) {
      console.error("Error fetching documents:", error);
    }
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      const { error } = await supabase
        .from("visits")
        .update({
          soap_subjective: soapData.subjective,
          soap_objective: soapData.objective,
          soap_assessment: soapData.assessment,
          soap_plan: soapData.plan,
          prescription: prescriptionContent,
        })
        .eq("id", visitId);

      if (error) throw error;

      toast.success("Changes saved successfully!");
      fetchData();
    } catch (error: any) {
      toast.error("Failed to save changes");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleExport = () => {
    if (!visit || !patient) return;

    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    let yPosition = 20;

    // Header
    doc.setFontSize(16);
    doc.text("Clinical Documentation", pageWidth / 2, yPosition, { align: "center" });
    yPosition += 10;

    // Patient Info
    doc.setFontSize(10);
    doc.text(`Patient: ${patient.first_name} ${patient.last_name}`, 20, yPosition);
    yPosition += 6;
    doc.text(`Date: ${new Date(visit.visit_date).toLocaleDateString()}`, 20, yPosition);
    yPosition += 10;

    // SOAP Notes
    doc.setFontSize(12);
    doc.text("SOAP Notes", 20, yPosition);
    yPosition += 8;

    doc.setFontSize(10);
    doc.text("Subjective:", 20, yPosition);
    yPosition += 6;
    const subjectiveLines = doc.splitTextToSize(soapData.subjective || "N/A", pageWidth - 40);
    doc.text(subjectiveLines, 20, yPosition);
    yPosition += subjectiveLines.length * 6 + 6;

    doc.text("Objective:", 20, yPosition);
    yPosition += 6;
    const objectiveLines = doc.splitTextToSize(soapData.objective || "N/A", pageWidth - 40);
    doc.text(objectiveLines, 20, yPosition);
    yPosition += objectiveLines.length * 6 + 6;

    doc.text("Assessment:", 20, yPosition);
    yPosition += 6;
    const assessmentLines = doc.splitTextToSize(soapData.assessment || "N/A", pageWidth - 40);
    doc.text(assessmentLines, 20, yPosition);
    yPosition += assessmentLines.length * 6 + 6;

    doc.text("Plan:", 20, yPosition);
    yPosition += 6;
    const planLines = doc.splitTextToSize(soapData.plan || "N/A", pageWidth - 40);
    doc.text(planLines, 20, yPosition);
    yPosition += planLines.length * 6 + 10;

    // Prescription
    if (yPosition > 250) {
      doc.addPage();
      yPosition = 20;
    }

    doc.setFontSize(12);
    doc.text("Prescription", 20, yPosition);
    yPosition += 8;

    doc.setFontSize(10);
    const prescriptionLines = doc.splitTextToSize(prescriptionContent || "N/A", pageWidth - 40);
    doc.text(prescriptionLines, 20, yPosition);

    doc.save(`clinical-doc-${patient.last_name}-${new Date(visit.visit_date).toLocaleDateString()}.pdf`);
    toast.success("Document exported successfully!");
  };

  const handleClose = () => {
    navigate(`/dashboard/patients/${patientId}`);
  };

  const calculateAge = (dob: string) => {
    const birthDate = new Date(dob);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };

  if (loading) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Loading visit...</p>
      </div>
    );
  }

  if (!visit) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Visit not found</p>
        <Button onClick={() => navigate(`/dashboard/patients/${patientId}`)} className="mt-4">
          Back to Patient
        </Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header with Patient Info and Actions */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <CardTitle className="text-2xl">
                {patient?.first_name} {patient?.last_name}
              </CardTitle>
              <div className="flex gap-6 text-sm text-muted-foreground">
                <span>{calculateAge(patient?.date_of_birth || "")} years</span>
                <span>Blood Group: {patient?.blood_group || "N/A"}</span>
                <span>Contact: {patient?.contact_number}</span>
              </div>
              <div className="text-sm text-muted-foreground">
                Visit Date: {new Date(visit?.visit_date || "").toLocaleDateString()} | Type: {visit?.visit_type}
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="icon"
                onClick={() => setIsViewMode(!isViewMode)}
                title={isViewMode ? "Edit" : "View"}
              >
                {isViewMode ? <Edit className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </Button>
              <Button variant="outline" size="icon" onClick={handleExport} title="Export">
                <Download className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="icon" onClick={handleSave} disabled={loading} title="Save">
                <Save className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="icon" onClick={handleClose} title="Close">
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Tabs for SOAP Note and Prescription */}
      <Tabs defaultValue="soap" className="space-y-6">
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="soap">
            <FileText className="h-4 w-4 mr-2" />
            SOAP Note
          </TabsTrigger>
          <TabsTrigger value="prescription">
            <FileText className="h-4 w-4 mr-2" />
            Prescription
          </TabsTrigger>
        </TabsList>

        {/* SOAP Note Tab */}
        <TabsContent value="soap" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Subjective</CardTitle>
            </CardHeader>
            <CardContent>
              <Textarea
                value={soapData.subjective}
                onChange={(e) => setSOAPData({ ...soapData, subjective: e.target.value })}
                className="min-h-[120px]"
                placeholder="Enter subjective findings..."
                disabled={isViewMode}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Objective</CardTitle>
            </CardHeader>
            <CardContent>
              <Textarea
                value={soapData.objective}
                onChange={(e) => setSOAPData({ ...soapData, objective: e.target.value })}
                className="min-h-[120px]"
                placeholder="Enter objective findings..."
                disabled={isViewMode}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Assessment</CardTitle>
            </CardHeader>
            <CardContent>
              <Textarea
                value={soapData.assessment}
                onChange={(e) => setSOAPData({ ...soapData, assessment: e.target.value })}
                className="min-h-[120px]"
                placeholder="Enter assessment..."
                disabled={isViewMode}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Plan</CardTitle>
            </CardHeader>
            <CardContent>
              <Textarea
                value={soapData.plan}
                onChange={(e) => setSOAPData({ ...soapData, plan: e.target.value })}
                className="min-h-[120px]"
                placeholder="Enter plan..."
                disabled={isViewMode}
              />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Prescription Tab */}
        <TabsContent value="prescription" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Prescription</CardTitle>
            </CardHeader>
            <CardContent>
              <Textarea
                value={prescriptionContent}
                onChange={(e) => setPrescriptionContent(e.target.value)}
                className="min-h-[300px]"
                placeholder="Enter prescription details..."
                disabled={isViewMode}
              />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Documents Table */}
      <Card>
        <CardHeader>
          <CardTitle>Patient Documents</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Doc Date</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Upload Date</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>File Name</TableHead>
                <TableHead>Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {documents.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground">
                    No documents found
                  </TableCell>
                </TableRow>
              ) : (
                documents.map((doc) => (
                  <TableRow key={doc.id}>
                    <TableCell>{new Date(doc.document_date).toLocaleDateString()}</TableCell>
                    <TableCell>{doc.description}</TableCell>
                    <TableCell>{new Date(doc.upload_date).toLocaleDateString()}</TableCell>
                    <TableCell>
                      <span className="inline-flex items-center rounded-full px-2 py-1 text-xs font-medium bg-secondary text-secondary-foreground">
                        {doc.document_type}
                      </span>
                    </TableCell>
                    <TableCell className="max-w-[200px] truncate">{doc.file_name}</TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem>View Document</DropdownMenuItem>
                          <DropdownMenuItem>Download</DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default VisitDetail;
