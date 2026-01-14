import { useEffect, useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { MessageSquare, ArrowLeft, Trash2, Link2, ExternalLink } from "lucide-react";
import { useProductContext } from "@/contexts/ProductContext";
import { useEntity, useUpdateEntity, useDeleteEntity } from "@/hooks/useEntities";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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

import type { FeedbackType, FeedbackStatus } from "@/lib/types";

const FEEDBACK_TYPES: { value: FeedbackType; label: string }[] = [
  { value: "praise", label: "Praise" },
  { value: "complaint", label: "Complaint" },
  { value: "bug", label: "Bug" },
  { value: "suggestion", label: "Suggestion" },
  { value: "question", label: "Question" },
];

const FEEDBACK_STATUSES: { value: FeedbackStatus; label: string }[] = [
  { value: "new", label: "New" },
  { value: "reviewed", label: "Reviewed" },
  { value: "actioned", label: "Actioned" },
  { value: "archived", label: "Archived" },
];

const STATUS_COLORS: Record<FeedbackStatus, string> = {
  new: "bg-blue-500/10 text-blue-600 border-blue-500/20",
  reviewed: "bg-yellow-500/10 text-yellow-600 border-yellow-500/20",
  actioned: "bg-green-500/10 text-green-600 border-green-500/20",
  archived: "bg-gray-500/10 text-gray-500 border-gray-500/20",
};

export default function FeedbackDetailPage() {
  const { productId, id } = useParams<{ productId: string; id: string }>();
  const navigate = useNavigate();
  const { setCurrentProduct } = useProductContext();
  const { data: entity, isLoading } = useEntity(id);
  const updateEntity = useUpdateEntity();
  const deleteEntity = useDeleteEntity();
  const { toast } = useToast();

  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [status, setStatus] = useState<FeedbackStatus>("new");
  const [feedbackType, setFeedbackType] = useState<FeedbackType>("suggestion");
  const [source, setSource] = useState("");
  const [sourceUrl, setSourceUrl] = useState("");
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
      setStatus((entity.status as FeedbackStatus) || "new");
      setFeedbackType((entity.metadata?.feedbackType as FeedbackType) || "suggestion");
      setSource(entity.metadata?.source || "");
      setSourceUrl(entity.metadata?.sourceUrl || "");
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

  const handleStatusChange = (value: FeedbackStatus) => {
    setStatus(value);
    debouncedSave({ status: value });
  };

  const handleFeedbackTypeChange = (value: FeedbackType) => {
    setFeedbackType(value);
    debouncedSave({ metadata: { ...entity?.metadata, feedbackType: value } });
  };

  const handleSourceChange = (value: string) => {
    setSource(value);
    debouncedSave({ metadata: { ...entity?.metadata, source: value } });
  };

  const handleSourceUrlChange = (value: string) => {
    setSourceUrl(value);
    debouncedSave({ metadata: { ...entity?.metadata, sourceUrl: value } });
  };

  const handleDelete = async () => {
    if (!id) return;
    try {
      await deleteEntity.mutateAsync(id);
      toast({ title: "Deleted", description: "Feedback has been deleted." });
      navigate(`/product/${productId}/inbox`);
    } catch {
      toast({ title: "Error", description: "Failed to delete feedback.", variant: "destructive" });
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
          metadata: { feedbackType, source, sourceUrl },
        },
      });
      toast({ title: "Saved", description: "Feedback has been saved." });
      navigate(`/product/${productId}/inbox`);
    } catch {
      toast({ title: "Error", description: "Failed to save feedback.", variant: "destructive" });
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
        <p className="text-sm text-muted-foreground">Feedback not found</p>
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
            <MessageSquare className="h-5 w-5 text-blue-500" />
            <span className="text-sm font-medium text-muted-foreground">Feedback</span>
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
                <AlertDialogTitle>Delete feedback?</AlertDialogTitle>
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
          placeholder="Feedback title..."
          className="border-0 bg-transparent px-0 text-xl font-semibold placeholder:text-muted-foreground/50 focus-visible:ring-0"
        />

        {/* Metadata Row */}
        <div className="flex flex-wrap items-center gap-3">
          <Select value={status} onValueChange={handleStatusChange}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {FEEDBACK_STATUSES.map((s) => (
                <SelectItem key={s.value} value={s.value}>
                  <Badge variant="outline" className={`${STATUS_COLORS[s.value]} border-0`}>
                    {s.label}
                  </Badge>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={feedbackType} onValueChange={handleFeedbackTypeChange}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {FEEDBACK_TYPES.map((t) => (
                <SelectItem key={t.value} value={t.value}>
                  {t.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Source Fields */}
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">Source</Label>
            <Input
              value={source}
              onChange={(e) => handleSourceChange(e.target.value)}
              placeholder="e.g., Twitter, Support ticket"
              className="h-9"
            />
          </div>
          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">Source URL</Label>
            <div className="flex gap-2">
              <Input
                value={sourceUrl}
                onChange={(e) => handleSourceUrlChange(e.target.value)}
                placeholder="https://..."
                className="h-9"
              />
              {sourceUrl && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-9 w-9 shrink-0"
                  onClick={() => window.open(sourceUrl, "_blank")}
                >
                  <ExternalLink className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Body */}
        <div className="space-y-2">
          <Label className="text-xs text-muted-foreground">Details</Label>
          <RichTextEditor
            content={body}
            onChange={handleBodyChange}
            placeholder="Describe the feedback..."
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
