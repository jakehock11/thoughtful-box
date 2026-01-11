import { useEffect, useMemo, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Plus, Search } from 'lucide-react';
import { useProductContext } from '@/contexts/ProductContext';
import { useEntitiesByType, useCreateEntity } from '@/hooks/useEntities';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { formatDistanceToNow } from 'date-fns';
import type { Entity, ExperimentStatus, ExperimentOutcome } from '@/lib/types';

const STATUS_TABS: { value: ExperimentStatus | 'all'; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'planned', label: 'Planned' },
  { value: 'running', label: 'Running' },
  { value: 'paused', label: 'Paused' },
  { value: 'complete', label: 'Complete' },
  { value: 'archived', label: 'Archived' },
];

const OUTCOME_VARIANTS: Record<ExperimentOutcome, 'default' | 'secondary' | 'destructive'> = {
  validated: 'default',
  invalidated: 'destructive',
  inconclusive: 'secondary',
};

export default function ExperimentsPage() {
  const { productId } = useParams<{ productId: string }>();
  const { setCurrentProduct } = useProductContext();
  const navigate = useNavigate();
  const { toast } = useToast();

  const { data: experiments, isLoading } = useEntitiesByType(productId, 'experiment');
  const createEntity = useCreateEntity();

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<ExperimentStatus | 'all'>('all');

  useEffect(() => {
    if (productId) setCurrentProduct(productId);
  }, [productId, setCurrentProduct]);

  const filteredExperiments = useMemo(() => {
    if (!experiments) return [];
    return experiments
      .filter((e) => {
        if (statusFilter !== 'all' && e.status !== statusFilter) return false;
        if (search && !e.title.toLowerCase().includes(search.toLowerCase())) return false;
        return true;
      })
      .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
  }, [experiments, statusFilter, search]);

  const handleCreate = async () => {
    if (!productId) return;
    try {
      const entity = await createEntity.mutateAsync({
        type: 'experiment',
        productId,
        title: 'Untitled Experiment',
        status: 'planned',
      });
      navigate(`/product/${productId}/experiments/${entity.id}`);
    } catch {
      toast({
        title: 'Error',
        description: 'Failed to create experiment',
        variant: 'destructive',
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
          <h1 className="text-page-title">Experiments</h1>
          <p className="mt-1 text-meta">Test hypotheses and gather evidence</p>
        </div>
        <Button onClick={handleCreate} size="sm" className="gap-2 shadow-sm">
          <Plus className="h-4 w-4" />
          New Experiment
        </Button>
      </div>

      {/* Filters */}
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground pointer-events-none" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search experiments..."
            className="pl-9 h-9"
          />
        </div>
        <Tabs
          value={statusFilter}
          onValueChange={(v) => setStatusFilter(v as ExperimentStatus | 'all')}
        >
          <TabsList className="h-9">
            {STATUS_TABS.map((tab) => (
              <TabsTrigger key={tab.value} value={tab.value} className="text-xs px-2.5">
                {tab.label}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
      </div>

      {/* Content */}
      {filteredExperiments.length === 0 ? (
        <div className="flex flex-1 flex-col items-center justify-center text-center">
          <p className="mb-4 text-sm text-muted-foreground">
            {search || statusFilter !== 'all'
              ? 'No experiments match your filters.'
              : 'No experiments yet. Create one to test a hypothesis.'}
          </p>
          {!search && statusFilter === 'all' && (
            <Button onClick={handleCreate} variant="outline" size="sm">
              Create your first experiment
            </Button>
          )}
        </div>
      ) : (
        <div className="space-y-1.5">
          {filteredExperiments.map((experiment) => {
            const outcome = experiment.metadata?.outcome as ExperimentOutcome | undefined;
            return (
              <Link
                key={experiment.id}
                to={`/product/${productId}/experiments/${experiment.id}`}
                className="flex items-center justify-between rounded-lg border border-border bg-card px-4 py-3 transition-all duration-150 hover:bg-accent hover:shadow-sm"
              >
                <div className="min-w-0 flex-1">
                  <h3 className="truncate text-sm font-medium text-foreground">
                    {experiment.title}
                  </h3>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    Updated{' '}
                    {formatDistanceToNow(new Date(experiment.updatedAt), { addSuffix: true })}
                  </p>
                </div>
                <div className="ml-4 flex items-center gap-2">
                  {outcome && (
                    <Badge variant={OUTCOME_VARIANTS[outcome]} className="capitalize text-xs font-medium">
                      {outcome}
                    </Badge>
                  )}
                  {experiment.status && (
                    <Badge variant="outline" className="capitalize text-xs font-medium">
                      {experiment.status}
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
