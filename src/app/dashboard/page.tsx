"use client";

import { useAuth } from "@/contexts/AuthContext";
import { ErrorBoundary } from "@/components/common/ErrorBoundary";
import { Toaster } from "@/components/ui/sonner";
import { USER_ROLES } from "@/constants";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import dynamic from "next/dynamic";

const LoadingSpinner = () => (
  <div className="min-h-screen bg-background flex items-center justify-center">
    <div className="text-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
      <p className="text-muted-foreground">Loading...</p>
    </div>
  </div>
);

// Dashboard component mapping — each is a separate chunk loaded on demand
const DashboardComponents: Record<string, React.ComponentType<any>> = {
  [USER_ROLES.ADMIN]: dynamic(() => import("@/components/dashboards/AdminDashboard").then(m => ({ default: m.AdminDashboard })), { loading: LoadingSpinner }),
  [USER_ROLES.PAYROLL]: dynamic(() => import("@/components/dashboards/PayrollDashboard").then(m => ({ default: m.PayrollDashboard })), { loading: LoadingSpinner }),
  [USER_ROLES.STOCK]: dynamic(() => import("@/components/dashboards/StockDashboard").then(m => ({ default: m.StockDashboard })), { loading: LoadingSpinner }),
  [USER_ROLES.FARM_CLERK]: dynamic(() => import("@/components/dashboards/FarmClerkDashboard").then(m => ({ default: m.FarmClerkDashboard })), { loading: LoadingSpinner }),
  [USER_ROLES.SUPERVISOR]: dynamic(() => import("@/components/dashboards/SupervisorDashboard").then(m => ({ default: m.SupervisorDashboard })), { loading: LoadingSpinner }),
  [USER_ROLES.WORKER]: dynamic(() => import("@/components/dashboards/WorkerDashboard").then(m => ({ default: m.WorkerDashboard })), { loading: LoadingSpinner }),
  [USER_ROLES.MANAGER]: dynamic(() => import("@/components/dashboards/ManagerDashboard").then(m => ({ default: m.ManagerDashboard })), { loading: LoadingSpinner }),
  [USER_ROLES.ACCOUNT_MANAGER]: dynamic(() => import("@/components/dashboards/AccountManagerDashboard").then(m => ({ default: m.AccountManagerDashboard })), { loading: LoadingSpinner }),
  [USER_ROLES.FINANCIAL_CONTROLLER]: dynamic(() => import("@/components/dashboards/FinancialControllerDashboard").then(m => ({ default: m.FinancialControllerDashboard })), { loading: LoadingSpinner }),
  [USER_ROLES.PAYROLL_MASTER]: dynamic(() => import("@/components/dashboards/PayrollMasterDashboard").then(m => ({ default: m.PayrollMasterDashboard })), { loading: LoadingSpinner }),
  [USER_ROLES.FACTORY_SUPERVISOR]: dynamic(() => import("@/components/dashboards/FactorySupervisorDashboard").then(m => ({ default: m.FactorySupervisorDashboard })), { loading: LoadingSpinner }),
  [USER_ROLES.GODOWN_MANAGER]: dynamic(() => import("@/components/dashboards/GodownManagerDashboard").then(m => ({ default: m.GodownManagerDashboard })), { loading: LoadingSpinner }),
  [USER_ROLES.GENERAL_MANAGER]: dynamic(() => import("@/components/dashboards/GeneralManagerDashboard").then(m => ({ default: m.GeneralManagerDashboard })), { loading: LoadingSpinner }),
  [USER_ROLES.PROCUREMENT_OFFICER]: dynamic(() => import("@/components/dashboards/ProcurementOfficerDashboard").then(m => ({ default: m.ProcurementOfficerDashboard })), { loading: LoadingSpinner }),
  [USER_ROLES.MANAGING_DIRECTOR]: dynamic(() => import("@/components/dashboards/AdminManagerDashboard"), { loading: LoadingSpinner }),
  [USER_ROLES.SUB_SUPERVISOR]: dynamic(() => import("@/components/dashboards/SupervisorDashboard").then(m => ({ default: m.SupervisorDashboard })), { loading: LoadingSpinner }),
  [USER_ROLES.SCALE_SUPERVISOR]: dynamic(() => import("@/components/dashboards/PickingDashboard"), { loading: LoadingSpinner }),
};

export default function DashboardPage() {
  const { user, loading, logout } = useAuth();
  const router = useRouter();

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!loading && !user) {
      // Clear the token cookie so the middleware doesn't redirect back here
      document.cookie = "token=; path=/; max-age=0";
      router.push("/");
    }
  }, [user, loading, router]);

  // Show loading state while checking authentication
  if (loading) {
    return <LoadingSpinner />;
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
