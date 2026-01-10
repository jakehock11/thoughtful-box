import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { Plus, Pencil, Archive, RotateCcw, Trash2 } from "lucide-react";
import { useProductContext } from "@/contexts/ProductContext";
import { useProduct, useUpdateProduct } from "@/hooks/useProducts";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { generateId } from "@/lib/db";
import type { TaxonomyItem, TaxonomyDimension, Product } from "@/lib/db";

export default function TaxonomyPage() {
  const { productId } = useParams<{ productId: string }>();
  const { setCurrentProduct } = useProductContext();
  const { data: product, isLoading } = useProduct(productId);
  const updateProduct = useUpdateProduct();
  const { toast } = useToast();

  useEffect(() => {
    if (productId) setCurrentProduct(productId);
  }, [productId, setCurrentProduct]);

  // Modal states
  const [editingItem, setEditingItem] = useState<{
    type: "persona" | "featureArea" | "dimension" | "dimensionValue";
    item?: TaxonomyItem;
    dimensionId?: string;
    isNew: boolean;
  } | null>(null);
  const [itemName, setItemName] = useState("");

  const handleSaveItem = async () => {
    if (!product || !editingItem || !itemName.trim()) return;

    const now = new Date().toISOString();
    const taxonomy = { ...product.taxonomy };

    if (editingItem.type === "persona") {
      if (editingItem.isNew) {
        taxonomy.personas = [
          ...taxonomy.personas,
          { id: generateId(), name: itemName.trim(), createdAt: now, updatedAt: now },
        ];
      } else if (editingItem.item) {
        taxonomy.personas = taxonomy.personas.map((p) =>
          p.id === editingItem.item!.id ? { ...p, name: itemName.trim(), updatedAt: now } : p
        );
      }
    } else if (editingItem.type === "featureArea") {
      if (editingItem.isNew) {
        taxonomy.featureAreas = [
          ...taxonomy.featureAreas,
          { id: generateId(), name: itemName.trim(), createdAt: now, updatedAt: now },
        ];
      } else if (editingItem.item) {
        taxonomy.featureAreas = taxonomy.featureAreas.map((f) =>
          f.id === editingItem.item!.id ? { ...f, name: itemName.trim(), updatedAt: now } : f
        );
      }
    } else if (editingItem.type === "dimension") {
      if (editingItem.isNew) {
        taxonomy.dimensions = [
          ...taxonomy.dimensions,
          { id: generateId(), name: itemName.trim(), values: [], createdAt: now, updatedAt: now },
        ];
      } else if (editingItem.item) {
        taxonomy.dimensions = taxonomy.dimensions.map((d) =>
          d.id === editingItem.item!.id ? { ...d, name: itemName.trim(), updatedAt: now } : d
        );
      }
    } else if (editingItem.type === "dimensionValue" && editingItem.dimensionId) {
      taxonomy.dimensions = taxonomy.dimensions.map((d) => {
        if (d.id !== editingItem.dimensionId) return d;
        if (editingItem.isNew) {
          return {
            ...d,
            values: [
              ...d.values,
              { id: generateId(), name: itemName.trim(), createdAt: now, updatedAt: now },
            ],
            updatedAt: now,
          };
        } else if (editingItem.item) {
          return {
            ...d,
            values: d.values.map((v) =>
              v.id === editingItem.item!.id ? { ...v, name: itemName.trim(), updatedAt: now } : v
            ),
            updatedAt: now,
          };
        }
        return d;
      });
    }

    try {
      await updateProduct.mutateAsync({ ...product, taxonomy });
      toast({ title: "Saved", description: "Context updated successfully." });
      setEditingItem(null);
      setItemName("");
    } catch {
      toast({ title: "Error", description: "Failed to save.", variant: "destructive" });
    }
  };

  const handleArchiveItem = async (
    type: "persona" | "featureArea" | "dimension" | "dimensionValue",
    itemId: string,
    dimensionId?: string,
    restore = false
  ) => {
    if (!product) return;

    const taxonomy = { ...product.taxonomy };
    const now = new Date().toISOString();

    if (type === "persona") {
      taxonomy.personas = taxonomy.personas.map((p) =>
        p.id === itemId ? { ...p, isArchived: !restore, updatedAt: now } : p
      );
    } else if (type === "featureArea") {
      taxonomy.featureAreas = taxonomy.featureAreas.map((f) =>
        f.id === itemId ? { ...f, isArchived: !restore, updatedAt: now } : f
      );
    } else if (type === "dimension") {
      taxonomy.dimensions = taxonomy.dimensions.map((d) =>
        d.id === itemId ? { ...d, isArchived: !restore, updatedAt: now } : d
      );
    } else if (type === "dimensionValue" && dimensionId) {
      taxonomy.dimensions = taxonomy.dimensions.map((d) => {
        if (d.id !== dimensionId) return d;
        return {
          ...d,
          values: d.values.map((v) =>
            v.id === itemId ? { ...v, isArchived: !restore, updatedAt: now } : v
          ),
          updatedAt: now,
        };
      });
    }

    try {
      await updateProduct.mutateAsync({ ...product, taxonomy });
      toast({ title: restore ? "Restored" : "Archived" });
    } catch {
      toast({ title: "Error", variant: "destructive" });
    }
  };

  if (isLoading) {
    return (
      <div className="p-8">
        <Skeleton className="mb-8 h-10 w-48" />
        <div className="grid gap-6 lg:grid-cols-2">
          <Skeleton className="h-48" />
          <Skeleton className="h-48" />
        </div>
      </div>
    );
  }

  if (!product) {
    return <div className="p-8">Product not found</div>;
  }

  const { taxonomy } = product;

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold">Manage Context</h1>
        <p className="text-muted-foreground">
          Define personas, feature areas, and custom dimensions for tagging
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Personas */}
        <TaxonomyCard
          title="Personas"
          description="User types or customer segments"
          items={taxonomy.personas}
          onAdd={() => {
            setEditingItem({ type: "persona", isNew: true });
            setItemName("");
          }}
          onEdit={(item) => {
            setEditingItem({ type: "persona", item, isNew: false });
            setItemName(item.name);
          }}
          onArchive={(id) => handleArchiveItem("persona", id)}
          onRestore={(id) => handleArchiveItem("persona", id, undefined, true)}
        />

        {/* Feature Areas */}
        <TaxonomyCard
          title="Feature Areas"
          description="Product features or modules"
          items={taxonomy.featureAreas}
          onAdd={() => {
            setEditingItem({ type: "featureArea", isNew: true });
            setItemName("");
          }}
          onEdit={(item) => {
            setEditingItem({ type: "featureArea", item, isNew: false });
            setItemName(item.name);
          }}
          onArchive={(id) => handleArchiveItem("featureArea", id)}
          onRestore={(id) => handleArchiveItem("featureArea", id, undefined, true)}
        />

        {/* Custom Dimensions */}
        {taxonomy.dimensions.map((dimension) => (
          <DimensionCard
            key={dimension.id}
            dimension={dimension}
            onEditDimension={() => {
              setEditingItem({ type: "dimension", item: dimension as any, isNew: false });
              setItemName(dimension.name);
            }}
            onAddValue={() => {
              setEditingItem({ type: "dimensionValue", dimensionId: dimension.id, isNew: true });
              setItemName("");
            }}
            onEditValue={(item) => {
              setEditingItem({ type: "dimensionValue", item, dimensionId: dimension.id, isNew: false });
              setItemName(item.name);
            }}
            onArchiveDimension={() => handleArchiveItem("dimension", dimension.id)}
            onRestoreDimension={() => handleArchiveItem("dimension", dimension.id, undefined, true)}
            onArchiveValue={(id) => handleArchiveItem("dimensionValue", id, dimension.id)}
            onRestoreValue={(id) => handleArchiveItem("dimensionValue", id, dimension.id, true)}
          />
        ))}

        {/* Add Dimension */}
        <Card className="flex cursor-pointer items-center justify-center border-dashed hover:border-primary/50 hover:bg-muted/50"
          onClick={() => {
            setEditingItem({ type: "dimension", isNew: true });
            setItemName("");
          }}
        >
          <CardContent className="flex flex-col items-center py-8 text-muted-foreground">
            <Plus className="mb-2 h-8 w-8" />
            <p className="font-medium">Add Custom Dimension</p>
            <p className="text-sm">e.g., Sport, Platform, Market</p>
          </CardContent>
        </Card>
      </div>

      {/* Edit Modal */}
      <Dialog open={!!editingItem} onOpenChange={(open) => !open && setEditingItem(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingItem?.isNew ? "Add" : "Edit"}{" "}
              {editingItem?.type === "dimensionValue" ? "Value" : 
               editingItem?.type === "featureArea" ? "Feature Area" :
               editingItem?.type?.charAt(0).toUpperCase() + editingItem?.type?.slice(1)}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Name</Label>
              <Input
                value={itemName}
                onChange={(e) => setItemName(e.target.value)}
                placeholder="Enter name..."
                autoFocus
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingItem(null)}>
              Cancel
            </Button>
            <Button onClick={handleSaveItem} disabled={!itemName.trim()}>
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

