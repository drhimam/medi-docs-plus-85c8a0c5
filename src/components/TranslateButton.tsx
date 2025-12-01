import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Languages, Loader2 } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

interface TranslateButtonProps {
  onTranslation: (text: string) => void;
  disabled?: boolean;
  textToTranslate: string;
}

export const TranslateButton = ({ onTranslation, disabled, textToTranslate }: TranslateButtonProps) => {
  const [isTranslating, setIsTranslating] = useState(false);
  const [targetLanguage, setTargetLanguage] = useState<string>("es");
  const [isOpen, setIsOpen] = useState(false);
  const { toast } = useToast();

  const languages = [
    { code: "es", name: "Spanish" },
    { code: "fr", name: "French" },
    { code: "de", name: "German" },
    { code: "it", name: "Italian" },
    { code: "pt", name: "Portuguese" },
    { code: "zh", name: "Chinese" },
    { code: "ja", name: "Japanese" },
    { code: "ko", name: "Korean" },
    { code: "ar", name: "Arabic" },
    { code: "hi", name: "Hindi" },
  ];

  const handleTranslate = async () => {
    if (!textToTranslate?.trim()) {
      toast({
        title: "No text to translate",
        description: "Please enter some text first",
        variant: "destructive",
      });
      return;
    }

    setIsTranslating(true);
    try {
      const { data, error } = await supabase.functions.invoke("translate-text", {
        body: { 
          text: textToTranslate,
          targetLanguage: targetLanguage 
        },
      });

      if (error) throw error;

      if (data?.translatedText) {
        onTranslation(data.translatedText);
        setIsOpen(false);
        toast({
          title: "Translation successful",
          description: "Text has been translated",
        });
      }
    } catch (error) {
      console.error("Translation error:", error);
      toast({
        title: "Translation failed",
        description: error instanceof Error ? error.message : "Please try again",
        variant: "destructive",
      });
    } finally {
      setIsTranslating(false);
    }
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={disabled || !textToTranslate?.trim()}
          className="gap-2"
        >
          <Languages className="h-4 w-4" />
          Translate
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80">
        <div className="space-y-4">
          <div className="space-y-2">
            <h4 className="font-medium leading-none">Translate Text</h4>
            <p className="text-sm text-muted-foreground">
              Select target language and translate
            </p>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Target Language</label>
            <Select value={targetLanguage} onValueChange={setTargetLanguage}>
              <SelectTrigger>
                <SelectValue placeholder="Select language" />
              </SelectTrigger>
              <SelectContent>
                {languages.map((lang) => (
                  <SelectItem key={lang.code} value={lang.code}>
                    {lang.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button
            onClick={handleTranslate}
            disabled={isTranslating}
            className="w-full"
          >
            {isTranslating ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Translating...
              </>
            ) : (
              <>
                <Languages className="h-4 w-4 mr-2" />
                Translate
              </>
            )}
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
};
