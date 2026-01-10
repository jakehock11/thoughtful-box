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
    <div className="flex h-full w-16 flex-col items-center border-r border-sidebar-border bg-sidebar py-4">
      {/* App Icon */}
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            onClick={handleAppIconClick}
            className={cn(
              "mb-4 flex h-9 w-9 items-center justify-center rounded-lg transition-all duration-150",
              "bg-primary text-primary-foreground shadow-sm hover:shadow-md hover:scale-[1.02]",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-sidebar"
            )}
          >
            <Layers className="h-4.5 w-4.5" />
          </button>
        </TooltipTrigger>
        <TooltipContent side="right" sideOffset={8}>Products Home</TooltipContent>
      </Tooltip>

      {/* Divider */}
      <div className="mb-4 h-px w-8 bg-sidebar-border" />

      {/* Product List */}
      <div className="flex flex-1 flex-col items-center gap-2.5 overflow-y-auto scrollbar-thin px-1">
        {isLoading ? (
          <>
            <Skeleton className="h-9 w-9 rounded-lg" />
            <Skeleton className="h-9 w-9 rounded-lg" />
          </>
        ) : (
          products?.map((product) => (
            <Tooltip key={product.id}>
              <TooltipTrigger asChild>
                <button
                  onClick={() => enterProduct(product.id)}
                  className={cn(
                    "flex h-9 w-9 items-center justify-center rounded-lg text-xs font-semibold transition-all duration-150",
                    "hover:bg-sidebar-accent hover:scale-[1.02]",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 focus-visible:ring-offset-sidebar",
                    currentProductId === product.id
                      ? "bg-sidebar-accent text-sidebar-accent-foreground ring-2 ring-primary/30"
                      : "bg-secondary text-muted-foreground"
                  )}
                >
                  {product.icon?.type === "image" && product.icon.data ? (
                    <img
                      src={product.icon.data}
                      alt={product.name}
                      className="h-full w-full rounded-lg object-cover"
                    />
                  ) : (
                    <span className="uppercase tracking-tight">
                      {product.name.slice(0, 2)}
                    </span>
                  )}
                </button>
              </TooltipTrigger>
              <TooltipContent side="right" sideOffset={8}>{product.name}</TooltipContent>
            </Tooltip>
          ))
        )}
      </div>

      {/* Create Product Button */}
      <div className="mt-4 flex flex-col items-center gap-3 border-t border-sidebar-border pt-4">
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleCreateProduct}
              className="h-9 w-9 rounded-lg text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-all duration-150"
            >
              <Plus className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="right" sideOffset={8}>Create Product</TooltipContent>
        </Tooltip>

        {/* Theme Toggle */}
        <ThemeToggle />
      </div>
    </div>
  );
}
