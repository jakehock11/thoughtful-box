import { useState, useMemo } from "react";
import { Zap, Link2, Search, AlertCircle, Lightbulb, FlaskConical, CheckCircle, Paperclip, X, Loader2, MessageSquare, Sparkles } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useProductContext } from "@/contexts/ProductContext";
import { useCreateEntity, useEntities } from "@/hooks/useEntities";
import { useCreateRelationship } from "@/hooks/useRelationships";
import { ContextTagsPicker } from "@/components/taxonomy";
import { useToast } from "@/hooks/use-toast";
import { formatDistanceToNow } from "date-fns";
import type { Entity, EntityType, RelationshipType } from "@/lib/types";
import { RELATIONSHIP_TYPES } from "@/lib/types";

interface QuickCaptureModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const TYPE_CONFIG: Partial<Record<EntityType, { icon: React.ElementType; label: string }>> = {
  problem: { icon: AlertCircle, label: "Problem" },
  hypothesis: { icon: Lightbulb, label: "Hypothesis" },
  experiment: { icon: FlaskConical, label: "Experiment" },
  decision: { icon: CheckCircle, label: "Decision" },
  artifact: { icon: Paperclip, label: "Artifact" },
  capture: { icon: Zap, label: "Capture" },
  feedback: { icon: Zap, label: "Feedback" },
  feature_request: { icon: Zap, label: "Request" },
  feature: { icon: Zap, label: "Feature" },
};

interface PendingLink {
  entity: Entity;
  relationshipType: RelationshipType;
}

