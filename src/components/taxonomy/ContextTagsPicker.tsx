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
import { useActiveTaxonomy } from "@/hooks/useTaxonomy";
import type { Persona, Feature, DimensionValue } from "@/lib/types";

interface ContextTagsPickerProps {
  productId: string;
  personaIds: string[];
  featureIds: string[];
  dimensionValueIds: string[];
  onPersonasChange: (ids: string[]) => void;
  onFeaturesChange: (ids: string[]) => void;
  onDimensionValueIdsChange: (ids: string[]) => void;
}

export function ContextTagsPicker({
  productId,
  personaIds,
  featureIds,
  dimensionValueIds,
  onPersonasChange,
  onFeaturesChange,
  onDimensionValueIdsChange,
}: ContextTagsPickerProps) {
  const { data: taxonomy } = useActiveTaxonomy(productId);

  if (!taxonomy) {
    return null;
  }

  const activePersonas = taxonomy.personas;
  const activeFeatures = taxonomy.features;
  const activeDimensions = taxonomy.dimensions;

  // Helper to toggle a dimension value in the flat array
  const toggleDimensionValue = (valueId: string) => {
    if (dimensionValueIds.includes(valueId)) {
      onDimensionValueIdsChange(dimensionValueIds.filter((id) => id !== valueId));
    } else {
      onDimensionValueIdsChange([...dimensionValueIds, valueId]);
    }
  };

  // Helper to remove a dimension value from the flat array
  const removeDimensionValue = (valueId: string) => {
    onDimensionValueIdsChange(dimensionValueIds.filter((id) => id !== valueId));
  };

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

      {/* Features */}
      {activeFeatures.length > 0 && (
        <TagSection
          label="Features"
          items={activeFeatures}
          selectedIds={featureIds}
          onChange={onFeaturesChange}
        />
      )}

      {/* Custom Dimensions */}
      {activeDimensions.map((dimension) => {
        const activeValues = dimension.values;
        if (activeValues.length === 0) return null;

        // Get selected values for this dimension
        const selectedValueIds = dimensionValueIds.filter((id) =>
          activeValues.some((v) => v.id === id)
        );

        return (
          <DimensionTagSection
            key={dimension.id}
            label={dimension.name}
            items={activeValues}
            selectedIds={selectedValueIds}
            onToggle={toggleDimensionValue}
            onRemove={removeDimensionValue}
          />
        );
      })}

      {activePersonas.length === 0 &&
       activeFeatures.length === 0 &&
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
  items: (Persona | Feature)[];
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

interface DimensionTagSectionProps {
  label: string;
  items: DimensionValue[];
  selectedIds: string[];
  onToggle: (id: string) => void;
  onRemove: (id: string) => void;
}

function DimensionTagSection({
  label,
  items,
  selectedIds,
  onToggle,
  onRemove,
}: DimensionTagSectionProps) {
  const selectedItems = useMemo(
    () => items.filter((item) => selectedIds.includes(item.id)),
    [items, selectedIds]
  );

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
                      onSelect={() => onToggle(item.id)}
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
                onClick={() => onRemove(item.id)}
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
