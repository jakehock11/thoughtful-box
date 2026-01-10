import { useEffect, useMemo, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { Plus, Search, Link as LinkIcon, Image, FileText, HelpCircle, Database } from "lucide-react";
import { useProductContext } from "@/contexts/ProductContext";
import { useEntitiesByType, useCreateEntity } from "@/hooks/useEntities";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { formatDistanceToNow } from "date-fns";
import type { Artifact, ArtifactType } from "@/lib/db";

const ARTIFACT_ICONS: Record<ArtifactType, React.ElementType> = {
  link: LinkIcon,
  image: Image,
  file: FileText,
  note: FileText,
  query: Database,
};

export default function ArtifactsPage() {
  const { productId } = useParams<{ productId: string }>();
  const { setCurrentProduct } = useProductContext();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const { data: artifacts, isLoading } = useEntitiesByType(productId, "artifact");
  const createEntity = useCreateEntity();

  const [search, setSearch] = useState("");

  useEffect(() => {
    if (productId) setCurrentProduct(productId);
  }, [productId, setCurrentProduct]);

  const filteredArtifacts = useMemo(() => {
    if (!artifacts) return [];
    return (artifacts as Artifact[])
      .filter((a) => {
        if (search && !a.title.toLowerCase().includes(search.toLowerCase())) return false;
        return true;
      })
      .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
  }, [artifacts, search]);

  const handleCreate = async () => {
    if (!productId) return;
    try {
      const entity = await createEntity.mutateAsync({
        type: "artifact",
        productId,
        title: "Untitled Artifact",
        artifactType: "note",
      });
      navigate(`/product/${productId}/artifacts/${entity.id}`);
    } catch {
      toast({ title: "Error", description: "Failed to create artifact", variant: "destructive" });
    }
  };

  if (isLoading) {
    return (
      <div className="page-container">
        <Skeleton className="mb-4 h-8 w-48" />
        <Skeleton className="mb-4 h-9 w-full" />
        <div className="space-y-1.5">
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-16 w-full" />
        </div>
      </div>
    );
  }

  return (
    <div className="page-container flex h-full flex-col">
      {/* Header */}
      <div className="page-header page-header-row">
        <div>
          <h1 className="text-page-title">Artifacts</h1>
          <p className="mt-1 text-meta">
            Links, images, files, and notes that support your thinking
          </p>
        </div>
        <Button onClick={handleCreate} size="sm" className="gap-2 shadow-sm">
          <Plus className="h-4 w-4" />
          New Artifact
        </Button>
      </div>

      {/* Search */}
      <div className="mb-5">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground pointer-events-none" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search artifacts..."
            className="pl-9 h-9"
          />
        </div>
      </div>

      {/* Content */}
      {filteredArtifacts.length === 0 ? (
        <div className="flex flex-1 flex-col items-center justify-center text-center">
          <p className="mb-4 text-sm text-muted-foreground">
            {search
              ? "No artifacts match your search."
              : "No artifacts yet. Add links, images, or notes to support your thinking."}
          </p>
          {!search && (
            <Button onClick={handleCreate} variant="outline" size="sm">
              Create your first artifact
            </Button>
          )}
        </div>
      ) : (
        <div className="space-y-1.5">
          {filteredArtifacts.map((artifact) => {
            const Icon = ARTIFACT_ICONS[artifact.artifactType] || HelpCircle;
            return (
              <Link
                key={artifact.id}
                to={`/product/${productId}/artifacts/${artifact.id}`}
                className="flex items-center gap-3 rounded-lg border border-border bg-card px-4 py-3 transition-all duration-150 hover:bg-accent hover:shadow-sm"
              >
                <div className="flex h-8 w-8 items-center justify-center rounded-md bg-secondary">
                  <Icon className="h-4 w-4 text-muted-foreground" />
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="truncate text-sm font-medium text-foreground">{artifact.title}</h3>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    Updated {formatDistanceToNow(new Date(artifact.updatedAt), { addSuffix: true })}
                  </p>
                </div>
                <Badge variant="secondary" className="capitalize text-xs font-medium">
                  {artifact.artifactType}
                </Badge>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
