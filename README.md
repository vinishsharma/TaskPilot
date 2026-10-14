# TaskPilot &mdash; Employee &amp; Task Management System

A high-performance, full-stack **MERN** (MongoDB, Express, React, Node.js) web application for enterprise employee resource tracking and task workflow management, built according to strict server-enforced business rules.

---

## Table of Contents

1. [Tech Stack & Architecture](#tech-stack--architecture)
2. [Project Structure](#project-structure)
3. [Environment Variables & Setup](#environment-variables--setup)
4. [API Overview](#api-overview)
5. [Database Schema & Employee ➔ Task Relationship](#database-schema--employee--task-relationship)
6. [How Employee Deletion is Handled](#how-employee-deletion-is-handled)
7. [System Assumptions](#system-assumptions)
8. [Assessment Architectural Questions & Answers](#assessment-architectural-questions--answers)

---

## 1. Tech Stack & Architecture

- **Backend**: Node.js & Express.js
- **Database**: MongoDB with Mongoose ODM (Atomic auto-increment sequence counters, compound indexes).
- **Validation**: Zod schema validation on both server-side middlewares and client-side forms.
- **Frontend**: React 18, Vite, React Router v6, Tailwind CSS, Lucide React icons.
- **State & URL Sync**: Declarative URL query synchronization using `useSearchParams`.

---

## 2. Project Structure

```text
TaskPilot/
├── backend/
│   ├── src/
│   │   ├── config/
│   │   │   └── db.js                 # Mongoose connection helper
│   │   ├── controllers/
│   │   │   ├── employeeController.js # Full Employee CRUD & capacity verification
│   │   │   ├── taskController.js     # Task CRUD, state machine, CSV export
│   │   │   └── dashboardController.js# Server aggregation metrics & workload
│   │   ├── middlewares/
│   │   │   ├── errorHandler.js       # Centralized error handler (400, 404, 409, 500)
│   │   │   └── validateRequest.js    # Generic Zod validation middleware
│   │   ├── models/
│   │   │   ├── Employee.js           # Employee schema & indexes
│   │   │   ├── Task.js               # Task schema, snapshot & overdue virtual
│   │   │   └── Counter.js            # Atomic sequence generator (TSK-XXX, EMP-XXX)
│   │   ├── routes/
│   │   │   ├── employeeRoutes.js     # /api/employees
│   │   │   ├── taskRoutes.js         # /api/tasks
│   │   │   └── dashboardRoutes.js    # /api/dashboard
│   │   ├── validators/
│   │   │   ├── employeeValidator.js  # Zod schema for employee
│   │   │   └── taskValidator.js      # Zod schema for task & status transitions
│   │   └── server.js                 # Express app bootstrap
│   ├── .env.example
│   ├── .env
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── api/                      # Axios API clients
│   │   ├── components/common/        # Navbar, Badges, Modals, Pagination
│   │   ├── context/                  # Notification & toast provider
│   │   ├── pages/                    # Multi-route views (List, Add, Edit, View)
│   │   ├── App.jsx                   # Route declarations
│   │   └── main.jsx
│   ├── .env.example
│   ├── .env
│   ├── tailwind.config.js
│   ├── vite.config.js
│   └── package.json
└── README.md
```

---

## 3. Environment Variables & Setup

### A. Environment Files

Create `.env` in `backend/`:

```env
PORT=6000
MONGODB_URI=mongodb+srv://<username>:<password>@cluster.mongodb.net/taskpilot?retryWrites=true&w=majority
NODE_ENV=development
```

Create `.env` in `frontend/`:

```env
VITE_API_BASE_URL=http://localhost:6000/api
```

### B. Running Locally

1. **Install Dependencies**:

   ```bash
   # In backend
   cd backend && npm install

   # In frontend
   cd ../frontend && npm install
   ```

2. **Start Backend Server**:

   ```bash
   cd backend
   npm run dev
   ```

   _Server will output: `[MongoDB Connected]` and `[TaskPilot Server running on port 8081]`._

3. **Start Frontend Server**:
   ```bash
   cd frontend
   npm run dev
   ```
   _Frontend opens at `http://localhost:3000`._

---

## 4. API Overview

| Method   | Endpoint                | Description                                             | Status Codes       |
| :------- | :---------------------- | :------------------------------------------------------ | :----------------- |
| `GET`    | `/api/health`           | Service health status                                   | 200                |
| `GET`    | `/api/employees`        | List employees (paginated, search, filter, sort)        | 200                |
| `GET`    | `/api/employees/all`    | List all employees (for task assignment dropdowns)      | 200                |
| `GET`    | `/api/employees/:id`    | View employee details + assigned task history           | 200, 404           |
| `POST`   | `/api/employees`        | Create employee (auto-generated `EMP-XXX` ID)           | 201, 400, 409      |
| `PUT`    | `/api/employees/:id`    | Update employee (preserves task snapshots)              | 200, 400, 404, 409 |
| `DELETE` | `/api/employees/:id`    | Delete employee (blocked if active tasks exist)         | 200, 400, 404      |
| `GET`    | `/api/tasks`            | List tasks (search, filter, sort, pagination)           | 200                |
| `GET`    | `/api/tasks/:id`        | View task details & next allowed transitions            | 200, 404           |
| `POST`   | `/api/tasks`            | Create task (auto-generated `TSK-XXX` ID)               | 201, 400, 404      |
| `PUT`    | `/api/tasks/:id`        | Update task details (status cannot be changed here)     | 200, 400, 404      |
| `PUT`    | `/api/tasks/:id/status` | Dedicated status transition state machine               | 200, 400, 404      |
| `DELETE` | `/api/tasks/:id`        | Delete task                                             | 200, 404           |
| `GET`    | `/api/tasks/export`     | Stream CSV of all tasks matching current filters & sort | 200                |
| `GET`    | `/api/dashboard`        | Dashboard metrics & server-calculated workload          | 200                |

---

## 5. Database Schema & Employee ➔ Task Relationship

### Reference + Snapshot Pattern

The system implements a hybrid **Reference + Embedded Snapshot** design:

1. **`assignedEmployee` (ObjectId Reference)**:
   Points to `Employee._id`. Used for real-time joins, active workload counting, and referential checks.
2. **`employeeSnapshot` (Embedded Subdocument)**:
   Stores `{ employeeId, fullName, email, department }` directly inside the Task document.
   - **Why?**: If an employee is later deleted or modified, old historical tasks (e.g. `Completed` or `Cancelled`) retain meaningful audit logs without foreign key breakage or empty `"Unassigned"` fields in past reports.

### Fields Summary

- **Employee**:
  - `employeeId`: String, Unique, System-generated (`EMP-001`).
  - `fullName`: String, Required.
  - `email`: String, Unique, Normalized lowercase.
  - `phone`: String, Required.
  - `department`: Enum: `['Development', 'Design', 'QA', 'HR', 'Sales']`.
  - `role`: String, Required.
  - `joiningDate`: Date, Required.
  - `status`: Enum: `['Active', 'Inactive', 'On Leave']`.
  - `skills`: Array of Strings.
  - `leaveStart` / `leaveEnd`: Date, required only when `status === 'On Leave'`.
- **Task**:
  - `taskId`: String, Unique, System-generated (`TSK-001`).
  - `title`: String, Required.
  - `description`: String.
  - `assignedEmployee`: ObjectId Ref to Employee.
  - `employeeSnapshot`: Object `{ employeeId, fullName, email, department }`.
  - `department`: Enum (same as Employee).
  - `priority`: Enum: `['Low', 'Medium', 'High', 'Critical']`.
  - `status`: Enum: `['Todo', 'In Progress', 'Completed', 'Cancelled']`. Default: `'Todo'`.
  - `startDate`: Date, Required.
  - `dueDate`: Date, Required (`dueDate >= startDate`).
  - `completedDate`: Date, managed exclusively by the backend.
  - `isOverdue`: Virtual / Computed (`today > dueDate && status not in ['Completed', 'Cancelled']`).

---

## 6. How Employee Deletion is Handled

1. **Active Task Guard**:
   When a `DELETE /api/employees/:id` request arrives, the server checks:
   ```javascript
   const activeCount = await Task.countDocuments({
     assignedEmployee: employee._id,
     status: { $in: ["Todo", "In Progress"] },
   });
   if (activeCount > 0) {
     throw new AppError("Cannot delete employee with active tasks...", 400);
   }
   ```
2. **Audit & Historical Integrity**:
   If the employee has only `Completed` or `Cancelled` tasks:
   - The employee document is safely deleted.
   - The reference `assignedEmployee` on their past tasks is unlinked (`null`), while `employeeSnapshot` preserves their name, employee ID, and department permanently.

---

## 7. System Assumptions

1. **No Authentication**: As specified in the requirements, no login or token-based authentication is enforced. All actions are treated as authorized administrators.
2. **Capacity Definition**: Only tasks in `Todo` and `In Progress` count against an employee's 3-task capacity limit. `Completed` and `Cancelled` tasks do not consume active capacity.
3. **Date Granularity**: Due date and leave date collisions are evaluated at calendar-day boundary resolution (midnight to 23:59:59.999).
4. **Task IDs and Employee IDs**: Auto-incrementing counters maintain separate deterministic sequences (`TSK-001`, `EMP-001`).

---

## 8. Assessment Architectural Questions & Answers

### (1) Where do you validate status transitions and why?

**Answer**:
Status transitions are validated **strictly on the backend** inside the dedicated endpoint handler `PUT /api/tasks/:id/status`.

- **Why**: Frontend validation exists only to offer a smooth user experience (e.g. rendering only valid next choices in the status dropdown). However, client-side code can easily be circumvented by sending direct HTTP requests via cURL, Postman, or automated scripts.
- The backend serves as the single source of truth using a finite state machine:
  $$\text{Todo} \longrightarrow \text{In Progress} \longrightarrow \text{Completed}$$
  $$\text{Todo} \longrightarrow \text{In Progress} \longrightarrow \text{Cancelled}$$
- Any illegal jump (e.g. `Todo ➔ Completed`) or modification of locked terminal states (`Completed` or `Cancelled`) is rejected with **HTTP 400 Bad Request**.

---

### (2) Why does Completed Date come from the backend?

**Answer**:

- **Tamper Resistance & Audit Trust**: If `completedDate` were accepted from the frontend, clients could forge or backdate task completion timestamps to falsify SLA compliance or performance metrics.
- **Clock Synchronization & Timezones**: Client devices often have out-of-sync system clocks or disparate local timezones. Generating `completedDate = new Date()` on the server ensures an authoritative, monotonic timestamp in UTC.
- **Separation of Concerns**: The normal update route (`PUT /api/tasks/:id`) strips `completedDate` from the payload, guaranteeing it is stamped solely when the state machine registers a valid transition into `Completed`.

---

### (3) How do you block inactive / on-leave assignment?

**Answer**:
Validation is executed in the backend service layer before saving or updating a task:

1. **Inactive Check**: If `employee.status === 'Inactive'`, the assignment is rejected immediately with an HTTP 400 error.
2. **On-Leave Collision Check**: If `employee.status === 'On Leave'`, the backend extracts the task's `startDate` and the employee's `leaveStart` and `leaveEnd` dates, normalizing them to day boundaries:
   $$\text{leaveStart} \le \text{taskStartDate} \le \text{leaveEnd}$$
   If the task start date falls inside this inclusive range, the server rejects the request with HTTP 400 and returns a friendly notification detailing the exact leave dates.

---

### (4) Why are filtering and pagination on the backend?

**Answer**:

- **Scalability & Memory Overhead**: Fetching thousands of records to paginate and filter inside React would consume excessive network bandwidth, spike client memory usage, and freeze low-end mobile devices.
- **Database Optimization**: MongoDB utilizes compound indexes (`{ status: 1, dueDate: 1 }`, `{ department: 1, priority: 1 }`) to filter and sort millions of records in milliseconds.
- **Efficiency**: With backend pagination (`skip` & `limit`), the server transfers only the 10 requested items across the wire.
- **Uniformity with Exports**: The same server-side query builder powers the paginated JSON table API and the unpaginated streaming CSV export.

---

### (5) Why do filters live in the URL?

**Answer**:

- **Shareability & Deep Linking**: Users can copy the URL (`/tasks?status=In%20Progress&priority=High&page=2`) and share it with colleagues or open it in a new tab; it loads the exact same dataset.
- **Browser History & Reload Persistence**: Users can use the browser's Back and Forward buttons or refresh the page without losing their active search, filters, or page numbers.
- **Declarative Architecture**: URL query parameters represent the single source of truth for page state, simplifying React state management.

---

### (6) What can go wrong if two requests assign a 4th active task at the same time?

**Answer**:
This introduces a **Race Condition (Check-Then-Act / Phantom Read)**:

1. Assume Employee $E$ currently has 2 active tasks (`Todo` + `In Progress`). The maximum capacity is 3.
2. Two requests ($R_1$ and $R_2$) arrive concurrently to assign new tasks to $E$:
   - $R_1$ queries active task count: receives **2** ($2 < 3 \implies \text{Allowed}$).
   - $R_2$ queries active task count concurrently: receives **2** ($2 < 3 \implies \text{Allowed}$).
   - $R_1$ inserts task ➔ Employee now has 3 active tasks.
   - $R_2$ inserts task ➔ Employee now has **4 active tasks**, violating the business rule!
3. **Mitigation**:
   - **Optimistic Concurrency / Document Counter**: Maintain an `activeTaskCount` field on the `Employee` model and perform atomic updates using MongoDB conditional filters:
     ```javascript
     const updated = await Employee.findOneAndUpdate(
       { _id: employeeId, activeTaskCount: { $lt: 3 }, status: "Active" },
       { $inc: { activeTaskCount: 1 } },
       { new: true },
     );
     if (!updated) {
       throw new AppError(
         "Employee reached maximum capacity of 3 active tasks",
         400,
       );
     }
     ```
   - **MongoDB Multi-Document Transactions**: Wrap the capacity count and task creation within an isolated `session.withTransaction()` block.
