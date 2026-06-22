-- =============================================================================
-- Mock Data — 6 months (Jan–Jun 2026)
-- Indian student in Melbourne, AUD currency
-- =============================================================================
-- HOW TO USE:
--   1. Sign up at /auth first
--   2. Go to Supabase → SQL Editor → New Query
--   3. Paste this entire file and click Run
-- The script auto-detects your user_id from auth.users
-- =============================================================================

DO $$
DECLARE
  uid uuid;
BEGIN
  SELECT id INTO uid FROM auth.users LIMIT 1;
  IF uid IS NULL THEN
    RAISE EXCEPTION 'No user found — sign up at /auth first, then re-run this SQL.';
  END IF;

  -- ─── USER SETTINGS ───────────────────────────────────────────────────────────
  INSERT INTO user_settings (user_id, settings, features)
  VALUES (uid,
    '{
      "initial_bank_balance": 2800,
      "initial_cash_balance": 150,
      "monthly_reset_day": 1,
      "currency": "AUD",
      "emergency_goal": 5000,
      "user_name_me": "Dhruv",
      "income_sources": "[\"Part-time Job\",\"Scholarship\"]"
    }',
    '{
      "remittance": true,
      "lending": true,
      "liabilities": true,
      "asset_vault": true,
      "goals": true,
      "shared_jar": false,
      "multi_user": false
    }'
  )
  ON CONFLICT (user_id) DO UPDATE SET
    settings   = EXCLUDED.settings,
    features   = EXCLUDED.features,
    updated_at = now();


  -- ─── BUCKET DEFINITIONS ──────────────────────────────────────────────────────
  INSERT INTO bucket_definitions (id, user_id, name, type, target_amount, is_active, sort_order, icon, color) VALUES
  ('savings_emergency_fund', uid, 'Emergency Fund', 'protected', 5000, true, 1, 'Shield', 'emerald'),
  ('savings_rent_buffer',    uid, 'Rent Buffer',    'protected', 1500, true, 2, 'Home',   'blue')
  ON CONFLICT (user_id, id) DO NOTHING;


  -- ─── TRACKER DEFINITIONS ─────────────────────────────────────────────────────
  INSERT INTO tracker_definitions (id, user_id, name, monthly_cap, is_active, sort_order, icon, color) VALUES
  ('tracker_food',          uid, 'Food & Groceries', 300, true, 1, 'ShoppingCart', 'orange'),
  ('tracker_transport',     uid, 'Transport',        150, true, 2, 'Car',          'blue'),
  ('tracker_entertainment', uid, 'Entertainment',    100, true, 3, 'Music',        'purple'),
  ('tracker_personal',      uid, 'Personal Care',     80, true, 4, 'Heart',        'pink')
  ON CONFLICT (user_id, id) DO NOTHING;


  -- ─── CATEGORY DEFINITIONS ────────────────────────────────────────────────────
  INSERT INTO category_definitions (id, user_id, name, kind, is_active, sort_order) VALUES
  ('category_rent',          uid, 'Rent',             'expense', true,  1),
  ('category_groceries',     uid, 'Groceries',        'expense', true,  2),
  ('category_transport',     uid, 'Transport',        'expense', true,  3),
  ('category_dining',        uid, 'Dining Out',       'expense', true,  4),
  ('category_entertainment', uid, 'Entertainment',    'expense', true,  5),
  ('category_phone',         uid, 'Phone & Internet', 'expense', true,  6),
  ('category_clothing',      uid, 'Clothing',         'expense', true,  7),
  ('category_medical',       uid, 'Medical',          'expense', true,  8),
  ('category_personal',      uid, 'Personal Care',    'expense', true,  9),
  ('category_subscriptions', uid, 'Subscriptions',    'expense', true, 10)
  ON CONFLICT (user_id, id) DO NOTHING;


  -- ─── CATEGORY → TRACKER LINKS ────────────────────────────────────────────────
  INSERT INTO category_tracker_links (id, user_id, category_id, tracker_id, is_active) VALUES
  ('ctl_groceries',     uid, 'category_groceries',     'tracker_food',          true),
  ('ctl_dining',        uid, 'category_dining',        'tracker_food',          true),
  ('ctl_transport',     uid, 'category_transport',     'tracker_transport',     true),
  ('ctl_entertainment', uid, 'category_entertainment', 'tracker_entertainment', true),
  ('ctl_personal',      uid, 'category_personal',      'tracker_personal',      true)
  ON CONFLICT DO NOTHING;


  -- ─── INCOME ──────────────────────────────────────────────────────────────────
  INSERT INTO income (id, user_id, income_type, source, amount, cash_received, date, notes, added_by) VALUES
  -- January
  ('inc_2601_01', uid, 'Fixed Amount', 'Part-time Job', 1350.00, 0, '2026-01-15', 'Fortnightly pay',        'me'),
  ('inc_2601_02', uid, 'Fixed Amount', 'Scholarship',    500.00, 0, '2026-01-31', 'Monthly stipend',        'me'),
  -- February
  ('inc_2602_01', uid, 'Fixed Amount', 'Part-time Job', 1200.00, 0, '2026-02-14', 'Fortnightly pay',        'me'),
  ('inc_2602_02', uid, 'Fixed Amount', 'Scholarship',    500.00, 0, '2026-02-28', 'Monthly stipend',        'me'),
  -- March
  ('inc_2603_01', uid, 'Fixed Amount', 'Part-time Job', 1580.00, 0, '2026-03-15', 'Extra shifts this month','me'),
  ('inc_2603_02', uid, 'Fixed Amount', 'Scholarship',    500.00, 0, '2026-03-31', 'Monthly stipend',        'me'),
  -- April
  ('inc_2604_01', uid, 'Fixed Amount', 'Part-time Job', 1300.00, 0, '2026-04-15', 'Fortnightly pay',        'me'),
  ('inc_2604_02', uid, 'Fixed Amount', 'Scholarship',    500.00, 0, '2026-04-30', 'Monthly stipend',        'me'),
  -- May
  ('inc_2605_01', uid, 'Fixed Amount', 'Part-time Job', 1500.00, 0, '2026-05-15', 'Good month',             'me'),
  ('inc_2605_02', uid, 'Fixed Amount', 'Scholarship',    500.00, 0, '2026-05-31', 'Monthly stipend',        'me'),
  -- June
  ('inc_2606_01', uid, 'Fixed Amount', 'Part-time Job', 1100.00, 0, '2026-06-14', 'Fewer shifts',           'me'),
  ('inc_2606_02', uid, 'Fixed Amount', 'Scholarship',    500.00, 0, '2026-06-22', 'Monthly stipend',        'me');


  -- ─── EXPENSES ────────────────────────────────────────────────────────────────
  INSERT INTO expenses (id, user_id, amount, category, category_id, account, payment_method, date, notes, added_by) VALUES
  -- January
  ('exp_2601_01', uid, 720.00, 'Rent',             'category_rent',          'Bank', 'Bank',     '2026-01-05', 'Jan rent - Glenferrie Rd',    'me'),
  ('exp_2601_02', uid, 240.00, 'Groceries',        'category_groceries',     'Bank', 'Bank',     '2026-01-08', 'Coles + Aldi run',             'me'),
  ('exp_2601_03', uid,  95.00, 'Transport',        'category_transport',     'Bank', 'Bank',     '2026-01-10', 'Myki top-up',                  'me'),
  ('exp_2601_04', uid,  30.00, 'Phone & Internet', 'category_phone',         'Bank', 'Bank',     '2026-01-12', 'Optus prepaid',                'me'),
  ('exp_2601_05', uid, 125.00, 'Dining Out',       'category_dining',        'Bank', 'Bank',     '2026-01-18', 'Dinners + lunches with mates', 'me'),
  ('exp_2601_06', uid,  55.00, 'Entertainment',    'category_entertainment', 'Bank', 'Bank',     '2026-01-25', 'Movies + bowling',             'me'),
  -- February
  ('exp_2602_01', uid, 720.00, 'Rent',             'category_rent',          'Bank', 'Bank',     '2026-02-05', 'Feb rent',                     'me'),
  ('exp_2602_02', uid, 195.00, 'Groceries',        'category_groceries',     'Bank', 'Bank',     '2026-02-10', 'Weekly shops',                 'me'),
  ('exp_2602_03', uid, 110.00, 'Transport',        'category_transport',     'Bank', 'Bank',     '2026-02-12', 'Myki + Uber',                  'me'),
  ('exp_2602_04', uid,  30.00, 'Phone & Internet', 'category_phone',         'Bank', 'Bank',     '2026-02-12', 'Optus prepaid',                'me'),
  ('exp_2602_05', uid,  85.00, 'Dining Out',       'category_dining',        'Bank', 'Bank',     '2026-02-14', 'Valentine day dinner',         'me'),
  ('exp_2602_06', uid,  49.00, 'Entertainment',    'category_entertainment', 'Bank', 'Bank',     '2026-02-20', 'Netflix + Spotify',            'me'),
  ('exp_2602_07', uid, 200.00, 'Clothing',         'category_clothing',      'Bank', 'Afterpay', '2026-02-22', 'Uniqlo - work shirts + jeans', 'me'),
  -- March
  ('exp_2603_01', uid, 720.00, 'Rent',             'category_rent',          'Bank', 'Bank',     '2026-03-05', 'Mar rent',                     'me'),
  ('exp_2603_02', uid, 275.00, 'Groceries',        'category_groceries',     'Bank', 'Bank',     '2026-03-09', 'Coles + Indian grocery store', 'me'),
  ('exp_2603_03', uid, 100.00, 'Transport',        'category_transport',     'Bank', 'Bank',     '2026-03-11', 'Myki monthly',                 'me'),
  ('exp_2603_04', uid,  30.00, 'Phone & Internet', 'category_phone',         'Bank', 'Bank',     '2026-03-12', 'Optus prepaid',                'me'),
  ('exp_2603_05', uid, 145.00, 'Dining Out',       'category_dining',        'Bank', 'Bank',     '2026-03-20', 'Holi dinner + weekend outings','me'),
  ('exp_2603_06', uid,  90.00, 'Entertainment',    'category_entertainment', 'Bank', 'Bank',     '2026-03-28', 'Cricket match tickets',        'me'),
  ('exp_2603_07', uid,  65.00, 'Medical',          'category_medical',       'Bank', 'Bank',     '2026-03-15', 'GP visit + pharmacy',          'me'),
  -- April
  ('exp_2604_01', uid, 720.00, 'Rent',             'category_rent',          'Bank', 'Bank',     '2026-04-05', 'Apr rent',                     'me'),
  ('exp_2604_02', uid, 210.00, 'Groceries',        'category_groceries',     'Bank', 'Bank',     '2026-04-08', 'Weekly shops',                 'me'),
  ('exp_2604_03', uid, 120.00, 'Transport',        'category_transport',     'Bank', 'Bank',     '2026-04-10', 'Myki + interstate train',      'me'),
  ('exp_2604_04', uid,  30.00, 'Phone & Internet', 'category_phone',         'Bank', 'Bank',     '2026-04-12', 'Optus prepaid',                'me'),
  ('exp_2604_05', uid, 100.00, 'Dining Out',       'category_dining',        'Bank', 'Bank',     '2026-04-18', 'Easter long weekend meals',    'me'),
  ('exp_2604_06', uid,  45.00, 'Entertainment',    'category_entertainment', 'Bank', 'Bank',     '2026-04-24', 'Streaming + game purchase',    'me'),
  ('exp_2604_07', uid, 180.00, 'Clothing',         'category_clothing',      'Bank', 'Bank',     '2026-04-20', 'Winter jacket from Uniqlo',    'me'),
  -- May
  ('exp_2605_01', uid, 720.00, 'Rent',             'category_rent',          'Bank', 'Bank',     '2026-05-05', 'May rent',                     'me'),
  ('exp_2605_02', uid, 230.00, 'Groceries',        'category_groceries',     'Bank', 'Bank',     '2026-05-09', 'Coles + Woolies',              'me'),
  ('exp_2605_03', uid,  90.00, 'Transport',        'category_transport',     'Bank', 'Bank',     '2026-05-11', 'Myki top-up',                  'me'),
  ('exp_2605_04', uid,  30.00, 'Phone & Internet', 'category_phone',         'Bank', 'Bank',     '2026-05-12', 'Optus prepaid',                'me'),
  ('exp_2605_05', uid, 135.00, 'Dining Out',       'category_dining',        'Bank', 'Bank',     '2026-05-16', 'Birthday dinner + coffee',     'me'),
  ('exp_2605_06', uid,  60.00, 'Entertainment',    'category_entertainment', 'Bank', 'Bank',     '2026-05-22', 'Concert tickets',              'me'),
  ('exp_2605_07', uid,  45.00, 'Personal Care',    'category_personal',      'Bank', 'Bank',     '2026-05-28', 'Haircut + toiletries',         'me'),
  -- June
  ('exp_2606_01', uid, 720.00, 'Rent',             'category_rent',          'Bank', 'Bank',     '2026-06-05', 'Jun rent',                     'me'),
  ('exp_2606_02', uid, 250.00, 'Groceries',        'category_groceries',     'Bank', 'Bank',     '2026-06-08', 'Grocery run',                  'me'),
  ('exp_2606_03', uid, 105.00, 'Transport',        'category_transport',     'Bank', 'Bank',     '2026-06-10', 'Myki top-up',                  'me'),
  ('exp_2606_04', uid,  30.00, 'Phone & Internet', 'category_phone',         'Bank', 'Bank',     '2026-06-12', 'Optus prepaid',                'me'),
  ('exp_2606_05', uid,  95.00, 'Dining Out',       'category_dining',        'Bank', 'Bank',     '2026-06-18', 'Team lunch + dinner',          'me'),
  ('exp_2606_06', uid,  40.00, 'Entertainment',    'category_entertainment', 'Bank', 'Bank',     '2026-06-20', 'Streaming subscriptions',      'me');


  -- ─── TRANSFERS (to savings buckets) ──────────────────────────────────────────
  INSERT INTO transfers (id, user_id, from_bucket, to_bucket, amount, date, notes, added_by) VALUES
  ('tr_2601_01', uid, 'Bank', 'savings_emergency_fund', 200.00, '2026-01-31', 'Monthly emergency fund contribution', 'me'),
  ('tr_2601_02', uid, 'Bank', 'savings_rent_buffer',    150.00, '2026-01-31', 'Rent buffer top-up',                 'me'),
  ('tr_2602_01', uid, 'Bank', 'savings_emergency_fund', 150.00, '2026-02-28', 'Monthly contribution',               'me'),
  ('tr_2603_01', uid, 'Bank', 'savings_emergency_fund', 250.00, '2026-03-31', 'Extra savings - good month',         'me'),
  ('tr_2603_02', uid, 'Bank', 'savings_rent_buffer',    150.00, '2026-03-31', 'Rent buffer',                        'me'),
  ('tr_2604_01', uid, 'Bank', 'savings_emergency_fund', 150.00, '2026-04-30', 'Monthly contribution',               'me'),
  ('tr_2605_01', uid, 'Bank', 'savings_emergency_fund', 200.00, '2026-05-31', 'Monthly contribution',               'me'),
  ('tr_2605_02', uid, 'Bank', 'savings_rent_buffer',    150.00, '2026-05-31', 'Rent buffer',                        'me'),
  ('tr_2606_01', uid, 'Bank', 'savings_emergency_fund', 100.00, '2026-06-20', 'Monthly contribution',               'me');


  -- ─── REMITTANCES ─────────────────────────────────────────────────────────────
  INSERT INTO remittances (id, user_id, aud_amount, exchange_rate, inr_amount, account, date, provider, charges_aud, notes, added_by) VALUES
  ('rem_2602_01', uid, 500.00, 54.20, 27100.00, 'Bank', '2026-02-20', 'Wise',  3.50, 'Mum - household expenses',    'me'),
  ('rem_2604_01', uid, 600.00, 53.80, 32280.00, 'Bank', '2026-04-15', 'Wise',  3.50, 'Parents - festival expenses', 'me'),
  ('rem_2606_01', uid, 400.00, 55.10, 22040.00, 'Bank', '2026-06-10', 'Niyo',  2.00, 'Mum - regular support',       'me');


  -- ─── PEOPLE ──────────────────────────────────────────────────────────────────
  INSERT INTO people (id, user_id, name, phone) VALUES
  ('person_rahul', uid, 'Rahul Sharma', '+61412345678'),
  ('person_priya', uid, 'Priya Patel',  '+61498765432')
  ON CONFLICT (id) DO NOTHING;


  -- ─── LENDING TRANSACTIONS ────────────────────────────────────────────────────
  INSERT INTO lending_transactions (id, user_id, person_id, person_name, type, amount, account, affects_balance, date, note, added_by) VALUES
  ('lt_2603_01', uid, 'person_rahul', 'Rahul Sharma', 'lent',       150.00, 'Bank', true,  '2026-03-10', 'Helped with rent',         'me'),
  ('lt_2605_01', uid, 'person_rahul', 'Rahul Sharma', 'settlement', 100.00, 'Bank', true,  '2026-05-20', 'Partial repayment from Rahul', 'me'),
  ('lt_2604_01', uid, 'person_priya', 'Priya Patel',  'lent',        80.00, 'Cash', false, '2026-04-05', 'Cash for groceries',       'me');


  -- ─── LIABILITIES ─────────────────────────────────────────────────────────────

  -- BNPL 1: Afterpay — Laptop Stand $200 (4 × $50 fortnightly, started Apr)
  INSERT INTO liabilities (id, user_id, type, name, provider, original_amount, outstanding_balance, status,
    purchase_amount, first_payment_date, number_of_payments, payment_frequency, installment_amount, purchase_date, notes)
  VALUES
  ('liab_afterpay_01', uid, 'bnpl', 'Afterpay - Laptop Stand', 'Afterpay',
    200.00, 100.00, 'active',
    200.00, '2026-04-01', 4, 'biweekly', 50.00, '2026-03-25',
    'Laptop stand from JB Hi-Fi');

  -- BNPL 2: Zip Pay — Headphones $360 (6 × $60 monthly, started Feb, all paid)
  INSERT INTO liabilities (id, user_id, type, name, provider, original_amount, outstanding_balance, status,
    purchase_amount, first_payment_date, number_of_payments, payment_frequency, installment_amount, purchase_date, notes)
  VALUES
  ('liab_zip_01', uid, 'bnpl', 'Zip Pay - Sony WH-1000XM5', 'Zip Pay',
    360.00, 0.00, 'paid',
    360.00, '2026-02-01', 6, 'monthly', 60.00, '2026-01-28',
    'Sony headphones from JB Hi-Fi — fully paid off');

  -- BNPL 3: StepPay — Running Shoes $280 (4 × $70 fortnightly, started Jun)
  INSERT INTO liabilities (id, user_id, type, name, provider, original_amount, outstanding_balance, status,
    purchase_amount, first_payment_date, number_of_payments, payment_frequency, installment_amount, purchase_date, notes)
  VALUES
  ('liab_steppay_01', uid, 'bnpl', 'StepPay - Nike Running Shoes', 'StepPay',
    280.00, 210.00, 'active',
    280.00, '2026-06-15', 4, 'biweekly', 70.00, '2026-06-10',
    'Nike Pegasus 41 from Rebel Sport');

  -- Credit Card: CommBank Mastercard
  INSERT INTO liabilities (id, user_id, type, name, provider, original_amount, outstanding_balance, status,
    credit_limit, current_balance, statement_date, due_date, minimum_payment, interest_rate, annual_fee, notes)
  VALUES
  ('liab_cc_commbank', uid, 'credit_card', 'CommBank Low Rate Mastercard', 'CommBank',
    0.00, 420.00, 'active',
    2000.00, 420.00, 25, 15, 25.00, 12.99, 59.00,
    'Used for online shopping and emergencies');

  -- Loan: Personal loan for laptop (paid monthly, 12-month term starting Jan)
  INSERT INTO liabilities (id, user_id, type, name, provider, original_amount, outstanding_balance, status,
    principal_amount, interest_type, repayment_amount, repayment_frequency, start_date, end_date, term_months,
    interest_rate, notes)
  VALUES
  ('liab_loan_laptop', uid, 'loan', 'Latitude Personal Loan', 'Latitude Finance',
    1200.00, 720.00, 'active',
    1200.00, 'fixed', 120.00, 'monthly', '2026-01-10', '2026-12-10', 12,
    9.99, 'Used to buy MacBook Air — $120/month for 12 months');


  -- ─── REPAYMENT SCHEDULES ─────────────────────────────────────────────────────

  -- Afterpay - Laptop Stand (4 × $50)
  INSERT INTO repayment_schedules (id, user_id, liability_id, due_date, amount, status, paid_date, repayment_account) VALUES
  ('rs_ap01_1', uid, 'liab_afterpay_01', '2026-04-01', 50.00, 'paid',     '2026-04-01', 'Bank'),
  ('rs_ap01_2', uid, 'liab_afterpay_01', '2026-04-15', 50.00, 'paid',     '2026-04-15', 'Bank'),
  ('rs_ap01_3', uid, 'liab_afterpay_01', '2026-04-29', 50.00, 'upcoming', NULL,         'Bank'),
  ('rs_ap01_4', uid, 'liab_afterpay_01', '2026-05-13', 50.00, 'upcoming', NULL,         'Bank');

  -- Zip Pay - Headphones (6 × $60, all paid)
  INSERT INTO repayment_schedules (id, user_id, liability_id, due_date, amount, status, paid_date, repayment_account) VALUES
  ('rs_zip_1', uid, 'liab_zip_01', '2026-02-01', 60.00, 'paid', '2026-02-01', 'Bank'),
  ('rs_zip_2', uid, 'liab_zip_01', '2026-03-01', 60.00, 'paid', '2026-03-01', 'Bank'),
  ('rs_zip_3', uid, 'liab_zip_01', '2026-04-01', 60.00, 'paid', '2026-04-01', 'Bank'),
  ('rs_zip_4', uid, 'liab_zip_01', '2026-05-01', 60.00, 'paid', '2026-05-01', 'Bank'),
  ('rs_zip_5', uid, 'liab_zip_01', '2026-06-01', 60.00, 'paid', '2026-06-01', 'Bank'),
  ('rs_zip_6', uid, 'liab_zip_01', '2026-07-01', 60.00, 'paid', '2026-07-01', 'Bank');

  -- StepPay - Running Shoes (4 × $70, first one paid)
  INSERT INTO repayment_schedules (id, user_id, liability_id, due_date, amount, status, paid_date, repayment_account) VALUES
  ('rs_sp_1', uid, 'liab_steppay_01', '2026-06-15', 70.00, 'paid',     '2026-06-15', 'Bank'),
  ('rs_sp_2', uid, 'liab_steppay_01', '2026-06-29', 70.00, 'upcoming', NULL,         'Bank'),
  ('rs_sp_3', uid, 'liab_steppay_01', '2026-07-13', 70.00, 'upcoming', NULL,         'Bank'),
  ('rs_sp_4', uid, 'liab_steppay_01', '2026-07-27', 70.00, 'upcoming', NULL,         'Bank');

  -- Latitude Loan - monthly repayments Jan–Jun (6 paid, 6 remaining)
  INSERT INTO repayment_schedules (id, user_id, liability_id, due_date, amount, principal_amount, interest_amount, status, paid_date, repayment_account) VALUES
  ('rs_loan_1',  uid, 'liab_loan_laptop', '2026-01-10', 120.00, 110.00, 10.00, 'paid', '2026-01-10', 'Bank'),
  ('rs_loan_2',  uid, 'liab_loan_laptop', '2026-02-10', 120.00, 110.92,  9.08, 'paid', '2026-02-10', 'Bank'),
  ('rs_loan_3',  uid, 'liab_loan_laptop', '2026-03-10', 120.00, 111.84,  8.16, 'paid', '2026-03-10', 'Bank'),
  ('rs_loan_4',  uid, 'liab_loan_laptop', '2026-04-10', 120.00, 112.77,  7.23, 'paid', '2026-04-10', 'Bank'),
  ('rs_loan_5',  uid, 'liab_loan_laptop', '2026-05-10', 120.00, 113.71,  6.29, 'paid', '2026-05-10', 'Bank'),
  ('rs_loan_6',  uid, 'liab_loan_laptop', '2026-06-10', 120.00, 114.66,  5.34, 'paid', '2026-06-10', 'Bank'),
  ('rs_loan_7',  uid, 'liab_loan_laptop', '2026-07-10', 120.00, 115.62,  4.38, 'upcoming', NULL,     'Bank'),
  ('rs_loan_8',  uid, 'liab_loan_laptop', '2026-08-10', 120.00, 116.59,  3.41, 'upcoming', NULL,     'Bank'),
  ('rs_loan_9',  uid, 'liab_loan_laptop', '2026-09-10', 120.00, 117.56,  2.44, 'upcoming', NULL,     'Bank'),
  ('rs_loan_10', uid, 'liab_loan_laptop', '2026-10-10', 120.00, 118.55,  1.45, 'upcoming', NULL,     'Bank'),
  ('rs_loan_11', uid, 'liab_loan_laptop', '2026-11-10', 120.00, 119.54,  0.46, 'upcoming', NULL,     'Bank'),
  ('rs_loan_12', uid, 'liab_loan_laptop', '2026-12-10', 120.00, 120.00,  0.00, 'upcoming', NULL,     'Bank');

  -- ─── LIABILITY PAYMENTS (credit card manual payments) ────────────────────────
  INSERT INTO liability_payments (id, user_id, liability_id, amount, payment_date, account, notes) VALUES
  ('lp_cc_1', uid, 'liab_cc_commbank', 200.00, '2026-03-15', 'Bank', 'Partial payment - online shopping charges'),
  ('lp_cc_2', uid, 'liab_cc_commbank', 180.00, '2026-04-15', 'Bank', 'Cleared most of balance'),
  ('lp_cc_3', uid, 'liab_cc_commbank', 150.00, '2026-05-15', 'Bank', 'Regular payment'),
  ('lp_cc_4', uid, 'liab_cc_commbank',  50.00, '2026-06-15', 'Bank', 'Minimum payment - tight month');


  -- ─── ASSET VAULT ─────────────────────────────────────────────────────────────
  INSERT INTO asset_vault (id, user_id, name, category, value, quantity, unit, location, notes, purchase_date, purchase_price) VALUES
  ('asset_macbook',  uid, 'MacBook Air M2',  'Electronics', 1200.00, 1, 'unit', 'Home',        'Personal laptop',       '2023-08-15', 1499.00),
  ('asset_iphone',   uid, 'iPhone 14',       'Electronics',  650.00, 1, 'unit', 'On Person',   'Personal phone',        '2023-01-10',  999.00),
  ('asset_bicycle',  uid, 'Trek FX3 Bike',   'Transport',    450.00, 1, 'unit', 'Home',        'Daily commute bike',    '2024-03-20',  549.00),
  ('asset_gold',     uid, 'Gold Ring',       'Jewellery',    350.00, 1, 'unit', 'India - Safe','Family heirloom',       '2020-01-01',  280.00),
  ('asset_ssd',      uid, 'Samsung SSD 1TB', 'Electronics',   80.00, 1, 'unit', 'Home',        'External backup drive', '2024-06-01',   95.00);


  -- ─── ASSET LOCATION TAGS ─────────────────────────────────────────────────────
  INSERT INTO asset_location_tags (id, user_id, label, color) VALUES
  ('tag_home',       uid, 'Home',          'blue'),
  ('tag_on_person',  uid, 'On Person',     'emerald'),
  ('tag_india_safe', uid, 'India - Safe',  'orange')
  ON CONFLICT (id) DO NOTHING;


  -- ─── DREAMS & GOALS ──────────────────────────────────────────────────────────
  INSERT INTO dreams_goals (id, user_id, name, category, target_amount, saved_amount, target_date, priority, status, notes, icon, color) VALUES
  ('goal_japan',     uid, 'Trip to Japan',   'experiences', 3000.00,  800.00, '2026-12-31', 'high',   'active', 'Cherry blossom season 2027', 'Plane',  'pink'),
  ('goal_macpro',    uid, 'New MacBook Pro', 'purchases',   2800.00,  500.00, '2026-09-30', 'medium', 'active', 'For PhD research',           'Laptop', 'blue'),
  ('goal_emergency', uid, 'Emergency Fund',  'other',       5000.00, 1200.00, '2026-12-31', 'high',   'active', '6 months expenses buffer',   'Shield', 'emerald'),
  ('goal_india',     uid, 'India Trip',      'family',      2000.00,  300.00, '2027-06-30', 'medium', 'active', 'Family visit',               'Home',   'orange');


  RAISE NOTICE 'Mock data inserted successfully for user %', uid;
END $$;
