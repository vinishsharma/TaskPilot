import React from 'react';

export const StatusBadge = ({ status }) => {
  const getStyle = () => {
    switch (status) {
      case 'Todo':
        return 'bg-gray-100 text-gray-700 border-gray-300';
      case 'In Progress':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'Completed':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'Cancelled':
        return 'bg-red-50 text-red-700 border-red-200';
      // Employee statuses
      case 'Active':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'Inactive':
        return 'bg-gray-100 text-gray-600 border-gray-300';
      case 'On Leave':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      default:
        return 'bg-gray-50 text-gray-600 border-gray-200';
    }
  };

  return (
    <span
      className={`inline-block text-center px-2 py-0.5 rounded text-xs font-medium border min-w-32 ${getStyle()}`}
    >
      {status}
    </span>
  );
};

export const PriorityBadge = ({ priority }) => {
  const getStyle = () => {
    switch (priority) {
      case 'Critical':
        return 'bg-red-100 text-red-800 border-red-200 font-semibold';
      case 'High':
        return 'bg-orange-50 text-orange-700 border-orange-200';
      case 'Medium':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'Low':
        return 'bg-gray-50 text-gray-600 border-gray-200';
      default:
        return 'bg-gray-50 text-gray-600 border-gray-200';
    }
  };

  return (
    <span
      className={`inline-block text-center px-2 py-0.5 rounded text-xs font-medium border min-w-20 ${getStyle()}`}
    >
      {priority}
    </span>
  );
};
