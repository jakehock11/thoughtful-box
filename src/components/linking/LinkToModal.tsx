import { useState, useMemo } from "react";
import { Search, AlertCircle, Lightbulb, FlaskConical, CheckCircle, Paperclip, Zap } from "lucide-react";
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
import { useEntities } from "@/hooks/useEntities";
import { useRelationships, useCreateRelationship } from "@/hooks/useRelationships";
import { formatDistanceToNow } from "date-fns";
import type { Entity, EntityType, RelationshipWithEntity } from "@/lib/types";

const TYPE_CONFIG: Record<EntityType, { icon: React.ElementType; label: string }> = {
  problem: { icon: AlertCircle, label: "Problem" },
  hypothesis: { icon: Lightbulb, label: "Hypothesis" },
  experiment: { icon: FlaskConical, label: "Experiment" },
  decision: { icon: CheckCircle, label: "Decision" },
  artifact: { icon: Paperclip, label: "Artifact" },
  capture: { icon: Zap, label: "Capture" },
};

interface LinkToModalProps {
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
        productId,
      });
      setSearch("");
      onLinked?.();
      onOpenChange(false);
    } catch {
      // Error handled by mutation
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Link to...</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by title or content..."
              className="pl-9"
              autoFocus
            />
          </div>

          {/* Type Filters */}
          <ToggleGroup
            type="multiple"
            value={typeFilters}
            onValueChange={(value) => setTypeFilters(value as EntityType[])}
            className="flex-wrap justify-start"
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
          <ScrollArea className="h-[300px]">
            {displayItems.length === 0 ? (
              <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
                {search || typeFilters.length > 0
                  ? "No items match your search."
                  : "No items available to link."}
              </div>
            ) : (
              <div className="space-y-1">
                {!search && typeFilters.length === 0 && (
                  <p className="mb-2 text-xs font-medium text-muted-foreground">Recent</p>
                )}
                {displayItems.map((entity) => {
                  const config = TYPE_CONFIG[entity.type];
                  const Icon = config.icon;
                  return (
                    <button
                      key={entity.id}
                      onClick={() => handleLink(entity)}
                      disabled={createRelationship.isPending}
                      className="flex w-full items-center gap-3 rounded-lg p-3 text-left transition-colors hover:bg-muted disabled:opacity-50"
                    >
                      <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded bg-muted">
                        <Icon className="h-4 w-4 text-muted-foreground" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium">{entity.title}</p>
                        <p className="text-xs text-muted-foreground">
                          {config.label} · {formatDistanceToNow(new Date(entity.updatedAt), { addSuffix: true })}
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </ScrollArea>
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
  const { data: relationships, isLoading } = useRelationships(entityId);

  if (isLoading) {
    return <p className="text-sm text-muted-foreground">Loading...</p>;
  }

  if (!relationships || relationships.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">No linked items yet.</p>
    );
  }

  return (
    <div className="flex flex-wrap gap-2">
      {relationships.map((rel) => {
        const entity = rel.linkedEntity;
        const config = TYPE_CONFIG[entity.type];
        const Icon = config.icon;

        return (
          <button
            key={rel.id}
            onClick={() => onOpenLink(entity.id, entity.type)}
            className="group flex items-center gap-2 rounded-lg border border-border bg-card px-3 py-2 text-sm transition-colors hover:bg-muted"
          >
            <Icon className="h-4 w-4 text-muted-foreground" />
            <span className="max-w-[150px] truncate">{entity.title}</span>
            {entity.status && (
              <Badge variant="secondary" className="text-xs capitalize">
                {entity.status}
              </Badge>
            )}
            <Badge variant="outline" className="text-xs">
              {rel.direction === 'incoming' ? '←' : '→'}
            </Badge>
          </button>
        );
      })}
    </div>
  );
}
