# E-Commerce Database Schema Example

This example shows SQL queries for setting up and managing an e-commerce database.

## Setup Tables

```sql
-- Create products table
CREATE TABLE products (
    product_id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    price DECIMAL(10, 2) NOT NULL,
    stock INTEGER NOT NULL DEFAULT 0,
    category VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create customers table
CREATE TABLE customers (
    customer_id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    phone VARCHAR(20),
    address TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create orders table
CREATE TABLE orders (
    order_id SERIAL PRIMARY KEY,
    customer_id INTEGER REFERENCES customers(customer_id),
    total_amount DECIMAL(10, 2) NOT NULL,
    status VARCHAR(50) DEFAULT 'pending',
    order_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    shipped_date TIMESTAMP,
    delivered_date TIMESTAMP
);

-- Create order_items table
CREATE TABLE order_items (
    item_id SERIAL PRIMARY KEY,
    order_id INTEGER REFERENCES orders(order_id),
    product_id INTEGER REFERENCES products(product_id),
    quantity INTEGER NOT NULL,
    price DECIMAL(10, 2) NOT NULL
);
```

## Sample Queries

```sql
-- View all products in stock
SELECT * FROM products WHERE stock > 0 ORDER BY name;

-- View products by category
SELECT * FROM products WHERE category = 'Electronics' ORDER BY price;

-- Add a new product
INSERT INTO products (name, description, price, stock, category)
VALUES ('Laptop', 'High-performance laptop', 999.99, 50, 'Electronics');

-- Update product stock
UPDATE products SET stock = stock - 1 WHERE product_id = 1;

-- View customer orders
SELECT 
    o.order_id, 
    o.order_date, 
    o.total_amount, 
    o.status,
    c.name as customer_name,
    c.email
FROM orders o
JOIN customers c ON o.customer_id = c.customer_id
ORDER BY o.order_date DESC;

-- View order details with products
SELECT 
    o.order_id,
    c.name as customer_name,
    p.name as product_name,
    oi.quantity,
    oi.price,
    (oi.quantity * oi.price) as item_total
FROM orders o
JOIN customers c ON o.customer_id = c.customer_id
JOIN order_items oi ON o.order_id = oi.order_id
JOIN products p ON oi.product_id = p.product_id
WHERE o.order_id = 1;

-- Update order status
UPDATE orders 
SET status = 'shipped', shipped_date = CURRENT_TIMESTAMP 
WHERE order_id = 1;

-- View top selling products
SELECT 
    p.name,
    SUM(oi.quantity) as total_sold,
    SUM(oi.quantity * oi.price) as revenue
FROM order_items oi
JOIN products p ON oi.product_id = p.product_id
GROUP BY p.product_id, p.name
ORDER BY total_sold DESC
LIMIT 10;

-- View low stock products
SELECT name, stock, category 
FROM products 
WHERE stock < 10 
ORDER BY stock ASC;
```

## Database Configuration Example

When adding this database in the UI, use:

- **Database Name**: E-Commerce DB
- **Host**: localhost (or your database host)
- **Port**: 5432
- **Database**: ecommerce_db
- **Username**: your_username
- **Password**: your_password
- **SSL**: Check if required
