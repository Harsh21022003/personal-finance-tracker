# Personal Finance Tracker

A comprehensive personal finance tracking application built with HTML, CSS, JavaScript, Node.js, Express, and MySQL. This application helps users manage their expenses, income, and budgets effectively.

## Features

### ✅ User Registration and Authentication
- User registration with email and password
- Secure login with JWT authentication
- Password hashing using bcrypt
- Email verification support (token-based)

### ✅ Expense Tracking
- Record daily expenses with amount, category, description, and date
- Categorize expenses for better organization
- View all expenses in transaction history

### ✅ Income Management
- Add income sources (salary, bonuses, freelance, etc.)
- Set income frequency (daily, weekly, biweekly, monthly, yearly)
- Track recurring income entries
- Manage multiple income sources

### ✅ Budget Setting and Tracking
- Set monthly budgets for different expense categories
- Visual progress bars showing spending vs. budget
- Budget vs. Spent bar chart
- Color-coded progress indicators (green/yellow/red)

### ✅ Transaction History
- View all transactions sorted by date
- Filter by type (income/expense), category, date range
- Search transactions by description or category
- Edit and delete transactions
- Responsive transaction list

### ✅ Visual Analytics
- Expense distribution pie chart
- Budget vs. Spent comparison bar chart
- Summary cards showing total income, expenses, and balance

## Technology Stack

- **Frontend**: HTML5, CSS3, JavaScript (ES6+)
- **Backend**: Node.js, Express.js
- **Database**: MySQL
- **Authentication**: JWT (JSON Web Tokens)
- **Password Security**: bcrypt
- **Charts**: Chart.js

## Prerequisites

- Node.js (v14 or higher)
- MySQL Server (v5.7 or higher)
- npm (Node Package Manager)

## Installation

### 1. Clone or Download the Project

```bash
cd personal-finance-tracker
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Set Up MySQL Database

1. Open MySQL command line or MySQL Workbench
2. Run the schema file to create the database and tables:

```bash
mysql -u root -p < schema.sql
```

Or manually execute the SQL commands in `schema.sql`:
- Creates `finance_app` database
- Creates `users` table
- Creates `transactions` table
- Creates `budgets` table
- Creates `income_sources` table

### 4. Configure Database Connection

Edit `db.js` and update the MySQL connection details:

```javascript
const db = mysql.createConnection({
  host: "localhost",
  user: "root",           // Your MySQL username
  password: "YOUR_PASSWORD", // Your MySQL password
  database: "finance_app"
});
```

### 5. Start the Server

```bash
node server.js
```

The server will start on `http://localhost:5000`

### 6. Open the Application

Open your browser and navigate to:
```
http://localhost:5000
```

## Usage

### Registration
1. Enter your email and password
2. Click "Register"
3. Note the verification token (for testing purposes)
4. You can verify your email using the `/verify-email` endpoint

### Login
1. Enter your registered email and password
2. Click "Login"
3. You'll be redirected to the dashboard

### Adding Transactions
1. Go to Dashboard
2. Fill in the transaction form:
   - Amount (required)
   - Type (Income/Expense)
   - Category (required)
   - Description (optional)
   - Date (required)
3. Click "Save Transaction"

### Setting Budgets
1. Go to Dashboard
2. Scroll to "Set Budget" section
3. Enter category and amount
4. Click "Save Budget"
5. View progress in "Budget Progress" section

### Managing Income Sources
1. Go to Dashboard
2. Scroll to "Income Sources" section
3. Fill in:
   - Source Name
   - Amount
   - Frequency (daily/weekly/monthly/etc.)
   - Next Date
4. Click "Add Income Source"

### Viewing Transaction History
1. Click "View Transaction History" from Dashboard
2. Use filters to search:
   - Filter by type (Income/Expense)
   - Filter by category
   - Filter by date range
   - Search by description or category
3. Edit or delete transactions as needed

## API Endpoints

### Authentication
- `POST /register` - Register a new user
- `POST /login` - Login user
- `POST /verify-email` - Verify email with token

### Transactions
- `POST /transaction` - Add a transaction (requires auth)
- `GET /transactions` - Get all transactions (requires auth)
  - Query params: `type`, `category`, `startDate`, `endDate`, `search`
- `PUT /transaction/:id` - Update a transaction (requires auth)
- `DELETE /transaction/:id` - Delete a transaction (requires auth)

### Budgets
- `POST /budget` - Set/update budget (requires auth)
- `GET /budgets` - Get all budgets (requires auth)
- `GET /budget-progress` - Get budget progress (requires auth)

### Income Sources
- `POST /income-source` - Add income source (requires auth)
- `GET /income-sources` - Get all income sources (requires auth)
- `PUT /income-source/:id` - Update income source (requires auth)
- `DELETE /income-source/:id` - Delete income source (requires auth)

### Summary & Analytics
- `GET /summary` - Get income/expense summary (requires auth)
- `GET /chart-data` - Get expense chart data (requires auth)

## Project Structure

```
personal-finance-tracker/
├── db.js                 # MySQL database connection
├── server.js             # Express server and API routes
├── schema.sql            # Database schema
├── package.json          # Node.js dependencies
├── README.md             # This file
└── public/              # Frontend files
    ├── index.html        # Login/Register page
    ├── dashboard.html    # Main dashboard
    ├── history.html      # Transaction history page
    ├── app.js           # Frontend JavaScript
    └── style.css        # Stylesheet
```

## Security Features

- Password hashing with bcrypt (10 salt rounds)
- JWT-based authentication
- SQL injection prevention using parameterized queries
- Email verification support
- Protected routes with authentication middleware

## Browser Compatibility

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

## Troubleshooting

### Database Connection Error
- Ensure MySQL server is running
- Verify database credentials in `db.js`
- Check if database `finance_app` exists

### Port Already in Use
- Change port in `server.js` (line 153)
- Update API URL in `public/app.js` (line 5)

### Charts Not Displaying
- Check browser console for errors
- Ensure Chart.js CDN is loading
- Verify transaction data exists

## Future Enhancements

- Email service integration for verification
- Recurring transaction automation
- Export data to CSV/PDF
- Mobile app version
- Multi-currency support
- Financial goals tracking
- Category-wise reports

## License

This project is open source and available for educational purposes.

## Support

For issues or questions, please check the code comments or refer to the API documentation above.
