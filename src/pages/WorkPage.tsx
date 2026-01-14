import { useEffect, useState, useMemo } from "react";
import { useParams, Link, useSearchParams, useNavigate } from "react-router-dom";
import {
  Hammer,
  Search,
  FlaskConical,
  CheckCircle,
  Package,
  Plus,
} from "lucide-react";
import { useProductContext } from "@/contexts/ProductContext";
import { useEntities, useCreateEntity } from "@/hooks/useEntities";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";
import { formatDistanceToNow } from "date-fns";
import type { Entity, EntityType, FeatureHealth } from "@/lib/types";

const TYPE_CONFIG: Record<string, { icon: React.ElementType; label: string; route: string; color: string }> = {
  experiment: { icon: FlaskConical, label: "Experiment", route: "experiments", color: "text-cyan-500" },
  decision: { icon: CheckCircle, label: "Decision", route: "decisions", color: "text-green-500" },
  feature: { icon: Package, label: "Feature", route: "features", color: "text-indigo-500" },
};

const STATUS_COLORS: Record<string, string> = {
  planned: "bg-yellow-500/10 text-yellow-600 border-yellow-500/20",
  running: "bg-blue-500/10 text-blue-600 border-blue-500/20",
  paused: "bg-orange-500/10 text-orange-600 border-orange-500/20",
  complete: "bg-green-500/10 text-green-600 border-green-500/20",
  archived: "bg-gray-500/10 text-gray-500 border-gray-500/20",
  building: "bg-blue-500/10 text-blue-600 border-blue-500/20",
  shipped: "bg-green-500/10 text-green-600 border-green-500/20",
  monitoring: "bg-purple-500/10 text-purple-600 border-purple-500/20",
  stable: "bg-green-500/10 text-green-600 border-green-500/20",
  deprecated: "bg-gray-500/10 text-gray-500 border-gray-500/20",
};

const HEALTH_COLORS: Record<FeatureHealth, string> = {
  healthy: "bg-green-500",
  needs_attention: "bg-yellow-500",
  underperforming: "bg-red-500",
};

type TabValue = "all" | "experiment" | "decision" | "feature";

