import { useEffect, useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Sparkles, ArrowLeft, Trash2, Link2 } from "lucide-react";
import { useProductContext } from "@/contexts/ProductContext";
import { useEntity, useUpdateEntity, useDeleteEntity } from "@/hooks/useEntities";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
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
import { RichTextEditor } from "@/components/editor";
import { ContextTagsPicker } from "@/components/taxonomy";
import { LinkToModal, LinkedItems } from "@/components/linking";
import { useToast } from "@/hooks/use-toast";
import type { FeatureRequestStatus, FeatureRequestPriority } from "@/lib/types";

const STATUSES: { value: FeatureRequestStatus; label: string }[] = [
  { value: "new", label: "New" },
  { value: "considering", label: "Considering" },
  { value: "planned", label: "Planned" },
  { value: "in_progress", label: "In Progress" },
  { value: "shipped", label: "Shipped" },
  { value: "declined", label: "Declined" },
];

const PRIORITIES: { value: FeatureRequestPriority; label: string }[] = [
  { value: "low", label: "Low" },
  { value: "medium", label: "Medium" },
  { value: "high", label: "High" },
  { value: "critical", label: "Critical" },
];

const STATUS_COLORS: Record<FeatureRequestStatus, string> = {
  new: "bg-blue-500/10 text-blue-600 border-blue-500/20",
  considering: "bg-purple-500/10 text-purple-600 border-purple-500/20",
  planned: "bg-indigo-500/10 text-indigo-600 border-indigo-500/20",
  in_progress: "bg-blue-500/10 text-blue-600 border-blue-500/20",
  shipped: "bg-green-500/10 text-green-600 border-green-500/20",
  declined: "bg-red-500/10 text-red-600 border-red-500/20",
};

const PRIORITY_COLORS: Record<FeatureRequestPriority, string> = {
  low: "bg-gray-500/10 text-gray-600 border-gray-500/20",
  medium: "bg-yellow-500/10 text-yellow-600 border-yellow-500/20",
  high: "bg-orange-500/10 text-orange-600 border-orange-500/20",
  critical: "bg-red-500/10 text-red-600 border-red-500/20",
};

