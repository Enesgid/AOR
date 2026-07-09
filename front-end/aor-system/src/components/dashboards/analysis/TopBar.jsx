import {
  Bell,
  ChevronDown,
  ArrowLeftIcon,
} from "lucide-react";

import {useEffect, useState,} from "react";
import { useNavigate } from "react-router-dom";
const Topbar = ({ showBack = false }) => {
  const navigate = useNavigate(); 
  const [unreadCount, setUnreadCount] =
  useState(0);
  useEffect(() => {
  fetchNotifications();

  const interval = setInterval(() => {
    fetchNotifications();
  }, 10000);

  return () => clearInterval(interval);
}, []);
const [user, setUser] = useState(
  JSON.parse(localStorage.getItem("user")) || {}
);

const initials = user.name
  ? user.name
      .split(" ")
      .map((word) => word[0])
      .join("")
      .substring(0, 2)
      .toUpperCase()
  : "?";

    useEffect(() => {
  const handleStorage = () => {
    setUser(
      JSON.parse(localStorage.getItem("user")) || {}
    );
  };

  window.addEventListener("storage", handleStorage);

  return () => {
    window.removeEventListener("storage", handleStorage);
  };
}, []);

const fetchNotifications = async () => {
  try {
    const token = localStorage.getItem("token");

    const response = await fetch(
      "http://localhost:5000/api/notifications",
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    const data = await response.json();

    setUnreadCount(
      data.filter((item) => !item.read).length
    );

  } catch (err) {
    console.error(err);
  }
};
  return (
    
    <div className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6">

      {/* Left Side */}
      <div>
        {showBack && (
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-1 btn btn-clear"
          >
            <ArrowLeftIcon size={18} />
            Back
          </button>
        )}
      </div>

      {/* Right Side */}
      <div className="flex items-center gap-5">

<div
  className="relative cursor-pointer"
  onClick={() => navigate("/notifications")}
>
  <Bell
    size={22}
    className="text-gray-600"
  />

  {unreadCount > 0 && (
    <div
      className="
        absolute
        -top-2
        -right-2
        bg-red-500
        text-white
        text-[10px]
        font-bold
        min-w-[18px]
        h-[18px]
        rounded-full
        flex
        items-center
        justify-center
        px-1
      "
    >
      {unreadCount}
    </div>
  )}
</div>

<div className="flex items-center gap-2 cursor-pointer">
<div className=" w-11 h-11 rounded-full bg-blue-700 text-white
    flex items-center justify-center font-bold text-sm ">
            {initials} </div>
          <div className="hidden sm:block">
            <p className="text-sm font-semibold text-gray-700">
              {user.name || "User"}
            </p>

            <p className="text-xs text-blue-700 font-medium"> {user.role} 
            </p>
          </div>
        </div>

      </div>

    </div>
  );
};

export default Topbar;