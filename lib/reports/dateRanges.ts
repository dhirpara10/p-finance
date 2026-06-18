export type ReportPeriod = "monthly" | "calendar_ytd" | "financial_ytd" | "yearly" | "custom";

export type DateRange = {
  start: Date;
  end: Date;
  label: string;
  filenameSlug: string;
};

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

const MONTH_SLUGS = [
  "january", "february", "march", "april", "may", "june",
  "july", "august", "september", "october", "november", "december",
];

export function getMonthRange(year: number, month: number): DateRange {
  // month is 1-12
  const start = new Date(year, month - 1, 1);
  const end = new Date(year, month, 0); // last day of month
  end.setHours(23, 59, 59, 999);
  return {
    start,
    end,
    label: `${MONTH_NAMES[month - 1]} ${year}`,
    filenameSlug: `${MONTH_SLUGS[month - 1]}-${year}`,
  };
}

export function getCalendarYTD(year?: number): DateRange {
  const y = year ?? new Date().getFullYear();
  const start = new Date(y, 0, 1);
  const end = new Date();
  end.setHours(23, 59, 59, 999);
  return {
    start,
    end,
    label: `Calendar YTD ${y}`,
    filenameSlug: `calendar-ytd-${y}`,
  };
}

export function getFinancialYTD(): DateRange {
  const today = new Date();
  const currentYear = today.getFullYear();
  const jul1ThisYear = new Date(currentYear, 6, 1); // July 1 current year
  const fyStart = today >= jul1ThisYear
    ? jul1ThisYear
    : new Date(currentYear - 1, 6, 1);
  const fyYear = fyStart.getFullYear();
  const end = new Date();
  end.setHours(23, 59, 59, 999);
  return {
    start: fyStart,
    end,
    label: `Financial YTD FY${fyYear}/${String(fyYear + 1).slice(2)}`,
    filenameSlug: `financial-ytd-fy${fyYear}`,
  };
}

export function getYearlyRange(year: number): DateRange {
  const start = new Date(year, 0, 1);
  const end = new Date(year, 11, 31);
  end.setHours(23, 59, 59, 999);
  return {
    start,
    end,
    label: `Full Year ${year}`,
    filenameSlug: `yearly-${year}`,
  };
}

export function getCustomRange(start: Date, end: Date): DateRange {
  const fmt = (d: Date) =>
    `${d.getDate()} ${MONTH_NAMES[d.getMonth()]} ${d.getFullYear()}`;
  const fmtSlug = (d: Date) =>
    `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, "0")}${String(d.getDate()).padStart(2, "0")}`;
  return {
    start,
    end,
    label: `${fmt(start)} – ${fmt(end)}`,
    filenameSlug: `custom-${fmtSlug(start)}-to-${fmtSlug(end)}`,
  };
}

export function isInRange(dateStr: string, range: DateRange): boolean {
  if (!dateStr) return false;
  const d = new Date(dateStr);
  return d >= range.start && d <= range.end;
}
