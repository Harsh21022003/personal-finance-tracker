
1. Project Title
Personal Finance Tracker Web Application

2. Project Description
The Personal Finance Tracker is a full-stack web application designed to help users manage their income, expenses, and budgets efficiently.
It provides real-time insights through summaries, budget tracking, and interactive charts, enabling better financial decision-making.

3. Objectives
•	Track daily income and expenses
•	Set category-wise budgets
•	Visualize spending patterns
•	Ensure secure, user-specific data handling

4. Key Features
•	User Registration & Login (JWT Authentication)
•	Secure password hashing (bcrypt)
•	Income & Expense management
•	Category-wise budget setting
•	Budget vs Spent analysis
•	Expense distribution charts
•	Transaction history
•	Multi-user data isolation


5. Tech Stack
Frontend
•	HTML5
•	CSS3
•	JavaScript (Vanilla JS)
•	Chart.js
Backend
•	Node.js
•	Express.js
•	JWT Authentication
•	bcrypt
Database
•	MySQL

6. Database Design
Tables Used
•	users – stores user credentials
•	transactions – stores income & expenses
•	budgets – stores category-wise budgets
•	income_sources – stores recurring income sources
Relational integrity is maintained using foreign keys and unique constraints.

7. Application Workflow
1.	User registers/logs in
2.	JWT token is generated
3.	User accesses dashboard
4.	Income/expense/budget data is stored in MySQL
5.	Backend processes data
6.	Charts and summaries are displayed

8. Flow Diagram
User
↓
Login / Register
↓
JWT Authentication
↓
Dashboard
↓
Add Income / Expense / Budget
↓
MySQL Database
↓
Backend Processing
↓
Charts & Budget Insights
 
                                                                             
       
9. Security Considerations
•	Password hashing using bcrypt
•	JWT-based authentication
•	User-specific data access using user_id
•	Foreign key constraints with cascading deletes


10. Conclusion
This project demonstrates strong understanding of:
•	Full-stack web development
•	RESTful API design
•	Secure authentication
•	Relational database modeling
•	Data visualization
11.Future Works
--Coming soon...


