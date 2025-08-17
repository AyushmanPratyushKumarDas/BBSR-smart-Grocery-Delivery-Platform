CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- USERS TABLE
-- =====================================================
CREATE TABLE users (
    id SERIAL PRIMARY KEY, -- auto-increment integer
    name VARCHAR(100) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    phone VARCHAR(20) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(20) DEFAULT 'customer' CHECK (role IN ('customer', 'store_owner', 'delivery_partner', 'admin')),
    avatar_url VARCHAR(500),
    is_verified BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    last_login TIMESTAMP,
    preferences JSONB DEFAULT CAST('{}' AS JSONB),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
CREATE TABLE categories (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    image_url VARCHAR(500),
    parent_category_id INTEGER REFERENCES categories(id),
    is_active BOOLEAN DEFAULT TRUE,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
CREATE TABLE stores (
    id SERIAL PRIMARY KEY,
    name VARCHAR(200) NOT NULL,
    description TEXT,
    owner_id INT NOT NULL REFERENCES users(id),
    category VARCHAR(50) NOT NULL,
    location VARCHAR(200) NOT NULL,
    address JSONB NOT NULL,
    coordinates JSONB NOT NULL,
    CONSTRAINT coordinates_check CHECK (
        jsonb_typeof(coordinates) = 'object'
        AND coordinates ? 'lat'
        AND coordinates ? 'lng'
    ),
    phone VARCHAR(20) NOT NULL,
    email VARCHAR(255),
    logo_url VARCHAR(500),
    banner_url VARCHAR(500),
    rating DECIMAL(3,2) DEFAULT 0 CHECK (rating >= 0 AND rating <= 5),
    review_count INTEGER DEFAULT 0,
    is_open BOOLEAN DEFAULT TRUE,
    operating_hours JSONB NOT NULL,
    delivery_time VARCHAR(50),
    minimum_order DECIMAL(10,2) DEFAULT 0,
    delivery_fee DECIMAL(10,2) DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    is_verified BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
CREATE TABLE products (
    id SERIAL PRIMARY KEY,
    name VARCHAR(200) NOT NULL,
    description TEXT,
    category_id INT NOT NULL REFERENCES categories(id),
    store_id INT NOT NULL REFERENCES stores(id),
    sku VARCHAR(100) UNIQUE NOT NULL,
    price DECIMAL(10,2) NOT NULL CHECK (price >= 0),
    original_price DECIMAL(10,2),
    stock INT DEFAULT 0 CHECK (stock >= 0),
    unit VARCHAR(50) NOT NULL DEFAULT 'piece',
    weight DECIMAL(8,3),

    images JSONB DEFAULT CAST('[]' AS JSONB),
    nutritional_info JSONB DEFAULT CAST('{}' AS JSONB),
    allergens JSONB DEFAULT CAST('[]' AS JSONB),

    is_featured BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    rating DECIMAL(3,2) DEFAULT 0 CHECK (rating >= 0 AND rating <= 5),
    review_count INT DEFAULT 0,
    expiry_date DATE,
    origin VARCHAR(200),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
-- ===================================================== 
CREATE TABLE orders (
    id SERIAL PRIMARY KEY,
    order_number VARCHAR(50) UNIQUE NOT NULL,
    user_id INT NOT NULL REFERENCES users(id),
    store_id INT NOT NULL REFERENCES stores(id),
    delivery_partner_id INT REFERENCES users(id),
    items JSONB NOT NULL CHECK (jsonb_typeof(items) = 'array' AND jsonb_array_length(items) > 0),
    subtotal DECIMAL(10,2) NOT NULL CHECK (subtotal >= 0),
    delivery_fee DECIMAL(10,2) DEFAULT 0,
    total DECIMAL(10,2) NOT NULL CHECK (total >= 0),
    status VARCHAR(30) DEFAULT 'pending' CHECK (
        status IN ('pending','confirmed','preparing','ready_for_pickup','out_for_delivery','delivered','cancelled','refunded')
    ),
    payment_status VARCHAR(20) DEFAULT 'pending' CHECK (
        payment_status IN ('pending','paid','failed','refunded')
    ),
    payment_method VARCHAR(20),
    delivery_address JSONB NOT NULL,
    delivery_coordinates JSONB,
    estimated_delivery_time TIMESTAMP,
    actual_delivery_time TIMESTAMP,
    order_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
-- =====================================================
-- =====================================================
-- USER ADDRESSES TABLE
-- =====================================================

CREATE TABLE user_addresses (
    id SERIAL PRIMARY KEY,
    user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    type VARCHAR(20) NOT NULL DEFAULT 'home',
    address TEXT NOT NULL,
    coordinates JSONB,
    is_default BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- =====================================================
-- PRODUCT REVIEWS TABLE
-- =====================================================
CREATE TABLE product_reviews (
    id SERIAL PRIMARY KEY,
    product_id INT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    comment TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(product_id, user_id)
);

-- =====================================================
-- STORE REVIEWS TABLE
-- =====================================================
CREATE TABLE store_reviews (
    id SERIAL PRIMARY KEY,
    store_id INT NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
    user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    comment TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(store_id, user_id)
);

-- =====================================================
-- ORDER ITEMS TABLE
-- =====================================================
CREATE TABLE order_items (
    id SERIAL PRIMARY KEY,
    order_id INT NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    product_id INT NOT NULL REFERENCES products(id),
    product_name VARCHAR(200) NOT NULL,
    quantity INTEGER NOT NULL CHECK (quantity > 0),
    unit_price DECIMAL(10,2) NOT NULL CHECK (unit_price >= 0),
    total_price DECIMAL(10,2) NOT NULL CHECK (total_price >= 0),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- TRIGGER FUNCTION FOR updated_at
-- =====================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers
CREATE TRIGGER trg_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trg_categories_updated_at BEFORE UPDATE ON categories FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trg_stores_updated_at BEFORE UPDATE ON stores FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trg_products_updated_at BEFORE UPDATE ON products FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trg_orders_updated_at BEFORE UPDATE ON orders FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trg_user_addresses_updated_at BEFORE UPDATE ON user_addresses FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trg_product_reviews_updated_at BEFORE UPDATE ON product_reviews FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trg_store_reviews_updated_at BEFORE UPDATE ON store_reviews FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- INDEXES
-- =====================================================

-- Users
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_phone ON users(phone);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_is_active ON users(is_active);

-- Categories
CREATE INDEX idx_categories_name ON categories(name);
CREATE INDEX idx_categories_parent_id ON categories(parent_category_id);
CREATE INDEX idx_categories_is_active ON categories(is_active);

-- Stores
CREATE INDEX idx_stores_owner_id ON stores(owner_id);
CREATE INDEX idx_stores_category ON stores(category);
CREATE INDEX idx_stores_location ON stores(location);
CREATE INDEX idx_stores_rating ON stores(rating);
CREATE INDEX idx_stores_is_active ON stores(is_active);
CREATE INDEX idx_stores_coordinates ON stores USING GIN(coordinates);
CREATE INDEX idx_stores_operating_hours ON stores USING GIN(operating_hours);

-- Products
CREATE INDEX idx_products_store_id ON products(store_id);
CREATE INDEX idx_products_category_id ON products(category_id);
CREATE INDEX idx_products_price ON products(price);
CREATE INDEX idx_products_stock ON products(stock);
CREATE INDEX idx_products_rating ON products(rating);
CREATE INDEX idx_products_is_featured ON products(is_featured);
CREATE INDEX idx_products_is_active ON products(is_active);
CREATE INDEX idx_products_sku ON products(sku);
CREATE INDEX idx_products_images ON products USING GIN(images);
CREATE INDEX idx_products_allergens ON products USING GIN(allergens);
CREATE INDEX idx_products_nutritional_info ON products USING GIN(nutritional_info);

-- Orders
CREATE INDEX idx_orders_user_id ON orders(user_id);
CREATE INDEX idx_orders_store_id ON orders(store_id);
CREATE INDEX idx_orders_delivery_partner_id ON orders(delivery_partner_id);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_payment_status ON orders(payment_status);
CREATE INDEX idx_orders_order_number ON orders(order_number);
CREATE INDEX idx_orders_created_at ON orders(created_at);
CREATE INDEX idx_orders_items ON orders USING GIN(items);
CREATE INDEX idx_orders_delivery_address ON orders USING GIN(delivery_address);

-- User addresses
CREATE INDEX idx_user_addresses_user_id ON user_addresses(user_id);
CREATE INDEX idx_user_addresses_is_default ON user_addresses(is_default);

-- Product reviews
CREATE INDEX idx_product_reviews_product_id ON product_reviews(product_id);
CREATE INDEX idx_product_reviews_user_id ON product_reviews(user_id);
CREATE INDEX idx_product_reviews_rating ON product_reviews(rating);

-- Store reviews
CREATE INDEX idx_store_reviews_store_id ON store_reviews(store_id);
CREATE INDEX idx_store_reviews_user_id ON store_reviews(user_id);
CREATE INDEX idx_store_reviews_rating ON store_reviews(rating);

-- Order items
CREATE INDEX idx_order_items_order_id ON order_items(order_id);
CREATE INDEX idx_order_items_product_id ON order_items(product_id);

-- =====================================================
-- VIEWS
-- =====================================================

-- Active products with store + category info
CREATE OR REPLACE VIEW active_products_view AS
SELECT 
    p.id,
    p.name,
    p.description,
    p.price,
    p.original_price,
    p.stock,
    p.unit,
    p.rating,
    p.review_count,
    p.is_featured,
    p.category_id,
    c.name AS category_name,
    p.store_id,
    s.name AS store_name,
    s.location AS store_location,
    s.rating AS store_rating
FROM products p
JOIN categories c ON p.category_id = c.id
JOIN stores s ON p.store_id = s.id
WHERE p.is_active = TRUE 
  AND s.is_active = TRUE;

-- Store stats: products + orders + revenue
CREATE OR REPLACE VIEW store_stats_view AS
SELECT 
    s.id,
    s.name,
    s.category,
    s.rating,
    s.review_count,
    COUNT(p.id) AS product_count,
    AVG(p.rating) AS avg_product_rating,
    COUNT(DISTINCT o.id) AS total_orders,
    SUM(o.total) AS total_revenue
FROM stores s
LEFT JOIN products p 
       ON s.id = p.store_id AND p.is_active = TRUE
LEFT JOIN orders o 
       ON s.id = o.store_id
GROUP BY s.id, s.name, s.category, s.rating, s.review_count;

-- User order history
CREATE OR REPLACE VIEW user_order_history_view AS
SELECT 
    u.id AS user_id,
    u.name AS user_name,
    u.email,
    o.id AS order_id,
    o.order_number,
    o.total,
    o.status,
    o.payment_status,
    o.created_at AS order_date,
    s.name AS store_name,
    s.location AS store_location
FROM users u
JOIN orders o ON u.id = o.user_id
JOIN stores s ON o.store_id = s.id
ORDER BY o.created_at DESC;




