import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import lecturer from '../pages/AORForm'
import Header from '../components/Header';

const LecturerLogin = () => {
  const [pfNumber, setPfNumber] = useState('');
  const [password, setPassword] = useState('');
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
      const response = await fetch('http://localhost:5000/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pfNumber: pfNumber.toUpperCase(), password, role: 'Lecturer' })
      });

      const data = await response.json();

     if (response.ok) {

  localStorage.setItem("token", data.token);

  localStorage.setItem(
    "user",
    JSON.stringify(data.user)
  );

  localStorage.setItem(
    "loggedInPF",
    data.user.pfNumber
  );

  localStorage.setItem(
    "loggedInName",
    data.user.name
  );

  // First Login
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
            <input type="text" value={pfNumber} onChange={(e) => setPfNumber(e.target.value)} className='login-input' />
          </div>
          <div>
            <label className='login-label'>Password</label>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className='login-input' />
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