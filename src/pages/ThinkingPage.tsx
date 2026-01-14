import { useEffect, useState, useMemo } from "react";
import { useParams, Link, useSearchParams } from "react-router-dom";
import {
  Brain,
  Search,
  AlertCircle,
  Lightbulb,
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
import type { Entity, EntityType } from "@/lib/types";
import { useNavigate } from "react-router-dom";

const TYPE_CONFIG: Record<string, { icon: React.ElementType; label: string; route: string; color: string }> = {
  problem: { icon: AlertCircle, label: "Problem", route: "problems", color: "text-red-500" },
  hypothesis: { icon: Lightbulb, label: "Hypothesis", route: "hypotheses", color: "text-amber-500" },
};

const STATUS_COLORS: Record<string, string> = {
  active: "bg-green-500/10 text-green-600 border-green-500/20",
  exploring: "bg-purple-500/10 text-purple-600 border-purple-500/20",
  blocked: "bg-red-500/10 text-red-600 border-red-500/20",
  solved: "bg-green-500/10 text-green-600 border-green-500/20",
  archived: "bg-gray-500/10 text-gray-500 border-gray-500/20",
  draft: "bg-gray-500/10 text-gray-600 border-gray-500/20",
  invalidated: "bg-red-500/10 text-red-600 border-red-500/20",
};

type TabValue = "all" | "problem" | "hypothesis";

export default function ThinkingPage() {
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

  const thinkingTypes: EntityType[] = ["problem", "hypothesis"];

  const filteredEntities = useMemo(() => {
    if (!entities) return [];
    
    return entities
      .filter((e) => {
        if (!thinkingTypes.includes(e.type)) return false;
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
    if (!entities) return { all: 0, problem: 0, hypothesis: 0 };
    
    const thinkingItems = entities.filter((e) => thinkingTypes.includes(e.type));

    return {
      all: thinkingItems.length,
      problem: thinkingItems.filter((e) => e.type === "problem").length,
      hypothesis: thinkingItems.filter((e) => e.type === "hypothesis").length,
    };
  }, [entities]);

  const handleCreate = async (type: EntityType) => {
    if (!productId) return;
    try {
      const newEntity = await createEntity.mutateAsync({
        productId,
        type,
        title: `New ${TYPE_CONFIG[type]?.label || type}`,
        status: type === "problem" ? "active" : "draft",
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
              <Brain className="h-5 w-5 text-muted-foreground" />
              Thinking
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Problems and hypotheses
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
              <DropdownMenuItem onClick={() => handleCreate("problem")} className="gap-2">
                <AlertCircle className="h-4 w-4 text-red-500" />
                Problem
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleCreate("hypothesis")} className="gap-2">
                <Lightbulb className="h-4 w-4 text-amber-500" />
                Hypothesis
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
            placeholder="Search thinking..."
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
            <TabsTrigger value="problem" className="gap-1.5">
              <AlertCircle className="h-3.5 w-3.5" />
              Problems
              <Badge variant="secondary" className="ml-1 text-[10px]">
                {counts.problem}
              </Badge>
            </TabsTrigger>
            <TabsTrigger value="hypothesis" className="gap-1.5">
              <Lightbulb className="h-3.5 w-3.5" />
              Hypotheses
              <Badge variant="secondary" className="ml-1 text-[10px]">
                {counts.hypothesis}
              </Badge>
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* List */}
      {filteredEntities.length === 0 ? (
        <div className="py-16 text-center">
          <Brain className="mx-auto h-10 w-10 text-muted-foreground/50" />
          <p className="mt-3 text-sm text-muted-foreground">
            {search ? "No items match your search." : "No problems or hypotheses yet."}
          </p>
          <div className="mt-4 flex justify-center gap-2">
            <Button variant="outline" size="sm" onClick={() => handleCreate("problem")} className="gap-1.5">
              <AlertCircle className="h-3.5 w-3.5" />
              New Problem
            </Button>
            <Button variant="outline" size="sm" onClick={() => handleCreate("hypothesis")} className="gap-1.5">
              <Lightbulb className="h-3.5 w-3.5" />
              New Hypothesis
            </Button>
          </div>
        </div>
      ) : (
        <div className="space-y-1">
          {filteredEntities.map((entity) => {
            const config = TYPE_CONFIG[entity.type];
            const Icon = config?.icon || AlertCircle;
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
                {entity.status && (
                  <Badge
                    variant="outline"
                    className={`text-[10px] capitalize ${STATUS_COLORS[entity.status] || ""}`}
                  >
                    {entity.status}
                  </Badge>
                )}
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
