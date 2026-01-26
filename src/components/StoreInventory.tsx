"use client";

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Plus, Edit, Trash2, Package, Wheat, ArrowDownCircle, ArrowUpCircle } from 'lucide-react';
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
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

interface InventoryItem {
  id: number;
  item_name: string;
  quantity: number;
  unit: string;
  farm_id?: number;
  farm_name?: string;
}

interface StockMovement {
  id: number;
  item_name: string;
  quantity: number;
  unit: string;
  movement_type: string;
  reason: string;
  farm_name?: string;
  created_at: string;
}

interface PriceListItem {
  category: string;
  name: string;
  unit: string;
  price: number;
}

interface StoreInventoryProps {
  farms: Farm[];
}

const StoreInventory: React.FC<StoreInventoryProps> = ({ farms }) => {
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [stockMovements, setStockMovements] = useState<StockMovement[]>([]);
  const [loading, setLoading] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [selectedFarm, setSelectedFarm] = useState<string>('all');
  const [selectedMovementType, setSelectedMovementType] = useState<string>('all');
  const [priceList, setPriceList] = useState<PriceListItem[]>([]);
  const [formData, setFormData] = useState({
    item_name: '',
    quantity: '',
    unit: 'kg',
    farm_id: 0
  });

  useEffect(() => {
    loadInventory();
    loadPriceList();
    loadStockMovements();
  }, []);

  const loadInventory = async () => {
    setLoading(true);
    try {
      const apiData = await apiService.getInventoryItems();
      const inventoryData: InventoryItem[] = apiData.map((item: any) => ({
        id: item.id,
        item_name: item.item_name,
        quantity: item.quantity,
        unit: item.unit,
        farm_name: item.farm?.name || 'Unknown Farm'
      }));
      setInventory(inventoryData);
    } catch (error) {
      console.error('Error loading inventory:', error);
      setInventory([]);
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

  const loadStockMovements = async () => {
    try {
      const data = await apiService.getStockMovements();
      const movementsData: StockMovement[] = data.map((movement: any) => ({
        id: movement.id,
        item_name: movement.item_name,
        quantity: movement.quantity,
        unit: movement.unit,
        movement_type: movement.movement_type,
        reason: movement.reason,
        farm_name: movement.farm?.name || 'Unknown Farm',
        created_at: movement.created_at
      }));
      setStockMovements(movementsData);
    } catch (error) {
      console.error('Error loading stock movements:', error);
      setStockMovements([]);
    }
  };

  const handleItemChange = useCallback((selectedItemName: string) => {
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
      setFormData(prev => ({
        ...prev,
        item_name: selectedItemName,
        unit: mappedUnit
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        item_name: selectedItemName
      }));
    }
  }, [priceList]);

  const handleFarmChange = useCallback((value: string) => {
    const newFarmId = Number(value);
    if (isNaN(newFarmId) || newFarmId < 0) {
      setFormData(prev => ({ ...prev, farm_id: 0 }));
    } else {
      setFormData(prev => ({ ...prev, farm_id: newFarmId }));
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.farm_id || formData.farm_id === 0) {
      alert('Please select a valid farm');
      return;
    }

    const farmId = formData.farm_id;
    const quantity = parseFloat(formData.quantity);

    if (isNaN(quantity) || quantity <= 0) {
      alert('Please enter a valid quantity greater than 0');
      return;
    }

    if (!formData.item_name.trim()) {
      alert('Please select an item name');
      return;
    }

    try {
      const inventoryData = {
        farm_id: farmId,
        item_name: formData.item_name.trim(),
        quantity: quantity,
        unit: formData.unit
      };

      await apiService.createInventoryItem(inventoryData);
      setShowAddForm(false);
      setFormData({ item_name: '', quantity: '', unit: 'kg', farm_id: 0 });
      loadInventory();
    } catch (error: any) {
      console.error('Error adding item:', error);
      const errorMessage = error.response?.data?.detail || error.response?.data?.message || error.message || 'Failed to add inventory item. Please try again.';
      alert(errorMessage);
    }
  };

  const handleDelete = async (id: number) => {
    if (confirm('Are you sure you want to delete this item?')) {
      setInventory(inventory.filter(item => item.id !== id));
    }
  };

  const filteredInventory = selectedFarm === 'all'
    ? inventory
    : inventory.filter(item => {
        return item.farm_name === farms.find(f => f.id === parseInt(selectedFarm))?.name;
      });

  const filteredMovements = selectedMovementType === 'all'
    ? stockMovements
    : stockMovements.filter(movement => movement.movement_type === selectedMovementType);

  const getFarmInventorySummary = () => {
    const summary: { [key: string]: number } = {};
    inventory.forEach(item => {
      const location = item.farm_name || 'Unknown';
      summary[location] = (summary[location] || 0) + 1;
    });
    return summary;
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold">Store Inventory</h2>
          <p className="text-muted-foreground">Manage inventory across all farms</p>
        </div>
        <Button onClick={() => setShowAddForm(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Add Item
        </Button>
      </div>

      {/* Add Item Dialog */}
      <Dialog open={showAddForm} onOpenChange={setShowAddForm}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Add New Item</DialogTitle>
            <DialogDescription>Add a new item to the inventory</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
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
                  onChange={(e) => setFormData(prev => ({...prev, quantity: e.target.value}))}
                  placeholder="Enter quantity"
                />
              </div>
              <div className="space-y-2">
                <Label>Unit</Label>
                <Input value={formData.unit} readOnly className="bg-muted" />
              </div>
              <div className="space-y-2">
                <Label>Farm</Label>
                <Select value={formData.farm_id.toString()} onValueChange={handleFarmChange}>
                  <SelectTrigger>
                    <SelectValue placeholder={farms.length === 0 ? 'Loading...' : 'Select farm'} />
                  </SelectTrigger>
                  <SelectContent>
                    {farms.filter(farm => !isNaN(farm.id) && farm.id > 0).map((farm) => (
                      <SelectItem key={farm.id} value={farm.id.toString()}>
                        {farm.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setShowAddForm(false)}>
                Cancel
              </Button>
              <Button type="submit">Add Item</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Farm Overview */}
      <Card>
        <CardHeader>
          <CardTitle>Farm Inventory Overview</CardTitle>
          <CardDescription>Items count per farm</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {farms.map((farm) => (
              <div key={farm.id} className="bg-green-50 dark:bg-green-950/20 p-4 rounded-lg border border-green-200 dark:border-green-800">
                <div className="flex items-center gap-2 mb-2">
                  <Wheat className="w-4 h-4 text-green-600" />
                  <h4 className="font-semibold text-green-800 dark:text-green-200">{farm.name}</h4>
                </div>
                <p className="text-2xl font-bold text-green-600">
                  {getFarmInventorySummary()[farm.name] || 0}
                </p>
                <p className="text-sm text-green-600">items</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Current Inventory */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Current Inventory</CardTitle>
            <CardDescription>All items in stock</CardDescription>
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
            <p className="text-muted-foreground">Loading inventory...</p>
          ) : filteredInventory.length === 0 ? (
            <div className="text-center py-8">
              <Package className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">
                {selectedFarm === 'all' ? 'No items in inventory.' : 'No items found for selected farm.'}
              </p>
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Item Name</TableHead>
                    <TableHead>Quantity</TableHead>
                    <TableHead>Unit</TableHead>
                    <TableHead>Location</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredInventory.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell className="font-medium">{item.item_name}</TableCell>
                      <TableCell>{item.quantity}</TableCell>
                      <TableCell>{item.unit}</TableCell>
                      <TableCell>
                        <Badge variant="secondary" className="bg-green-100 text-green-800">
                          <Wheat className="w-3 h-3 mr-1" />
                          {item.farm_name || 'Unknown Farm'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end space-x-2">
                          <Button variant="ghost" size="icon">
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDelete(item.id)}
                            className="text-destructive hover:text-destructive"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Stock Movements */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Stock Movements</CardTitle>
            <CardDescription>History of inventory changes</CardDescription>
          </div>
          <Select value={selectedMovementType} onValueChange={setSelectedMovementType}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter by type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Movements</SelectItem>
              <SelectItem value="input">Input</SelectItem>
              <SelectItem value="output">Output</SelectItem>
            </SelectContent>
          </Select>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-muted-foreground">Loading stock movements...</p>
          ) : filteredMovements.length === 0 ? (
            <div className="text-center py-8">
              <Package className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">
                {selectedMovementType === 'all' ? 'No stock movements found.' : `No ${selectedMovementType} movements found.`}
              </p>
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Item</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Quantity</TableHead>
                    <TableHead>Reason</TableHead>
                    <TableHead>Location</TableHead>
                    <TableHead>Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredMovements.map((movement) => (
                    <TableRow key={movement.id}>
                      <TableCell className="font-medium">{movement.item_name}</TableCell>
                      <TableCell>
                        <Badge variant={movement.movement_type === 'input' ? 'default' : 'destructive'}>
                          {movement.movement_type === 'input' ? (
                            <><ArrowDownCircle className="w-3 h-3 mr-1" /> Input</>
                          ) : (
                            <><ArrowUpCircle className="w-3 h-3 mr-1" /> Output</>
                          )}
                        </Badge>
                      </TableCell>
                      <TableCell>{movement.quantity} {movement.unit}</TableCell>
                      <TableCell>{movement.reason}</TableCell>
                      <TableCell>
                        <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                          <Wheat className="w-3 h-3 mr-1" />
                          {movement.farm_name || 'Unknown Farm'}
                        </Badge>
                      </TableCell>
                      <TableCell>{new Date(movement.created_at).toLocaleDateString()}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default StoreInventory;
