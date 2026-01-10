import { useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { 
  Zap, 
  AlertCircle, 
  FlaskConical, 
  CheckCircle, 
  ChevronRight,
  Lightbulb 
} from "lucide-react";
import { useProductContext } from "@/contexts/ProductContext";
import { useEntities, filterEntitiesByType } from "@/hooks/useEntities";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { formatDistanceToNow } from "date-fns";
import type { Problem, Experiment, Decision, QuickCapture } from "@/lib/db";

export default function ProductHome() {
  const { productId } = useParams<{ productId: string }>();
  const { setCurrentProduct, currentProduct } = useProductContext();
  const { data: entities, isLoading } = useEntities(productId);

  useEffect(() => {
    if (productId) {
      setCurrentProduct(productId);
    }
  }, [productId, setCurrentProduct]);

  const quickCaptures = filterEntitiesByType<QuickCapture>(entities, "quick_capture")
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 5);

  const activeProblems = filterEntitiesByType<Problem>(entities, "problem")
    .filter((p) => p.status === "active" || p.status === "exploring")
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
    .slice(0, 5);

  const runningExperiments = filterEntitiesByType<Experiment>(entities, "experiment")
    .filter((e) => e.status === "running")
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
    .slice(0, 5);

  const recentDecisions = filterEntitiesByType<Decision>(entities, "decision")
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 5);

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
        {/* Quick Captures */}
        <DashboardCard
          title="Quick Captures"
          icon={Zap}
          items={quickCaptures}
          viewAllLink={`/product/${productId}/quick-captures`}
          emptyMessage="No captures yet. Use Quick Capture to jot down thoughts."
          renderItem={(item) => (
            <EntityRow
              key={item.id}
              title={item.title}
              timestamp={item.createdAt}
              to={`/product/${productId}/quick-captures/${item.id}`}
            />
          )}
        />

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
              status={item.status}
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
              status={item.status}
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
