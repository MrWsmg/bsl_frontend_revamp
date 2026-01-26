"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import StoreInventory from "./StoreInventory";
import InventoryTransfers from "./InventoryTransfers";
import ItemRequests from "./ItemRequests";

interface Farm {
  id: number;
  name: string;
  location: string;
  crops: string;
  total_area: number;
}

interface StoreProps {
  farms: Farm[];
}

export default function Store({ farms }: StoreProps) {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Farm Inventory Management</h1>
        <p className="text-muted-foreground">
          Manage inventory across farms and track inter-farm transfers
        </p>
      </div>

      <Tabs defaultValue="inventory" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="inventory">Farm Inventory</TabsTrigger>
          <TabsTrigger value="requests">Item Requests</TabsTrigger>
          <TabsTrigger value="transfers">Inter-Farm Transfers</TabsTrigger>
        </TabsList>

        <TabsContent value="inventory">
          <StoreInventory farms={farms} />
        </TabsContent>

        <TabsContent value="requests">
          <ItemRequests farms={farms} />
        </TabsContent>

        <TabsContent value="transfers">
          <InventoryTransfers farms={farms} />
        </TabsContent>
      </Tabs>
    </div>
  );
}