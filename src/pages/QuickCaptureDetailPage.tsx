import { useEffect, useState, useCallback, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Trash2, ArrowUpRight, AlertCircle, Lightbulb, FlaskConical, CheckCircle, Paperclip, Save, Check, Loader2 } from "lucide-react";
import { useProductContext } from "@/contexts/ProductContext";
import { useEntity, useUpdateEntity, useDeleteEntity, usePromoteCapture } from "@/hooks/useEntities";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { ContextTagsPicker } from "@/components/taxonomy";
import { useToast } from "@/hooks/use-toast";
import { formatDistanceToNow } from "date-fns";
import type { EntityType } from "@/lib/types";

const PROMOTE_OPTIONS: { type: EntityType; label: string; icon: React.ElementType }[] = [
  { type: "problem", label: "Problem", icon: AlertCircle },
  { type: "hypothesis", label: "Hypothesis", icon: Lightbulb },
  { type: "experiment", label: "Experiment", icon: FlaskConical },
  { type: "decision", label: "Decision", icon: CheckCircle },
  { type: "artifact", label: "Artifact", icon: Paperclip },
];

function deriveTitle(content: string): string {
  const firstLine = content.split("\n")[0].trim();
  if (firstLine.length > 100) {
    return firstLine.slice(0, 100) + "...";
  }
  return firstLine || "Untitled Capture";
}

export default function QuickCaptureDetailPage() {
  const { productId, id } = useParams<{ productId: string; id: string }>();
  const navigate = useNavigate();
  const { setCurrentProduct } = useProductContext();
  const { data: entity, isLoading } = useEntity(id);
  const updateEntity = useUpdateEntity();
  const deleteEntity = useDeleteEntity();
  const promoteCapture = usePromoteCapture();
  const { toast } = useToast();

  const [body, setBody] = useState("");
  const [personaIds, setPersonaIds] = useState<string[]>([]);
  const [featureIds, setFeatureIds] = useState<string[]>([]);
  const [dimensionValueIds, setDimensionValueIds] = useState<string[]>([]);
  const [tagsOpen, setTagsOpen] = useState(false);
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved">("idle");
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const savedTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const totalTags = personaIds.length + featureIds.length + dimensionValueIds.length;

  useEffect(() => {
    if (productId) setCurrentProduct(productId);
  }, [productId, setCurrentProduct]);

  useEffect(() => {
    if (entity && entity.type === "capture") {
      setBody(entity.body);
      setPersonaIds(entity.personaIds || []);
      setFeatureIds(entity.featureIds || []);
      setDimensionValueIds(entity.dimensionValueIds || []);
    }
  }, [entity]);

  const handleSave = useCallback(async () => {
    if (!entity || entity.type !== "capture" || !id) return;
    setSaveStatus("saving");
    try {
      await updateEntity.mutateAsync({
        id,
        data: {
          title: deriveTitle(body),
          body,
          personaIds,
          featureIds,
          dimensionValueIds,
        },
      });
      setSaveStatus("saved");
      if (savedTimeoutRef.current) clearTimeout(savedTimeoutRef.current);
      savedTimeoutRef.current = setTimeout(() => setSaveStatus("idle"), 2000);
    } catch {
      setSaveStatus("idle");
      toast({ title: "Error", description: "Failed to save.", variant: "destructive" });
    }
  }, [entity, id, body, personaIds, featureIds, dimensionValueIds, updateEntity, toast]);

  useEffect(() => {
    if (!entity) return;
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    saveTimeoutRef.current = setTimeout(handleSave, 1000);
    return () => {
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    };
  }, [body, personaIds, featureIds, dimensionValueIds]);

  const handleDelete = async () => {
    if (!id) return;
    try {
      await deleteEntity.mutateAsync(id);
      toast({ title: "Deleted" });
      navigate(`/product/${productId}/home`);
    } catch {
      toast({ title: "Error", variant: "destructive" });
    }
  };

  const handlePromoteTo = async (targetType: EntityType) => {
    if (!id) return;
    try {
      const newEntity = await promoteCapture.mutateAsync({ captureId: id, targetType });
      toast({ title: "Promoted", description: `Converted to ${targetType}.` });

      const pathMap: Record<EntityType, string> = {
        problem: "problems",
        hypothesis: "hypotheses",
        experiment: "experiments",
        decision: "decisions",
        artifact: "artifacts",
        capture: "captures",
      };
      navigate(`/product/${productId}/${pathMap[targetType]}/${newEntity.id}`);
    } catch {
      toast({ title: "Error", description: "Failed to promote.", variant: "destructive" });
    }
  };

  if (isLoading) {
    return (
      <div className="page-container">
        <Skeleton className="mb-4 h-8 w-24" />
        <Skeleton className="h-64 w-full rounded-lg" />
      </div>
    );
  }

  if (!entity || entity.type !== "capture") {
    return (
      <div className="page-container flex items-center justify-center py-16">
        <p className="text-sm text-muted-foreground">Capture not found</p>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between border-b border-border px-6 py-3">
        <Button variant="ghost" size="sm" className="gap-2 text-muted-foreground hover:text-foreground" onClick={() => navigate(`/product/${productId}/home`)}>
          <ArrowLeft className="h-4 w-4" />
          <span className="text-sm">Home</span>
        </Button>
        <div className="flex items-center gap-2">
          {saveStatus === "saving" && (
            <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Loader2 className="h-3 w-3 animate-spin" />
              Saving...
            </span>
          )}
          {saveStatus === "saved" && (
            <span className="flex items-center gap-1.5 text-xs text-primary">
              <Check className="h-3 w-3" />
              Saved
            </span>
          )}
          <span className="text-xs text-muted-foreground">
            Captured {formatDistanceToNow(new Date(entity.createdAt), { addSuffix: true })}
          </span>

          {!entity.promotedToId && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="gap-2" disabled={promoteCapture.isPending}>
                  <ArrowUpRight className="h-3.5 w-3.5" />
                  Promote to...
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-40">
                {PROMOTE_OPTIONS.map((opt) => (
                  <DropdownMenuItem
                    key={opt.type}
                    onClick={() => handlePromoteTo(opt.type)}
                    className="gap-2"
                  >
                    <opt.icon className="h-3.5 w-3.5" />
                    {opt.label}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          )}

          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive">
                <Trash2 className="h-4 w-4" />
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete capture?</AlertDialogTitle>
                <AlertDialogDescription className="text-sm">This action cannot be undone.</AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleDelete}>Delete</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6 scrollbar-thin">
        <div className="content-max-width space-y-5">
          {entity.promotedToId && (
            <div className="rounded-lg border border-border bg-muted/30 p-3 text-sm text-muted-foreground">
              This capture has been promoted to another entity.
            </div>
          )}

          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-xs font-medium">Capture</Badge>
          </div>

          <Textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="Your captured thought..."
            className="min-h-[200px] resize-none border-none bg-transparent text-sm shadow-none focus-visible:ring-0 px-0"
          />

          {/* Context Tags */}
          <Collapsible open={tagsOpen} onOpenChange={setTagsOpen}>
            <CollapsibleTrigger asChild>
              <Button variant="ghost" size="sm" className="mb-2 gap-2 text-sm font-medium text-muted-foreground hover:text-foreground">
                Context Tags
                <Badge variant="secondary" className="ml-1 text-[11px]">
                  {totalTags}
                </Badge>
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <div className="rounded-lg border border-border bg-accent/30 p-4">
                <ContextTagsPicker
                  productId={productId!}
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
        </div>
      </div>
    </div>
  );
}
