# Personal Finance Intelligence System (PFIS)
DBMS Level 3 Project | Tanvi B. Shetty (PES1UG24AM302), Maansi S (PES1UG24AM913) | Section F

## Setup
1. Put Maansi's files in `database/maansi/` (do NOT run her `00_stub_for_testing_only.sql`).
2. `cd database`, run `mysql -u root -p`, then `SOURCE run_all.sql;` (Tanvi's files first, then Maansi's).
3. `pip install -r requirements.txt`
4. `cd app`, set `DB_USER` and `DB_PASSWORD`, run `python app.py`, open http://127.0.0.1:5000
5. Sample login: `tanvi@example.com` / `password123`

## Structure
| Path | Contents |
|---|---|
| `database/tanvi/` | schema, sample data, triggers, functions, procedures, views (Tanvi) |
| `database/maansi/` | Budget, Subscription, Investment, Goal logic (Maansi) |
| `database/run_all.sql` | master run order |
| `app/` | Flask backend (`routes_*.py` per member) + templates |

## Tanvi's module
- **Tables:** User, Account, Transaction, Category, Merchant, Receipt
- **Triggers:** `trg_txn_before_insert` (blocks overdraft), `trg_txn_after_insert` (updates balance), `trg_txn_after_delete` (reverses balance)
- **Procedures:** `sp_add_transaction`, `sp_transfer` (atomic, rolls back on failure)
- **Functions:** `fn_monthly_spend`, `fn_savings_rate`
- **Views:** `v_transaction_details`, `v_spending_by_category`, `v_spending_by_merchant`, `v_monthly_summary`
- **Pages:** Login/Register, Accounts, Transactions, Transfer, Analytics

## Maansi's module
Tables: Budget, Budget_Alert, Subscription, Investment, Goal. Logic in `database/maansi/`.
