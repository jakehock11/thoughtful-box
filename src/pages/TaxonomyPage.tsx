import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { Plus, Pencil, Archive, RotateCcw, Eye, EyeOff } from "lucide-react";
import { useProductContext } from "@/contexts/ProductContext";
import {
  useTaxonomy,
  useCreatePersona,
  useUpdatePersona,
  useArchivePersona,
  useUnarchivePersona,
  useCreateFeature,
  useUpdateFeature,
  useArchiveFeature,
  useUnarchiveFeature,
  useCreateDimension,
  useUpdateDimension,
  useArchiveDimension,
  useUnarchiveDimension,
  useCreateDimensionValue,
  useUpdateDimensionValue,
  useArchiveDimensionValue,
  useUnarchiveDimensionValue,
} from "@/hooks/useTaxonomy";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import type { Persona, Feature, Dimension, DimensionValue } from "@/lib/types";

type TaxonomyItemType = "persona" | "feature" | "dimension" | "dimensionValue";

interface EditingState {
  type: TaxonomyItemType;
  item?: Persona | Feature | Dimension | DimensionValue;
  dimensionId?: string;
  isNew: boolean;
}

interface ArchiveConfirmState {
  type: TaxonomyItemType;
  id: string;
  name: string;
  dimensionId?: string;
}

