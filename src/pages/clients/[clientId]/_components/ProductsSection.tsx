import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api.js";
import type { Id } from "@/convex/_generated/dataModel.d.ts";
import { Button } from "@/components/ui/button.tsx";
import { Input } from "@/components/ui/input.tsx";
import { Textarea } from "@/components/ui/textarea.tsx";
import { Label } from "@/components/ui/label.tsx";
import { Skeleton } from "@/components/ui/skeleton.tsx";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog.tsx";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, ShoppingBag, CheckCircle2, XCircle } from "lucide-react";

export default function ProductsSection({ clientId }: { clientId: Id<"clients"> }) {
  const products = useQuery(api.products.listByClient, { clientId });
  const createProduct = useMutation(api.products.create);
  const updateProduct = useMutation(api.products.update);
  const deleteProduct = useMutation(api.products.remove);

  const [showDialog, setShowDialog] = useState(false);
  const [editingId, setEditingId] = useState<Id<"products_services"> | null>(null);
  const [form, setForm] = useState({
    name: "",
    category: "",
    description: "",
    price: "",
    promotionalPrice: "",
    cta: "",
  });
  const [saving, setSaving] = useState(false);

  const openCreate = () => {
    setEditingId(null);
    setForm({ name: "", category: "", description: "", price: "", promotionalPrice: "", cta: "" });
    setShowDialog(true);
  };

  const openEdit = (p: { _id: Id<"products_services">; name: string; category?: string; description?: string; price?: string; promotionalPrice?: string; cta?: string }) => {
    setEditingId(p._id);
    setForm({
      name: p.name,
      category: p.category ?? "",
      description: p.description ?? "",
      price: p.price ?? "",
      promotionalPrice: p.promotionalPrice ?? "",
      cta: p.cta ?? "",
    });
    setShowDialog(true);
  };

  const handleSave = async () => {
    if (!form.name.trim()) return;
    setSaving(true);
    try {
      if (editingId) {
        await updateProduct({ productId: editingId, ...form });
        toast.success("Product updated");
      } else {
        await createProduct({ clientId, ...form });
        toast.success("Product created");
      }
      setShowDialog(false);
    } catch {
      toast.error("Failed to save product");
    } finally {
      setSaving(false);
    }
  };

  const handleToggleActive = async (id: Id<"products_services">, current: boolean) => {
    await updateProduct({ productId: id, isActive: !current });
  };

  const handleDelete = async (id: Id<"products_services">) => {
    await deleteProduct({ productId: id });
    toast.success("Product removed");
  };

  if (products === undefined) return <Skeleton className="h-64 w-full" />;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-base font-heading font-semibold text-foreground">
          Products & Services
        </h2>
        <Button onClick={openCreate} className="gap-2" size="sm">
          <Plus size={14} />
          Add Product / Service
        </Button>
      </div>

      {products.length === 0 ? (
        <div className="bg-card border border-border rounded-lg p-8 text-center">
          <ShoppingBag size={32} className="mx-auto text-muted-foreground/30 mb-3" />
          <p className="text-sm text-muted-foreground">No products or services added yet</p>
          <Button onClick={openCreate} size="sm" className="mt-3 gap-2">
            <Plus size={14} />
            Add First Product
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          {products.map((p) => (
            <div
              key={p._id}
              className="bg-card border border-border rounded-lg p-4 flex items-start gap-4"
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <p className="font-medium text-sm text-foreground">{p.name}</p>
                  {p.category && (
                    <span className="text-xs bg-secondary text-secondary-foreground px-2 py-0.5 rounded-full">
                      {p.category}
                    </span>
                  )}
                  {p.isActive ? (
                    <span className="text-xs flex items-center gap-0.5 text-green-400">
                      <CheckCircle2 size={10} /> Active
                    </span>
                  ) : (
                    <span className="text-xs flex items-center gap-0.5 text-muted-foreground">
                      <XCircle size={10} /> Inactive
                    </span>
                  )}
                </div>
                {p.description && (
                  <p className="text-xs text-muted-foreground line-clamp-2">{p.description}</p>
                )}
                <div className="flex gap-3 mt-1">
                  {p.price && <span className="text-xs text-primary">MVR {p.price}</span>}
                  {p.promotionalPrice && (
                    <span className="text-xs text-green-400">Promo: MVR {p.promotionalPrice}</span>
                  )}
                  {p.cta && <span className="text-xs text-muted-foreground">CTA: {p.cta}</span>}
                </div>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleToggleActive(p._id, p.isActive)}
                  className="text-xs"
                >
                  {p.isActive ? "Deactivate" : "Activate"}
                </Button>
                <Button variant="ghost" size="sm" onClick={() => openEdit(p)}>
                  <Pencil size={13} />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleDelete(p._id)}
                  className="text-destructive hover:text-destructive"
                >
                  <Trash2 size={13} />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="font-heading">
              {editingId ? "Edit Product / Service" : "Add Product / Service"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2 max-h-96 overflow-y-auto pr-2">
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2 space-y-2">
                <Label>Name *</Label>
                <Input
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  placeholder="e.g. Kitchen Cabinets"
                />
              </div>
              <div className="space-y-2">
                <Label>Category</Label>
                <Input
                  value={form.category}
                  onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
                  placeholder="e.g. Woodwork"
                />
              </div>
              <div className="space-y-2">
                <Label>CTA</Label>
                <Input
                  value={form.cta}
                  onChange={(e) => setForm((f) => ({ ...f, cta: e.target.value }))}
                  placeholder="e.g. Get a Free Quote"
                />
              </div>
              <div className="space-y-2">
                <Label>Price</Label>
                <Input
                  value={form.price}
                  onChange={(e) => setForm((f) => ({ ...f, price: e.target.value }))}
                  placeholder="e.g. 5000"
                />
              </div>
              <div className="space-y-2">
                <Label>Promotional Price</Label>
                <Input
                  value={form.promotionalPrice}
                  onChange={(e) => setForm((f) => ({ ...f, promotionalPrice: e.target.value }))}
                  placeholder="e.g. 4200"
                />
              </div>
              <div className="col-span-2 space-y-2">
                <Label>Description</Label>
                <Textarea
                  value={form.description}
                  onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                  placeholder="Describe this product or service and its benefits..."
                  rows={3}
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setShowDialog(false)}>Cancel</Button>
            <Button onClick={handleSave} disabled={!form.name.trim() || saving}>
              {saving ? "Saving..." : editingId ? "Update" : "Add"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
