import React from 'react';
import { AlertTriangle } from 'lucide-react';

export const ConfirmModal = ({
  isOpen,
  title = 'Confirm Action',
  message = 'Are you sure you want to proceed?',
  confirmText = 'Confirm',
  confirmVariant = 'danger',
  cancelText = 'Cancel',
  onConfirm,
  onCancel,
  isLoading = false,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-lg max-w-md w-full shadow-xl border border-gray-100 overflow-hidden animate-fadeIn">
        <div className="p-5">
          <div className="flex items-start gap-3">
            <div
              className={`p-2 rounded-full shrink-0 ${
                confirmVariant === 'danger'
                  ? 'bg-red-50 text-red-600'
                  : 'bg-amber-50 text-amber-600'
              }`}
            >
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-gray-900">{title}</h3>
              <p className="mt-1 text-sm text-gray-500 leading-relaxed">
                {message}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-gray-50 px-5 py-3 flex justify-end gap-2 border-t border-gray-100">
          <button
            type="button"
            onClick={onCancel}
            disabled={isLoading}
            className="px-3.5 py-1.5 text-xs sm:text-sm font-medium rounded-md border border-gray-300 text-gray-700 hover:bg-gray-100 transition disabled:opacity-50"
          >
            {cancelText}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isLoading}
            className={`px-3.5 py-1.5 text-xs sm:text-sm font-medium rounded-md text-white transition disabled:opacity-50 ${
              confirmVariant === 'danger'
                ? 'bg-red-600 hover:bg-red-700'
                : 'bg-[#8b3a3a] hover:bg-[#722f2f]'
            }`}
          >
            {isLoading ? 'Processing...' : confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};
