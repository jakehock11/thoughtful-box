import { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Package, ArrowLeft, Trash2, Link2, Plus } from 'lucide-react';
import { useProductContext } from '@/contexts/ProductContext';
import { useEntity, useUpdateEntity, useDeleteEntity } from '@/hooks/useEntities';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { DatePicker } from '@/components/ui/date-picker';
import { RichTextEditor } from '@/components/editor';
import { ContextTagsPicker } from '@/components/taxonomy';
import { LinkToModal, LinkedItems } from '@/components/linking';
import { useToast } from '@/hooks/use-toast';
import { format, formatDistanceToNow } from 'date-fns';
import { nanoid } from 'nanoid';
import type { FeatureStatus, FeatureHealth, FeatureCheckIn } from '@/lib/types';

const STATUSES: { value: FeatureStatus; label: string }[] = [
  { value: 'building', label: 'Building' },
  { value: 'shipped', label: 'Shipped' },
  { value: 'monitoring', label: 'Monitoring' },
  { value: 'stable', label: 'Stable' },
  { value: 'deprecated', label: 'Deprecated' },
];

const HEALTH_OPTIONS: { value: FeatureHealth; label: string; color: string }[] = [
  { value: 'healthy', label: 'Healthy', color: 'bg-green-500' },
  { value: 'needs_attention', label: 'Needs Attention', color: 'bg-yellow-500' },
  { value: 'underperforming', label: 'Underperforming', color: 'bg-red-500' },
];

const STATUS_COLORS: Record<FeatureStatus, string> = {
  building: 'bg-blue-500/10 text-blue-600 border-blue-500/20',
  shipped: 'bg-green-500/10 text-green-600 border-green-500/20',
  monitoring: 'bg-purple-500/10 text-purple-600 border-purple-500/20',
  stable: 'bg-green-500/10 text-green-600 border-green-500/20',
  deprecated: 'bg-gray-500/10 text-gray-500 border-gray-500/20',
};

const HEALTH_COLORS: Record<FeatureHealth, string> = {
  healthy: 'bg-green-500',
  needs_attention: 'bg-yellow-500',
  underperforming: 'bg-red-500',
};

