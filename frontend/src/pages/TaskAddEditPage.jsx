import React, { useEffect, useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { getTaskById, createTask, updateTask } from '../api/taskApi.js';
import { getAllEmployees } from '../api/employeeApi.js';
import { useNotification } from '../context/NotificationContext.jsx';
import { LoadingSpinner } from '../components/common/LoadingSpinner.jsx';
import { z } from 'zod';
import { ArrowLeft, Save } from 'lucide-react';

const DEPARTMENTS = ['Development', 'Design', 'QA', 'HR', 'Sales'];
const PRIORITIES = ['Low', 'Medium', 'High', 'Critical'];

// Zod schema for task form
const taskFormSchema = z
  .object({
    title: z.string().trim().min(2, 'Title must be at least 2 characters'),
    description: z.string().optional(),
    assignedEmployee: z.string().min(1, 'Please select an assigned employee'),
    department: z.string().min(1, 'Please select a department'),
    priority: z.enum(PRIORITIES),
    startDate: z.string().min(1, 'Start Date is required'),
    dueDate: z.string().min(1, 'Due Date is required'),
  })
  .superRefine((data, ctx) => {
    if (data.startDate && data.dueDate) {
      if (new Date(data.dueDate) < new Date(data.startDate)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Due Date cannot be earlier than Start Date',
          path: ['dueDate'],
        });
      }
    }
  });

