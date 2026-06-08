"use client";

import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { useFinanceDashboard } from "@/components/dashboard/useFinanceDashboard";
import { ExpenseForm } from "@/components/expenses/ExpenseForm";
import { TransferForm } from "@/components/expenses/TransferForm";
import { IncomeForm } from "@/components/income/IncomeForm";
import { FinanceLoadingScreen } from "@/components/layout/FinanceLoadingScreen";
import { LendingDetails } from "@/components/lending/LendingDetails";
import { LendingForm } from "@/components/lending/LendingForm";
import { PasscodeLock } from "@/components/settings/PasscodeLock";

export default function Home() {
  const dashboard = useFinanceDashboard();

  if (!dashboard.authReady) return null;
  if (!dashboard.isUnlocked) return <PasscodeLock state={dashboard} />;
  if (dashboard.loading) return <FinanceLoadingScreen />;
  if (dashboard.loadError) {
    return (
      <FinanceLoadingScreen
        error={dashboard.loadError}
        onRetry={dashboard.retryLoad}
      />
    );
  }

  return (
    <>
      <DashboardLayout state={dashboard} />
      {dashboard.showIncomeForm && <IncomeForm state={dashboard} />}
      {dashboard.showExpenseForm && <ExpenseForm state={dashboard} />}
      {dashboard.showTransferForm && <TransferForm state={dashboard} />}
      {(dashboard.showLentForm || dashboard.showBorrowedForm) && <LendingForm state={dashboard} />}
      {dashboard.detailsView && <LendingDetails state={dashboard} />}
    </>
  );
}
