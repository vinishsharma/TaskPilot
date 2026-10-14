import React, { useEffect, useState, useCallback } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { getEmployees, deleteEmployee } from '../api/employeeApi.js';
import { StatusBadge } from '../components/common/Badge.jsx';
import { Pagination } from '../components/common/Pagination.jsx';
import { LoadingSpinner } from '../components/common/LoadingSpinner.jsx';
import { ConfirmModal } from '../components/common/ConfirmModal.jsx';
import { useNotification } from '../context/NotificationContext.jsx';
import {
  Search,
  Plus,
  MoreVertical,
  Eye,
  Edit2,
  Trash2,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
} from 'lucide-react';

const DEPARTMENTS = ['All', 'Development', 'Design', 'QA', 'HR', 'Sales'];
const STATUSES = ['All', 'Active', 'Inactive', 'On Leave'];

const SORT_OPTIONS = [
  { value: 'createdAt:desc', label: 'Added: Newest First' },
  { value: 'createdAt:asc', label: 'Added: Oldest First' },
  { value: 'fullName:asc', label: 'Name: A to Z' },
  { value: 'fullName:desc', label: 'Name: Z to A' },
  { value: 'department:asc', label: 'Department: A to Z' },
  { value: 'employeeId:asc', label: 'ID: Low to High' },
];

