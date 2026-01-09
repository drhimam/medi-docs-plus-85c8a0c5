import * as React from "react";

const STORAGE_KEY = "edoctordesk:preset_mobile_presentation";

type MobilePresetPresentation = "modal" | "drawer";

function readValue(): MobilePresetPresentation {
  if (typeof window === "undefined") return "modal";
  const v = window.localStorage.getItem(STORAGE_KEY);
  return v === "drawer" ? "drawer" : "modal";
}

export function usePresetMobilePresentation() {
  const [presentation, setPresentationState] = React.useState<MobilePresetPresentation>(() => readValue());

  React.useEffect(() => {
    setPresentationState(readValue());
  }, []);

  const setPresentation = React.useCallback((next: MobilePresetPresentation) => {
    setPresentationState(next);
    try {
      window.localStorage.setItem(STORAGE_KEY, next);
    } catch {
      // ignore
    }
  }, []);

  return { presentation, setPresentation };
}

export type { MobilePresetPresentation };
