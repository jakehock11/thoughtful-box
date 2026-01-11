import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from "react";
import { QuickCaptureModal } from "@/components/quick-capture/QuickCaptureModal";

interface QuickCaptureContextType {
  isOpen: boolean;
  open: () => void;
  close: () => void;
}

const QuickCaptureContext = createContext<QuickCaptureContextType | null>(null);

export function useQuickCapture() {
  const context = useContext(QuickCaptureContext);
  if (!context) {
    throw new Error("useQuickCapture must be used within QuickCaptureProvider");
  }
  return context;
}

interface QuickCaptureProviderProps {
  children: ReactNode;
}

export function QuickCaptureProvider({ children }: QuickCaptureProviderProps) {
  const [isOpen, setIsOpen] = useState(false);

  const open = useCallback(() => setIsOpen(true), []);
  const close = useCallback(() => setIsOpen(false), []);

  // Global keyboard shortcut: Cmd/Ctrl+N
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Check for Cmd+N (Mac) or Ctrl+N (Windows/Linux)
      if ((e.metaKey || e.ctrlKey) && e.key === "n") {
        e.preventDefault();
        open();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open]);

  return (
    <QuickCaptureContext.Provider value={{ isOpen, open, close }}>
      {children}
      <QuickCaptureModal open={isOpen} onOpenChange={setIsOpen} />
    </QuickCaptureContext.Provider>
  );
}
