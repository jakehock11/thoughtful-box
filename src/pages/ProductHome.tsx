import { useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import {
  Zap,
  AlertCircle,
  FlaskConical,
  CheckCircle,
  ChevronRight,
  Lightbulb,
  MoreHorizontal,
} from "lucide-react";
import { useProductContext } from "@/contexts/ProductContext";
import { useEntities, filterEntitiesByType, usePromoteCapture } from "@/hooks/useEntities";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
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

const PROMOTE_OPTIONS: { type: EntityType; label: string; icon: React.ElementType }[] = [
  { type: "problem", label: "Problem", icon: AlertCircle },
  { type: "hypothesis", label: "Hypothesis", icon: Lightbulb },
  { type: "experiment", label: "Experiment", icon: FlaskConical },
  { type: "decision", label: "Decision", icon: CheckCircle },
];

export default function ProductHome() {
  const { productId } = useParams<{ productId: string }>();
  const navigate = useNavigate();
  const { setCurrentProduct, currentProduct } = useProductContext();
  const { data: entities, isLoading } = useEntities(productId);
  const promoteCapture = usePromoteCapture();
  const { toast } = useToast();

  useEffect(() => {
    if (productId) {
      setCurrentProduct(productId);
    }
  }, [productId, setCurrentProduct]);

  const captures = filterEntitiesByType<Entity>(entities, "capture")
    .filter((c) => !c.promotedToId) // Only show non-promoted captures
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 5);

  const activeProblems = filterEntitiesByType<Entity>(entities, "problem")
    .filter((p) => p.status === "active" || p.status === "exploring")
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
    .slice(0, 5);

  const runningExperiments = filterEntitiesByType<Entity>(entities, "experiment")
    .filter((e) => e.status === "running")
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
    .slice(0, 5);

  const recentDecisions = filterEntitiesByType<Entity>(entities, "decision")
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 5);

  const handlePromote = async (captureId: string, targetType: EntityType) => {
    try {
      const newEntity = await promoteCapture.mutateAsync({ captureId, targetType });
      toast({
        title: "Promoted!",
        description: `Capture promoted to ${targetType}.`,
      });
      // Navigate to the new entity
      const pathMap: Record<string, string> = {
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
        description: "Failed to promote capture.",
        variant: "destructive",
      });
    }
  };

  if (isLoading) {
    return (
      <div className="p-8">
        <Skeleton className="mb-8 h-8 w-48" />
        <div className="grid gap-6 lg:grid-cols-2">
          <Skeleton className="h-64" />
          <Skeleton className="h-64" />
          <Skeleton className="h-64" />
          <Skeleton className="h-64" />
        </div>
      </div>
    );
  }

  return (
    <div className="page-container">
      {/* Header */}
      <div className="page-header">
        <h1 className="text-page-title">
          {currentProduct?.name || "Product"} Home
        </h1>
        <p className="mt-1 text-meta">
          Overview of your product thinking
        </p>
      </div>

      {/* Dashboard Grid */}
      <div className="grid gap-5 lg:grid-cols-2">
        {/* Recent Captures */}
        <Card className="shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3 pt-4 px-4">
            <CardTitle className="flex items-center gap-2 text-sm font-medium text-foreground">
              <Zap className="h-4 w-4 text-muted-foreground" />
              Recent Captures
            </CardTitle>
            <Link
              to={`/product/${productId}/captures`}
              className="flex items-center gap-0.5 text-xs text-muted-foreground transition-colors hover:text-foreground"
            >
              View all
              <ChevronRight className="h-3 w-3" />
            </Link>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            {captures.length > 0 ? (
              <div className="space-y-0.5">
                {captures.map((capture) => (
                  <CaptureRow
                    key={capture.id}
                    capture={capture}
                    productId={productId!}
                    onPromote={handlePromote}
                    isPromoting={promoteCapture.isPending}
                  />
                ))}
              </div>
            ) : (
              <p className="py-6 text-center text-xs text-muted-foreground">
                No captures yet. Use Quick Capture to jot down thoughts.
              </p>
            )}
          </CardContent>
        </Card>

        {/* Active Problems */}
        <DashboardCard
          title="Active Problems"
          icon={AlertCircle}
          items={activeProblems}
          viewAllLink={`/product/${productId}/problems`}
          emptyMessage="No active problems. Create one to start exploring."
          renderItem={(item) => (
            <EntityRow
              key={item.id}
              title={item.title}
              timestamp={item.updatedAt}
              status={item.status || undefined}
              to={`/product/${productId}/problems/${item.id}`}
            />
          )}
        />

        {/* Running Experiments */}
        <DashboardCard
          title="Running Experiments"
          icon={FlaskConical}
          items={runningExperiments}
          viewAllLink={`/product/${productId}/experiments`}
          emptyMessage="No running experiments. Start one from a hypothesis."
          renderItem={(item) => (
            <EntityRow
              key={item.id}
              title={item.title}
              timestamp={item.updatedAt}
              status={item.status || undefined}
              to={`/product/${productId}/experiments/${item.id}`}
            />
          )}
        />

        {/* Recent Decisions */}
        <DashboardCard
          title="Recent Decisions"
          icon={CheckCircle}
          items={recentDecisions}
          viewAllLink={`/product/${productId}/decisions`}
          emptyMessage="No decisions recorded yet."
          renderItem={(item) => (
            <EntityRow
              key={item.id}
              title={item.title}
              timestamp={item.createdAt}
              to={`/product/${productId}/decisions/${item.id}`}
            />
          )}
        />
      </div>
    </div>
  );
}

