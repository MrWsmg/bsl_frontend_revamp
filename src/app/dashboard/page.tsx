"use client";

import { useAuth } from "@/contexts/AuthContext";
import { ErrorBoundary } from "@/components/common/ErrorBoundary";
import { AdminDashboard } from "@/components/dashboards/AdminDashboard";
import { PayrollDashboard } from "@/components/dashboards/PayrollDashboard";
import { StockDashboard } from "@/components/dashboards/StockDashboard";
import { FarmClerkDashboard } from "@/components/dashboards/FarmClerkDashboard";
import { SupervisorDashboard } from "@/components/dashboards/SupervisorDashboard";
import { WorkerDashboard } from "@/components/dashboards/WorkerDashboard";
import { ManagerDashboard } from "@/components/dashboards/ManagerDashboard";
import { AccountManagerDashboard } from "@/components/dashboards/AccountManagerDashboard";
import { FinancialControllerDashboard } from "@/components/dashboards/FinancialControllerDashboard";
import { PayrollMasterDashboard } from "@/components/dashboards/PayrollMasterDashboard";
import { FactorySupervisorDashboard } from "@/components/dashboards/FactorySupervisorDashboard";
import { PickingDashboard } from "@/components/dashboards/PickingDashboard";
import { GodownManagerDashboard } from "@/components/dashboards/GodownManagerDashboard";
import { HarvestOperationsDashboard } from "@/components/dashboards/HarvestOperationsDashboard";
import { Toaster } from "@/components/ui/sonner";
import { USER_ROLES } from "@/constants";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

// Dashboard component mapping
const DashboardComponents: Record<string, React.ComponentType<any>> = {
  [USER_ROLES.ADMIN]: AdminDashboard,
  [USER_ROLES.PAYROLL]: PayrollDashboard,
  [USER_ROLES.STOCK]: StockDashboard,
  [USER_ROLES.FARM_CLERK]: FarmClerkDashboard,
  [USER_ROLES.SUPERVISOR]: SupervisorDashboard,
  [USER_ROLES.WORKER]: WorkerDashboard,
  [USER_ROLES.MANAGER]: ManagerDashboard,
  [USER_ROLES.ACCOUNT_MANAGER]: AccountManagerDashboard,
  [USER_ROLES.FINANCIAL_CONTROLLER]: FinancialControllerDashboard,
  [USER_ROLES.PAYROLL_MASTER]: PayrollMasterDashboard,
  [USER_ROLES.FACTORY_SUPERVISOR]: FactorySupervisorDashboard,
  [USER_ROLES.SCALE_SUPERVISOR]: PickingDashboard,
  [USER_ROLES.GODOWN_MANAGER]: GodownManagerDashboard,
  [USER_ROLES.GENERAL_MANAGER]: HarvestOperationsDashboard,
};

export default function DashboardPage() {
  const { user, loading, logout } = useAuth();
  const router = useRouter();

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!loading && !user) {
      router.push("/");
    }
  }, [user, loading, router]);

  // Show loading state while checking authentication
  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  // Show nothing while redirecting
  if (!user) {
    return null;
  }

  // Get the appropriate dashboard component based on user role
  const DashboardComponent = DashboardComponents[user.role];

  if (!DashboardComponent) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="bg-card p-8 rounded-lg shadow-md">
          <h2 className="text-xl font-bold text-foreground mb-4">Access Denied</h2>
          <p className="text-muted-foreground">
            Your account doesn&apos;t have the necessary permissions.
          </p>
          <p className="text-muted-foreground text-sm mt-2">Role: {user.role}</p>
          <button
            onClick={logout}
            className="mt-4 bg-primary hover:bg-primary/90 text-primary-foreground px-4 py-2 rounded-md"
          >
            Back to Login
          </button>
        </div>
      </div>
    );
  }

  // Render the appropriate dashboard
  return (
    <ErrorBoundary>
      <DashboardComponent user={user} onLogout={logout} />
      <Toaster />
    </ErrorBoundary>
  );
}
