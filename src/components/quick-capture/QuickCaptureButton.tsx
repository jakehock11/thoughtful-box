import { Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useQuickCapture } from "@/contexts/QuickCaptureContext";

export function QuickCaptureButton() {
  const { open } = useQuickCapture();

  return (
    <Button
      onClick={open}
      className="w-full justify-start gap-2.5 h-8 text-[13px] shadow-sm"
      variant="default"
    >
      <Zap className="h-3.5 w-3.5" />
      Quick Capture
      <kbd className="ml-auto hidden rounded bg-primary-foreground/20 px-1.5 py-0.5 text-[10px] font-medium sm:inline-block">
        {navigator.platform.includes("Mac") ? "⌘" : "Ctrl"}+N
      </kbd>
    </Button>
  );
}
