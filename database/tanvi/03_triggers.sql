USE personal_finance;
DROP TRIGGER IF EXISTS trg_txn_before_insert;
DROP TRIGGER IF EXISTS trg_txn_after_insert;
DROP TRIGGER IF EXISTS trg_txn_after_delete;
DELIMITER $$

-- 1. Block overdraft before a debit goes through
CREATE TRIGGER trg_txn_before_insert
BEFORE INSERT ON Transaction
FOR EACH ROW
BEGIN
    DECLARE v_balance DECIMAL(12,2);
    IF NEW.txn_type IN ('expense','transfer_out') THEN
        SELECT balance INTO v_balance FROM Account WHERE account_id = NEW.account_id;
        IF v_balance < NEW.amount THEN
            SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Insufficient balance: transaction blocked';
        END IF;
    END IF;
END$$

-- 2. Apply the transaction to the account balance
CREATE TRIGGER trg_txn_after_insert
AFTER INSERT ON Transaction
FOR EACH ROW
BEGIN
    IF NEW.txn_type IN ('income','transfer_in') THEN
        UPDATE Account SET balance = balance + NEW.amount WHERE account_id = NEW.account_id;
    ELSE
        UPDATE Account SET balance = balance - NEW.amount WHERE account_id = NEW.account_id;
    END IF;
END$$

-- 3. Reverse the effect when a transaction is deleted
CREATE TRIGGER trg_txn_after_delete
AFTER DELETE ON Transaction
FOR EACH ROW
BEGIN
    IF OLD.txn_type IN ('income','transfer_in') THEN
        UPDATE Account SET balance = balance - OLD.amount WHERE account_id = OLD.account_id;
    ELSE
        UPDATE Account SET balance = balance + OLD.amount WHERE account_id = OLD.account_id;
    END IF;
END$$

DELIMITER ;
