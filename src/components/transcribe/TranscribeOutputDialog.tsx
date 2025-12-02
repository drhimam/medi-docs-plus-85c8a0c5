import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Copy, Check } from "lucide-react";
import { useState } from "react";
import { toast } from "@/hooks/use-toast";

interface TranscribeOutputDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  transcribedText: string;
  onInsertAtCursor: () => void;
  onInsertAtEnd: () => void;
}

export function TranscribeOutputDialog({
  open,
  onOpenChange,
  transcribedText,
  onInsertAtCursor,
  onInsertAtEnd,
}: TranscribeOutputDialogProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(transcribedText);
      setCopied(true);
      toast({
        title: "Copied",
        description: "Transcribed text copied to clipboard",
      });
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to copy text",
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle>Transcribed Text</DialogTitle>
          <DialogDescription>
            Review the transcribed text and choose where to insert it
          </DialogDescription>
        </DialogHeader>
        <Card className="my-4">
          <CardContent className="pt-6">
            <div className="relative">
              <Button
                variant="ghost"
                size="sm"
                className="absolute top-0 right-0"
                onClick={handleCopy}
              >
                {copied ? (
                  <Check className="h-4 w-4" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
              </Button>
              <div className="prose prose-sm max-w-none max-h-[50vh] overflow-y-auto pr-12">
                <p className="whitespace-pre-wrap">{transcribedText}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button variant="secondary" onClick={onInsertAtCursor}>
            Insert at Cursor
          </Button>
          <Button onClick={onInsertAtEnd}>
            Insert at End
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
