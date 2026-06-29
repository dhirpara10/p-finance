import type {
  LendingTransaction,
  LendingTransactionRecord,
  MoneyRecord,
  Person,
  PersonProfile,
} from "@/lib/types";

export function normalizePersonName(name: string) {
  return name.trim().replace(/\s+/g, " ").toLowerCase();
}

function legacyProfileId(name: string) {
  const slug = normalizePersonName(name).replace(/[^a-z0-9]+/g, "-");
  return `legacy-${slug || "unknown"}`;
}

function getTransactionTime(transaction: LendingTransaction) {
  const time = new Date(transaction.date).getTime();
  return Number.isFinite(time) ? time : 0;
}

function compareTransactionIds(a: string | number, b: string | number) {
  const first = Number(a);
  const second = Number(b);

  if (Number.isFinite(first) && Number.isFinite(second)) {
    return first - second;
  }

  return String(a).localeCompare(String(b));
}

function getBalance(transactions: LendingTransaction[]) {
  const totalLent = transactions
    .filter((transaction) => transaction.type === "lent")
    .reduce((sum, transaction) => sum + transaction.amount, 0);

  const totalBorrowed = transactions
    .filter((transaction) => transaction.type === "borrowed")
    .reduce((sum, transaction) => sum + transaction.amount, 0);

  const totalSettled = transactions
    .filter((transaction) => transaction.type === "settlement")
    .reduce((sum, transaction) => sum + transaction.amount, 0);

  const grossBalance = totalLent - totalBorrowed;

  if (grossBalance > 0) {
    return grossBalance - totalSettled;
  }

  if (grossBalance < 0) {
    return grossBalance + totalSettled;
  }

  return 0;
}

function getStatus(balance: number) {
  if (balance > 0) return `They owe me $${balance.toLocaleString()}`;
  if (balance < 0) return `I owe them $${Math.abs(balance).toLocaleString()}`;
  return "Settled";
}

export function findPersonByName(people: Person[], name: string) {
  const normalizedName = normalizePersonName(name);
  return people.find((person) => normalizePersonName(person.name) === normalizedName);
}

export function buildPersonProfiles({
  people,
  lendingTransactions,
  legacyLentRecords,
  legacyBorrowedRecords,
}: {
  people: Person[];
  lendingTransactions: LendingTransactionRecord[];
  legacyLentRecords: MoneyRecord[];
  legacyBorrowedRecords: MoneyRecord[];
}) {
  const profiles = new Map<string, PersonProfile>();

  function getPersonKey(person: Person) {
    return String(person.id);
  }

  function ensureProfileFromPerson(person: Person) {
    const key = getPersonKey(person);
    const existing = profiles.get(key);

    if (existing) {
      existing.id = person.id;
      existing.personId = person.id;
      existing.phone = existing.phone || person.phone || undefined;
      existing.createdAt = person.createdAt || existing.createdAt;
      existing.updatedAt = person.updatedAt || existing.updatedAt;
      return existing;
    }

    const profile: PersonProfile = {
      id: person.id,
      personId: person.id,
      name: person.name,
      phone: person.phone || undefined,
      createdAt: person.createdAt,
      updatedAt: person.updatedAt,
      transactions: [],
      totalLent: 0,
      totalBorrowed: 0,
      totalSettled: 0,
      netBalance: 0,
      status: "Settled",
    };

    profiles.set(key, profile);
    return profile;
  }

  function ensureFallbackProfile(record: LendingTransactionRecord) {
    const key = record.personId != null
      ? `fallback:${String(record.personId)}`
      : `fallback:unknown:${String(record.id)}`;
    const existing = profiles.get(key);
    if (existing) return existing;

    const fallbackName = String(record.note || "").trim() || "Unknown Person";
    const profile: PersonProfile = {
      id: record.personId ?? `unknown-${record.id}`,
      personId: record.personId,
      name: fallbackName,
      phone: undefined,
      createdAt: record.createdAt || record.date || "",
      updatedAt: undefined,
      transactions: [],
      totalLent: 0,
      totalBorrowed: 0,
      totalSettled: 0,
      netBalance: 0,
      status: "Settled",
    };

    profiles.set(key, profile);
    return profile;
  }

  function ensureLegacyProfile(record: MoneyRecord) {
    const existingPerson = findPersonByName(people, record.name);
    if (existingPerson) return ensureProfileFromPerson(existingPerson);

    const key = normalizePersonName(record.name);
    const existing = profiles.get(key);

    if (existing) {
      if (!existing.phone && record.phone) existing.phone = record.phone;
      if (record.date && (!existing.createdAt || record.date < existing.createdAt)) {
        existing.createdAt = record.date;
      }
      return existing;
    }

    const profile: PersonProfile = {
      id: legacyProfileId(record.name),
      name: record.name.trim(),
      phone: record.phone || undefined,
      createdAt: record.date,
      transactions: [],
      totalLent: 0,
      totalBorrowed: 0,
      totalSettled: 0,
      netBalance: 0,
      status: "Settled",
    };

    profiles.set(key, profile);
    return profile;
  }

  people.forEach(ensureProfileFromPerson);

  lendingTransactions.forEach((record) => {
    const person = people.find(
      (item) => String(item.id) === String(record.personId)
    );

    const profile = person
      ? ensureProfileFromPerson(person)
      : ensureFallbackProfile(record);

    profile.transactions.push({
      id: record.id,
      personId: record.personId,
      type: record.type,
      amount: record.amount,
      account: record.account,
      affectsAccountBalance: record.affectsAccountBalance,
      date: record.date,
      note: record.note || undefined,
      createdAt: record.createdAt,
      commitmentDate: record.commitmentDate || undefined,
    });
  });

  legacyLentRecords.forEach((record) => {
    const profile = ensureLegacyProfile(record);
    profile.transactions.push({
      id: record.id,
      type: "lent",
      amount: record.amount,
      date: record.date,
      note: record.notes || undefined,
      legacy: true,
    });
  });

  legacyBorrowedRecords.forEach((record) => {
    const profile = ensureLegacyProfile(record);
    profile.transactions.push({
      id: record.id,
      type: "borrowed",
      amount: record.amount,
      date: record.date,
      note: record.notes || undefined,
      legacy: true,
    });
  });

  return [...profiles.values()]
    .map((profile) => {
      const transactions = [...profile.transactions].sort(
        (a, b) =>
          getTransactionTime(b) - getTransactionTime(a) ||
          compareTransactionIds(b.id, a.id)
      );
      const totalLent = transactions
        .filter((transaction) => transaction.type === "lent")
        .reduce((sum, transaction) => sum + transaction.amount, 0);
      const totalBorrowed = transactions
        .filter((transaction) => transaction.type === "borrowed")
        .reduce((sum, transaction) => sum + transaction.amount, 0);
      const totalSettled = transactions
        .filter((transaction) => transaction.type === "settlement")
        .reduce((sum, transaction) => sum + transaction.amount, 0);
      const netBalance = getBalance(transactions);

      return {
        ...profile,
        transactions,
        totalLent,
        totalBorrowed,
        totalSettled,
        netBalance,
        status: getStatus(netBalance),
      };
    })
    .sort((a, b) => Math.abs(b.netBalance) - Math.abs(a.netBalance));
}
