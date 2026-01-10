import { useState } from "react";
import { Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { QuickCaptureModal } from "./QuickCaptureModal";

export function QuickCaptureButton() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button
        onClick={() => setOpen(true)}
        className="w-full justify-start gap-2.5 h-8 text-[13px] shadow-sm"
        variant="default"
      >
        <Zap className="h-3.5 w-3.5" />
        Quick Capture
      </Button>
      <QuickCaptureModal open={open} onOpenChange={setOpen} />
    </>
  );
}
