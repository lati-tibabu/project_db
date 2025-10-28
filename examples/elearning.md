# E-Learning Database Schema Example

This example shows SQL queries for setting up and managing an e-learning platform database.

## Setup Tables

```sql
-- Create courses table
CREATE TABLE courses (
    course_id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    instructor_name VARCHAR(255),
    duration_hours INTEGER,
    published BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create students table
CREATE TABLE students (
    student_id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    enrollment_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    status VARCHAR(50) DEFAULT 'active'
);

-- Create enrollments table
CREATE TABLE enrollments (
    enrollment_id SERIAL PRIMARY KEY,
    student_id INTEGER REFERENCES students(student_id),
    course_id INTEGER REFERENCES courses(course_id),
    enrolled_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    progress INTEGER DEFAULT 0,
    completed BOOLEAN DEFAULT false,
    completion_date TIMESTAMP,
    UNIQUE(student_id, course_id)
);

-- Create lessons table
CREATE TABLE lessons (
    lesson_id SERIAL PRIMARY KEY,
    course_id INTEGER REFERENCES courses(course_id),
    title VARCHAR(255) NOT NULL,
    content TEXT,
    video_url VARCHAR(500),
    order_index INTEGER,
    duration_minutes INTEGER
);

-- Create quiz_results table
CREATE TABLE quiz_results (
    result_id SERIAL PRIMARY KEY,
    student_id INTEGER REFERENCES students(student_id),
    lesson_id INTEGER REFERENCES lessons(lesson_id),
    score INTEGER,
    max_score INTEGER,
    completed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

## Sample Queries

```sql
-- View all published courses
SELECT * FROM courses WHERE published = true ORDER BY title;

-- Add a new course
INSERT INTO courses (title, description, instructor_name, duration_hours, published)
VALUES ('Web Development Fundamentals', 'Learn HTML, CSS, and JavaScript', 'John Doe', 40, true);

-- Enroll a student in a course
INSERT INTO enrollments (student_id, course_id)
VALUES (1, 5);

-- View student enrollments with course details
SELECT 
    s.name as student_name,
    c.title as course_title,
    e.enrolled_at,
    e.progress,
    e.completed
FROM enrollments e
JOIN students s ON e.student_id = s.student_id
JOIN courses c ON e.course_id = c.course_id
WHERE s.student_id = 1
ORDER BY e.enrolled_at DESC;

-- Update student progress
UPDATE enrollments 
SET progress = 75 
WHERE student_id = 1 AND course_id = 5;

-- Mark course as completed
UPDATE enrollments 
SET completed = true, completion_date = CURRENT_TIMESTAMP, progress = 100
WHERE enrollment_id = 1;

-- View course lessons
SELECT lesson_id, title, duration_minutes, order_index
FROM lessons
WHERE course_id = 5
ORDER BY order_index;

-- View student quiz performance
SELECT 
    s.name as student_name,
    l.title as lesson_title,
    qr.score,
    qr.max_score,
    ROUND((qr.score::DECIMAL / qr.max_score * 100), 2) as percentage,
    qr.completed_at
FROM quiz_results qr
JOIN students s ON qr.student_id = s.student_id
JOIN lessons l ON qr.lesson_id = l.lesson_id
WHERE s.student_id = 1
ORDER BY qr.completed_at DESC;

-- View course enrollment statistics
SELECT 
    c.title,
    COUNT(e.enrollment_id) as total_enrollments,
    COUNT(CASE WHEN e.completed = true THEN 1 END) as completions,
    ROUND(AVG(e.progress), 2) as avg_progress
FROM courses c
LEFT JOIN enrollments e ON c.course_id = e.course_id
GROUP BY c.course_id, c.title
ORDER BY total_enrollments DESC;

-- View top performing students
SELECT 
    s.name,
    COUNT(e.enrollment_id) as courses_enrolled,
    COUNT(CASE WHEN e.completed = true THEN 1 END) as courses_completed,
    ROUND(AVG(e.progress), 2) as avg_progress
FROM students s
LEFT JOIN enrollments e ON s.student_id = e.student_id
GROUP BY s.student_id, s.name
ORDER BY courses_completed DESC, avg_progress DESC
LIMIT 10;
```

## Database Configuration Example

When adding this database in the UI, use:

- **Database Name**: E-Learning Platform
- **Host**: localhost (or your database host)
- **Port**: 5432
- **Database**: elearning_db
- **Username**: your_username
- **Password**: your_password
- **SSL**: Check if required
