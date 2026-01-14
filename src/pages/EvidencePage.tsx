import { useEffect, useState, useMemo } from "react";
import { useParams, Link, useSearchParams, useNavigate } from "react-router-dom";
import {
  FileText,
  Search,
  Link2,
  Image,
  StickyNote,
  Plus,
  Paperclip,
} from "lucide-react";
import { useProductContext } from "@/contexts/ProductContext";
import { useEntities, useCreateEntity } from "@/hooks/useEntities";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";
import { formatDistanceToNow } from "date-fns";
import type { Entity } from "@/lib/types";

const ARTIFACT_TYPE_CONFIG: Record<string, { icon: React.ElementType; label: string }> = {
  link: { icon: Link2, label: "Link" },
  image: { icon: Image, label: "Image" },
  note: { icon: StickyNote, label: "Note" },
  file: { icon: FileText, label: "File" },
  query: { icon: FileText, label: "Query" },
};

const STATUS_COLORS: Record<string, string> = {
  draft: "bg-gray-500/10 text-gray-600 border-gray-500/20",
  final: "bg-green-500/10 text-green-600 border-green-500/20",
  archived: "bg-gray-500/10 text-gray-500 border-gray-500/20",
};

type TabValue = "all" | "link" | "image" | "note";

export default function EvidencePage() {
  const { productId } = useParams<{ productId: string }>();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { setCurrentProduct } = useProductContext();
  const { data: entities, isLoading } = useEntities(productId);
  const createEntity = useCreateEntity();
  const { toast } = useToast();

  const [search, setSearch] = useState("");
  const filterParam = searchParams.get("filter") as TabValue | null;
  const [activeTab, setActiveTab] = useState<TabValue>(filterParam || "all");

  useEffect(() => {
    if (productId) setCurrentProduct(productId);
  }, [productId, setCurrentProduct]);

  useEffect(() => {
    if (filterParam && filterParam !== activeTab) {
      setActiveTab(filterParam);
    }
  }, [filterParam]);

  const handleTabChange = (value: string) => {
    setActiveTab(value as TabValue);
    if (value === "all") {
      searchParams.delete("filter");
    } else {
      searchParams.set("filter", value);
    }
    setSearchParams(searchParams);
  };

  const filteredEntities = useMemo(() => {
    if (!entities) return [];
    
    return entities
      .filter((e) => {
        if (e.type !== "artifact") return false;
        const artifactType = e.metadata?.artifactType;
        if (activeTab !== "all" && artifactType !== activeTab) return false;
        if (search) {
          const searchLower = search.toLowerCase();
          return (
            e.title.toLowerCase().includes(searchLower) ||
            e.body.toLowerCase().includes(searchLower)
          );
        }
        return true;
      })
      .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
  }, [entities, activeTab, search]);

  const counts = useMemo(() => {
    if (!entities) return { all: 0, link: 0, image: 0, note: 0 };
    
    const artifacts = entities.filter((e) => e.type === "artifact");

    return {
      all: artifacts.length,
      link: artifacts.filter((e) => e.metadata?.artifactType === "link").length,
      image: artifacts.filter((e) => e.metadata?.artifactType === "image").length,
      note: artifacts.filter((e) => e.metadata?.artifactType === "note").length,
    };
  }, [entities]);

  const handleCreate = async (artifactType: string) => {
    if (!productId) return;
    try {
      const newEntity = await createEntity.mutateAsync({
        productId,
        type: "artifact",
        title: `New ${ARTIFACT_TYPE_CONFIG[artifactType]?.label || "Artifact"}`,
        status: "draft",
        metadata: { artifactType },
      });
      navigate(`/product/${productId}/artifacts/${newEntity.id}`);
    } catch {
      toast({
        title: "Error",
        description: "Failed to create artifact.",
        variant: "destructive",
      });
    }
  };

  if (isLoading) {
    return (
      <div className="page-container">
        <Skeleton className="mb-6 h-8 w-48" />
        <Skeleton className="mb-4 h-10 w-full max-w-sm" />
        <div className="space-y-2">
          {[...Array(5)].map((_, i) => (
            <Skeleton key={i} className="h-16 w-full" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="page-container">
      <div className="page-header">
        <div className="page-header-row">
          <div>
            <h1 className="flex items-center gap-2 text-lg font-semibold">
              <Paperclip className="h-5 w-5 text-muted-foreground" />
              Evidence
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Artifacts, links, and notes
            </p>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button size="sm" className="gap-1.5">
                <Plus className="h-4 w-4" />
                New
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => handleCreate("link")} className="gap-2">
                <Link2 className="h-4 w-4" />
                Link
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleCreate("image")} className="gap-2">
                <Image className="h-4 w-4" />
                Image
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleCreate("note")} className="gap-2">
                <StickyNote className="h-4 w-4" />
                Note
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Search & Tabs */}
      <div className="mb-6 space-y-4">
        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search evidence..."
            className="pl-9"
          />
        </div>

        <Tabs value={activeTab} onValueChange={handleTabChange}>
          <TabsList>
            <TabsTrigger value="all" className="gap-1.5">
              All
              <Badge variant="secondary" className="ml-1 text-[10px]">
                {counts.all}
              </Badge>
            </TabsTrigger>
            <TabsTrigger value="link" className="gap-1.5">
              <Link2 className="h-3.5 w-3.5" />
              Links
              <Badge variant="secondary" className="ml-1 text-[10px]">
                {counts.link}
              </Badge>
            </TabsTrigger>
            <TabsTrigger value="image" className="gap-1.5">
              <Image className="h-3.5 w-3.5" />
              Images
              <Badge variant="secondary" className="ml-1 text-[10px]">
                {counts.image}
              </Badge>
            </TabsTrigger>
            <TabsTrigger value="note" className="gap-1.5">
              <StickyNote className="h-3.5 w-3.5" />
              Notes
              <Badge variant="secondary" className="ml-1 text-[10px]">
                {counts.note}
              </Badge>
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* List */}
      {filteredEntities.length === 0 ? (
        <div className="py-16 text-center">
          <Paperclip className="mx-auto h-10 w-10 text-muted-foreground/50" />
          <p className="mt-3 text-sm text-muted-foreground">
            {search ? "No items match your search." : "No evidence yet."}
          </p>
          <div className="mt-4 flex flex-wrap justify-center gap-2">
            <Button variant="outline" size="sm" onClick={() => handleCreate("link")} className="gap-1.5">
              <Link2 className="h-3.5 w-3.5" />
              Add Link
            </Button>
            <Button variant="outline" size="sm" onClick={() => handleCreate("note")} className="gap-1.5">
              <StickyNote className="h-3.5 w-3.5" />
              Add Note
            </Button>
          </div>
        </div>
      ) : (
        <div className="space-y-1">
          {filteredEntities.map((entity) => {
            const artifactType = entity.metadata?.artifactType || "note";
            const config = ARTIFACT_TYPE_CONFIG[artifactType] || ARTIFACT_TYPE_CONFIG.note;
            const Icon = config.icon;
            return (
              <Link
                key={entity.id}
                to={`/product/${productId}/artifacts/${entity.id}`}
                className="group flex items-center gap-3 rounded-lg border border-transparent px-3 py-2.5 transition-colors hover:border-border/50 hover:bg-muted/50"
              >
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
                  <Icon className="h-4 w-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-foreground">
                    {entity.title || "Untitled"}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {config.label} · {formatDistanceToNow(new Date(entity.updatedAt), { addSuffix: true })}
                  </p>
                </div>
                {entity.status && (
                  <Badge
                    variant="outline"
                    className={`text-[10px] capitalize ${STATUS_COLORS[entity.status] || ""}`}
                  >
                    {entity.status}
                  </Badge>
                )}
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
