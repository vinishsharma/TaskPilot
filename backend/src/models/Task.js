import mongoose from 'mongoose';
import { DEPARTMENTS } from './Employee.js';

export const TASK_PRIORITIES = ['Low', 'Medium', 'High', 'Critical'];
export const TASK_STATUSES = ['Todo', 'In Progress', 'Completed', 'Cancelled'];

const taskSchema = new mongoose.Schema(
  {
    taskId: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    title: {
      type: String,
      required: [true, 'Task Title is required'],
      trim: true,
    },
    description: {
      type: String,
      default: '',
      trim: true,
    },
    assignedEmployee: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Employee',
      default: null,
    },
    employeeSnapshot: {
      employeeId: { type: String, default: null },
      fullName: { type: String, default: 'Unassigned' },
      email: { type: String, default: null },
      department: { type: String, default: null },
    },
    department: {
      type: String,
      required: [true, 'Department is required'],
      enum: {
        values: DEPARTMENTS,
        message: '{VALUE} is not a valid department',
      },
    },
    priority: {
      type: String,
      required: [true, 'Priority is required'],
      enum: {
        values: TASK_PRIORITIES,
        message: '{VALUE} is not a valid priority',
      },
      default: 'Medium',
    },
    status: {
      type: String,
      required: [true, 'Status is required'],
      enum: {
        values: TASK_STATUSES,
        message: '{VALUE} is not a valid status',
      },
      default: 'Todo',
    },
    startDate: {
      type: Date,
      required: [true, 'Start Date is required'],
    },
    dueDate: {
      type: Date,
      required: [true, 'Due Date is required'],
    },
    completedDate: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Virtual for overdue
taskSchema.virtual('isOverdue').get(function () {
  if (this.status === 'Completed' || this.status === 'Cancelled') {
    return false;
  }
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const due = new Date(this.dueDate);
  due.setHours(0, 0, 0, 0);
  return today > due;
});

// Compound indexes
taskSchema.index({ assignedEmployee: 1, status: 1 });
taskSchema.index({ status: 1, dueDate: 1 });
taskSchema.index({ department: 1, priority: 1 });

export const Task = mongoose.model('Task', taskSchema);
