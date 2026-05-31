"use client";

import { AuthGate } from "@/components/dashboard/AuthGate";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { LoadingState } from "@/components/dashboard/LoadingState";
import { useFinanceDashboard } from "@/components/dashboard/useFinanceDashboard";
import { ExpenseForm } from "@/components/expenses/ExpenseForm";
import { TransferForm } from "@/components/expenses/TransferForm";
import { IncomeForm } from "@/components/income/IncomeForm";
import { LendingDetails } from "@/components/lending/LendingDetails";
import { LendingForm } from "@/components/lending/LendingForm";
import { SettingsForm } from "@/components/settings/SettingsForm";

export default function Home() {
  const dashboard = useFinanceDashboard();

  if (!dashboard.authReady) return null;
  if (!dashboard.isUnlocked) return <AuthGate state={dashboard} />;
  if (dashboard.loading) return <LoadingState />;

  return (
    <>
      <DashboardLayout state={dashboard} />
      {dashboard.showIncomeForm && <IncomeForm state={dashboard} />}
      {dashboard.showExpenseForm && <ExpenseForm state={dashboard} />}
      {dashboard.showTransferForm && <TransferForm state={dashboard} />}
      {(dashboard.showLentForm || dashboard.showBorrowedForm) && <LendingForm state={dashboard} />}
      {dashboard.detailsView && <LendingDetails state={dashboard} />}
      {dashboard.showSettingsForm && <SettingsForm state={dashboard} />}
    </>
  );
}
