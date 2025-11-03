# PostaDesk

A configurable PostgreSQL database system with a user-friendly frontend. Users can add and configure databases via UI, with credentials securely stored on the device. The system allows full data interaction—viewing, editing, querying—and is easily adaptable for projects like e-commerce, e-learning, or task management.

## Features

- ✅ **Database Configuration Management**: Add, update, and delete PostgreSQL database connections via UI
- ✅ **Secure Credential Storage**: Database credentials are encrypted and stored locally on the device
- ✅ **Connection Testing**: Test database connections before saving
- ✅ **Data Viewing**: Browse tables, view schema, and explore data with pagination
- ✅ **Query Editor**: Execute custom SQL queries (SELECT, INSERT, UPDATE, DELETE)
- ✅ **Data Management**: View, add, update, and delete records through the UI
- ✅ **App Builder**: Create custom applications with drag-and-drop components
- ✅ **Dedicated App Routes**: Each app has its own URL for direct access
- ✅ **Multi-Tab App Management**: Open multiple apps in tabs or separate browser windows
- ✅ **Component Library**: Pre-built components (Dashboard, Data View, Forms, Charts)
- ✅ **Responsive Design**: Clean, modern interface that works on desktop and mobile
- ✅ **Security**: SQL injection protection, encrypted passwords, parameterized queries

## App Builder Features

The system includes a powerful app builder that allows you to create custom applications:

### App Management
- **Create Apps**: Build custom applications linked to your databases
- **Authentication Control**: Choose whether to enable user authentication for each app
- **Component System**: Add pre-built components like dashboards, data views, forms, and charts
- **Dedicated URLs**: Each app gets its own route (e.g., `/app/app-id`) for direct access
- **Multi-Tab Interface**: Open multiple apps in tabs within the dashboard
- **Browser Tabs**: Open apps in separate browser windows/tabs for multitasking

### Available Components
- **Dashboard**: Overview widgets with statistics and metrics
- **Data View**: Browse and manage database tables with pagination
- **Form View**: Create forms for data entry linked to database tables
- **Chart View**: Visualize data with bar, line, and pie charts

### Example Applications
- **E-Commerce Store**: Complete online store with products, orders, customers, and analytics
- **E-Learning Platform**: Course management, student tracking, and progress analytics
- **Task Management**: Project tracking, team collaboration, and productivity metrics

See `examples/ecommerce-setup.md` for a complete e-commerce implementation example.

## Technology Stack

### Backend
- **Node.js** with Express
- **PostgreSQL** (`pg` driver)
- **Crypto-JS** for encryption
- **CORS** enabled for frontend communication

### Frontend
- **React** with Vite
- **Axios** for API calls
- **Modern CSS** with responsive design

## Installation

### Prerequisites
- Node.js (v14 or higher)
- PostgreSQL database (local or remote)

### Setup

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd postadesk
   ```

2. **Install backend dependencies**
   ```bash
   npm install
   ```

3. **Install frontend dependencies**
   ```bash
   cd client
   npm install
   cd ..
   ```

4. **Configure environment variables**
   ```bash
   cp .env.example .env
   ```
   
   Edit `.env` and set your encryption key:
   ```
   PORT=5000
   ENCRYPTION_KEY=your-secret-encryption-key-change-this
   ```

5. **Start the application**

   In one terminal, start the backend:
   ```bash
   npm start
   ```

   In another terminal, start the frontend:
   ```bash
   cd client
   npm run dev
   ```

6. **Access the application**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:5000

## Usage

### Adding a Database

1. Click "Add New Database" button
2. Fill in the database connection details:
   - **Database Name**: A friendly name for your connection
   - **Host**: Database server address (e.g., localhost)
   - **Port**: Database port (default: 5432)
   - **Database**: PostgreSQL database name
   - **Username**: Database user
   - **Password**: Database password
   - **SSL**: Enable if your database requires SSL
3. Click "Add Database" - the system will test the connection before saving
4. Credentials are encrypted and stored locally in the `data/` directory

### Viewing Data

1. Select a database from the list
2. Click the "View Data" tab
3. Browse available tables
4. Click on a table to view its schema and data
5. Use pagination controls to navigate large datasets

### Running Queries

1. Select a database from the list
2. Click the "Query Editor" tab
3. Write your SQL query (SELECT, INSERT, UPDATE, or DELETE)
4. Click "Execute Query"
5. View results in a formatted table

### Managing Databases

- **Test Connection**: Click "Test" on any database card to verify connectivity
- **Delete Database**: Click "Delete" to remove a database configuration
- **Select Database**: Click on a database card to work with it

## Example Use Cases

### E-Commerce Platform
```sql
-- View products
SELECT * FROM products WHERE stock > 0 ORDER BY price;

