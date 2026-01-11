import { useEffect, useMemo, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Plus, Search, Zap, MoreHorizontal, AlertCircle, Lightbulb, FlaskConical, CheckCircle, Paperclip } from 'lucide-react';
import { useProductContext } from '@/contexts/ProductContext';
import { useEntitiesByType, usePromoteCapture } from '@/hooks/useEntities';
import { useQuickCapture } from '@/contexts/QuickCaptureContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useToast } from '@/hooks/use-toast';
import { formatDistanceToNow } from 'date-fns';
import type { Entity, EntityType } from '@/lib/types';

const PROMOTE_OPTIONS: { type: EntityType; label: string; icon: React.ElementType }[] = [
  { type: "problem", label: "Problem", icon: AlertCircle },
  { type: "hypothesis", label: "Hypothesis", icon: Lightbulb },
  { type: "experiment", label: "Experiment", icon: FlaskConical },
  { type: "decision", label: "Decision", icon: CheckCircle },
  { type: "artifact", label: "Artifact", icon: Paperclip },
];

export default function CapturesPage() {
  const { productId } = useParams<{ productId: string }>();
  const { setCurrentProduct } = useProductContext();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { open: openQuickCapture } = useQuickCapture();

  const { data: captures, isLoading } = useEntitiesByType(productId, 'capture');
  const promoteCapture = usePromoteCapture();

  const [search, setSearch] = useState('');
  const [showPromoted, setShowPromoted] = useState(false);

  useEffect(() => {
    if (productId) setCurrentProduct(productId);
  }, [productId, setCurrentProduct]);

  const filteredCaptures = useMemo(() => {
    if (!captures) return [];
    return captures
      .filter((c) => {
        // Filter by promoted status
        if (!showPromoted && c.promotedToId) return false;
        // Search filter
        if (search && !c.title.toLowerCase().includes(search.toLowerCase()) && !c.body.toLowerCase().includes(search.toLowerCase())) return false;
        return true;
      })
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [captures, showPromoted, search]);

  const handlePromote = async (captureId: string, targetType: EntityType) => {
    try {
      const newEntity = await promoteCapture.mutateAsync({ captureId, targetType });
      toast({
        title: "Promoted!",
        description: `Capture promoted to ${targetType}.`,
      });
      const pathMap: Record<EntityType, string> = {
        problem: "problems",
        hypothesis: "hypotheses",
        experiment: "experiments",
        decision: "decisions",
        artifact: "artifacts",
        capture: "captures",
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
      <div className="page-container">
        <Skeleton className="mb-4 h-8 w-48" />
        <Skeleton className="mb-4 h-9 w-full" />
        <div className="space-y-1.5">
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-16 w-full" />
        </div>
      </div>
    );
  }

  return (
    <div className="page-container flex h-full flex-col">
      {/* Header */}
      <div className="page-header page-header-row">
        <div>
          <h1 className="text-page-title">Captures</h1>
          <p className="mt-1 text-meta">Quick thoughts and observations to refine later</p>
        </div>
        <Button onClick={openQuickCapture} size="sm" className="gap-2 shadow-sm">
          <Plus className="h-4 w-4" />
          New Capture
        </Button>
      </div>

      {/* Filters */}
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground pointer-events-none" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search captures..."
            className="pl-9 h-9"
          />
        </div>
        <Button
          variant={showPromoted ? "secondary" : "outline"}
          size="sm"
          onClick={() => setShowPromoted(!showPromoted)}
          className="h-9 text-xs"
        >
          {showPromoted ? "Showing Promoted" : "Show Promoted"}
        </Button>
      </div>

      {/* Content */}
      {filteredCaptures.length === 0 ? (
        <div className="flex flex-1 flex-col items-center justify-center text-center">
          <p className="mb-4 text-sm text-muted-foreground">
            {search
              ? 'No captures match your search.'
              : showPromoted
              ? 'No promoted captures yet.'
              : 'No captures yet. Use Quick Capture to jot down thoughts.'}
          </p>
          {!search && !showPromoted && (
            <Button onClick={openQuickCapture} variant="outline" size="sm">
              Create your first capture
            </Button>
          )}
        </div>
      ) : (
        <div className="space-y-1.5">
          {filteredCaptures.map((capture) => (
            <CaptureRow
              key={capture.id}
              capture={capture}
              productId={productId!}
              onPromote={handlePromote}
              isPromoting={promoteCapture.isPending}
            />
          ))}
        </div>
      )}
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
    <div className="flex items-center justify-between rounded-lg border border-border bg-card px-4 py-3 transition-all duration-150 hover:bg-accent hover:shadow-sm group">
      <Link
        to={`/product/${productId}/captures/${capture.id}`}
        className="flex-1 min-w-0"
      >
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-md bg-secondary flex-shrink-0">
            <Zap className="h-4 w-4 text-muted-foreground" />
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="truncate text-sm font-medium text-foreground">{capture.title}</h3>
            <p className="mt-0.5 text-xs text-muted-foreground">
              Captured {formatDistanceToNow(new Date(capture.createdAt), { addSuffix: true })}
            </p>
          </div>
        </div>
      </Link>
      <div className="flex items-center gap-2 ml-4">
        {capture.promotedToId && (
          <Badge variant="secondary" className="text-xs font-medium">
            Promoted
          </Badge>
        )}
        {!capture.promotedToId && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity"
                disabled={isPromoting}
              >
                <MoreHorizontal className="h-4 w-4" />
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
        )}
      </div>
    </div>
  );
}
