DELIMITER $$

CREATE PROCEDURE sp_monthly_budget_report(IN p_user INT, IN p_month DATE)
BEGIN
  SELECT budget_id, category, limit_amount, spent,
         (limit_amount - spent) AS remaining,
         utilisation_pct,
         CASE WHEN utilisation_pct > 100 THEN 'EXCEEDED'
              WHEN utilisation_pct >= 80 THEN 'WARNING'
              ELSE 'OK' END AS status
  FROM vw_budget_vs_actual
  WHERE user_id = p_user
    AND month_year = DATE_FORMAT(p_month, '%Y-%m-01')
  ORDER BY utilisation_pct DESC;
END$$

CREATE PROCEDURE sp_portfolio_summary(IN p_user INT)
BEGIN
  SELECT asset_type,
         COUNT(*)                                        AS holdings,
         SUM(quantity * buy_price)                       AS invested,
         SUM(quantity * current_price)                   AS current_value,
         SUM(fn_investment_pnl(investment_id))           AS profit_loss,
         ROUND(SUM(fn_investment_pnl(investment_id))
               / NULLIF(SUM(quantity * buy_price), 0) * 100, 2) AS pnl_pct
  FROM Investment
  WHERE user_id = p_user
  GROUP BY asset_type WITH ROLLUP;   -- NULL asset_type row = grand total
END$$

CREATE PROCEDURE sp_process_due_subscriptions(IN p_user INT)   -- p_user NULL = everyone
BEGIN
  DECLARE done INT DEFAULT 0;
  DECLARE v_id, v_acc, v_cat INT;
  DECLARE v_name VARCHAR(100);
  DECLARE v_amt DECIMAL(12,2);
  DECLARE v_due DATE;
  DECLARE v_processed INT DEFAULT 0;
  DECLARE v_failed INT DEFAULT 0;

  DECLARE cur CURSOR FOR
    SELECT subscription_id, account_id, category_id, name, amount
    FROM Subscription
    WHERE status = 'ACTIVE' AND next_payment_date <= CURDATE()
      AND (p_user IS NULL OR user_id = p_user);
  DECLARE CONTINUE HANDLER FOR NOT FOUND SET done = 1;

  OPEN cur;
  read_loop: LOOP
    FETCH cur INTO v_id, v_acc, v_cat, v_name, v_amt;
    IF done = 1 THEN LEAVE read_loop; END IF;

    BEGIN
      -- if one payment fails (e.g. overdraft trigger), skip this subscription only
      DECLARE EXIT HANDLER FOR SQLEXCEPTION SET v_failed = v_failed + 1;

      SELECT next_payment_date INTO v_due FROM Subscription WHERE subscription_id = v_id;
      WHILE v_due <= CURDATE() DO
        INSERT INTO `Transaction` (account_id, category_id, amount, txn_type, txn_date, description)
        VALUES (v_acc, v_cat, v_amt, 'EXPENSE', v_due, CONCAT('Subscription: ', v_name));

        UPDATE Subscription SET last_paid_date = v_due WHERE subscription_id = v_id;  -- trigger moves next_payment_date
        SELECT next_payment_date INTO v_due FROM Subscription WHERE subscription_id = v_id;
        SET v_processed = v_processed + 1;
      END WHILE;
    END;
  END LOOP;
  CLOSE cur;

  SELECT v_processed AS payments_processed, v_failed AS subscriptions_failed;
END$$

DELIMITER ;