-- Update inventory
UPDATE products SET stock = stock - 1 WHERE product_id = 123;

-- View orders
SELECT o.*, c.name FROM orders o JOIN customers c ON o.customer_id = c.id;
```

### E-Learning Platform
```sql
-- View courses
SELECT * FROM courses WHERE published = true;

-- Track student progress
SELECT s.name, c.title, e.progress 
FROM enrollments e 
JOIN students s ON e.student_id = s.id
JOIN courses c ON e.course_id = c.id;

-- Add new enrollment
INSERT INTO enrollments (student_id, course_id, enrolled_at) 
VALUES (1, 5, NOW());
```

### Task Management
```sql
-- View tasks by status
SELECT * FROM tasks WHERE status = 'pending' ORDER BY priority DESC;

-- Update task status
UPDATE tasks SET status = 'completed', completed_at = NOW() 
WHERE task_id = 42;

-- View team tasks
SELECT t.*, u.name as assigned_to 
FROM tasks t 
LEFT JOIN users u ON t.assigned_user_id = u.id;
```

## API Documentation

### Database Endpoints

- `GET /api/databases` - Get all database configurations
- `GET /api/databases/:id` - Get specific database
- `POST /api/databases` - Add new database
- `PUT /api/databases/:id` - Update database
- `DELETE /api/databases/:id` - Delete database
- `POST /api/databases/:id/test` - Test connection

### Data Endpoints

- `GET /api/data/:dbId/tables` - Get all tables
- `GET /api/data/:dbId/tables/:tableName/schema` - Get table schema
- `GET /api/data/:dbId/tables/:tableName/data` - Get table data
- `POST /api/data/:dbId/query` - Execute custom query
- `POST /api/data/:dbId/tables/:tableName/rows` - Insert row
- `PUT /api/data/:dbId/tables/:tableName/rows` - Update row
- `DELETE /api/data/:dbId/tables/:tableName/rows` - Delete row

## Security Features

1. **Optional User Authentication**: Apps can be created with or without user authentication
2. **Encrypted Credentials**: All database passwords are encrypted using AES encryption before storage
3. **SQL Injection Protection**: Parameterized queries and input validation
4. **Limited Query Types**: Only SELECT, INSERT, UPDATE, and DELETE queries allowed
5. **Local Storage**: Credentials stored locally on device, never sent to external servers
6. **Connection Validation**: Connections tested before saving

## Project Structure

```
postadesk/
├── server/
│   ├── index.js              # Express server
│   ├── routes/
│   │   ├── database.js       # Database config routes
│   │   └── data.js           # Data management routes
│   └── utils/
│       ├── encryption.js     # Encryption utilities
│       ├── storage.js        # File-based storage
│       └── database.js       # PostgreSQL utilities
├── client/
│   ├── src/
│   │   ├── components/       # React components
│   │   │   ├── DatabaseForm.jsx
│   │   │   ├── DatabaseList.jsx
│   │   │   ├── DataViewer.jsx
│   │   │   └── QueryEditor.jsx
│   │   ├── pages/
│   │   │   └── Home.jsx
│   │   ├── services/
│   │   │   └── api.js        # API client
│   │   ├── App.jsx
│   │   ├── main.jsx
│   │   └── index.css
│   └── vite.config.js
├── data/                     # Database configs (created at runtime)
├── package.json
└── README.md
```

## Development

### Running in Development Mode

Backend with auto-restart:
```bash
npm run dev
```

Frontend with hot reload:
```bash
cd client
npm run dev
```

### Building for Production

Build frontend:
```bash
cd client
npm run build
```

The built files will be in `client/dist/`

## Troubleshooting

### Connection Issues
- Verify PostgreSQL is running
- Check firewall settings
- Ensure correct host, port, and credentials
- For remote databases, verify SSL settings

### Installation Issues
- Clear node_modules and reinstall: `rm -rf node_modules && npm install`
- Check Node.js version: `node --version` (should be v14+)

### Data Not Loading
- Check browser console for errors
- Verify backend is running on port 5000
- Test database connection using the "Test" button

## Contributing

Contributions are welcome! Please feel free to submit pull requests or open issues for bugs and feature requests.

## License

ISC

## Support

For questions or issues, please open an issue on the GitHub repository.
