"use client";

import React, { useState, useCallback } from 'react';
import { useApi } from '../../../hooks';
import apiService from '../../../services/api';
import { LoadingSpinner } from '../../common/LoadingSpinner';
import { Plus, Trash2, Tag, AlertCircle } from 'lucide-react';
import { toast } from '../../ui/sonner';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '../../ui/dialog';
import { Button } from '../../ui/button';
import { Input } from '../../ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../ui/select';

const CATEGORY_OPTIONS = [
  'Fertilizers',
  'Chemicals',
  'Tools',
  'Fuel',
  'Seeds',
  'Packaging',
  'Spare Parts',
  'Other',
];

const emptyForm = {
  category: '',
  name: '',
  unit: '',
  price: '',
  accounting_code: '',
};

export const PriceListSection: React.FC = () => {
  const [categoryFilter, setCategoryFilter] = useState('');
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<{ id: number; name: string } | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [formError, setFormError] = useState('');
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const getItems = useCallback(
    () => apiService.getPriceList(categoryFilter || undefined),
    [categoryFilter]
  );

  const { data: items, loading, error, refetch } = useApi(getItems, {
    dependencies: [categoryFilter],
  });

  // Group items by category for display
  const grouped: Record<string, any[]> = {};
  if (Array.isArray(items)) {
    for (const item of items) {
      const cat = item.category || 'Uncategorised';
      if (!grouped[cat]) grouped[cat] = [];
      grouped[cat].push(item);
    }
  }

  const handleAdd = async () => {
    setFormError('');
    if (!form.category || !form.name || !form.unit || !form.price) {
      setFormError('Category, name, unit and price are required.');
      return;
    }
    const price = parseFloat(form.price);
    if (isNaN(price) || price < 0) {
      setFormError('Price must be a valid positive number.');
      return;
    }
    setSaving(true);
    try {
      await apiService.addPriceListItem({
        category: form.category,
        name: form.name,
        unit: form.unit,
        price,
        accounting_code: form.accounting_code || undefined,
      });
      toast.success(`"${form.name}" added to price list`);
      setShowAddDialog(false);
      setForm(emptyForm);
      refetch();
    } catch (err: any) {
      const msg = err?.response?.data?.detail || err?.message || 'Failed to add item';
      setFormError(msg);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      const result = await apiService.deletePriceListItem(deleteTarget.id);
      toast.success(result.message || `"${deleteTarget.name}" deleted`);
      setDeleteTarget(null);
      refetch();
    } catch (err: any) {
      const msg = err?.response?.data?.detail || err?.message || 'Failed to delete item';
      toast.error(msg);
      setDeleteTarget(null);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Price List</h2>
            <p className="text-sm text-gray-600 mt-1">
              Manage items available for stock requests and procurement documents
            </p>
          </div>
          <button
            onClick={() => { setForm(emptyForm); setFormError(''); setShowAddDialog(true); }}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium"
          >
            <Plus className="w-4 h-4" />
            Add Item
          </button>
        </div>

        {/* Category filter */}
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <label className="text-sm font-medium text-gray-700">Filter by category:</label>
          <div className="w-full sm:w-52">
            <Select
              value={categoryFilter || 'all'}
              onValueChange={(v) => setCategoryFilter(v === 'all' ? '' : v)}
            >
              <SelectTrigger>
                <SelectValue placeholder="All categories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All categories</SelectItem>
                {CATEGORY_OPTIONS.map((c) => (
                  <SelectItem key={c} value={c}>{c}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {items && (
            <span className="text-xs text-gray-500">
              {Array.isArray(items) ? items.length : 0} item{items.length !== 1 ? 's' : ''}
            </span>
          )}
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="bg-red-50 border border-red-300 rounded-lg p-4 flex gap-3">
          <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {/* Content */}
      {loading ? (
        <div className="flex justify-center items-center py-16">
          <LoadingSpinner size="lg" />
        </div>
      ) : Object.keys(grouped).length === 0 ? (
        <div className="bg-white rounded-lg shadow-md p-12 text-center">
          <Tag className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">
            {categoryFilter ? `No items in "${categoryFilter}"` : 'No price list items yet'}
          </p>
          <p className="text-sm text-gray-400 mt-1">Click "Add Item" to create the first entry</p>
        </div>
      ) : (
        <div className="space-y-6">
          {Object.entries(grouped)
            .sort(([a], [b]) => a.localeCompare(b))
            .map(([category, catItems]) => (
              <div key={category} className="bg-white rounded-lg shadow-md overflow-hidden">
                <div className="bg-gray-50 border-b border-gray-200 px-6 py-3">
                  <h3 className="font-semibold text-gray-800 flex items-center gap-2">
                    <Tag className="w-4 h-4 text-gray-500" />
                    {category}
                    <span className="text-xs font-normal text-gray-500">
                      ({catItems.length} item{catItems.length !== 1 ? 's' : ''})
                    </span>
                  </h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-gray-100 text-xs text-gray-500 uppercase tracking-wide">
                        <th className="text-left px-6 py-3">Name</th>
                        <th className="text-left px-6 py-3">Unit</th>
                        <th className="text-right px-6 py-3">Price (TZS)</th>
                        <th className="text-left px-6 py-3">Code</th>
                        <th className="text-left px-6 py-3">Added</th>
                        <th className="px-6 py-3"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {catItems.map((item) => (
                        <tr
                          key={item.id}
                          className="border-b border-gray-50 last:border-0 hover:bg-gray-50 transition-colors"
                        >
                          <td className="px-6 py-3 font-medium text-gray-900">{item.name}</td>
                          <td className="px-6 py-3 text-gray-600">{item.unit}</td>
                          <td className="px-6 py-3 text-right font-medium text-gray-900">
                            {Number(item.price).toLocaleString()}
                          </td>
                          <td className="px-6 py-3 text-gray-500">
                            {item.accounting_code || '—'}
                          </td>
                          <td className="px-6 py-3 text-gray-500">
                            {item.created_at
                              ? new Date(item.created_at).toLocaleDateString()
                              : '—'}
                          </td>
                          <td className="px-6 py-3 text-right">
                            <button
                              onClick={() => setDeleteTarget({ id: item.id, name: item.name })}
                              className="text-red-400 hover:text-red-600 p-1 rounded transition-colors"
                              title="Delete item"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ))}
        </div>
      )}

      {/* Add Item Dialog */}
      <Dialog open={showAddDialog} onOpenChange={(open) => !open && setShowAddDialog(false)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Add Price List Item</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            {formError && (
              <div className="bg-red-50 border border-red-200 text-red-700 rounded px-3 py-2 text-sm">
                {formError}
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Category *</label>
              <Select
                value={form.category || undefined}
                onValueChange={(v) => setForm((f) => ({ ...f, category: v }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORY_OPTIONS.map((c) => (
                    <SelectItem key={c} value={c}>{c}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Item Name *</label>
              <Input
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                placeholder="e.g. CAN Fertilizer"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Unit *</label>
                <Input
                  value={form.unit}
                  onChange={(e) => setForm((f) => ({ ...f, unit: e.target.value }))}
                  placeholder="kg, liters, bags…"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Price (TZS) *</label>
                <Input
                  type="number"
                  min="0"
                  value={form.price}
                  onChange={(e) => setForm((f) => ({ ...f, price: e.target.value }))}
                  placeholder="0"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Accounting Code <span className="text-gray-400 font-normal">(optional)</span>
              </label>
              <Input
                value={form.accounting_code}
                onChange={(e) => setForm((f) => ({ ...f, accounting_code: e.target.value }))}
                placeholder="e.g. FERT-001"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddDialog(false)} disabled={saving}>
              Cancel
            </Button>
            <Button onClick={handleAdd} disabled={saving}>
              {saving ? 'Adding…' : 'Add Item'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Delete Item</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-gray-700 py-2">
            Are you sure you want to delete <strong>"{deleteTarget?.name}"</strong> from the price list?
          </p>
          <p className="text-xs text-gray-500">
            This will fail if the item is referenced by an existing SMR document.
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteTarget(null)} disabled={deleting}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDelete} disabled={deleting}>
              {deleting ? 'Deleting…' : 'Delete'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
