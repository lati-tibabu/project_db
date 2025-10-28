# Task Management Database Schema Example

This example shows SQL queries for setting up and managing a task management system database.

## Setup Tables

```sql
-- Create users table
CREATE TABLE users (
    user_id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    role VARCHAR(50) DEFAULT 'member',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create projects table
CREATE TABLE projects (
    project_id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    owner_id INTEGER REFERENCES users(user_id),
    status VARCHAR(50) DEFAULT 'active',
    start_date DATE,
    end_date DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create tasks table
CREATE TABLE tasks (
    task_id SERIAL PRIMARY KEY,
    project_id INTEGER REFERENCES projects(project_id),
    title VARCHAR(255) NOT NULL,
    description TEXT,
    assigned_user_id INTEGER REFERENCES users(user_id),
    status VARCHAR(50) DEFAULT 'pending',
    priority VARCHAR(20) DEFAULT 'medium',
    due_date DATE,
    completed_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create comments table
CREATE TABLE comments (
    comment_id SERIAL PRIMARY KEY,
    task_id INTEGER REFERENCES tasks(task_id),
    user_id INTEGER REFERENCES users(user_id),
    content TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create tags table
CREATE TABLE tags (
    tag_id SERIAL PRIMARY KEY,
    name VARCHAR(50) UNIQUE NOT NULL,
    color VARCHAR(7)
);

-- Create task_tags junction table
CREATE TABLE task_tags (
    task_id INTEGER REFERENCES tasks(task_id),
    tag_id INTEGER REFERENCES tags(tag_id),
    PRIMARY KEY (task_id, tag_id)
);
```

## Sample Queries

```sql
-- View all pending tasks ordered by priority
SELECT * FROM tasks 
WHERE status = 'pending' 
ORDER BY 
    CASE priority 
        WHEN 'high' THEN 1
        WHEN 'medium' THEN 2
        WHEN 'low' THEN 3
    END,
    due_date ASC;

-- Add a new task
INSERT INTO tasks (project_id, title, description, assigned_user_id, priority, due_date, status)
VALUES (1, 'Design homepage', 'Create wireframes and mockups', 3, 'high', '2024-02-01', 'pending');

-- Update task status
UPDATE tasks 
SET status = 'in_progress', updated_at = CURRENT_TIMESTAMP 
WHERE task_id = 1;

-- Complete a task
UPDATE tasks 
SET status = 'completed', completed_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP 
WHERE task_id = 1;

-- View tasks assigned to a specific user
SELECT 
    t.*,
    p.name as project_name,
    u.name as assigned_to
FROM tasks t
JOIN projects p ON t.project_id = p.project_id
JOIN users u ON t.assigned_user_id = u.user_id
WHERE u.user_id = 3
ORDER BY t.due_date;

-- View project tasks with assignees
SELECT 
    t.task_id,
    t.title,
    t.status,
    t.priority,
    t.due_date,
    u.name as assigned_to,
    p.name as project_name
FROM tasks t
LEFT JOIN users u ON t.assigned_user_id = u.user_id
JOIN projects p ON t.project_id = p.project_id
WHERE p.project_id = 1
ORDER BY t.created_at DESC;

-- View overdue tasks
SELECT 
    t.*,
    u.name as assigned_to,
    p.name as project_name
FROM tasks t
LEFT JOIN users u ON t.assigned_user_id = u.user_id
JOIN projects p ON t.project_id = p.project_id
WHERE t.status != 'completed' 
    AND t.due_date < CURRENT_DATE
ORDER BY t.due_date;

-- Add comment to a task
INSERT INTO comments (task_id, user_id, content)
VALUES (1, 2, 'This looks great! Just a few minor changes needed.');

-- View task comments
SELECT 
    c.content,
    u.name as author,
    c.created_at
FROM comments c
JOIN users u ON c.user_id = u.user_id
WHERE c.task_id = 1
ORDER BY c.created_at DESC;

-- View project statistics
SELECT 
    p.name,
    COUNT(t.task_id) as total_tasks,
    COUNT(CASE WHEN t.status = 'completed' THEN 1 END) as completed_tasks,
    COUNT(CASE WHEN t.status = 'pending' THEN 1 END) as pending_tasks,
    COUNT(CASE WHEN t.status = 'in_progress' THEN 1 END) as in_progress_tasks,
    COUNT(CASE WHEN t.due_date < CURRENT_DATE AND t.status != 'completed' THEN 1 END) as overdue_tasks
FROM projects p
LEFT JOIN tasks t ON p.project_id = t.project_id
GROUP BY p.project_id, p.name;

-- View user workload
SELECT 
    u.name,
    COUNT(t.task_id) as assigned_tasks,
    COUNT(CASE WHEN t.status = 'completed' THEN 1 END) as completed,
    COUNT(CASE WHEN t.status = 'pending' THEN 1 END) as pending,
    COUNT(CASE WHEN t.status = 'in_progress' THEN 1 END) as in_progress
FROM users u
LEFT JOIN tasks t ON u.user_id = t.assigned_user_id
GROUP BY u.user_id, u.name
ORDER BY assigned_tasks DESC;

-- Add tags to tasks
INSERT INTO tags (name, color) VALUES ('frontend', '#3498db'), ('backend', '#e74c3c');
INSERT INTO task_tags (task_id, tag_id) VALUES (1, 1);

-- View tasks with tags
SELECT 
    t.title,
    t.status,
    t.priority,
    STRING_AGG(tg.name, ', ') as tags
FROM tasks t
LEFT JOIN task_tags tt ON t.task_id = tt.task_id
LEFT JOIN tags tg ON tt.tag_id = tg.tag_id
GROUP BY t.task_id, t.title, t.status, t.priority
ORDER BY t.created_at DESC;
```

## Database Configuration Example

When adding this database in the UI, use:

- **Database Name**: Task Manager
- **Host**: localhost (or your database host)
- **Port**: 5432
- **Database**: taskmanager_db
- **Username**: your_username
- **Password**: your_password
- **SSL**: Check if required
