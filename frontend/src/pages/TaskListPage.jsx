import React, { useEffect, useState, useCallback } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import {
  getTasks,
  updateTaskStatus,
  deleteTask,
  exportTasksCSV,
} from '../api/taskApi.js';
import { PriorityBadge, StatusBadge } from '../components/common/Badge.jsx';
import { Pagination } from '../components/common/Pagination.jsx';
import { LoadingSpinner } from '../components/common/LoadingSpinner.jsx';
import { ConfirmModal } from '../components/common/ConfirmModal.jsx';
import { useNotification } from '../context/NotificationContext.jsx';
import {
  Search,
  Plus,
  Download,
  MoreVertical,
  Eye,
  Edit2,
  Trash2,
  ChevronDown,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
} from 'lucide-react';

const DEPARTMENTS = ['All', 'Development', 'Design', 'QA', 'HR', 'Sales'];
const PRIORITIES = ['All', 'Critical', 'High', 'Medium', 'Low'];
const STATUSES = ['All', 'Todo', 'In Progress', 'Completed', 'Cancelled'];

const SORT_OPTIONS = [
  { value: 'createdAt:desc', label: 'Created: Newest First' },
  { value: 'createdAt:asc', label: 'Created: Oldest First' },
  { value: 'dueDate:asc', label: 'Due Date: Earliest First' },
  { value: 'dueDate:desc', label: 'Due Date: Latest First' },
  { value: 'priority:desc', label: 'Priority: High to Low' },
  { value: 'priority:asc', label: 'Priority: Low to High' },
  { value: 'title:asc', label: 'Title: A to Z' },
  { value: 'title:desc', label: 'Title: Z to A' },
];

