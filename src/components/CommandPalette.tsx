import { useEffect, useState, useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  AlertCircle,
  Lightbulb,
  FlaskConical,
  CheckCircle,
  Paperclip,
  Zap,
  Box,
} from "lucide-react";
import {
  CommandDialog,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
} from "@/components/ui/command";
import { Badge } from "@/components/ui/badge";
import { useProductContext } from "@/contexts/ProductContext";
import { useProducts } from "@/hooks/useProducts";
import { useEntities } from "@/hooks/useEntities";
import type { Entity, EntityType, Product } from "@/lib/types";

const TYPE_CONFIG: Partial<Record<EntityType, { icon: React.ElementType; label: string; route: string }>> = {
  problem: { icon: AlertCircle, label: "Problem", route: "problems" },
  hypothesis: { icon: Lightbulb, label: "Hypothesis", route: "hypotheses" },
  experiment: { icon: FlaskConical, label: "Experiment", route: "experiments" },
  decision: { icon: CheckCircle, label: "Decision", route: "decisions" },
  artifact: { icon: Paperclip, label: "Artifact", route: "artifacts" },
  capture: { icon: Zap, label: "Capture", route: "captures" },
  feedback: { icon: Box, label: "Feedback", route: "feedback" },
  feature_request: { icon: Box, label: "Request", route: "feature-requests" },
  feature: { icon: Box, label: "Feature", route: "features" },
};

const STATUS_COLORS: Record<string, string> = {
  active: "bg-green-500/10 text-green-600 border-green-500/20",
  draft: "bg-gray-500/10 text-gray-600 border-gray-500/20",
  running: "bg-blue-500/10 text-blue-600 border-blue-500/20",
  planned: "bg-yellow-500/10 text-yellow-600 border-yellow-500/20",
  complete: "bg-green-500/10 text-green-600 border-green-500/20",
  solved: "bg-green-500/10 text-green-600 border-green-500/20",
  exploring: "bg-purple-500/10 text-purple-600 border-purple-500/20",
  blocked: "bg-red-500/10 text-red-600 border-red-500/20",
  invalidated: "bg-red-500/10 text-red-600 border-red-500/20",
  archived: "bg-gray-500/10 text-gray-500 border-gray-500/20",
  paused: "bg-orange-500/10 text-orange-600 border-orange-500/20",
  final: "bg-green-500/10 text-green-600 border-green-500/20",
};

export function CommandPalette() {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const navigate = useNavigate();
  const { currentProductId } = useProductContext();
  const { data: products } = useProducts();
  const { data: entities } = useEntities(currentProductId || undefined);

  // Handle keyboard shortcut (Cmd/Ctrl + K)
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((open) => !open);
      }
    };

    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  // Reset search when closing
  useEffect(() => {
    if (!open) {
      setSearch("");
    }
  }, [open]);

  // Filter products
  const filteredProducts = useMemo(() => {
    if (!products || !search.trim()) return [];
    const searchLower = search.toLowerCase();
    return products.filter((p) =>
      p.name.toLowerCase().includes(searchLower)
    ).slice(0, 5);
  }, [products, search]);

  // Filter and group entities
  const groupedEntities = useMemo(() => {
    if (!entities || !search.trim()) return {};
    const searchLower = search.toLowerCase();

    const filtered = entities.filter((e) => {
      const matchesTitle = e.title.toLowerCase().includes(searchLower);
      const matchesBody = e.body.toLowerCase().includes(searchLower);
      return matchesTitle || matchesBody;
    });

    // Group by type
    const grouped: Record<EntityType, Entity[]> = {} as Record<EntityType, Entity[]>;
    for (const entity of filtered.slice(0, 20)) {
      if (!grouped[entity.type]) {
        grouped[entity.type] = [];
      }
      grouped[entity.type].push(entity);
    }

    return grouped;
  }, [entities, search]);

  const handleSelectProduct = useCallback((product: Product) => {
    setOpen(false);
    navigate(`/product/${product.id}/home`);
  }, [navigate]);

  const handleSelectEntity = useCallback((entity: Entity) => {
    if (!currentProductId) return;
    setOpen(false);
    const config = TYPE_CONFIG[entity.type];
    navigate(`/product/${currentProductId}/${config.route}/${entity.id}`);
  }, [navigate, currentProductId]);

  const hasResults = filteredProducts.length > 0 || Object.keys(groupedEntities).length > 0;

  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <CommandInput
        placeholder="Search products and entities..."
        value={search}
        onValueChange={setSearch}
      />
      <CommandList>
        {!search.trim() && (
          <CommandEmpty className="py-6 text-center text-sm text-muted-foreground">
            Type to search products and entities...
          </CommandEmpty>
        )}

        {search.trim() && !hasResults && (
          <CommandEmpty>No results found.</CommandEmpty>
        )}

        {/* Products */}
        {filteredProducts.length > 0 && (
          <CommandGroup heading="Products">
            {filteredProducts.map((product) => (
              <CommandItem
                key={product.id}
                value={`product-${product.id}`}
                onSelect={() => handleSelectProduct(product)}
                className="flex items-center gap-2"
              >
                <Box className="h-4 w-4 text-muted-foreground" />
                <span className="flex-1 truncate">{product.name}</span>
              </CommandItem>
            ))}
          </CommandGroup>
        )}

        {/* Entities grouped by type */}
        {Object.entries(groupedEntities).map(([type, items]) => {
          const config = TYPE_CONFIG[type as EntityType];
          if (!config) return null;
          const Icon = config.icon;
          const entityItems = items as Entity[];
          return (
            <CommandGroup key={type} heading={`${config.label}s`}>
              {entityItems.map((entity) => (
                <CommandItem
                  key={entity.id}
                  value={`entity-${entity.id}`}
                  onSelect={() => handleSelectEntity(entity)}
                  className="flex items-center gap-2"
                >
                  <Icon className="h-4 w-4 text-muted-foreground shrink-0" />
                  <span className="flex-1 truncate">
                    {entity.title || "Untitled"}
                  </span>
                  {entity.status && (
                    <Badge
                      variant="outline"
                      className={`shrink-0 text-[10px] px-1.5 py-0 ${STATUS_COLORS[entity.status] || ""}`}
                    >
                      {entity.status}
                    </Badge>
                  )}
                </CommandItem>
              ))}
            </CommandGroup>
          );
        })}
      </CommandList>
    </CommandDialog>
  );
}
