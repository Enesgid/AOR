import {
  LayoutDashboard,
  Building2,
  GraduationCap,
  Settings,
  LogOut,
  X,
  Bell,
} from "lucide-react";
import { useNavigate, NavLink } from "react-router-dom";
const user =
  JSON.parse(localStorage.getItem("user")) || {};

const role = user.role;
const dashboardTitle = `${role} Dashboard`;
const menuItems = {
  Director: [
    {
      title: "Dashboard",
      path: "/director",
      icon: <LayoutDashboard size={20} />,
    },
    {
      title: "Schools",
      path: "/faculties",
      icon: <Building2 size={20} />,
    },
    {
      title: "Departments",
      path: "/departments",
      icon: <GraduationCap size={20} />,
    },
    {
      title: "Notifications",
      path: "/notifications",
      icon: <Bell size={20} />,
    },
    {
      title: "Settings",
      path: "/settings",
      icon: <Settings size={20} />,
    },
  ],

  Dean: [
    {
      title: "Dashboard",
      path: "/dean",
      icon: <LayoutDashboard size={20} />,
    },
    {
      title: "Notifications",
      path: "/notifications",
      icon: <Bell size={20} />,
    },
    {
      title: "Settings",
      path: "/settings",
      icon: <Settings size={20} />,
    },
  ],

  HOD: [
    {
      title: "Dashboard",
      path: "/hod",
      icon: <LayoutDashboard size={20} />,
    },
    {
      title: "Notifications",
      path: "/notifications",
      icon: <Bell size={20} />,
    },
    {
      title: "Settings",
      path: "/settings",
      icon: <Settings size={20} />,
    },
  ],

  Lecturer: [
    {
      title: "Dashboard",
      path: "/lecturer",
      icon: <LayoutDashboard size={20} />,
    },
    {
      title: "Notifications",
      path: "/notifications",
      icon: <Bell size={20} />,
    },
    {
      title: "Settings",
      path: "/settings",
      icon: <Settings size={20} />,
    },
  ],
};

const currentMenu = menuItems[role] || [];

const Sidebar = ({ sidebarOpen, setSidebarOpen }) => {
   const navigate = useNavigate();
const handleLogout = () => {
  const confirmLogout = window.confirm(
    "Are you sure you want to logout?"
  );

  if (!confirmLogout) return;

  const user =
    JSON.parse(localStorage.getItem("user")) || {};

  localStorage.removeItem("token");
  localStorage.removeItem("user");
  localStorage.removeItem("role");
  localStorage.removeItem("isLoggedIn");

  if (user.role === "Lecturer") {
    navigate("/lecturerLogin");
  } else {
    navigate("/adminLogin");
  }
};
  return (
    <>
      {/* Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
<div
  className={`
    fixed top-0
    ${sidebarOpen ? "left-0" : "-left-80"}
    z-50
    h-screen w-48 sm:w-60
    bg-[var(--primary-color)]
    text-white
    flex flex-col justify-between
    py-8 px-5 sm:pb-4
    transition-all duration-300 ease-in-out

    lg:left-0
  `}


      >

        {/* Top Section */}
        <div>
        <div className="flex flex-col h-full justify-between">
        <div>

    {/* Logo */}
    <div className="flex items-start justify-between mb-6">

      <div>

        <img
          src="/logo.png"
          alt="Logo"
          className="w-24 h-24 mb-3"
        />

        <h1 className="text-lg sm:text-xl font-bold tracking-wide leading-7">
          FEDERAL UNIVERSITY
        </h1>

        <p className="text-sm text-blue-200 mt-1">
          {dashboardTitle}
        </p>

      </div>

      {/* Close Mobile */}
      <button
        className="lg:hidden cursor-pointer p-2 rounded-lg hover:bg-blue-200 transition-all duration-300"
        onClick={() => setSidebarOpen(false)}
      >
        <X size={24} />
      </button>

    </div>

    {/* Navigation */}
    <div className="space-y-2">

{currentMenu.map((item, index) => (

  <NavLink
    key={index}
    to={item.path}
    onClick={() => setSidebarOpen(false)}
    className={({ isActive }) => `
      no-underline
      text-white
      flex items-center gap-3
      px-3 py-2
      rounded-xl
      cursor-pointer
      transition-all duration-300

      ${
        isActive
          ? "bg shadow-md"
          : "others "
      }
    `}
  >

    {item.icon}

    <span className="font-medium text-sm sm:text-base">
      {item.title}
    </span>

  </NavLink>

))}

    </div>

    </div>

      {/* Logout */}
      <div className="border-t border-purple-900 pt-4 mt-6">

        <div className="flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-red-700 cursor-pointer transition-all duration-300" onClick={handleLogout}>

          <LogOut size={20} />

          <span className="font-medium text-sm sm:text-base">
            Logout
          </span>

        </div>

      </div>

    </div>
  
      </div>
      </div>
    </>
  );
};

export default Sidebar;