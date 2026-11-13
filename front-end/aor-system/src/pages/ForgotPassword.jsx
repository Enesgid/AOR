import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {successAlert, errorAlert} from "../utils/alerts";
import API_BASE_URL from "../config/api";
  const ForgotPassword = () => {
  const [pfNumber, setPfNumber] = useState("");
  const [name, setName] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const handleReset = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");
    // reset password logic here
    try {
      const response = await fetch(
        `${API_BASE_URL}/api/users/reset-password`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            pfNumber,
            name,
          }),
        }
      );
      const data = await response.json();
      if (!response.ok) {
        await errorAlert(data.message || "Unable to reset password.");
      } 
      else {
       await successAlert(data.message);
            if (data.role === "Lecturer") {
            navigate("/");
            } else {
            navigate("/adminLogin");
            }
      }
    } catch (error) {
      setMessage("Unable to reset password.");
    }

    setLoading(false);
  };

  return (
    <div className="login-form">
      <div className="images"></div>

      <form
        className="login-items"
        onSubmit={handleReset}
      >
        <div id="login-data">
          <h2>Forgot Password</h2>
          <p>
            Please Enter your PF Number and Full Name that you used when updating profile.
          </p>
        </div>

        {message && (
          <div id="error">
            {message}
          </div>
        )}

        <div id="format">
          <div>
            <label className="login-label">
              Official PF Number
            </label>

            <input
              type="text"
              className="login-input"
              value={pfNumber}
              placeholder="Enter your PF Number"
              onChange={(e) =>
                setPfNumber(e.target.value.toUpperCase())
              }
              required
            />
          </div>

          <div>
            <label className="login-label">
              Full Name
            </label>

            <input
              type="text"
              className="login-input"
              value={name}
              placeholder="Full Name used when updating profile"
              onChange={(e) =>
                setName(e.target.value)
              }
              required
            />
          </div>

          <button
            className="login-btn"
            disabled={loading}
          >
            {loading
              ? "Resetting..."
              : "Reset Password"}
          </button>
        </div>
        <div className="text-gray-500 text-md pt-4">
          <span className="text-red-600 text-lg font-bold" >NOTE : </span>
          <p> start with the initial 'H' for HOD + PF number and 'D' for Dean + PF number (H12345 or D12345)</p>
        </div>
      </form>
    </div>
  );
};

export default ForgotPassword;