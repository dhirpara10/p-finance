import type {
  TransactionInput,
  ValidationError,
  ValidationResult,
} from "./types";

/**
 * validateTransaction
 *
 * Pure validation function — no I/O.
 * Returns {valid, errors} with all errors collected in one pass.
 */
export function validateTransaction(input: TransactionInput): ValidationResult {
  const errors: ValidationError[] = [];

  const err = (field: string, message: string) => errors.push({ field, message });

  // ── Universal rules ────────────────────────────────────────────────────────

  if (!input.amount || input.amount <= 0) {
    err("amount", "Amount must be a positive number.");
  }

  if (!input.date) {
    err("date", "Date is required.");
  }

  if (!input.currency) {
    err("currency", "Currency is required.");
  }

  // ── Type-specific rules ────────────────────────────────────────────────────

  switch (input.type) {
    case "income": {
      const cashReceived = Number(input.metadata?.cashReceived ?? 0);
      if (cashReceived < 0) {
        err("cashReceived", "Cash received cannot be negative.");
      }
      if (cashReceived > input.amount) {
        err("cashReceived", "Cash received cannot exceed total income amount.");
      }
      break;
    }

    case "expense":
    case "credit_card_purchase":
    case "bnpl_purchase":
    case "bnpl_repayment":
    case "credit_card_repayment": {
      if (!input.accountId && input.type !== "credit_card_purchase") {
        err("accountId", "Account is required for this transaction.");
      }
      break;
    }

    case "bnpl_purchase": {
      const upfront = Number(input.metadata?.upfrontPayment ?? 0);
      if (upfront < 0) {
        err("upfrontPayment", "Upfront payment cannot be negative.");
      }
      if (upfront > input.amount) {
        err("upfrontPayment", "Upfront payment cannot exceed purchase amount.");
      }
      break;
    }

    case "loan_repayment": {
      const principal = Number(input.metadata?.principalAmount ?? 0);
      const interest = Number(input.metadata?.interestAmount ?? 0);
      const fee = Number(input.metadata?.feeAmount ?? 0);
      const total = principal + interest + fee;
      if (total > 0 && Math.abs(total - input.amount) > 0.01) {
        err(
          "amount",
          `Principal (${principal}) + interest (${interest}) + fees (${fee}) = ${total} must equal repayment amount (${input.amount}).`
        );
      }
      break;
    }

    case "transfer": {
      if (!input.sourceAccountId && !input.accountId) {
        err("sourceAccountId", "Transfer requires a source account.");
      }
      if (!input.destinationAccountId) {
        err("destinationAccountId", "Transfer requires a destination account.");
      }
      const src = input.sourceAccountId ?? input.accountId;
      const dst = input.destinationAccountId;
      if (src && dst && src === dst) {
        err("destinationAccountId", "Transfer source and destination cannot be the same.");
      }
      break;
    }

    case "bucket_fund":
    case "bucket_withdraw": {
      if (!input.bucketId) {
        err("bucketId", "Bucket ID is required.");
      }
      if (!input.accountId) {
        err("accountId", "Account (Bank or Cash) is required.");
      }
      break;
    }

    case "jar_allocation":
    case "jar_withdraw": {
      if (!input.accountId) {
        err("accountId", "Account (Bank or Cash) is required.");
      }
      break;
    }

    case "lent":
    case "borrowed": {
      if (!input.personId) {
        err("personId", "A person must be selected or created.");
      }
      if (!input.accountId) {
        err("accountId", "Account (Bank or Cash) is required.");
      }
      break;
    }

    case "settlement_received":
    case "settlement_paid": {
      if (!input.personId) {
        err("personId", "A person must be selected for this settlement.");
      }
      if (!input.accountId) {
        err("accountId", "Account (Bank or Cash) is required.");
      }
      break;
    }

    case "remittance": {
      const affectsBalance = input.metadata?.affectsBalance !== false;
      if (affectsBalance && !input.accountId) {
        err("accountId", "Source account is required for remittance.");
      }
      if (!input.metadata?.exchangeRate && !input.metadata?.inrAmount) {
        err("exchangeRate", "Exchange rate or INR amount is required.");
      }
      break;
    }
  }

  return { valid: errors.length === 0, errors };
}