export default function FeatureDetailPage() {
  const { productId, id } = useParams<{ productId: string; id: string }>();
  const navigate = useNavigate();
  const { setCurrentProduct } = useProductContext();
  const { data: entity, isLoading } = useEntity(id);
  const updateEntity = useUpdateEntity();
  const deleteEntity = useDeleteEntity();
  const { toast } = useToast();

  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [status, setStatus] = useState<FeatureStatus>('building');
  const [health, setHealth] = useState<FeatureHealth>('healthy');
  const [shippedAt, setShippedAt] = useState('');
  const [checkIns, setCheckIns] = useState<FeatureCheckIn[]>([]);
  const [personaIds, setPersonaIds] = useState<string[]>([]);
  const [featureIds, setFeatureIds] = useState<string[]>([]);
  const [dimensionValueIds, setDimensionValueIds] = useState<string[]>([]);
  const [linkModalOpen, setLinkModalOpen] = useState(false);
  const [checkInModalOpen, setCheckInModalOpen] = useState(false);
  const [newCheckInHealth, setNewCheckInHealth] = useState<FeatureHealth>('healthy');
  const [newCheckInNotes, setNewCheckInNotes] = useState('');

  useEffect(() => {
    if (productId) setCurrentProduct(productId);
  }, [productId, setCurrentProduct]);

  useEffect(() => {
    if (entity) {
      setTitle(entity.title || '');
      setBody(entity.body || '');
      setStatus((entity.status as FeatureStatus) || 'building');
      setHealth((entity.metadata?.health as FeatureHealth) || 'healthy');
      setShippedAt(entity.metadata?.shippedAt || '');
      setCheckIns(entity.metadata?.checkIns || []);
      setPersonaIds(entity.personaIds || []);
      setFeatureIds(entity.featureIds || []);
      setDimensionValueIds(entity.dimensionValueIds || []);
    }
  }, [entity]);

  const debouncedSave = useCallback(
    (data: Parameters<typeof updateEntity.mutateAsync>[0]['data']) => {
      if (!id) return;
      updateEntity.mutate({ id, data });
    },
    [id, updateEntity]
  );

  const handleTitleChange = (value: string) => {
    setTitle(value);
    debouncedSave({ title: value });
  };

  const handleBodyChange = (value: string) => {
    setBody(value);
    debouncedSave({ body: value });
  };

  const handleStatusChange = (value: FeatureStatus) => {
    setStatus(value);
    debouncedSave({ status: value });
  };

  const handleHealthChange = (value: FeatureHealth) => {
    setHealth(value);
    debouncedSave({ metadata: { ...entity?.metadata, health: value } });
  };

  const handleShippedAtChange = (value: string) => {
    setShippedAt(value);
    debouncedSave({ metadata: { ...entity?.metadata, shippedAt: value } });
  };

  const handleAddCheckIn = () => {
    const newCheckIn: FeatureCheckIn = {
      id: nanoid(),
      date: new Date().toISOString(),
      health: newCheckInHealth,
      notes: newCheckInNotes,
    };
    const updatedCheckIns = [newCheckIn, ...checkIns];
    setCheckIns(updatedCheckIns);
    setHealth(newCheckInHealth); // Update current health to match latest check-in
    debouncedSave({
      metadata: {
        ...entity?.metadata,
        health: newCheckInHealth,
        checkIns: updatedCheckIns,
      },
    });
    setCheckInModalOpen(false);
    setNewCheckInHealth('healthy');
    setNewCheckInNotes('');
    toast({ title: 'Check-in added', description: 'Feature health has been updated.' });
  };

  const handleDelete = async () => {
    if (!id) return;
    try {
      await deleteEntity.mutateAsync(id);
      toast({ title: 'Deleted', description: 'Feature has been deleted.' });
      navigate(`/product/${productId}/work`);
    } catch {
      toast({ title: 'Error', description: 'Failed to delete feature.', variant: 'destructive' });
    }
  };

  const handleSave = async () => {
    if (!id) return;
    try {
      await updateEntity.mutateAsync({
        id,
        data: {
          title,
          body,
          status,
          personaIds,
          featureIds,
          dimensionValueIds,
          metadata: { health, shippedAt, checkIns },
        },
      });
      toast({ title: 'Saved', description: 'Feature has been saved.' });
      navigate(`/product/${productId}/work`);
    } catch {
      toast({ title: 'Error', description: 'Failed to save feature.', variant: 'destructive' });
    }
  };

  if (isLoading) {
    return (
      <div className="page-container">
        <Skeleton className="mb-6 h-8 w-48" />
        <div className="space-y-4">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-40 w-full" />
        </div>
      </div>
    );
  }

  if (!entity) {
    return (
      <div className="page-container flex items-center justify-center py-16">
        <p className="text-sm text-muted-foreground">Feature not found</p>
      </div>
    );
  }

  return (
    <div className="page-container">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate(`/product/${productId}/work`)}
            className="h-8 w-8"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="flex items-center gap-2">
            <Package className="h-5 w-5 text-indigo-500" />
            <span className="text-sm font-medium text-muted-foreground">Feature</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
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
                <AlertDialogTitle>Delete feature?</AlertDialogTitle>
                <AlertDialogDescription>This action cannot be undone.</AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleDelete}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >
                  Delete
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
          <Button size="sm" onClick={handleSave}>
            Save
          </Button>
        </div>
      </div>

      <div className="mx-auto max-w-2xl space-y-6">
        {/* Title */}
        <Input
          value={title}
          onChange={(e) => handleTitleChange(e.target.value)}
          placeholder="Feature name..."
          className="border-0 bg-transparent px-0 text-xl font-semibold placeholder:text-muted-foreground/50 focus-visible:ring-0"
        />

        {/* Metadata Row */}
        <div className="flex flex-wrap items-end gap-4">
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Status</Label>
            <Select value={status} onValueChange={handleStatusChange}>
              <SelectTrigger className="w-32 h-9">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {STATUSES.map((s) => (
                  <SelectItem key={s.value} value={s.value}>
                    <Badge variant="outline" className={`${STATUS_COLORS[s.value]} border-0`}>
                      {s.label}
                    </Badge>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Health</Label>
            <div className="flex items-center gap-2 h-9">
              <div className={`h-3 w-3 rounded-full ${HEALTH_COLORS[health]}`} />
              <Select value={health} onValueChange={handleHealthChange}>
                <SelectTrigger className="w-36 border-0 bg-transparent p-0 h-auto font-medium text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {HEALTH_OPTIONS.map((h) => (
                    <SelectItem key={h.value} value={h.value}>
                      <div className="flex items-center gap-2">
                        <div className={`h-2 w-2 rounded-full ${h.color}`} />
                        {h.label}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Shipped Date</Label>
            <DatePicker
              value={shippedAt ? new Date(shippedAt) : undefined}
              onChange={(date) => handleShippedAtChange(date ? date.toISOString() : '')}
              placeholder="Select date"
            />
          </div>
        </div>

        {/* Body */}
        <div className="space-y-2">
          <Label className="text-xs text-muted-foreground">Description</Label>
          <RichTextEditor
            content={body}
            onChange={handleBodyChange}
            placeholder="Describe the feature..."
          />
        </div>

        {/* Check-ins Section */}
        <Card className="border-border/50">
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <CardTitle className="text-sm font-medium">Health Check-ins</CardTitle>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCheckInModalOpen(true)}
              className="h-7 gap-1.5 text-xs"
            >
              <Plus className="h-3 w-3" />
              Add Check-in
            </Button>
          </CardHeader>
          <CardContent>
            {checkIns.length === 0 ? (
              <p className="py-4 text-center text-xs text-muted-foreground">
                No check-ins yet. Add one to track feature health over time.
              </p>
            ) : (
              <div className="space-y-3">
                {checkIns.map((checkIn) => (
                  <div
                    key={checkIn.id}
                    className="flex items-start gap-3 rounded-lg border border-border/50 p-3"
                  >
                    <div
                      className={`mt-1 h-2.5 w-2.5 shrink-0 rounded-full ${HEALTH_COLORS[checkIn.health]}`}
                    />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-medium capitalize">
                          {checkIn.health.replace('_', ' ')}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {formatDistanceToNow(new Date(checkIn.date), { addSuffix: true })}
                        </span>
                      </div>
                      {checkIn.notes && (
                        <p className="mt-1 text-sm text-muted-foreground">{checkIn.notes}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Context Tags */}
        {productId && (
          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">Context Tags</Label>
            <ContextTagsPicker
              productId={productId}
              personaIds={personaIds}
              featureIds={featureIds}
              dimensionValueIds={dimensionValueIds}
              onPersonasChange={(ids) => {
                setPersonaIds(ids);
                debouncedSave({ personaIds: ids });
              }}
              onFeaturesChange={(ids) => {
                setFeatureIds(ids);
                debouncedSave({ featureIds: ids });
              }}
              onDimensionValueIdsChange={(ids) => {
                setDimensionValueIds(ids);
                debouncedSave({ dimensionValueIds: ids });
              }}
            />
          </div>
        )}

        {/* Linked Items */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label className="text-xs text-muted-foreground">Linked Items</Label>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setLinkModalOpen(true)}
              className="h-7 gap-1.5 text-xs"
            >
              <Link2 className="h-3 w-3" />
              Link
            </Button>
          </div>
          <LinkedItems
            entityId={id!}
            onOpenLink={(entityId, entityType) => {
              const routes: Record<string, string> = {
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
              navigate(`/product/${productId}/${routes[entityType]}/${entityId}`);
            }}
          />
        </div>
      </div>

      {/* Link Modal */}
      {productId && id && (
        <LinkToModal
          open={linkModalOpen}
          onOpenChange={setLinkModalOpen}
          productId={productId}
          currentEntityId={id}
        />
      )}

      {/* Check-in Modal */}
      <Dialog open={checkInModalOpen} onOpenChange={setCheckInModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-base font-semibold">Add Health Check-in</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label className="text-sm">Health Status</Label>
              <Select
                value={newCheckInHealth}
                onValueChange={(v) => setNewCheckInHealth(v as FeatureHealth)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {HEALTH_OPTIONS.map((h) => (
                    <SelectItem key={h.value} value={h.value}>
                      <div className="flex items-center gap-2">
                        <div className={`h-2 w-2 rounded-full ${h.color}`} />
                        {h.label}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="text-sm">Notes (optional)</Label>
              <Textarea
                value={newCheckInNotes}
                onChange={(e) => setNewCheckInNotes(e.target.value)}
                placeholder="What's happening with this feature?"
                className="min-h-[80px] resize-none"
              />
            </div>
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" size="sm" onClick={() => setCheckInModalOpen(false)}>
              Cancel
            </Button>
            <Button size="sm" onClick={handleAddCheckIn}>
              Add Check-in
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
