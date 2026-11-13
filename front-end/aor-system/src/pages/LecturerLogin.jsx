import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, EyeOff } from 'lucide-react';
import lecturer from '../pages/AORForm'
import Header from '../components/Header';
import API_BASE_URL from '../config/api';

const LecturerLogin = () => {
  const [pfNumber, setPfNumber] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');

    if (!pfNumber.trim() || !password.trim()) {
      setError('Please enter both your PF Number and Password.');
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch(`${API_BASE_URL}/api/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pfNumber: pfNumber.toUpperCase(), password, role: 'Lecturer' })
      });

      const data = await response.json();

     if (response.ok) {

localStorage.setItem(
  "lecturerToken",
  data.token
);

localStorage.setItem(
  "lecturerUser",
  JSON.stringify(data.user)
);

sessionStorage.setItem(
  "currentPortal",
  "lecturer"
);
  localStorage.setItem(
    "loggedInPF",
    data.user.pfNumber
  );

  localStorage.setItem(
    "loggedInName",
    data.user.name
  );

  // First Login temporary disabled for the sake of testing, but should be enabled in production
  if (data.user.firstLogin) {
    navigate("/changePassword");
    return;
  }

  navigate("/lecturer");
}
 else {
        setError(data.message || 'Login failed. Please check your details.');
      }
    } catch (err) {
      setError('Could not connect to the server.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div>
      <Header/>
    <div className='images'></div>

    <div className='login-form'>
      <div className='login-items'>
        <div id='login-data'>
          <h2 >Lecturer Portal</h2>
          <p >Please sign in to submit your AOR.</p>
        </div>

        {error && <div id='error'>{error}</div>}

        <form onSubmit={handleLogin} id='format'>
          <div>
            <label className='login-label'>PF Number</label>
            <input
              type="text"
              value={pfNumber}
              onChange={(e) => {
                const value = e.target.value
                  .toUpperCase()
                  .replace(/[^0-9]/g, "")
                  .slice(0, 12);
                setPfNumber(value);
              }}
              className="login-input"
              placeholder="PF Number"
            />
          </div>
          <div>
            <label className='login-label'>Password</label>
            <div style={{ position: 'relative' }}>
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className='login-input'
                style={{ paddingRight: '42px' }}
              />
              <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
                style={{
                  position: 'absolute',
                  right: '10px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  color: '#555',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>
          <button type="submit" disabled={isLoading} className='login-btn'>
            {isLoading ? 'please wait...' : 'Sign In'}
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

export default LecturerLogin;