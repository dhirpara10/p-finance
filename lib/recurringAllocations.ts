import type {
  AllocationFrequency,
  RecurringJarAllocation,
  Transfer,
} from "@/lib/types";

export function addAllocationFrequency(
  dateString: string,
  frequency: AllocationFrequency
) {
  const date = new Date(`${dateString}T12:00:00Z`);
  if (Number.isNaN(date.getTime())) {
    throw new Error("Recurring allocation date is invalid.");
  }

  if (frequency === "weekly") date.setUTCDate(date.getUTCDate() + 7);
  if (frequency === "biweekly") date.setUTCDate(date.getUTCDate() + 14);
  if (frequency === "monthly") {
    const originalDay = date.getUTCDate();
    date.setUTCDate(1);
    date.setUTCMonth(date.getUTCMonth() + 1);
    const lastDay = new Date(
      Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + 1, 0)
    ).getUTCDate();
    date.setUTCDate(Math.min(originalDay, lastDay));
  }
  if (frequency === "yearly") {
    const month = date.getUTCMonth();
    const day = date.getUTCDate();
    date.setUTCDate(1);
    date.setUTCFullYear(date.getUTCFullYear() + 1);
    date.setUTCMonth(month);
    const lastDay = new Date(
      Date.UTC(date.getUTCFullYear(), month + 1, 0)
    ).getUTCDate();
    date.setUTCDate(Math.min(day, lastDay));
  }
  return date.toISOString().split("T")[0];
}

export function recurringExecutionId(ruleId: string, executionDate: string) {
  return `recurring-${ruleId}-${executionDate}`;
}

export function getDueAllocationDates(
  rule: RecurringJarAllocation,
  today = new Date().toISOString().split("T")[0]
) {
  if (!rule.active || rule.allocationAmount <= 0 || !rule.nextExecutionDate) {
    return [];
  }

  const dates: string[] = [];
  let cursor = rule.nextExecutionDate;
  let guard = 0;
  while (cursor <= today && guard < 120) {
    dates.push(cursor);
    cursor = addAllocationFrequency(cursor, rule.frequency);
    guard += 1;
  }
  return dates;
}

export function hasAllocationExecution(
  transfers: Transfer[],
  ruleId: string,
  executionDate: string
) {
  const expectedId = recurringExecutionId(ruleId, executionDate);
  return transfers.some(
    (transfer) =>
      String(transfer.id) === expectedId ||
      (transfer.recurringAllocationId === ruleId &&
        transfer.executionDate === executionDate)
  );
}

export function advanceRecurringAllocation(
  rule: RecurringJarAllocation,
  executionDate: string,
  updatedAt = new Date().toISOString()
) {
  return {
    ...rule,
    lastExecutionDate: executionDate,
    nextExecutionDate: addAllocationFrequency(
      executionDate,
      rule.frequency
    ),
    updatedAt,
  };
}
