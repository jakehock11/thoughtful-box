import { useEffect, useMemo, useState } from "react";
import { useParams, Link } from "react-router-dom";
import {
  Search,
  AlertCircle,
  Lightbulb,
  FlaskConical,
  CheckCircle,
  Paperclip,
  Zap,
  MessageSquare,
  Sparkles,
  Package,
  List,
  LayoutGrid,
} from "lucide-react";
import { useProductContext } from "@/contexts/ProductContext";
import { useEntities } from "@/hooks/useEntities";
import { useActiveTaxonomy } from "@/hooks/useTaxonomy";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Button } from "@/components/ui/button";
import { formatDistanceToNow, isToday, isYesterday, isThisWeek, isThisMonth, format } from "date-fns";
import { SwimLaneTimeline } from "@/components/timeline/SwimLaneTimeline";
import type { Entity, EntityType } from "@/lib/types";

type ViewMode = "list" | "swimlane";

const TYPE_CONFIG: Record<EntityType, { icon: React.ElementType; label: string; color: string }> = {
  problem: { icon: AlertCircle, label: "Problem", color: "text-red-500" },
  hypothesis: { icon: Lightbulb, label: "Hypothesis", color: "text-yellow-500" },
  experiment: { icon: FlaskConical, label: "Experiment", color: "text-blue-500" },
  decision: { icon: CheckCircle, label: "Decision", color: "text-green-500" },
  artifact: { icon: Paperclip, label: "Artifact", color: "text-purple-500" },
  capture: { icon: Zap, label: "Capture", color: "text-orange-500" },
  feedback: { icon: MessageSquare, label: "Feedback", color: "text-blue-400" },
  feature_request: { icon: Sparkles, label: "Request", color: "text-purple-400" },
  feature: { icon: Package, label: "Feature", color: "text-indigo-500" },
};

// Helper to group items by date category
function getDateGroup(date: Date): string {
  if (isToday(date)) return "Today";
  if (isYesterday(date)) return "Yesterday";
  if (isThisWeek(date)) return "This Week";
  if (isThisMonth(date)) return "This Month";
  return format(date, "MMMM yyyy");
}

