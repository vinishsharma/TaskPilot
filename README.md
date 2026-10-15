# TaskPilot &mdash; Employee &amp; Task Management System

A full-stack **MERN** (MongoDB, Express, React, Node.js) web application built to manage employees, assign tasks to them, and view real-time company workloads on a clean dashboard.

All core business rules (assignment rules, capacity limits, status flows, and deletion safety) are strictly checked and enforced on the backend.

---

## Table of Contents
1. [Tech Stack](#1-tech-stack)
2. [Project Structure](#2-project-structure)
3. [Environment Setup & Running Locally](#3-environment-setup--running-locally)
4. [API Endpoints](#4-api-endpoints)
5. [Database Design & Employee ➔ Task Relationship](#5-database-design--employee--task-relationship)
6. [How Employee Deletion is Handled](#6-how-employee-deletion-is-handled)
7. [Assumptions Made](#7-assumptions-made)
8. [Answers to Assessment Questions](#8-answers-to-assessment-questions)

---

## 1. Tech Stack

### Backend
- **Node.js & Express.js**: Used to build the REST API with ES Modules and clean arrow functions.
- **MongoDB & Mongoose**: Used for storing data with schemas, compound indexes, and aggregation queries.
- **Zod**: Used for validating incoming request data and returning clear error messages.
- **CORS**: Configured so the frontend on local and Vercel can talk to the backend without issues.
- **Dotenv**: Used to read environment variables from `.env`.

### Frontend
- **React 18 & Vite**: Used for building a fast, responsive user interface.
- **React Router DOM**: Used for routing between pages (Dashboard, Employee pages, Task pages).
- **Tailwind CSS**: Used for simple, clean styling that looks good on mobile, tablet, and desktop.
- **Axios**: Used to make HTTP requests to the backend API and download CSV files.
- **Lucide React**: Clean icons for buttons, tables, and status badges.
- **Zod**: Used to validate form inputs directly in the browser before submitting.

---

## 2. Project Structure

```text
TaskPilot/
├── backend/
│   ├── src/
│   │   ├── config/db.js          # MongoDB connection
│   │   ├── controllers/          # Business logic for employees, tasks, dashboard
│   │   ├── middlewares/          # Validation and error handling
│   │   ├── models/               # Employee, Task, and Counter schemas
│   │   ├── routes/               # API route definitions
│   │   ├── validators/           # Zod validation schemas
│   │   └── server.js             # Express server entry point
│   ├── .env
│   ├── .env.example
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── api/                  # Axios API calls
│   │   ├── components/common/    # Navbar, Badges, Modals, Pagination
│   │   ├── context/              # Notification toast context
│   │   ├── pages/                # All pages (List, Add, Edit, View, Dashboard)
│   │   ├── App.jsx               # Routes setup
│   │   └── main.jsx              # React app mount
│   ├── .env
│   ├── .env.example
│   ├── tailwind.config.js
│   ├── vite.config.js
│   └── package.json
└── README.md
```

---

## 3. Environment Setup & Running Locally

### Step 1: Clone the repository
```bash
git clone https://github.com/vinishsharma/TaskPilot.git
cd TaskPilot
```

### Step 2: Configure Environment Variables

**Backend (`backend/.env`)**:
```env
PORT=8081
MONGODB_URI=your_mongodb_connection_string
NODE_ENV=development
```

**Frontend (`frontend/.env`)**:
```env
VITE_API_BASE_URL=http://localhost:8081/api
```

### Step 3: Install Dependencies & Run

**Terminal 1 (Backend)**:
```bash
cd backend
npm install
npm run dev
```

**Terminal 2 (Frontend)**:
```bash
cd frontend
npm install
npm run dev
```

Open `http://localhost:3000` in your browser.

---

## 4. API Endpoints

### Employees (`/api/employees`)
- `GET /api/employees` &mdash; Get paginated employees (supports search, department/status filter, and sorting).
- `GET /api/employees/all` &mdash; Get all employees (used for task assignment dropdowns).
- `GET /api/employees/:id` &mdash; Get single employee details with their task history.
- `POST /api/employees` &mdash; Create an employee (auto-assigns `EMP-001`, `EMP-002`, etc.).
- `PUT /api/employees/:id` &mdash; Edit employee details.
- `DELETE /api/employees/:id` &mdash; Delete employee (blocked if they have active tasks).

### Tasks (`/api/tasks`)
- `GET /api/tasks` &mdash; Get paginated tasks (supports search, filters, and priority/date sorting).
- `GET /api/tasks/:id` &mdash; Get single task details with allowed next status options.
- `POST /api/tasks` &mdash; Create a task (auto-assigns `TSK-001`, `TSK-002`, etc.).
- `PUT /api/tasks/:id` &mdash; Edit task details (cannot change status or edit completed/cancelled tasks).
- `PUT /api/tasks/:id/status` &mdash; Dedicated endpoint to change status (`Todo -> In Progress -> Completed/Cancelled`).
- `DELETE /api/tasks/:id` &mdash; Delete a task.
- `GET /api/tasks/export` &mdash; Download CSV of all tasks matching the current filters.

### Dashboard (`/api/dashboard`)
- `GET /api/dashboard` &mdash; Returns employee counts, task counts, overdue task count, and employee workload.

---

## 5. Database Design & Employee ➔ Task Relationship

I used MongoDB with Mongoose. To link Tasks and Employees, I used a **Reference + Snapshot** approach:

1. **Direct Reference (`assignedEmployee`)**:
   - The task stores the employee's `_id`. This allows real-time lookups, active task counting, and checking employee availability.

2. **Embedded Snapshot (`employeeSnapshot`)**:
   - When a task is created or assigned, the employee's details (`fullName`, `employeeId`, `email`, `department`) are copied directly into the task document.
   - **Why this is useful**: If an employee leaves the company and their profile is deleted later, completed or past tasks will still display who worked on them instead of showing blank or broken data.

### Fields Summary

- **Employee**:
  - `employeeId`: Unique string, auto-generated (e.g. `EMP-001`).
  - `fullName`: Required string.
  - `email`: Unique string (normalized to lowercase).
  - `phone`: Required string.
  - `department`: Enum (`Development`, `Design`, `QA`, `HR`, `Sales`).
  - `role`: Required string.
  - `joiningDate`: Required date.
  - `status`: Enum (`Active`, `Inactive`, `On Leave`).
  - `skills`: Array of strings.
  - `leaveStart` & `leaveEnd`: Required only when status is `On Leave`.

- **Task**:
  - `taskId`: Unique string, auto-generated (e.g. `TSK-001`).
  - `title`: Required string.
  - `description`: Optional text.
  - `assignedEmployee`: Reference ID to Employee.
  - `employeeSnapshot`: Object holding employee details.
  - `department`: Enum matching departments.
  - `priority`: Enum (`Low`, `Medium`, `High`, `Critical`).
  - `status`: Enum (`Todo`, `In Progress`, `Completed`, `Cancelled`). Defaults to `Todo`.
  - `startDate`: Required date.
  - `dueDate`: Required date (must be same as or after start date).
  - `completedDate`: Set automatically by the backend when completed.
  - `isOverdue`: Calculated on the fly (`today > dueDate` and status is not completed or cancelled).

---

## 6. How Employee Deletion is Handled

1. **Active Task Check**:
   Before deleting an employee, the backend queries the database for active tasks:
   ```javascript
   const activeCount = await Task.countDocuments({
     assignedEmployee: employee._id,
     status: { $in: ['Todo', 'In Progress'] }
   });
   ```
   If `activeCount > 0`, the deletion is blocked with a `400 Bad Request` error telling the user that the employee still has active tasks that must be reassigned or finished first.

2. **Safe Historical Record Keeping**:
   If the employee only has `Completed` or `Cancelled` tasks:
   - The employee is deleted from the `employees` collection.
   - On the old tasks, `assignedEmployee` is set to `null`, but the `employeeSnapshot` (name, ID, department) stays intact. Old tasks and past CSV exports still display who completed the task.

---

## 7. Assumptions Made

1. **No Login Needed**: As stated in the assignment instructions, there is no login/auth system. Anyone using the app has full access to view, add, and edit data.
2. **Active Task Definition**: Only tasks with status `Todo` and `In Progress` count toward an employee's maximum capacity of 3 tasks. `Completed` and `Cancelled` tasks do not count.
3. **Date Comparisons**: Dates for leave checking and overdue checks are evaluated by full calendar days (midnight to 23:59:59) so timezone differences don't accidentally reject valid dates.
4. **Auto-Increment Counters**: Both Task IDs (`TSK-001`) and Employee IDs (`EMP-001`) use atomic database counters so two people creating items at the same time will never get duplicate IDs.

---

## 8. Answers to Assessment Questions

### (1) Where do you validate status transitions and why?
**My Answer**:
I validate status transitions **on the backend** inside the `PUT /api/tasks/:id/status` route.

**Why**:
If I only validated this on the frontend, anyone could open Postman, cURL, or the browser console and send a request jumping directly from `Todo` to `Completed`, or edit a task that is already cancelled. 

While I also use frontend logic to make the dropdown user-friendly (by only showing valid next statuses), the backend is the real barrier that guarantees the rules:
- `Todo` can only go to `In Progress`.
- `In Progress` can go to `Completed` or `Cancelled`.
- `Completed` and `Cancelled` tasks are permanently locked and cannot be edited.

---

### (2) Why does Completed Date come from the backend?
**My Answer**:
The `completedDate` is set by the backend using `new Date()` at the exact moment a task transitions to `Completed`.

**Why**:
1. **Prevent Cheating / Fake Timestamps**: If the date came from the frontend, a user could change their computer clock or send a fake past date in the request body to pretend they met a deadline.
2. **Consistent Timezone**: Users can be in different timezones or have incorrect system clocks. Generating the timestamp on the server ensures all completion records are accurate and consistent.
3. **Protected Field**: In the normal edit task API (`PUT /api/tasks/:id`), the backend strips out `completedDate` so nobody can change it manually.

---

### (3) How do you block inactive / on-leave assignment?
**My Answer**:
Before creating or updating a task on the backend, I look up the assigned employee and run these checks:

1. **Inactive Check**: If the employee has `status === 'Inactive'`, the backend immediately rejects the request with a `400 Bad Request` error (`"Cannot assign task to an Inactive employee"`).
2. **On Leave Check**: If the employee has `status === 'On Leave'`, I compare the task's `startDate` with the employee's `leaveStart` and `leaveEnd` dates:
   - If the task start date falls within the leave period (both dates inclusive), the request is rejected with a `400` error explaining that the employee is on leave during those dates.
   - If the task starts after the leave ends, the assignment is allowed.

---

### (4) Why are filtering and pagination on the backend?
**My Answer**:
**Why**:
1. **Performance & Device Memory**: If a company has 10,000 tasks, fetching all of them into React would make the browser slow, waste memory, and cause mobile phones to lag or freeze.
2. **Speed & Bandwidth**: With backend pagination, the server only sends the 10 tasks needed for the current page, which takes only a few kilobytes over the network.
3. **Database Indexing**: MongoDB uses indexes (like `{ department: 1, status: 1 }` and `{ status: 1, dueDate: 1 }`) to filter and sort through large amounts of data in a few milliseconds.
4. **Clean CSV Export**: The same query logic used for pagination is reused to fetch and download all matching tasks for the CSV export without loading everything into frontend memory.

---

### (5) Why do filters live in the URL?
**My Answer**:
**Why**:
1. **Shareable Links**: If I filter tasks by `Department = Development` and `Status = In Progress` on page 2, the URL becomes `/tasks?department=Development&status=In%20Progress&page=2`. I can copy this link and send it to a colleague, and they will see the exact same filtered view.
2. **Page Refresh**: If a user refreshes the page, their selected filters and current page number are not lost.
3. **Browser History**: The browser's Back and Forward buttons work naturally, allowing users to go back to their previous filter view.

---

### (6) What can go wrong if two requests assign a 4th active task at the same time?
**My Answer**:
This causes a **Race Condition** (also known as a Check-Then-Act problem):

**What can happen**:
- Imagine Rahul currently has 2 active tasks. The company limit is 3.
- Two project managers submit a new task for Rahul at the exact same second:
  1. **Request A** asks the database: *"How many active tasks does Rahul have?"* The database answers: `2`. Since $2 < 3$, Request A is allowed.
  2. **Request B** asks the database at the same moment: *"How many active tasks does Rahul have?"* The database still answers: `2` (because Request A hasn't finished saving yet). So Request B is also allowed.
  3. Request A writes its task to the database $\implies$ Rahul now has 3 active tasks.
  4. Request B writes its task to the database $\implies$ Rahul now has **4 active tasks**!
- The business rule is broken because both requests checked the count before either finished writing.

**How to prevent this**:
1. **Atomic Counter on Employee**: We can store an `activeTaskCount` number directly on the employee document and use MongoDB's atomic filter:
   ```javascript
   const result = await Employee.findOneAndUpdate(
     { _id: employeeId, activeTaskCount: { $lt: 3 }, status: 'Active' },
     { $inc: { activeTaskCount: 1 } }
   );
   if (!result) {
     throw new Error("Employee already has 3 active tasks");
   }
   ```
   Because MongoDB updates single documents atomically, only one request will succeed, and the second request will be safely rejected.
2. **Database Transactions**: We can run the count check and the task creation inside a MongoDB session transaction (`session.withTransaction()`).
