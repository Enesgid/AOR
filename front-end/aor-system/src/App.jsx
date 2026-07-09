
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

function App() {
  return (
    <Router>
      <div>
        {/* APPLICATION ROUTES */}
       <Routes>

  <Route path="/" element={<Navigate to="/lectLogin" replace />} />

  <Route path="/lecturer" element={<AorForm />} />

  <Route path="/hod" element={<HodDashboard />} />

  <Route path="/dean" element={<DeanDashboard />} />

  <Route path="/director" element={<DirectorDashboard />} />

  <Route path="/faculties" element={<Faculties />} />
  <Route path="/forgot-password" element={<ForgotPassword />} />

  <Route path="/lectLogin" element={<LectLogin />} />

  <Route path="/adminLogin" element={<AdminLogin />} />
  <Route path="/departments" element={<Departments />} />
  <Route path="/changePassword" element={<ChangePassword />} />
  <Route
  path="/departments/:school"
  element={<Departments />}
/>
<Route
  path="/department/:school/:department"
  element={<DepartmentDetails />}
/>
<Route
  path="/settings"
  element={<Settings/>}
/>
<Route path='/notifications' 
element ={<Notifications/>} />

</Routes>
      </div>
    </Router>
  );
}

export default App;