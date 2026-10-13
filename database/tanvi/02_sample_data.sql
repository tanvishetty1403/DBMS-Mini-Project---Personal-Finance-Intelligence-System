USE personal_finance;

-- all sample users have password: password123
INSERT INTO User (name, email, password_hash, role) VALUES
('Tanvi Shetty', 'tanvi@example.com', 'pbkdf2:sha256:1000000$KSUQshqqbosJLiaY$3c0b714dbb458c7f69b8a28ec819c00f7f7b74a6ab65633daa698b6312b527c1', 'user'),
('Maansi S',     'maansi@example.com','pbkdf2:sha256:1000000$KSUQshqqbosJLiaY$3c0b714dbb458c7f69b8a28ec819c00f7f7b74a6ab65633daa698b6312b527c1', 'user'),
('Admin',        'admin@example.com', 'pbkdf2:sha256:1000000$KSUQshqqbosJLiaY$3c0b714dbb458c7f69b8a28ec819c00f7f7b74a6ab65633daa698b6312b527c1', 'admin');

INSERT INTO Category (name, category_type) VALUES
('Food & Dining','expense'),('Entertainment','expense'),('Groceries','expense'),('Transport','expense'),
('Rent','expense'),('Shopping','expense'),('Utilities','expense'),('Education','expense'),
('Health','expense'),('Salary','income'),('Freelance','income'),('Transfer','transfer');

INSERT INTO Merchant (name, merchant_category, location) VALUES
('Swiggy','Food Delivery','Bengaluru'),('Zomato','Food Delivery','Bengaluru'),
('BigBasket','Groceries','Bengaluru'),('Uber','Transport','Bengaluru'),
('Namma Metro','Transport','Bengaluru'),('Amazon','Shopping','Online'),
('Netflix','Entertainment','Online'),('Spotify','Entertainment','Online'),
('BESCOM','Utilities','Bengaluru'),('Apollo Pharmacy','Health','Bengaluru');

-- opening balances (transactions below adjust these via trigger)
INSERT INTO Account (user_id, account_name, account_type, balance) VALUES
(1,'HDFC Savings','savings',40000.00),(1,'Cash Wallet','cash',3000.00),(1,'ICICI Credit Card','credit',10000.00),
(2,'SBI Savings','savings',35000.00),(2,'Paytm Wallet','wallet',2000.00),
(3,'Admin Test Account','savings',50000.00);
