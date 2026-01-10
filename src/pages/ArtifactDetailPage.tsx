import { useEffect, useState, useCallback, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Trash2, Link as LinkIcon, ExternalLink, Save, Check, Loader2 } from "lucide-react";
import { useProductContext } from "@/contexts/ProductContext";
import { useEntity, useUpdateEntity, useDeleteEntity } from "@/hooks/useEntities";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import type { Artifact, ArtifactType, EntityType, LinkedIds } from "@/lib/db";

const ARTIFACT_TYPE_OPTIONS: { value: ArtifactType; label: string }[] = [
  { value: "note", label: "Note" },
  { value: "link", label: "Link" },
  { value: "image", label: "Image" },
  { value: "file", label: "File" },
  { value: "query", label: "Query" },
];

export default function ArtifactDetailPage() {
  const { productId, id } = useParams<{ productId: string; id: string }>();
  const navigate = useNavigate();
  const { setCurrentProduct } = useProductContext();
  const { data: entity, isLoading } = useEntity(id);
  const updateEntity = useUpdateEntity();
  const deleteEntity = useDeleteEntity();
  const { toast } = useToast();

  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [artifactType, setArtifactType] = useState<ArtifactType>("note");
  const [source, setSource] = useState("");
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
    if (entity && entity.type === "artifact") {
      const artifact = entity as Artifact;
      setTitle(artifact.title);
      setBody(artifact.body);
      setArtifactType(artifact.artifactType);
      setSource(artifact.source || "");
      setPersonaIds(artifact.personaIds);
      setFeatureAreaIds(artifact.featureAreaIds);
      setDimensionValues(artifact.dimensionValueIdsByDimension);
      setLinkedIds(artifact.linkedIds || {});
    }
  }, [entity]);

  const handleSave = useCallback(async (navigateAfter = false) => {
    if (!entity || entity.type !== "artifact") return;
    setSaveStatus("saving");
    try {
      await updateEntity.mutateAsync({
        ...entity,
        title,
        body,
        artifactType,
        source: source || undefined,
        personaIds,
        featureAreaIds,
        dimensionValueIdsByDimension: dimensionValues,
        linkedIds,
      } as Artifact);
      setSaveStatus("saved");
      if (navigateAfter) {
        navigate(`/product/${productId}/artifacts`);
      } else {
        if (savedTimeoutRef.current) clearTimeout(savedTimeoutRef.current);
        savedTimeoutRef.current = setTimeout(() => setSaveStatus("idle"), 2000);
      }
    } catch {
      setSaveStatus("idle");
      toast({ title: "Error", description: "Failed to save.", variant: "destructive" });
    }
  }, [entity, title, body, artifactType, source, personaIds, featureAreaIds, dimensionValues, linkedIds, updateEntity, toast, navigate, productId]);

  useEffect(() => {
    if (!entity) return;
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    saveTimeoutRef.current = setTimeout(() => handleSave(false), 1000);
    return () => {
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    };
  }, [title, body, artifactType, source, personaIds, featureAreaIds, dimensionValues, linkedIds]);

  const handleDelete = async () => {
    if (!id) return;
    try {
      await deleteEntity.mutateAsync(id);
      toast({ title: "Deleted" });
      navigate(`/product/${productId}/artifacts`);
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
      <div className="page-container">
        <Skeleton className="mb-4 h-8 w-24" />
        <Skeleton className="mb-4 h-10 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (!entity || entity.type !== "artifact") {
    return <div className="page-container text-sm text-muted-foreground">Artifact not found</div>;
  }

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border px-6 py-3">
        <Button variant="ghost" size="sm" onClick={() => navigate(`/product/${productId}/artifacts`)} className="gap-2 text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" />
          <span className="text-sm">Artifacts</span>
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
          <Button variant="outline" size="sm" onClick={() => handleSave(true)} disabled={saveStatus === "saving"} className="gap-2">
            <Save className="h-3.5 w-3.5" />
            Save
          </Button>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive">
                <Trash2 className="h-4 w-4" />
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete artifact?</AlertDialogTitle>
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

      {/* Content */}
      <div className="flex-1 overflow-y-auto scrollbar-thin p-6">
        <div className="content-max-width space-y-5">
          {/* Title */}
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Artifact title..."
            className="border-none bg-transparent text-xl font-semibold tracking-tight shadow-none focus-visible:ring-0 px-0 h-auto py-1"
          />

          {/* Type */}
          <div className="flex flex-wrap items-end gap-4">
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Type</Label>
              <Select value={artifactType} onValueChange={(v) => setArtifactType(v as ArtifactType)}>
                <SelectTrigger className="w-28 h-8 text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ARTIFACT_TYPE_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Badge variant="outline" className="text-xs font-medium">Artifact</Badge>
          </div>

          {/* Source URL */}
          {(artifactType === "link" || artifactType === "image") && (
            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground">
                {artifactType === "link" ? "URL" : "Image URL"}
              </Label>
              <div className="flex gap-2">
                <Input
                  value={source}
                  onChange={(e) => setSource(e.target.value)}
                  placeholder={artifactType === "link" ? "https://..." : "https://...image.png"}
                  className="flex-1 h-9"
                />
                {source && artifactType === "link" && (
                  <Button variant="outline" size="icon" className="h-9 w-9" asChild>
                    <a href={source} target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="h-4 w-4" />
                    </a>
                  </Button>
                )}
              </div>
              {source && artifactType === "image" && (
                <div className="mt-2 overflow-hidden rounded-lg border border-border">
                  <img src={source} alt={title} className="max-h-64 w-full object-contain" />
                </div>
              )}
            </div>
          )}

          {/* Context Tags */}
          <Collapsible open={tagsOpen} onOpenChange={setTagsOpen}>
            <CollapsibleTrigger asChild>
              <Button variant="ghost" size="sm" className="mb-2 gap-2 text-sm font-medium text-muted-foreground hover:text-foreground">
                Context Tags
                <Badge variant="secondary" className="ml-1 text-[11px]">
                  {personaIds.length + featureAreaIds.length + Object.values(dimensionValues).flat().length}
                </Badge>
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <div className="rounded-lg border border-border bg-accent/30 p-4">
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

          {/* Body Editor */}
          <RichTextEditor
            content={body}
            onChange={setBody}
            placeholder="Add notes about this artifact..."
          />

          {/* Linked Items */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-medium text-foreground">Linked Items</h3>
              <Button variant="outline" size="sm" onClick={() => setLinkModalOpen(true)} className="gap-2">
                <LinkIcon className="h-3.5 w-3.5" />
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
