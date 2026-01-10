import { useMemo } from "react";
import { X, ChevronDown } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Checkbox } from "@/components/ui/checkbox";
import { useProduct } from "@/hooks/useProducts";
import type { Taxonomy, TaxonomyItem, TaxonomyDimension } from "@/lib/db";

interface ContextTagsPickerProps {
  productId: string;
  personaIds: string[];
  featureAreaIds: string[];
  dimensionValueIdsByDimension: Record<string, string[]>;
  onPersonasChange: (ids: string[]) => void;
  onFeatureAreasChange: (ids: string[]) => void;
  onDimensionValuesChange: (dimensionId: string, valueIds: string[]) => void;
}

export function ContextTagsPicker({
  productId,
  personaIds,
  featureAreaIds,
  dimensionValueIdsByDimension,
  onPersonasChange,
  onFeatureAreasChange,
  onDimensionValuesChange,
}: ContextTagsPickerProps) {
  const { data: product } = useProduct(productId);
  const taxonomy = product?.taxonomy;

  if (!taxonomy) {
    return null;
  }

  const activePersonas = taxonomy.personas.filter((p) => !p.isArchived);
  const activeFeatureAreas = taxonomy.featureAreas.filter((f) => !f.isArchived);
  const activeDimensions = taxonomy.dimensions.filter((d) => !d.isArchived);

  return (
    <div className="space-y-4">
      {/* Personas */}
      {activePersonas.length > 0 && (
        <TagSection
          label="Personas"
          items={activePersonas}
          selectedIds={personaIds}
          onChange={onPersonasChange}
        />
      )}

      {/* Feature Areas */}
      {activeFeatureAreas.length > 0 && (
        <TagSection
          label="Feature Areas"
          items={activeFeatureAreas}
          selectedIds={featureAreaIds}
          onChange={onFeatureAreasChange}
        />
      )}

      {/* Custom Dimensions */}
      {activeDimensions.map((dimension) => {
        const activeValues = dimension.values.filter((v) => !v.isArchived);
        if (activeValues.length === 0) return null;

        return (
          <TagSection
            key={dimension.id}
            label={dimension.name}
            items={activeValues}
            selectedIds={dimensionValueIdsByDimension[dimension.id] || []}
            onChange={(ids) => onDimensionValuesChange(dimension.id, ids)}
          />
        );
      })}

      {activePersonas.length === 0 && 
       activeFeatureAreas.length === 0 && 
       activeDimensions.length === 0 && (
        <p className="text-sm text-muted-foreground">
          No context tags defined. Add them in Manage Context.
        </p>
      )}
    </div>
  );
}

interface TagSectionProps {
  label: string;
  items: TaxonomyItem[];
  selectedIds: string[];
  onChange: (ids: string[]) => void;
}

function TagSection({ label, items, selectedIds, onChange }: TagSectionProps) {
  const selectedItems = useMemo(
    () => items.filter((item) => selectedIds.includes(item.id)),
    [items, selectedIds]
  );

  const toggleItem = (itemId: string) => {
    if (selectedIds.includes(itemId)) {
      onChange(selectedIds.filter((id) => id !== itemId));
    } else {
      onChange([...selectedIds, itemId]);
    }
  };

  const removeItem = (itemId: string) => {
    onChange(selectedIds.filter((id) => id !== itemId));
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium text-muted-foreground">{label}</label>
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="ghost" size="sm" className="h-7 gap-1 text-xs">
              Add
              <ChevronDown className="h-3 w-3" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-[200px] p-0" align="end">
            <Command>
              <CommandInput placeholder={`Search ${label.toLowerCase()}...`} />
              <CommandList>
                <CommandEmpty>No results found.</CommandEmpty>
                <CommandGroup>
                  {items.map((item) => (
                    <CommandItem
                      key={item.id}
                      onSelect={() => toggleItem(item.id)}
                      className="flex items-center gap-2"
                    >
                      <Checkbox checked={selectedIds.includes(item.id)} />
                      {item.name}
                    </CommandItem>
                  ))}
                </CommandGroup>
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>
      </div>

      {selectedItems.length > 0 ? (
        <div className="flex flex-wrap gap-1.5">
          {selectedItems.map((item) => (
            <Badge
              key={item.id}
              variant="secondary"
              className="gap-1 pr-1"
            >
              {item.name}
              <button
                onClick={() => removeItem(item.id)}
                className="ml-1 rounded-full p-0.5 hover:bg-muted-foreground/20"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
        </div>
      ) : (
        <p className="text-xs text-muted-foreground">None selected</p>
      )}
    </div>
  );
}
