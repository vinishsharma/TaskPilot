import { z } from 'zod';
import { DEPARTMENTS, EMPLOYEE_STATUSES } from '../models/Employee.js';

export const createEmployeeSchema = z
  .object({
    employeeId: z.string().trim().toUpperCase().optional(),
    fullName: z
      .string({ required_error: 'Full Name is required' })
      .trim()
      .min(2, 'Full Name must be at least 2 characters'),
    email: z
      .string({ required_error: 'Email is required' })
      .trim()
      .email('Invalid email address')
      .toLowerCase(),
    phone: z
      .string({ required_error: 'Phone number is required' })
      .trim()
      .min(5, 'Phone number must be at least 5 digits'),
    department: z.enum(DEPARTMENTS, {
      errorMap: () => ({ message: 'Invalid department' }),
    }),
    role: z
      .string({ required_error: 'Role is required' })
      .trim()
      .min(1, 'Role cannot be empty'),
    joiningDate: z
      .string({ required_error: 'Joining date is required' })
      .refine((val) => !isNaN(Date.parse(val)), {
        message: 'Invalid joining date',
      }),
    status: z
      .enum(EMPLOYEE_STATUSES, {
        errorMap: () => ({ message: 'Invalid employee status' }),
      })
      .default('Active'),
    skills: z
      .union([z.array(z.string()), z.string()])
      .optional()
      .transform((val) => {
        if (!val) return [];
        if (Array.isArray(val)) return val.map((s) => s.trim()).filter(Boolean);
        return val
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean);
      }),
    leaveStart: z
      .string()
      .nullable()
      .optional()
      .refine((val) => !val || !isNaN(Date.parse(val)), {
        message: 'Invalid leave start date',
      }),
    leaveEnd: z
      .string()
      .nullable()
      .optional()
      .refine((val) => !val || !isNaN(Date.parse(val)), {
        message: 'Invalid leave end date',
      }),
  })
  .superRefine((data, ctx) => {
    if (data.status === 'On Leave') {
      if (!data.leaveStart) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Leave Start date is required when status is On Leave',
          path: ['leaveStart'],
        });
      }
      if (!data.leaveEnd) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Leave End date is required when status is On Leave',
          path: ['leaveEnd'],
        });
      }
      if (data.leaveStart && data.leaveEnd) {
        const start = new Date(data.leaveStart).getTime();
        const end = new Date(data.leaveEnd).getTime();
        if (end < start) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: 'Leave End date cannot be earlier than Leave Start date',
            path: ['leaveEnd'],
          });
        }
      }
    }
  });

export const updateEmployeeSchema = z
  .object({
    fullName: z.string().trim().min(2).optional(),
    email: z.string().trim().email().toLowerCase().optional(),
    phone: z.string().trim().min(5).optional(),
    department: z.enum(DEPARTMENTS).optional(),
    role: z.string().trim().min(1).optional(),
    joiningDate: z
      .string()
      .refine((val) => !isNaN(Date.parse(val)), {
        message: 'Invalid joining date',
      })
      .optional(),
    status: z.enum(EMPLOYEE_STATUSES).optional(),
    skills: z
      .union([z.array(z.string()), z.string()])
      .optional()
      .transform((val) => {
        if (!val) return undefined;
        if (Array.isArray(val)) return val.map((s) => s.trim()).filter(Boolean);
        return val
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean);
      }),
    leaveStart: z
      .string()
      .nullable()
      .optional()
      .refine((val) => !val || !isNaN(Date.parse(val)), {
        message: 'Invalid leave start date',
      }),
    leaveEnd: z
      .string()
      .nullable()
      .optional()
      .refine((val) => !val || !isNaN(Date.parse(val)), {
        message: 'Invalid leave end date',
      }),
  })
  .superRefine((data, ctx) => {
    if (data.status === 'On Leave') {
      if (!data.leaveStart) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Leave Start date is required when status is On Leave',
          path: ['leaveStart'],
        });
      }
      if (!data.leaveEnd) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Leave End date is required when status is On Leave',
          path: ['leaveEnd'],
        });
      }
      if (data.leaveStart && data.leaveEnd) {
        const start = new Date(data.leaveStart).getTime();
        const end = new Date(data.leaveEnd).getTime();
        if (end < start) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: 'Leave End date cannot be earlier than Leave Start date',
            path: ['leaveEnd'],
          });
        }
      }
    }
  });
