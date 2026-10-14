import { Task, TASK_PRIORITIES } from '../models/Task.js';
import { Employee } from '../models/Employee.js';
import { getNextSequence } from '../models/Counter.js';
import { AppError } from '../middlewares/errorHandler.js';

// Status Transition Map (Strict business rule enforcement)
// Todo -> In Progress -> Completed, and Todo -> In Progress -> Cancelled
export const ALLOWED_STATUS_TRANSITIONS = {
  Todo: ['In Progress'],
  'In Progress': ['Completed', 'Cancelled'],
  Completed: [],
  Cancelled: [],
};

// Priority weight helper for sorting
const PRIORITY_ORDER = {
  Critical: 4,
  High: 3,
  Medium: 2,
  Low: 1,
};

// Check if an employee is eligible for assignment
const validateEmployeeAssignment = async (employeeId, taskStartDate, currentTaskId = null) => {
  const employee = await Employee.findById(employeeId);
  if (!employee) {
    throw new AppError('Assigned employee not found', 404);
  }

  // 1. Inactive employee: always rejected
  if (employee.status === 'Inactive') {
    throw new AppError('Cannot assign task to an Inactive employee.', 400);
  }

  // 2. On Leave employee: rejected only if task Start Date falls inside leave period (both dates inclusive)
  if (employee.status === 'On Leave') {
    if (employee.leaveStart && employee.leaveEnd) {
      const taskStart = new Date(taskStartDate).setHours(0, 0, 0, 0);
      const leaveStart = new Date(employee.leaveStart).setHours(0, 0, 0, 0);
      const leaveEnd = new Date(employee.leaveEnd).setHours(23, 59, 59, 999);

      if (taskStart >= leaveStart && taskStart <= leaveEnd) {
        throw new AppError(
          `Cannot assign task: Employee "${employee.fullName}" is On Leave between ${new Date(
            employee.leaveStart
          ).toLocaleDateString()} and ${new Date(
            employee.leaveEnd
          ).toLocaleDateString()}.`,
          400
        );
      }
    }
  }

  // 3. Capacity: one employee can hold at most 3 active tasks (Todo + In Progress) at a time
  const activeTasksFilter = {
    assignedEmployee: employee._id,
    status: { $in: ['Todo', 'In Progress'] },
  };

  if (currentTaskId) {
    activeTasksFilter._id = { $ne: currentTaskId };
  }

  const activeCount = await Task.countDocuments(activeTasksFilter);
  if (activeCount >= 3) {
    throw new AppError(
      `Employee "${employee.fullName}" already has ${activeCount} active tasks (maximum capacity is 3). Please choose another employee.`,
      400
    );
  }

  return employee;
};

