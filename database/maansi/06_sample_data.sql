-- Assumes user_id 1, account_id 1, category_id 1 (Food) and 2 (Entertainment) exist.
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
