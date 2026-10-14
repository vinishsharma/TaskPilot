import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { getTaskById, updateTaskStatus } from '../api/taskApi.js';
import { StatusBadge, PriorityBadge } from '../components/common/Badge.jsx';
import { LoadingSpinner } from '../components/common/LoadingSpinner.jsx';
import { useNotification } from '../context/NotificationContext.jsx';
import {
  ArrowLeft,
  Edit2,
  Calendar,
  Building,
  User,
  AlertTriangle,
  CheckCircle2,
  Clock,
} from 'lucide-react';

export const TaskViewPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { showSuccess, showError } = useNotification();

  const [task, setTask] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchDetail = async () => {
    try {
      setLoading(true);
      const res = await getTaskById(id);
      setTask(res.data);
    } catch (err) {
      showError(err.message || 'Failed to load task details');
      navigate('/tasks');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDetail();
  }, [id]);

  const handleStatusTransition = async (newStatus) => {
    try {
      await updateTaskStatus(task._id, newStatus);
      showSuccess(`Task status transitioned to ${newStatus}`);
      fetchDetail();
    } catch (err) {
      showError(err.message || 'Failed to update status');
    }
  };

  if (loading) {
    return <LoadingSpinner text="Loading task details..." />;
  }

  if (!task) return null;

  const isTerminalState =
    task.status === 'Completed' || task.status === 'Cancelled';

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-gray-200 pb-3">
        <div className="flex items-center gap-3">
          <Link
            to="/tasks"
            className="p-1.5 rounded text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono bg-gray-100 text-gray-600 px-2 py-0.5 rounded font-bold">
                {task.taskId}
              </span>
              <h1 className="text-xl font-bold text-gray-900 tracking-tight">
                {task.title}
              </h1>
            </div>
            <p className="text-xs text-gray-500 mt-0.5">
              Department: {task.department} &bull; Created on{' '}
              {new Date(task.createdAt).toLocaleDateString()}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {!isTerminalState && (
            <Link
              to={`/tasks/edit/${task._id}`}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs sm:text-sm font-medium rounded-md border border-gray-300 text-gray-700 hover:bg-gray-50 transition"
            >
              <Edit2 className="w-3.5 h-3.5" />
              Edit Task
            </Link>
          )}
        </div>
      </div>

      {/* Overdue Alert Banner if task is overdue */}
      {task.isOverdue && (
        <div className="p-3.5 bg-red-50 border border-red-200 rounded-md flex items-center gap-3 text-red-800 text-xs sm:text-sm">
          <AlertTriangle className="w-5 h-5 text-red-600 shrink-0" />
          <div>
            <span className="font-semibold">This task is Overdue!</span> The due date was{' '}
            {new Date(task.dueDate).toLocaleDateString()}. Please advance or resolve it.
          </div>
        </div>
      )}

      {/* Main Details Card */}
      <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-xs space-y-6">
        {/* Status Transition Bar */}
        <div className="p-4 bg-gray-50 rounded-lg border border-gray-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-500 font-medium">Current Status:</span>
            <StatusBadge status={task.status} />
            <PriorityBadge priority={task.priority} />
          </div>

          {/* Action buttons for allowed next status transitions */}
          {task.nextAllowedStatuses && task.nextAllowedStatuses.length > 0 ? (
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-400">Change status to:</span>
              {task.nextAllowedStatuses.map((st) => (
                <button
                  key={st}
                  onClick={() => handleStatusTransition(st)}
                  className={`px-3 py-1 rounded text-xs font-semibold transition ${
                    st === 'Completed'
                      ? 'bg-emerald-600 text-white hover:bg-emerald-700'
                      : st === 'Cancelled'
                      ? 'bg-red-600 text-white hover:bg-red-700'
                      : 'bg-blue-600 text-white hover:bg-blue-700'
                  }`}
                >
                  {st}
                </button>
              ))}
            </div>
          ) : (
            <span className="text-xs text-gray-400 italic">
              Status is locked ({task.status})
            </span>
          )}
        </div>

        {/* Assigned Employee Details */}
        <div>
          <h2 className="text-xs uppercase font-semibold text-gray-400 tracking-wider mb-2">
            Assigned Personnel
          </h2>
          <div className="p-4 rounded-md border border-gray-100 bg-gray-50/50 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-neutral-800 text-white flex items-center justify-center font-bold text-sm">
                {(task.employeeSnapshot?.fullName || 'U').charAt(0)}
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-900">
                  {task.employeeSnapshot?.fullName || 'Unassigned'}
                </p>
                <p className="text-xs text-gray-500">
                  {task.employeeSnapshot?.employeeId && (
                    <span>ID: {task.employeeSnapshot.employeeId} &bull; </span>
                  )}
                  {task.employeeSnapshot?.email || 'No email available'}
                </p>
              </div>
            </div>

            {task.assignedEmployee?._id && (
              <Link
                to={`/employees/${task.assignedEmployee._id}`}
                className="text-xs text-blue-600 hover:underline font-medium"
              >
                View Profile &rarr;
              </Link>
            )}
          </div>
        </div>

        {/* Dates & Timeline */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2 border-t border-gray-100 text-xs sm:text-sm">
          <div>
            <span className="block text-xs text-gray-400">Start Date</span>
            <div className="flex items-center gap-1.5 mt-1 text-gray-800 font-medium">
              <Calendar className="w-4 h-4 text-gray-400" />
              <span>{new Date(task.startDate).toLocaleDateString()}</span>
            </div>
          </div>

          <div>
            <span className="block text-xs text-gray-400">Due Date</span>
            <div className="flex items-center gap-1.5 mt-1 text-gray-800 font-medium">
              <Clock className="w-4 h-4 text-gray-400" />
              <span className={task.isOverdue ? 'text-red-600 font-semibold' : ''}>
                {new Date(task.dueDate).toLocaleDateString()}
              </span>
            </div>
          </div>

          <div>
            <span className="block text-xs text-gray-400">Completed Date</span>
            <div className="flex items-center gap-1.5 mt-1 text-gray-800 font-medium">
              <CheckCircle2 className="w-4 h-4 text-gray-400" />
              <span>
                {task.completedDate
                  ? new Date(task.completedDate).toLocaleDateString()
                  : 'Not Completed'}
              </span>
            </div>
          </div>
        </div>

        {/* Description */}
        <div className="pt-2 border-t border-gray-100">
          <h2 className="text-xs uppercase font-semibold text-gray-400 tracking-wider mb-2">
            Description
          </h2>
          <div className="p-4 bg-gray-50/70 rounded-md border border-gray-100 text-xs sm:text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">
            {task.description ? task.description : 'No description provided.'}
          </div>
        </div>
      </div>
    </div>
  );
};
