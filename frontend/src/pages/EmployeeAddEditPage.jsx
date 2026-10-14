import React, { useEffect, useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import {
  getEmployeeById,
  createEmployee,
  updateEmployee,
} from '../api/employeeApi.js';
import { useNotification } from '../context/NotificationContext.jsx';
import { LoadingSpinner } from '../components/common/LoadingSpinner.jsx';
import { z } from 'zod';
import { ArrowLeft, Save } from 'lucide-react';

const DEPARTMENTS = ['Development', 'Design', 'QA', 'HR', 'Sales'];
const STATUSES = ['Active', 'Inactive', 'On Leave'];

// Client-side Zod validation schema
const employeeFormSchema = z
  .object({
    fullName: z.string().trim().min(2, 'Full Name must be at least 2 characters'),
    email: z.string().trim().email('Invalid email address'),
    phone: z.string().trim().min(5, 'Phone number must be at least 5 digits'),
    department: z.string().min(1, 'Department is required'),
    role: z.string().trim().min(1, 'Role is required'),
    joiningDate: z.string().min(1, 'Joining Date is required'),
    status: z.enum(STATUSES),
    skills: z.string().optional(),
    leaveStart: z.string().optional(),
    leaveEnd: z.string().optional(),
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
        if (new Date(data.leaveEnd) < new Date(data.leaveStart)) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: 'Leave End date cannot be earlier than Leave Start date',
            path: ['leaveEnd'],
          });
        }
      }
    }
  });