export function QuickCaptureModal({ open, onOpenChange }: QuickCaptureModalProps) {
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [personaIds, setPersonaIds] = useState<string[]>([]);
  const [featureIds, setFeatureIds] = useState<string[]>([]);
  const [dimensionValueIds, setDimensionValueIds] = useState<string[]>([]);
  const [pendingLinks, setPendingLinks] = useState<PendingLink[]>([]);
  const [linkPickerOpen, setLinkPickerOpen] = useState(false);
  const [entityType, setEntityType] = useState<'capture' | 'feedback' | 'feature_request'>('capture');
  const [source, setSource] = useState("");
  const [sentiment, setSentiment] = useState<'positive' | 'neutral' | 'negative' | null>(null);
  const [priority, setPriority] = useState<'low' | 'medium' | 'high' | 'critical' | null>(null);

  const { currentProductId } = useProductContext();
  const createEntity = useCreateEntity();
  const createRelationship = useCreateRelationship();
  const { toast } = useToast();

  const resetForm = () => {
    setTitle("");
    setBody("");
    setPersonaIds([]);
    setFeatureIds([]);
    setDimensionValueIds([]);
    setPendingLinks([]);
    setLinkPickerOpen(false);
    setEntityType('capture');
    setSource("");
    setSentiment(null);
    setPriority(null);
  };

  const handleSubmit = async () => {
    if (!title.trim() || !currentProductId) return;

    try {
      // Build metadata based on entity type
      const metadata = entityType === 'feedback'
        ? { source: source.trim() || undefined, sentiment: sentiment || undefined }
        : entityType === 'feature_request'
        ? { source: source.trim() || undefined, priority: priority || undefined }
        : undefined;

      // Create the entity
      const newEntity = await createEntity.mutateAsync({
        type: entityType,
        productId: currentProductId,
        title: title.trim(),
        body: body.trim(),
        personaIds,
        featureIds,
        dimensionValueIds,
        metadata,
      });

      // Create relationships for pending links
      for (const link of pendingLinks) {
        try {
          await createRelationship.mutateAsync({
            sourceId: newEntity.id,
            targetId: link.entity.id,
            relationshipType: link.relationshipType,
            productId: currentProductId,
          });
        } catch {
          // Continue even if a relationship fails
        }
      }

      const toastMessages: Record<string, { title: string; description: string }> = {
        capture: { title: "Captured!", description: "Your thought has been saved." },
        feedback: { title: "Feedback saved!", description: "Your feedback has been recorded." },
        feature_request: { title: "Request saved!", description: "Your feature request has been recorded." },
      };
      toast(toastMessages[entityType]);

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

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      resetForm();
    }
    onOpenChange(newOpen);
  };

  const addPendingLink = (entity: Entity, relationshipType: RelationshipType) => {
    // Don't add duplicates
    if (pendingLinks.some((l) => l.entity.id === entity.id)) return;
    setPendingLinks([...pendingLinks, { entity, relationshipType }]);
  };

  const removePendingLink = (entityId: string) => {
    setPendingLinks(pendingLinks.filter((l) => l.entity.id !== entityId));
  };

  const isSaving = createEntity.isPending;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[600px] p-0 gap-0">
        <DialogHeader className="px-6 py-4 border-b">
          <DialogTitle className="flex items-center gap-2 text-base font-semibold">
            {entityType === 'capture' && <Zap className="h-4 w-4 text-yellow-500" />}
            {entityType === 'feedback' && <MessageSquare className="h-4 w-4 text-blue-500" />}
            {entityType === 'feature_request' && <Sparkles className="h-4 w-4 text-purple-500" />}
            {entityType === 'capture' ? 'New Capture' : entityType === 'feedback' ? 'New Feedback' : 'New Request'}
          </DialogTitle>
        </DialogHeader>

        <div className="px-6 py-5 space-y-5">
          {/* Entity Type Selector */}
          <div className="flex gap-1 rounded-lg border border-border p-1 bg-muted/30">
            <Button
              type="button"
              variant={entityType === 'capture' ? 'secondary' : 'ghost'}
              size="sm"
              className="flex-1 gap-1.5 h-8"
              onClick={() => setEntityType('capture')}
            >
              <Zap className="h-3.5 w-3.5" />
              Capture
            </Button>
            <Button
              type="button"
              variant={entityType === 'feedback' ? 'secondary' : 'ghost'}
              size="sm"
              className="flex-1 gap-1.5 h-8"
              onClick={() => setEntityType('feedback')}
            >
              <MessageSquare className="h-3.5 w-3.5" />
              Feedback
            </Button>
            <Button
              type="button"
              variant={entityType === 'feature_request' ? 'secondary' : 'ghost'}
              size="sm"
              className="flex-1 gap-1.5 h-8"
              onClick={() => setEntityType('feature_request')}
            >
              <Sparkles className="h-3.5 w-3.5" />
              Request
            </Button>
          </div>

          {/* Feedback-specific fields */}
          {entityType === 'feedback' && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label className="text-sm font-medium">Source</Label>
                <Input
                  value={source}
                  onChange={(e) => setSource(e.target.value)}
                  placeholder="Who or where is this from?"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-medium">Sentiment</Label>
                <div className="flex gap-1">
                  {(['positive', 'neutral', 'negative'] as const).map((s) => (
                    <Button
                      key={s}
                      type="button"
                      variant={sentiment === s ? 'secondary' : 'outline'}
                      size="sm"
                      className="flex-1 capitalize"
                      onClick={() => setSentiment(sentiment === s ? null : s)}
                    >
                      {s}
                    </Button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Feature Request-specific fields */}
          {entityType === 'feature_request' && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label className="text-sm font-medium">Source</Label>
                <Input
                  value={source}
                  onChange={(e) => setSource(e.target.value)}
                  placeholder="Who requested this?"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-medium">Priority</Label>
                <div className="flex gap-1">
                  {(['low', 'medium', 'high', 'critical'] as const).map((p) => (
                    <Button
                      key={p}
                      type="button"
                      variant={priority === p ? 'secondary' : 'outline'}
                      size="sm"
                      className="flex-1 capitalize text-xs"
                      onClick={() => setPriority(priority === p ? null : p)}
                    >
                      {p}
                    </Button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Title Field */}
          <div className="space-y-2">
            <Label htmlFor="capture-title" className="text-sm font-medium">
              Title <span className="text-destructive">*</span>
            </Label>
            <Input
              id="capture-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="What's on your mind?"
              autoFocus
            />
          </div>

          {/* Body Field */}
          <div className="space-y-2">
            <Label htmlFor="capture-body" className="text-sm font-medium">
              Notes
            </Label>
            <Textarea
              id="capture-body"
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="Add more details, context, or observations..."
              className="min-h-[100px] resize-none"
            />
          </div>

          {/* Context Tags Section */}
          {currentProductId && (
            <div className="space-y-2">
              <Label className="text-sm font-medium">Context Tags</Label>
              <div className="rounded-lg border border-border bg-muted/30 p-3">
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
            </div>
          )}

          {/* Link Items Section */}
          {currentProductId && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-sm font-medium">Linked Items</Label>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setLinkPickerOpen(true)}
                  className="gap-1.5 h-7 text-xs"
                >
                  <Link2 className="h-3 w-3" />
                  Link to...
                </Button>
              </div>
              {pendingLinks.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {pendingLinks.map((link) => {
                    const config = TYPE_CONFIG[link.entity.type];
                    const Icon = config?.icon || Zap;
                    return (
                      <Badge
                        key={link.entity.id}
                        variant="secondary"
                        className="gap-1.5 pr-1 py-1"
                      >
                        <Icon className="h-3 w-3" />
                        <span className="truncate max-w-[150px]">{link.entity.title}</span>
                        <button
                          onClick={() => removePendingLink(link.entity.id)}
                          className="ml-1 rounded-full p-0.5 hover:bg-muted-foreground/20"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </Badge>
                    );
                  })}
                </div>
              ) : (
                <p className="text-xs text-muted-foreground">No linked items yet.</p>
              )}
            </div>
          )}
        </div>

        <DialogFooter className="px-6 py-4 border-t bg-muted/30">
          <Button variant="outline" onClick={() => handleOpenChange(false)} disabled={isSaving}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!title.trim() || !currentProductId || isSaving}
          >
            {isSaving ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                Saving...
              </>
            ) : (
              "Save"
            )}
          </Button>
        </DialogFooter>

        {/* Inline Link Picker */}
        {currentProductId && (
          <LinkPickerDialog
            open={linkPickerOpen}
            onOpenChange={setLinkPickerOpen}
            productId={currentProductId}
            excludeIds={pendingLinks.map((l) => l.entity.id)}
            onSelect={addPendingLink}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}

// Inline link picker for new captures
interface LinkPickerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  productId: string;
  excludeIds: string[];
  onSelect: (entity: Entity, relationshipType: RelationshipType) => void;
}

function LinkPickerDialog({
  open,
  onOpenChange,
  productId,
  excludeIds,
  onSelect,
}: LinkPickerDialogProps) {
  const [search, setSearch] = useState("");
  const [typeFilters, setTypeFilters] = useState<EntityType[]>([]);
  const [relationshipType, setRelationshipType] = useState<RelationshipType>("relates_to");
  const { data: entities } = useEntities(productId);

  const excludeSet = useMemo(() => new Set(excludeIds), [excludeIds]);

  const filteredEntities = useMemo(() => {
    if (!entities) return [];
    return entities
      .filter((e) => {
        if (excludeSet.has(e.id)) return false;
        if (typeFilters.length > 0 && !typeFilters.includes(e.type)) return false;
        if (search) {
          const searchLower = search.toLowerCase();
          const matchesTitle = e.title.toLowerCase().includes(searchLower);
          const matchesBody = e.body.toLowerCase().includes(searchLower);
          if (!matchesTitle && !matchesBody) return false;
        }
        return true;
      })
      .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
  }, [entities, excludeSet, typeFilters, search]);

  const recentItems = useMemo(() => {
    if (search || typeFilters.length > 0) return [];
    return filteredEntities.slice(0, 10);
  }, [filteredEntities, search, typeFilters.length]);

  const displayItems = search || typeFilters.length > 0 ? filteredEntities : recentItems;

  const handleSelect = (entity: Entity) => {
    onSelect(entity, relationshipType);
    setSearch("");
    setRelationshipType("relates_to");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[70vh] flex flex-col overflow-hidden">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle>Link to...</DialogTitle>
        </DialogHeader>

        <div className="flex flex-col gap-4 min-h-0 flex-1">
          {/* Search */}
          <div className="relative flex-shrink-0">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by title or content..."
              className="pl-9 w-full"
              autoFocus
            />
          </div>

          {/* Relationship Type Selector */}
          <div className="flex items-center gap-2 flex-shrink-0">
            <span className="text-sm text-muted-foreground whitespace-nowrap">Link as:</span>
            <Select value={relationshipType} onValueChange={(v) => setRelationshipType(v as RelationshipType)}>
              <SelectTrigger className="w-[160px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {RELATIONSHIP_TYPES.map((rt) => (
                  <SelectItem key={rt.value} value={rt.value}>
                    {rt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Type Filters */}
          <ToggleGroup
            type="multiple"
            value={typeFilters}
            onValueChange={(value) => setTypeFilters(value as EntityType[])}
            className="flex-wrap justify-start flex-shrink-0"
          >
            {Object.entries(TYPE_CONFIG).map(([type, config]) => (
              <ToggleGroupItem
                key={type}
                value={type}
                className="gap-1.5 text-xs"
                aria-label={`Filter ${config.label}`}
              >
                <config.icon className="h-3 w-3" />
                {config.label}
              </ToggleGroupItem>
            ))}
          </ToggleGroup>

          {/* Results */}
          <div className="min-h-0 max-h-[250px] overflow-y-auto border rounded-lg">
            {displayItems.length === 0 ? (
              <div className="flex h-20 items-center justify-center text-sm text-muted-foreground">
                {search || typeFilters.length > 0
                  ? "No items match your search."
                  : "No items available to link."}
              </div>
            ) : (
              <div className="p-1">
                {!search && typeFilters.length === 0 && (
                  <p className="px-2 py-1.5 text-xs font-medium text-muted-foreground">Recent</p>
                )}
                {displayItems.map((entity) => {
                  const config = TYPE_CONFIG[entity.type];
                  const Icon = config?.icon || Zap;
                  return (
                    <button
                      key={entity.id}
                      onClick={() => handleSelect(entity)}
                      className="flex w-full items-center gap-3 rounded-md p-2.5 text-left transition-colors hover:bg-muted"
                    >
                      <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded bg-muted">
                        <Icon className="h-4 w-4 text-muted-foreground" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <p className="truncate text-sm font-medium">{entity.title}</p>
                          {entity.status && (
                            <Badge variant="secondary" className="text-xs capitalize flex-shrink-0">
                              {entity.status}
                            </Badge>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {config?.label} · {formatDistanceToNow(new Date(entity.updatedAt), { addSuffix: true })}
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
