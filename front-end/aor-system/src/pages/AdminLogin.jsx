import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../components/Header';


const AdminLogin = () => {
  const [role, setRole] = useState('HOD'); 
  const [pfNumber, setPfNumber] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');

    if (!pfNumber.trim() || !password.trim()) {
      setError('Please enter your Admin PF Number and Password.');
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch('https://aor-q19z.onrender.com/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pfNumber: pfNumber.toUpperCase(), password, role })
      });

      const data = await response.json();

if (response.ok) {

localStorage.setItem(
  "adminToken",
  data.token
);

localStorage.setItem(
  "adminUser",
  JSON.stringify(data.user)
);

sessionStorage.setItem(
  "currentPortal",
  "admin"
);

    localStorage.setItem(
        "department",
        data.user.department || ""
    );

    localStorage.setItem(
        "school",
        data.user.school || ""
    );

    // First login setup temporary disabled for the sake of testing, but should be enabled in production
    // if (data.user.firstLogin) {
    //     navigate("/changePassword");
    //     return;
    // }

    switch (data.user.role) {
        case "HOD":
            navigate("/hod");
            break;

        case "Dean":
            navigate("/dean");
            break;

        case "Director":
            navigate("/director");
            break;

        default:
            navigate("/");
    }
} else {
        setError(data.message || 'Access Denied. Invalid credentials or role.');
      }
    } catch (err) {
      setError('Could not connect to the secure server.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div>
   <Header/>
   
    <div className='images'>
    </div>
    <div className='login-form'>
      <div className='login-items'>
        <div id='login-data'>
          <h2 >Management Gateway</h2>
          <p >Authorized personnel only.</p>
        </div>

        {error && <div id='error'>{error}</div>}

        <form onSubmit={handleLogin} id='format'>
          <div>
             <label className='login-label'>Administrative Role</label>
             <select value={role} onChange={(e) => setRole(e.target.value)} >
               <option value="HOD">Head of Department (HOD)</option>
               <option value="Dean">Dean of Schools</option>
               <option value="Director">Director</option>
             </select>
          </div>
          <div>
            <label className='login-label'>Admin ID (PF Number)</label>
            <input
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                value={pfNumber}
                onChange={(e) => {
                  const value = e.target.value.replace(/\D/g, "").slice(0, 6);
                  setPfNumber(value);
                }}
                className="login-input"
                placeholder="Numbers only"
              />
          </div>
          <div>
            <label className='login-label'>Password</label>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className='login-input' />
          </div>
          <button type="submit" disabled={isLoading} className='login-btn'>
            {isLoading ? 'Authenticating...' : 'Secure Login'}
          </button>
          <p className="text-center mt-4 text-sm">
            <span
              onClick={() =>
                navigate("/forgot-password")
              }
              className="btn btn-clear"
            >
              Forgot Password?
            </span>
          </p>
        </form>
      </div>
    </div>
     </div>
  );
};

export default AdminLogin;