// GET /api/tasks (List tasks with search, filters, pagination, and sorting)
export const getTasks = async (req, res, next) => {
  try {
    const {
      page = 1,
      limit = 10,
      search = '',
      department,
      priority,
      status,
      dueDateFrom,
      dueDateTo,
      sortBy = 'createdAt',
      order = 'desc',
    } = req.query;

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.max(1, Math.min(100, parseInt(limit, 10) || 10));
    const skip = (pageNum - 1) * limitNum;

    const query = {};

    // Search by task title or employee name
    if (search && search.trim() !== '') {
      const searchRegex = new RegExp(search.trim(), 'i');
      query.$or = [
        { title: searchRegex },
        { taskId: searchRegex },
        { 'employeeSnapshot.fullName': searchRegex },
      ];
    }

    // Filter by department
    if (department && department !== 'All') {
      query.department = department;
    }

    // Filter by priority
    if (priority && priority !== 'All') {
      query.priority = priority;
    }

    // Filter by status
    if (status && status !== 'All') {
      query.status = status;
    }

    // Filter by due date range
    if (dueDateFrom || dueDateTo) {
      query.dueDate = {};
      if (dueDateFrom) {
        query.dueDate.$gte = new Date(dueDateFrom);
      }
      if (dueDateTo) {
        const toDate = new Date(dueDateTo);
        toDate.setHours(23, 59, 59, 999);
        query.dueDate.$lte = toDate;
      }
    }

    // Build sorting logic
    const isPrioritySort = sortBy === 'priority';
    const sortDirection = order === 'asc' ? 1 : -1;

    let tasks;
    let total;

    if (isPrioritySort) {
      // Server-side sort by priority importance: Critical (4) > High (3) > Medium (2) > Low (1)
      const pipeline = [
        { $match: query },
        {
          $addFields: {
            priorityWeight: {
              $switch: {
                branches: [
                  { case: { $eq: ['$priority', 'Critical'] }, then: 4 },
                  { case: { $eq: ['$priority', 'High'] }, then: 3 },
                  { case: { $eq: ['$priority', 'Medium'] }, then: 2 },
                  { case: { $eq: ['$priority', 'Low'] }, then: 1 },
                ],
                default: 0,
              },
            },
          },
        },
        { $sort: { priorityWeight: sortDirection, createdAt: -1 } },
        { $skip: skip },
        { $limit: limitNum },
      ];

      const [pagedTasks, count] = await Promise.all([
        Task.aggregate(pipeline),
        Task.countDocuments(query),
      ]);
      tasks = pagedTasks;
      total = count;
    } else {
      let sortKey = sortBy;
      if (sortBy === 'createdDate') sortKey = 'createdAt';

      const sortOption = {};
      sortOption[sortKey] = sortDirection;

      const [pagedTasks, count] = await Promise.all([
        Task.find(query)
          .sort(sortOption)
          .skip(skip)
          .limit(limitNum)
          .lean(),
        Task.countDocuments(query),
      ]);
      tasks = pagedTasks;
      total = count;
    }

    // Enhance task list with allowed next statuses and overdue flag
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const formattedTasks = tasks.map((task) => {
      const due = new Date(task.dueDate);
      due.setHours(0, 0, 0, 0);
      const isOverdue =
        task.status !== 'Completed' && task.status !== 'Cancelled' && today > due;

      return {
        ...task,
        isOverdue,
        nextAllowedStatuses: ALLOWED_STATUS_TRANSITIONS[task.status] || [],
      };
    });

    res.status(200).json({
      success: true,
      data: formattedTasks,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum) || 1,
      },
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/tasks/:id (View single task details)
export const getTaskById = async (req, res, next) => {
  try {
    const task = await Task.findById(req.params.id).populate(
      'assignedEmployee',
      'fullName employeeId email department status'
    );
    if (!task) {
      return next(new AppError('Task not found', 404));
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const due = new Date(task.dueDate);
    due.setHours(0, 0, 0, 0);
    const isOverdue =
      task.status !== 'Completed' && task.status !== 'Cancelled' && today > due;

    res.status(200).json({
      success: true,
      data: {
        ...task.toObject(),
        isOverdue,
        nextAllowedStatuses: ALLOWED_STATUS_TRANSITIONS[task.status] || [],
      },
    });
  } catch (error) {
    next(error);
  }
};

// POST /api/tasks (Add Task)
export const createTask = async (req, res, next) => {
  try {
    const {
      title,
      description,
      assignedEmployee,
      department,
      priority,
      startDate,
      dueDate,
    } = req.body;

    // Validate employee assignment rules & capacity
    const employee = await validateEmployeeAssignment(
      assignedEmployee,
      startDate
    );

    // Generate auto-incremented Task ID (e.g. TSK-001)
    const seq = await getNextSequence('taskId');
    const taskId = `TSK-${String(seq).padStart(3, '0')}`;

    const newTask = await Task.create({
      taskId,
      title,
      description: description || '',
      assignedEmployee: employee._id,
      employeeSnapshot: {
        employeeId: employee.employeeId,
        fullName: employee.fullName,
        email: employee.email,
        department: employee.department,
      },
      department,
      priority,
      status: 'Todo', // New tasks always start as Todo
      startDate,
      dueDate,
      completedDate: null,
    });

    res.status(201).json({
      success: true,
      message: 'Task created successfully',
      data: newTask,
    });
  } catch (error) {
    next(error);
  }
};

// PUT /api/tasks/:id (Edit Task - except status and terminal states)
export const updateTask = async (req, res, next) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) {
      return next(new AppError('Task not found', 404));
    }

    // Business Rule: Completed and Cancelled tasks cannot be edited
    if (task.status === 'Completed' || task.status === 'Cancelled') {
      return next(
        new AppError(
          `Cannot edit task because it is already ${task.status}.`,
          400
        )
      );
    }

    // If assigned employee or start date changed, re-validate capacity & leave rules
    const newAssignedId = req.body.assignedEmployee || task.assignedEmployee;
    const newStartDate = req.body.startDate || task.startDate;

    let employeeSnapshot = task.employeeSnapshot;
    if (
      newAssignedId &&
      (newAssignedId.toString() !== task.assignedEmployee?.toString() ||
        req.body.startDate)
    ) {
      const employee = await validateEmployeeAssignment(
        newAssignedId,
        newStartDate,
        task._id
      );
      employeeSnapshot = {
        employeeId: employee.employeeId,
        fullName: employee.fullName,
        email: employee.email,
        department: employee.department,
      };
    }

    // Disallow editing status via normal update API
    const updateData = { ...req.body };
    delete updateData.status;
    delete updateData.completedDate;
    delete updateData.taskId;

    const updatedTask = await Task.findByIdAndUpdate(
      task._id,
      {
        ...updateData,
        employeeSnapshot,
      },
      { new: true, runValidators: true }
    ).populate('assignedEmployee', 'fullName employeeId email department status');

    res.status(200).json({
      success: true,
      message: 'Task updated successfully',
      data: updatedTask,
    });
  } catch (error) {
    next(error);
  }
};

