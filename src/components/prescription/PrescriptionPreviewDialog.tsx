import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { useState } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Copy } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

interface PrescriptionPreviewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  generatedContent: string;
  onInsert: (location: "cursor" | "end") => void;
}

export const PrescriptionPreviewDialog = ({
  open,
  onOpenChange,
  generatedContent,
  onInsert,
}: PrescriptionPreviewDialogProps) => {
  const [insertLocation, setInsertLocation] = useState<"cursor" | "end">("end");
  const { toast } = useToast();

  const handleInsert = () => {
    onInsert(insertLocation);
    onOpenChange(false);
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(generatedContent);
      toast({
        title: "Copied to clipboard",
        description: "Prescription content has been copied",
      });
    } catch (error) {
      toast({
        title: "Copy failed",
        description: "Failed to copy to clipboard",
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[80vh]">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle>AI Generated Prescription</DialogTitle>
              <DialogDescription>
                Review the generated prescription and choose where to insert it
              </DialogDescription>
            </div>
            <Button
              variant="outline"
              size="icon"
              onClick={handleCopy}
              title="Copy to clipboard"
            >
              <Copy className="h-4 w-4" />
            </Button>
          </div>
        </DialogHeader>
        
        <ScrollArea className="max-h-[400px] border rounded-md p-4 bg-muted/50">
          <div 
            className="prose prose-sm max-w-none"
            dangerouslySetInnerHTML={{ __html: generatedContent.replace(/\n/g, '<br />') }}
          />
        </ScrollArea>

        <div className="space-y-3">
          <Label>Insert Location</Label>
          <RadioGroup value={insertLocation} onValueChange={(value) => setInsertLocation(value as "cursor" | "end")}>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="cursor" id="cursor" />
              <Label htmlFor="cursor" className="font-normal cursor-pointer">
                Insert at cursor position
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="end" id="end" />
              <Label htmlFor="end" className="font-normal cursor-pointer">
                Append to end of existing content
              </Label>
            </div>
          </RadioGroup>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleInsert}>
            Insert Prescription
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
