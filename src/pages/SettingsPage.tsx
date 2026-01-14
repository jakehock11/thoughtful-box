import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Settings, Trash2, Download, Moon, Sun, Monitor, FolderOpen, RefreshCw, AlertTriangle } from "lucide-react";
import { useProductContext } from "@/contexts/ProductContext";
import { useProduct, useUpdateProduct, useDeleteProduct } from "@/hooks/useProducts";
import { useTheme } from "@/contexts/ThemeContext";
import {
  useSettings,
  useUpdateSettings,
  useChangeWorkspace,
  useMigrateWorkspace,
  useOpenWorkspaceFolder,
  useClearExportHistory,
  useClearAllData,
} from "@/hooks/useSettings";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import { useToast } from "@/hooks/use-toast";

export default function SettingsPage() {
  const { productId } = useParams<{ productId: string }>();
  const navigate = useNavigate();
  const { setCurrentProduct, exitProduct } = useProductContext();
  const { data: product, isLoading: productLoading } = useProduct(productId);
  const updateProduct = useUpdateProduct();
  const deleteProduct = useDeleteProduct();
  const { theme, setTheme } = useTheme();
  const { toast } = useToast();

  // Settings hooks
  const { data: settings, isLoading: settingsLoading } = useSettings();
  const updateSettings = useUpdateSettings();
  const changeWorkspace = useChangeWorkspace();
  const migrateWorkspace = useMigrateWorkspace();
  const openWorkspaceFolder = useOpenWorkspaceFolder();
  const clearExportHistory = useClearExportHistory();
  const clearAllData = useClearAllData();

  const [name, setName] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [backupPath, setBackupPath] = useState<string | null>(null);

  useEffect(() => {
    if (productId) setCurrentProduct(productId);
  }, [productId, setCurrentProduct]);

  useEffect(() => {
    if (product) {
      setName(product.name);
    }
  }, [product]);

  const handleSaveName = async () => {
    if (!product || !name.trim()) return;
    setIsSaving(true);
    try {
      await updateProduct.mutateAsync({ id: product.id, data: { name: name.trim() } });
      toast({ title: "Saved", description: "Product name updated." });
    } catch {
      toast({ title: "Error", description: "Failed to update product name.", variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteProduct = async () => {
    if (!productId) return;
    try {
      await deleteProduct.mutateAsync(productId);
      toast({ title: "Deleted", description: "Product has been deleted." });
      exitProduct();
    } catch {
      toast({ title: "Error", description: "Failed to delete product.", variant: "destructive" });
    }
  };

  const handleMigrateWorkspace = async () => {
    try {
      const result = await migrateWorkspace.mutateAsync();
      if (result) {
        setBackupPath(result.backupPath);
        toast({
          title: "Workspace Migrated",
          description: `Data copied to new location. Old data preserved at: ${result.backupPath}`,
        });
      }
    } catch {
      toast({ title: "Error", description: "Failed to migrate workspace.", variant: "destructive" });
    }
  };

  const handleOpenWorkspace = async () => {
    try {
      await openWorkspaceFolder.mutateAsync();
    } catch {
      toast({ title: "Error", description: "Failed to open workspace folder.", variant: "destructive" });
    }
  };

  const handleClearExportHistory = async () => {
    try {
      await clearExportHistory.mutateAsync();
      toast({ title: "Cleared", description: "Export history has been cleared." });
    } catch {
      toast({ title: "Error", description: "Failed to clear export history.", variant: "destructive" });
    }
  };

  const handleClearAllData = async () => {
    try {
      await clearAllData.mutateAsync();
      toast({ title: "Cleared", description: "All data has been deleted." });
      exitProduct();
    } catch {
      toast({ title: "Error", description: "Failed to clear data.", variant: "destructive" });
    }
  };

  const handleSettingsChange = async (key: string, value: boolean | string) => {
    try {
      await updateSettings.mutateAsync({ [key]: value });
    } catch {
      toast({ title: "Error", description: "Failed to update settings.", variant: "destructive" });
    }
  };

  const isLoading = productLoading || settingsLoading;

  if (isLoading) {
    return (
      <div className="page-container">
        <Skeleton className="mb-6 h-8 w-48" />
        <div className="mx-auto max-w-2xl space-y-4">
          <Skeleton className="h-40 w-full rounded-lg" />
          <Skeleton className="h-40 w-full rounded-lg" />
          <Skeleton className="h-40 w-full rounded-lg" />
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="page-container flex items-center justify-center py-16">
        <p className="text-sm text-muted-foreground">Product not found</p>
      </div>
    );
  }

  return (
    <div className="page-container scrollbar-thin">
      <div className="page-header">
        <h1 className="text-lg font-semibold text-foreground">Settings</h1>
        <p className="text-sm text-muted-foreground">
          Configure your product and preferences
        </p>
      </div>

      <div className="mx-auto max-w-2xl space-y-4">
        {/* Product Settings */}
        <Card className="border-border/50 shadow-xs">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-2 text-sm font-medium">
              <Settings className="h-4 w-4" />
              Product Settings
            </CardTitle>
            <CardDescription className="text-xs">
              Manage your product configuration
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-2">
              <Label htmlFor="productName" className="text-sm">Product Name</Label>
              <div className="flex gap-2">
                <Input
                  id="productName"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Product name"
                  className="h-9 text-sm"
                />
                <Button
                  size="sm"
                  className="h-9"
                  onClick={handleSaveName}
                  disabled={isSaving || name === product.name}
                >
                  {isSaving ? "Saving..." : "Save"}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Workspace Settings */}
        <Card className="border-border/50 shadow-xs">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-2 text-sm font-medium">
              <FolderOpen className="h-4 w-4" />
              Workspace
            </CardTitle>
            <CardDescription className="text-xs">
              Manage your data storage location
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label className="text-sm">Workspace Folder</Label>
              <div className="flex items-center gap-2">
                <code className="flex-1 rounded-md bg-muted px-3 py-2 text-xs font-mono truncate">
                  {settings?.workspacePath || "Not configured"}
                </code>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-9 shrink-0"
                  onClick={handleOpenWorkspace}
                  disabled={!settings?.workspacePath}
                >
                  Open
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-9 shrink-0"
                  onClick={handleMigrateWorkspace}
                  disabled={migrateWorkspace.isPending}
                >
                  {migrateWorkspace.isPending ? "Migrating..." : "Change Location"}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Changing location will copy all data to the new folder. Your old data is preserved as a backup.
              </p>
            </div>

            {backupPath && (
              <div className="rounded-md border border-border/50 bg-muted/30 p-3 space-y-1">
                <Label className="text-xs text-muted-foreground">Previous workspace (backup)</Label>
                <code className="block text-xs font-mono truncate text-muted-foreground">
                  {backupPath}
                </code>
              </div>
            )}

            <div className="flex items-center justify-between gap-3">
              <div className="space-y-0.5">
                <Label className="text-sm">Restore last context on startup</Label>
                <p className="text-xs text-muted-foreground">
                  Return to the last product you were working on
                </p>
              </div>
              <Switch
                checked={settings?.restoreLastContext ?? true}
                onCheckedChange={(checked) => handleSettingsChange("restoreLastContext", checked)}
              />
            </div>
          </CardContent>
        </Card>

        {/* Appearance */}
        <Card className="border-border/50 shadow-xs">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-2 text-sm font-medium">
              {theme === "dark" ? (
                <Moon className="h-4 w-4" />
              ) : theme === "light" ? (
                <Sun className="h-4 w-4" />
              ) : (
                <Monitor className="h-4 w-4" />
              )}
              Appearance
            </CardTitle>
            <CardDescription className="text-xs">
              Customize how Product OS looks
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2.5">
              <Label className="text-sm">Theme</Label>
              <RadioGroup value={theme} onValueChange={(v) => setTheme(v as "light" | "dark" | "system")}>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="light" id="light" />
                  <Label htmlFor="light" className="flex items-center gap-2 text-sm font-normal">
                    <Sun className="h-3.5 w-3.5" />
                    Light
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="dark" id="dark" />
                  <Label htmlFor="dark" className="flex items-center gap-2 text-sm font-normal">
                    <Moon className="h-3.5 w-3.5" />
                    Dark
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="system" id="system" />
                  <Label htmlFor="system" className="flex items-center gap-2 text-sm font-normal">
                    <Monitor className="h-3.5 w-3.5" />
                    System
                  </Label>
                </div>
              </RadioGroup>
            </div>
          </CardContent>
        </Card>

        {/* Export Defaults */}
        <Card className="border-border/50 shadow-xs">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-2 text-sm font-medium">
              <Download className="h-4 w-4" />
              Export Defaults
            </CardTitle>
            <CardDescription className="text-xs">
              Default settings for exports
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label className="text-sm">Default Export Mode</Label>
              <Select
                value={settings?.defaultExportMode ?? "incremental"}
                onValueChange={(value) => handleSettingsChange("defaultExportMode", value)}
              >
                <SelectTrigger className="h-9 text-sm">
                  <SelectValue placeholder="Select mode" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="full">Full Export</SelectItem>
                  <SelectItem value="incremental">Incremental Export</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-sm">Default Incremental Range</Label>
              <Select
                value={settings?.defaultIncrementalRange ?? "since_last_export"}
                onValueChange={(value) => handleSettingsChange("defaultIncrementalRange", value)}
              >
                <SelectTrigger className="h-9 text-sm">
                  <SelectValue placeholder="Select range" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="since_last_export">Since Last Export</SelectItem>
                  <SelectItem value="last_7_days">Last 7 Days</SelectItem>
                  <SelectItem value="last_30_days">Last 30 Days</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center justify-between gap-3">
              <div className="space-y-0.5">
                <Label className="text-sm">Include linked context by default</Label>
                <p className="text-xs text-muted-foreground">
                  Include linked problems/hypotheses in incremental exports
                </p>
              </div>
              <Switch
                checked={settings?.includeLinkedContext ?? true}
                onCheckedChange={(checked) => handleSettingsChange("includeLinkedContext", checked)}
              />
            </div>
          </CardContent>
        </Card>

        {/* Danger Zone */}
        <Card className="border-destructive/30 shadow-xs">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-2 text-sm font-medium text-destructive">
              <AlertTriangle className="h-4 w-4" />
              Danger Zone
            </CardTitle>
            <CardDescription className="text-xs">
              Irreversible actions
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Clear Export History */}
            <div className="flex items-center justify-between gap-3">
              <div className="space-y-0.5">
                <Label className="text-sm">Clear export history</Label>
                <p className="text-xs text-muted-foreground">
                  Delete all export history records
                </p>
              </div>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="outline" size="sm" className="h-8 text-xs">
                    <RefreshCw className="mr-1.5 h-3 w-3" />
                    Clear History
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle className="text-base">Clear export history?</AlertDialogTitle>
                    <AlertDialogDescription className="text-sm">
                      This will delete all records of past exports. The exported files will not be affected.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter className="gap-2 sm:gap-0">
                    <AlertDialogCancel className="h-9 text-sm">Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={handleClearExportHistory}
                      className="h-9 text-sm"
                    >
                      Clear History
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>

            {/* Delete Product */}
            <div className="flex items-center justify-between gap-3">
              <div className="space-y-0.5">
                <Label className="text-sm">Delete this product</Label>
                <p className="text-xs text-muted-foreground">
                  Permanently delete all data for "{product.name}"
                </p>
              </div>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive" size="sm" className="h-8 text-xs">
                    Delete Product
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle className="text-base">Delete "{product.name}"?</AlertDialogTitle>
                    <AlertDialogDescription className="text-sm">
                      This will permanently delete all problems, hypotheses, experiments,
                      decisions, artifacts, and captures. This action cannot be undone.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter className="gap-2 sm:gap-0">
                    <AlertDialogCancel className="h-9 text-sm">Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={handleDeleteProduct}
                      className="h-9 bg-destructive text-sm text-destructive-foreground hover:bg-destructive/90"
                    >
                      Delete Forever
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>

            {/* Clear All Data */}
            <div className="flex items-center justify-between gap-3">
              <div className="space-y-0.5">
                <Label className="text-sm text-destructive">Clear all data</Label>
                <p className="text-xs text-muted-foreground">
                  Delete ALL products, entities, and export history
                </p>
              </div>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive" size="sm" className="h-8 text-xs">
                    <Trash2 className="mr-1.5 h-3 w-3" />
                    Clear All Data
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle className="text-base text-destructive">
                      Clear ALL data?
                    </AlertDialogTitle>
                    <AlertDialogDescription className="text-sm">
                      This will permanently delete ALL products, entities, taxonomy items,
                      relationships, and export history. Your workspace folder and settings
                      will be preserved, but all data will be gone forever.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter className="gap-2 sm:gap-0">
                    <AlertDialogCancel className="h-9 text-sm">Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={handleClearAllData}
                      className="h-9 bg-destructive text-sm text-destructive-foreground hover:bg-destructive/90"
                    >
                      Delete Everything
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
