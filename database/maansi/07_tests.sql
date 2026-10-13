-- views
SELECT * FROM vw_budget_vs_actual WHERE user_id = 1;
SELECT user_id, SUM(monthly_cost) AS total_monthly, SUM(yearly_cost) AS total_yearly
FROM vw_subscription_cost GROUP BY user_id;
SELECT * FROM vw_net_worth WHERE user_id = 1;

-- functions
SELECT goal_name, fn_goal_progress(goal_id) AS pct FROM Goal;
SELECT asset_name, fn_investment_pnl(investment_id) AS pnl FROM Investment;

-- procedures
CALL sp_monthly_budget_report(1, CURDATE());
CALL sp_portfolio_summary(1);
CALL sp_process_due_subscriptions(NULL);      -- Netflix is overdue, so it is charged once
SELECT subscription_id, name, last_paid_date, next_payment_date FROM Subscription;

-- trigger: goal completion
UPDATE Goal SET current_amount = 50000 WHERE goal_name = 'Emergency Fund';
SELECT goal_name, status, completed_on FROM Goal;   -- Emergency Fund should be COMPLETED

-- trigger: budget alert (expense bigger than the Food limit of 5000)
INSERT INTO `Transaction` (account_id, category_id, amount, txn_type, txn_date, description)
VALUES (1, 1, 6000, 'EXPENSE', CURDATE(), 'Test overspend');
SELECT * FROM Budget_Alert;