export default function TaxonomyPage() {
  const { productId } = useParams<{ productId: string }>();
  const { setCurrentProduct } = useProductContext();
  const { data: taxonomy, isLoading } = useTaxonomy(productId);
  const { toast } = useToast();

  // Mutations
  const createPersona = useCreatePersona();
  const updatePersona = useUpdatePersona();
  const archivePersona = useArchivePersona();
  const unarchivePersona = useUnarchivePersona();
  const createFeature = useCreateFeature();
  const updateFeature = useUpdateFeature();
  const archiveFeature = useArchiveFeature();
  const unarchiveFeature = useUnarchiveFeature();
  const createDimension = useCreateDimension();
  const updateDimension = useUpdateDimension();
  const archiveDimension = useArchiveDimension();
  const unarchiveDimension = useUnarchiveDimension();
  const createDimensionValue = useCreateDimensionValue();
  const updateDimensionValue = useUpdateDimensionValue();
  const archiveDimensionValue = useArchiveDimensionValue();
  const unarchiveDimensionValue = useUnarchiveDimensionValue();

  // UI States
  const [showArchived, setShowArchived] = useState(false);
  const [editingItem, setEditingItem] = useState<EditingState | null>(null);
  const [itemName, setItemName] = useState("");
  const [archiveConfirm, setArchiveConfirm] = useState<ArchiveConfirmState | null>(null);

  useEffect(() => {
    if (productId) setCurrentProduct(productId);
  }, [productId, setCurrentProduct]);

  const handleSaveItem = async () => {
    if (!productId || !editingItem || !itemName.trim()) return;

    try {
      if (editingItem.type === "persona") {
        if (editingItem.isNew) {
          await createPersona.mutateAsync({ productId, name: itemName.trim() });
        } else if (editingItem.item) {
          await updatePersona.mutateAsync({
            id: editingItem.item.id,
            data: { name: itemName.trim() },
            productId,
          });
        }
      } else if (editingItem.type === "feature") {
        if (editingItem.isNew) {
          await createFeature.mutateAsync({ productId, name: itemName.trim() });
        } else if (editingItem.item) {
          await updateFeature.mutateAsync({
            id: editingItem.item.id,
            data: { name: itemName.trim() },
            productId,
          });
        }
      } else if (editingItem.type === "dimension") {
        if (editingItem.isNew) {
          await createDimension.mutateAsync({ productId, name: itemName.trim() });
        } else if (editingItem.item) {
          await updateDimension.mutateAsync({
            id: editingItem.item.id,
            data: { name: itemName.trim() },
            productId,
          });
        }
      } else if (editingItem.type === "dimensionValue" && editingItem.dimensionId) {
        if (editingItem.isNew) {
          await createDimensionValue.mutateAsync({
            dimensionId: editingItem.dimensionId,
            name: itemName.trim(),
            productId,
          });
        } else if (editingItem.item) {
          await updateDimensionValue.mutateAsync({
            id: editingItem.item.id,
            data: { name: itemName.trim() },
            productId,
          });
        }
      }

      toast({ title: "Saved", description: "Context updated successfully." });
      setEditingItem(null);
      setItemName("");
    } catch {
      toast({ title: "Error", description: "Failed to save.", variant: "destructive" });
    }
  };

  const handleArchiveItem = async () => {
    if (!productId || !archiveConfirm) return;

    try {
      if (archiveConfirm.type === "persona") {
        await archivePersona.mutateAsync({ id: archiveConfirm.id, productId });
      } else if (archiveConfirm.type === "feature") {
        await archiveFeature.mutateAsync({ id: archiveConfirm.id, productId });
      } else if (archiveConfirm.type === "dimension") {
        await archiveDimension.mutateAsync({ id: archiveConfirm.id, productId });
      } else if (archiveConfirm.type === "dimensionValue") {
        await archiveDimensionValue.mutateAsync({ id: archiveConfirm.id, productId });
      }

      toast({ title: "Archived", description: `"${archiveConfirm.name}" has been archived.` });
      setArchiveConfirm(null);
    } catch {
      toast({ title: "Error", description: "Failed to archive.", variant: "destructive" });
    }
  };

  const handleRestoreItem = async (
    type: TaxonomyItemType,
    id: string,
    name: string
  ) => {
    if (!productId) return;

    try {
      if (type === "persona") {
        await unarchivePersona.mutateAsync({ id, productId });
      } else if (type === "feature") {
        await unarchiveFeature.mutateAsync({ id, productId });
      } else if (type === "dimension") {
        await unarchiveDimension.mutateAsync({ id, productId });
      } else if (type === "dimensionValue") {
        await unarchiveDimensionValue.mutateAsync({ id, productId });
      }

      toast({ title: "Restored", description: `"${name}" has been restored.` });
    } catch {
      toast({ title: "Error", description: "Failed to restore.", variant: "destructive" });
    }
  };

  if (isLoading) {
    return (
      <div className="page-container">
        <Skeleton className="mb-6 h-8 w-48" />
        <div className="grid gap-4 lg:grid-cols-2">
          <Skeleton className="h-48 rounded-lg" />
          <Skeleton className="h-48 rounded-lg" />
        </div>
      </div>
    );
  }

  if (!taxonomy) {
    return (
      <div className="page-container flex items-center justify-center py-16">
        <p className="text-sm text-muted-foreground">Product not found</p>
      </div>
    );
  }

  return (
    <div className="page-container scrollbar-thin">
      <div className="page-header">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-lg font-semibold text-foreground">Manage Context</h1>
            <p className="text-sm text-muted-foreground">
              Define personas, feature areas, and custom dimensions for tagging
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Switch
              id="show-archived"
              checked={showArchived}
              onCheckedChange={setShowArchived}
            />
            <Label htmlFor="show-archived" className="text-sm text-muted-foreground cursor-pointer">
              {showArchived ? (
                <span className="flex items-center gap-1.5">
                  <Eye className="h-3.5 w-3.5" /> Show archived
                </span>
              ) : (
                <span className="flex items-center gap-1.5">
                  <EyeOff className="h-3.5 w-3.5" /> Hide archived
                </span>
              )}
            </Label>
          </div>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {/* Personas */}
        <TaxonomyCard
          title="Personas"
          description="User types or customer segments"
          items={taxonomy.personas}
          showArchived={showArchived}
          onAdd={() => {
            setEditingItem({ type: "persona", isNew: true });
            setItemName("");
          }}
          onEdit={(item) => {
            setEditingItem({ type: "persona", item, isNew: false });
            setItemName(item.name);
          }}
          onArchive={(item) => setArchiveConfirm({ type: "persona", id: item.id, name: item.name })}
          onRestore={(item) => handleRestoreItem("persona", item.id, item.name)}
        />

        {/* Feature Areas */}
        <TaxonomyCard
          title="Feature Areas"
          description="Product features or modules"
          items={taxonomy.features}
          showArchived={showArchived}
          onAdd={() => {
            setEditingItem({ type: "feature", isNew: true });
            setItemName("");
          }}
          onEdit={(item) => {
            setEditingItem({ type: "feature", item, isNew: false });
            setItemName(item.name);
          }}
          onArchive={(item) => setArchiveConfirm({ type: "feature", id: item.id, name: item.name })}
          onRestore={(item) => handleRestoreItem("feature", item.id, item.name)}
        />

        {/* Custom Dimensions */}
        {taxonomy.dimensions
          .filter((d) => showArchived || !d.isArchived)
          .map((dimension) => (
            <DimensionCard
              key={dimension.id}
              dimension={dimension}
              showArchived={showArchived}
              onEditDimension={() => {
                setEditingItem({ type: "dimension", item: dimension, isNew: false });
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
              onArchiveDimension={() =>
                setArchiveConfirm({ type: "dimension", id: dimension.id, name: dimension.name })
              }
              onRestoreDimension={() => handleRestoreItem("dimension", dimension.id, dimension.name)}
              onArchiveValue={(item) =>
                setArchiveConfirm({
                  type: "dimensionValue",
                  id: item.id,
                  name: item.name,
                  dimensionId: dimension.id,
                })
              }
              onRestoreValue={(item) => handleRestoreItem("dimensionValue", item.id, item.name)}
            />
          ))}

        {/* Add Dimension */}
        <Card
          className="flex cursor-pointer items-center justify-center border-dashed border-border/50 shadow-xs transition-all hover:border-primary/40 hover:bg-muted/30 hover:shadow-sm"
          onClick={() => {
            setEditingItem({ type: "dimension", isNew: true });
            setItemName("");
          }}
        >
          <CardContent className="flex flex-col items-center py-10 text-muted-foreground">
            <Plus className="mb-2 h-6 w-6" />
            <p className="text-sm font-medium">Add Custom Dimension</p>
            <p className="text-xs">e.g., Sport, Platform, Market</p>
          </CardContent>
        </Card>
      </div>

      {/* Edit Modal */}
      <Dialog open={!!editingItem} onOpenChange={(open) => !open && setEditingItem(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-base font-semibold">
              {editingItem?.isNew ? "Add" : "Edit"}{" "}
              {editingItem?.type === "dimensionValue"
                ? "Value"
                : editingItem?.type === "feature"
                ? "Feature Area"
                : editingItem?.type?.charAt(0).toUpperCase() + editingItem?.type?.slice(1)}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label className="text-sm">Name</Label>
              <Input
                value={itemName}
                onChange={(e) => setItemName(e.target.value)}
                placeholder="Enter name..."
                className="h-9"
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === "Enter" && itemName.trim()) {
                    handleSaveItem();
                  }
                }}
              />
            </div>
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" size="sm" onClick={() => setEditingItem(null)}>
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={handleSaveItem}
              disabled={
                !itemName.trim() ||
                createPersona.isPending ||
                updatePersona.isPending ||
                createFeature.isPending ||
                updateFeature.isPending ||
                createDimension.isPending ||
                updateDimension.isPending ||
                createDimensionValue.isPending ||
                updateDimensionValue.isPending
              }
            >
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Archive Confirmation Dialog */}
      <AlertDialog open={!!archiveConfirm} onOpenChange={(open) => !open && setArchiveConfirm(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Archive "{archiveConfirm?.name}"?</AlertDialogTitle>
            <AlertDialogDescription>
              This item will be hidden from tag pickers but will remain on existing entities.
              You can restore it later.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleArchiveItem}>Archive</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

// ============================================
// Taxonomy Card Component
// ============================================

interface TaxonomyCardProps {
  title: string;
  description: string;
  items: (Persona | Feature)[];
  showArchived: boolean;
  onAdd: () => void;
  onEdit: (item: Persona | Feature) => void;
  onArchive: (item: Persona | Feature) => void;
  onRestore: (item: Persona | Feature) => void;
}

function TaxonomyCard({
  title,
  description,
  items,
  showArchived,
  onAdd,
  onEdit,
  onArchive,
  onRestore,
}: TaxonomyCardProps) {
  const activeItems = items.filter((i) => !i.isArchived);
  const archivedItems = items.filter((i) => i.isArchived);

  return (
    <Card className="border-border/50 shadow-xs">
      <CardHeader className="flex flex-row items-center justify-between pb-3">
        <div>
          <CardTitle className="text-sm font-medium">{title}</CardTitle>
          <CardDescription className="text-xs">{description}</CardDescription>
        </div>
        <Button size="sm" variant="outline" className="h-7 gap-1 px-2 text-xs" onClick={onAdd}>
          <Plus className="h-3.5 w-3.5" />
          Add
        </Button>
      </CardHeader>
      <CardContent className="pt-0">
        {activeItems.length === 0 && (!showArchived || archivedItems.length === 0) ? (
          <p className="py-4 text-center text-xs text-muted-foreground">No items yet.</p>
        ) : (
          <div className="space-y-0.5">
            {activeItems.map((item) => (
              <TaxonomyItemRow
                key={item.id}
                name={item.name}
                onEdit={() => onEdit(item)}
                onArchive={() => onArchive(item)}
              />
            ))}
            {showArchived && archivedItems.length > 0 && (
              <div className="mt-3 border-t border-border/50 pt-3">
                <p className="mb-2 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                  Archived
                </p>
                {archivedItems.map((item) => (
                  <TaxonomyItemRow
                    key={item.id}
                    name={item.name}
                    isArchived
                    onEdit={() => onEdit(item)}
                    onRestore={() => onRestore(item)}
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

// ============================================
// Dimension Card Component
// ============================================

interface DimensionCardProps {
  dimension: Dimension;
  showArchived: boolean;
  onEditDimension: () => void;
  onAddValue: () => void;
  onEditValue: (item: DimensionValue) => void;
  onArchiveDimension: () => void;
  onRestoreDimension: () => void;
  onArchiveValue: (item: DimensionValue) => void;
  onRestoreValue: (item: DimensionValue) => void;
}

function DimensionCard({
  dimension,
  showArchived,
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
      <Card className="border-border/50 opacity-60 shadow-xs">
        <CardHeader className="flex flex-row items-center justify-between pb-3">
          <div>
            <CardTitle className="text-sm font-medium">{dimension.name}</CardTitle>
            <Badge variant="secondary" className="mt-1.5 h-5 text-[10px]">
              Archived
            </Badge>
          </div>
          <Button size="icon" variant="ghost" className="h-7 w-7" onClick={onRestoreDimension}>
            <RotateCcw className="h-3.5 w-3.5" />
          </Button>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card className="border-border/50 shadow-xs">
      <CardHeader className="flex flex-row items-center justify-between pb-3">
        <div className="flex items-center gap-1.5">
          <CardTitle className="text-sm font-medium">{dimension.name}</CardTitle>
          <Button size="icon" variant="ghost" className="h-6 w-6" onClick={onEditDimension}>
            <Pencil className="h-3 w-3" />
          </Button>
        </div>
        <div className="flex items-center gap-1">
          <Button size="sm" variant="outline" className="h-7 gap-1 px-2 text-xs" onClick={onAddValue}>
            <Plus className="h-3.5 w-3.5" />
            Add Value
          </Button>
          <Button size="icon" variant="ghost" className="h-7 w-7" onClick={onArchiveDimension}>
            <Archive className="h-3.5 w-3.5" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        {activeValues.length === 0 && (!showArchived || archivedValues.length === 0) ? (
          <p className="py-4 text-center text-xs text-muted-foreground">No values yet.</p>
        ) : (
          <div className="space-y-0.5">
            {activeValues.map((item) => (
              <TaxonomyItemRow
                key={item.id}
                name={item.name}
                onEdit={() => onEditValue(item)}
                onArchive={() => onArchiveValue(item)}
              />
            ))}
            {showArchived && archivedValues.length > 0 && (
              <div className="mt-3 border-t border-border/50 pt-3">
                <p className="mb-2 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                  Archived
                </p>
                {archivedValues.map((item) => (
                  <TaxonomyItemRow
                    key={item.id}
                    name={item.name}
                    isArchived
                    onEdit={() => onEditValue(item)}
                    onRestore={() => onRestoreValue(item)}
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

// ============================================
// Taxonomy Item Row Component
// ============================================

interface TaxonomyItemRowProps {
  name: string;
  isArchived?: boolean;
  onEdit: () => void;
  onArchive?: () => void;
  onRestore?: () => void;
}

function TaxonomyItemRow({ name, isArchived, onEdit, onArchive, onRestore }: TaxonomyItemRowProps) {
  return (
    <div className="group flex items-center justify-between rounded-md px-2 py-1.5 transition-colors hover:bg-muted/50">
      <span className={`text-sm ${isArchived ? "text-muted-foreground" : ""}`}>{name}</span>
      <div className="flex items-center gap-0.5 opacity-0 transition-opacity group-hover:opacity-100">
        <Button size="icon" variant="ghost" className="h-6 w-6" onClick={onEdit}>
          <Pencil className="h-3 w-3" />
        </Button>
        {isArchived ? (
          <Button size="icon" variant="ghost" className="h-6 w-6" onClick={onRestore}>
            <RotateCcw className="h-3 w-3" />
          </Button>
        ) : (
          <Button size="icon" variant="ghost" className="h-6 w-6" onClick={onArchive}>
            <Archive className="h-3 w-3" />
          </Button>
        )}
      </div>
    </div>
  );
}
