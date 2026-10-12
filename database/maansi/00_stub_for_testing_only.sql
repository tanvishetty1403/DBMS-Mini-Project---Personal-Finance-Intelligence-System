-- ONLY for testing your part alone, before Tanvi's real DDL is available.
-- If you already have Tanvi's tables, DO NOT run this file and DO NOT commit it.
CREATE TABLE `User` (
  user_id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(100) NOT NULL UNIQUE
);
CREATE TABLE Category (
  category_id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL
);
CREATE TABLE Account (
  account_id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  account_name VARCHAR(100) NOT NULL,
  balance DECIMAL(14,2) NOT NULL DEFAULT 0,
  FOREIGN KEY (user_id) REFERENCES `User`(user_id)
);
CREATE TABLE `Transaction` (
  txn_id INT AUTO_INCREMENT PRIMARY KEY,
  account_id INT NOT NULL,
  category_id INT NULL,
  merchant_id INT NULL,
  amount DECIMAL(14,2) NOT NULL,
  txn_type ENUM('INCOME','EXPENSE') NOT NULL,
  txn_date DATE NOT NULL,
  description VARCHAR(255),
  FOREIGN KEY (account_id) REFERENCES Account(account_id),
  FOREIGN KEY (category_id) REFERENCES Category(category_id)
);
INSERT INTO `User` (name, email) VALUES ('Maansi', 'maansi@example.com');
INSERT INTO Category (name) VALUES ('Food'), ('Entertainment'), ('Travel');
INSERT INTO Account (user_id, account_name, balance) VALUES (1, 'Savings', 100000.00);
