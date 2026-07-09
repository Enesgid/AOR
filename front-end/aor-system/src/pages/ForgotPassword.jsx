import { useState } from "react";
import { useNavigate } from "react-router-dom";

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

    try {
      const response = await fetch(
        "http://localhost:5000/api/users/reset-password",
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
        setMessage(data.message);
      } 
      else {
        alert(data.message);
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
            Enter your PF Number and Full Name.
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
              PF Number
            </label>

            <input
              type="text"
              className="login-input"
              value={pfNumber}
              onChange={(e) =>
                setPfNumber(e.target.value)
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
      </form>
    </div>
  );
};

export default ForgotPassword;