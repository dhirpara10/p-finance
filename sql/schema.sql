-- =============================================================================
-- Personal Finance App — Normalized PostgreSQL Schema
-- Target: Supabase (PostgreSQL 15+ with auth.users and RLS)
-- IMPORTANT: Run this in Supabase SQL Editor (Dashboard → SQL Editor → New Query)
-- =============================================================================

-- =============================================================================
-- SECTION 1: USER SETTINGS
-- One row per user. "settings" JSONB stores all key-value preferences.
-- "features" JSONB controls which modules are visible.
-- =============================================================================

CREATE TABLE IF NOT EXISTS user_settings (
    user_id     UUID        PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    settings    JSONB       NOT NULL DEFAULT '{}',
    features    JSONB       NOT NULL DEFAULT '{
        "remittance":  false,
        "lending":     true,
        "liabilities": true,
        "asset_vault": true,
        "goals":       true,
        "shared_jar":  true,
        "multi_user":  false
    }',
    updated_at  TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY user_settings_all ON user_settings FOR ALL USING (auth.uid() = user_id);

-- Helper RPC: upsert a single key into the settings JSONB without overwriting others
CREATE OR REPLACE FUNCTION upsert_setting(p_key TEXT, p_value JSONB)
RETURNS void LANGUAGE sql SECURITY DEFINER AS $$
    INSERT INTO user_settings (user_id, settings)
    VALUES (auth.uid(), jsonb_build_object(p_key, p_value))
    ON CONFLICT (user_id)
    DO UPDATE SET
        settings   = user_settings.settings || jsonb_build_object(p_key, p_value),
        updated_at = now();
$$;

-- Helper RPC: upsert a feature flag
CREATE OR REPLACE FUNCTION upsert_feature(p_key TEXT, p_enabled BOOLEAN)
RETURNS void LANGUAGE sql SECURITY DEFINER AS $$
    INSERT INTO user_settings (user_id, features)
    VALUES (auth.uid(), jsonb_build_object(p_key, p_enabled))
    ON CONFLICT (user_id)
    DO UPDATE SET
        features   = user_settings.features || jsonb_build_object(p_key, p_enabled),
        updated_at = now();
$$;


-- =============================================================================
-- SECTION 2: INCOME
-- id is TEXT so JS can use timestamp strings (e.g. Date.now())
-- =============================================================================

