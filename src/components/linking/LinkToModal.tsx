import { useState, useMemo } from "react";
import { Search, X, AlertCircle, Lightbulb, FlaskConical, CheckCircle, Paperclip, Zap } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { useEntities } from "@/hooks/useEntities";
import { formatDistanceToNow } from "date-fns";
import type { Entity, EntityType, LinkedIds } from "@/lib/db";

const TYPE_CONFIG: Record<EntityType, { icon: React.ElementType; label: string; pluralKey: keyof LinkedIds }> = {
  problem: { icon: AlertCircle, label: "Problem", pluralKey: "problems" },
  hypothesis: { icon: Lightbulb, label: "Hypothesis", pluralKey: "hypotheses" },
  experiment: { icon: FlaskConical, label: "Experiment", pluralKey: "experiments" },
  decision: { icon: CheckCircle, label: "Decision", pluralKey: "decisions" },
  artifact: { icon: Paperclip, label: "Artifact", pluralKey: "artifacts" },
  quick_capture: { icon: Zap, label: "Capture", pluralKey: "quickCaptures" },
};

interface LinkToModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  productId: string;
  currentEntityId: string;
  linkedIds: LinkedIds;
  onLink: (entityId: string, entityType: EntityType) => void;
}

export function LinkToModal({
  open,
  onOpenChange,
  productId,
  currentEntityId,
  linkedIds,
  onLink,
}: LinkToModalProps) {
  const [search, setSearch] = useState("");
  const [typeFilters, setTypeFilters] = useState<EntityType[]>([]);
  const { data: entities } = useEntities(productId);

  // Get all currently linked entity IDs
  const allLinkedIds = useMemo(() => {
    const ids = new Set<string>();
    Object.values(linkedIds).forEach((arr) => {
      arr?.forEach((id) => ids.add(id));
    });
    return ids;
  }, [linkedIds]);

  // Filter and sort entities
  const filteredEntities = useMemo(() => {
    if (!entities) return [];
    return entities
      .filter((e) => {
        // Exclude current entity
        if (e.id === currentEntityId) return false;
        // Exclude already linked
        if (allLinkedIds.has(e.id)) return false;
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
  }, [entities, currentEntityId, allLinkedIds, typeFilters, search]);

  // Recent items (last 10 when no search)
  const recentItems = useMemo(() => {
    if (search || typeFilters.length > 0) return [];
    return filteredEntities.slice(0, 10);
  }, [filteredEntities, search, typeFilters.length]);

  const displayItems = search || typeFilters.length > 0 ? filteredEntities : recentItems;

  const handleLink = (entity: Entity) => {
    onLink(entity.id, entity.type);
    setSearch("");
    onOpenChange(false);
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
                      className="flex w-full items-center gap-3 rounded-lg p-3 text-left transition-colors hover:bg-muted"
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

// Component to display linked items as pills
interface LinkedItemsProps {
  productId: string;
  linkedIds: LinkedIds;
  onUnlink: (entityId: string, entityType: EntityType) => void;
  onOpenLink: (entityId: string, entityType: EntityType) => void;
}

export function LinkedItems({ productId, linkedIds, onUnlink, onOpenLink }: LinkedItemsProps) {
  const { data: entities } = useEntities(productId);

  // Get all linked entities
  const linkedEntities = useMemo(() => {
    if (!entities) return [];
    const allLinkedIds = new Set<string>();
    Object.values(linkedIds).forEach((arr) => {
      arr?.forEach((id) => allLinkedIds.add(id));
    });
    return entities.filter((e) => allLinkedIds.has(e.id));
  }, [entities, linkedIds]);

  if (linkedEntities.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">No linked items yet.</p>
    );
  }

  return (
    <div className="flex flex-wrap gap-2">
      {linkedEntities.map((entity) => {
        const config = TYPE_CONFIG[entity.type];
        const Icon = config.icon;
        const status = getEntityStatus(entity);

        return (
          <div
            key={entity.id}
            className="group flex items-center gap-2 rounded-lg border border-border bg-card px-3 py-2 text-sm transition-colors hover:bg-muted"
          >
            <button
              onClick={() => onOpenLink(entity.id, entity.type)}
              className="flex items-center gap-2"
            >
              <Icon className="h-4 w-4 text-muted-foreground" />
              <span className="max-w-[150px] truncate">{entity.title}</span>
              {status && (
                <Badge variant="secondary" className="text-xs capitalize">
                  {status}
                </Badge>
              )}
            </button>
            <button
              onClick={() => onUnlink(entity.id, entity.type)}
              className="ml-1 opacity-0 transition-opacity group-hover:opacity-100"
              aria-label="Unlink"
            >
              <X className="h-3 w-3 text-muted-foreground hover:text-foreground" />
            </button>
          </div>
        );
      })}
    </div>
  );
}

function getEntityStatus(entity: Entity): string | undefined {
  if (entity.type === "problem") return (entity as any).status;
  if (entity.type === "experiment") return (entity as any).status;
  return undefined;
}
