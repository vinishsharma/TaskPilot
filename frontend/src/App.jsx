import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { NotificationProvider } from './context/NotificationContext.jsx';
import { Layout } from './components/common/Layout.jsx';

import { DashboardPage } from './pages/DashboardPage.jsx';
import { EmployeeListPage } from './pages/EmployeeListPage.jsx';
import { EmployeeAddEditPage } from './pages/EmployeeAddEditPage.jsx';
import { EmployeeViewPage } from './pages/EmployeeViewPage.jsx';
import { TaskListPage } from './pages/TaskListPage.jsx';
import { TaskAddEditPage } from './pages/TaskAddEditPage.jsx';
import { TaskViewPage } from './pages/TaskViewPage.jsx';

export const App = () => {
  return (
    <NotificationProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Layout />}>
            {/* Dashboard */}
            <Route index element={<DashboardPage />} />

            {/* Employees */}
            <Route path="employees" element={<EmployeeListPage />} />
            <Route path="employees/add" element={<EmployeeAddEditPage />} />
            <Route path="employees/edit/:id" element={<EmployeeAddEditPage />} />
            <Route path="employees/:id" element={<EmployeeViewPage />} />

            {/* Tasks */}
            <Route path="tasks" element={<TaskListPage />} />
            <Route path="tasks/add" element={<TaskAddEditPage />} />
            <Route path="tasks/edit/:id" element={<TaskAddEditPage />} />
            <Route path="tasks/:id" element={<TaskViewPage />} />

            {/* Fallback */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </NotificationProvider>
  );
};

export default App;
