# Asset Management System (Server-Side)

The server-side of the **Asset Management System** is responsible for handling data storage, API endpoints, authentication, and communication with the client-side. This system supports both employees and HR managers in managing assets, tracking requests, and ensuring efficient workflows.

---

## Live Site URL
**Client-Side Live URL:** [Insert Client-Side Live URL Here]

---

## Admin Credentials
- **Admin Username:** 
- **Admin Password:** 

---

## Features
1. **Secure Authentication System**:
   - Login and Registration for Employees and HR Managers.
   - JWT-based authentication for enhanced security.
   - Social login integration (e.g., Google).

2. **Asset Management**:
   - CRUD operations for assets by HR managers.
   - Returnable and Non-returnable asset classification.
   - Search, filter, and sort options for assets.

3. **User Management**:
   - HR Managers can add, remove, and manage employees.
   - Employees can join teams and request assets.

4. **Request Handling**:
   - Employees can submit, track, and manage asset requests.
   - HR Managers can approve, reject, or view pending requests.

5. **Responsive Dashboard**:
   - Comprehensive dashboard for HR Managers and Employees.
   - Data visualization with charts (e.g., Pie charts for asset usage).

6. **Payment Integration**:
   - Payment gateway for HR subscription plans.
   - Packages for managing team size (5, 10, or 20 members).

7. **Efficient Data Fetching**:
   - TanStack Query used for optimized data fetching.
   - Server-side filtering, searching, and pagination for efficiency.

8. **Notifications**:
   - SweetAlert/Toast notifications for CRUD operations and authentication feedback.

9. **Environment Variables**:
   - Firebase config keys and MongoDB credentials securely stored using `.env`.

10. **Printing Functionality**:
    - Generate PDF reports for approved assets using React-PDF.

---

## API Endpoints

### Authentication
- **POST /api/auth/register**: Register a new user (HR Manager or Employee).
- **POST /api/auth/login**: Login and receive JWT token.
- **POST /api/auth/social-login**: Social login (e.g., Google).

### Assets
- **GET /api/assets**: Fetch all assets (with search, filter, and pagination).
- **POST /api/assets**: Add a new asset (HR Manager only).
- **PATCH /api/assets/:id**: Update an existing asset (HR Manager only).
- **DELETE /api/assets/:id**: Delete an asset (HR Manager only).

### Requests
- **GET /api/requests**: Fetch all requests (with filters).
- **POST /api/requests**: Submit a new asset request.
- **PATCH /api/requests/:id**: Approve/Reject asset requests (HR Manager only).

### Employees
- **GET /api/employees**: Fetch all employees (HR Manager only).
- **POST /api/employees**: Add an employee to the team.
- **DELETE /api/employees/:id**: Remove an employee from the team.

### Payments
- **POST /api/payments**: Process payment for subscription plans.

---

## Installation and Setup

### Prerequisites
- Node.js
- MongoDB
- Firebase project (for authentication)
- Payment gateway API (e.g., Stripe)

### Steps to Run the Server
1. Clone the repository:
   ```bash
   git clone https://github.com/Programming-Hero-Web-Course4/b10a12-server-side-SHARIFA-AKHTER
   cd server