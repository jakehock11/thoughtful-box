import { useEffect, useState, useMemo } from "react";
import { useParams, Link, useNavigate, useSearchParams } from "react-router-dom";
import {
  Inbox,
  Search,
  Zap,
  MessageSquare,
  Sparkles,
  MoreHorizontal,
  AlertCircle,
  Lightbulb,
  FlaskConical,
  CheckCircle,
  Package,
} from "lucide-react";
import { useProductContext } from "@/contexts/ProductContext";
import { useEntities, usePromoteCapture } from "@/hooks/useEntities";
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
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";
import { formatDistanceToNow } from "date-fns";
import type { Entity, EntityType } from "@/lib/types";

const TYPE_CONFIG: Record<string, { icon: React.ElementType; label: string; route: string; color: string }> = {
  capture: { icon: Zap, label: "Capture", route: "captures", color: "text-yellow-500" },
  feedback: { icon: MessageSquare, label: "Feedback", route: "feedback", color: "text-blue-500" },
  feature_request: { icon: Sparkles, label: "Request", route: "feature-requests", color: "text-purple-500" },
};

const PROMOTE_OPTIONS: { type: EntityType; label: string; icon: React.ElementType }[] = [
  { type: "problem", label: "Problem", icon: AlertCircle },
  { type: "hypothesis", label: "Hypothesis", icon: Lightbulb },
  { type: "experiment", label: "Experiment", icon: FlaskConical },
  { type: "decision", label: "Decision", icon: CheckCircle },
  { type: "feature", label: "Feature", icon: Package },
];

const STATUS_COLORS: Record<string, string> = {
  new: "bg-blue-500/10 text-blue-600 border-blue-500/20",
  reviewed: "bg-yellow-500/10 text-yellow-600 border-yellow-500/20",
  actioned: "bg-green-500/10 text-green-600 border-green-500/20",
  archived: "bg-gray-500/10 text-gray-500 border-gray-500/20",
  considering: "bg-purple-500/10 text-purple-600 border-purple-500/20",
  planned: "bg-indigo-500/10 text-indigo-600 border-indigo-500/20",
  in_progress: "bg-blue-500/10 text-blue-600 border-blue-500/20",
  shipped: "bg-green-500/10 text-green-600 border-green-500/20",
  declined: "bg-red-500/10 text-red-600 border-red-500/20",
};

type TabValue = "all" | "capture" | "feedback" | "feature_request";

