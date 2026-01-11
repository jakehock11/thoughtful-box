import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Plus, Layers, MoreHorizontal, Pencil, Trash2 } from 'lucide-react';
import { useProducts, useDeleteProduct, useUpdateProduct } from '@/hooks/useProducts';
import { useProductContext } from '@/contexts/ProductContext';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Skeleton } from '@/components/ui/skeleton';
import { CreateProductModal } from '@/components/products/CreateProductModal';
import { useToast } from '@/hooks/use-toast';
import { formatDistanceToNow } from 'date-fns';
import type { Product } from '@/lib/types';

export default function ProductsHome() {
  const location = useLocation();
  const navigate = useNavigate();
  const { data: products, isLoading } = useProducts();
  const { enterProduct } = useProductContext();
  const deleteProduct = useDeleteProduct();
  const updateProduct = useUpdateProduct();
  const { toast } = useToast();

  const [createOpen, setCreateOpen] = useState(false);
  const [editProduct, setEditProduct] = useState<Product | null>(null);
  const [deleteProductId, setDeleteProductId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editDescription, setEditDescription] = useState('');

  // Handle openCreate state from navigation
  useEffect(() => {
    if (location.state?.openCreate) {
      setCreateOpen(true);
      // Clear the state
      navigate(location.pathname, { replace: true, state: {} });
    }
  }, [location.state, navigate, location.pathname]);

  const handleEditClick = (e: React.MouseEvent, product: Product) => {
    e.stopPropagation();
    setEditProduct(product);
    setEditName(product.name);
    setEditDescription(product.description || '');
  };

  const handleDeleteClick = (e: React.MouseEvent, productId: string) => {
    e.stopPropagation();
    setDeleteProductId(productId);
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editProduct || !editName.trim()) return;

    try {
      await updateProduct.mutateAsync({
        id: editProduct.id,
        data: {
          name: editName.trim(),
          description: editDescription.trim() || undefined,
        },
      });

      toast({
        title: 'Product updated',
        description: `${editName} has been updated.`,
      });

      setEditProduct(null);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to update product.',
        variant: 'destructive',
      });
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deleteProductId) return;

    const product = products?.find((p) => p.id === deleteProductId);

    try {
      await deleteProduct.mutateAsync(deleteProductId);

      toast({
        title: 'Product deleted',
        description: product ? `${product.name} has been deleted.` : 'Product deleted.',
      });

      setDeleteProductId(null);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to delete product.',
        variant: 'destructive',
      });
    }
  };

  // Get initials from product name
  const getInitials = (name: string): string => {
    return name.slice(0, 2).toUpperCase();
  };

  const hasProducts = products && products.length > 0;

  if (isLoading) {
    return (
      <div className="p-8">
        <Skeleton className="mb-8 h-10 w-48" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Skeleton className="h-40 rounded-lg" />
          <Skeleton className="h-40 rounded-lg" />
        </div>
      </div>
    );
  }

  return (
    <div className="page-container flex min-h-full flex-col">
      {hasProducts ? (
        <>
          {/* Header */}
          <div className="page-header page-header-row">
            <div>
              <h1 className="text-page-title">Products</h1>
              <p className="mt-1 text-meta">Select a product to manage its thinking system</p>
            </div>
            <Button onClick={() => setCreateOpen(true)} size="sm" className="gap-2 shadow-sm">
              <Plus className="h-4 w-4" />
              Create Product
            </Button>
          </div>

          {/* Product Grid */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {products.map((product) => (
              <Card
                key={product.id}
                className="cursor-pointer shadow-sm transition-all duration-150 hover:shadow-md hover:border-primary/25 group"
                onClick={() => enterProduct(product.id)}
              >
                <CardHeader className="pb-2 pt-4 px-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-secondary text-xs font-semibold uppercase text-secondary-foreground flex-shrink-0">
                      {product.icon ? (
                        <img
                          src={product.icon}
                          alt={product.name}
                          className="h-full w-full rounded-lg object-cover"
                        />
                      ) : (
                        <span className="tracking-tight">{getInitials(product.name)}</span>
                      )}
                    </div>
                    <div className="flex-1 overflow-hidden">
                      <CardTitle className="truncate text-sm font-medium">
                        {product.name}
                      </CardTitle>
                      <CardDescription className="text-[11px] mt-0.5">
                        Last activity{' '}
                        {formatDistanceToNow(new Date(product.lastActivityAt), {
                          addSuffix: true,
                        })}
                      </CardDescription>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={(e) => handleEditClick(e, product)}>
                          <Pencil className="mr-2 h-4 w-4" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          onClick={(e) => handleDeleteClick(e, product.id)}
                          className="text-destructive focus:text-destructive"
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </CardHeader>
                <CardContent className="px-4 pb-4">
                  {product.description ? (
                    <p className="text-[12px] text-muted-foreground line-clamp-2">
                      {product.description}
                    </p>
                  ) : (
                    <p className="text-[12px] text-muted-foreground/50 italic">No description</p>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </>
      ) : (
        /* Empty State */
        <div className="flex flex-1 flex-col items-center justify-center text-center">
          <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10">
            <Layers className="h-8 w-8 text-primary" />
          </div>
          <h1 className="mb-2 text-xl font-semibold text-foreground">Create your first product</h1>
          <p className="mb-8 max-w-md text-sm text-muted-foreground">
            Product OS helps you capture and connect your product thinking—problems, hypotheses,
            experiments, and decisions—all in one place.
          </p>
          <Button onClick={() => setCreateOpen(true)} size="default" className="gap-2 shadow-sm">
            <Plus className="h-4 w-4" />
            Create Product
          </Button>
        </div>
      )}

      {/* Create Product Modal */}
      <CreateProductModal open={createOpen} onOpenChange={setCreateOpen} />

      {/* Edit Product Modal */}
      <Dialog open={!!editProduct} onOpenChange={(open) => !open && setEditProduct(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
              <Pencil className="h-5 w-5 text-primary" />
            </div>
            <DialogTitle className="text-base font-semibold">Edit product</DialogTitle>
            <DialogDescription className="text-sm">
              Update your product's name and description.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleEditSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="edit-name" className="text-sm">
                Product name
              </Label>
              <Input
                id="edit-name"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                placeholder="e.g., SidelineHD, MLBU"
                className="h-9"
                autoFocus
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-description" className="text-sm">
                Description (optional)
              </Label>
              <Textarea
                id="edit-description"
                value={editDescription}
                onChange={(e) => setEditDescription(e.target.value)}
                placeholder="What is this product about?"
                className="min-h-[80px] resize-none"
              />
            </div>

            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" size="sm" onClick={() => setEditProduct(null)}>
                Cancel
              </Button>
              <Button type="submit" size="sm" disabled={!editName.trim() || updateProduct.isPending}>
                {updateProduct.isPending ? 'Saving...' : 'Save'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteProductId} onOpenChange={(open) => !open && setDeleteProductId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete product?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this product and all of its entities, taxonomy, and
              relationships. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteProduct.isPending ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
