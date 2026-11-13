import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Eye, EyeOff } from "lucide-react";
import Header from "../components/Header";
import { confirmAlert, errorAlert, successAlert } from "../utils/alerts";
import { getCurrentUser, getCurrentToken } from "../utils/session";
import API_BASE_URL from "../config/api";

const ChangePassword = () => {
  const navigate = useNavigate();
  const user =
    getCurrentUser() || {};
  const [name, setName] = useState(user.name || "");
  const [pfNumber, setPfNumber] = useState(
    user.officialPfNumber ||
    (user.role === "Lecturer" ? user.pfNumber || "" : "")
  );
  const [currentPassword, setCurrentPassword] =
    useState("");
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [newPassword, setNewPassword] =
    useState("");

  const [confirmPassword, setConfirmPassword] =
    useState("");

  const handleSave = async () => {
    if (
  !name.trim() ||
  !pfNumber.trim() ||
  !currentPassword.trim() ||
  !newPassword.trim() ||
  !confirmPassword.trim()
) {
  await errorAlert("All fields are required.");
  return;
}
    if (newPassword !== confirmPassword) {
    await  errorAlert("Passwords do not match.");
      return;
    }
    if (newPassword === currentPassword) {
      await errorAlert(
        "New password cannot be the same as the current password."
      );
      return;
    }

    try {
      const token =
        getCurrentToken();
        const adminPFNumber =
  user.role === "Lecturer"
    ? pfNumber
    : user.role === "Director"
      ? `D${pfNumber.replace(/\D/g, "")}R`
      : user.role === "HOD"
        ? `H${pfNumber.replace(/\D/g, "")}`
        : user.role === "Dean"
          ? `D${pfNumber.replace(/\D/g, "")}`
          : pfNumber;

      const response = await fetch(
        `${API_BASE_URL}/api/users/first-login`,
        {
          method: "PUT",
          headers: {
            "Content-Type":
              "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            name,
            pfNumber: adminPFNumber,
            currentPassword,
            newPassword,
          }),
        }
      );

      const data =
        await response.json();

      if (!response.ok) {
      await errorAlert(data.message);
        return;
      }

// Save the fresh token
const portal = sessionStorage.getItem("currentPortal");

if (portal === "lecturer") {
  localStorage.setItem("lecturerToken", data.token);
  localStorage.setItem(
    "lecturerUser",
    JSON.stringify(data.user)
  );
}

if (portal === "admin") {
  localStorage.setItem("adminToken", data.token);
  localStorage.setItem(
    "adminUser",
    JSON.stringify(data.user)
  );
}

await successAlert(
  "Profile updated successfully."
);

      switch (data.user.role) {
        case "Lecturer":
          navigate("/lecturer");
          break;

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

    } catch (err) {
      console.error(err);
      errorAlert("Server error.");
    }
  };
const isFormValid =
  name.trim() &&
  currentPassword.trim() &&
  newPassword.trim() &&
  confirmPassword.trim();
  return (
        <div>
        <Header/>
        <div className='images'></div>
        <div className='login-form'>
          <div className='login-items'>
          <div id='login-data'>
        <h2 className="text-3xl font-bold text-center mb-2">
          Welcome {name}
        </h2>

        <p className="text-center text-gray-500 mb-8">Enter your official institutional PF number and change your password securely.
        </p>
        </div>

        <div className="space-y-5">

          <input
            type="text"
            placeholder="Full Name"
            className="login-input"
            value={name}
            onChange={(e) =>
              setName(e.target.value)
            }
          />

          <input
              type="text"
              value={pfNumber}
              onChange={(e) => {
                const value = e.target.value.toUpperCase().slice(0, 8);
                setPfNumber(value);
              }}
              className="login-input"
              placeholder="Official PF Number"
            />

          <div style={{ position: "relative" }}>
            <input
              type={showCurrentPassword ? "text" : "password"}
              placeholder="Current Password"
              className="login-input"
              style={{ paddingRight: "42px" }}
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
            />
            <button
              type="button"
              onClick={() => setShowCurrentPassword((prev) => !prev)}
              aria-label={showCurrentPassword ? "Hide current password" : "Show current password"}
              style={{
                position: "absolute",
                right: "10px",
                top: "50%",
                transform: "translateY(-50%)",
                background: "transparent",
                border: "none",
                cursor: "pointer",
                color: "#555",
              }}
            >
              {showCurrentPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>

          <div style={{ position: "relative" }}>
            <input
              type={showNewPassword ? "text" : "password"}
              placeholder="New Password"
              className="login-input"
              style={{ paddingRight: "42px" }}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
            />
            <button
              type="button"
              onClick={() => setShowNewPassword((prev) => !prev)}
              aria-label={showNewPassword ? "Hide new password" : "Show new password"}
              style={{
                position: "absolute",
                right: "10px",
                top: "50%",
                transform: "translateY(-50%)",
                background: "transparent",
                border: "none",
                cursor: "pointer",
                color: "#555",
              }}
            >
              {showNewPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>

          <div style={{ position: "relative" }}>
            <input
              type={showConfirmPassword ? "text" : "password"}
              placeholder="Confirm Password"
              className="login-input"
              style={{ paddingRight: "42px" }}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword((prev) => !prev)}
              aria-label={showConfirmPassword ? "Hide confirm password" : "Show confirm password"}
              style={{
                position: "absolute",
                right: "10px",
                top: "50%",
                transform: "translateY(-50%)",
                background: "transparent",
                border: "none",
                cursor: "pointer",
                color: "#555",
              }}
            >
              {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>

          <button
            onClick={handleSave}
            disabled={!isFormValid}
            className={`btn login-btn ${
              !isFormValid
                ? "opacity-50 cursor-not-allowed"
                : "" }`} >
            Continue
          </button>

        </div>

      </div>

    </div>
    </div>
  );
};

export default ChangePassword;