import { useState, useMemo } from "react";
import { Search, AlertCircle, Lightbulb, FlaskConical, CheckCircle, Paperclip, Zap, X } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useEntities } from "@/hooks/useEntities";
import { useRelationships, useRelationshipsGrouped, useCreateRelationship, useDeleteRelationship } from "@/hooks/useRelationships";
import { formatDistanceToNow } from "date-fns";
import type { Entity, EntityType, RelationshipType } from "@/lib/types";
import { RELATIONSHIP_TYPES } from "@/lib/types";

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

export interface LinkToModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  productId: string;
  currentEntityId: string;
  onLinked?: () => void;
}

export function LinkToModal({
  open,
  onOpenChange,
  productId,
  currentEntityId,
  onLinked,
}: LinkToModalProps) {
  const [search, setSearch] = useState("");
  const [typeFilters, setTypeFilters] = useState<EntityType[]>([]);
  const [relationshipType, setRelationshipType] = useState<RelationshipType>("relates_to");
  const { data: entities } = useEntities(productId);
  const { data: relationships } = useRelationships(currentEntityId);
  const createRelationship = useCreateRelationship();

  // Get all currently linked entity IDs
  const linkedEntityIds = useMemo(() => {
    if (!relationships) return new Set<string>();
    return new Set(relationships.map((r) => r.linkedEntity.id));
  }, [relationships]);

  // Filter and sort entities
  const filteredEntities = useMemo(() => {
    if (!entities) return [];
    return entities
      .filter((e) => {
        // Exclude current entity
        if (e.id === currentEntityId) return false;
        // Exclude already linked
        if (linkedEntityIds.has(e.id)) return false;
        // Type filter
        if (typeFilters.length > 0 && !typeFilters.includes(e.type)) return false;
        // Search filter
        if (search) {
          const searchLower = search.toLowerCase();
          const matchesTitle = e.title.toLowerCase().includes(searchLower);
          const matchesBody = e.body.toLowerCase().includes(searchLower);
          if (!matchesTitle && !matchesBody) return false;
        }
        return true;
      })
      .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
  }, [entities, currentEntityId, linkedEntityIds, typeFilters, search]);

  // Recent items (last 10 when no search)
  const recentItems = useMemo(() => {
    if (search || typeFilters.length > 0) return [];
    return filteredEntities.slice(0, 10);
  }, [filteredEntities, search, typeFilters.length]);

  const displayItems = search || typeFilters.length > 0 ? filteredEntities : recentItems;

  const handleLink = async (entity: Entity) => {
    try {
      await createRelationship.mutateAsync({
        sourceId: currentEntityId,
        targetId: entity.id,
        relationshipType,
        productId,
      });
      setSearch("");
      setRelationshipType("relates_to");
      onLinked?.();
      onOpenChange(false);
    } catch {
      // Error handled by mutation
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[80vh] flex flex-col overflow-hidden">
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
          <div className="min-h-0 max-h-[300px] overflow-y-auto border rounded-lg">
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
                  const Icon = config.icon;
                  return (
                    <button
                      key={entity.id}
                      onClick={() => handleLink(entity)}
                      disabled={createRelationship.isPending}
                      className="flex w-full items-center gap-3 rounded-md p-2.5 text-left transition-colors hover:bg-muted disabled:opacity-50"
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
                          {config.label} · {formatDistanceToNow(new Date(entity.updatedAt), { addSuffix: true })}
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

// Component to display linked items using relationships
interface LinkedItemsProps {
  entityId: string;
  onOpenLink: (entityId: string, entityType: EntityType) => void;
}

export function LinkedItems({ entityId, onOpenLink }: LinkedItemsProps) {
  const { data: grouped, isLoading } = useRelationshipsGrouped(entityId);
  const deleteRelationship = useDeleteRelationship();

  const handleUnlink = async (
    e: React.MouseEvent,
    relationshipId: string,
    sourceId: string,
    targetId: string
  ) => {
    e.stopPropagation();
    try {
      await deleteRelationship.mutateAsync({
        id: relationshipId,
        sourceEntityId: sourceId,
        targetEntityId: targetId,
      });
    } catch {
      // Error handled by mutation
    }
  };

  if (isLoading) {
    return <p className="text-sm text-muted-foreground">Loading...</p>;
  }

  if (!grouped || (grouped.outgoing.length === 0 && grouped.incoming.length === 0)) {
    return (
      <p className="text-sm text-muted-foreground">No linked items yet.</p>
    );
  }

  const renderRelationship = (rel: typeof grouped.outgoing[0]) => {
    const entity = rel.linkedEntity;
    const config = TYPE_CONFIG[entity.type];
    const Icon = config.icon;

    const relTypeLabel = rel.relationshipType
      ? RELATIONSHIP_TYPES.find(rt => rt.value === rel.relationshipType)?.label || rel.relationshipType
      : null;

    return (
      <div
        key={rel.id}
        className="group flex items-center gap-2 rounded-lg border border-border bg-card px-3 py-2 text-sm transition-colors hover:bg-muted"
      >
        <button
          onClick={() => onOpenLink(entity.id, entity.type)}
          className="flex items-center gap-2 min-w-0 flex-1"
        >
          <Icon className="h-4 w-4 text-muted-foreground flex-shrink-0" />
          <span className="truncate">{entity.title}</span>
          {entity.status && (
            <Badge variant="secondary" className="text-xs capitalize flex-shrink-0">
              {entity.status}
            </Badge>
          )}
          {relTypeLabel && (
            <Badge variant="outline" className="text-xs flex-shrink-0">
              {relTypeLabel}
            </Badge>
          )}
        </button>
        <button
          onClick={(e) => handleUnlink(e, rel.id, rel.sourceId, rel.targetId)}
          disabled={deleteRelationship.isPending}
          className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-destructive/10 hover:text-destructive transition-all disabled:opacity-50"
          title="Unlink"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>
    );
  };

  return (
    <div className="space-y-4">
      {grouped.outgoing.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
            Links to ({grouped.outgoing.length})
          </p>
          <div className="flex flex-wrap gap-2">
            {grouped.outgoing.map(renderRelationship)}
          </div>
        </div>
      )}
      {grouped.incoming.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
            Linked from ({grouped.incoming.length})
          </p>
          <div className="flex flex-wrap gap-2">
            {grouped.incoming.map(renderRelationship)}
          </div>
        </div>
      )}
    </div>
  );
}
