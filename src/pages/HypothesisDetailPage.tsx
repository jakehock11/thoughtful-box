import { useEffect, useState, useCallback, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Trash2, Link as LinkIcon, Save, Check, Loader2 } from "lucide-react";
import { useProductContext } from "@/contexts/ProductContext";
import { useEntity, useUpdateEntity, useDeleteEntity } from "@/hooks/useEntities";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
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
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { RichTextEditor } from "@/components/editor";
import { ContextTagsPicker } from "@/components/taxonomy";
import { LinkToModal, LinkedItems } from "@/components/linking";
import { useToast } from "@/hooks/use-toast";
import { formatDistanceToNow } from "date-fns";
import type { Hypothesis, EntityType, LinkedIds } from "@/lib/db";

export default function HypothesisDetailPage() {
  const { productId, id } = useParams<{ productId: string; id: string }>();
  const navigate = useNavigate();
  const { setCurrentProduct } = useProductContext();
  const { data: entity, isLoading } = useEntity(id);
  const updateEntity = useUpdateEntity();
  const deleteEntity = useDeleteEntity();
  const { toast } = useToast();

  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [personaIds, setPersonaIds] = useState<string[]>([]);
  const [featureAreaIds, setFeatureAreaIds] = useState<string[]>([]);
  const [dimensionValues, setDimensionValues] = useState<Record<string, string[]>>({});
  const [linkedIds, setLinkedIds] = useState<LinkedIds>({});
  const [linkModalOpen, setLinkModalOpen] = useState(false);
  const [tagsOpen, setTagsOpen] = useState(true);
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved">("idle");
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const savedTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (productId) setCurrentProduct(productId);
  }, [productId, setCurrentProduct]);

  useEffect(() => {
    if (entity && entity.type === "hypothesis") {
      const hypothesis = entity as Hypothesis;
      setTitle(hypothesis.title);
      setBody(hypothesis.body);
      setPersonaIds(hypothesis.personaIds);
      setFeatureAreaIds(hypothesis.featureAreaIds);
      setDimensionValues(hypothesis.dimensionValueIdsByDimension);
      setLinkedIds(hypothesis.linkedIds || {});
    }
  }, [entity]);

  const handleSave = useCallback(async (navigateAfter = false) => {
    if (!entity || entity.type !== "hypothesis") return;
    setSaveStatus("saving");
    try {
      await updateEntity.mutateAsync({
        ...entity,
        title,
        body,
        personaIds,
        featureAreaIds,
        dimensionValueIdsByDimension: dimensionValues,
        linkedIds,
      } as Hypothesis);
      setSaveStatus("saved");
      if (navigateAfter) {
        navigate(`/product/${productId}/hypotheses`);
      } else {
        if (savedTimeoutRef.current) clearTimeout(savedTimeoutRef.current);
        savedTimeoutRef.current = setTimeout(() => setSaveStatus("idle"), 2000);
      }
    } catch {
      setSaveStatus("idle");
      toast({ title: "Error", description: "Failed to save.", variant: "destructive" });
    }
  }, [entity, title, body, personaIds, featureAreaIds, dimensionValues, linkedIds, updateEntity, toast, navigate, productId]);

  useEffect(() => {
    if (!entity) return;
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    saveTimeoutRef.current = setTimeout(() => handleSave(false), 1000);
    return () => {
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    };
  }, [title, body, personaIds, featureAreaIds, dimensionValues, linkedIds]);

  const handleDelete = async () => {
    if (!id) return;
    try {
      await deleteEntity.mutateAsync(id);
      toast({ title: "Deleted" });
      navigate(`/product/${productId}/hypotheses`);
    } catch {
      toast({ title: "Error", variant: "destructive" });
    }
  };

  const handleLink = (entityId: string, entityType: EntityType) => {
    const key = getLinkedIdsKey(entityType);
    setLinkedIds((prev) => ({
      ...prev,
      [key]: [...(prev[key] || []), entityId],
    }));
  };

  const handleUnlink = (entityId: string, entityType: EntityType) => {
    const key = getLinkedIdsKey(entityType);
    setLinkedIds((prev) => ({
      ...prev,
      [key]: (prev[key] || []).filter((i) => i !== entityId),
    }));
  };

  const handleOpenLink = (entityId: string, entityType: EntityType) => {
    const pathMap: Record<EntityType, string> = {
      problem: "problems",
      hypothesis: "hypotheses",
      experiment: "experiments",
      decision: "decisions",
      artifact: "artifacts",
      quick_capture: "quick-captures",
    };
    navigate(`/product/${productId}/${pathMap[entityType]}/${entityId}`);
  };

  if (isLoading) {
    return (
      <div className="p-8">
        <Skeleton className="mb-4 h-8 w-24" />
        <Skeleton className="mb-4 h-12 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (!entity || entity.type !== "hypothesis") {
    return <div className="p-8">Hypothesis not found</div>;
  }

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between border-b border-border px-8 py-4">
        <Button variant="ghost" size="sm" onClick={() => navigate(`/product/${productId}/hypotheses`)}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Hypotheses
        </Button>
        <div className="flex items-center gap-2">
          {saveStatus === "saving" && (
            <span className="flex items-center gap-1 text-xs text-muted-foreground">
              <Loader2 className="h-3 w-3 animate-spin" />
              Saving...
            </span>
          )}
          {saveStatus === "saved" && (
            <span className="flex items-center gap-1 text-xs text-green-600">
              <Check className="h-3 w-3" />
              Saved
            </span>
          )}
          <Button variant="outline" size="sm" onClick={() => handleSave(true)} disabled={saveStatus === "saving"}>
            <Save className="mr-2 h-4 w-4" />
            Save
          </Button>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="ghost" size="icon">
                <Trash2 className="h-4 w-4 text-destructive" />
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete hypothesis?</AlertDialogTitle>
                <AlertDialogDescription>This action cannot be undone.</AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleDelete}>Delete</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-8">
        <div className="mx-auto max-w-3xl space-y-6">
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Hypothesis title..."
            className="border-none bg-transparent text-2xl font-bold shadow-none focus-visible:ring-0"
          />

          <Badge variant="outline">Hypothesis</Badge>

          <Collapsible open={tagsOpen} onOpenChange={setTagsOpen}>
            <CollapsibleTrigger asChild>
              <Button variant="ghost" size="sm" className="mb-2 gap-2">
                Context Tags
                <Badge variant="secondary" className="ml-1">
                  {personaIds.length + featureAreaIds.length + Object.values(dimensionValues).flat().length}
                </Badge>
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <div className="rounded-lg border border-border bg-muted/30 p-4">
                <ContextTagsPicker
                  productId={productId!}
                  personaIds={personaIds}
                  featureAreaIds={featureAreaIds}
                  dimensionValueIdsByDimension={dimensionValues}
                  onPersonasChange={setPersonaIds}
                  onFeatureAreasChange={setFeatureAreaIds}
                  onDimensionValuesChange={(dimId, valueIds) =>
                    setDimensionValues((prev) => ({ ...prev, [dimId]: valueIds }))
                  }
                />
              </div>
            </CollapsibleContent>
          </Collapsible>

          <RichTextEditor
            content={body}
            onChange={setBody}
            placeholder="Describe your hypothesis..."
          />

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-medium">Linked Items</h3>
              <Button variant="outline" size="sm" onClick={() => setLinkModalOpen(true)}>
                <LinkIcon className="mr-2 h-4 w-4" />
                Link to...
              </Button>
            </div>
            <LinkedItems
              productId={productId!}
              linkedIds={linkedIds}
              onUnlink={handleUnlink}
              onOpenLink={handleOpenLink}
            />
          </div>
        </div>
      </div>

      <LinkToModal
        open={linkModalOpen}
        onOpenChange={setLinkModalOpen}
        productId={productId!}
        currentEntityId={id!}
        linkedIds={linkedIds}
        onLink={handleLink}
      />
    </div>
  );
}

function getLinkedIdsKey(type: EntityType): keyof LinkedIds {
  const map: Record<EntityType, keyof LinkedIds> = {
    problem: "problems",
    hypothesis: "hypotheses",
    experiment: "experiments",
    decision: "decisions",
    artifact: "artifacts",
    quick_capture: "quickCaptures",
  };
  return map[type];
}
