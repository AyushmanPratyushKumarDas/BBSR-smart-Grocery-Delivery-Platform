INSERT INTO users (name, email, phone, password_hash, role, avatar_url, is_active)
VALUES
('Alice Johnson', 'alice@example.com', '+919876543210', 'hash1', 'customer', 'https://example.com/avatars/alice.png', TRUE),
('Bob Smith', 'bob@example.com', '+918765432109', 'hash2', 'owner', 'https://example.com/avatars/bob.png', TRUE),
('Charlie Admin', 'charlie@example.com', '+917654321098', 'hash3', 'admin', 'https://example.com/avatars/charlie.png', TRUE),
('David Green', 'david@example.com', '+917612345678', 'hash4', 'customer', 'https://example.com/avatars/david.png', TRUE),
('Eva Brown', 'eva@example.com', '+917623456789', 'hash5', 'customer', 'https://example.com/avatars/eva.png', TRUE),
('Frank Wilson', 'frank@example.com', '+917634567890', 'hash6', 'delivery_partner', 'https://example.com/avatars/frank.png', TRUE),
('Grace Miller', 'grace@example.com', '+917645678901', 'hash7', 'customer', 'https://example.com/avatars/grace.png', TRUE),
('Henry Taylor', 'henry@example.com', '+917656789012', 'hash8', 'customer', 'https://example.com/avatars/henry.png', TRUE),
('Ivy Davis', 'ivy@example.com', '+917667890123', 'hash9', 'customer', 'https://example.com/avatars/ivy.png', TRUE),
('Jack White', 'jack@example.com', '+917678901234', 'hash10', 'owner', 'https://example.com/avatars/jack.png', TRUE);


INSERT INTO categories (name, description, is_active)
VALUES
('Groceries', 'Daily essentials and food items', TRUE),
('Electronics', 'Mobile phones, gadgets and accessories', TRUE),
('Clothing', 'Men and Women apparel', TRUE),
('Books', 'Fiction, Non-fiction, Academic books', TRUE),
('Home Appliances', 'Appliances for everyday use', TRUE);


INSERT INTO stores (owner_id, name, category_id, location, coordinates, rating, images, is_active)
VALUES
((SELECT id FROM users WHERE email='bob@example.com'),
 'FreshMart',
 (SELECT id FROM categories WHERE name='Groceries'),
 'Bangalore, India',
 '{"lat":12.9716,"lng":77.5946}',
 4.6,
 '["https://example.com/stores/freshmart1.jpg","https://example.com/stores/freshmart2.jpg"]'::jsonb,
 TRUE),

((SELECT id FROM users WHERE email='jack@example.com'),
 'TechWorld',
 (SELECT id FROM categories WHERE name='Electronics'),
 'Mumbai, India',
 '{"lat":19.0760,"lng":72.8777}',
 4.4,
 '["https://example.com/stores/techworld1.jpg"]'::jsonb,
 TRUE),

((SELECT id FROM users WHERE email='bob@example.com'),
 'StyleHub',
 (SELECT id FROM categories WHERE name='Clothing'),
 'Delhi, India',
 '{"lat":28.7041,"lng":77.1025}',
 4.2,
 '["https://example.com/stores/stylehub1.jpg"]'::jsonb,
 TRUE);



INSERT INTO products (store_id, category_id, name, description, price, original_price, stock, unit, images, nutritional_info, allergens, tags, is_featured, is_active)
VALUES
-- FreshMart (Groceries)
((SELECT id FROM stores WHERE name='FreshMart'), (SELECT id FROM categories WHERE name='Groceries'),
 'Organic Apples', 'Fresh Kashmiri apples', 120, 150, 100, 'kg',
 '["https://example.com/products/apple.jpg"]'::jsonb,
 '{"calories":52,"carbs":14}'::jsonb, '["none"]'::jsonb, '["organic","fruit"]'::jsonb, TRUE, TRUE),

((SELECT id FROM stores WHERE name='FreshMart'), (SELECT id FROM categories WHERE name='Groceries'),
 'Basmati Rice', 'Premium long-grain rice', 900, 1000, 200, '5kg bag',
 '["https://example.com/products/rice.jpg"]'::jsonb,
 '{}'::jsonb, '["none"]'::jsonb, '["staple","grain"]'::jsonb, FALSE, TRUE),

((SELECT id FROM stores WHERE name='FreshMart'), (SELECT id FROM categories WHERE name='Groceries'),
 'Whole Wheat Bread', 'Healthy brown bread', 40, 50, 300, 'loaf',
 '["https://example.com/products/bread.jpg"]'::jsonb,
 '{}'::jsonb, '["gluten"]'::jsonb, '["bread","bakery"]'::jsonb, FALSE, TRUE),

-- TechWorld (Electronics)
((SELECT id FROM stores WHERE name='TechWorld'), (SELECT id FROM categories WHERE name='Electronics'),
 'iPhone 14 Pro', 'Apple iPhone 14 Pro 128GB', 129999, 139999, 50, 'piece',
 '["https://example.com/products/iphone14.jpg"]'::jsonb,
 '{}'::jsonb, '[]'::jsonb, '["mobile","apple"]'::jsonb, TRUE, TRUE),