export default function InboxPage() {
  const { productId } = useParams<{ productId: string }>();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { setCurrentProduct } = useProductContext();
  const { data: entities, isLoading } = useEntities(productId);
  const promoteCapture = usePromoteCapture();
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

  const inboxTypes: EntityType[] = ["capture", "feedback", "feature_request"];

  const filteredEntities = useMemo(() => {
    if (!entities) return [];
    
    return entities
      .filter((e) => {
        // Filter by inbox types
        if (!inboxTypes.includes(e.type)) return false;
        // For captures, exclude promoted ones
        if (e.type === "capture" && e.promotedToId) return false;
        // Tab filter
        if (activeTab !== "all" && e.type !== activeTab) return false;
        // Search filter
        if (search) {
          const searchLower = search.toLowerCase();
          return (
            e.title.toLowerCase().includes(searchLower) ||
            e.body.toLowerCase().includes(searchLower)
          );
        }
        return true;
      })
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [entities, activeTab, search]);

  const counts = useMemo(() => {
    if (!entities) return { all: 0, capture: 0, feedback: 0, feature_request: 0 };
    
    const inboxItems = entities.filter((e) => {
      if (!inboxTypes.includes(e.type)) return false;
      if (e.type === "capture" && e.promotedToId) return false;
      return true;
    });

    return {
      all: inboxItems.length,
      capture: inboxItems.filter((e) => e.type === "capture").length,
      feedback: inboxItems.filter((e) => e.type === "feedback").length,
      feature_request: inboxItems.filter((e) => e.type === "feature_request").length,
    };
  }, [entities]);

  const handlePromote = async (entity: Entity, targetType: EntityType) => {
    try {
      const newEntity = await promoteCapture.mutateAsync({ captureId: entity.id, targetType });
      toast({
        title: "Promoted!",
        description: `${TYPE_CONFIG[entity.type]?.label || "Item"} promoted to ${targetType}.`,
      });
      const pathMap: Record<EntityType, string> = {
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
      navigate(`/product/${productId}/${pathMap[targetType]}/${newEntity.id}`);
    } catch {
      toast({
        title: "Error",
        description: "Failed to promote item.",
        variant: "destructive",
      });
    }
  };

  const getDetailRoute = (entity: Entity) => {
    const routes: Record<string, string> = {
      capture: "captures",
      feedback: "feedback",
      feature_request: "feature-requests",
    };
    return `/product/${productId}/${routes[entity.type] || "captures"}/${entity.id}`;
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
              <Inbox className="h-5 w-5 text-muted-foreground" />
              Inbox
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Captures, feedback, and feature requests
            </p>
          </div>
        </div>
      </div>

      {/* Search & Tabs */}
      <div className="mb-6 space-y-4">
        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search inbox..."
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
            <TabsTrigger value="capture" className="gap-1.5">
              <Zap className="h-3.5 w-3.5" />
              Captures
              <Badge variant="secondary" className="ml-1 text-[10px]">
                {counts.capture}
              </Badge>
            </TabsTrigger>
            <TabsTrigger value="feedback" className="gap-1.5">
              <MessageSquare className="h-3.5 w-3.5" />
              Feedback
              <Badge variant="secondary" className="ml-1 text-[10px]">
                {counts.feedback}
              </Badge>
            </TabsTrigger>
            <TabsTrigger value="feature_request" className="gap-1.5">
              <Sparkles className="h-3.5 w-3.5" />
              Requests
              <Badge variant="secondary" className="ml-1 text-[10px]">
                {counts.feature_request}
              </Badge>
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* List */}
      {filteredEntities.length === 0 ? (
        <div className="py-16 text-center">
          <Inbox className="mx-auto h-10 w-10 text-muted-foreground/50" />
          <p className="mt-3 text-sm text-muted-foreground">
            {search ? "No items match your search." : "Your inbox is empty."}
          </p>
        </div>
      ) : (
        <div className="space-y-1">
          {filteredEntities.map((entity) => {
            const config = TYPE_CONFIG[entity.type];
            const Icon = config?.icon || Zap;
            return (
              <div
                key={entity.id}
                className="group flex items-center gap-3 rounded-lg border border-transparent px-3 py-2.5 transition-colors hover:border-border/50 hover:bg-muted/50"
              >
                <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-muted ${config?.color || ""}`}>
                  <Icon className="h-4 w-4" />
                </div>
                <Link
                  to={getDetailRoute(entity)}
                  className="min-w-0 flex-1"
                >
                  <p className="truncate text-sm font-medium text-foreground">
                    {entity.title || "Untitled"}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {config?.label} · {formatDistanceToNow(new Date(entity.createdAt), { addSuffix: true })}
                  </p>
                </Link>
                <div className="flex items-center gap-2">
                  {entity.status && (
                    <Badge
                      variant="outline"
                      className={`text-[10px] capitalize ${STATUS_COLORS[entity.status] || ""}`}
                    >
                      {entity.status.replace("_", " ")}
                    </Badge>
                  )}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 opacity-0 transition-opacity group-hover:opacity-100"
                      >
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-44">
                      <div className="px-2 py-1.5 text-xs font-medium text-muted-foreground">
                        Promote to...
                      </div>
                      <DropdownMenuSeparator />
                      {PROMOTE_OPTIONS.map((opt) => (
                        <DropdownMenuItem
                          key={opt.type}
                          onClick={() => handlePromote(entity, opt.type)}
                          className="gap-2"
                        >
                          <opt.icon className="h-3.5 w-3.5" />
                          {opt.label}
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
