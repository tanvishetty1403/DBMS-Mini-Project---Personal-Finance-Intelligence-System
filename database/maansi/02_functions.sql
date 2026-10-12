DELIMITER $$

CREATE FUNCTION fn_budget_utilisation(p_budget_id INT)
RETURNS DECIMAL(7,2)
READS SQL DATA
BEGIN
  DECLARE v_limit DECIMAL(12,2);
  DECLARE v_spent DECIMAL(14,2);

  SELECT b.limit_amount,
         COALESCE((SELECT SUM(t.amount)
                   FROM `Transaction` t
                   JOIN Account a ON a.account_id = t.account_id
                   WHERE a.user_id = b.user_id
                     AND t.category_id = b.category_id
                     AND t.txn_type = 'EXPENSE'
                     AND t.txn_date >= b.month_year
                     AND t.txn_date <  DATE_ADD(b.month_year, INTERVAL 1 MONTH)), 0)
  INTO v_limit, v_spent
  FROM Budget b WHERE b.budget_id = p_budget_id;

  IF v_limit IS NULL OR v_limit = 0 THEN RETURN 0; END IF;
  RETURN ROUND(v_spent / v_limit * 100, 2);
END$$

CREATE FUNCTION fn_goal_progress(p_goal_id INT)
RETURNS DECIMAL(5,2)
READS SQL DATA
BEGIN
  DECLARE v_cur DECIMAL(12,2);
  DECLARE v_target DECIMAL(12,2);
  SELECT current_amount, target_amount INTO v_cur, v_target FROM Goal WHERE goal_id = p_goal_id;
  IF v_target IS NULL OR v_target = 0 THEN RETURN 0; END IF;
  RETURN LEAST(100, ROUND(v_cur / v_target * 100, 2));
END$$

CREATE FUNCTION fn_investment_pnl(p_investment_id INT)
RETURNS DECIMAL(16,2)
READS SQL DATA
BEGIN
  DECLARE v_pnl DECIMAL(16,2);
  SELECT (current_price - buy_price) * quantity INTO v_pnl
  FROM Investment WHERE investment_id = p_investment_id;
  RETURN COALESCE(v_pnl, 0);
END$$

DELIMITER ;
