import * as React from "react";

import { ScrollArea } from "@/components/ui/scroll-area";
import {
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

type PresetDialogLayoutProps = {
  title: string;
  description?: React.ReactNode;
  /** Use max-w-* here if needed */
  contentClassName?: string;
  /** Defaults to 85vh */
  maxHeightClassName?: string;
  /** Dialog body content (will scroll) */
  children: React.ReactNode;
  /** Footer actions (sticky) */
  footer: React.ReactNode;
};

export function PresetDialogLayout({
  title,
  description,
  contentClassName,
  maxHeightClassName = "max-h-[85vh]",
  children,
  footer,
}: PresetDialogLayoutProps) {
  return (
    <DialogContent
      className={[
        contentClassName ?? "max-w-2xl",
        maxHeightClassName,
        "flex flex-col overflow-hidden",
      ].join(" ")}
    >
      <DialogHeader>
        <DialogTitle>{title}</DialogTitle>
        {description ? <DialogDescription>{description}</DialogDescription> : null}
      </DialogHeader>

      {/* Single scroll container for the whole body */}
      <ScrollArea className="flex-1 min-h-0 pr-4">
        <div className="pb-6">{children}</div>
      </ScrollArea>

      {/* Sticky footer always visible */}
      <DialogFooter className="sticky bottom-0 bg-background pt-4 border-t -mx-6 px-6">
        {footer}
      </DialogFooter>
    </DialogContent>
  );
}
