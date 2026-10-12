-- Maansi: Budget, Budget_Alert, Subscription, Investment, Goal
CREATE TABLE Budget (
  budget_id     INT AUTO_INCREMENT PRIMARY KEY,
  user_id       INT NOT NULL,
  category_id   INT NOT NULL,
  month_year    DATE NOT NULL COMMENT 'first day of the month',
  limit_amount  DECIMAL(12,2) NOT NULL,
  alert_sent    TINYINT(1) NOT NULL DEFAULT 0,
  CONSTRAINT chk_budget_limit CHECK (limit_amount > 0),
  CONSTRAINT uq_budget UNIQUE (user_id, category_id, month_year),
  CONSTRAINT fk_budget_user FOREIGN KEY (user_id) REFERENCES `User`(user_id) ON DELETE CASCADE,
  CONSTRAINT fk_budget_cat  FOREIGN KEY (category_id) REFERENCES Category(category_id)
);

CREATE TABLE Budget_Alert (
  alert_id    INT AUTO_INCREMENT PRIMARY KEY,
  budget_id   INT NOT NULL,
  user_id     INT NOT NULL,
  message     VARCHAR(255) NOT NULL,
  created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  is_read     TINYINT(1) NOT NULL DEFAULT 0,
  FOREIGN KEY (budget_id) REFERENCES Budget(budget_id) ON DELETE CASCADE,
  FOREIGN KEY (user_id)   REFERENCES `User`(user_id) ON DELETE CASCADE
);

CREATE TABLE Subscription (
  subscription_id   INT AUTO_INCREMENT PRIMARY KEY,
  user_id           INT NOT NULL,
  account_id        INT NOT NULL,
  category_id       INT NULL,
  name              VARCHAR(100) NOT NULL,
  amount            DECIMAL(12,2) NOT NULL,
  billing_cycle     ENUM('WEEKLY','MONTHLY','YEARLY') NOT NULL DEFAULT 'MONTHLY',
  next_payment_date DATE NOT NULL,
  last_paid_date    DATE NULL,
  status            ENUM('ACTIVE','PAUSED','CANCELLED') NOT NULL DEFAULT 'ACTIVE',
  CONSTRAINT chk_sub_amount CHECK (amount > 0),
  FOREIGN KEY (user_id)     REFERENCES `User`(user_id) ON DELETE CASCADE,
  FOREIGN KEY (account_id)  REFERENCES Account(account_id),
  FOREIGN KEY (category_id) REFERENCES Category(category_id)
);

CREATE TABLE Investment (
  investment_id  INT AUTO_INCREMENT PRIMARY KEY,
  user_id        INT NOT NULL,
  asset_name     VARCHAR(100) NOT NULL,
  asset_type     ENUM('STOCK','MUTUAL_FUND','CRYPTO','FD','GOLD','OTHER') NOT NULL,
  quantity       DECIMAL(18,4) NOT NULL,
  buy_price      DECIMAL(14,2) NOT NULL,
  current_price  DECIMAL(14,2) NOT NULL,
  purchase_date  DATE NOT NULL,
  CONSTRAINT chk_inv_qty   CHECK (quantity > 0),
  CONSTRAINT chk_inv_price CHECK (buy_price >= 0 AND current_price >= 0),
  FOREIGN KEY (user_id) REFERENCES `User`(user_id) ON DELETE CASCADE
);

CREATE TABLE Goal (
  goal_id         INT AUTO_INCREMENT PRIMARY KEY,
  user_id         INT NOT NULL,
  goal_name       VARCHAR(100) NOT NULL,
  target_amount   DECIMAL(12,2) NOT NULL,
  current_amount  DECIMAL(12,2) NOT NULL DEFAULT 0,
  deadline        DATE NULL,
  status          ENUM('IN_PROGRESS','COMPLETED','CANCELLED') NOT NULL DEFAULT 'IN_PROGRESS',
  completed_on    DATE NULL,
  CONSTRAINT chk_goal_target CHECK (target_amount > 0),
  CONSTRAINT chk_goal_curr   CHECK (current_amount >= 0),
  FOREIGN KEY (user_id) REFERENCES `User`(user_id) ON DELETE CASCADE
);

CREATE INDEX idx_inv_user  ON Investment(user_id);
CREATE INDEX idx_sub_due   ON Subscription(status, next_payment_date);
CREATE INDEX idx_goal_user ON Goal(user_id, status);
