import { useEffect, useState, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Trash2, Link as LinkIcon, Save, Check, Loader2 } from 'lucide-react';
import { useProductContext } from '@/contexts/ProductContext';
import { useEntity, useUpdateEntity, useDeleteEntity } from '@/hooks/useEntities';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
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
} from '@/components/ui/alert-dialog';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { DatePicker } from '@/components/ui/date-picker';
import { RichTextEditor } from '@/components/editor';
import { ContextTagsPicker } from '@/components/taxonomy';
import { LinkToModal, LinkedItems } from '@/components/linking';
import { FilePath } from '@/components/entity/FilePath';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import type { DecisionType, EntityType } from '@/lib/types';

const DECISION_TYPE_OPTIONS: { value: DecisionType; label: string }[] = [
  { value: 'reversible', label: 'Reversible' },
  { value: 'irreversible', label: 'Irreversible' },
];

export default function DecisionDetailPage() {
  const { productId, id } = useParams<{ productId: string; id: string }>();
  const navigate = useNavigate();
  const { setCurrentProduct } = useProductContext();
  const { data: entity, isLoading } = useEntity(id);
  const updateEntity = useUpdateEntity();
  const deleteEntity = useDeleteEntity();
  const { toast } = useToast();

  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [decisionType, setDecisionType] = useState<DecisionType | undefined>();
  const [decidedAt, setDecidedAt] = useState<string | undefined>();
  const [revisitAt, setRevisitAt] = useState<string | undefined>();
  const [personaIds, setPersonaIds] = useState<string[]>([]);
  const [featureIds, setFeatureIds] = useState<string[]>([]);
  const [dimensionValueIds, setDimensionValueIds] = useState<string[]>([]);
  const [linkModalOpen, setLinkModalOpen] = useState(false);
  const [tagsOpen, setTagsOpen] = useState(true);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const savedTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (productId) setCurrentProduct(productId);
  }, [productId, setCurrentProduct]);

  useEffect(() => {
    if (entity && entity.type === 'decision') {
      setTitle(entity.title);
      setBody(entity.body);
      setDecisionType(entity.metadata?.decisionType);
      setDecidedAt(entity.metadata?.decidedAt);
      setRevisitAt(entity.metadata?.revisitAt);
      setPersonaIds(entity.personaIds || []);
      setFeatureIds(entity.featureIds || []);
      setDimensionValueIds(entity.dimensionValueIds || []);
    }
  }, [entity]);

  const handleSave = useCallback(
    async (navigateAfter = false) => {
      if (!entity || entity.type !== 'decision' || !id) return;
      setSaveStatus('saving');
      try {
        await updateEntity.mutateAsync({
          id,
          data: {
            title,
            body,
            personaIds,
            featureIds,
            dimensionValueIds,
            metadata: {
              ...entity.metadata,
              decisionType,
              decidedAt,
              revisitAt,
            },
          },
        });
        setSaveStatus('saved');
        if (navigateAfter) {
          navigate(`/product/${productId}/decisions`);
        } else {
          if (savedTimeoutRef.current) clearTimeout(savedTimeoutRef.current);
          savedTimeoutRef.current = setTimeout(() => setSaveStatus('idle'), 2000);
        }
      } catch {
        setSaveStatus('idle');
        toast({ title: 'Error', description: 'Failed to save.', variant: 'destructive' });
      }
    },
    [
      entity,
      id,
      title,
      body,
      decisionType,
      decidedAt,
      revisitAt,
      personaIds,
      featureIds,
      dimensionValueIds,
      updateEntity,
      toast,
      navigate,
      productId,
    ]
  );

  useEffect(() => {
    if (!entity) return;
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    saveTimeoutRef.current = setTimeout(() => handleSave(false), 1000);
    return () => {
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    };
  }, [title, body, decisionType, decidedAt, revisitAt, personaIds, featureIds, dimensionValueIds]);

  const handleDelete = async () => {
    if (!id) return;
    try {
      await deleteEntity.mutateAsync(id);
      toast({ title: 'Deleted' });
      navigate(`/product/${productId}/decisions`);
    } catch {
      toast({ title: 'Error', variant: 'destructive' });
    }
  };

  const handleOpenLink = (entityId: string, entityType: EntityType) => {
    const pathMap: Record<EntityType, string> = {
      problem: 'problems',
      hypothesis: 'hypotheses',
      experiment: 'experiments',
      decision: 'decisions',
      artifact: 'artifacts',
      capture: 'captures',
      feedback: 'feedback',
      feature_request: 'feature-requests',
      feature: 'features',
    };
    navigate(`/product/${productId}/${pathMap[entityType]}/${entityId}`);
  };

  if (isLoading) {
    return (
      <div className="page-container">
        <Skeleton className="mb-4 h-8 w-24" />
        <Skeleton className="mb-4 h-10 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (!entity || entity.type !== 'decision') {
    return <div className="page-container text-sm text-muted-foreground">Decision not found</div>;
  }

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border px-6 py-3">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate(`/product/${productId}/decisions`)}
          className="gap-2 text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          <span className="text-sm">Decisions</span>
        </Button>
        <div className="flex items-center gap-2">
          {saveStatus === 'saving' && (
            <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Loader2 className="h-3 w-3 animate-spin" />
              Saving...
            </span>
          )}
          {saveStatus === 'saved' && (
            <span className="flex items-center gap-1.5 text-xs text-primary">
              <Check className="h-3 w-3" />
              Saved
            </span>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleSave(true)}
            disabled={saveStatus === 'saving'}
            className="gap-2"
          >
            <Save className="h-3.5 w-3.5" />
            Save
          </Button>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-muted-foreground hover:text-destructive"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete decision?</AlertDialogTitle>
                <AlertDialogDescription className="text-sm">
                  This action cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleDelete}>Delete</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto scrollbar-thin p-6">
        <div className="content-max-width space-y-5">
          {/* Title */}
          <div>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Decision title..."
              className="border-none bg-transparent text-xl font-semibold tracking-tight shadow-none focus-visible:ring-0 px-0 h-auto py-1"
            />
            {id && <FilePath entityId={id} />}
          </div>

          {/* Type & Decided Date */}
          <div className="flex flex-wrap items-end gap-4">
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Type</Label>
              <Select
                value={decisionType || ''}
                onValueChange={(v) => setDecisionType(v as DecisionType)}
              >
                <SelectTrigger className="w-28 h-8 text-sm">
                  <SelectValue placeholder="Select..." />
                </SelectTrigger>
                <SelectContent>
                  {DECISION_TYPE_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Decided</Label>
              <DatePicker
                value={decidedAt ? new Date(decidedAt) : undefined}
                onChange={(date) => setDecidedAt(date ? date.toISOString() : undefined)}
                placeholder="Select date"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Revisit Date</Label>
              <DatePicker
                value={revisitAt ? new Date(revisitAt) : undefined}
                onChange={(date) => setRevisitAt(date ? date.toISOString() : undefined)}
                placeholder="Select date"
              />
            </div>

            <Badge variant="outline" className="text-xs font-medium">
              Decision
            </Badge>
          </div>

          {/* Context Tags */}
          <Collapsible open={tagsOpen} onOpenChange={setTagsOpen}>
            <CollapsibleTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="mb-2 gap-2 text-sm font-medium text-muted-foreground hover:text-foreground"
              >
                Context Tags
                <Badge variant="secondary" className="ml-1 text-[11px]">
                  {personaIds.length + featureIds.length + dimensionValueIds.length}
                </Badge>
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <div className="rounded-lg border border-border bg-accent/30 p-4">
                <ContextTagsPicker
                  productId={productId!}
                  personaIds={personaIds}
                  featureIds={featureIds}
                  dimensionValueIds={dimensionValueIds}
                  onPersonasChange={setPersonaIds}
                  onFeaturesChange={setFeatureIds}
                  onDimensionValueIdsChange={setDimensionValueIds}
                />
              </div>
            </CollapsibleContent>
          </Collapsible>

          {/* Body Editor */}
          <RichTextEditor
            content={body}
            onChange={setBody}
            placeholder="Document what was decided and the rationale..."
          />

          {/* Linked Items */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-medium text-foreground">Linked Items</h3>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setLinkModalOpen(true)}
                className="gap-2"
              >
                <LinkIcon className="h-3.5 w-3.5" />
                Link to...
              </Button>
            </div>
            <LinkedItems entityId={id!} onOpenLink={handleOpenLink} />
          </div>
        </div>
      </div>

      <LinkToModal
        open={linkModalOpen}
        onOpenChange={setLinkModalOpen}
        productId={productId!}
        currentEntityId={id!}
      />
    </div>
  );
}
