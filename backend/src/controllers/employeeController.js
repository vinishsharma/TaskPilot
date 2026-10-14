import { Employee } from '../models/Employee.js';
import { Task } from '../models/Task.js';
import { Counter, getNextSequence } from '../models/Counter.js';
import { AppError } from '../middlewares/errorHandler.js';

// GET /api/employees (List with pagination, search, filter, and sorting)
export const getEmployees = async (req, res, next) => {
  try {
    const {
      page = 1,
      limit = 10,
      search = '',
      department,
      status,
      sortBy = 'createdAt',
      order = 'desc',
    } = req.query;

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.max(1, Math.min(100, parseInt(limit, 10) || 10));
    const skip = (pageNum - 1) * limitNum;

    // Build filter query
    const query = {};

    if (search && search.trim() !== '') {
      const searchRegex = new RegExp(search.trim(), 'i');
      query.$or = [
        { fullName: searchRegex },
        { employeeId: searchRegex },
        { email: searchRegex },
      ];
    }

    if (department && department !== 'All') {
      query.department = department;
    }

    if (status && status !== 'All') {
      query.status = status;
    }

    // Build sort option
    const sortOption = {};
    sortOption[sortBy] = order === 'asc' ? 1 : -1;

    const [employees, total] = await Promise.all([
      Employee.find(query).sort(sortOption).skip(skip).limit(limitNum),
      Employee.countDocuments(query),
    ]);

    res.status(200).json({
      success: true,
      data: employees,
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

// GET /api/employees/all (Helper for dropdowns without pagination)
export const getAllEmployeesList = async (req, res, next) => {
  try {
    const employees = await Employee.find({}).sort({ fullName: 1 });
    res.status(200).json({
      success: true,
      data: employees,
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/employees/:id (View single employee + their assigned tasks)
export const getEmployeeById = async (req, res, next) => {
  try {
    const employee = await Employee.findById(req.params.id);
    if (!employee) {
      return next(new AppError('Employee not found', 404));
    }

    // Also fetch current tasks assigned to this employee
    const tasks = await Task.find({ assignedEmployee: employee._id }).sort({
      createdAt: -1,
    });

    res.status(200).json({
      success: true,
      data: {
        employee,
        tasks,
      },
    });
  } catch (error) {
    next(error);
  }
};

// POST /api/employees (Add employee - employeeId is auto-generated)
export const createEmployee = async (req, res, next) => {
  try {
    const {
      fullName,
      email,
      phone,
      department,
      role,
      joiningDate,
      status,
      skills,
      leaveStart,
      leaveEnd,
    } = req.body;

    // Check unique email
    const existingEmail = await Employee.findOne({ email: email.toLowerCase() });
    if (existingEmail) {
      return next(new AppError(`Email "${email}" is already registered.`, 409));
    }

    // Auto-generate unique sequential employeeId (e.g. EMP-001, EMP-002)
    let employeeId = '';
    let isUnique = false;
    while (!isUnique) {
      const seq = await getNextSequence('employeeId');
      employeeId = `EMP-${String(seq).padStart(3, '0')}`;
      const existingId = await Employee.findOne({ employeeId });
      if (!existingId) {
        isUnique = true;
      }
    }

    const employee = await Employee.create({
      employeeId,
      fullName,
      email,
      phone,
      department,
      role,
      joiningDate,
      status,
      skills: skills || [],
      leaveStart: status === 'On Leave' ? leaveStart : null,
      leaveEnd: status === 'On Leave' ? leaveEnd : null,
    });

    res.status(201).json({
      success: true,
      message: 'Employee created successfully',
      data: employee,
    });
  } catch (error) {
    next(error);
  }
};

// PUT /api/employees/:id (Edit employee)
export const updateEmployee = async (req, res, next) => {
  try {
    const employee = await Employee.findById(req.params.id);
    if (!employee) {
      return next(new AppError('Employee not found', 404));
    }

    // Check email uniqueness if email is changed
    if (req.body.email && req.body.email.toLowerCase() !== employee.email) {
      const emailExists = await Employee.findOne({
        email: req.body.email.toLowerCase(),
        _id: { $ne: employee._id },
      });
      if (emailExists) {
        return next(
          new AppError(`Email "${req.body.email}" is already in use.`, 409)
        );
      }
    }

    // If changing to 'On Leave', enforce dates
    const updatedStatus = req.body.status || employee.status;
    let leaveStart = req.body.leaveStart !== undefined ? req.body.leaveStart : employee.leaveStart;
    let leaveEnd = req.body.leaveEnd !== undefined ? req.body.leaveEnd : employee.leaveEnd;

    if (updatedStatus !== 'On Leave') {
      leaveStart = null;
      leaveEnd = null;
    }

    const updatedEmployee = await Employee.findByIdAndUpdate(
      req.params.id,
      {
        ...req.body,
        leaveStart,
        leaveEnd,
      },
      { new: true, runValidators: true }
    );

    // If employee details changed (fullName, email, department), also update the snapshot in tasks!
    await Task.updateMany(
      { assignedEmployee: updatedEmployee._id },
      {
        $set: {
          'employeeSnapshot.fullName': updatedEmployee.fullName,
          'employeeSnapshot.email': updatedEmployee.email,
          'employeeSnapshot.department': updatedEmployee.department,
        },
      }
    );

    res.status(200).json({
      success: true,
      message: 'Employee updated successfully',
      data: updatedEmployee,
    });
  } catch (error) {
    next(error);
  }
};

// DELETE /api/employees/:id (Delete employee)
export const deleteEmployee = async (req, res, next) => {
  try {
    const employee = await Employee.findById(req.params.id);
    if (!employee) {
      return next(new AppError('Employee not found', 404));
    }

    // Business Rule: Delete employee not allowed while the employee has Todo / In Progress tasks
    const activeTasksCount = await Task.countDocuments({
      assignedEmployee: employee._id,
      status: { $in: ['Todo', 'In Progress'] },
    });

    if (activeTasksCount > 0) {
      return next(
        new AppError(
          `Cannot delete employee. They currently have ${activeTasksCount} active task(s) (Todo / In Progress). Reassign or complete these tasks first.`,
          400
        )
      );
    }

    // Old tasks must still show meaningful employee details if employee is later deleted.
    // Unlink the reference but preserve employeeSnapshot!
    await Task.updateMany(
      { assignedEmployee: employee._id },
      { $set: { assignedEmployee: null } }
    );

    await Employee.findByIdAndDelete(employee._id);

    res.status(200).json({
      success: true,
      message: 'Employee deleted successfully. Historical task logs preserved.',
    });
  } catch (error) {
    next(error);
  }
};
