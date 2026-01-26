"use client";

import React, { useState, useEffect } from 'react';
import { Plus, Truck, ArrowRight, CheckCircle, XCircle, Clock, Wheat } from 'lucide-react';
import apiService from '../services/api';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface Farm {
  id: number;
  name: string;
  location: string;
  crops: string;
  total_area: number;
}

interface Transfer {
  id: number;
  item_name: string;
  quantity: number;
  unit: string;
  from_location: string;
  to_farm: string;
  transfer_date: string;
  status: 'pending' | 'completed' | 'cancelled';
}

interface PriceListItem {
  category: string;
  name: string;
  unit: string;
  price: number;
}

interface InventoryTransfersProps {
  farms: Farm[];
}

const InventoryTransfers: React.FC<InventoryTransfersProps> = ({ farms }) => {
  const [transfers, setTransfers] = useState<Transfer[]>([]);
  const [loading, setLoading] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [selectedFarm, setSelectedFarm] = useState<string>('all');
  const [priceList, setPriceList] = useState<PriceListItem[]>([]);
  const [formData, setFormData] = useState({
    item_name: '',
    quantity: '',
    unit: 'kg',
    from_location: '',
    to_farm: ''
  });

  useEffect(() => {
    loadTransfers();
    loadPriceList();
  }, []);

  const loadTransfers = async () => {
    setLoading(true);
    try {
      const apiData = await apiService.getTransferRecords();
      const transferData: Transfer[] = apiData.map((item: any) => ({
        id: item.id,
        item_name: item.item_name,
        quantity: item.quantity,
        unit: item.unit,
        from_location: item.from_location,
        to_farm: item.to_farm,
        transfer_date: item.transfer_date ? item.transfer_date.split('T')[0] : '',
        status: item.status
      }));
      setTransfers(transferData);
    } catch (error) {
      console.error('Error loading transfers:', error);
      setTransfers([]);
    } finally {
      setLoading(false);
    }
  };

  const loadPriceList = async () => {
    try {
      const data = await apiService.getPriceListData();
      setPriceList(data);
    } catch (error) {
      console.error('Error loading price list:', error);
      setPriceList([]);
    }
  };

  const handleItemChange = (selectedItemName: string) => {
    const selectedItem = priceList.find(item => item.name === selectedItemName);
    if (selectedItem) {
      const unitMapping: { [key: string]: string } = {
        'Kgs': 'kg',
        'Ltrs': 'liters',
        'Pcs': 'pieces',
        'Pairs': 'pairs',
        'Roll': 'rolls'
      };
      const mappedUnit = unitMapping[selectedItem.unit] || selectedItem.unit.toLowerCase();
      setFormData({
        ...formData,
        item_name: selectedItemName,
        unit: mappedUnit
      });
    } else {
      setFormData({
        ...formData,
        item_name: selectedItemName
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (formData.from_location === formData.to_farm) {
      alert('Source and destination cannot be the same farm');
      return;
    }

    try {
      const fromFarm = farms.find(f => f.name === formData.from_location);
      const toFarm = farms.find(f => f.name === formData.to_farm);

      if (!fromFarm || !toFarm) {
        alert('Invalid farm selection');
        return;
      }

      const transferData = {
        item_name: formData.item_name,
        quantity: parseFloat(formData.quantity),
        unit: formData.unit,
        from_farm_id: fromFarm.id,
        to_farm_id: toFarm.id,
        transfer_date: new Date().toISOString()
      };

      await apiService.createTransferRecord(transferData);
      setShowAddForm(false);
      setFormData({
        item_name: '',
        quantity: '',
        unit: 'kg',
        from_location: '',
        to_farm: ''
      });
      loadTransfers();
    } catch (error) {
      console.error('Error creating transfer:', error);
    }
  };

  const updateStatus = async (id: number, status: 'pending' | 'completed' | 'cancelled') => {
    try {
      await apiService.updateTransferStatus(id, status);
      loadTransfers();
    } catch (error) {
      console.error('Error updating transfer status:', error);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge className="bg-green-100 text-green-800 hover:bg-green-100"><CheckCircle className="w-3 h-3 mr-1" />Completed</Badge>;
      case 'pending':
        return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800"><Clock className="w-3 h-3 mr-1" />Pending</Badge>;
      case 'cancelled':
        return <Badge variant="destructive"><XCircle className="w-3 h-3 mr-1" />Cancelled</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const filteredTransfers = selectedFarm === 'all'
    ? transfers
    : transfers.filter(transfer => transfer.to_farm === farms.find(f => f.id === parseInt(selectedFarm))?.name);

  const getFarmTransferSummary = () => {
    const summary: { [key: string]: { total: number, pending: number, completed: number } } = {};
    transfers.forEach(transfer => {
      const farm = transfer.to_farm;
      if (!summary[farm]) {
        summary[farm] = { total: 0, pending: 0, completed: 0 };
      }
      summary[farm].total++;
      if (transfer.status === 'pending') summary[farm].pending++;
      if (transfer.status === 'completed') summary[farm].completed++;
    });
    return summary;
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold">Inventory Transfers</h2>
          <p className="text-muted-foreground">Track and manage transfers between farms</p>
        </div>
        <Button onClick={() => setShowAddForm(true)}>
          <Plus className="w-4 h-4 mr-2" />
          New Transfer
        </Button>
      </div>

      {/* New Transfer Dialog */}
      <Dialog open={showAddForm} onOpenChange={setShowAddForm}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Create New Transfer</DialogTitle>
            <DialogDescription>Transfer items between farms</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Item Details */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Item Name</Label>
                <Select value={formData.item_name} onValueChange={handleItemChange}>
                  <SelectTrigger>
                    <SelectValue placeholder={priceList.length === 0 ? 'Loading...' : 'Select item'} />
                  </SelectTrigger>
                  <SelectContent>
                    {priceList.map((item) => (
                      <SelectItem key={`${item.category}-${item.name}`} value={item.name}>
                        {item.name} ({item.category})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Quantity</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={formData.quantity}
                  onChange={(e) => setFormData({...formData, quantity: e.target.value})}
                  placeholder="Enter quantity"
                  required
                />
              </div>
              <div className="col-span-2 space-y-2">
                <Label>Unit</Label>
                <Input value={formData.unit} readOnly className="bg-muted" />
              </div>
            </div>

            {/* Transfer Details */}
            <div className="border-t pt-4">
              <h4 className="text-sm font-medium mb-3">Transfer Details</h4>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>From Farm</Label>
                  <Select value={formData.from_location} onValueChange={(value) => setFormData({...formData, from_location: value})}>
                    <SelectTrigger>
                      <SelectValue placeholder={farms.length === 0 ? 'Loading...' : 'Select source'} />
                    </SelectTrigger>
                    <SelectContent>
                      {farms.map((farm) => (
                        <SelectItem key={`from-${farm.id}`} value={farm.name}>
                          {farm.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>To Farm</Label>
                  <Select value={formData.to_farm} onValueChange={(value) => setFormData({...formData, to_farm: value})}>
                    <SelectTrigger>
                      <SelectValue placeholder={farms.length === 0 ? 'Loading...' : 'Select destination'} />
                    </SelectTrigger>
                    <SelectContent>
                      {farms.map((farm) => (
                        <SelectItem key={`to-${farm.id}`} value={farm.name}>
                          {farm.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              {formData.from_location && formData.to_farm && formData.from_location === formData.to_farm && (
                <p className="mt-2 text-sm text-destructive">Source and destination cannot be the same</p>
              )}
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setShowAddForm(false)}>
                Cancel
              </Button>
              <Button type="submit">Create Transfer</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Farm Transfer Overview */}
      <Card>
        <CardHeader>
          <CardTitle>Farm Transfer Overview</CardTitle>
          <CardDescription>Transfer statistics per farm</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {farms.map((farm) => {
              const summary = getFarmTransferSummary()[farm.name] || { total: 0, pending: 0, completed: 0 };
              return (
                <div key={farm.id} className="bg-orange-50 dark:bg-orange-950/20 p-4 rounded-lg border border-orange-200 dark:border-orange-800">
                  <div className="flex items-center gap-2 mb-3">
                    <Wheat className="w-4 h-4 text-orange-600" />
                    <h4 className="font-semibold text-orange-800 dark:text-orange-200">{farm.name}</h4>
                  </div>
                  <div className="flex justify-between items-center">
                    <div className="text-center">
                      <p className="text-lg font-bold text-orange-600">{summary.total}</p>
                      <p className="text-xs text-orange-600">Total</p>
                    </div>
                    <div className="text-center">
                      <p className="text-lg font-bold text-yellow-600">{summary.pending}</p>
                      <p className="text-xs text-yellow-600">Pending</p>
                    </div>
                    <div className="text-center">
                      <p className="text-lg font-bold text-green-600">{summary.completed}</p>
                      <p className="text-xs text-green-600">Completed</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Transfer History */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Transfer History</CardTitle>
            <CardDescription>All transfers between farms</CardDescription>
          </div>
          <Select value={selectedFarm} onValueChange={setSelectedFarm}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter by farm" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Farms</SelectItem>
              {farms.map((farm) => (
                <SelectItem key={farm.id} value={farm.id.toString()}>{farm.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-muted-foreground">Loading transfers...</p>
          ) : filteredTransfers.length === 0 ? (
            <div className="text-center py-8">
              <Truck className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">
                {selectedFarm === 'all' ? 'No transfers found.' : 'No transfers found for selected farm.'}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredTransfers.map((transfer) => (
                <Card key={transfer.id}>
                  <CardContent className="p-4">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                      <div className="flex items-start gap-4">
                        <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                          <Truck className="w-6 h-6 text-blue-600" />
                        </div>
                        <div>
                          <h4 className="font-semibold">{transfer.item_name}</h4>
                          <p className="text-sm text-muted-foreground">
                            {transfer.quantity} {transfer.unit}
                          </p>
                          <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground">
                            <span>{transfer.from_location}</span>
                            <ArrowRight className="w-4 h-4" />
                            <span>{transfer.to_farm}</span>
                          </div>
                          <p className="text-xs text-muted-foreground mt-1">{transfer.transfer_date}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        {getStatusBadge(transfer.status)}
                        {transfer.status === 'pending' && (
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              className="text-green-600 border-green-600 hover:bg-green-50"
                              onClick={() => updateStatus(transfer.id, 'completed')}
                            >
                              Complete
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="text-destructive border-destructive hover:bg-red-50"
                              onClick={() => updateStatus(transfer.id, 'cancelled')}
                            >
                              Cancel
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default InventoryTransfers;