export default function TimelinePage() {
  const { productId } = useParams<{ productId: string }>();
  const { setCurrentProduct } = useProductContext();

  const { data: entities, isLoading } = useEntities(productId);
  const { data: taxonomy } = useActiveTaxonomy(productId);

  const [search, setSearch] = useState("");
  const [typeFilters, setTypeFilters] = useState<EntityType[]>([]);
  const [viewMode, setViewMode] = useState<ViewMode>("list");

  useEffect(() => {
    if (productId) setCurrentProduct(productId);
  }, [productId, setCurrentProduct]);

  const timelineItems = useMemo(() => {
    if (!entities) return [];
    return entities
      .filter((e) => {
        if (typeFilters.length > 0 && !typeFilters.includes(e.type)) return false;
        if (search && !e.title.toLowerCase().includes(search.toLowerCase())) return false;
        return true;
      })
      .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
  }, [entities, typeFilters, search]);

  const getEntityLink = (entity: Entity) => {
    const typeToPath: Record<EntityType, string> = {
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
    return `/product/${productId}/${typeToPath[entity.type]}/${entity.id}`;
  };

  // Group timeline items by date
  const groupedItems = useMemo(() => {
    const groups: { label: string; items: Entity[] }[] = [];
    let currentGroup: string | null = null;

    for (const item of timelineItems) {
      const group = getDateGroup(new Date(item.updatedAt));
      if (group !== currentGroup) {
        groups.push({ label: group, items: [item] });
        currentGroup = group;
      } else {
        groups[groups.length - 1].items.push(item);
      }
    }

    return groups;
  }, [timelineItems]);

  // Prepare taxonomy data for swimlane component
  const taxonomyForSwimlane = useMemo(() => ({
    personas: taxonomy?.personas.map((p) => ({ id: p.id, name: p.name })) || [],
    features: taxonomy?.features.map((f) => ({ id: f.id, name: f.name })) || [],
    dimensions: taxonomy?.dimensions.map((d) => ({
      id: d.id,
      name: d.name,
      values: d.values.map((v) => ({ id: v.id, name: v.name })),
    })) || [],
  }), [taxonomy]);

  if (isLoading) {
    return (
      <div className="page-container">
        <Skeleton className="mb-4 h-8 w-48" />
        <Skeleton className="mb-4 h-10 w-full" />
        <div className="space-y-2">
          <Skeleton className="h-16 w-full rounded-lg" />
          <Skeleton className="h-16 w-full rounded-lg" />
          <Skeleton className="h-16 w-full rounded-lg" />
        </div>
      </div>
    );
  }

  return (
    <div className="page-container flex h-full flex-col">
      <div className="page-header flex items-start justify-between">
        <div>
          <h1 className="text-lg font-semibold text-foreground">Timeline</h1>
          <p className="text-sm text-muted-foreground">
            Chronological view of all your product thinking
          </p>
        </div>
        <div className="flex items-center gap-1 rounded-lg border border-border p-1">
          <Button
            variant={viewMode === "list" ? "secondary" : "ghost"}
            size="sm"
            className="h-7 px-2"
            onClick={() => setViewMode("list")}
          >
            <List className="h-4 w-4" />
          </Button>
          <Button
            variant={viewMode === "swimlane" ? "secondary" : "ghost"}
            size="sm"
            className="h-7 px-2"
            onClick={() => setViewMode("swimlane")}
          >
            <LayoutGrid className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {viewMode === "swimlane" ? (
        <div className="flex-1 min-h-0">
          <SwimLaneTimeline
            productId={productId!}
            entities={entities || []}
            taxonomy={taxonomyForSwimlane}
          />
        </div>
      ) : (
        <>
          <div className="mb-6 flex flex-col gap-3 content-max-width">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search timeline..."
                className="h-9 pl-9 text-sm"
              />
            </div>
            <ToggleGroup
              type="multiple"
              value={typeFilters}
              onValueChange={(value) => setTypeFilters(value as EntityType[])}
              className="flex-wrap justify-start gap-1.5"
            >
              {Object.entries(TYPE_CONFIG).map(([type, config]) => (
                <ToggleGroupItem
                  key={type}
                  value={type}
                  className="h-7 gap-1.5 px-2.5 text-xs"
                  aria-label={`Filter ${config.label}`}
                >
                  <config.icon className={`h-3 w-3 ${config.color}`} />
                  {config.label}
                </ToggleGroupItem>
              ))}
            </ToggleGroup>
          </div>

          {timelineItems.length === 0 ? (
            <div className="flex flex-1 flex-col items-center justify-center py-16 text-center">
              <p className="text-sm text-muted-foreground">
                {search || typeFilters.length > 0
                  ? "No items match your filters."
                  : "No activity yet. Start capturing your product thinking."}
              </p>
            </div>
          ) : (
            <div className="content-max-width space-y-6 scrollbar-thin">
              {groupedItems.map((group) => (
                <div key={group.label} className="space-y-1.5">
                  <h2 className="sticky top-0 bg-background py-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    {group.label}
                  </h2>
                  {group.items.map((item) => {
                    const config = TYPE_CONFIG[item.type];
                    const Icon = config.icon;

                    return (
                      <Link
                        key={item.id}
                        to={getEntityLink(item)}
                        className="flex items-center gap-3 rounded-lg border border-border/50 bg-card p-3 shadow-xs transition-all hover:border-border hover:bg-muted/50 hover:shadow-sm"
                      >
                        <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-md bg-muted">
                          <Icon className={`h-4 w-4 ${config.color}`} />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1.5">
                            <Badge variant="outline" className="h-5 px-1.5 text-[10px] font-medium">
                              {config.label}
                            </Badge>
                            {item.status && (
                              <Badge variant="secondary" className="h-5 px-1.5 text-[10px] font-medium capitalize">
                                {item.status}
                              </Badge>
                            )}
                          </div>
                          <h3 className="mt-1 truncate text-sm font-medium">{item.title}</h3>
                        </div>
                        <span className="flex-shrink-0 text-xs text-muted-foreground">
                          {formatDistanceToNow(new Date(item.updatedAt), { addSuffix: true })}
                        </span>
                      </Link>
                    );
                  })}
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
