import React, { useEffect, useState } from 'react';
import { getDashboardMetrics } from '../api/dashboardApi.js';
import { LoadingSpinner } from '../components/common/LoadingSpinner.jsx';
import { useNotification } from '../context/NotificationContext.jsx';
import { Users, CheckCircle2, Clock, AlertCircle } from 'lucide-react';

export const DashboardPage = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const { showError } = useNotification();

  useEffect(() => {
    const fetchMetrics = async () => {
      try {
        setLoading(true);
        const res = await getDashboardMetrics();
        setData(res.data);
      } catch (err) {
        showError(err.message || 'Failed to load dashboard metrics');
      } finally {
        setLoading(false);
      }
    };

    fetchMetrics();
  }, [showError]);

  if (loading) {
    return <LoadingSpinner text="Calculating metrics from server..." />;
  }

  if (!data) {
    return (
      <div className="text-center py-12 text-sm text-gray-500">
        No dashboard data available. Make sure your backend is running.
      </div>
    );
  }

  const { employees, tasks, workload } = data;

  return (
    <div className="space-y-6">
      <div className="border-b border-gray-200 pb-3">
        <h1 className="text-xl sm:text-2xl font-bold text-gray-900 tracking-tight">
          Dashboard
        </h1>
      </div>

      {/* Employee Metrics Row */}
      <div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
          <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-xs">
            <p className="text-xs font-medium text-gray-500">Total Employees</p>
            <p className="text-2xl sm:text-3xl font-bold text-gray-900 mt-1">
              {employees.total}
            </p>
          </div>
          <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-xs">
            <p className="text-xs font-medium text-gray-500">Active</p>
            <p className="text-2xl sm:text-3xl font-bold text-emerald-600 mt-1">
              {employees.active}
            </p>
          </div>
          <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-xs">
            <p className="text-xs font-medium text-gray-500">Inactive</p>
            <p className="text-2xl sm:text-3xl font-bold text-gray-600 mt-1">
              {employees.inactive}
            </p>
          </div>
          <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-xs">
            <p className="text-xs font-medium text-gray-500">On Leave</p>
            <p className="text-2xl sm:text-3xl font-bold text-amber-600 mt-1">
              {employees.onLeave}
            </p>
          </div>
        </div>
      </div>

      {/* Task Metrics Row */}
      <div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
          <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-xs">
            <p className="text-xs font-medium text-gray-500">Total Tasks</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">{tasks.total}</p>
          </div>
          <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-xs">
            <p className="text-xs font-medium text-gray-500">Todo</p>
            <p className="text-2xl font-bold text-gray-700 mt-1">{tasks.todo}</p>
          </div>
          <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-xs">
            <p className="text-xs font-medium text-gray-500">In Progress</p>
            <p className="text-2xl font-bold text-blue-600 mt-1">
              {tasks.inProgress}
            </p>
          </div>
          <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-xs">
            <p className="text-xs font-medium text-gray-500">Completed</p>
            <p className="text-2xl font-bold text-emerald-600 mt-1">
              {tasks.completed}
            </p>
          </div>
          <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-xs">
            <p className="text-xs font-medium text-gray-500">Cancelled</p>
            <p className="text-2xl font-bold text-red-500 mt-1">
              {tasks.cancelled}
            </p>
          </div>
          <div className="bg-white p-4 rounded-lg border border-red-200 shadow-xs bg-red-50/30">
            <p className="text-xs font-medium text-red-600">Overdue</p>
            <p className="text-2xl font-bold text-red-600 mt-1">
              {tasks.overdue}
            </p>
          </div>
        </div>
      </div>

      {/* Employee Workload Table */}
      <div className="bg-white rounded-lg border border-gray-200 shadow-xs overflow-hidden">
        <div className="px-5 py-3.5 bg-gray-50 border-b border-gray-200 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-gray-900">
            Employee Workload
          </h2>
          <span className="text-xs text-gray-500">Active Tasks (Todo + In Progress)</span>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 text-left text-sm">
            <thead className="bg-[#1e1e24] text-white text-xs uppercase tracking-wider">
              <tr>
                <th className="px-5 py-2.5 font-semibold">Employee</th>
                <th className="px-5 py-2.5 font-semibold text-right">
                  Active Tasks
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {workload && workload.length > 0 ? (
                workload.map((w, idx) => (
                  <tr key={idx} className="hover:bg-gray-50/70 transition">
                    <td className="px-5 py-3 font-medium text-gray-900">
                      {w.employeeName}
                    </td>
                    <td className="px-5 py-3 text-right">
                      <span
                        className={`inline-block font-semibold px-2 py-0.5 rounded text-xs ${
                          w.activeTasks >= 3
                            ? 'bg-red-100 text-red-800'
                            : 'bg-gray-100 text-gray-700'
                        }`}
                      >
                        {w.activeTasks} / 3
                      </span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    colSpan="2"
                    className="px-5 py-6 text-center text-xs text-gray-400"
                  >
                    No active employee assignments yet.
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