CREATE TABLE IF NOT EXISTS income (
    id              TEXT        PRIMARY KEY,
    user_id         UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    income_type     TEXT        NOT NULL DEFAULT 'Fixed Amount',
    source          TEXT,
    rate            NUMERIC     DEFAULT 0,
    hours           NUMERIC     DEFAULT 0,
    amount          NUMERIC     NOT NULL DEFAULT 0,
    cash_received   NUMERIC     DEFAULT 0,
    date            DATE        NOT NULL,
    notes           TEXT        DEFAULT '',
    added_by        TEXT        DEFAULT 'me',
    created_at      TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE income ENABLE ROW LEVEL SECURITY;
CREATE POLICY income_all ON income FOR ALL USING (auth.uid() = user_id);
CREATE INDEX IF NOT EXISTS income_user_date ON income(user_id, date DESC);


-- =============================================================================
-- SECTION 3: EXPENSES
-- =============================================================================

CREATE TABLE IF NOT EXISTS expenses (
    id                      TEXT        PRIMARY KEY,
    user_id                 UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    amount                  NUMERIC     NOT NULL DEFAULT 0,
    category                TEXT        NOT NULL DEFAULT '',
    category_id             TEXT        DEFAULT '',
    account                 TEXT        NOT NULL DEFAULT 'Bank',
    payment_method          TEXT        DEFAULT 'Bank',
    liability_id            TEXT,
    date                    DATE        NOT NULL,
    notes                   TEXT        DEFAULT '',
    is_recurring            BOOLEAN     DEFAULT false,
    recurring_frequency     TEXT,
    recurring_start_date    DATE,
    recurring_end_date      DATE,
    recurring_status        TEXT        DEFAULT 'active',
    added_by                TEXT        DEFAULT 'me',
    created_at              TIMESTAMPTZ DEFAULT now(),
    updated_at              TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;
CREATE POLICY expenses_all ON expenses FOR ALL USING (auth.uid() = user_id);
CREATE INDEX IF NOT EXISTS expenses_user_date ON expenses(user_id, date DESC);


-- =============================================================================
-- SECTION 4: TRANSFERS
-- =============================================================================

CREATE TABLE IF NOT EXISTS transfers (
    id          TEXT        PRIMARY KEY,
    user_id     UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    from_bucket TEXT        NOT NULL DEFAULT 'Bank',
    to_bucket   TEXT        NOT NULL DEFAULT 'Bank',
    amount      NUMERIC     NOT NULL DEFAULT 0,
    date        DATE        NOT NULL,
    notes       TEXT        DEFAULT '',
    tracker_id  TEXT,
    added_by    TEXT        DEFAULT 'me',
    created_at  TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE transfers ENABLE ROW LEVEL SECURITY;
CREATE POLICY transfers_all ON transfers FOR ALL USING (auth.uid() = user_id);
CREATE INDEX IF NOT EXISTS transfers_user_date ON transfers(user_id, date DESC);


-- =============================================================================
-- SECTION 5: BUCKET / TRACKER / CATEGORY DEFINITIONS
-- Composite PK: (user_id, id) — id is a text slug like "savings_emergency_fund"
-- =============================================================================

CREATE TABLE IF NOT EXISTS bucket_definitions (
    id          TEXT        NOT NULL,
    user_id     UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name        TEXT        NOT NULL,
    type        TEXT        NOT NULL DEFAULT 'protected' CHECK (type IN ('protected', 'jar')),
    target_amount   NUMERIC,
    is_active   BOOLEAN     DEFAULT true,
    sort_order  INT         DEFAULT 0,
    icon        TEXT,
    color       TEXT,
    created_at  TIMESTAMPTZ DEFAULT now(),
    updated_at  TIMESTAMPTZ DEFAULT now(),
    PRIMARY KEY (user_id, id)
);

ALTER TABLE bucket_definitions ENABLE ROW LEVEL SECURITY;
CREATE POLICY bucket_defs_all ON bucket_definitions FOR ALL USING (auth.uid() = user_id);

CREATE TABLE IF NOT EXISTS tracker_definitions (
    id                  TEXT    NOT NULL,
    user_id             UUID    NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name                TEXT    NOT NULL,
    monthly_cap         NUMERIC,
    is_active           BOOLEAN DEFAULT true,
    sort_order          INT     DEFAULT 0,
    icon                TEXT,
    color               TEXT,
    recurring_source    TEXT,
    recurring_amount    NUMERIC,
    recurring_frequency TEXT,
    recurring_active    BOOLEAN DEFAULT false,
    created_at          TIMESTAMPTZ DEFAULT now(),
    updated_at          TIMESTAMPTZ DEFAULT now(),
    PRIMARY KEY (user_id, id)
);

ALTER TABLE tracker_definitions ENABLE ROW LEVEL SECURITY;
CREATE POLICY tracker_defs_all ON tracker_definitions FOR ALL USING (auth.uid() = user_id);

CREATE TABLE IF NOT EXISTS category_definitions (
    id          TEXT    NOT NULL,
    user_id     UUID    NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name        TEXT    NOT NULL,
    kind        TEXT    DEFAULT 'expense',
    is_active   BOOLEAN DEFAULT true,
    sort_order  INT     DEFAULT 0,
    icon        TEXT,
    color       TEXT,
    created_at  TIMESTAMPTZ DEFAULT now(),
    updated_at  TIMESTAMPTZ DEFAULT now(),
    PRIMARY KEY (user_id, id)
);

ALTER TABLE category_definitions ENABLE ROW LEVEL SECURITY;
CREATE POLICY category_defs_all ON category_definitions FOR ALL USING (auth.uid() = user_id);

CREATE TABLE IF NOT EXISTS category_tracker_links (
    id          TEXT        PRIMARY KEY,
    user_id     UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    category_id TEXT        NOT NULL,
    tracker_id  TEXT        NOT NULL,
    is_active   BOOLEAN     DEFAULT true,
    created_at  TIMESTAMPTZ DEFAULT now(),
    UNIQUE (user_id, category_id)
);

ALTER TABLE category_tracker_links ENABLE ROW LEVEL SECURITY;
CREATE POLICY ct_links_all ON category_tracker_links FOR ALL USING (auth.uid() = user_id);


-- =============================================================================
-- SECTION 6: LIABILITIES
-- =============================================================================

CREATE TABLE IF NOT EXISTS liabilities (
    id                      TEXT        PRIMARY KEY,
    user_id                 UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    type                    TEXT        NOT NULL CHECK (type IN ('bnpl', 'credit_card', 'loan')),
    name                    TEXT        NOT NULL DEFAULT '',
    provider                TEXT        DEFAULT '',
    original_amount         NUMERIC     DEFAULT 0,
    outstanding_balance     NUMERIC     DEFAULT 0,
    status                  TEXT        DEFAULT 'active' CHECK (status IN ('active', 'paid', 'closed')),
    category                TEXT        DEFAULT '',
    notes                   TEXT        DEFAULT '',
    -- BNPL fields
    purchase_amount         NUMERIC,
    first_payment_date      DATE,
    number_of_payments      INT,
    payment_frequency       TEXT,
    installment_amount      NUMERIC,
    purchase_date           DATE,
    -- Credit card fields
    credit_limit            NUMERIC,
    current_balance         NUMERIC,
    statement_date          INT,
    due_date                INT,
    minimum_payment         NUMERIC,
    interest_rate           NUMERIC,
    annual_fee              NUMERIC,
    -- Loan fields
    principal_amount        NUMERIC,
    interest_type           TEXT,
    compounding_frequency   TEXT,
    repayment_amount        NUMERIC,
    repayment_frequency     TEXT,
    start_date              DATE,
    end_date                DATE,
    term_months             INT,
    created_at              TIMESTAMPTZ DEFAULT now(),
    updated_at              TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE liabilities ENABLE ROW LEVEL SECURITY;
CREATE POLICY liabilities_all ON liabilities FOR ALL USING (auth.uid() = user_id);
CREATE INDEX IF NOT EXISTS liabilities_user_status ON liabilities(user_id, status);

CREATE TABLE IF NOT EXISTS repayment_schedules (
    id                          TEXT        PRIMARY KEY,
    user_id                     UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    liability_id                TEXT        NOT NULL,
    due_date                    DATE        NOT NULL,
    amount                      NUMERIC     NOT NULL DEFAULT 0,
    principal_amount            NUMERIC     DEFAULT 0,
    interest_amount             NUMERIC     DEFAULT 0,
    fee_amount                  NUMERIC     DEFAULT 0,
    status                      TEXT        DEFAULT 'upcoming' CHECK (status IN ('upcoming', 'paid', 'missed')),
    paid_date                   DATE,
    repayment_account           TEXT        DEFAULT 'Bank',
    repayment_transaction_id    TEXT,
    processed_at                TIMESTAMPTZ,
    notes                       TEXT        DEFAULT '',
    created_at                  TIMESTAMPTZ DEFAULT now(),
    updated_at                  TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE repayment_schedules ENABLE ROW LEVEL SECURITY;
CREATE POLICY repayment_schedules_all ON repayment_schedules FOR ALL USING (auth.uid() = user_id);
CREATE INDEX IF NOT EXISTS repayment_schedules_user_due ON repayment_schedules(user_id, due_date);

CREATE TABLE IF NOT EXISTS liability_payments (
    id              TEXT        PRIMARY KEY,
    user_id         UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    liability_id    TEXT        NOT NULL,
    amount          NUMERIC     NOT NULL DEFAULT 0,
    payment_date    DATE        NOT NULL,
    account         TEXT        DEFAULT 'Bank',
    notes           TEXT        DEFAULT '',
    created_at      TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE liability_payments ENABLE ROW LEVEL SECURITY;
CREATE POLICY liability_payments_all ON liability_payments FOR ALL USING (auth.uid() = user_id);


-- =============================================================================
-- SECTION 7: LENDING
-- =============================================================================

CREATE TABLE IF NOT EXISTS people (
    id          TEXT        PRIMARY KEY,
    user_id     UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name        TEXT        NOT NULL,
    phone       TEXT        DEFAULT '',
    created_at  TIMESTAMPTZ DEFAULT now(),
    updated_at  TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE people ENABLE ROW LEVEL SECURITY;
CREATE POLICY people_all ON people FOR ALL USING (auth.uid() = user_id);

CREATE TABLE IF NOT EXISTS lending_transactions (
    id                      TEXT        PRIMARY KEY,
    user_id                 UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    person_id               TEXT,
    person_name             TEXT        DEFAULT '',
    type                    TEXT        NOT NULL CHECK (type IN ('lent', 'borrowed', 'settlement')),
    amount                  NUMERIC     NOT NULL DEFAULT 0,
    account                 TEXT        DEFAULT 'Bank',
    affects_balance         BOOLEAN     DEFAULT true,
    date                    DATE        NOT NULL,
    note                    TEXT        DEFAULT '',
    added_by                TEXT        DEFAULT 'me',
    created_at              TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE lending_transactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY lending_transactions_all ON lending_transactions FOR ALL USING (auth.uid() = user_id);
CREATE INDEX IF NOT EXISTS lending_transactions_user_date ON lending_transactions(user_id, date DESC);


-- =============================================================================
-- SECTION 8: REMITTANCES
-- =============================================================================

CREATE TABLE IF NOT EXISTS remittances (
    id              TEXT        PRIMARY KEY,
    user_id         UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    aud_amount      NUMERIC     NOT NULL DEFAULT 0,
    exchange_rate   NUMERIC     NOT NULL DEFAULT 0,
    inr_amount      NUMERIC     NOT NULL DEFAULT 0,
    account         TEXT        NOT NULL DEFAULT 'Bank',
    date            DATE        NOT NULL,
    provider        TEXT        DEFAULT '',
    charges_aud     NUMERIC     DEFAULT 0,
    tax_aud         NUMERIC     DEFAULT 0,
    pre_existing    BOOLEAN     DEFAULT false,
    from_fund       BOOLEAN     DEFAULT false,
    notes           TEXT        DEFAULT '',
    added_by        TEXT        DEFAULT 'me',
    created_at      TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE remittances ENABLE ROW LEVEL SECURITY;
CREATE POLICY remittances_all ON remittances FOR ALL USING (auth.uid() = user_id);


-- =============================================================================
-- SECTION 9: ASSET VAULT
-- =============================================================================

CREATE TABLE IF NOT EXISTS asset_vault (
    id              TEXT        PRIMARY KEY,
    user_id         UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name            TEXT        NOT NULL DEFAULT '',
    category        TEXT        NOT NULL DEFAULT '',
    value           NUMERIC     DEFAULT 0,
    quantity        NUMERIC     DEFAULT 1,
    unit            TEXT        DEFAULT '',
    location        TEXT        DEFAULT '',
    notes           TEXT        DEFAULT '',
    purchase_date   DATE,
    purchase_price  NUMERIC,
    is_active       BOOLEAN     DEFAULT true,
    created_at      TIMESTAMPTZ DEFAULT now(),
    updated_at      TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE asset_vault ENABLE ROW LEVEL SECURITY;
CREATE POLICY asset_vault_all ON asset_vault FOR ALL USING (auth.uid() = user_id);

CREATE TABLE IF NOT EXISTS asset_location_tags (
    id          TEXT        PRIMARY KEY,
    user_id     UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    label       TEXT        NOT NULL,
    color       TEXT        DEFAULT 'slate',
    created_at  TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE asset_location_tags ENABLE ROW LEVEL SECURITY;
CREATE POLICY asset_location_tags_all ON asset_location_tags FOR ALL USING (auth.uid() = user_id);


-- =============================================================================
-- SECTION 10: GOALS
-- =============================================================================

CREATE TABLE IF NOT EXISTS dreams_goals (
    id              TEXT        PRIMARY KEY,
    user_id         UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name            TEXT        NOT NULL DEFAULT '',
    category        TEXT        DEFAULT '',
    target_amount   NUMERIC     DEFAULT 0,
    saved_amount    NUMERIC     DEFAULT 0,
    target_date     DATE,
    priority        TEXT        DEFAULT 'medium',
    status          TEXT        DEFAULT 'active',
    notes           TEXT        DEFAULT '',
    icon            TEXT,
    color           TEXT,
    created_at      TIMESTAMPTZ DEFAULT now(),
    updated_at      TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE dreams_goals ENABLE ROW LEVEL SECURITY;
CREATE POLICY dreams_goals_all ON dreams_goals FOR ALL USING (auth.uid() = user_id);


-- =============================================================================
-- SECTION 11: NOTIFICATIONS & LOGS
-- =============================================================================

CREATE TABLE IF NOT EXISTS app_notifications (
    id                      TEXT        PRIMARY KEY,
    user_id                 UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    type                    TEXT        NOT NULL DEFAULT 'general',
    title                   TEXT        NOT NULL DEFAULT '',
    message                 TEXT        DEFAULT '',
    is_read                 BOOLEAN     DEFAULT false,
    related_entity_type     TEXT,
    related_entity_id       TEXT,
    dedupe_key              TEXT,
    scheduled_for           TIMESTAMPTZ,
    pushed_at               TIMESTAMPTZ,
    created_at              TIMESTAMPTZ DEFAULT now(),
    UNIQUE (user_id, dedupe_key)
);

ALTER TABLE app_notifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY app_notifications_all ON app_notifications FOR ALL USING (auth.uid() = user_id);

CREATE TABLE IF NOT EXISTS app_logs (
    id          TEXT        PRIMARY KEY,
    user_id     UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    user_label  TEXT        DEFAULT 'me',
    user_name   TEXT        DEFAULT '',
    action      TEXT        DEFAULT 'created',
    entity_type TEXT        DEFAULT '',
    entity_id   TEXT        DEFAULT '',
    description TEXT        DEFAULT '',
    created_at  TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE app_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY app_logs_all ON app_logs FOR ALL USING (auth.uid() = user_id);


-- =============================================================================
-- SECTION 12: INDEXES
-- =============================================================================

CREATE INDEX IF NOT EXISTS app_notifications_user ON app_notifications(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS app_logs_user ON app_logs(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS asset_vault_user ON asset_vault(user_id, category);
CREATE INDEX IF NOT EXISTS dreams_goals_user ON dreams_goals(user_id, status);


-- =============================================================================
-- DROP OLD SINGLE-TABLE SCHEMA
-- =============================================================================

DROP TABLE IF EXISTS app_rows CASCADE;
