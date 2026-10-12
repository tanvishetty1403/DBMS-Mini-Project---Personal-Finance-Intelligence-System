CREATE OR REPLACE VIEW vw_budget_vs_actual AS
SELECT b.budget_id, b.user_id, b.month_year, c.name AS category,
       b.limit_amount,
       COALESCE((SELECT SUM(t.amount)
                 FROM `Transaction` t JOIN Account a ON a.account_id = t.account_id
                 WHERE a.user_id = b.user_id AND t.category_id = b.category_id
                   AND t.txn_type = 'EXPENSE'
                   AND t.txn_date >= b.month_year
                   AND t.txn_date <  DATE_ADD(b.month_year, INTERVAL 1 MONTH)), 0) AS spent,
       fn_budget_utilisation(b.budget_id) AS utilisation_pct
FROM Budget b JOIN Category c ON c.category_id = b.category_id;

CREATE OR REPLACE VIEW vw_subscription_cost AS
SELECT s.subscription_id, s.user_id, s.name, s.billing_cycle, s.amount,
       ROUND(CASE s.billing_cycle
               WHEN 'WEEKLY'  THEN s.amount * 52 / 12
               WHEN 'MONTHLY' THEN s.amount
               WHEN 'YEARLY'  THEN s.amount / 12 END, 2) AS monthly_cost,
       ROUND(CASE s.billing_cycle
               WHEN 'WEEKLY'  THEN s.amount * 52
               WHEN 'MONTHLY' THEN s.amount * 12
               WHEN 'YEARLY'  THEN s.amount END, 2) AS yearly_cost,
       s.next_payment_date
FROM Subscription s
WHERE s.status = 'ACTIVE';

CREATE OR REPLACE VIEW vw_net_worth AS
SELECT x.user_id, x.cash_balance, x.investment_value,
       x.cash_balance + x.investment_value AS net_worth
FROM (
  SELECT u.user_id,
         COALESCE((SELECT SUM(a.balance) FROM Account a WHERE a.user_id = u.user_id), 0) AS cash_balance,
         COALESCE((SELECT SUM(i.quantity * i.current_price) FROM Investment i WHERE i.user_id = u.user_id), 0) AS investment_value
  FROM `User` u
) x;
