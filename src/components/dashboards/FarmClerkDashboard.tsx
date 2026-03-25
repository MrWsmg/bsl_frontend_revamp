"use client";

// Farm Clerk Dashboard - shadcn patterns
import React, { useState, useCallback, useMemo } from 'react';
import {
  Package,
  ClipboardList,
  Truck,
  BarChart3,
  DollarSign,
  TrendingUp,
  LayoutDashboard,
  Boxes,
  ArrowLeftRight,
  Users,
  UserCheck,
  FileText,
  Clock,
  PackageCheck,
  Settings,
  Tag,
  PackageOpen,
} from 'lucide-react';
import { useApi } from '../../hooks';
import { LoadingSpinner } from '../common/LoadingSpinner';
import { ErrorBoundary } from '../common/ErrorBoundary';
import apiService from '../../api';
import StoreInventory from '../StoreInventory';
import InventoryTransfers from '../InventoryTransfers';
import ItemRequests from '../ItemRequests';
import { Layout } from '../layout/Layout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

// New feature components
import { DailyStock, YtdStock } from '../stock';
import { AttendanceCheckIn, AttendanceRecords, AttendanceReport } from '../attendance';
import { PendingIssuances, DispatchPhotoUpload } from '../issuance';
import { PriceListSection } from './sections/PriceListSection';
import {
  SharedPfiSection,
  SharedLpoSection,
  SharedGrnSection,
  SharedGinSection,
  SharedCardexSection,
  SharedTransportVoucherSection,
  SharedDeliveryNoteSection,
  SharedTransferSection,
  SharedGatePassSection,
} from './sections';

interface User {
  id: number;
  username: string;
  full_name: string;
  role: string;
  assigned_farms: string;
  is_active: boolean;
}

interface FarmClerkDashboardProps {
  user: User;
  onLogout: () => void;
}

const sidebarItems = [
  { id: 'overview', label: 'Overview', icon: LayoutDashboard },
  {
    id: 'stock',
    label: 'Stock',
    icon: Boxes,
    children: [
      { id: 'daily-stock', label: 'Daily Stock', icon: Package },
      { id: 'ytd-stock', label: 'YTD Stock', icon: TrendingUp },
      { id: 'inventory', label: 'Inventory', icon: ClipboardList },
      { id: 'movements', label: 'Movements', icon: ArrowLeftRight },
    ],
  },
  {
    id: 'attendance',
    label: 'Attendance',
    icon: Users,
    children: [
      { id: 'check-in', label: 'Check In', icon: UserCheck },
      { id: 'records', label: 'Records', icon: FileText },
      { id: 'report', label: 'Report', icon: BarChart3 },
    ],
  },
  {
    id: 'issuance',
    label: 'Issuance',
    icon: PackageCheck,
    children: [
      { id: 'pending-issuance', label: 'Pending', icon: Clock },
      { id: 'dispatch', label: 'Dispatch', icon: Truck },
    ],
  },
  {
    id: 'operations',
    label: 'Operations',
    icon: Settings,
    children: [
      { id: 'requests',    label: 'Requests',   icon: ClipboardList },
      { id: 'transfers',   label: 'Transfers',  icon: Truck },
      { id: 'price-list',  label: 'Price List', icon: Tag },
    ],
  },
  {
    id: 'procurement',
    label: 'Procurement',
    icon: PackageCheck,
    children: [
      { id: 'proc-pfi',      label: 'Supplier Catalog', icon: Tag },
      { id: 'proc-lpo',      label: 'LPO',       icon: ClipboardList },
      { id: 'proc-grn',      label: 'GRN',       icon: PackageCheck },
      { id: 'proc-gin',      label: 'GIN',       icon: PackageOpen },
      { id: 'proc-cardex',   label: 'CARDEX',    icon: TrendingUp },
      { id: 'proc-tv',       label: 'Transport', icon: Truck },
      { id: 'proc-dn',       label: 'Delivery',  icon: ArrowLeftRight },
      { id: 'proc-transfer', label: 'Transfers', icon: ArrowLeftRight },
      { id: 'proc-gatepass', label: 'Gate Pass', icon: ClipboardList },
    ],
  },
  { id: 'expenses', label: 'Expenses', icon: DollarSign },
];

