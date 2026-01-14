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
  Trash2,
} from "lucide-react";
import { useProductContext } from "@/contexts/ProductContext";
import { useEntities, usePromoteCapture, useDeleteEntity } from "@/hooks/useEntities";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { formatDistanceToNow } from "date-fns";
import { cn } from "@/lib/utils";
import { InboxCaptureForm } from "@/components/inbox";
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

const SENTIMENT_STYLES: Record<string, string> = {
  praise: "bg-green-500/10 text-green-600 border-green-500/20",
  suggestion: "bg-yellow-500/10 text-yellow-600 border-yellow-500/20",
  complaint: "bg-red-500/10 text-red-600 border-red-500/20",
  bug: "bg-red-500/10 text-red-600 border-red-500/20",
  question: "bg-blue-500/10 text-blue-600 border-blue-500/20",
};

const PRIORITY_STYLES: Record<string, string> = {
  low: "bg-gray-500/10 text-gray-500 border-gray-500/20",
  medium: "bg-yellow-500/10 text-yellow-600 border-yellow-500/20",
  high: "bg-orange-500/10 text-orange-600 border-orange-500/20",
  critical: "bg-red-500/10 text-red-600 border-red-500/20",
};

type TabValue = "all" | "capture" | "feedback" | "feature_request";

