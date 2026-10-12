DELIMITER $$

-- Trigger 1: budget-exceeded alert (fires after a transaction insert)
CREATE TRIGGER trg_budget_exceeded
AFTER INSERT ON `Transaction`
FOR EACH ROW
BEGIN
  DECLARE v_user   INT;
  DECLARE v_budget INT;
  DECLARE v_limit  DECIMAL(12,2);
  DECLARE v_sent   TINYINT;
  DECLARE v_spent  DECIMAL(14,2);

  IF NEW.txn_type = 'EXPENSE' AND NEW.category_id IS NOT NULL THEN
    SELECT user_id INTO v_user FROM Account WHERE account_id = NEW.account_id;

    SELECT budget_id, limit_amount, alert_sent INTO v_budget, v_limit, v_sent
    FROM Budget
    WHERE user_id = v_user AND category_id = NEW.category_id
      AND month_year = DATE_FORMAT(NEW.txn_date, '%Y-%m-01')
    LIMIT 1;

    IF v_budget IS NOT NULL AND v_sent = 0 THEN
      SELECT COALESCE(SUM(t.amount), 0) INTO v_spent
      FROM `Transaction` t JOIN Account a ON a.account_id = t.account_id
      WHERE a.user_id = v_user AND t.category_id = NEW.category_id
        AND t.txn_type = 'EXPENSE'
        AND t.txn_date >= DATE_FORMAT(NEW.txn_date, '%Y-%m-01')
        AND t.txn_date <  DATE_ADD(DATE_FORMAT(NEW.txn_date, '%Y-%m-01'), INTERVAL 1 MONTH);

      IF v_spent > v_limit THEN
        INSERT INTO Budget_Alert (budget_id, user_id, message)
        VALUES (v_budget, v_user,
                CONCAT('Budget exceeded: spent ', v_spent, ' against limit ', v_limit));
        UPDATE Budget SET alert_sent = 1 WHERE budget_id = v_budget;
      END IF;
    END IF;
  END IF;
END$$

-- Trigger 2: goal progress / completion
CREATE TRIGGER trg_goal_progress
BEFORE UPDATE ON Goal
FOR EACH ROW
BEGIN
  IF NEW.current_amount < 0 THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Goal amount cannot be negative';
  END IF;

  IF NEW.status = 'IN_PROGRESS' AND NEW.current_amount >= NEW.target_amount THEN
    SET NEW.status = 'COMPLETED';
    SET NEW.completed_on = CURDATE();
  END IF;
END$$

-- Trigger 3: subscription next-payment update
CREATE TRIGGER trg_subscription_next_payment
BEFORE UPDATE ON Subscription
FOR EACH ROW
BEGIN
  IF NEW.last_paid_date IS NOT NULL AND NOT (NEW.last_paid_date <=> OLD.last_paid_date) THEN
    SET NEW.next_payment_date = CASE NEW.billing_cycle
        WHEN 'WEEKLY'  THEN DATE_ADD(OLD.next_payment_date, INTERVAL 1 WEEK)
        WHEN 'MONTHLY' THEN DATE_ADD(OLD.next_payment_date, INTERVAL 1 MONTH)
        WHEN 'YEARLY'  THEN DATE_ADD(OLD.next_payment_date, INTERVAL 1 YEAR) END;
  END IF;
END$$

DELIMITER ;
