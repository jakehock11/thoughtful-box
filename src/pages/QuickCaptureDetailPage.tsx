import { useEffect, useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Trash2, ArrowUpRight } from "lucide-react";
import { useProductContext } from "@/contexts/ProductContext";
import { useEntity, useUpdateEntity, useDeleteEntity, useCreateEntity } from "@/hooks/useEntities";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";
import { formatDistanceToNow } from "date-fns";
import type { QuickCapture, EntityType } from "@/lib/db";

export default function QuickCaptureDetailPage() {
  const { productId, id } = useParams<{ productId: string; id: string }>();
  const navigate = useNavigate();
  const { setCurrentProduct } = useProductContext();
  const { data: entity, isLoading } = useEntity(id);
  const updateEntity = useUpdateEntity();
  const deleteEntity = useDeleteEntity();
  const createEntity = useCreateEntity();
  const { toast } = useToast();

  const [body, setBody] = useState("");

  useEffect(() => {
    if (productId) setCurrentProduct(productId);
  }, [productId, setCurrentProduct]);

  useEffect(() => {
    if (entity && entity.type === "quick_capture") {
      setBody(entity.body);
    }
  }, [entity]);

  const handleSave = useCallback(async () => {
    if (!entity || entity.type !== "quick_capture") return;
    try {
      await updateEntity.mutateAsync({
        ...entity,
        title: body.slice(0, 100),
        body,
      } as QuickCapture);
    } catch {
      toast({ title: "Error", description: "Failed to save.", variant: "destructive" });
    }
  }, [entity, body, updateEntity, toast]);

  useEffect(() => {
    if (!entity) return;
    const timeout = setTimeout(handleSave, 1000);
    return () => clearTimeout(timeout);
  }, [body]);

  const handleDelete = async () => {
    if (!id) return;
    try {
      await deleteEntity.mutateAsync(id);
      toast({ title: "Deleted" });
      navigate(`/product/${productId}/home`);
    } catch {
      toast({ title: "Error", variant: "destructive" });
    }
  };

  const handlePromoteTo = async (type: "problem" | "hypothesis" | "experiment" | "decision" | "artifact") => {
    if (!productId || !entity) return;

    try {
      const newEntity = await createEntity.mutateAsync({
        type,
        productId,
        title: entity.title,
        body: entity.body,
        ...(type === "artifact" ? { artifactType: "note" as const } : {}),
      });

      // Update quick capture with promoted ID
      await updateEntity.mutateAsync({
        ...entity,
        promotedToId: newEntity.id,
      } as QuickCapture);

      toast({ title: "Promoted", description: `Converted to ${type}.` });

      const pathMap: Record<string, string> = {
        problem: "problems",
        hypothesis: "hypotheses",
        experiment: "experiments",
        decision: "decisions",
        artifact: "artifacts",
      };
      navigate(`/product/${productId}/${pathMap[type]}/${newEntity.id}`);
    } catch {
      toast({ title: "Error", variant: "destructive" });
    }
  };

  if (isLoading) {
    return (
      <div className="p-8">
        <Skeleton className="mb-4 h-8 w-24" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (!entity || entity.type !== "quick_capture") {
    return <div className="p-8">Capture not found</div>;
  }

  const capture = entity as QuickCapture;

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between border-b border-border px-8 py-4">
        <Button variant="ghost" size="sm" onClick={() => navigate(`/product/${productId}/home`)}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Home
        </Button>
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">
            Captured {formatDistanceToNow(new Date(entity.createdAt), { addSuffix: true })}
          </span>

          {!capture.promotedToId && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm">
                  <ArrowUpRight className="mr-2 h-4 w-4" />
                  Promote to...
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem onClick={() => handlePromoteTo("problem")}>
                  Problem
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handlePromoteTo("hypothesis")}>
                  Hypothesis
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handlePromoteTo("experiment")}>
                  Experiment
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handlePromoteTo("decision")}>
                  Decision
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handlePromoteTo("artifact")}>
                  Artifact
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}

          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="ghost" size="icon">
                <Trash2 className="h-4 w-4 text-destructive" />
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete capture?</AlertDialogTitle>
                <AlertDialogDescription>This action cannot be undone.</AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleDelete}>Delete</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-8">
        <div className="mx-auto max-w-3xl">
          {capture.promotedToId && (
            <div className="mb-4 rounded-lg border border-border bg-muted/50 p-3 text-sm text-muted-foreground">
              This capture has been promoted to another entity.
            </div>
          )}

          <Textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="Your captured thought..."
            className="min-h-[300px] resize-none border-none bg-transparent text-base shadow-none focus-visible:ring-0"
          />
        </div>
      </div>
    </div>
  );
}
