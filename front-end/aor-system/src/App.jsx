
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link, Navigate } from 'react-router-dom';
import AorForm from '../src/pages/AORForm'; 
import HodDashboard from '../src/components/dashboards/HODDashboard'; 
import DeanDashboard from '../src/components/dashboards/DeanDashboard';
import DirectorDashboard from '../src/components/dashboards/DirectorDashboard';
import LectLogin from '../src/pages/LecturerLogin';
import AdminLogin from '../src/pages/AdminLogin';
import Faculties from './components/dashboards/directorDashboard/Faculties';
import Departments from './components/dashboards/directorDashboard/Departments';
import DepartmentDetails from './components/dashboards/directorDashboard/DepartmentDetails';
import Settings from './components/dashboards/directorDashboard/Settings';
import Notifications from './components/dashboards/directorDashboard/notifications/Notifications';
import ChangePassword from './pages/ChangePassword';
import ForgotPassword from './pages/ForgotPassword';
import ProtectedRoute from './components/protectedRoute';
import Unauthorized from './pages/Unauthorized';
import NotFound from './pages/NotFound';

function App() {
  return (
    <Router>
      <div>
        {/* APPLICATION ROUTES */}
       <Routes>

  <Route path="/" element={<Navigate to="/lectLogin" replace />} />

<Route
  path="/lecturer"
  element={
    <ProtectedRoute allowedRoles={["Lecturer"]}>
      <AorForm />
    </ProtectedRoute>
  }
/>

<Route
  path="/hod"
  element={
    <ProtectedRoute allowedRoles={["HOD"]}>
      <HodDashboard />
    </ProtectedRoute>
  }
/>

<Route
  path="/dean"
  element={
    <ProtectedRoute allowedRoles={["Dean"]}>
      <DeanDashboard />
    </ProtectedRoute>
  }
/>

<Route
  path="/director"
  element={
    <ProtectedRoute allowedRoles={["Director"]}>
      <DirectorDashboard />
    </ProtectedRoute>
  }
/>
<Route
  path="/faculties"
  element={
    <ProtectedRoute allowedRoles={["Director"]}>
      <Faculties />
    </ProtectedRoute>
  }
/>
  <Route path="/forgot-password" element={<ForgotPassword />} />

  <Route path="/lectLogin" element={<LectLogin />} />

  <Route path="/adminLogin" element={<AdminLogin />} />
  <Route
    path="/departments"
    element={
      <ProtectedRoute allowedRoles={["Director"]}>
        <Departments />
      </ProtectedRoute>
    }
  />
  <Route path="/changePassword" element={<ChangePassword />} />
  <Route
    path="/departments/:school"
    element={
      <ProtectedRoute allowedRoles={["Director"]}>
        <Departments />
      </ProtectedRoute>
    }
  />
<Route
  path="/department/:school/:department"
  element={
    <ProtectedRoute allowedRoles={["Director"]}>
      <DepartmentDetails />
    </ProtectedRoute>
  }
/>
<Route
  path="/settings"
  element={
    <ProtectedRoute allowedRoles={["Director"]}>
      <Settings />
    </ProtectedRoute>
  }
/>
<Route
  path="/notifications"
  element={
    <ProtectedRoute
      allowedRoles={["Director", "Dean", "HOD"]}
    >
      <Notifications />
    </ProtectedRoute>
  }
/>
<Route path="/unauthorized" element={<Unauthorized />} />
<Route path="*" element={<NotFound />} />

</Routes>
      </div>
    </Router>
  );
}

export default App;