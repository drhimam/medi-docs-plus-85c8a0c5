import * as React from "react";

import { useIsMobile } from "@/hooks/use-mobile";
import { usePresetMobilePresentation } from "@/hooks/usePresetMobilePresentation";

import { Dialog } from "@/components/ui/dialog";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { ScrollArea } from "@/components/ui/scroll-area";
import { PresetDialogLayout } from "@/components/patient/preset/PresetDialogLayout";

type PresetDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: React.ReactNode;
  /** Use max-w-* here if needed (modal only) */
  contentClassName?: string;
  /** Defaults to 85vh (modal) / 100dvh (drawer) */
  maxHeightClassName?: string;
  /** Footer actions (sticky) */
  footer: React.ReactNode;
  children: React.ReactNode;
};

export function PresetDialog({
  open,
  onOpenChange,
  title,
  description,
  contentClassName,
  maxHeightClassName,
  footer,
  children,
}: PresetDialogProps) {
  const isMobile = useIsMobile();
  const { presentation } = usePresetMobilePresentation();

  const useDrawer = isMobile && presentation === "drawer";

  if (useDrawer) {
    const heightClass = maxHeightClassName ?? "h-[100dvh]";

    return (
      <Drawer open={open} onOpenChange={onOpenChange}>
        <DrawerContent
          className={[
            heightClass,
            "flex flex-col",
            // allow internal scroll area to work correctly
            "overflow-hidden",
          ].join(" ")}
        >
          <DrawerHeader>
            <DrawerTitle>{title}</DrawerTitle>
            {description ? <DrawerDescription>{description}</DrawerDescription> : null}
          </DrawerHeader>

          <ScrollArea className="flex-1 min-h-0 px-4">
            <div className="pb-6">{children}</div>
          </ScrollArea>

          <DrawerFooter className="sticky bottom-0 border-t bg-background">
            {footer}
          </DrawerFooter>
        </DrawerContent>
      </Drawer>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <PresetDialogLayout
        title={title}
        description={description}
        contentClassName={contentClassName}
        maxHeightClassName={maxHeightClassName}
        footer={footer}
      >
        {children}
      </PresetDialogLayout>
    </Dialog>
  );
}