interface TaxonomyCardProps {
  title: string;
  description: string;
  items: TaxonomyItem[];
  onAdd: () => void;
  onEdit: (item: TaxonomyItem) => void;
  onArchive: (id: string) => void;
  onRestore: (id: string) => void;
}

function TaxonomyCard({ title, description, items, onAdd, onEdit, onArchive, onRestore }: TaxonomyCardProps) {
  const activeItems = items.filter((i) => !i.isArchived);
  const archivedItems = items.filter((i) => i.isArchived);

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <div>
          <CardTitle className="text-base">{title}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </div>
        <Button size="sm" variant="outline" onClick={onAdd}>
          <Plus className="mr-1 h-4 w-4" />
          Add
        </Button>
      </CardHeader>
      <CardContent>
        {activeItems.length === 0 && archivedItems.length === 0 ? (
          <p className="text-sm text-muted-foreground">No items yet.</p>
        ) : (
          <div className="space-y-1">
            {activeItems.map((item) => (
              <TaxonomyItemRow
                key={item.id}
                item={item}
                onEdit={() => onEdit(item)}
                onArchive={() => onArchive(item.id)}
              />
            ))}
            {archivedItems.length > 0 && (
              <div className="mt-4 border-t pt-4">
                <p className="mb-2 text-xs font-medium text-muted-foreground">Archived</p>
                {archivedItems.map((item) => (
                  <TaxonomyItemRow
                    key={item.id}
                    item={item}
                    isArchived
                    onEdit={() => onEdit(item)}
                    onRestore={() => onRestore(item.id)}
                  />
                ))}
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

interface DimensionCardProps {
  dimension: TaxonomyDimension;
  onEditDimension: () => void;
  onAddValue: () => void;
  onEditValue: (item: TaxonomyItem) => void;
  onArchiveDimension: () => void;
  onRestoreDimension: () => void;
  onArchiveValue: (id: string) => void;
  onRestoreValue: (id: string) => void;
}

function DimensionCard({
  dimension,
  onEditDimension,
  onAddValue,
  onEditValue,
  onArchiveDimension,
  onRestoreDimension,
  onArchiveValue,
  onRestoreValue,
}: DimensionCardProps) {
  const activeValues = dimension.values.filter((v) => !v.isArchived);
  const archivedValues = dimension.values.filter((v) => v.isArchived);

  if (dimension.isArchived) {
    return (
      <Card className="opacity-60">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <div>
            <CardTitle className="text-base">{dimension.name}</CardTitle>
            <Badge variant="secondary" className="mt-1">Archived</Badge>
          </div>
          <Button size="sm" variant="ghost" onClick={onRestoreDimension}>
            <RotateCcw className="h-4 w-4" />
          </Button>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <div className="flex items-center gap-2">
          <CardTitle className="text-base">{dimension.name}</CardTitle>
          <Button size="icon" variant="ghost" className="h-6 w-6" onClick={onEditDimension}>
            <Pencil className="h-3 w-3" />
          </Button>
        </div>
        <div className="flex items-center gap-1">
          <Button size="sm" variant="outline" onClick={onAddValue}>
            <Plus className="mr-1 h-4 w-4" />
            Add Value
          </Button>
          <Button size="icon" variant="ghost" onClick={onArchiveDimension}>
            <Archive className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {activeValues.length === 0 && archivedValues.length === 0 ? (
          <p className="text-sm text-muted-foreground">No values yet.</p>
        ) : (
          <div className="space-y-1">
            {activeValues.map((item) => (
              <TaxonomyItemRow
                key={item.id}
                item={item}
                onEdit={() => onEditValue(item)}
                onArchive={() => onArchiveValue(item.id)}
              />
            ))}
            {archivedValues.length > 0 && (
              <div className="mt-4 border-t pt-4">
                <p className="mb-2 text-xs font-medium text-muted-foreground">Archived</p>
                {archivedValues.map((item) => (
                  <TaxonomyItemRow
                    key={item.id}
                    item={item}
                    isArchived
                    onEdit={() => onEditValue(item)}
                    onRestore={() => onRestoreValue(item.id)}
                  />
                ))}
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

interface TaxonomyItemRowProps {
  item: TaxonomyItem;
  isArchived?: boolean;
  onEdit: () => void;
  onArchive?: () => void;
  onRestore?: () => void;
}

function TaxonomyItemRow({ item, isArchived, onEdit, onArchive, onRestore }: TaxonomyItemRowProps) {
  return (
    <div className="group flex items-center justify-between rounded-md px-2 py-1.5 hover:bg-muted">
      <span className={isArchived ? "text-muted-foreground" : ""}>{item.name}</span>
      <div className="flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
        <Button size="icon" variant="ghost" className="h-7 w-7" onClick={onEdit}>
          <Pencil className="h-3 w-3" />
        </Button>
        {isArchived ? (
          <Button size="icon" variant="ghost" className="h-7 w-7" onClick={onRestore}>
            <RotateCcw className="h-3 w-3" />
          </Button>
        ) : (
          <Button size="icon" variant="ghost" className="h-7 w-7" onClick={onArchive}>
            <Archive className="h-3 w-3" />
          </Button>
        )}
      </div>
    </div>
  );
}