export const TaskAddEditPage = () => {
  const { id } = useParams();
  const isEditMode = Boolean(id);
  const navigate = useNavigate();
  const { showSuccess, showError } = useNotification();

  const [employees, setEmployees] = useState([]);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    assignedEmployee: '',
    department: 'Development',
    priority: 'Medium',
    startDate: new Date().toISOString().split('T')[0],
    dueDate: new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0],
  });

  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState('');
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);

  // Load employee dropdown list & existing task if editing
  useEffect(() => {
    const initData = async () => {
      try {
        setInitialLoading(true);
        const empRes = await getAllEmployees();
        setEmployees(empRes.data || []);

        if (isEditMode) {
          const taskRes = await getTaskById(id);
          const t = taskRes.data;

          if (t.status === 'Completed' || t.status === 'Cancelled') {
            showError(`Completed and Cancelled tasks cannot be edited.`);
            navigate('/tasks');
            return;
          }

          setFormData({
            title: t.title,
            description: t.description || '',
            assignedEmployee: t.assignedEmployee?._id || '',
            department: t.department,
            priority: t.priority,
            startDate: t.startDate ? t.startDate.split('T')[0] : '',
            dueDate: t.dueDate ? t.dueDate.split('T')[0] : '',
          });
        }
      } catch (err) {
        showError(err.message || 'Failed to initialize form');
        navigate('/tasks');
      } finally {
        setInitialLoading(false);
      }
    };

    initData();
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
    const result = taskFormSchema.safeParse(formData);
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
      if (isEditMode) {
        await updateTask(id, formData);
        showSuccess('Task updated successfully');
      } else {
        await createTask(formData);
        showSuccess('Task created successfully');
      }
      navigate('/tasks');
    } catch (err) {
      // Show backend business rule error banner (matching screenshot on page 3)
      setServerError(err.message || 'Failed to save task');
    } finally {
      setLoading(false);
    }
  };

  if (initialLoading) {
    return <LoadingSpinner text="Loading task..." />;
  }

  return (
    <div className="max-w-2xl mx-auto space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-gray-200 pb-3">
        <div className="flex items-center gap-2">
          <Link
            to="/tasks"
            className="p-1 rounded text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <h1 className="text-xl font-bold text-gray-900 tracking-tight">
            {isEditMode ? 'Edit Task' : 'Add Task'}
          </h1>
        </div>
      </div>

      {/* Form Card matching screenshot on page 3 */}
      <div className="bg-white p-6 sm:p-7 rounded-lg border border-gray-200 shadow-xs">
        <h2 className="text-lg font-bold text-center text-gray-900 mb-6">
          {isEditMode ? 'Edit Task' : 'Add Task'}
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Title */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Title
              </label>
              <input
                type="text"
                name="title"
                placeholder="Enter Title"
                value={formData.title}
                onChange={handleChange}
                className={`w-full px-3 py-2 text-xs sm:text-sm rounded border focus:outline-none ${
                  errors.title ? 'border-red-400' : 'border-gray-300'
                }`}
              />
              {errors.title && (
                <p className="mt-1 text-xs text-red-600">{errors.title}</p>
              )}
            </div>

            {/* Assigned Employee */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Assigned Employee
              </label>
              <select
                name="assignedEmployee"
                value={formData.assignedEmployee}
                onChange={handleChange}
                className={`w-full px-3 py-2 text-xs sm:text-sm rounded border bg-white focus:outline-none ${
                  errors.assignedEmployee ? 'border-red-400' : 'border-gray-300'
                }`}
              >
                <option value="">Select...</option>
                {employees.map((emp) => (
                  <option key={emp._id} value={emp._id}>
                    {emp.fullName} ({emp.employeeId}) &mdash; {emp.status}
                  </option>
                ))}
              </select>
              {errors.assignedEmployee && (
                <p className="mt-1 text-xs text-red-600">{errors.assignedEmployee}</p>
              )}
            </div>

            {/* Priority */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Priority
              </label>
              <select
                name="priority"
                value={formData.priority}
                onChange={handleChange}
                className="w-full px-3 py-2 text-xs sm:text-sm rounded border border-gray-300 bg-white focus:outline-none"
              >
                {PRIORITIES.map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </select>
            </div>

            {/* Department */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Department
              </label>
              <select
                name="department"
                value={formData.department}
                onChange={handleChange}
                className="w-full px-3 py-2 text-xs sm:text-sm rounded border border-gray-300 bg-white focus:outline-none"
              >
                {DEPARTMENTS.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>
            </div>

            {/* Start Date */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Start Date
              </label>
              <input
                type="date"
                name="startDate"
                value={formData.startDate}
                onChange={handleChange}
                className={`w-full px-3 py-2 text-xs sm:text-sm rounded border bg-white focus:outline-none ${
                  errors.startDate ? 'border-red-400' : 'border-gray-300'
                }`}
              />
              {errors.startDate && (
                <p className="mt-1 text-xs text-red-600">{errors.startDate}</p>
              )}
            </div>

            {/* Due Date */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Due Date
              </label>
              <input
                type="date"
                name="dueDate"
                value={formData.dueDate}
                onChange={handleChange}
                className={`w-full px-3 py-2 text-xs sm:text-sm rounded border bg-white focus:outline-none ${
                  errors.dueDate ? 'border-red-400' : 'border-gray-300'
                }`}
              />
              {errors.dueDate && (
                <p className="mt-1 text-xs text-red-600">{errors.dueDate}</p>
              )}
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">
              Description
            </label>
            <textarea
              name="description"
              rows="3"
              placeholder="Enter Description"
              value={formData.description}
              onChange={handleChange}
              className="w-full px-3 py-2 text-xs sm:text-sm rounded border border-gray-300 bg-white focus:outline-none"
            />
          </div>

          {/* Backend Business Rule Error Banner (exact styling from PDF page 3) */}
          {serverError && (
            <div className="p-3 bg-red-50 border border-red-300 text-red-700 text-xs sm:text-sm rounded font-medium text-center">
              {serverError}
            </div>
          )}

          {/* Submit Button */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 px-4 bg-[#8b3a3a] hover:bg-[#722f2f] text-white text-xs sm:text-sm font-semibold rounded transition disabled:opacity-50"
            >
              {loading ? 'Submitting...' : isEditMode ? 'Update Task' : 'Submit'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
