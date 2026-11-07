-- Sample data for the planning and investments module.
-- Uses user 1 (Tanvi) and user 2 (Maansi S), their accounts, and categories
-- 1 Food & Dining, 2 Entertainment, 3 Groceries, 8 Education from the shared sample data.

-- ---------- user 1 ----------
INSERT INTO Budget (user_id, category_id, month_year, limit_amount) VALUES
(1, 1, DATE_FORMAT(CURDATE(), '%Y-%m-01'), 5000.00),
(1, 2, DATE_FORMAT(CURDATE(), '%Y-%m-01'), 3000.00);

INSERT INTO Subscription (user_id, account_id, category_id, name, amount, billing_cycle, next_payment_date) VALUES
(1, 1, 2, 'Netflix',       649.00, 'MONTHLY', DATE_SUB(CURDATE(), INTERVAL 3 DAY)),
(1, 1, 2, 'Spotify',       119.00, 'MONTHLY', DATE_ADD(CURDATE(), INTERVAL 10 DAY)),
(1, 1, 2, 'Amazon Prime', 1499.00, 'YEARLY',  DATE_ADD(CURDATE(), INTERVAL 90 DAY));

INSERT INTO Investment (user_id, asset_name, asset_type, quantity, buy_price, current_price, purchase_date) VALUES
(1, 'Infosys',             'STOCK',       10,   1450.00,    1620.50,    '2025-06-10'),
(1, 'Nifty 50 Index Fund', 'MUTUAL_FUND', 50,    210.00,     236.75,    '2025-08-01'),
(1, 'Gold ETF',            'GOLD',        20,     58.00,      64.20,    '2025-09-15'),
(1, 'Bitcoin',             'CRYPTO',      0.05, 5500000.00, 5300000.00, '2026-01-20');

INSERT INTO Goal (user_id, goal_name, target_amount, current_amount, deadline) VALUES
(1, 'Laptop',         90000.00, 25000.00, '2027-03-31'),
(1, 'Goa Trip',       30000.00, 12000.00, '2027-01-15'),
(1, 'Emergency Fund', 50000.00, 48000.00, NULL);

-- ---------- user 2 (Maansi S, account 4 = SBI Savings) ----------
INSERT INTO Budget (user_id, category_id, month_year, limit_amount) VALUES
(2, 1, DATE_FORMAT(CURDATE(), '%Y-%m-01'), 4000.00),
(2, 2, DATE_FORMAT(CURDATE(), '%Y-%m-01'), 1500.00),
(2, 3, DATE_FORMAT(CURDATE(), '%Y-%m-01'), 3000.00);

INSERT INTO Subscription (user_id, account_id, category_id, name, amount, billing_cycle, next_payment_date) VALUES
(2, 4, 2, 'Spotify',       119.00, 'MONTHLY', DATE_SUB(CURDATE(), INTERVAL 2 DAY)),
(2, 4, 2, 'Netflix',       199.00, 'MONTHLY', DATE_ADD(CURDATE(), INTERVAL 12 DAY)),
(2, 4, 8, 'Coursera Plus', 3999.00, 'YEARLY', DATE_ADD(CURDATE(), INTERVAL 120 DAY));

INSERT INTO Investment (user_id, asset_name, asset_type, quantity, buy_price, current_price, purchase_date) VALUES
(2, 'Infosys',             'STOCK',       5,   1500.00, 1620.50, '2026-03-10'),
(2, 'Nifty 50 Index Fund', 'MUTUAL_FUND', 40,   220.00,  236.75, '2026-05-01'),
(2, 'Gold ETF',            'GOLD',        15,    60.00,   64.20, '2026-07-15');

INSERT INTO Goal (user_id, goal_name, target_amount, current_amount, deadline) VALUES
(2, 'Laptop',   90000.00, 25000.00, '2027-03-31'),
(2, 'Goa Trip', 30000.00, 12000.00, '2027-01-15');