export const TaskListPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const { showSuccess, showError } = useNotification();

  const [tasks, setTasks] = useState([]);
  const [pagination, setPagination] = useState({
    page: 1,
    total: 0,
    totalPages: 1,
    limit: 10,
  });
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);

  // Active status dropdown row ID
  const [statusDropdownId, setStatusDropdownId] = useState(null);
  // Active action menu row ID
  const [actionMenuId, setActionMenuId] = useState(null);

  // Delete modal state
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Read URL search params
  const search = searchParams.get('search') || '';
  const department = searchParams.get('department') || 'All';
  const priority = searchParams.get('priority') || 'All';
  const status = searchParams.get('status') || 'All';
  const dueDateFrom = searchParams.get('dueDateFrom') || '';
  const dueDateTo = searchParams.get('dueDateTo') || '';
  const sortBy = searchParams.get('sortBy') || 'createdAt';
  const order = searchParams.get('order') || 'desc';
  const page = parseInt(searchParams.get('page') || '1', 10);

  const [searchInput, setSearchInput] = useState(search);

  useEffect(() => {
    setSearchInput(search);
  }, [search]);

  // Fetch tasks based on active URL parameters including sorting
  const fetchTasks = useCallback(async () => {
    try {
      setLoading(true);
      const res = await getTasks({
        page,
        limit: 10,
        search,
        department,
        priority,
        status,
        dueDateFrom,
        dueDateTo,
        sortBy,
        order,
      });
      setTasks(res.data);
      setPagination(res.pagination);
    } catch (err) {
      showError(err.message || 'Failed to load tasks');
    } finally {
      setLoading(false);
    }
  }, [
    page,
    search,
    department,
    priority,
    status,
    dueDateFrom,
    dueDateTo,
    sortBy,
    order,
    showError,
  ]);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  // Close menus on outside click
  useEffect(() => {
    const handleOutsideClick = () => {
      setStatusDropdownId(null);
      setActionMenuId(null);
    };
    window.addEventListener('click', handleOutsideClick);
    return () => window.removeEventListener('click', handleOutsideClick);
  }, []);

  const updateFilters = (newParams) => {
    const nextParams = new URLSearchParams(searchParams);
    Object.entries(newParams).forEach(([k, v]) => {
      if (
        v === '' ||
        v === 'All' ||
        (k === 'page' && v === 1) ||
        (k === 'sortBy' && v === 'createdAt' && nextParams.get('order') === 'desc')
      ) {
        nextParams.delete(k);
      } else {
        nextParams.set(k, v);
      }
    });
    setSearchParams(nextParams);
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    updateFilters({ search: searchInput, page: 1 });
  };

  // Toggle sorting by column
  const handleSort = (column) => {
    let nextOrder = 'asc';
    if (sortBy === column) {
      nextOrder = order === 'asc' ? 'desc' : 'asc';
    } else {
      nextOrder = column === 'title' ? 'asc' : 'desc';
    }
    updateFilters({ sortBy: column, order: nextOrder, page: 1 });
  };

  const handleSortDropdownChange = (e) => {
    const [newSortBy, newOrder] = e.target.value.split(':');
    updateFilters({ sortBy: newSortBy, order: newOrder, page: 1 });
  };

  const renderSortIndicator = (column) => {
    if (sortBy !== column) {
      return <ArrowUpDown className="w-3.5 h-3.5 text-gray-500 opacity-60" />;
    }
    return order === 'asc' ? (
      <ArrowUp className="w-3.5 h-3.5 text-white" />
    ) : (
      <ArrowDown className="w-3.5 h-3.5 text-white" />
    );
  };

  const handleStatusChange = async (taskId, newStatus) => {
    try {
      setStatusDropdownId(null);
      await updateTaskStatus(taskId, newStatus);
      showSuccess(`Task updated to ${newStatus}`);
      fetchTasks();
    } catch (err) {
      showError(err.message || 'Failed to update task status');
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      setIsDeleting(true);
      await deleteTask(deleteTarget._id);
      showSuccess('Task deleted successfully.');
      setDeleteTarget(null);
      fetchTasks();
    } catch (err) {
      showError(err.message || 'Failed to delete task');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleExportCSV = async () => {
    try {
      setExporting(true);
      const blob = await exportTasksCSV({
        search,
        department,
        priority,
        status,
        dueDateFrom,
        dueDateTo,
        sortBy,
        order,
      });
      const url = window.URL.createObjectURL(new Blob([blob]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `tasks-export-${Date.now()}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      showSuccess('CSV exported successfully');
    } catch (err) {
      showError(err.message || 'Failed to export CSV');
    } finally {
      setExporting(false);
    }
  };

  const currentSortValue = `${sortBy}:${order}`;

  return (
    <div className="space-y-4">
      {/* Top Search & Action Buttons Bar */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        {/* Search */}
        <form onSubmit={handleSearchSubmit} className="flex gap-2 flex-1 max-w-md">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search title or employee"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs sm:text-sm bg-white border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-gray-400"
            />
          </div>
          <button
            type="submit"
            className="px-3.5 py-1.5 bg-[#8b3a3a] hover:bg-[#722f2f] text-white text-xs sm:text-sm font-medium rounded-md transition"
          >
            Search
          </button>
        </form>

        {/* Buttons */}
        <div className="flex items-center gap-2">
          <Link
            to="/tasks/add"
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-[#8b3a3a] hover:bg-[#722f2f] text-white text-xs sm:text-sm font-medium rounded-md transition"
          >
            <Plus className="w-4 h-4" />
            <span>Add Task</span>
          </Link>
          <button
            onClick={handleExportCSV}
            disabled={exporting}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-[#8b3a3a] hover:bg-[#722f2f] text-white text-xs sm:text-sm font-medium rounded-md transition disabled:opacity-50"
          >
            <Download className="w-4 h-4" />
            <span>{exporting ? 'Exporting...' : 'Export To Csv'}</span>
          </button>
        </div>
      </div>

      {/* Filter & Sort Row matching PDF */}
      <div className="flex flex-wrap items-center gap-2 text-xs">
        <select
          value={department}
          onChange={(e) => updateFilters({ department: e.target.value, page: 1 })}
          className="bg-white border border-gray-300 rounded px-2.5 py-1 text-gray-700 focus:outline-none"
        >
          {DEPARTMENTS.map((d) => (
            <option key={d} value={d}>
              {d === 'All' ? 'Department' : d}
            </option>
          ))}
        </select>

        <select
          value={priority}
          onChange={(e) => updateFilters({ priority: e.target.value, page: 1 })}
          className="bg-white border border-gray-300 rounded px-2.5 py-1 text-gray-700 focus:outline-none"
        >
          {PRIORITIES.map((p) => (
            <option key={p} value={p}>
              {p === 'All' ? 'Priority' : p}
            </option>
          ))}
        </select>

        <select
          value={status}
          onChange={(e) => updateFilters({ status: e.target.value, page: 1 })}
          className="bg-white border border-gray-300 rounded px-2.5 py-1 text-gray-700 focus:outline-none"
        >
          {STATUSES.map((s) => (
            <option key={s} value={s}>
              {s === 'All' ? 'Status' : s}
            </option>
          ))}
        </select>

        {/* Due Date Range */}
        <div className="flex items-center gap-1 bg-white border border-gray-300 rounded px-2 py-0.5 text-gray-600">
          <span className="text-[11px] text-gray-400">Due:</span>
          <input
            type="date"
            value={dueDateFrom}
            onChange={(e) => updateFilters({ dueDateFrom: e.target.value, page: 1 })}
            className="text-xs bg-transparent focus:outline-none"
            placeholder="from"
          />
          <span className="text-gray-400">&ndash;</span>
          <input
            type="date"
            value={dueDateTo}
            onChange={(e) => updateFilters({ dueDateTo: e.target.value, page: 1 })}
            className="text-xs bg-transparent focus:outline-none"
            placeholder="to"
          />
        </div>

        {/* Quick Sort Dropdown */}
        <div className="flex items-center gap-1 bg-white border border-gray-300 rounded px-2 py-1 text-gray-700">
          <span className="text-[11px] text-gray-400">Sort:</span>
          <select
            value={currentSortValue}
            onChange={handleSortDropdownChange}
            className="text-xs bg-transparent focus:outline-none text-gray-700 font-medium cursor-pointer"
          >
            {SORT_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        {(department !== 'All' ||
          priority !== 'All' ||
          status !== 'All' ||
          search ||
          dueDateFrom ||
          dueDateTo ||
          sortBy !== 'createdAt' ||
          order !== 'desc') && (
            <button
              onClick={() => setSearchParams({})}
              className="text-xs text-red-600 hover:underline px-1 py-1"
            >
              Clear all
            </button>
          )}
      </div>

      {/* Task Listing Table matching PDF */}
      <div className="bg-white rounded-lg border border-gray-200 shadow-xs overflow-hidden">
        {loading ? (
          <LoadingSpinner text="Loading tasks..." />
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 text-left text-xs sm:text-sm">
              <thead className="bg-[#1e1e24] text-white text-xs uppercase tracking-wider">
                <tr>
                  <th className="px-4 py-3 font-semibold">ID</th>

                  {/* Sortable: Title */}
                  <th
                    onClick={() => handleSort('title')}
                    className="px-4 py-3 font-semibold cursor-pointer select-none hover:bg-neutral-800 transition"
                    title="Sort by Title"
                  >
                    <div className="flex items-center gap-1.5">
                      <span>Title</span>
                      {renderSortIndicator('title')}
                    </div>
                  </th>

                  <th className="px-4 py-3 font-semibold">Employee</th>

                  {/* Sortable: Priority (by importance) */}
                  <th
                    onClick={() => handleSort('priority')}
                    className="px-4 py-3 font-semibold cursor-pointer select-none hover:bg-neutral-800 transition"
                    title="Sort by Priority (Importance)"
                  >
                    <div className="flex items-center gap-1.5">
                      <span>Priority</span>
                      {renderSortIndicator('priority')}
                    </div>
                  </th>

                  <th className="px-4 py-3 font-semibold">Status</th>

                  {/* Sortable: Due Date */}
                  <th
                    onClick={() => handleSort('dueDate')}
                    className="px-4 py-3 font-semibold cursor-pointer select-none hover:bg-neutral-800 transition"
                    title="Sort by Due Date"
                  >
                    <div className="flex items-center gap-1.5">
                      <span>Due Date</span>
                      {renderSortIndicator('dueDate')}
                    </div>
                  </th>

                  <th className="px-4 py-3 font-semibold text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {tasks && tasks.length > 0 ? (
                  tasks.map((task) => (
                    <tr key={task._id} className="hover:bg-gray-50/70 transition">
                      {/* ID */}
                      <td className="px-4 py-3 font-mono font-medium text-gray-900 whitespace-nowrap">
                        <Link
                          to={`/tasks/${task._id}`}
                          className="hover:underline text-gray-900 font-semibold"
                        >
                          {task.taskId}
                        </Link>
                      </td>

                      {/* Title */}
                      <td className="px-4 py-3 font-medium text-gray-900 max-w-[200px] truncate">
                        <Link
                          to={`/tasks/${task._id}`}
                          className="hover:underline text-gray-900"
                        >
                          {task.title}
                        </Link>
                      </td>

                      {/* Employee */}
                      <td className="px-4 py-3 text-gray-700 whitespace-nowrap">
                        {task.employeeSnapshot?.fullName || 'Unassigned'}
                      </td>

                      {/* Priority */}
                      <td className="px-4 py-3 whitespace-nowrap">
                        <PriorityBadge priority={task.priority} />
                      </td>

                      {/* Status Dropdown (valid next statuses only) */}
                      <td className="px-4 py-3 relative whitespace-nowrap">
                        {task.nextAllowedStatuses && task.nextAllowedStatuses.length > 0 ? (
                          <div className="inline-block relative">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setStatusDropdownId(
                                  statusDropdownId === task._id ? null : task._id
                                );
                              }}
                              className="inline-flex justify-center items-center gap-1 px-2.5 py-1 rounded text-xs font-medium border bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100 transition min-w-32"
                            >
                              <span>{task.status}</span>
                              <ChevronDown className="w-3 h-3 text-blue-600" />
                            </button>

                            {/* Dropdown Options */}
                            {statusDropdownId === task._id && (
                              <div
                                onClick={(e) => e.stopPropagation()}
                                className="inline-block absolute left-32 bottom-0 mt-1 min-w-32 bg-white border border-gray-200 rounded-md shadow-lg z-20 py-1 text-xs"
                              >
                                {task.nextAllowedStatuses.map((nextSt) => (
                                  <button
                                    key={nextSt}
                                    onClick={() => handleStatusChange(task._id, nextSt)}
                                    className="w-full text-left px-3 py-1.5 hover:bg-gray-100 text-gray-700 font-medium flex flex-col"
                                  >
                                    {nextSt}
                                  </button>
                                ))}
                              </div>
                            )}
                          </div>
                        ) : (
                          <StatusBadge status={task.status} />
                        )}
                      </td>

                      {/* Due Date with consistent (Overdue) highlight */}
                      <td className="px-4 py-3 whitespace-nowrap text-xs">
                        <span
                          className={
                            task.isOverdue
                              ? 'text-red-600 font-semibold'
                              : 'text-gray-600'
                          }
                        >
                          {new Date(task.dueDate).toLocaleDateString('en-GB', {
                            day: '2-digit',
                            month: 'short',
                          })}
                          {task.isOverdue && ' (Overdue)'}
                        </span>
                      </td>

                      {/* Action Menu */}
                      <td className="px-4 py-3 text-right relative whitespace-nowrap">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setActionMenuId(actionMenuId === task._id ? null : task._id);
                          }}
                          className="p-1 text-gray-400 hover:text-gray-700 rounded hover:bg-gray-100"
                        >
                          <MoreVertical className="w-4 h-4" />
                        </button>

                        {actionMenuId === task._id && (
                          <div
                            onClick={(e) => e.stopPropagation()}
                            className="absolute right-10 bottom-0 mt-1 w-28 bg-white border border-gray-200 rounded-md shadow-lg z-20 py-1 text-xs text-left"
                          >
                            <button
                              onClick={() => {
                                setActionMenuId(null);
                                navigate(`/tasks/${task._id}`);
                              }}
                              className="w-full flex items-center gap-2 px-3 py-1.5 hover:bg-gray-50 text-gray-700"
                            >
                              <Eye className="w-3.5 h-3.5" />
                              View
                            </button>
                            {task.status !== 'Completed' && task.status !== 'Cancelled' && (
                              <button
                                onClick={() => {
                                  setActionMenuId(null);
                                  navigate(`/tasks/edit/${task._id}`);
                                }}
                                className="w-full flex items-center gap-2 px-3 py-1.5 hover:bg-gray-50 text-gray-700"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                                Edit
                              </button>
                            )}
                            <button
                              onClick={() => {
                                setActionMenuId(null);
                                setDeleteTarget(task);
                              }}
                              className="w-full flex items-center gap-2 px-3 py-1.5 hover:bg-red-50 text-red-600"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                              Delete
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="7" className="px-4 py-8 text-center text-xs text-gray-400">
                      No tasks found matching the filter criteria.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        <Pagination
          currentPage={pagination.page}
          totalPages={pagination.totalPages}
          totalItems={pagination.total}
          pageSize={pagination.limit}
          onPageChange={(newPage) => updateFilters({ page: newPage })}
          itemLabel="tasks"
        />
      </div>

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={Boolean(deleteTarget)}
        title="Delete Task"
        message={`Are you sure you want to delete task "${deleteTarget?.taskId} - ${deleteTarget?.title}"?`}
        confirmText="Delete Task"
        confirmVariant="danger"
        isLoading={isDeleting}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
};