export default function InboxPage() {
  const { productId } = useParams<{ productId: string }>();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { setCurrentProduct } = useProductContext();
  const { data: entities, isLoading } = useEntities(productId);
  const promoteCapture = usePromoteCapture();
  const deleteEntity = useDeleteEntity();
  const { toast } = useToast();

  const [search, setSearch] = useState("");
  const filterParam = searchParams.get("filter") as TabValue | null;
  const [activeTab, setActiveTab] = useState<TabValue>(filterParam || "all");
  const [newItemId, setNewItemId] = useState<string | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [entityToDelete, setEntityToDelete] = useState<Entity | null>(null);

  useEffect(() => {
    if (productId) setCurrentProduct(productId);
  }, [productId, setCurrentProduct]);

  useEffect(() => {
    if (filterParam && filterParam !== activeTab) {
      setActiveTab(filterParam);
    }
  }, [filterParam]);

  const handleTabChange = (value: string) => {
    if (!value) return;
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
        if (!inboxTypes.includes(e.type)) return false;
        if (e.type === "capture" && e.promotedToId) return false;
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

  const handleDeleteClick = (entity: Entity) => {
    setEntityToDelete(entity);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!entityToDelete) return;
    try {
      await deleteEntity.mutateAsync(entityToDelete.id);
      toast({
        title: "Deleted",
        description: `${TYPE_CONFIG[entityToDelete.type]?.label || "Item"} deleted.`,
      });
    } catch {
      toast({
        title: "Error",
        description: "Failed to delete item.",
        variant: "destructive",
      });
    }
    setDeleteDialogOpen(false);
    setEntityToDelete(null);
  };

  const getDetailRoute = (entity: Entity) => {
    const routes: Record<string, string> = {
      capture: "captures",
      feedback: "feedback",
      feature_request: "feature-requests",
    };
    return `/product/${productId}/${routes[entity.type] || "captures"}/${entity.id}`;
  };

  const handleSaved = (entityId: string) => {
    setNewItemId(entityId);
    setTimeout(() => setNewItemId(null), 2000);
  };

  if (isLoading) {
    return (
      <div className="page-container">
        <Skeleton className="mb-6 h-8 w-48" />
        <Skeleton className="mx-auto mb-8 h-64 max-w-3xl" />
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
      {/* Page Header */}
      <div className="page-header">
        <div>
          <h1 className="flex items-center gap-2 text-lg font-semibold">
            <Inbox className="h-5 w-5 text-muted-foreground" />
            Inbox
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Capture and process incoming thoughts
          </p>
        </div>
      </div>

      {/* Capture Input Section */}
      {productId && (
        <div className="mb-8">
          <InboxCaptureForm productId={productId} onSaved={handleSaved} />
        </div>
      )}

      {/* Divider */}
      <Separator className="mb-6" />

      {/* Filter Bar */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <ToggleGroup
          type="single"
          value={activeTab}
          onValueChange={handleTabChange}
          className="justify-start"
        >
          <ToggleGroupItem value="all" className="gap-1.5 text-xs">
            All
            <Badge variant="secondary" className="ml-1 h-5 px-1.5 text-[10px]">
              {counts.all}
            </Badge>
          </ToggleGroupItem>
          <ToggleGroupItem value="capture" className="gap-1.5 text-xs">
            <Zap className="h-3 w-3" />
            Captures
            <Badge variant="secondary" className="ml-1 h-5 px-1.5 text-[10px]">
              {counts.capture}
            </Badge>
          </ToggleGroupItem>
          <ToggleGroupItem value="feedback" className="gap-1.5 text-xs">
            <MessageSquare className="h-3 w-3" />
            Feedback
            <Badge variant="secondary" className="ml-1 h-5 px-1.5 text-[10px]">
              {counts.feedback}
            </Badge>
          </ToggleGroupItem>
          <ToggleGroupItem value="feature_request" className="gap-1.5 text-xs">
            <Sparkles className="h-3 w-3" />
            Requests
            <Badge variant="secondary" className="ml-1 h-5 px-1.5 text-[10px]">
              {counts.feature_request}
            </Badge>
          </ToggleGroupItem>
        </ToggleGroup>

        <div className="relative w-full sm:w-64">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search inbox..."
            className="pl-9"
          />
        </div>
      </div>

      {/* Item List */}
      {filteredEntities.length === 0 ? (
        <div className="py-16 text-center">
          <Inbox className="mx-auto h-12 w-12 text-muted-foreground/40" />
          <h3 className="mt-4 text-sm font-medium text-foreground">Inbox is empty</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            {search
              ? "No items match your search."
              : "Capture a thought, log feedback, or record a feature request to get started."}
          </p>
        </div>
      ) : (
        <div className="space-y-1">
          {filteredEntities.map((entity) => {
            const config = TYPE_CONFIG[entity.type];
            const Icon = config?.icon || Zap;
            const isNew = entity.id === newItemId;

            return (
              <div
                key={entity.id}
                className={cn(
                  "group flex items-center gap-3 rounded-lg border border-transparent px-3 py-2.5 transition-all duration-300 hover:border-border/50 hover:bg-muted/50",
                  isNew && "bg-primary/10 ring-1 ring-primary/20"
                )}
              >
                <div
                  className={cn(
                    "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-muted",
                    config?.color
                  )}
                >
                  <Icon className="h-4 w-4" />
                </div>
                <Link to={getDetailRoute(entity)} className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-foreground">
                    {entity.title || entity.body.slice(0, 60) || "Untitled"}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {config?.label} ·{" "}
                    {formatDistanceToNow(new Date(entity.createdAt), { addSuffix: true })}
                  </p>
                </Link>
                <div className="flex items-center gap-2">
                  {/* Feedback sentiment indicator */}
                  {entity.type === "feedback" && entity.metadata?.feedbackType && (
                    <Badge
                      variant="outline"
                      className={cn(
                        "text-[10px] capitalize",
                        SENTIMENT_STYLES[entity.metadata.feedbackType] || ""
                      )}
                    >
                      {entity.metadata.feedbackType}
                    </Badge>
                  )}
                  {/* Feature request priority badge */}
                  {entity.type === "feature_request" && entity.metadata?.priority && (
                    <Badge
                      variant="outline"
                      className={cn(
                        "text-[10px] capitalize",
                        PRIORITY_STYLES[entity.metadata.priority] || ""
                      )}
                    >
                      {entity.metadata.priority}
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
                      <DropdownMenuItem asChild>
                        <Link to={getDetailRoute(entity)}>Open</Link>
                      </DropdownMenuItem>
                      <DropdownMenuSub>
                        <DropdownMenuSubTrigger>Promote to...</DropdownMenuSubTrigger>
                        <DropdownMenuSubContent>
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
                        </DropdownMenuSubContent>
                      </DropdownMenuSub>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        onClick={() => handleDeleteClick(entity)}
                        className="gap-2 text-destructive focus:text-destructive"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete {entityToDelete ? TYPE_CONFIG[entityToDelete.type]?.label : "item"}?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete this item.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
