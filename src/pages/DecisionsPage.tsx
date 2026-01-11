import { useEffect, useMemo, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Plus, Search } from 'lucide-react';
import { useProductContext } from '@/contexts/ProductContext';
import { useEntitiesByType, useCreateEntity } from '@/hooks/useEntities';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { formatDistanceToNow } from 'date-fns';
import type { Entity, DecisionType } from '@/lib/types';

export default function DecisionsPage() {
  const { productId } = useParams<{ productId: string }>();
  const { setCurrentProduct } = useProductContext();
  const navigate = useNavigate();
  const { toast } = useToast();

  const { data: decisions, isLoading } = useEntitiesByType(productId, 'decision');
  const createEntity = useCreateEntity();

  const [search, setSearch] = useState('');

  useEffect(() => {
    if (productId) setCurrentProduct(productId);
  }, [productId, setCurrentProduct]);

  const filteredDecisions = useMemo(() => {
    if (!decisions) return [];
    return decisions
      .filter((d) => {
        if (search && !d.title.toLowerCase().includes(search.toLowerCase())) return false;
        return true;
      })
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [decisions, search]);

  const handleCreate = async () => {
    if (!productId) return;
    try {
      const entity = await createEntity.mutateAsync({
        type: 'decision',
        productId,
        title: 'Untitled Decision',
      });
      navigate(`/product/${productId}/decisions/${entity.id}`);
    } catch {
      toast({
        title: 'Error',
        description: 'Failed to create decision',
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
          <h1 className="text-page-title">Decisions</h1>
          <p className="mt-1 text-meta">Document what was decided and why</p>
        </div>
        <Button onClick={handleCreate} size="sm" className="gap-2 shadow-sm">
          <Plus className="h-4 w-4" />
          New Decision
        </Button>
      </div>

      {/* Search */}
      <div className="mb-5">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground pointer-events-none" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search decisions..."
            className="pl-9 h-9"
          />
        </div>
      </div>

      {/* Content */}
      {filteredDecisions.length === 0 ? (
        <div className="flex flex-1 flex-col items-center justify-center text-center">
          <p className="mb-4 text-sm text-muted-foreground">
            {search ? 'No decisions match your search.' : 'No decisions recorded yet.'}
          </p>
          {!search && (
            <Button onClick={handleCreate} variant="outline" size="sm">
              Record your first decision
            </Button>
          )}
        </div>
      ) : (
        <div className="space-y-1.5">
          {filteredDecisions.map((decision) => {
            const decidedAt = decision.metadata?.decidedAt as string | undefined;
            const decisionType = decision.metadata?.decisionType as DecisionType | undefined;

            return (
              <Link
                key={decision.id}
                to={`/product/${productId}/decisions/${decision.id}`}
                className="flex items-center justify-between rounded-lg border border-border bg-card px-4 py-3 transition-all duration-150 hover:bg-accent hover:shadow-sm"
              >
                <div className="min-w-0 flex-1">
                  <h3 className="truncate text-sm font-medium text-foreground">{decision.title}</h3>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {decidedAt
                      ? `Decided ${formatDistanceToNow(new Date(decidedAt), { addSuffix: true })}`
                      : `Created ${formatDistanceToNow(new Date(decision.createdAt), { addSuffix: true })}`}
                  </p>
                </div>
                {decisionType && (
                  <Badge variant="secondary" className="ml-4 capitalize text-xs font-medium">
                    {decisionType}
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
