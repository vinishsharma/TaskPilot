import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { getEmployeeById } from '../api/employeeApi.js';
import { StatusBadge, PriorityBadge } from '../components/common/Badge.jsx';
import { LoadingSpinner } from '../components/common/LoadingSpinner.jsx';
import { useNotification } from '../context/NotificationContext.jsx';
import {
  ArrowLeft,
  Edit2,
  Mail,
  Phone,
  Building,
  Calendar,
  Briefcase,
  AlertCircle,
} from 'lucide-react';

export const EmployeeViewPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { showError } = useNotification();

  const [employee, setEmployee] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDetail = async () => {
      try {
        setLoading(true);
        const res = await getEmployeeById(id);
        setEmployee(res.data.employee);
        setTasks(res.data.tasks || []);
      } catch (err) {
        showError(err.message || 'Failed to load employee details');
        navigate('/employees');
      } finally {
        setLoading(false);
      }
    };

    fetchDetail();
  }, [id, navigate, showError]);

  if (loading) {
    return <LoadingSpinner text="Loading employee details..." />;
  }

  if (!employee) return null;

  const activeTasks = tasks.filter((t) =>
    ['Todo', 'In Progress'].includes(t.status)
  );

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-gray-200 pb-3">
        <div className="flex items-center gap-3">
          <Link
            to="/employees"
            className="p-1.5 rounded text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-gray-900 tracking-tight">
                {employee.fullName}
              </h1>
              <span className="text-xs font-mono bg-gray-100 text-gray-600 px-2 py-0.5 rounded">
                {employee.employeeId}
              </span>
            </div>
            <p className="text-xs text-gray-500 mt-0.5">
              {employee.role} &bull; {employee.department}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Link
            to={`/employees/edit/${employee._id}`}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs sm:text-sm font-medium rounded-md border border-gray-300 text-gray-700 hover:bg-gray-50 transition"
          >
            <Edit2 className="w-3.5 h-3.5" />
            Edit Profile
          </Link>
        </div>
      </div>

      {/* Main Grid: Details + Capacity Card */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* Profile Card */}
        <div className="md:col-span-2 bg-white rounded-lg border border-gray-200 p-5 shadow-xs space-y-4">
          <h2 className="text-sm font-semibold text-gray-900 border-b border-gray-100 pb-2">
            General Information
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs sm:text-sm">
            <div className="flex items-start gap-2.5">
              <Mail className="w-4 h-4 text-gray-400 mt-0.5" />
              <div>
                <span className="block text-xs text-gray-400">Email</span>
                <span className="font-medium text-gray-800">{employee.email}</span>
              </div>
            </div>

            <div className="flex items-start gap-2.5">
              <Phone className="w-4 h-4 text-gray-400 mt-0.5" />
              <div>
                <span className="block text-xs text-gray-400">Phone</span>
                <span className="font-medium text-gray-800">{employee.phone}</span>
              </div>
            </div>

            <div className="flex items-start gap-2.5">
              <Building className="w-4 h-4 text-gray-400 mt-0.5" />
              <div>
                <span className="block text-xs text-gray-400">Department</span>
                <span className="font-medium text-gray-800">
                  {employee.department}
                </span>
              </div>
            </div>

            <div className="flex items-start gap-2.5">
              <Briefcase className="w-4 h-4 text-gray-400 mt-0.5" />
              <div>
                <span className="block text-xs text-gray-400">Role</span>
                <span className="font-medium text-gray-800">{employee.role}</span>
              </div>
            </div>

            <div className="flex items-start gap-2.5">
              <Calendar className="w-4 h-4 text-gray-400 mt-0.5" />
              <div>
                <span className="block text-xs text-gray-400">Joining Date</span>
                <span className="font-medium text-gray-800">
                  {new Date(employee.joiningDate).toLocaleDateString()}
                </span>
              </div>
            </div>

            <div className="flex items-start gap-2.5">
              <div className="mt-1">
                <span className="block text-xs text-gray-400">Availability</span>
                <div className="mt-0.5">
                  <StatusBadge status={employee.status} />
                </div>
              </div>
            </div>
          </div>

          {/* Leave Information */}
          {employee.status === 'On Leave' && (
            <div className="p-3 bg-amber-50 border border-amber-200 rounded text-xs text-amber-900">
              <span className="font-semibold">On Leave Period:</span>{' '}
              {new Date(employee.leaveStart).toLocaleDateString()} &mdash;{' '}
              {new Date(employee.leaveEnd).toLocaleDateString()}
            </div>
          )}

          {/* Skills */}
          {employee.skills && employee.skills.length > 0 && (
            <div className="pt-2">
              <span className="block text-xs text-gray-400 mb-2">Skills</span>
              <div className="flex flex-wrap gap-1.5">
                {employee.skills.map((skill, index) => (
                  <span
                    key={index}
                    className="px-2 py-0.5 bg-gray-100 text-gray-700 rounded text-xs border border-gray-200"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Capacity & Workload Widget */}
        <div className="bg-white rounded-lg border border-gray-200 p-5 shadow-xs flex flex-col justify-between">
          <div>
            <h2 className="text-sm font-semibold text-gray-900 border-b border-gray-100 pb-2">
              Task Capacity
            </h2>

            <div className="my-5 text-center">
              <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gray-50 border border-gray-200">
                <span className="text-3xl font-bold text-gray-800">
                  {activeTasks.length}
                  <span className="text-base text-gray-400 font-normal">/3</span>
                </span>
              </div>
              <p className="text-xs text-gray-500 mt-2">Active Tasks Assigned</p>
            </div>

            <p className="text-xs text-gray-500 leading-relaxed text-center">
              {activeTasks.length >= 3 ? (
                <span className="text-red-600 font-medium">
                  At maximum capacity. New task assignments will be rejected.
                </span>
              ) : (
                <span>
                  Available capacity:{' '}
                  <strong className="text-gray-800">
                    {3 - activeTasks.length}
                  </strong>{' '}
                  more active task(s).
                </span>
              )}
            </p>
          </div>

          <div className="pt-4 border-t border-gray-100 text-center">
            <Link
              to="/tasks/add"
              className={`block w-full py-2 text-xs font-medium rounded text-white text-center transition ${
                activeTasks.length >= 3 || employee.status === 'Inactive'
                  ? 'bg-gray-400 cursor-not-allowed pointer-events-none'
                  : 'bg-[#8b3a3a] hover:bg-[#722f2f]'
              }`}
            >
              + Assign Task
            </Link>
          </div>
        </div>
      </div>

      {/* Assigned Tasks Table */}
      <div className="bg-white rounded-lg border border-gray-200 shadow-xs overflow-hidden">
        <div className="px-5 py-3.5 bg-gray-50 border-b border-gray-200 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-gray-900">
            Assigned Tasks History ({tasks.length})
          </h2>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 text-left text-xs sm:text-sm">
            <thead className="bg-[#1e1e24] text-white text-xs uppercase tracking-wider">
              <tr>
                <th className="px-4 py-3 font-semibold">Task ID</th>
                <th className="px-4 py-3 font-semibold">Title</th>
                <th className="px-4 py-3 font-semibold">Priority</th>
                <th className="px-4 py-3 font-semibold">Status</th>
                <th className="px-4 py-3 font-semibold">Due Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {tasks.length > 0 ? (
                tasks.map((task) => (
                  <tr key={task._id} className="hover:bg-gray-50 transition">
                    <td className="px-4 py-3 font-mono font-medium text-gray-900">
                      <Link
                        to={`/tasks/${task._id}`}
                        className="hover:underline text-gray-900"
                      >
                        {task.taskId}
                      </Link>
                    </td>
                    <td className="px-4 py-3 font-medium text-gray-800">
                      {task.title}
                    </td>
                    <td className="px-4 py-3">
                      <PriorityBadge priority={task.priority} />
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={task.status} />
                    </td>
                    <td className="px-4 py-3 text-gray-500">
                      {new Date(task.dueDate).toLocaleDateString()}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    colSpan="5"
                    className="px-4 py-6 text-center text-xs text-gray-400"
                  >
                    No tasks assigned to this employee.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
