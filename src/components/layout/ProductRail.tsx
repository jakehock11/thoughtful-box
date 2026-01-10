import { useNavigate } from "react-router-dom";
import { Plus, Layers } from "lucide-react";
import { useProducts } from "@/hooks/useProducts";
import { useProductContext } from "@/contexts/ProductContext";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { ThemeToggle } from "@/components/theme";
import { Skeleton } from "@/components/ui/skeleton";

export function ProductRail() {
  const navigate = useNavigate();
  const { data: products, isLoading } = useProducts();
  const { currentProductId, enterProduct, exitProduct } = useProductContext();

  const handleAppIconClick = () => {
    exitProduct();
    navigate("/products");
  };

  const handleCreateProduct = () => {
    navigate("/products", { state: { openCreate: true } });
  };

  return (
    <div className="flex h-full w-16 flex-col items-center border-r border-border bg-sidebar py-3">
      {/* App Icon */}
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            onClick={handleAppIconClick}
            className={cn(
              "mb-4 flex h-10 w-10 items-center justify-center rounded-lg transition-all",
              "bg-primary text-primary-foreground hover:opacity-90",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            )}
          >
            <Layers className="h-5 w-5" />
          </button>
        </TooltipTrigger>
        <TooltipContent side="right">Products Home</TooltipContent>
      </Tooltip>

      {/* Divider */}
      <div className="mb-3 h-px w-8 bg-border" />

      {/* Product List */}
      <div className="flex flex-1 flex-col items-center gap-2 overflow-y-auto">
        {isLoading ? (
          <>
            <Skeleton className="h-10 w-10 rounded-lg" />
            <Skeleton className="h-10 w-10 rounded-lg" />
          </>
        ) : (
          products?.map((product) => (
            <Tooltip key={product.id}>
              <TooltipTrigger asChild>
                <button
                  onClick={() => enterProduct(product.id)}
                  className={cn(
                    "flex h-10 w-10 items-center justify-center rounded-lg text-xs font-semibold transition-all",
                    "hover:bg-sidebar-accent",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                    currentProductId === product.id
                      ? "bg-sidebar-accent text-sidebar-accent-foreground ring-2 ring-sidebar-ring"
                      : "bg-muted text-muted-foreground"
                  )}
                >
                  {product.icon?.type === "image" && product.icon.data ? (
                    <img
                      src={product.icon.data}
                      alt={product.name}
                      className="h-full w-full rounded-lg object-cover"
                    />
                  ) : (
                    <span className="uppercase">
                      {product.name.slice(0, 2)}
                    </span>
                  )}
                </button>
              </TooltipTrigger>
              <TooltipContent side="right">{product.name}</TooltipContent>
            </Tooltip>
          ))
        )}
      </div>

      {/* Create Product Button */}
      <div className="mt-3 flex flex-col items-center gap-2">
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleCreateProduct}
              className="h-10 w-10 rounded-lg hover:bg-sidebar-accent"
            >
              <Plus className="h-5 w-5" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="right">Create Product</TooltipContent>
        </Tooltip>

        {/* Theme Toggle */}
        <ThemeToggle />
      </div>
    </div>
  );
}
