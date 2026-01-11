import { useState } from "react";
import { Zap, ChevronDown } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Badge } from "@/components/ui/badge";
import { useProductContext } from "@/contexts/ProductContext";
import { useCreateEntity } from "@/hooks/useEntities";
import { ContextTagsPicker } from "@/components/taxonomy";
import { useToast } from "@/hooks/use-toast";

interface QuickCaptureModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function deriveTitle(content: string): string {
  // Get first line, or first 100 characters if no line break
  const firstLine = content.split("\n")[0].trim();
  if (firstLine.length > 100) {
    return firstLine.slice(0, 100) + "...";
  }
  return firstLine || "Untitled Capture";
}

export function QuickCaptureModal({ open, onOpenChange }: QuickCaptureModalProps) {
  const [content, setContent] = useState("");
  const [tagsOpen, setTagsOpen] = useState(false);
  const [personaIds, setPersonaIds] = useState<string[]>([]);
  const [featureIds, setFeatureIds] = useState<string[]>([]);
  const [dimensionValueIds, setDimensionValueIds] = useState<string[]>([]);

  const { currentProductId } = useProductContext();
  const createEntity = useCreateEntity();
  const { toast } = useToast();

  const totalTags = personaIds.length + featureIds.length + dimensionValueIds.length;

  const resetForm = () => {
    setContent("");
    setPersonaIds([]);
    setFeatureIds([]);
    setDimensionValueIds([]);
    setTagsOpen(false);
  };

  const handleSubmit = async () => {
    if (!content.trim() || !currentProductId) return;

    try {
      const title = deriveTitle(content);

      await createEntity.mutateAsync({
        type: "capture",
        productId: currentProductId,
        title,
        body: content,
        personaIds,
        featureIds,
        dimensionValueIds,
      });

      toast({
        title: "Captured!",
        description: "Your thought has been saved.",
      });

      resetForm();
      onOpenChange(false);
    } catch {
      toast({
        title: "Error",
        description: "Failed to save capture.",
        variant: "destructive",
      });
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      resetForm();
    }
    onOpenChange(newOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base font-semibold">
            <Zap className="h-4 w-4 text-primary" />
            Quick Capture
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <Textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Capture a thought, observation, or idea..."
            className="min-h-[150px] resize-none text-sm"
            autoFocus
          />

          {/* Optional Context Tags */}
          {currentProductId && (
            <Collapsible open={tagsOpen} onOpenChange={setTagsOpen}>
              <CollapsibleTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="gap-2 text-xs text-muted-foreground hover:text-foreground"
                >
                  <ChevronDown className={`h-3 w-3 transition-transform ${tagsOpen ? "rotate-180" : ""}`} />
                  Add Context Tags
                  {totalTags > 0 && (
                    <Badge variant="secondary" className="ml-1 text-[10px]">
                      {totalTags}
                    </Badge>
                  )}
                </Button>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <div className="mt-2 rounded-lg border border-border bg-accent/30 p-3">
                  <ContextTagsPicker
                    productId={currentProductId}
                    personaIds={personaIds}
                    featureIds={featureIds}
                    dimensionValueIds={dimensionValueIds}
                    onPersonasChange={setPersonaIds}
                    onFeaturesChange={setFeatureIds}
                    onDimensionValueIdsChange={setDimensionValueIds}
                  />
                </div>
              </CollapsibleContent>
            </Collapsible>
          )}

          <div className="flex items-center justify-between">
            <p className="text-xs text-muted-foreground">
              Press {navigator.platform.includes("Mac") ? "⌘" : "Ctrl"}+Enter to save
            </p>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => handleOpenChange(false)}>
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={handleSubmit}
                disabled={!content.trim() || !currentProductId || createEntity.isPending}
              >
                {createEntity.isPending ? "Saving..." : "Save"}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