((SELECT id FROM stores WHERE name='TechWorld'), (SELECT id FROM categories WHERE name='Electronics'),
 'Samsung Galaxy S23', 'Samsung flagship smartphone', 79999, 84999, 80, 'piece',
 '["https://example.com/products/samsung.jpg"]'::jsonb,
 '{}'::jsonb, '[]'::jsonb, '["mobile","samsung"]'::jsonb, TRUE, TRUE),

((SELECT id FROM stores WHERE name='TechWorld'), (SELECT id FROM categories WHERE name='Electronics'),
 'Sony WH-1000XM5', 'Noise-cancelling headphones', 29999, 34999, 120, 'piece',
 '["https://example.com/products/sony.jpg"]'::jsonb,
 '{}'::jsonb, '[]'::jsonb, '["headphones","audio"]'::jsonb, FALSE, TRUE),

-- StyleHub (Clothing)
((SELECT id FROM stores WHERE name='StyleHub'), (SELECT id FROM categories WHERE name='Clothing'),
 'Men''s T-Shirt', 'Cotton t-shirt for men', 799, 999, 150, 'piece',
 '["https://example.com/products/tshirt.jpg"]'::jsonb,
 '{}'::jsonb, '[]'::jsonb, '["clothing","men"]'::jsonb, FALSE, TRUE),

((SELECT id FROM stores WHERE name='StyleHub'), (SELECT id FROM categories WHERE name='Clothing'),
 'Women''s Jeans', 'Slim fit blue denim jeans', 1499, 1999, 90, 'piece',
 '["https://example.com/products/jeans.jpg"]'::jsonb,
 '{}'::jsonb, '[]'::jsonb, '["clothing","women"]'::jsonb, TRUE, TRUE),

((SELECT id FROM stores WHERE name='StyleHub'), (SELECT id FROM categories WHERE name='Clothing'),
 'Winter Jacket', 'Warm and stylish jacket', 3499, 3999, 70, 'piece',
 '["https://example.com/products/jacket.jpg"]'::jsonb,
 '{}'::jsonb, '[]'::jsonb, '["clothing","winter"]'::jsonb, FALSE, TRUE),

-- Mixed Example
((SELECT id FROM stores WHERE name='FreshMart'), (SELECT id FROM categories WHERE name='Groceries'),
 'Almonds Pack', 'Healthy dry fruits', 600, 750, 100, '500g pack',
 '["https://example.com/products/almonds.jpg"]'::jsonb,
 '{"calories":579,"protein":21}'::jsonb, '["nuts"]'::jsonb, '["dryfruits","snacks"]'::jsonb, TRUE, TRUE);



INSERT INTO user_addresses (user_id, type, address, coordinates, is_default)
VALUES
((SELECT id FROM users WHERE email='alice@example.com'), 'home', '123 MG Road, Bangalore', '{"lat":12.975,"lng":77.605}', TRUE),
((SELECT id FROM users WHERE email='david@example.com'), 'work', 'IT Park, Whitefield, Bangalore', '{"lat":12.984,"lng":77.750}', FALSE),
((SELECT id FROM users WHERE email='eva@example.com'), 'home', 'Mumbai Central, Mumbai', '{"lat":19.082,"lng":72.841}', TRUE);



-- Order 1
INSERT INTO orders (user_id, store_id, total, status, payment_status, order_number, delivery_partner_id, delivery_address)
VALUES
((SELECT id FROM users WHERE email='alice@example.com'),
 (SELECT id FROM stores WHERE name='FreshMart'),
 240, 'delivered', 'paid', 'ORD-1001',
 (SELECT id FROM users WHERE email='frank@example.com'),
 '{"address":"123 MG Road, Bangalore","lat":12.975,"lng":77.605}'::jsonb);

INSERT INTO order_items (order_id, product_id, quantity, price)
VALUES
((SELECT id FROM orders WHERE order_number='ORD-1001'),
 (SELECT id FROM products WHERE name='Organic Apples'), 2, 240);

-- Order 2
INSERT INTO orders (user_id, store_id, total, status, payment_status, order_number, delivery_partner_id, delivery_address)
VALUES
((SELECT id FROM users WHERE email='grace@example.com'),
 (SELECT id FROM stores WHERE name='TechWorld'),
 129999, 'delivered', 'paid', 'ORD-1002',
 (SELECT id FROM users WHERE email='frank@example.com'),
 '{"address":"Mumbai Central, Mumbai","lat":19.082,"lng":72.841}'::jsonb);

INSERT INTO order_items (order_id, product_id, quantity, price)
VALUES
((SELECT id FROM orders WHERE order_number='ORD-1002'),
 (SELECT id FROM products WHERE name='iPhone 14 Pro'), 1, 129999);


-- Product Review
INSERT INTO product_reviews (product_id, user_id, rating, comment)
VALUES
((SELECT id FROM products WHERE name='Organic Apples'),
 (SELECT id FROM users WHERE email='alice@example.com'),
 5, 'Really fresh and delicious!'),

((SELECT id FROM products WHERE name='iPhone 14 Pro'),
 (SELECT id FROM users WHERE email='grace@example.com'),
 4, 'Amazing phone but quite expensive.');

-- Store Review
INSERT INTO store_reviews (store_id, user_id, rating, comment)
VALUES
((SELECT id FROM stores WHERE name='FreshMart'),
 (SELECT id FROM users WHERE email='alice@example.com'),
 5, 'Best grocery store in town!'),

((SELECT id FROM stores WHERE name='TechWorld'),
 (SELECT id FROM users WHERE email='grace@example.com'),
 4, 'Good service and product availability.');
