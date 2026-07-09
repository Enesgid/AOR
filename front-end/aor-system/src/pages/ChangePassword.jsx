import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Header from "../components/Header";

const ChangePassword = () => {
  const navigate = useNavigate();
  const user =
    JSON.parse(localStorage.getItem("user")) || {};

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
    if (newPassword !== confirmPassword) {
      alert("Passwords do not match.");
      return;
    }

    try {
      const token =
        localStorage.getItem("token");

      const response = await fetch(
        "http://localhost:5000/api/users/first-login",
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
        alert(data.message);
        return;
      }

// Save the fresh token
localStorage.setItem(
  "token",
  data.token
);

// Save the updated user
localStorage.setItem(
  "user",
  JSON.stringify(data.user)
);

alert(
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
      alert("Server error.");
    }
  };

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

        <p className="text-center text-gray-500 mb-8">
          Please update your profile before continuing.
        </p>
        </div>

        <div className="space-y-5">

          <input
            type="text"
            placeholder="Full Name"
            className="w-full border rounded-xl p-3"
            value={name}
            onChange={(e) =>
              setName(e.target.value)
            }
          />
          <input
            type="text"
            placeholder="PF Number"
            className="w-full border rounded-xl p-3"
            value={pfNumber}
            onChange={(e) =>
              setPfNumber(e.target.value)
            }
          />

          <input
            type="password"
            placeholder="Current Password"
            className="w-full border rounded-xl p-3"
            value={currentPassword}
            onChange={(e) =>
              setCurrentPassword(
                e.target.value
              )
            }
          />

          <input
            type="password"
            placeholder="New Password"
            className="w-full border rounded-xl p-3"
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
            className="w-full border rounded-xl p-3"
            value={confirmPassword}
            onChange={(e) =>
              setConfirmPassword(
                e.target.value
              )
            }
          />

          <button
            onClick={handleSave}
            className="btn login-btn"
          >
          <span>Continue</span>
            
          </button>

        </div>

      </div>

    </div>
    </div>
  );
};

export default ChangePassword;