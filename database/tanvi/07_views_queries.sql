USE personal_finance;

CREATE OR REPLACE VIEW v_transaction_details AS
SELECT t.transaction_id, a.user_id, a.account_id, a.account_name, c.name AS category,
       m.name AS merchant, t.amount, t.txn_type, t.txn_date, t.description
FROM Transaction t
JOIN Account a  ON a.account_id = t.account_id
JOIN Category c ON c.category_id = t.category_id
LEFT JOIN Merchant m ON m.merchant_id = t.merchant_id;

CREATE OR REPLACE VIEW v_spending_by_category AS
SELECT user_id, category, YEAR(txn_date) AS yr, MONTH(txn_date) AS mo,
       SUM(amount) AS total_spent, COUNT(*) AS txn_count
FROM v_transaction_details
WHERE txn_type = 'expense'
GROUP BY user_id, category, YEAR(txn_date), MONTH(txn_date);

CREATE OR REPLACE VIEW v_spending_by_merchant AS
SELECT user_id, merchant, SUM(amount) AS total_spent, COUNT(*) AS txn_count
FROM v_transaction_details
WHERE txn_type = 'expense' AND merchant IS NOT NULL
GROUP BY user_id, merchant;

CREATE OR REPLACE VIEW v_monthly_summary AS
SELECT user_id, YEAR(txn_date) AS yr, MONTH(txn_date) AS mo,
       SUM(CASE WHEN txn_type='income'  THEN amount ELSE 0 END) AS income,
       SUM(CASE WHEN txn_type='expense' THEN amount ELSE 0 END) AS expense,
       SUM(CASE WHEN txn_type='income'  THEN amount
                WHEN txn_type='expense' THEN -amount ELSE 0 END) AS net
FROM v_transaction_details
GROUP BY user_id, YEAR(txn_date), MONTH(txn_date);

-- Demo queries (uncomment to run) ----------------------------------
-- Top merchants by spend:
-- SELECT merchant, total_spent FROM v_spending_by_merchant WHERE user_id=1 ORDER BY total_spent DESC;

-- Categories above the user's own average category spend (nested subquery):
-- SELECT category, total_spent FROM v_spending_by_category
-- WHERE user_id=1 AND yr=2026 AND mo=9
--   AND total_spent > (SELECT AVG(total_spent) FROM v_spending_by_category WHERE user_id=1 AND yr=2026 AND mo=9);

-- Accounts with no transactions this year (NOT EXISTS):
-- SELECT account_name FROM Account a WHERE NOT EXISTS
--   (SELECT 1 FROM Transaction t WHERE t.account_id=a.account_id AND YEAR(t.txn_date)=2026);
