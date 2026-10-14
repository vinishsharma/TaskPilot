import React, { createContext, useContext, useState, useCallback } from 'react';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

const NotificationContext = createContext(null);

export const NotificationProvider = ({ children }) => {
  const [notifications, setNotifications] = useState([]);

  const removeNotification = useCallback((id) => {
    setNotifications((prev) => prev.filter((item) => item.id !== id));
  }, []);

  const addNotification = useCallback(
    (message, type = 'info', duration = 4000) => {
      const id = Date.now() + Math.random().toString(36).substring(2, 9);
      setNotifications((prev) => [...prev, { id, message, type }]);

      if (duration > 0) {
        setTimeout(() => {
          removeNotification(id);
        }, duration);
      }
    },
    [removeNotification]
  );

  const showSuccess = useCallback(
    (message, duration) => addNotification(message, 'success', duration),
    [addNotification]
  );

  const showError = useCallback(
    (message, duration = 6000) => addNotification(message, 'error', duration),
    [addNotification]
  );

  const showInfo = useCallback(
    (message, duration) => addNotification(message, 'info', duration),
    [addNotification]
  );

  return (
    <NotificationContext.Provider
      value={{ showSuccess, showError, showInfo, removeNotification }}
    >
      {children}

      {/* Floating Notifications Container */}
      <div className="fixed bottom-4 right-4 z-50 flex flex-col space-y-2 max-w-sm sm:max-w-md w-full pointer-events-none px-4 sm:px-0">
        {notifications.map((item) => (
          <div
            key={item.id}
            className={`pointer-events-auto flex items-start gap-3 p-3.5 rounded-lg border shadow-lg transition-all duration-300 animate-slideIn ${
              item.type === 'success'
                ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                : item.type === 'error'
                ? 'bg-red-50 border-red-200 text-red-900'
                : 'bg-blue-50 border-blue-200 text-blue-900'
            }`}
          >
            <div className="shrink-0 mt-0.5">
              {item.type === 'success' && (
                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
              )}
              {item.type === 'error' && (
                <AlertCircle className="w-5 h-5 text-red-600" />
              )}
              {item.type === 'info' && (
                <Info className="w-5 h-5 text-blue-600" />
              )}
            </div>

            <div className="flex-1 text-sm font-medium leading-snug">
              {item.message}
            </div>

            <button
              onClick={() => removeNotification(item.id)}
              className="shrink-0 text-gray-400 hover:text-gray-700 transition"
              aria-label="Close"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>
    </NotificationContext.Provider>
  );
};

export const useNotification = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotification must be used within a NotificationProvider');
  }
  return context;
};
