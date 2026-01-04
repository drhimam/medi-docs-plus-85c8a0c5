import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { History, RotateCcw, Eye, Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
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

interface VersionHistoryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  visitId: string;
  onRestore: (version: {
    subjective: string;
    objective: string;
    assessment: string;
    plan: string;
    prescription: string;
  }) => void;
}

interface Version {
  id: string;
  visit_id: string;
  soap_subjective: string | null;
  soap_objective: string | null;
  soap_assessment: string | null;
  soap_plan: string | null;
  prescription: string | null;
  version_number: number;
  created_at: string;
}

export function VersionHistoryDialog({
  open,
  onOpenChange,
  visitId,
  onRestore,
}: VersionHistoryDialogProps) {
  const [versions, setVersions] = useState<Version[]>([]);
  const [loading, setLoading] = useState(true);
  const [previewVersion, setPreviewVersion] = useState<Version | null>(null);
  const [showRestoreConfirm, setShowRestoreConfirm] = useState(false);
  const [versionToRestore, setVersionToRestore] = useState<Version | null>(null);

  useEffect(() => {
    if (open && visitId) {
      fetchVersions();
    }
  }, [open, visitId]);

  const fetchVersions = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("visit_versions")
        .select("*")
        .eq("visit_id", visitId)
        .order("version_number", { ascending: false });

      if (error) throw error;
      setVersions(data || []);
    } catch (error: any) {
      console.error("Error fetching versions:", error);
      toast({
        title: "Error",
        description: "Failed to load version history",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRestoreClick = (version: Version) => {
    setVersionToRestore(version);
    setShowRestoreConfirm(true);
  };

  const confirmRestore = () => {
    if (versionToRestore) {
      onRestore({
        subjective: versionToRestore.soap_subjective || "",
        objective: versionToRestore.soap_objective || "",
        assessment: versionToRestore.soap_assessment || "",
        plan: versionToRestore.soap_plan || "",
        prescription: versionToRestore.prescription || "",
      });
      toast({
        title: "Restored",
        description: `Restored to version ${versionToRestore.version_number}`,
      });
      onOpenChange(false);
    }
    setShowRestoreConfirm(false);
    setVersionToRestore(null);
  };

  const truncateText = (text: string | null, maxLength: number = 100) => {
    if (!text) return "Empty";
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + "...";
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-2xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <History className="h-5 w-5" />
              Version History
            </DialogTitle>
            <DialogDescription>
              View and restore previous versions of SOAP notes and prescriptions
            </DialogDescription>
          </DialogHeader>

          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : versions.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <History className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>No version history yet</p>
              <p className="text-sm">Versions are saved automatically when you save your work</p>
            </div>
          ) : (
            <ScrollArea className="max-h-[60vh]">
              <div className="space-y-2 pr-4">
                {versions.map((version) => (
                  <div
                    key={version.id}
                    className="border rounded-lg p-4 hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary">v{version.version_number}</Badge>
                        <span className="text-sm text-muted-foreground">
                          {format(new Date(version.created_at), "MMM d, yyyy 'at' h:mm a")}
                        </span>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => setPreviewVersion(previewVersion?.id === version.id ? null : version)}
                        >
                          <Eye className="h-4 w-4 mr-1" />
                          {previewVersion?.id === version.id ? "Hide" : "Preview"}
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleRestoreClick(version)}
                        >
                          <RotateCcw className="h-4 w-4 mr-1" />
                          Restore
                        </Button>
                      </div>
                    </div>

                    {previewVersion?.id === version.id && (
                      <Accordion type="multiple" className="w-full">
                        <AccordionItem value="subjective">
                          <AccordionTrigger className="text-sm py-2">Subjective</AccordionTrigger>
                          <AccordionContent>
                            <pre className="text-xs bg-muted p-2 rounded whitespace-pre-wrap max-h-32 overflow-auto">
                              {version.soap_subjective || "Empty"}
                            </pre>
                          </AccordionContent>
                        </AccordionItem>
                        <AccordionItem value="objective">
                          <AccordionTrigger className="text-sm py-2">Objective</AccordionTrigger>
                          <AccordionContent>
                            <pre className="text-xs bg-muted p-2 rounded whitespace-pre-wrap max-h-32 overflow-auto">
                              {version.soap_objective || "Empty"}
                            </pre>
                          </AccordionContent>
                        </AccordionItem>
                        <AccordionItem value="assessment">
                          <AccordionTrigger className="text-sm py-2">Assessment</AccordionTrigger>
                          <AccordionContent>
                            <pre className="text-xs bg-muted p-2 rounded whitespace-pre-wrap max-h-32 overflow-auto">
                              {version.soap_assessment || "Empty"}
                            </pre>
                          </AccordionContent>
                        </AccordionItem>
                        <AccordionItem value="plan">
                          <AccordionTrigger className="text-sm py-2">Plan</AccordionTrigger>
                          <AccordionContent>
                            <pre className="text-xs bg-muted p-2 rounded whitespace-pre-wrap max-h-32 overflow-auto">
                              {version.soap_plan || "Empty"}
                            </pre>
                          </AccordionContent>
                        </AccordionItem>
                        <AccordionItem value="prescription">
                          <AccordionTrigger className="text-sm py-2">Prescription</AccordionTrigger>
                          <AccordionContent>
                            <div 
                              className="text-xs bg-muted p-2 rounded max-h-32 overflow-auto"
                              dangerouslySetInnerHTML={{ __html: version.prescription || "Empty" }}
                            />
                          </AccordionContent>
                        </AccordionItem>
                      </Accordion>
                    )}

                    {previewVersion?.id !== version.id && (
                      <p className="text-xs text-muted-foreground">
                        {truncateText(version.soap_assessment || version.soap_subjective)}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </ScrollArea>
          )}
        </DialogContent>
      </Dialog>

      <AlertDialog open={showRestoreConfirm} onOpenChange={setShowRestoreConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Restore this version?</AlertDialogTitle>
            <AlertDialogDescription>
              This will replace your current SOAP notes and prescription with version {versionToRestore?.version_number}. 
              Your current work will be saved as a new version before restoring.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmRestore}>Restore</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
