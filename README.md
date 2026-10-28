# Personal Finance Intelligence System (PFIS)
DBMS Level 3 Project | Tanvi B. Shetty (PES1UG24AM302), Maansi S (PES1UG24AM913) | Section F

**Stack:** Next.js (pages + API routes) | MySQL (relational, transactional data) | MongoDB (receipts, audit log)

## Setup
1. **MySQL:** put Maansi's files in `database/maansi/` (never run her `00_stub_for_testing_only.sql`), then
   `cd database`, run `mysql -u root -p`, then `SOURCE run_all.sql;`
2. **MongoDB:** use a local MongoDB or a free MongoDB Atlas cluster.
3. **App:**
   ```
   cd web
   copy .env.local.example .env.local      (then fill in your passwords / Mongo URI)
   npm install
   npm run seed:mongo                       (optional: sample receipts + indexes)
   npm run dev
   ```
   Open http://localhost:3000 and log in with `tanvi@example.com` / `password123`.
   Needs Node 20.6+.

## Structure
| Path | Contents |
|---|---|
| `database/tanvi/` | schema, sample data, triggers, functions, procedures, views (Tanvi) |
| `database/maansi/` | Budget, Subscription, Investment, Goal logic (Maansi) |
| `database/run_all.sql` | master run order |
| `web/app/api/` | API routes (`/api/accounts`, `/api/transactions`, `/api/transfer`, `/api/analytics`, `/api/receipts`, `/api/activity`, `/api/auth/*`) |
| `web/app/(app)/` | logged-in pages |
| `web/lib/` | `mysql.js`, `mongo.js` (+ audit helper), `auth.js` (sessions, password hashing) |

## Where each database is used
- **MySQL:** users, accounts, transactions, categories, merchants, budgets, subscriptions, investments, goals. Balance updates, overdraft blocking and transfers run inside triggers and stored procedures.
- **MongoDB:** `receipts` (flexible documents: items, tax, tags) and `audit_log` (every login, add, delete, transfer). If MongoDB is down, the money features still work; only receipts and the activity log are unavailable.

## Tanvi's module
- **Tables:** User, Account, Transaction, Category, Merchant
- **Triggers:** `trg_txn_before_insert` (blocks overdraft), `trg_txn_after_insert` (updates balance), `trg_txn_after_delete` (reverses balance)
- **Procedures:** `sp_add_transaction`, `sp_transfer` (atomic, rolls back on failure)
- **Functions:** `fn_monthly_spend`, `fn_savings_rate`
- **Views:** `v_transaction_details`, `v_spending_by_category`, `v_spending_by_merchant`, `v_monthly_summary`
- **MongoDB:** receipts, audit log
- **Pages:** Login/Register, Accounts, Transactions (+ receipts), Transfer, Analytics, Activity

## Maansi's module
Tables: Budget, Budget_Alert, Subscription, Investment, Goal. Logic in `database/maansi/`. Pages go in `web/app/(app)/`, API routes in `web/app/api/`; add nav links in `web/components/Nav.js`.