export const EmployeeAddEditPage = () => {
  const { id } = useParams();
  const isEditMode = Boolean(id);
  const navigate = useNavigate();
  const { showSuccess, showError } = useNotification();

  const [formData, setFormData] = useState({
    employeeId: '',
    fullName: '',
    email: '',
    phone: '',
    department: 'Development',
    role: '',
    joiningDate: new Date().toISOString().split('T')[0],
    status: 'Active',
    skills: '',
    leaveStart: '',
    leaveEnd: '',
  });

  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState('');
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(isEditMode);

  // Load existing employee if editing
  useEffect(() => {
    if (!isEditMode) return;

    const fetchDetail = async () => {
      try {
        setInitialLoading(true);
        const res = await getEmployeeById(id);
        const emp = res.data.employee;
        setFormData({
          employeeId: emp.employeeId,
          fullName: emp.fullName,
          email: emp.email,
          phone: emp.phone,
          department: emp.department,
          role: emp.role,
          joiningDate: emp.joiningDate ? emp.joiningDate.split('T')[0] : '',
          status: emp.status,
          skills: emp.skills ? emp.skills.join(', ') : '',
          leaveStart: emp.leaveStart ? emp.leaveStart.split('T')[0] : '',
          leaveEnd: emp.leaveEnd ? emp.leaveEnd.split('T')[0] : '',
        });
      } catch (err) {
        showError(err.message || 'Failed to load employee details');
        navigate('/employees');
      } finally {
        setInitialLoading(false);
      }
    };

    fetchDetail();
  }, [id, isEditMode, navigate, showError]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: null }));
    }
    setServerError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setServerError('');

    // Zod validation
    const result = employeeFormSchema.safeParse(formData);
    if (!result.success) {
      const fieldErrors = {};
      result.error.issues.forEach((issue) => {
        const fieldName = issue.path[0];
        if (fieldName && !fieldErrors[fieldName]) {
          fieldErrors[fieldName] = issue.message;
        }
      });
      setErrors(fieldErrors);
      return;
    }

    try {
      setLoading(true);
      const payload = {
        ...formData,
        email: formData.email.toLowerCase(),
        skills: formData.skills
          ? formData.skills.split(',').map((s) => s.trim()).filter(Boolean)
          : [],
        leaveStart: formData.status === 'On Leave' ? formData.leaveStart : null,
        leaveEnd: formData.status === 'On Leave' ? formData.leaveEnd : null,
      };
      if (!isEditMode) {
        delete payload.employeeId;
      }

      if (isEditMode) {
        await updateEmployee(id, payload);
        showSuccess('Employee updated successfully');
      } else {
        await createEmployee(payload);
        showSuccess('Employee created successfully');
      }
      navigate('/employees');
    } catch (err) {
      setServerError(err.message || 'Submission failed');
    } finally {
      setLoading(false);
    }
  };

  if (initialLoading) {
    return <LoadingSpinner text="Loading employee..." />;
  }

  return (
    <div className="max-w-2xl mx-auto space-y-">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-gray-200 pb-3">
        <div className="flex items-center gap-2">
          <Link
            to="/employees"
            className="p-1 rounded text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <h1 className="text-xl font-bold text-gray-900 tracking-tight">
            {isEditMode ? 'Edit Employee' : 'Add Employee'}
          </h1>
        </div>
      </div>

      {/* Backend / Business rule error banner */}
      {serverError && (
        <div className="p-3.5 bg-red-50 border border-red-200 text-red-700 text-xs sm:text-sm rounded-md font-medium">
          {serverError}
        </div>
      )}

      {/* Form Card */}
      <div className="bg-white p-5 sm:p-6 rounded-lg border border-gray-200 shadow-xs">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Employee ID (Only shown in Edit mode as read-only) */}
            {isEditMode && (
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Employee ID
                </label>
                <input
                  type="text"
                  disabled
                  value={formData.employeeId}
                  className="w-full px-3 py-1.5 text-xs sm:text-sm rounded border border-gray-200 bg-gray-100 text-gray-600 font-mono cursor-not-allowed"
                />
                <span className="text-[11px] text-gray-400">System generated identifier</span>
              </div>
            )}

            {/* Full Name */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Full Name *
              </label>
              <input
                type="text"
                name="fullName"
                placeholder="Enter Full Name"
                value={formData.fullName}
                onChange={handleChange}
                className={`w-full px-3 py-1.5 text-xs sm:text-sm rounded border focus:outline-none ${errors.fullName ? 'border-red-400' : 'border-gray-300'
                  }`}
              />
              {errors.fullName && (
                <p className="mt-1 text-xs text-red-600">{errors.fullName}</p>
              )}
            </div>

            {/* Email */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Email *
              </label>
              <input
                type="email"
                name="email"
                placeholder="name@example.com"
                value={formData.email}
                onChange={handleChange}
                className={`w-full px-3 py-1.5 text-xs sm:text-sm rounded border focus:outline-none ${errors.email ? 'border-red-400' : 'border-gray-300'
                  }`}
              />
              {errors.email && (
                <p className="mt-1 text-xs text-red-600">{errors.email}</p>
              )}
            </div>

            {/* Phone */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Phone *
              </label>
              <input
                type="text"
                name="phone"
                placeholder="+91 9876543210"
                value={formData.phone}
                onChange={handleChange}
                className={`w-full px-3 py-1.5 text-xs sm:text-sm rounded border focus:outline-none ${errors.phone ? 'border-red-400' : 'border-gray-300'
                  }`}
              />
              {errors.phone && (
                <p className="mt-1 text-xs text-red-600">{errors.phone}</p>
              )}
            </div>

            {/* Department */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Department *
              </label>
              <select
                name="department"
                value={formData.department}
                onChange={handleChange}
                className="w-full px-3 py-1.5 text-xs sm:text-sm rounded border border-gray-300 bg-white focus:outline-none"
              >
                {DEPARTMENTS.map((dept) => (
                  <option key={dept} value={dept}>
                    {dept}
                  </option>
                ))}
              </select>
            </div>

            {/* Role */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Role *
              </label>
              <input
                type="text"
                name="role"
                placeholder="e.g. Senior Frontend Engineer"
                value={formData.role}
                onChange={handleChange}
                className={`w-full px-3 py-1.5 text-xs sm:text-sm rounded border focus:outline-none ${errors.role ? 'border-red-400' : 'border-gray-300'
                  }`}
              />
              {errors.role && (
                <p className="mt-1 text-xs text-red-600">{errors.role}</p>
              )}
            </div>

            {/* Joining Date */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Joining Date *
              </label>
              <input
                type="date"
                name="joiningDate"
                value={formData.joiningDate}
                onChange={handleChange}
                className="w-full px-3 py-1.5 text-xs sm:text-sm rounded border border-gray-300 bg-white focus:outline-none"
              />
            </div>

            {/* Status */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Status *
              </label>
              <select
                name="status"
                value={formData.status}
                onChange={handleChange}
                className="w-full px-3 py-1.5 text-xs sm:text-sm rounded border border-gray-300 bg-white focus:outline-none"
              >
                {STATUSES.map((st) => (
                  <option key={st} value={st}>
                    {st}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Conditional Leave Dates when Status === 'On Leave' */}
          {formData.status === 'On Leave' && (
            <div className="p-3.5 bg-amber-50/60 border border-amber-200 rounded-md grid grid-cols-1 sm:grid-cols-2 gap-3 animate-fadeIn">
              <div>
                <label className="block text-xs font-semibold text-amber-900 mb-1">
                  Leave Start Date *
                </label>
                <input
                  type="date"
                  name="leaveStart"
                  value={formData.leaveStart}
                  onChange={handleChange}
                  className={`w-full px-3 py-1.5 text-xs sm:text-sm rounded border bg-white focus:outline-none ${errors.leaveStart ? 'border-red-400' : 'border-amber-300'
                    }`}
                />
                {errors.leaveStart && (
                  <p className="mt-1 text-xs text-red-600">{errors.leaveStart}</p>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-amber-900 mb-1">
                  Leave End Date *
                </label>
                <input
                  type="date"
                  name="leaveEnd"
                  value={formData.leaveEnd}
                  onChange={handleChange}
                  className={`w-full px-3 py-1.5 text-xs sm:text-sm rounded border bg-white focus:outline-none ${errors.leaveEnd ? 'border-red-400' : 'border-amber-300'
                    }`}
                />
                {errors.leaveEnd && (
                  <p className="mt-1 text-xs text-red-600">{errors.leaveEnd}</p>
                )}
              </div>
            </div>
          )}

          {/* Skills */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">
              Skills (comma separated)
            </label>
            <input
              type="text"
              name="skills"
              placeholder="React, Node.js, TypeScript, Tailwind"
              value={formData.skills}
              onChange={handleChange}
              className="w-full px-3 py-1.5 text-xs sm:text-sm rounded border border-gray-300 bg-white focus:outline-none"
            />
          </div>

          {/* Submit Actions */}
          <div className="flex items-center justify-end gap-2 pt-3 border-t border-gray-100">
            <Link
              to="/employees"
              className="px-4 py-2 text-xs sm:text-sm font-medium rounded-md border border-gray-300 text-gray-700 hover:bg-gray-50 transition"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={loading}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs sm:text-sm font-medium rounded-md bg-[#8b3a3a] hover:bg-[#722f2f] text-white transition disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              <span>{loading ? 'Saving...' : isEditMode ? 'Update Employee' : 'Submit'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
