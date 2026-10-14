import { z } from 'zod';
import { DEPARTMENTS } from '../models/Employee.js';
import { TASK_PRIORITIES, TASK_STATUSES } from '../models/Task.js';

export const createTaskSchema = z
  .object({
    title: z
      .string({ required_error: 'Task Title is required' })
      .trim()
      .min(2, 'Task Title must be at least 2 characters'),
    description: z.string().trim().optional().default(''),
    assignedEmployee: z
      .string({ required_error: 'Assigned Employee is required' })
      .trim()
      .min(1, 'Assigned Employee is required'),
    department: z.enum(DEPARTMENTS, {
      errorMap: () => ({ message: 'Invalid department' }),
    }),
    priority: z.enum(TASK_PRIORITIES, {
      errorMap: () => ({ message: 'Invalid priority level' }),
    }),
    startDate: z
      .string({ required_error: 'Start Date is required' })
      .refine((val) => !isNaN(Date.parse(val)), {
        message: 'Invalid start date format',
      }),
    dueDate: z
      .string({ required_error: 'Due Date is required' })
      .refine((val) => !isNaN(Date.parse(val)), {
        message: 'Invalid due date format',
      }),
  })
  .superRefine((data, ctx) => {
    const start = new Date(data.startDate).getTime();
    const due = new Date(data.dueDate).getTime();
    if (due < start) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Due Date cannot be earlier than Start Date',
        path: ['dueDate'],
      });
    }
  });

export const updateTaskSchema = z
  .object({
    title: z.string().trim().min(2).optional(),
    description: z.string().trim().optional(),
    assignedEmployee: z.string().trim().optional(),
    department: z.enum(DEPARTMENTS).optional(),
    priority: z.enum(TASK_PRIORITIES).optional(),
    startDate: z
      .string()
      .refine((val) => !isNaN(Date.parse(val)), {
        message: 'Invalid start date format',
      })
      .optional(),
    dueDate: z
      .string()
      .refine((val) => !isNaN(Date.parse(val)), {
        message: 'Invalid due date format',
      })
      .optional(),
  })
  .superRefine((data, ctx) => {
    if (data.startDate && data.dueDate) {
      const start = new Date(data.startDate).getTime();
      const due = new Date(data.dueDate).getTime();
      if (due < start) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Due Date cannot be earlier than Start Date',
          path: ['dueDate'],
        });
      }
    }
  });

export const updateTaskStatusSchema = z.object({
  status: z.enum(TASK_STATUSES, {
    errorMap: () => ({ message: 'Invalid task status' }),
  }),
});