export const EmployeeListPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const { showSuccess, showError } = useNotification();

  const [employees, setEmployees] = useState([]);
  const [pagination, setPagination] = useState({
    page: 1,
    total: 0,
    totalPages: 1,
    limit: 10,
  });
  const [loading, setLoading] = useState(true);

  // Active action menu
  const [actionMenuId, setActionMenuId] = useState(null);

  // Delete modal state
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Read current query state from URL
  const search = searchParams.get('search') || '';
  const department = searchParams.get('department') || 'All';
  const status = searchParams.get('status') || 'All';
  const sortBy = searchParams.get('sortBy') || 'createdAt';
  const order = searchParams.get('order') || 'desc';
  const page = parseInt(searchParams.get('page') || '1', 10);

  const [searchInput, setSearchInput] = useState(search);

  // Sync search input if URL changes
  useEffect(() => {
    setSearchInput(search);
  }, [search]);

  // Fetch employees when URL params change
  const fetchEmployees = useCallback(async () => {
    try {
      setLoading(true);
      const res = await getEmployees({
        page,
        limit: 10,
        search,
        department,
        status,
        sortBy,
        order,
      });
      setEmployees(res.data);
      setPagination(res.pagination);
    } catch (err) {
      showError(err.message || 'Failed to fetch employees');
    } finally {
      setLoading(false);
    }
  }, [page, search, department, status, sortBy, order, showError]);

  useEffect(() => {
    fetchEmployees();
  }, [fetchEmployees]);

  // Close action menus when clicking outside
  useEffect(() => {
    const handleOutsideClick = () => setActionMenuId(null);
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

  const handlePageChange = (newPage) => {
    updateFilters({ page: newPage });
  };

  const handleSort = (column) => {
    let nextOrder = 'asc';
    if (sortBy === column) {
      nextOrder = order === 'asc' ? 'desc' : 'asc';
    } else {
      nextOrder = column === 'fullName' ? 'asc' : 'desc';
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

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      setIsDeleting(true);
      await deleteEmployee(deleteTarget._id);
      showSuccess('Employee deleted successfully.');
      setDeleteTarget(null);
      fetchEmployees();
    } catch (err) {
      showError(err.message || 'Failed to delete employee');
    } finally {
      setIsDeleting(false);
    }
  };

  const currentSortValue = `${sortBy}:${order}`;

  return (
    <div className="space-y-4">
      {/* Top Filter and Actions Bar */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        {/* Search Bar */}
        <form onSubmit={handleSearchSubmit} className="flex gap-2 flex-1 max-w-md">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search by name, ID or email..."
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

        {/* Add Employee Button */}
        <div className="flex items-center gap-2">
          <Link
            to="/employees/add"
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-[#8b3a3a] hover:bg-[#722f2f] text-white text-xs sm:text-sm font-medium rounded-md transition shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>Add Employee</span>
          </Link>
        </div>
      </div>

      {/* Filter & Sort Dropdowns */}
      <div className="flex flex-wrap items-center gap-2 text-xs">
        <select
          value={department}
          onChange={(e) => updateFilters({ department: e.target.value, page: 1 })}
          className="bg-white border border-gray-300 rounded px-2.5 py-1 text-gray-700 focus:outline-none"
        >
          {DEPARTMENTS.map((dept) => (
            <option key={dept} value={dept}>
              {dept === 'All' ? 'Department: All' : dept}
            </option>
          ))}
        </select>

        <select
          value={status}
          onChange={(e) => updateFilters({ status: e.target.value, page: 1 })}
          className="bg-white border border-gray-300 rounded px-2.5 py-1 text-gray-700 focus:outline-none"
        >
          {STATUSES.map((st) => (
            <option key={st} value={st}>
              {st === 'All' ? 'Status: All' : st}
            </option>
          ))}
        </select>

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
          status !== 'All' ||
          search ||
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

      {/* Employees Table Card */}
      <div className="bg-white rounded-lg border border-gray-200 shadow-xs overflow-hidden">
        {loading ? (
          <LoadingSpinner text="Loading employees..." />
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 text-left text-xs sm:text-sm">
              <thead className="bg-[#1e1e24] text-white text-xs uppercase tracking-wider">
                <tr>
                  <th
                    onClick={() => handleSort('employeeId')}
                    className="px-4 py-3 font-semibold cursor-pointer select-none hover:bg-neutral-800 transition"
                    title="Sort by Employee ID"
                  >
                    <div className="flex items-center gap-1.5">
                      <span>ID</span>
                      {renderSortIndicator('employeeId')}
                    </div>
                  </th>

                  <th
                    onClick={() => handleSort('fullName')}
                    className="px-4 py-3 font-semibold cursor-pointer select-none hover:bg-neutral-800 transition"
                    title="Sort by Full Name"
                  >
                    <div className="flex items-center gap-1.5">
                      <span>Full Name</span>
                      {renderSortIndicator('fullName')}
                    </div>
                  </th>

                  <th className="px-4 py-3 font-semibold hidden md:table-cell">
                    Email
                  </th>
                  <th className="px-4 py-3 font-semibold hidden lg:table-cell">
                    Phone
                  </th>

                  <th
                    onClick={() => handleSort('department')}
                    className="px-4 py-3 font-semibold cursor-pointer select-none hover:bg-neutral-800 transition"
                    title="Sort by Department"
                  >
                    <div className="flex items-center gap-1.5">
                      <span>Department</span>
                      {renderSortIndicator('department')}
                    </div>
                  </th>

                  <th className="px-4 py-3 font-semibold hidden sm:table-cell">
                    Role
                  </th>
                  <th className="px-4 py-3 font-semibold">Status</th>
                  <th className="px-4 py-3 font-semibold text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {employees && employees.length > 0 ? (
                  employees.map((emp) => (
                    <tr key={emp._id} className="hover:bg-gray-50/70 transition">
                      <td className="px-4 py-3 font-mono font-medium text-gray-900">
                        {emp.employeeId}
                      </td>
                      <td className="px-4 py-3 font-medium text-gray-900">
                        <Link
                          to={`/employees/${emp._id}`}
                          className="hover:underline text-gray-900 font-semibold"
                        >
                          {emp.fullName}
                        </Link>
                      </td>
                      <td className="px-4 py-3 text-gray-500 hidden md:table-cell">
                        {emp.email}
                      </td>
                      <td className="px-4 py-3 text-gray-500 hidden lg:table-cell">
                        {emp.phone}
                      </td>
                      <td className="px-4 py-3 text-gray-600">
                        {emp.department}
                      </td>
                      <td className="px-4 py-3 text-gray-600 hidden sm:table-cell">
                        {emp.role}
                      </td>
                      <td className="px-4 py-3">
                        <StatusBadge status={emp.status} />
                      </td>
                      <td className="px-4 py-3 text-right relative">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setActionMenuId(
                              actionMenuId === emp._id ? null : emp._id
                            );
                          }}
                          className="p-1 text-gray-400 hover:text-gray-700 rounded hover:bg-gray-100"
                        >
                          <MoreVertical className="w-4 h-4" />
                        </button>

                        {/* Action Menu Dropdown */}
                        {actionMenuId === emp._id && (
                          <div
                            onClick={(e) => e.stopPropagation()}
                            className="absolute right-10 bottom-0 mt-1 w-28 bg-white border border-gray-200 rounded-md shadow-lg z-20 py-1 text-xs text-left"
                          >
                            <button
                              onClick={() => {
                                setActionMenuId(null);
                                navigate(`/employees/${emp._id}`);
                              }}
                              className="w-full flex items-center gap-2 px-3 py-1.5 hover:bg-gray-50 text-gray-700"
                            >
                              <Eye className="w-3.5 h-3.5" />
                              View
                            </button>
                            <button
                              onClick={() => {
                                setActionMenuId(null);
                                navigate(`/employees/edit/${emp._id}`);
                              }}
                              className="w-full flex items-center gap-2 px-3 py-1.5 hover:bg-gray-50 text-gray-700"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                              Edit
                            </button>
                            <button
                              onClick={() => {
                                setActionMenuId(null);
                                setDeleteTarget(emp);
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
                    <td
                      colSpan="8"
                      className="px-4 py-8 text-center text-xs text-gray-400"
                    >
                      No employees match the selected criteria.
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
          onPageChange={handlePageChange}
          itemLabel="employees"
        />
      </div>

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={Boolean(deleteTarget)}
        title="Delete Employee"
        message={`Are you sure you want to delete "${deleteTarget?.fullName}" (${deleteTarget?.employeeId})? Note: If they have active tasks, deletion will be blocked.`}
        confirmText="Delete"
        confirmVariant="danger"
        isLoading={isDeleting}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
};
