import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Header from "../components/Header";
import { confirmAlert, errorAlert, successAlert } from "../utils/alerts";
import { getCurrentUser, getCurrentToken } from "../utils/session";

const ChangePassword = () => {
  const navigate = useNavigate();
  const user =
    getCurrentUser() || {};

  const [name, setName] = useState(user.name || "");
  const [pfNumber, setPfNumber] = useState(
    user.pfNumber || ""
  );
  const [currentPassword, setCurrentPassword] =
    useState("");

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

      const response = await fetch(
        "https://aor-q19z.onrender.com/api/users/first-login",
        {
          method: "PUT",
          headers: {
            "Content-Type":
              "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            name,
            pfNumber,
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

        <p className="text-center text-gray-500 mb-8"> Ensure to change your password and Pf number to original values after updating your profile.
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
              inputMode="numeric"
              pattern="[0-9]*"
              value={pfNumber}
              onChange={(e) => {
                const value = e.target.value.replace(/\D/g, "").slice(0, 6);
                setPfNumber(value);
              }}
              className="login-input"
              placeholder="PF Number"
            />

          <input
            type="password"
            placeholder="Current Password"
            className="login-input"
            value={currentPassword}
            onChange={(e) =>
              setCurrentPassword(
                e.target.value
              )
            }
          />

          <input
            type="password"
            placeholder="New Password "
            className="login-input"
            value={newPassword}
            onChange={(e) =>
              setNewPassword(
                e.target.value
              )
            }
          />

          <input
            type="password"
            placeholder="Confirm Password"
            className="login-input"
            value={confirmPassword}
            onChange={(e) =>
              setConfirmPassword(
                e.target.value
              )
            }
          />

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