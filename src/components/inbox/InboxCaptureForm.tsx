import { useState, useRef, useMemo } from "react";
import {
  Zap,
  MessageSquare,
  Sparkles,
  Link2,
  X,
  Search,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { useCreateEntity, useEntity, useEntities } from "@/hooks/useEntities";
import { useCreateRelationship } from "@/hooks/useRelationships";
import { useActiveTaxonomy } from "@/hooks/useTaxonomy";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import type { Entity, EntityType, CreateEntityData, FeedbackType, FeatureRequestPriority } from "@/lib/types";
import { formatDistanceToNow } from "date-fns";

type CaptureType = "capture" | "feedback" | "feature_request";
type Sentiment = "positive" | "neutral" | "negative";
type Priority = FeatureRequestPriority;

const TYPE_LABELS: Record<CaptureType, string> = {
  capture: "Capture",
  feedback: "Feedback",
  feature_request: "Request",
};

interface InboxCaptureFormProps {
  productId: string;
  onSaved?: (entityId: string) => void;
}

export function InboxCaptureForm({ productId, onSaved }: InboxCaptureFormProps) {
  const { toast } = useToast();
  const bodyRef = useRef<HTMLTextAreaElement>(null);
  const createEntity = useCreateEntity();
  const createRelationship = useCreateRelationship();
  const { data: taxonomy } = useActiveTaxonomy(productId);

  // Form state
  const [captureType, setCaptureType] = useState<CaptureType>("capture");
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [source, setSource] = useState("");
  const [sentiment, setSentiment] = useState<Sentiment>("neutral");
  const [priority, setPriority] = useState<Priority>("medium");
  const [personaIds, setPersonaIds] = useState<string[]>([]);
  const [featureIds, setFeatureIds] = useState<string[]>([]);
  const [dimensionValueIds, setDimensionValueIds] = useState<string[]>([]);
  const [linkedEntityIds, setLinkedEntityIds] = useState<string[]>([]);
  const [linkPickerOpen, setLinkPickerOpen] = useState(false);

  const isSubmitting = createEntity.isPending;
  const canSubmit = body.trim().length > 0 && !isSubmitting;

  // Auto-expand textarea
  const handleBodyChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setBody(e.target.value);
    const target = e.target;
    target.style.height = "auto";
    target.style.height = `${target.scrollHeight}px`;
  };

  // Reset form (keeping type selection)
  const resetForm = () => {
    setTitle("");
    setBody("");
    setSource("");
    setSentiment("neutral");
    setPriority("medium");
    setPersonaIds([]);
    setFeatureIds([]);
    setDimensionValueIds([]);
    setLinkedEntityIds([]);
    if (bodyRef.current) {
      bodyRef.current.style.height = "auto";
      bodyRef.current.focus();
    }
  };

  const handleSubmit = async () => {
    if (!canSubmit) return;

    // Map sentiment to feedbackType
    const feedbackTypeMap: Record<Sentiment, FeedbackType> = {
      positive: "praise",
      neutral: "suggestion",
      negative: "complaint",
    };

    const entityData: CreateEntityData = {
      productId,
      type: captureType as EntityType,
      title: title.trim() || undefined,
      body: body.trim(),
      status: captureType === "capture" ? undefined : "new",
      personaIds,
      featureIds,
      dimensionValueIds,
      metadata: {
        ...(captureType === "feedback" && {
          source: source.trim() || undefined,
          feedbackType: feedbackTypeMap[sentiment],
        }),
        ...(captureType === "feature_request" && {
          source: source.trim() || undefined,
          priority,
        }),
      },
    };

    try {
      const newEntity = await createEntity.mutateAsync(entityData);

      // Create relationships for linked items
      for (const targetId of linkedEntityIds) {
        await createRelationship.mutateAsync({
          sourceId: newEntity.id,
          targetId,
          relationshipType: "relates_to",
          productId,
        });
      }

      toast({
        title: "Saved",
        description: `${TYPE_LABELS[captureType]} added to inbox.`,
      });

      onSaved?.(newEntity.id);
      resetForm();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save. Please try again.",
        variant: "destructive",
      });
    }
  };

  const removeLink = (id: string) => {
    setLinkedEntityIds((prev) => prev.filter((i) => i !== id));
  };

  const handleLinkSelect = (entityId: string) => {
    if (!linkedEntityIds.includes(entityId)) {
      setLinkedEntityIds((prev) => [...prev, entityId]);
    }
    setLinkPickerOpen(false);
  };

  // Taxonomy dropdown helper
  const handleTaxonomySelect = (
    type: "persona" | "feature" | "dimension",
    id: string | undefined,
    dimensionId?: string
  ) => {
    if (!id) {
      if (type === "persona") setPersonaIds([]);
      else if (type === "feature") setFeatureIds([]);
      return;
    }

    if (type === "persona") {
      setPersonaIds((prev) => (prev.includes(id) ? prev : [id]));
    } else if (type === "feature") {
      setFeatureIds((prev) => (prev.includes(id) ? prev : [id]));
    } else if (type === "dimension" && dimensionId) {
      // Replace any existing value from this dimension
      const dimension = taxonomy?.dimensions.find((d) => d.id === dimensionId);
      if (dimension) {
        const dimensionValueIdSet = new Set(dimension.values.map((v) => v.id));
        setDimensionValueIds((prev) => [
          ...prev.filter((v) => !dimensionValueIdSet.has(v)),
          id,
        ]);
      }
    }
  };

  return (
    <div className="mx-auto max-w-3xl rounded-xl border border-border/50 bg-card/50 p-5 shadow-sm">
      {/* Type Toggle */}
      <ToggleGroup
        type="single"
        value={captureType}
        onValueChange={(v) => v && setCaptureType(v as CaptureType)}
        className="mb-4 justify-start"
      >
        <ToggleGroupItem
          value="capture"
          className="gap-1.5 data-[state=on]:bg-primary data-[state=on]:text-primary-foreground"
        >
          <Zap className="h-3.5 w-3.5" />
          Capture
        </ToggleGroupItem>
        <ToggleGroupItem
          value="feedback"
          className="gap-1.5 data-[state=on]:bg-primary data-[state=on]:text-primary-foreground"
        >
          <MessageSquare className="h-3.5 w-3.5" />
          Feedback
        </ToggleGroupItem>
        <ToggleGroupItem
          value="feature_request"
          className="gap-1.5 data-[state=on]:bg-primary data-[state=on]:text-primary-foreground"
        >
          <Sparkles className="h-3.5 w-3.5" />
          Request
        </ToggleGroupItem>
      </ToggleGroup>

      {/* Title Field */}
      <Input
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Title (optional)"
        className="mb-3 h-9"
      />

      {/* Body Field */}
      <Textarea
        ref={bodyRef}
        value={body}
        onChange={handleBodyChange}
        placeholder="What's on your mind?"
        className="mb-4 min-h-[80px] resize-none"
      />

      {/* Type-Specific Fields */}
      {captureType === "feedback" && (
        <div className="mb-4 grid gap-3 animate-in fade-in-50 duration-200 sm:grid-cols-2">
          <Input
            value={source}
            onChange={(e) => setSource(e.target.value)}
            placeholder="Who or where is this from?"
            className="h-9"
          />
          <ToggleGroup
            type="single"
            value={sentiment}
            onValueChange={(v) => v && setSentiment(v as Sentiment)}
            className="justify-start"
          >
            <ToggleGroupItem
              value="positive"
              className="text-xs data-[state=on]:bg-green-500/10 data-[state=on]:text-green-600"
            >
              Positive
            </ToggleGroupItem>
            <ToggleGroupItem
              value="neutral"
              className="text-xs data-[state=on]:bg-yellow-500/10 data-[state=on]:text-yellow-600"
            >
              Neutral
            </ToggleGroupItem>
            <ToggleGroupItem
              value="negative"
              className="text-xs data-[state=on]:bg-red-500/10 data-[state=on]:text-red-600"
            >
              Negative
            </ToggleGroupItem>
          </ToggleGroup>
        </div>
      )}

      {captureType === "feature_request" && (
        <div className="mb-4 grid gap-3 animate-in fade-in-50 duration-200 sm:grid-cols-2">
          <Input
            value={source}
            onChange={(e) => setSource(e.target.value)}
            placeholder="Who requested this?"
            className="h-9"
          />
          <ToggleGroup
            type="single"
            value={priority}
            onValueChange={(v) => v && setPriority(v as Priority)}
            className="justify-start"
          >
            <ToggleGroupItem
              value="low"
              className="text-xs data-[state=on]:bg-gray-500/10 data-[state=on]:text-gray-500"
            >
              Low
            </ToggleGroupItem>
            <ToggleGroupItem
              value="medium"
              className="text-xs data-[state=on]:bg-yellow-500/10 data-[state=on]:text-yellow-600"
            >
              Medium
            </ToggleGroupItem>
            <ToggleGroupItem
              value="high"
              className="text-xs data-[state=on]:bg-orange-500/10 data-[state=on]:text-orange-600"
            >
              High
            </ToggleGroupItem>
            <ToggleGroupItem
              value="critical"
              className="text-xs data-[state=on]:bg-red-500/10 data-[state=on]:text-red-600"
            >
              Critical
            </ToggleGroupItem>
          </ToggleGroup>
        </div>
      )}

      {/* Context Tags Section */}
      {taxonomy && (
        <div className="mb-4 flex flex-wrap items-center gap-2">
          {/* Personas */}
          {taxonomy.personas.length > 0 && (
            <Select
              value={personaIds[0] || ""}
              onValueChange={(v) => handleTaxonomySelect("persona", v || undefined)}
            >
              <SelectTrigger className="h-8 w-auto min-w-[120px] text-xs">
                <SelectValue placeholder="Persona" />
              </SelectTrigger>
              <SelectContent>
                {taxonomy.personas.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}

          {/* Features */}
          {taxonomy.features.length > 0 && (
            <Select
              value={featureIds[0] || ""}
              onValueChange={(v) => handleTaxonomySelect("feature", v || undefined)}
            >
              <SelectTrigger className="h-8 w-auto min-w-[120px] text-xs">
                <SelectValue placeholder="Feature Area" />
              </SelectTrigger>
              <SelectContent>
                {taxonomy.features.map((f) => (
                  <SelectItem key={f.id} value={f.id}>
                    {f.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}

          {/* Custom Dimensions */}
          {taxonomy.dimensions.map((dim) => {
            if (dim.values.length === 0) return null;
            const selectedValue = dimensionValueIds.find((id) =>
              dim.values.some((v) => v.id === id)
            );
            return (
              <Select
                key={dim.id}
                value={selectedValue || ""}
                onValueChange={(v) =>
                  handleTaxonomySelect("dimension", v || undefined, dim.id)
                }
              >
                <SelectTrigger className="h-8 w-auto min-w-[120px] text-xs">
                  <SelectValue placeholder={dim.name} />
                </SelectTrigger>
                <SelectContent>
                  {dim.values.map((v) => (
                    <SelectItem key={v.id} value={v.id}>
                      {v.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            );
          })}
        </div>
      )}

      {/* Links Section */}
      <div className="mb-4 flex flex-wrap items-center gap-2">
        {linkedEntityIds.map((id) => (
          <LinkedEntityBadge key={id} entityId={id} onRemove={() => removeLink(id)} />
        ))}
        <Collapsible open={linkPickerOpen} onOpenChange={setLinkPickerOpen}>
          <CollapsibleTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="h-7 gap-1.5 text-xs text-muted-foreground hover:text-foreground"
            >
              <Link2 className="h-3 w-3" />
              Link to existing item
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent className="mt-2">
            <InlineLinkPicker
              productId={productId}
              excludeIds={linkedEntityIds}
              onSelect={handleLinkSelect}
            />
          </CollapsibleContent>
        </Collapsible>
      </div>

      {/* Save Button */}
      <div className="flex justify-end">
        <Button
          onClick={handleSubmit}
          disabled={!canSubmit}
          className="min-w-[120px]"
        >
          {isSubmitting ? "Saving..." : "Save to Inbox"}
        </Button>
      </div>
    </div>
  );
}

// Small component for displaying linked entity badges
function LinkedEntityBadge({
  entityId,
  onRemove,
}: {
  entityId: string;
  onRemove: () => void;
}) {
  const { data: entity } = useEntity(entityId);

  if (!entity) {
    return (
      <Badge variant="secondary" className="gap-1 pr-1">
        Loading...
        <button onClick={onRemove} className="rounded hover:bg-muted">
          <X className="h-3 w-3" />
        </button>
      </Badge>
    );
  }

  return (
    <Badge variant="secondary" className="gap-1 pr-1">
      {entity.title || "Untitled"}
      <button onClick={onRemove} className="rounded hover:bg-muted">
        <X className="h-3 w-3" />
      </button>
    </Badge>
  );
}

// Inline link picker component for selecting entities to link
interface InlineLinkPickerProps {
  productId: string;
  excludeIds: string[];
  onSelect: (entityId: string) => void;
}

function InlineLinkPicker({ productId, excludeIds, onSelect }: InlineLinkPickerProps) {
  const [search, setSearch] = useState("");
  const { data: entities } = useEntities(productId);

  const filteredEntities = useMemo(() => {
    if (!entities) return [];
    return entities
      .filter((e) => {
        // Exclude already linked
        if (excludeIds.includes(e.id)) return false;
        // Search filter
        if (search) {
          const searchLower = search.toLowerCase();
          const matchesTitle = e.title.toLowerCase().includes(searchLower);
          const matchesBody = e.body.toLowerCase().includes(searchLower);
          if (!matchesTitle && !matchesBody) return false;
        }
        return true;
      })
      .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
      .slice(0, 10);
  }, [entities, excludeIds, search]);

  const TYPE_ICONS: Record<string, React.ElementType> = {
    capture: Zap,
    feedback: MessageSquare,
    feature_request: Sparkles,
    problem: Zap,
    hypothesis: Zap,
    experiment: Zap,
    decision: Zap,
    artifact: Zap,
    feature: Zap,
  };

  return (
    <div className="rounded-lg border border-border bg-muted/30 p-2">
      <div className="relative mb-2">
        <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search items..."
          className="h-8 pl-8 text-xs"
          autoFocus
        />
      </div>
      <div className="max-h-40 overflow-y-auto">
        {filteredEntities.length === 0 ? (
          <p className="py-3 text-center text-xs text-muted-foreground">
            {search ? "No items match your search." : "No items available."}
          </p>
        ) : (
          <div className="space-y-0.5">
            {filteredEntities.map((entity) => {
              const Icon = TYPE_ICONS[entity.type] || Zap;
              return (
                <button
                  key={entity.id}
                  onClick={() => onSelect(entity.id)}
                  className="flex w-full items-center gap-2 rounded px-2 py-1.5 text-left text-xs transition-colors hover:bg-muted"
                >
                  <Icon className="h-3.5 w-3.5 text-muted-foreground" />
                  <span className="flex-1 truncate">{entity.title || "Untitled"}</span>
                  <span className="text-muted-foreground">
                    {formatDistanceToNow(new Date(entity.updatedAt), { addSuffix: true })}
                  </span>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