// PUT /api/tasks/:id/status (Dedicated status update endpoint)
export const updateTaskStatus = async (req, res, next) => {
  try {
    const { status: newStatus } = req.body;
    const task = await Task.findById(req.params.id);

    if (!task) {
      return next(new AppError('Task not found', 404));
    }

    // Business Rule: Completed and Cancelled tasks cannot be edited
    if (task.status === 'Completed' || task.status === 'Cancelled') {
      return next(
        new AppError(
          `Task is already ${task.status} and cannot be modified.`,
          400
        )
      );
    }

    // Business Rule: Verify status flow
    const allowed = ALLOWED_STATUS_TRANSITIONS[task.status] || [];
    if (!allowed.includes(newStatus)) {
      return next(
        new AppError(
          `Invalid status transition from "${task.status}" to "${newStatus}". Allowed transitions: ${
            allowed.length ? allowed.join(', ') : 'None'
          }`,
          400
        )
      );
    }

    task.status = newStatus;

    // Completed Date is set by the backend when a task becomes Completed
    if (newStatus === 'Completed') {
      task.completedDate = new Date();
    } else {
      task.completedDate = null;
    }

    await task.save();

    res.status(200).json({
      success: true,
      message: `Task status updated to ${newStatus}`,
      data: task,
    });
  } catch (error) {
    next(error);
  }
};

// DELETE /api/tasks/:id (Delete Task)
export const deleteTask = async (req, res, next) => {
  try {
    const task = await Task.findByIdAndDelete(req.params.id);
    if (!task) {
      return next(new AppError('Task not found', 404));
    }
    res.status(200).json({
      success: true,
      message: 'Task deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/tasks/export (Export CSV of all tasks matching current filters)
export const exportTasksCSV = async (req, res, next) => {
  try {
    const {
      search = '',
      department,
      priority,
      status,
      dueDateFrom,
      dueDateTo,
      sortBy = 'createdAt',
      order = 'desc',
    } = req.query;

    const query = {};

    if (search && search.trim() !== '') {
      const searchRegex = new RegExp(search.trim(), 'i');
      query.$or = [
        { title: searchRegex },
        { taskId: searchRegex },
        { 'employeeSnapshot.fullName': searchRegex },
      ];
    }

    if (department && department !== 'All') {
      query.department = department;
    }

    if (priority && priority !== 'All') {
      query.priority = priority;
    }

    if (status && status !== 'All') {
      query.status = status;
    }

    if (dueDateFrom || dueDateTo) {
      query.dueDate = {};
      if (dueDateFrom) query.dueDate.$gte = new Date(dueDateFrom);
      if (dueDateTo) {
        const toDate = new Date(dueDateTo);
        toDate.setHours(23, 59, 59, 999);
        query.dueDate.$lte = toDate;
      }
    }

    const sortDirection = order === 'asc' ? 1 : -1;
    let tasks;

    if (sortBy === 'priority') {
      tasks = await Task.aggregate([
        { $match: query },
        {
          $addFields: {
            priorityWeight: {
              $switch: {
                branches: [
                  { case: { $eq: ['$priority', 'Critical'] }, then: 4 },
                  { case: { $eq: ['$priority', 'High'] }, then: 3 },
                  { case: { $eq: ['$priority', 'Medium'] }, then: 2 },
                  { case: { $eq: ['$priority', 'Low'] }, then: 1 },
                ],
                default: 0,
              },
            },
          },
        },
        { $sort: { priorityWeight: sortDirection, createdAt: -1 } },
      ]);
    } else {
      let sortKey = sortBy;
      if (sortBy === 'createdDate') sortKey = 'createdAt';
      const sortOption = {};
      sortOption[sortKey] = sortDirection;
      tasks = await Task.find(query).sort(sortOption).lean();
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const headers = [
      'Task ID',
      'Title',
      'Assigned Employee',
      'Department',
      'Priority',
      'Status',
      'Start Date',
      'Due Date',
      'Completed Date',
      'Is Overdue',
    ];

    const escapeCSV = (str) => {
      if (str === null || str === undefined) return '""';
      const value = String(str).replace(/"/g, '""');
      return `"${value}"`;
    };

    const csvRows = [headers.join(',')];

    tasks.forEach((task) => {
      const due = new Date(task.dueDate);
      due.setHours(0, 0, 0, 0);
      const isOverdue =
        task.status !== 'Completed' && task.status !== 'Cancelled' && today > due;

      const row = [
        escapeCSV(task.taskId),
        escapeCSV(task.title),
        escapeCSV(task.employeeSnapshot?.fullName || 'Unassigned'),
        escapeCSV(task.department),
        escapeCSV(task.priority),
        escapeCSV(task.status),
        escapeCSV(new Date(task.startDate).toLocaleDateString()),
        escapeCSV(new Date(task.dueDate).toLocaleDateString()),
        escapeCSV(
          task.completedDate
            ? new Date(task.completedDate).toLocaleDateString()
            : 'N/A'
        ),
        escapeCSV(isOverdue ? 'Yes' : 'No'),
      ];
      csvRows.push(row.join(','));
    });

    const csvContent = csvRows.join('\r\n');

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="tasks-export-${Date.now()}.csv"`
    );
    res.status(200).send(csvContent);
  } catch (error) {
    next(error);
  }
};
