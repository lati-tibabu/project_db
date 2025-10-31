# E-Commerce Database Setup

This document provides SQL scripts to set up a complete e-commerce database schema that works with the E-Commerce Store app.

## Database Tables

### 1. Products Table
```sql
CREATE TABLE products (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    price DECIMAL(10,2) NOT NULL,
    category VARCHAR(100),
    stock_quantity INTEGER DEFAULT 0,
    sku VARCHAR(100) UNIQUE,
    image_url VARCHAR(500),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Sample data
INSERT INTO products (name, description, price, category, stock_quantity, sku) VALUES
('Wireless Headphones', 'High-quality wireless headphones with noise cancellation', 199.99, 'Electronics', 50, 'WH-001'),
('Smart Watch', 'Fitness tracking smart watch with heart rate monitor', 299.99, 'Electronics', 30, 'SW-002'),
('Coffee Maker', 'Programmable coffee maker with thermal carafe', 89.99, 'Appliances', 25, 'CM-003'),
('Yoga Mat', 'Non-slip yoga mat for all fitness levels', 29.99, 'Sports & Fitness', 100, 'YM-004'),
('Desk Lamp', 'LED desk lamp with adjustable brightness', 49.99, 'Home & Office', 40, 'DL-005');
```

### 2. Customers Table
```sql
CREATE TABLE customers (
    id SERIAL PRIMARY KEY,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    phone VARCHAR(20),
    address TEXT,
    city VARCHAR(100),
    state VARCHAR(100),
    zip_code VARCHAR(20),
    country VARCHAR(100) DEFAULT 'USA',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Sample data
INSERT INTO customers (first_name, last_name, email, phone, city, state) VALUES
('John', 'Doe', 'john.doe@email.com', '555-0101', 'New York', 'NY'),
('Jane', 'Smith', 'jane.smith@email.com', '555-0102', 'Los Angeles', 'CA'),
('Bob', 'Johnson', 'bob.johnson@email.com', '555-0103', 'Chicago', 'IL'),
('Alice', 'Brown', 'alice.brown@email.com', '555-0104', 'Houston', 'TX'),
('Charlie', 'Wilson', 'charlie.wilson@email.com', '555-0105', 'Phoenix', 'AZ');
```

### 3. Orders Table
```sql
CREATE TABLE orders (
    id SERIAL PRIMARY KEY,
    customer_id INTEGER REFERENCES customers(id),
    order_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    total_amount DECIMAL(10,2) NOT NULL,
    status VARCHAR(50) DEFAULT 'pending',
    shipping_address TEXT,
    payment_method VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Sample data
INSERT INTO orders (customer_id, total_amount, status, payment_method) VALUES
(1, 229.98, 'completed', 'Credit Card'),
(2, 299.99, 'completed', 'PayPal'),
(3, 119.98, 'processing', 'Credit Card'),
(1, 49.99, 'shipped', 'Debit Card'),
(4, 89.99, 'pending', 'Credit Card');
```

### 4. Order Items Table
```sql
CREATE TABLE order_items (
    id SERIAL PRIMARY KEY,
    order_id INTEGER REFERENCES orders(id),
    product_id INTEGER REFERENCES products(id),
    quantity INTEGER NOT NULL,
    unit_price DECIMAL(10,2) NOT NULL,
    total_price DECIMAL(10,2) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Sample data
INSERT INTO order_items (order_id, product_id, quantity, unit_price, total_price) VALUES
(1, 1, 1, 199.99, 199.99),
(1, 5, 1, 49.99, 49.99),
(2, 2, 1, 299.99, 299.99),
(3, 3, 1, 89.99, 89.99),
(3, 4, 1, 29.99, 29.99),
(4, 5, 1, 49.99, 49.99),
(5, 3, 1, 89.99, 89.99);
```

### 5. Categories Table (Optional - for advanced categorization)
```sql
CREATE TABLE categories (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    parent_id INTEGER REFERENCES categories(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Sample data
INSERT INTO categories (name, description) VALUES
('Electronics', 'Electronic devices and accessories'),
('Appliances', 'Home appliances'),
('Sports & Fitness', 'Sports equipment and fitness gear'),
('Home & Office', 'Home and office supplies');
```

## GUI Configuration Storage

The app can store GUI configurations in the database using a settings table:

```sql
CREATE TABLE app_settings (
    id SERIAL PRIMARY KEY,
    setting_key VARCHAR(255) UNIQUE NOT NULL,
    setting_value JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Store dashboard layout
INSERT INTO app_settings (setting_key, setting_value) VALUES
('dashboard_layout', '{
  "widgets": [
    {"type": "metric", "position": {"x": 0, "y": 0, "w": 6, "h": 2}, "config": {"metric": "total_sales"}},
    {"type": "chart", "position": {"x": 6, "y": 0, "w": 6, "h": 4}, "config": {"chart_type": "line", "data_source": "orders"}}
  ]
}');

-- Store theme settings
INSERT INTO app_settings (setting_key, setting_value) VALUES
('theme_config', '{
  "primary_color": "#3498db",
  "secondary_color": "#2ecc71",
  "font_family": "Arial, sans-serif"
}');
```

## Setup Instructions

1. Connect to your PostgreSQL database
2. Run the SQL scripts above in order
3. The E-Commerce Store app will automatically detect and work with these tables
4. Customize the app components as needed

## Features Included

- **Dashboard**: Overview of store metrics and performance
- **Products Management**: CRUD operations for products
- **Orders Management**: View and manage customer orders
- **Customer Management**: Customer data and history
- **Sales Analytics**: Charts and graphs for sales data
- **Revenue Analytics**: Category-based revenue breakdown

This setup provides a complete e-commerce foundation that can be extended with additional features like inventory management, shipping, payments, etc.