const FarmClerkDashboard: React.FC<FarmClerkDashboardProps> = ({ user, onLogout }) => {
  const [activeTab, setActiveTab] = useState('overview');
  const [mountedTabs, setMountedTabs] = useState<Set<string>>(new Set(['overview']));

  const handleTabChange = (tabId: string) => {
    setActiveTab(tabId);
    setMountedTabs(prev => new Set(prev).add(tabId));
  };

  // Fetch data using useApi hooks
  const getFarms = useCallback(() => apiService.getFarms(user.role), [user.role]);
  const getInventory = useCallback(() => apiService.getInventoryItems(), []);
  const getTransfers = useCallback(() => apiService.getTransferRecords(), []);
  const getPendingRequests = useCallback(() => apiService.getPendingItemRequests(), []);
  const getStockMovements = useCallback(() => apiService.getStockMovements(), []);
  const getExpenses = useCallback(() => apiService.getExpenseRecords(), []);

  const { data: allFarms, loading: loadingFarms } = useApi(getFarms);
  const assignedFarmIds = user.assigned_farms ? user.assigned_farms.split(',').map(id => parseInt(id.trim())).filter(id => !isNaN(id)) : [];
  const farms = allFarms ? allFarms.filter(farm => assignedFarmIds.includes(farm.id)) : [];
  const { data: inventory, loading: loadingInventory } = useApi(getInventory);
  const { data: transfers, loading: loadingTransfers } = useApi(getTransfers);
  const { data: pendingRequests, loading: loadingRequests } = useApi(getPendingRequests);
  const { data: stockMovements, loading: loadingMovements } = useApi(getStockMovements);
  const { data: expenses, loading: loadingExpenses } = useApi(getExpenses);

  // Calculate overview statistics
  const overviewStats = useMemo(() => {
    if (!inventory || !pendingRequests || !stockMovements || !transfers || !expenses) {
      return {
        totalItems: 0,
        totalValue: 0,
        pendingRequests: 0,
        recentMovements: 0,
        activeTransfers: 0,
        totalExpenses: 0
      };
    }

    const totalItems = inventory.reduce((sum: number, item: any) => sum + item.quantity, 0);
    const totalValue = inventory.reduce((sum: number, item: any) => sum + (item.quantity * (item.price || 0)), 0);
    const pendingRequestsCount = pendingRequests.length;
    const recentMovementsCount = stockMovements.filter((m: any) => {
      const movementDate = new Date(m.created_at);
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      return movementDate >= weekAgo;
    }).length;
    const activeTransfersCount = transfers.filter((t: any) => t.status === 'pending').length;
    const totalExpensesValue = expenses.reduce((sum: number, expense: any) => sum + expense.amount, 0);

    return {
      totalItems,
      totalValue,
      pendingRequests: pendingRequestsCount,
      recentMovements: recentMovementsCount,
      activeTransfers: activeTransfersCount,
      totalExpenses: totalExpensesValue
    };
  }, [inventory, pendingRequests, stockMovements, transfers, expenses]);

  const isLoading = loadingFarms || loadingInventory || loadingTransfers || loadingRequests || loadingMovements || loadingExpenses;

  const renderOverview = () => {
    if (isLoading) {
      return (
        <div className="flex justify-center items-center py-12">
          <LoadingSpinner size="lg" />
        </div>
      );
    }

    const stats = [
      { title: 'Total Items in Stock', value: overviewStats.totalItems, subtitle: 'Across all farms', icon: Package, color: 'text-blue-600', bg: 'bg-blue-500' },
      { title: 'Pending Requests', value: overviewStats.pendingRequests, subtitle: 'Awaiting approval', icon: ClipboardList, color: 'text-orange-600', bg: 'bg-orange-500' },
      { title: 'Recent Movements', value: overviewStats.recentMovements, subtitle: 'Last 7 days', icon: TrendingUp, color: 'text-green-600', bg: 'bg-green-500' },
      { title: 'Active Transfers', value: overviewStats.activeTransfers, subtitle: 'In progress', icon: Truck, color: 'text-purple-600', bg: 'bg-purple-500' },
    ];

    return (
      <div className="space-y-6">
        {/* Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {stats.map((stat, index) => (
            <Card key={index} className="hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">{stat.title}</p>
                    <p className={`text-3xl font-bold mt-1 ${stat.color}`}>{stat.value}</p>
                    <p className="text-xs text-muted-foreground mt-1">{stat.subtitle}</p>
                  </div>
                  <div className={`${stat.bg} p-3 rounded-xl`}>
                    <stat.icon className="w-6 h-6 text-white" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Stock Movements</CardTitle>
            <CardDescription>Latest inventory changes across your farms</CardDescription>
          </CardHeader>
          <CardContent>
            {stockMovements && stockMovements.length > 0 ? (
              <div className="space-y-3">
                {stockMovements.slice(0, 5).map((movement: any) => (
                  <div key={movement.id} className="bg-muted/50 p-4 rounded-lg border-l-4 border-blue-500">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                          <Badge variant={movement.movement_type === 'input' ? 'default' : 'destructive'}>
                            {movement.movement_type === 'input' ? 'Stock In' : 'Stock Out'}
                          </Badge>
                          <span className="text-sm font-medium">{movement.item_name}</span>
                        </div>
                        <p className="font-medium mb-1">{movement.reason}</p>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm text-muted-foreground">
                          <div><span className="font-medium">Farm:</span> {movement.farm?.name || 'Unknown'}</div>
                          <div><span className="font-medium">Qty:</span> {movement.quantity} {movement.unit}</div>
                          <div><span className="font-medium">Type:</span> {movement.movement_type}</div>
                          <div><span className="font-medium">Date:</span> {new Date(movement.created_at).toLocaleDateString()}</div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 bg-muted/50 rounded-lg">
                <p className="text-muted-foreground">No recent stock movements</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Pending Requests Overview */}
        <Card>
          <CardHeader>
            <CardTitle>Pending Item Requests</CardTitle>
            <CardDescription>Requests waiting for your approval</CardDescription>
          </CardHeader>
          <CardContent>
            {pendingRequests && pendingRequests.length > 0 ? (
              <div className="space-y-3">
                {pendingRequests.slice(0, 3).map((request: any) => (
                  <div key={request.id} className="bg-yellow-50 p-4 rounded-lg border-l-4 border-yellow-500">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-1">
                          <p className="font-medium">{request.item_name}</p>
                          <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
                            Pending
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mb-1">
                          Farm: {request.farm?.name || 'Unknown Farm'} • Requested by: {request.requester_name || 'Unknown'}
                        </p>
                        <div className="grid grid-cols-2 gap-2 text-sm">
                          <div>
                            <span className="text-muted-foreground">Qty:</span>
                            <span className="font-medium ml-1">{request.quantity} {request.unit}</span>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Date:</span>
                            <span className="font-medium ml-1">{new Date(request.created_at).toLocaleDateString()}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 bg-muted/50 rounded-lg">
                <p className="text-muted-foreground">No pending requests</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    );
  };

  // Stock visibility tabs
  const renderDailyStock = () => (
    <div className="space-y-6">
      <DailyStock farms={farms || []} />
    </div>
  );

  const renderYtdStock = () => (
    <div className="space-y-6">
      <YtdStock farms={farms || []} />
    </div>
  );

  const renderInventory = () => (
    <div className="space-y-6">
      <StoreInventory farms={farms || []} />
    </div>
  );

  const renderMovements = () => (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Stock Movement History</CardTitle>
          <CardDescription>Complete history of inventory movements</CardDescription>
        </CardHeader>
        <CardContent>
          {!stockMovements || stockMovements.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground text-sm">No stock movements found.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {stockMovements.map((movement: any) => (
                <Card key={movement.id}>
                  <CardContent className="p-4">
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-1">
                          <p className="font-medium">{movement.item_name}</p>
                          <Badge variant={movement.movement_type === 'input' ? 'default' : 'destructive'}>
                            {movement.movement_type === 'input' ? 'Stock In' : 'Stock Out'}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mb-1">
                          Farm: {movement.farm?.name || 'Unknown Farm'} • Reason: {movement.reason}
                        </p>
                        <div className="grid grid-cols-3 gap-2 text-sm">
                          <div>
                            <span className="text-muted-foreground">Qty:</span>
                            <span className="font-medium ml-1">{movement.quantity} {movement.unit}</span>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Type:</span>
                            <span className="font-medium ml-1 capitalize">{movement.movement_type}</span>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Date:</span>
                            <span className="font-medium ml-1">{new Date(movement.created_at).toLocaleDateString()}</span>
                          </div>
                        </div>
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

  // Attendance tabs
  const renderCheckIn = () => (
    <div className="space-y-6">
      <AttendanceCheckIn farms={farms || []} />
    </div>
  );

  const renderAttendanceRecords = () => (
    <div className="space-y-6">
      <AttendanceRecords farms={farms || []} />
    </div>
  );

  const renderAttendanceReport = () => (
    <div className="space-y-6">
      <AttendanceReport farms={farms || []} />
    </div>
  );

  // Issuance tabs
  const renderPendingIssuance = () => (
    <div className="space-y-6">
      <PendingIssuances farms={farms || []} isSupervisor={false} />
    </div>
  );

  const renderDispatch = () => (
    <div className="space-y-6">
      <DispatchPhotoUpload />
    </div>
  );

  // Operations tabs
  const renderRequests = () => (
    <div className="space-y-6">
      <ItemRequests farms={farms || []} />
    </div>
  );

  const renderTransfers = () => (
    <div className="space-y-6">
      <InventoryTransfers farms={farms || []} />
    </div>
  );

  const renderPriceList = () => (
    <div className="space-y-6">
      <PriceListSection />
    </div>
  );

  const renderExpenses = () => (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Store Expenses</CardTitle>
          <CardDescription>Track and manage store-related expenses</CardDescription>
        </CardHeader>
        <CardContent>
          {!expenses || expenses.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground text-sm">No expenses found.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {expenses.map((expense: any) => (
                <Card key={expense.id}>
                  <CardContent className="p-4">
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-1">
                          <p className="font-medium">{expense.description}</p>
                          <Badge>Expense</Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mb-1">
                          Farm: {expense.farm?.name || 'Unknown Farm'}
                        </p>
                        <div className="grid grid-cols-3 gap-2 text-sm">
                          <div>
                            <span className="text-muted-foreground">Amount:</span>
                            <span className="font-medium ml-1">TZS {expense.amount.toLocaleString()}</span>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Date:</span>
                            <span className="font-medium ml-1">{new Date(expense.date_recorded).toLocaleDateString()}</span>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Crop:</span>
                            <span className="font-medium ml-1">{expense.crop_type || 'N/A'}</span>
                          </div>
                        </div>
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

  const getTitle = () => {
    const titles: Record<string, string> = {
      overview: 'Overview',
      'daily-stock': 'Daily Stock',
      'ytd-stock': 'YTD Stock',
      inventory: 'Inventory',
      movements: 'Stock Movements',
      'check-in': 'Check In',
      records: 'Attendance Records',
      report: 'Attendance Report',
      'pending-issuance': 'Pending Issuances',
      dispatch: 'Dispatch',
      requests: 'Item Requests',
      transfers: 'Transfers',
      'price-list': 'Price List',
      expenses: 'Expenses',
      'proc-pfi':      'PFI',
      'proc-lpo':      'LPO',
      'proc-grn':      'GRN',
      'proc-gin':      'GIN',
      'proc-cardex':   'CARDEX',
      'proc-tv':       'Transport Vouchers',
      'proc-dn':       'Delivery Notes',
      'proc-transfer': 'Internal Transfers',
      'proc-gatepass': 'Gate Passes',
    };
    return titles[activeTab] || 'Farm Clerk Dashboard';
  };

  return (
    <ErrorBoundary>
      <Layout
        user={user}
        onLogout={onLogout}
        sidebarItems={sidebarItems}
        activeTab={activeTab}
        onTabChange={handleTabChange}
        title={getTitle()}
      >
        {/* Keep tabs mounted but hidden to preserve data */}
        <div className={activeTab === 'overview' ? '' : 'hidden'}>
          {mountedTabs.has('overview') && renderOverview()}
        </div>

        {/* Stock visibility tabs */}
        <div className={activeTab === 'daily-stock' ? '' : 'hidden'}>
          {mountedTabs.has('daily-stock') && renderDailyStock()}
        </div>
        <div className={activeTab === 'ytd-stock' ? '' : 'hidden'}>
          {mountedTabs.has('ytd-stock') && renderYtdStock()}
        </div>
        <div className={activeTab === 'inventory' ? '' : 'hidden'}>
          {mountedTabs.has('inventory') && renderInventory()}
        </div>
        <div className={activeTab === 'movements' ? '' : 'hidden'}>
          {mountedTabs.has('movements') && renderMovements()}
        </div>

        {/* Attendance tabs */}
        <div className={activeTab === 'check-in' ? '' : 'hidden'}>
          {mountedTabs.has('check-in') && renderCheckIn()}
        </div>
        <div className={activeTab === 'records' ? '' : 'hidden'}>
          {mountedTabs.has('records') && renderAttendanceRecords()}
        </div>
        <div className={activeTab === 'report' ? '' : 'hidden'}>
          {mountedTabs.has('report') && renderAttendanceReport()}
        </div>

        {/* Issuance tabs */}
        <div className={activeTab === 'pending-issuance' ? '' : 'hidden'}>
          {mountedTabs.has('pending-issuance') && renderPendingIssuance()}
        </div>
        <div className={activeTab === 'dispatch' ? '' : 'hidden'}>
          {mountedTabs.has('dispatch') && renderDispatch()}
        </div>

        {/* Operations tabs */}
        <div className={activeTab === 'requests' ? '' : 'hidden'}>
          {mountedTabs.has('requests') && renderRequests()}
        </div>
        <div className={activeTab === 'transfers' ? '' : 'hidden'}>
          {mountedTabs.has('transfers') && renderTransfers()}
        </div>
        <div className={activeTab === 'price-list' ? '' : 'hidden'}>
          {mountedTabs.has('price-list') && renderPriceList()}
        </div>

        {/* Expenses */}
        <div className={activeTab === 'expenses' ? '' : 'hidden'}>
          {mountedTabs.has('expenses') && renderExpenses()}
        </div>

        {/* Procurement tabs */}
        <div className={activeTab === 'proc-pfi'      ? '' : 'hidden'}>{mountedTabs.has('proc-pfi')      && <SharedPfiSection userRole="farm_clerk" />}</div>
        <div className={activeTab === 'proc-lpo'      ? '' : 'hidden'}>{mountedTabs.has('proc-lpo')      && <SharedLpoSection userRole="farm_clerk" />}</div>
        <div className={activeTab === 'proc-grn'      ? '' : 'hidden'}>{mountedTabs.has('proc-grn')      && <SharedGrnSection userRole="farm_clerk" farmName={farms[0]?.name} />}</div>
        <div className={activeTab === 'proc-gin'      ? '' : 'hidden'}>{mountedTabs.has('proc-gin')      && <SharedGinSection userRole="farm_clerk" />}</div>
        <div className={activeTab === 'proc-cardex'   ? '' : 'hidden'}>{mountedTabs.has('proc-cardex')   && <SharedCardexSection userRole="farm_clerk" />}</div>
        <div className={activeTab === 'proc-tv'       ? '' : 'hidden'}>{mountedTabs.has('proc-tv')       && <SharedTransportVoucherSection userRole="farm_clerk" />}</div>
        <div className={activeTab === 'proc-dn'       ? '' : 'hidden'}>{mountedTabs.has('proc-dn')       && <SharedDeliveryNoteSection userRole="farm_clerk" />}</div>
        <div className={activeTab === 'proc-transfer' ? '' : 'hidden'}>{mountedTabs.has('proc-transfer') && <SharedTransferSection userRole="farm_clerk" />}</div>
        <div className={activeTab === 'proc-gatepass' ? '' : 'hidden'}>{mountedTabs.has('proc-gatepass') && <SharedGatePassSection userRole="farm_clerk" />}</div>
      </Layout>
    </ErrorBoundary>
  );
};

export { FarmClerkDashboard };