interface CaptureRowProps {
  capture: Entity;
  productId: string;
  onPromote: (captureId: string, targetType: EntityType) => void;
  isPromoting: boolean;
}

function CaptureRow({ capture, productId, onPromote, isPromoting }: CaptureRowProps) {
  return (
    <div className="flex items-center justify-between rounded-md px-2 py-1.5 transition-colors duration-100 hover:bg-accent group">
      <Link
        to={`/product/${productId}/captures/${capture.id}`}
        className="flex-1 min-w-0"
      >
        <span className="truncate text-sm text-foreground block">{capture.title}</span>
      </Link>
      <div className="flex items-center gap-2">
        <span className="text-[11px] text-muted-foreground whitespace-nowrap">
          {formatDistanceToNow(new Date(capture.createdAt), { addSuffix: true })}
        </span>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
              disabled={isPromoting}
            >
              <MoreHorizontal className="h-3.5 w-3.5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-40">
            <div className="px-2 py-1.5 text-xs font-medium text-muted-foreground">
              Promote to...
            </div>
            {PROMOTE_OPTIONS.map((opt) => (
              <DropdownMenuItem
                key={opt.type}
                onClick={() => onPromote(capture.id, opt.type)}
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
}

interface DashboardCardProps<T> {
  title: string;
  icon: React.ElementType;
  items: T[];
  viewAllLink: string;
  emptyMessage: string;
  renderItem: (item: T) => React.ReactNode;
}

function DashboardCard<T>({
  title,
  icon: Icon,
  items,
  viewAllLink,
  emptyMessage,
  renderItem,
}: DashboardCardProps<T>) {
  return (
    <Card className="shadow-sm">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3 pt-4 px-4">
        <CardTitle className="flex items-center gap-2 text-sm font-medium text-foreground">
          <Icon className="h-4 w-4 text-muted-foreground" />
          {title}
        </CardTitle>
        <Link
          to={viewAllLink}
          className="flex items-center gap-0.5 text-xs text-muted-foreground transition-colors hover:text-foreground"
        >
          View all
          <ChevronRight className="h-3 w-3" />
        </Link>
      </CardHeader>
      <CardContent className="px-4 pb-4">
        {items.length > 0 ? (
          <div className="space-y-0.5">{items.map(renderItem)}</div>
        ) : (
          <p className="py-6 text-center text-xs text-muted-foreground">
            {emptyMessage}
          </p>
        )}
      </CardContent>
    </Card>
  );
}

interface EntityRowProps {
  title: string;
  timestamp: string;
  status?: string;
  to: string;
}

function EntityRow({ title, timestamp, status, to }: EntityRowProps) {
  return (
    <Link
      to={to}
      className="flex items-center justify-between rounded-md px-2 py-1.5 transition-colors duration-100 hover:bg-accent"
    >
      <span className="truncate text-sm text-foreground">{title}</span>
      <div className="flex items-center gap-2">
        {status && (
          <Badge variant="secondary" className="text-[11px] capitalize font-medium">
            {status}
          </Badge>
        )}
        <span className="text-[11px] text-muted-foreground whitespace-nowrap">
          {formatDistanceToNow(new Date(timestamp), { addSuffix: true })}
        </span>
      </div>
    </Link>
  );
}
