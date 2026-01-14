import { useEffect, useState, useMemo } from "react";
import { useParams } from "react-router-dom";
import { Download, FileText, Clock, FolderOpen, Trash2, Copy, ClipboardCheck } from "lucide-react";
import { useProductContext } from "@/contexts/ProductContext";
import { useProduct } from "@/hooks/useProducts";
import {
  useExportHistory,
  useExportPreview,
  useExecuteExport,
  useClearExportHistory,
  useOpenExportFolder,
  useCopySnapshot,
} from "@/hooks/useExports";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
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
import { format, formatDistanceToNow } from "date-fns";
import type { ExportOptions, ExportMode, EntityType } from "@/lib/types";

const TYPE_LABELS: Record<string, string> = {
  capture: "Captures",
  problem: "Problems",
  hypothesis: "Hypotheses",
  experiment: "Experiments",
  decision: "Decisions",
  artifact: "Artifacts",
  feedback: "Feedback",
  feature_request: "Requests",
  feature: "Features",
};

export default function ExportsPage() {
  const { productId } = useParams<{ productId: string }>();
  const { setCurrentProduct } = useProductContext();
  const { data: product } = useProduct(productId);
  const { toast } = useToast();

  const [mode, setMode] = useState<ExportMode>("full");
  const [includeLinkedContext, setIncludeLinkedContext] = useState(true);
  const [sinceDate, setSinceDate] = useState("");
  const [showClearDialog, setShowClearDialog] = useState(false);

  // Hooks
  const { data: exportHistory, isLoading: historyLoading } = useExportHistory(productId);
  const executeExport = useExecuteExport();
  const clearHistory = useClearExportHistory();
  const openFolder = useOpenExportFolder();
  const copySnapshot = useCopySnapshot();

  // Build export options for preview
  const exportOptions: ExportOptions | null = useMemo(() => {
    if (!productId) return null;
    return {
      productId,
      mode,
      startDate: mode === "incremental" ? sinceDate || undefined : undefined,
      includeLinkedContext,
    };
  }, [productId, mode, sinceDate, includeLinkedContext]);

  const { data: preview, isLoading: previewLoading } = useExportPreview(exportOptions);

  useEffect(() => {
    if (productId) setCurrentProduct(productId);
  }, [productId, setCurrentProduct]);

  // Get last export date for "since last export" option
  const lastExportDate = useMemo(() => {
    if (!exportHistory || exportHistory.length === 0) return null;
    const sorted = [...exportHistory].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
    return sorted[0].endDate;
  }, [exportHistory]);

  const handleExport = async () => {
    if (!productId || !exportOptions) return;

    try {
      const result = await executeExport.mutateAsync(exportOptions);

      toast({
        title: "Export complete",
        description: `Exported ${result.counts.total} items to ${result.outputPath}`,
      });

      // Offer to open the folder
      if (result.outputPath) {
        openFolder.mutate(result.outputPath);
      }
    } catch (error) {
      toast({
        title: "Export failed",
        description: String(error),
        variant: "destructive",
      });
    }
  };

  const handleClearHistory = async () => {
    try {
      await clearHistory.mutateAsync(productId);
      toast({
        title: "History cleared",
        description: "Export history has been cleared.",
      });
      setShowClearDialog(false);
    } catch {
      toast({
        title: "Error",
        description: "Failed to clear history.",
        variant: "destructive",
      });
    }
  };

  const handleOpenFolder = (path: string) => {
    openFolder.mutate(path);
  };

  const handleCopySnapshot = async () => {
    if (!productId) return;

    try {
      const snapshot = await copySnapshot.mutateAsync(productId);
      await navigator.clipboard.writeText(snapshot);
      toast({
        title: "Copied to clipboard",
        description: "Product snapshot is ready to paste into your AI chat.",
      });
    } catch (error) {
      toast({
        title: "Copy failed",
        description: String(error),
        variant: "destructive",
      });
    }
  };

  if (!product) {
    return (
      <div className="page-container">
        <Skeleton className="mb-6 h-8 w-48" />
        <Skeleton className="h-64 w-full rounded-lg" />
      </div>
    );
  }

  return (
    <div className="page-container scrollbar-thin">
      <div className="page-header">
        <h1 className="text-lg font-semibold text-foreground">Exports</h1>
        <p className="text-sm text-muted-foreground">
          Export your product thinking as markdown files
        </p>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {/* Export Options */}
        <Card className="border-border/50 shadow-xs">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-2 text-sm font-medium">
              <Download className="h-4 w-4" />
              New Export
            </CardTitle>
            <CardDescription className="text-xs">
              Configure and download an export bundle
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            {/* Mode Selection */}
            <div className="space-y-2.5">
              <Label className="text-sm">Export Mode</Label>
              <RadioGroup value={mode} onValueChange={(v) => setMode(v as ExportMode)}>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="full" id="full" />
                  <Label htmlFor="full" className="text-sm font-normal">
                    Full export (all items)
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="incremental" id="incremental" />
                  <Label htmlFor="incremental" className="text-sm font-normal">
                    Incremental (new/updated since date)
                  </Label>
                </div>
              </RadioGroup>
            </div>

            {mode === "incremental" && (
              <>
                {/* Date Selection */}
                <div className="space-y-2">
                  <Label className="text-sm">Since Date</Label>
                  <div className="flex gap-2">
                    <Input
                      type="date"
                      value={sinceDate}
                      onChange={(e) => setSinceDate(e.target.value)}
                      className="h-9 flex-1 text-sm"
                    />
                    {lastExportDate && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-9 text-xs"
                        onClick={() => setSinceDate(lastExportDate.split("T")[0])}
                      >
                        Since last export
                      </Button>
                    )}
                  </div>
                  {lastExportDate && (
                    <p className="text-xs text-muted-foreground">
                      Last export: {format(new Date(lastExportDate), "MMM d, yyyy h:mm a")}
                    </p>
                  )}
                </div>

                {/* Include Linked Context */}
                <div className="flex items-center justify-between gap-3">
                  <div className="space-y-0.5">
                    <Label className="text-sm">Include linked context</Label>
                    <p className="text-xs text-muted-foreground">
                      Include linked entities for coherence
                    </p>
                  </div>
                  <Switch
                    checked={includeLinkedContext}
                    onCheckedChange={setIncludeLinkedContext}
                  />
                </div>
              </>
            )}

            <Separator className="bg-border/50" />

            {/* Preview */}
            <div className="space-y-2">
              <Label className="text-sm">Preview</Label>
              <div className="rounded-md border border-border/50 bg-muted/30 p-3">
                {previewLoading ? (
                  <div className="space-y-1">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-3 w-48" />
                  </div>
                ) : preview ? (
                  <div className="space-y-1.5">
                    <p className="text-sm font-medium">
                      {preview.counts.total} items will be exported
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {Object.entries(preview.counts.byType)
                        .filter(([, count]) => count > 0)
                        .map(([type, count]) => (
                          <Badge
                            key={type}
                            variant="secondary"
                            className="h-5 px-1.5 text-[10px]"
                          >
                            {count} {TYPE_LABELS[type as EntityType]}
                          </Badge>
                        ))}
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    {mode === "full" ? "All items" : "Configure options to see preview"}
                  </p>
                )}
              </div>
            </div>

            <Button
              onClick={handleExport}
              disabled={executeExport.isPending || !preview || preview.counts.total === 0}
              size="sm"
              className="w-full"
            >
              {executeExport.isPending ? "Exporting..." : "Download Export"}
            </Button>
          </CardContent>
        </Card>

        {/* Export History */}
        <Card className="border-border/50 shadow-xs">
          <CardHeader className="flex flex-row items-center justify-between pb-4">
            <div>
              <CardTitle className="flex items-center gap-2 text-sm font-medium">
                <Clock className="h-4 w-4" />
                Export History
              </CardTitle>
              <CardDescription className="text-xs">
                Previous exports from this product
              </CardDescription>
            </div>
            {exportHistory && exportHistory.length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                className="h-7 gap-1 text-xs text-muted-foreground"
                onClick={() => setShowClearDialog(true)}
              >
                <Trash2 className="h-3 w-3" />
                Clear
              </Button>
            )}
          </CardHeader>
          <CardContent>
            {historyLoading ? (
              <div className="space-y-2">
                <Skeleton className="h-14 w-full rounded-md" />
                <Skeleton className="h-14 w-full rounded-md" />
              </div>
            ) : !exportHistory || exportHistory.length === 0 ? (
              <p className="py-10 text-center text-xs text-muted-foreground">
                No exports yet
              </p>
            ) : (
              <div className="space-y-2">
                {[...exportHistory]
                  .sort(
                    (a, b) =>
                      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
                  )
                  .slice(0, 10)
                  .map((record) => (
                    <div
                      key={record.id}
                      className="flex items-center justify-between rounded-md border border-border/50 p-3"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5">
                          <Badge
                            variant={record.mode === "full" ? "default" : "secondary"}
                            className="h-5 px-1.5 text-[10px] font-medium"
                          >
                            {record.mode}
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            {formatDistanceToNow(new Date(record.createdAt), {
                              addSuffix: true,
                            })}
                          </span>
                        </div>
                        <p className="mt-1 truncate text-xs text-muted-foreground">
                          {Object.entries(record.counts.byType)
                            .filter(([, count]) => count > 0)
                            .map(
                              ([type, count]) =>
                                `${count} ${type}${count > 1 ? "s" : ""}`
                            )
                            .join(", ")}
                        </p>
                      </div>
                      {record.outputPath && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => handleOpenFolder(record.outputPath!)}
                          title="Open folder"
                        >
                          <FolderOpen className="h-4 w-4 text-muted-foreground" />
                        </Button>
                      )}
                    </div>
                  ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Copy Snapshot */}
      <Card className="mt-4 border-border/50 shadow-xs">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2 text-sm font-medium">
            <Copy className="h-4 w-4" />
            Copy Snapshot
          </CardTitle>
          <CardDescription className="text-xs">
            Copy a summary of your product state for AI chat context
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <p className="text-xs text-muted-foreground">
              Generates a markdown summary including active problems, running experiments,
              recent decisions, and open questions.
            </p>
            <Button
              onClick={handleCopySnapshot}
              disabled={copySnapshot.isPending}
              variant="outline"
              size="sm"
              className="w-full gap-2"
            >
              {copySnapshot.isPending ? (
                <>Generating...</>
              ) : (
                <>
                  <ClipboardCheck className="h-4 w-4" />
                  Copy to Clipboard
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Clear History Dialog */}
      <AlertDialog open={showClearDialog} onOpenChange={setShowClearDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Clear Export History?</AlertDialogTitle>
            <AlertDialogDescription>
              This will remove all export records from history. The exported files will not
              be deleted.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleClearHistory}>Clear</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