export default function FeatureRequestDetailPage() {
  const { productId, id } = useParams<{ productId: string; id: string }>();
  const navigate = useNavigate();
  const { setCurrentProduct } = useProductContext();
  const { data: entity, isLoading } = useEntity(id);
  const updateEntity = useUpdateEntity();
  const deleteEntity = useDeleteEntity();
  const { toast } = useToast();

  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [status, setStatus] = useState<FeatureRequestStatus>("new");
  const [priority, setPriority] = useState<FeatureRequestPriority>("medium");
  const [source, setSource] = useState("");
  const [declinedReason, setDeclinedReason] = useState("");
  const [personaIds, setPersonaIds] = useState<string[]>([]);
  const [featureIds, setFeatureIds] = useState<string[]>([]);
  const [dimensionValueIds, setDimensionValueIds] = useState<string[]>([]);
  const [linkModalOpen, setLinkModalOpen] = useState(false);

  useEffect(() => {
    if (productId) setCurrentProduct(productId);
  }, [productId, setCurrentProduct]);

  useEffect(() => {
    if (entity) {
      setTitle(entity.title || "");
      setBody(entity.body || "");
      setStatus((entity.status as FeatureRequestStatus) || "new");
      setPriority((entity.metadata?.priority as FeatureRequestPriority) || "medium");
      setSource(entity.metadata?.source || "");
      setDeclinedReason(entity.metadata?.declinedReason || "");
      setPersonaIds(entity.personaIds || []);
      setFeatureIds(entity.featureIds || []);
      setDimensionValueIds(entity.dimensionValueIds || []);
    }
  }, [entity]);

  const debouncedSave = useCallback(
    (data: Parameters<typeof updateEntity.mutateAsync>[0]["data"]) => {
      if (!id) return;
      updateEntity.mutate({ id, data });
    },
    [id, updateEntity]
  );

  const handleTitleChange = (value: string) => {
    setTitle(value);
    debouncedSave({ title: value });
  };

  const handleBodyChange = (value: string) => {
    setBody(value);
    debouncedSave({ body: value });
  };

  const handleStatusChange = (value: FeatureRequestStatus) => {
    setStatus(value);
    debouncedSave({ status: value });
  };

  const handlePriorityChange = (value: FeatureRequestPriority) => {
    setPriority(value);
    debouncedSave({ metadata: { ...entity?.metadata, priority: value } });
  };

  const handleSourceChange = (value: string) => {
    setSource(value);
    debouncedSave({ metadata: { ...entity?.metadata, source: value } });
  };

  const handleDeclinedReasonChange = (value: string) => {
    setDeclinedReason(value);
    debouncedSave({ metadata: { ...entity?.metadata, declinedReason: value } });
  };

  const handleDelete = async () => {
    if (!id) return;
    try {
      await deleteEntity.mutateAsync(id);
      toast({ title: "Deleted", description: "Feature request has been deleted." });
      navigate(`/product/${productId}/inbox`);
    } catch {
      toast({ title: "Error", description: "Failed to delete feature request.", variant: "destructive" });
    }
  };

  const handleSave = async () => {
    if (!id) return;
    try {
      await updateEntity.mutateAsync({
        id,
        data: {
          title,
          body,
          status,
          personaIds,
          featureIds,
          dimensionValueIds,
          metadata: { priority, source, declinedReason },
        },
      });
      toast({ title: "Saved", description: "Feature request has been saved." });
      navigate(`/product/${productId}/inbox`);
    } catch {
      toast({ title: "Error", description: "Failed to save feature request.", variant: "destructive" });
    }
  };

  if (isLoading) {
    return (
      <div className="page-container">
        <Skeleton className="mb-6 h-8 w-48" />
        <div className="space-y-4">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-40 w-full" />
        </div>
      </div>
    );
  }

  if (!entity) {
    return (
      <div className="page-container flex items-center justify-center py-16">
        <p className="text-sm text-muted-foreground">Feature request not found</p>
      </div>
    );
  }

  return (
    <div className="page-container">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate(`/product/${productId}/inbox`)}
            className="h-8 w-8"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-purple-500" />
            <span className="text-sm font-medium text-muted-foreground">Feature Request</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive">
                <Trash2 className="h-4 w-4" />
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete feature request?</AlertDialogTitle>
                <AlertDialogDescription>
                  This action cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                  Delete
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
          <Button size="sm" onClick={handleSave}>
            Save
          </Button>
        </div>
      </div>

      <div className="mx-auto max-w-2xl space-y-6">
        {/* Title */}
        <Input
          value={title}
          onChange={(e) => handleTitleChange(e.target.value)}
          placeholder="Feature request title..."
          className="border-0 bg-transparent px-0 text-xl font-semibold placeholder:text-muted-foreground/50 focus-visible:ring-0"
        />

        {/* Metadata Row */}
        <div className="flex flex-wrap items-center gap-3">
          <Select value={status} onValueChange={handleStatusChange}>
            <SelectTrigger className="w-36">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {STATUSES.map((s) => (
                <SelectItem key={s.value} value={s.value}>
                  <Badge variant="outline" className={`${STATUS_COLORS[s.value]} border-0`}>
                    {s.label}
                  </Badge>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={priority} onValueChange={handlePriorityChange}>
            <SelectTrigger className="w-28">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {PRIORITIES.map((p) => (
                <SelectItem key={p.value} value={p.value}>
                  <Badge variant="outline" className={`${PRIORITY_COLORS[p.value]} border-0`}>
                    {p.label}
                  </Badge>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Source Field */}
        <div className="space-y-2">
          <Label className="text-xs text-muted-foreground">Source</Label>
          <Input
            value={source}
            onChange={(e) => handleSourceChange(e.target.value)}
            placeholder="e.g., Customer interview, Support ticket"
            className="h-9"
          />
        </div>

        {/* Declined Reason (only show when status is declined) */}
        {status === "declined" && (
          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">Reason for Declining</Label>
            <Textarea
              value={declinedReason}
              onChange={(e) => handleDeclinedReasonChange(e.target.value)}
              placeholder="Explain why this request was declined..."
              className="min-h-[80px] resize-none"
            />
          </div>
        )}

        {/* Body */}
        <div className="space-y-2">
          <Label className="text-xs text-muted-foreground">Details</Label>
          <RichTextEditor
            content={body}
            onChange={handleBodyChange}
            placeholder="Describe the feature request..."
          />
        </div>

        {/* Context Tags */}
        {productId && (
          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">Context Tags</Label>
            <ContextTagsPicker
              productId={productId}
              personaIds={personaIds}
              featureIds={featureIds}
              dimensionValueIds={dimensionValueIds}
              onPersonasChange={(ids) => {
                setPersonaIds(ids);
                debouncedSave({ personaIds: ids });
              }}
              onFeaturesChange={(ids) => {
                setFeatureIds(ids);
                debouncedSave({ featureIds: ids });
              }}
              onDimensionValueIdsChange={(ids) => {
                setDimensionValueIds(ids);
                debouncedSave({ dimensionValueIds: ids });
              }}
            />
          </div>
        )}

        {/* Linked Items */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label className="text-xs text-muted-foreground">Linked Items</Label>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setLinkModalOpen(true)}
              className="h-7 gap-1.5 text-xs"
            >
              <Link2 className="h-3 w-3" />
              Link
            </Button>
          </div>
          <LinkedItems
            entityId={id!}
            onOpenLink={(entityId, entityType) => {
              const routes: Record<string, string> = {
                problem: "problems",
                hypothesis: "hypotheses",
                experiment: "experiments",
                decision: "decisions",
                artifact: "artifacts",
                capture: "captures",
                feedback: "feedback",
                feature_request: "feature-requests",
                feature: "features",
              };
              navigate(`/product/${productId}/${routes[entityType]}/${entityId}`);
            }}
          />
        </div>
      </div>

      {productId && id && (
        <LinkToModal
          open={linkModalOpen}
          onOpenChange={setLinkModalOpen}
          productId={productId}
          currentEntityId={id}
        />
      )}
    </div>
  );
}
