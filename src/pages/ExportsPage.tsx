import { useEffect, useState, useMemo } from "react";
import { useParams } from "react-router-dom";
import { Download, FileText, Clock, Calendar } from "lucide-react";
import { useProductContext } from "@/contexts/ProductContext";
import { useProduct } from "@/hooks/useProducts";
import { useEntities } from "@/hooks/useEntities";
import { 
  getExportsByProduct, 
  saveExport, 
  generateId,
  type ExportRecord,
  type Entity,
  type EntityType 
} from "@/lib/db";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { format, formatDistanceToNow } from "date-fns";
import { useQuery, useQueryClient } from "@tanstack/react-query";

export default function ExportsPage() {
  const { productId } = useParams<{ productId: string }>();
  const { setCurrentProduct } = useProductContext();
  const { data: product } = useProduct(productId);
  const { data: entities } = useEntities(productId);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [mode, setMode] = useState<"full" | "incremental">("full");
  const [includeParents, setIncludeParents] = useState(true);
  const [sinceDate, setSinceDate] = useState("");
  const [isExporting, setIsExporting] = useState(false);

  const { data: exportHistory, isLoading: historyLoading } = useQuery({
    queryKey: ["exports", productId],
    queryFn: () => getExportsByProduct(productId!),
    enabled: !!productId,
  });

  useEffect(() => {
    if (productId) setCurrentProduct(productId);
  }, [productId, setCurrentProduct]);

  // Get last export date for "since last export" option
  const lastExportDate = useMemo(() => {
    if (!exportHistory || exportHistory.length === 0) return null;
    const sorted = [...exportHistory].sort(
      (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );
    return sorted[0].timestamp;
  }, [exportHistory]);

  const handleExport = async () => {
    if (!productId || !entities || !product) return;

    setIsExporting(true);
    try {
      let filteredEntities = [...entities];
      let startDate: string | undefined;

      if (mode === "incremental") {
        startDate = sinceDate || lastExportDate || undefined;
        if (startDate) {
          const startTime = new Date(startDate).getTime();
          filteredEntities = entities.filter((e) => {
            const created = new Date(e.createdAt).getTime();
            const updated = new Date(e.updatedAt).getTime();
            return created >= startTime || updated >= startTime;
          });

          // Include parent context if enabled
          if (includeParents) {
            const parentIds = new Set<string>();
            filteredEntities.forEach((e) => {
              // For experiments, include linked hypotheses and problems
              if (e.type === "experiment") {
                e.linkedIds?.hypotheses?.forEach((id) => parentIds.add(id));
                e.linkedIds?.problems?.forEach((id) => parentIds.add(id));
              }
              // For hypotheses, include linked problems
              if (e.type === "hypothesis") {
                e.linkedIds?.problems?.forEach((id) => parentIds.add(id));
              }
            });

            // Add parents that aren't already in the export
            const existingIds = new Set(filteredEntities.map((e) => e.id));
            entities.forEach((e) => {
              if (parentIds.has(e.id) && !existingIds.has(e.id)) {
                filteredEntities.push(e);
              }
            });
          }
        }
      }

      // Generate export bundle
      const bundle = generateExportBundle(product.name, filteredEntities, product.taxonomy);

      // Download as zip-like structure (JSON manifest + markdown files)
      downloadBundle(bundle, product.name);

      // Record export
      const counts: Record<EntityType, number> = {
        problem: 0,
        hypothesis: 0,
        experiment: 0,
        decision: 0,
        artifact: 0,
        quick_capture: 0,
      };
      filteredEntities.forEach((e) => {
        counts[e.type]++;
      });

      const record: ExportRecord = {
        id: generateId(),
        productId,
        timestamp: new Date().toISOString(),
        mode,
        startDate,
        counts,
      };

      await saveExport(record);
      queryClient.invalidateQueries({ queryKey: ["exports", productId] });

      toast({
        title: "Export complete",
        description: `Exported ${filteredEntities.length} items.`,
      });
    } catch (error) {
      toast({
        title: "Export failed",
        description: "Something went wrong.",
        variant: "destructive",
      });
    } finally {
      setIsExporting(false);
    }
  };

  if (!product) {
    return (
      <div className="p-8">
        <Skeleton className="mb-8 h-10 w-48" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold">Exports</h1>
        <p className="text-muted-foreground">
          Export your product thinking as markdown files
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Export Options */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Download className="h-5 w-5" />
              New Export
            </CardTitle>
            <CardDescription>
              Configure and download an export bundle
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Mode Selection */}
            <div className="space-y-3">
              <Label>Export Mode</Label>
              <RadioGroup value={mode} onValueChange={(v) => setMode(v as "full" | "incremental")}>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="full" id="full" />
                  <Label htmlFor="full" className="font-normal">
                    Full export (all items)
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="incremental" id="incremental" />
                  <Label htmlFor="incremental" className="font-normal">
                    Incremental (new/updated since date)
                  </Label>
                </div>
              </RadioGroup>
            </div>

            {mode === "incremental" && (
              <>
                {/* Date Selection */}
                <div className="space-y-2">
                  <Label>Since Date</Label>
                  <div className="flex gap-2">
                    <Input
                      type="date"
                      value={sinceDate}
                      onChange={(e) => setSinceDate(e.target.value)}
                      className="flex-1"
                    />
                    {lastExportDate && (
                      <Button
                        variant="outline"
                        size="sm"
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

                {/* Include Parents */}
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Include parent context</Label>
                    <p className="text-xs text-muted-foreground">
                      Include linked problems/hypotheses for coherence
                    </p>
                  </div>
                  <Switch checked={includeParents} onCheckedChange={setIncludeParents} />
                </div>
              </>
            )}

            <Separator />

            {/* Preview */}
            <div className="space-y-2">
              <Label>Preview</Label>
              <div className="rounded-lg border border-border bg-muted/30 p-3 text-sm">
                {mode === "full" ? (
                  <p>{entities?.length || 0} items will be exported</p>
                ) : (
                  <p>
                    Items created or updated since{" "}
                    {sinceDate
                      ? format(new Date(sinceDate), "MMM d, yyyy")
                      : lastExportDate
                      ? format(new Date(lastExportDate), "MMM d, yyyy")
                      : "the beginning"}
                  </p>
                )}
              </div>
            </div>

            <Button onClick={handleExport} disabled={isExporting} className="w-full">
              {isExporting ? "Exporting..." : "Download Export"}
            </Button>
          </CardContent>
        </Card>

        {/* Export History */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Export History
            </CardTitle>
            <CardDescription>
              Previous exports from this product
            </CardDescription>
          </CardHeader>
          <CardContent>
            {historyLoading ? (
              <div className="space-y-2">
                <Skeleton className="h-16 w-full" />
                <Skeleton className="h-16 w-full" />
              </div>
            ) : !exportHistory || exportHistory.length === 0 ? (
              <p className="py-8 text-center text-sm text-muted-foreground">
                No exports yet
              </p>
            ) : (
              <div className="space-y-3">
                {[...exportHistory]
                  .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
                  .slice(0, 10)
                  .map((record) => (
                    <div
                      key={record.id}
                      className="flex items-center justify-between rounded-lg border border-border p-3"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <Badge variant={record.mode === "full" ? "default" : "secondary"}>
                            {record.mode}
                          </Badge>
                          <span className="text-sm text-muted-foreground">
                            {formatDistanceToNow(new Date(record.timestamp), { addSuffix: true })}
                          </span>
                        </div>
                        <p className="mt-1 text-xs text-muted-foreground">
                          {Object.entries(record.counts)
                            .filter(([, count]) => count > 0)
                            .map(([type, count]) => `${count} ${type}${count > 1 ? "s" : ""}`)
                            .join(", ")}
                        </p>
                      </div>
                      <FileText className="h-4 w-4 text-muted-foreground" />
                    </div>
                  ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

interface ExportBundle {
  manifest: {
    productName: string;
    exportedAt: string;
    counts: Record<string, number>;
  };
  files: { path: string; content: string }[];
}

function generateExportBundle(
  productName: string,
  entities: Entity[],
  taxonomy: any
): ExportBundle {
  const files: { path: string; content: string }[] = [];
  const counts: Record<string, number> = {};

  entities.forEach((entity) => {
    counts[entity.type] = (counts[entity.type] || 0) + 1;

    const filename = `${entity.type}s/${sanitizeFilename(entity.title)}-${entity.id.slice(0, 8)}.md`;
    const content = entityToMarkdown(entity, taxonomy);
    files.push({ path: filename, content });
  });

  // Add manifest
  const manifest = {
    productName,
    exportedAt: new Date().toISOString(),
    counts,
  };

  files.push({
    path: "manifest.json",
    content: JSON.stringify(manifest, null, 2),
  });

  // Add snapshot overview
  const snapshot = generateSnapshotMarkdown(productName, entities, counts);
  files.push({ path: "snapshot.md", content: snapshot });

  return { manifest, files };
}

function entityToMarkdown(entity: Entity, taxonomy: any): string {
  const lines: string[] = [];

  lines.push(`# ${entity.title}`);
  lines.push("");
  lines.push(`**Type:** ${entity.type}`);
  lines.push(`**Created:** ${format(new Date(entity.createdAt), "yyyy-MM-dd HH:mm")}`);
  lines.push(`**Updated:** ${format(new Date(entity.updatedAt), "yyyy-MM-dd HH:mm")}`);

  // Type-specific fields
  if (entity.type === "problem") {
    lines.push(`**Status:** ${(entity as any).status}`);
  } else if (entity.type === "experiment") {
    lines.push(`**Status:** ${(entity as any).status}`);
    if ((entity as any).outcome) {
      lines.push(`**Outcome:** ${(entity as any).outcome}`);
    }
  } else if (entity.type === "decision") {
    if ((entity as any).decisionType) {
      lines.push(`**Decision Type:** ${(entity as any).decisionType}`);
    }
    if ((entity as any).decidedAt) {
      lines.push(`**Decided:** ${format(new Date((entity as any).decidedAt), "yyyy-MM-dd")}`);
    }
  } else if (entity.type === "artifact") {
    lines.push(`**Artifact Type:** ${(entity as any).artifactType}`);
    if ((entity as any).source) {
      lines.push(`**Source:** ${(entity as any).source}`);
    }
  }

  lines.push("");

  // Context tags
  const contextTags: string[] = [];
  if (entity.personaIds.length > 0) {
    const names = entity.personaIds
      .map((id) => taxonomy.personas.find((p: any) => p.id === id)?.name)
      .filter(Boolean);
    if (names.length > 0) contextTags.push(`Personas: ${names.join(", ")}`);
  }
  if (entity.featureAreaIds.length > 0) {
    const names = entity.featureAreaIds
      .map((id) => taxonomy.featureAreas.find((f: any) => f.id === id)?.name)
      .filter(Boolean);
    if (names.length > 0) contextTags.push(`Features: ${names.join(", ")}`);
  }

  if (contextTags.length > 0) {
    lines.push("## Context");
    contextTags.forEach((tag) => lines.push(`- ${tag}`));
    lines.push("");
  }

  // Body content
  if (entity.body) {
    lines.push("## Content");
    lines.push("");
    // Strip HTML for markdown export
    lines.push(stripHtml(entity.body));
    lines.push("");
  }

  // Linked items
  const linkedIds = entity.linkedIds || {};
  const hasLinks = Object.values(linkedIds).some((arr) => arr && arr.length > 0);
  if (hasLinks) {
    lines.push("## Linked Items");
    Object.entries(linkedIds).forEach(([type, ids]) => {
      if (ids && ids.length > 0) {
        lines.push(`- ${type}: ${ids.length} item(s)`);
      }
    });
    lines.push("");
  }

  return lines.join("\n");
}

function generateSnapshotMarkdown(
  productName: string,
  entities: Entity[],
  counts: Record<string, number>
): string {
  const lines: string[] = [];

  lines.push(`# ${productName} - Export Snapshot`);
  lines.push("");
  lines.push(`Exported: ${format(new Date(), "yyyy-MM-dd HH:mm")}`);
  lines.push("");
  lines.push("## Summary");
  lines.push("");
  Object.entries(counts).forEach(([type, count]) => {
    lines.push(`- **${type}s:** ${count}`);
  });
  lines.push("");
  lines.push("## Recent Activity");
  lines.push("");

  const recent = [...entities]
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
    .slice(0, 10);

  recent.forEach((e) => {
    lines.push(`- [${e.type}] ${e.title} (${format(new Date(e.updatedAt), "MMM d")})`);
  });

  return lines.join("\n");
}

function sanitizeFilename(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 50);
}

function stripHtml(html: string): string {
  return html
    .replace(/<[^>]*>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .trim();
}

function downloadBundle(bundle: ExportBundle, productName: string) {
  // For simplicity, download as a single JSON file containing all markdown
  // In a real app, you'd use JSZip to create an actual zip
  const content = JSON.stringify(
    {
      manifest: bundle.manifest,
      files: bundle.files.reduce((acc, f) => {
        acc[f.path] = f.content;
        return acc;
      }, {} as Record<string, string>),
    },
    null,
    2
  );

  const blob = new Blob([content], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${sanitizeFilename(productName)}-export-${format(new Date(), "yyyy-MM-dd")}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
