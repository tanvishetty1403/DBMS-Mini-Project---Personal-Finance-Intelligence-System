-- Owner: Tanvi B. Shetty | Tables: User, Category, Merchant, Account, Transaction (receipts live in MongoDB)
DROP DATABASE IF EXISTS personal_finance;
CREATE DATABASE personal_finance;
USE personal_finance;

CREATE TABLE User (
    user_id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(150) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(30) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE Category (
    category_id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    category_type VARCHAR(30) NOT NULL   -- income | expense | transfer
);

CREATE TABLE Merchant (
    merchant_id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(150) NOT NULL,
    merchant_category VARCHAR(100),
    location VARCHAR(200)
);

CREATE TABLE Account (
    account_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    account_name VARCHAR(100) NOT NULL,
    account_type VARCHAR(50) NOT NULL,
    balance DECIMAL(12,2) DEFAULT 0.00,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_account_user FOREIGN KEY (user_id) REFERENCES User(user_id) ON DELETE CASCADE,
    CONSTRAINT chk_account_balance CHECK (balance >= 0)
);

-- txn_type: income | expense | transfer_in | transfer_out
CREATE TABLE Transaction (
    transaction_id BIGINT AUTO_INCREMENT PRIMARY KEY,
    account_id INT NOT NULL,
    category_id INT NOT NULL,
    merchant_id INT,
    amount DECIMAL(12,2) NOT NULL,
    txn_type VARCHAR(30) NOT NULL,
    txn_date DATE NOT NULL,
    description VARCHAR(255),
    CONSTRAINT fk_transaction_account FOREIGN KEY (account_id) REFERENCES Account(account_id) ON DELETE CASCADE,
    CONSTRAINT fk_transaction_category FOREIGN KEY (category_id) REFERENCES Category(category_id) ON DELETE RESTRICT,
    CONSTRAINT fk_transaction_merchant FOREIGN KEY (merchant_id) REFERENCES Merchant(merchant_id) ON DELETE SET NULL,
    CONSTRAINT chk_transaction_amount CHECK (amount > 0),
    CONSTRAINT chk_txn_type CHECK (txn_type IN ('income','expense','transfer_in','transfer_out'))
);

CREATE INDEX idx_transaction_account  ON Transaction(account_id);
CREATE INDEX idx_transaction_category ON Transaction(category_id);
CREATE INDEX idx_transaction_merchant ON Transaction(merchant_id);
CREATE INDEX idx_txn_date     ON Transaction(txn_date);
