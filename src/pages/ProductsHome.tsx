import { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Plus, Layers } from "lucide-react";
import { useProducts } from "@/hooks/useProducts";
import { useProductContext } from "@/contexts/ProductContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { CreateProductModal } from "@/components/products/CreateProductModal";
import { formatDistanceToNow } from "date-fns";

export default function ProductsHome() {
  const location = useLocation();
  const navigate = useNavigate();
  const { data: products, isLoading } = useProducts();
  const { enterProduct } = useProductContext();
  const [createOpen, setCreateOpen] = useState(false);

  // Handle openCreate state from navigation
  useEffect(() => {
    if (location.state?.openCreate) {
      setCreateOpen(true);
      // Clear the state
      navigate(location.pathname, { replace: true, state: {} });
    }
  }, [location.state, navigate, location.pathname]);

  const hasProducts = products && products.length > 0;

  if (isLoading) {
    return (
      <div className="p-8">
        <Skeleton className="mb-8 h-10 w-48" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Skeleton className="h-40 rounded-lg" />
          <Skeleton className="h-40 rounded-lg" />
        </div>
      </div>
    );
  }

  return (
    <div className="page-container flex min-h-full flex-col">
      {hasProducts ? (
        <>
          {/* Header */}
          <div className="page-header page-header-row">
            <div>
              <h1 className="text-page-title">Products</h1>
              <p className="mt-1 text-meta">
                Select a product to manage its thinking system
              </p>
            </div>
            <Button onClick={() => setCreateOpen(true)} size="sm" className="gap-2 shadow-sm">
              <Plus className="h-4 w-4" />
              Create Product
            </Button>
          </div>

          {/* Product Grid */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {products.map((product) => (
              <Card
                key={product.id}
                className="cursor-pointer shadow-sm transition-all duration-150 hover:shadow-md hover:border-primary/25"
                onClick={() => enterProduct(product.id)}
              >
                <CardHeader className="pb-2 pt-4 px-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-secondary text-xs font-semibold uppercase text-secondary-foreground">
                      {product.icon?.type === "image" && product.icon.data ? (
                        <img
                          src={product.icon.data}
                          alt={product.name}
                          className="h-full w-full rounded-lg object-cover"
                        />
                      ) : (
                        <span className="tracking-tight">{product.name.slice(0, 2)}</span>
                      )}
                    </div>
                    <div className="flex-1 overflow-hidden">
                      <CardTitle className="truncate text-sm font-medium">
                        {product.name}
                      </CardTitle>
                      <CardDescription className="text-[11px] mt-0.5">
                        Last activity{" "}
                        {formatDistanceToNow(new Date(product.lastActivityAt), {
                          addSuffix: true,
                        })}
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="px-4 pb-4">
                  <div className="flex gap-4 text-[11px] text-muted-foreground">
                    <span>
                      {product.taxonomy.personas.filter((p) => !p.isArchived).length} personas
                    </span>
                    <span>
                      {product.taxonomy.featureAreas.filter((f) => !f.isArchived).length} features
                    </span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </>
      ) : (
        /* Empty State */
        <div className="flex flex-1 flex-col items-center justify-center text-center">
          <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10">
            <Layers className="h-8 w-8 text-primary" />
          </div>
          <h1 className="mb-2 text-xl font-semibold text-foreground">
            Create your first product
          </h1>
          <p className="mb-8 max-w-md text-sm text-muted-foreground">
            Product OS helps you capture and connect your product thinking—problems,
            hypotheses, experiments, and decisions—all in one place.
          </p>
          <Button onClick={() => setCreateOpen(true)} size="default" className="gap-2 shadow-sm">
            <Plus className="h-4 w-4" />
            Create Product
          </Button>
        </div>
      )}

      <CreateProductModal open={createOpen} onOpenChange={setCreateOpen} />
    </div>
  );
}
