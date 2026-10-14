import { Employee } from '../models/Employee.js';
import { Task } from '../models/Task.js';

// GET /api/dashboard (Calculates all summary metrics and employee workload on server)
export const getDashboardMetrics = async (req, res, next) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [
      employeeStats,
      taskStats,
      overdueCount,
      employeeWorkload,
    ] = await Promise.all([
      // 1. Employee Counts
      Employee.aggregate([
        {
          $group: {
            _id: '$status',
            count: { $sum: 1 },
          },
        },
      ]),

      // 2. Task Counts by Status
      Task.aggregate([
        {
          $group: {
            _id: '$status',
            count: { $sum: 1 },
          },
        },
      ]),

      // 3. Overdue Tasks Count: dueDate < today AND status not in [Completed, Cancelled]
      Task.countDocuments({
        dueDate: { $lt: today },
        status: { $nin: ['Completed', 'Cancelled'] },
      }),

      // 4. Employee Workload (Active Tasks: Todo + In Progress per Employee)
      Task.aggregate([
        {
          $match: {
            status: { $in: ['Todo', 'In Progress'] },
            assignedEmployee: { $ne: null },
          },
        },
        {
          $group: {
            _id: '$assignedEmployee',
            employeeName: { $first: '$employeeSnapshot.fullName' },
            activeTasks: { $sum: 1 },
          },
        },
        {
          $sort: { activeTasks: -1, employeeName: 1 },
        },
      ]),
    ]);

    // Format employee counts
    const employeeMetrics = {
      total: 0,
      active: 0,
      inactive: 0,
      onLeave: 0,
    };

    employeeStats.forEach((stat) => {
      employeeMetrics.total += stat.count;
      if (stat._id === 'Active') employeeMetrics.active = stat.count;
      if (stat._id === 'Inactive') employeeMetrics.inactive = stat.count;
      if (stat._id === 'On Leave') employeeMetrics.onLeave = stat.count;
    });

    // Format task counts
    const taskMetrics = {
      total: 0,
      todo: 0,
      inProgress: 0,
      completed: 0,
      cancelled: 0,
      overdue: overdueCount,
    };

    taskStats.forEach((stat) => {
      taskMetrics.total += stat.count;
      if (stat._id === 'Todo') taskMetrics.todo = stat.count;
      if (stat._id === 'In Progress') taskMetrics.inProgress = stat.count;
      if (stat._id === 'Completed') taskMetrics.completed = stat.count;
      if (stat._id === 'Cancelled') taskMetrics.cancelled = stat.count;
    });

    res.status(200).json({
      success: true,
      data: {
        employees: employeeMetrics,
        tasks: taskMetrics,
        workload: employeeWorkload.map((w) => ({
          employeeId: w._id,
          employeeName: w.employeeName || 'Unknown Employee',
          activeTasks: w.activeTasks,
        })),
      },
    });
  } catch (error) {
    next(error);
  }
};
