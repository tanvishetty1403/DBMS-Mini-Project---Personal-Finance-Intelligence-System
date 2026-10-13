USE personal_finance;
DROP PROCEDURE IF EXISTS sp_add_transaction;
DROP PROCEDURE IF EXISTS sp_transfer;
DELIMITER $$

-- Add a transaction; the triggers handle balance + overdraft checks
CREATE PROCEDURE sp_add_transaction(
    IN p_account_id INT, IN p_category_id INT, IN p_merchant_id INT,
    IN p_amount DECIMAL(12,2), IN p_type VARCHAR(30),
    IN p_date DATE, IN p_description VARCHAR(255),
    OUT p_transaction_id BIGINT)
BEGIN
    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        ROLLBACK;
        RESIGNAL;
    END;

    IF p_type NOT IN ('income','expense') THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Type must be income or expense (use sp_transfer for transfers)';
    END IF;

    START TRANSACTION;
    INSERT INTO Transaction (account_id, category_id, merchant_id, amount, txn_type, txn_date, description)
    VALUES (p_account_id, p_category_id, p_merchant_id, p_amount, p_type, p_date, p_description);
    SET p_transaction_id = LAST_INSERT_ID();
    COMMIT;
END$$

-- Atomic transfer: debit one account, credit the other, all or nothing
CREATE PROCEDURE sp_transfer(
    IN p_from_account INT, IN p_to_account INT,
    IN p_amount DECIMAL(12,2), IN p_date DATE, IN p_description VARCHAR(255))
BEGIN
    DECLARE v_cat INT;
    DECLARE v_from_user INT;
    DECLARE v_to_user INT;

    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        ROLLBACK;
        RESIGNAL;
    END;

    IF p_from_account = p_to_account THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Cannot transfer to the same account';
    END IF;

    SELECT user_id INTO v_from_user FROM Account WHERE account_id = p_from_account;
    SELECT user_id INTO v_to_user   FROM Account WHERE account_id = p_to_account;
    IF v_from_user IS NULL OR v_to_user IS NULL THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Account not found';
    END IF;
    IF v_from_user <> v_to_user THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Transfers allowed only between your own accounts';
    END IF;

    SELECT category_id INTO v_cat FROM Category WHERE category_type = 'transfer' LIMIT 1;

    START TRANSACTION;
    INSERT INTO Transaction (account_id, category_id, amount, txn_type, txn_date, description)
    VALUES (p_from_account, v_cat, p_amount, 'transfer_out', p_date, CONCAT('Transfer out: ', COALESCE(p_description,'')));
    INSERT INTO Transaction (account_id, category_id, amount, txn_type, txn_date, description)
    VALUES (p_to_account, v_cat, p_amount, 'transfer_in', p_date, CONCAT('Transfer in: ', COALESCE(p_description,'')));
    COMMIT;
END$$

DELIMITER ;
