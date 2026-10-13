USE personal_finance;
DROP FUNCTION IF EXISTS fn_monthly_spend;
DROP FUNCTION IF EXISTS fn_savings_rate;
DELIMITER $$

-- Total expense for a user in a month; p_category_id NULL = all categories
CREATE FUNCTION fn_monthly_spend(p_user_id INT, p_category_id INT, p_year INT, p_month INT)
RETURNS DECIMAL(12,2)
DETERMINISTIC READS SQL DATA
BEGIN
    DECLARE v_total DECIMAL(12,2);
    SELECT COALESCE(SUM(t.amount), 0) INTO v_total
    FROM Transaction t JOIN Account a ON a.account_id = t.account_id
    WHERE a.user_id = p_user_id
      AND t.txn_type = 'expense'
      AND YEAR(t.txn_date) = p_year
      AND MONTH(t.txn_date) = p_month
      AND (p_category_id IS NULL OR t.category_id = p_category_id);
    RETURN v_total;
END$$

-- (income - expense) / income * 100 for a user in a month
CREATE FUNCTION fn_savings_rate(p_user_id INT, p_year INT, p_month INT)
RETURNS DECIMAL(6,2)
DETERMINISTIC READS SQL DATA
BEGIN
    DECLARE v_income DECIMAL(12,2);
    DECLARE v_expense DECIMAL(12,2);
    SELECT COALESCE(SUM(t.amount),0) INTO v_income
    FROM Transaction t JOIN Account a ON a.account_id = t.account_id
    WHERE a.user_id = p_user_id AND t.txn_type = 'income'
      AND YEAR(t.txn_date)=p_year AND MONTH(t.txn_date)=p_month;
    SET v_expense = fn_monthly_spend(p_user_id, NULL, p_year, p_month);
    IF v_income = 0 THEN RETURN 0; END IF;
    RETURN ROUND((v_income - v_expense) / v_income * 100, 2);
END$$

DELIMITER ;
