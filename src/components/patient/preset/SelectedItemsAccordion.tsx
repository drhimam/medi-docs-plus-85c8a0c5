import * as React from "react";

import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";

type SelectedItemsAccordionProps = {
  title: string;
  count: number;
  children: React.ReactNode;
  /** If true, opens by default when count > 0 */
  defaultOpen?: boolean;
  /** Max height of the selected list area */
  maxHeightClassName?: string;
};

export function SelectedItemsAccordion({
  title,
  count,
  children,
  defaultOpen = true,
  maxHeightClassName = "max-h-[30vh]",
}: SelectedItemsAccordionProps) {
  if (count <= 0) return null;

  return (
    <Accordion
      type="single"
      collapsible
      defaultValue={defaultOpen ? "selected" : undefined}
      className="w-full"
    >
      <AccordionItem value="selected" className="border rounded-lg bg-muted/30">
        <AccordionTrigger className="px-3 py-2">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">{title}</span>
            <Badge variant="secondary">{count}</Badge>
          </div>
        </AccordionTrigger>
        <AccordionContent className="px-3 pb-3">
          <ScrollArea className={[maxHeightClassName, "pr-2"].join(" ")}>
            <div className="space-y-2">{children}</div>
          </ScrollArea>
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  );
}
