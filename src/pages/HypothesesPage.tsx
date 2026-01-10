import { useEffect, useMemo, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { Plus, Search } from "lucide-react";
import { useProductContext } from "@/contexts/ProductContext";
import { useEntitiesByType, useCreateEntity } from "@/hooks/useEntities";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { formatDistanceToNow } from "date-fns";
import type { Hypothesis } from "@/lib/db";

export default function HypothesesPage() {
  const { productId } = useParams<{ productId: string }>();
  const { setCurrentProduct } = useProductContext();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const { data: hypotheses, isLoading } = useEntitiesByType(productId, "hypothesis");
  const createEntity = useCreateEntity();

  const [search, setSearch] = useState("");

  useEffect(() => {
    if (productId) setCurrentProduct(productId);
  }, [productId, setCurrentProduct]);

  const filteredHypotheses = useMemo(() => {
    if (!hypotheses) return [];
    return (hypotheses as Hypothesis[])
      .filter((h) => {
        if (search && !h.title.toLowerCase().includes(search.toLowerCase())) return false;
        return true;
      })
      .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
  }, [hypotheses, search]);

  const handleCreate = async () => {
    if (!productId) return;
    try {
      const entity = await createEntity.mutateAsync({
        type: "hypothesis",
        productId,
        title: "Untitled Hypothesis",
      });
      navigate(`/product/${productId}/hypotheses/${entity.id}`);
    } catch {
      toast({ title: "Error", description: "Failed to create hypothesis", variant: "destructive" });
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
          <h1 className="text-page-title">Hypotheses</h1>
          <p className="mt-1 text-meta">
            Beliefs about problems and potential solutions
          </p>
        </div>
        <Button onClick={handleCreate} size="sm" className="gap-2 shadow-sm">
          <Plus className="h-4 w-4" />
          New Hypothesis
        </Button>
      </div>

      {/* Search */}
      <div className="mb-5">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground pointer-events-none" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search hypotheses..."
            className="pl-9 h-9"
          />
        </div>
      </div>

      {/* Content */}
      {filteredHypotheses.length === 0 ? (
        <div className="flex flex-1 flex-col items-center justify-center text-center">
          <p className="mb-4 text-sm text-muted-foreground">
            {search
              ? "No hypotheses match your search."
              : "No hypotheses yet. Create one to start testing your beliefs."}
          </p>
          {!search && (
            <Button onClick={handleCreate} variant="outline" size="sm">
              Create your first hypothesis
            </Button>
          )}
        </div>
      ) : (
        <div className="space-y-1.5">
          {filteredHypotheses.map((hypothesis) => (
            <Link
              key={hypothesis.id}
              to={`/product/${productId}/hypotheses/${hypothesis.id}`}
              className="flex items-center justify-between rounded-lg border border-border bg-card px-4 py-3 transition-all duration-150 hover:bg-accent hover:shadow-sm"
            >
              <div className="min-w-0 flex-1">
                <h3 className="truncate text-sm font-medium text-foreground">{hypothesis.title}</h3>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  Updated {formatDistanceToNow(new Date(hypothesis.updatedAt), { addSuffix: true })}
                </p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