export default function WorkPage() {
  const { productId } = useParams<{ productId: string }>();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { setCurrentProduct } = useProductContext();
  const { data: entities, isLoading } = useEntities(productId);
  const createEntity = useCreateEntity();
  const { toast } = useToast();

  const [search, setSearch] = useState("");
  const filterParam = searchParams.get("filter") as TabValue | null;
  const [activeTab, setActiveTab] = useState<TabValue>(filterParam || "all");

  useEffect(() => {
    if (productId) setCurrentProduct(productId);
  }, [productId, setCurrentProduct]);

  useEffect(() => {
    if (filterParam && filterParam !== activeTab) {
      setActiveTab(filterParam);
    }
  }, [filterParam]);

  const handleTabChange = (value: string) => {
    setActiveTab(value as TabValue);
    if (value === "all") {
      searchParams.delete("filter");
    } else {
      searchParams.set("filter", value);
    }
    setSearchParams(searchParams);
  };

  const workTypes: EntityType[] = ["experiment", "decision", "feature"];

  const filteredEntities = useMemo(() => {
    if (!entities) return [];
    
    return entities
      .filter((e) => {
        if (!workTypes.includes(e.type)) return false;
        if (activeTab !== "all" && e.type !== activeTab) return false;
        if (search) {
          const searchLower = search.toLowerCase();
          return (
            e.title.toLowerCase().includes(searchLower) ||
            e.body.toLowerCase().includes(searchLower)
          );
        }
        return true;
      })
      .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
  }, [entities, activeTab, search]);

  const counts = useMemo(() => {
    if (!entities) return { all: 0, experiment: 0, decision: 0, feature: 0 };
    
    const workItems = entities.filter((e) => workTypes.includes(e.type));

    return {
      all: workItems.length,
      experiment: workItems.filter((e) => e.type === "experiment").length,
      decision: workItems.filter((e) => e.type === "decision").length,
      feature: workItems.filter((e) => e.type === "feature").length,
    };
  }, [entities]);

  const handleCreate = async (type: EntityType) => {
    if (!productId) return;
    try {
      const defaultStatus = type === "experiment" ? "planned" : type === "feature" ? "building" : undefined;
      const newEntity = await createEntity.mutateAsync({
        productId,
        type,
        title: `New ${TYPE_CONFIG[type]?.label || type}`,
        status: defaultStatus,
      });
      navigate(`/product/${productId}/${TYPE_CONFIG[type]?.route}/${newEntity.id}`);
    } catch {
      toast({
        title: "Error",
        description: "Failed to create item.",
        variant: "destructive",
      });
    }
  };

  if (isLoading) {
    return (
      <div className="page-container">
        <Skeleton className="mb-6 h-8 w-48" />
        <Skeleton className="mb-4 h-10 w-full max-w-sm" />
        <div className="space-y-2">
          {[...Array(5)].map((_, i) => (
            <Skeleton key={i} className="h-16 w-full" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="page-container">
      <div className="page-header">
        <div className="page-header-row">
          <div>
            <h1 className="flex items-center gap-2 text-lg font-semibold">
              <Hammer className="h-5 w-5 text-muted-foreground" />
              Work
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Experiments, decisions, and features
            </p>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button size="sm" className="gap-1.5">
                <Plus className="h-4 w-4" />
                New
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => handleCreate("experiment")} className="gap-2">
                <FlaskConical className="h-4 w-4 text-cyan-500" />
                Experiment
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleCreate("decision")} className="gap-2">
                <CheckCircle className="h-4 w-4 text-green-500" />
                Decision
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleCreate("feature")} className="gap-2">
                <Package className="h-4 w-4 text-indigo-500" />
                Feature
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Search & Tabs */}
      <div className="mb-6 space-y-4">
        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search work..."
            className="pl-9"
          />
        </div>

        <Tabs value={activeTab} onValueChange={handleTabChange}>
          <TabsList>
            <TabsTrigger value="all" className="gap-1.5">
              All
              <Badge variant="secondary" className="ml-1 text-[10px]">
                {counts.all}
              </Badge>
            </TabsTrigger>
            <TabsTrigger value="experiment" className="gap-1.5">
              <FlaskConical className="h-3.5 w-3.5" />
              Experiments
              <Badge variant="secondary" className="ml-1 text-[10px]">
                {counts.experiment}
              </Badge>
            </TabsTrigger>
            <TabsTrigger value="decision" className="gap-1.5">
              <CheckCircle className="h-3.5 w-3.5" />
              Decisions
              <Badge variant="secondary" className="ml-1 text-[10px]">
                {counts.decision}
              </Badge>
            </TabsTrigger>
            <TabsTrigger value="feature" className="gap-1.5">
              <Package className="h-3.5 w-3.5" />
              Features
              <Badge variant="secondary" className="ml-1 text-[10px]">
                {counts.feature}
              </Badge>
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* List */}
      {filteredEntities.length === 0 ? (
        <div className="py-16 text-center">
          <Hammer className="mx-auto h-10 w-10 text-muted-foreground/50" />
          <p className="mt-3 text-sm text-muted-foreground">
            {search ? "No items match your search." : "No work items yet."}
          </p>
          <div className="mt-4 flex flex-wrap justify-center gap-2">
            <Button variant="outline" size="sm" onClick={() => handleCreate("experiment")} className="gap-1.5">
              <FlaskConical className="h-3.5 w-3.5" />
              New Experiment
            </Button>
            <Button variant="outline" size="sm" onClick={() => handleCreate("decision")} className="gap-1.5">
              <CheckCircle className="h-3.5 w-3.5" />
              New Decision
            </Button>
            <Button variant="outline" size="sm" onClick={() => handleCreate("feature")} className="gap-1.5">
              <Package className="h-3.5 w-3.5" />
              New Feature
            </Button>
          </div>
        </div>
      ) : (
        <div className="space-y-1">
          {filteredEntities.map((entity) => {
            const config = TYPE_CONFIG[entity.type];
            const Icon = config?.icon || FlaskConical;
            const health = entity.metadata?.health as FeatureHealth | undefined;
            return (
              <Link
                key={entity.id}
                to={`/product/${productId}/${config?.route}/${entity.id}`}
                className="group flex items-center gap-3 rounded-lg border border-transparent px-3 py-2.5 transition-colors hover:border-border/50 hover:bg-muted/50"
              >
                <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-muted ${config?.color || ""}`}>
                  <Icon className="h-4 w-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-foreground">
                    {entity.title || "Untitled"}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {config?.label} · {formatDistanceToNow(new Date(entity.updatedAt), { addSuffix: true })}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {health && entity.type === "feature" && (
                    <div className={`h-2 w-2 rounded-full ${HEALTH_COLORS[health]}`} title={health.replace("_", " ")} />
                  )}
                  {entity.status && (
                    <Badge
                      variant="outline"
                      className={`text-[10px] capitalize ${STATUS_COLORS[entity.status] || ""}`}
                    >
                      {entity.status}
                    </Badge>
                  )}
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
