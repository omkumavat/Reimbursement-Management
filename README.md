# 💼 Reimbursement Management System (MERN)

A full-stack MERN application to manage employee expense reimbursements with multi-level approvals, role-based access, and smart automation.

---

## 🚀 Features

### 🔐 Authentication & User Management
- Secure login/signup system
- Auto-creation of company and admin on signup
- Role-based access:
  - Admin
  - Manager
  - Employee
- Admin can:
  - Create users
  - Assign roles
  - Define reporting hierarchy

---

### 💸 Expense Management
- Employees can:
  - Submit expenses (amount, category, date, description)
  - Upload receipts (OCR supported)
  - Track status (Approved / Rejected)
- Supports multi-currency expenses

---

### ✅ Approval Workflow
- Multi-level approval system
- Configurable approval sequence (Manager → Finance → Director)
- Managers/Admin can:
  - Approve / Reject expenses
  - Add comments

---

### ⚙️ Conditional Approval Rules
- Percentage-based approval (e.g., 60% approvals)
- Specific approver rule (e.g., CFO auto-approval)
- Hybrid rules (combination of both)

---

### 📊 Role Permissions

| Role     | Permissions |
|----------|------------|
| Admin    | Manage users, configure workflows, view all expenses |
| Manager  | Approve/reject expenses, view team expenses |
| Employee | Submit and track expenses |

---

### 🔍 Additional Features
- OCR for automatic receipt data extraction
- Currency conversion using external APIs
- Real-time status updates

---

## 🛠️ Tech Stack

### Frontend
- React.js
- Axios
- Tailwind CSS / CSS

### Backend
- Node.js
- Express.js

### Database
- MongoDB

### Other Tools
- OCR integration
- Currency API (Exchange Rate API)

---
