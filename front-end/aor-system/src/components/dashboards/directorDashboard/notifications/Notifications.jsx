import { useEffect, useState } from "react";
import { Menu } from "lucide-react";
import Sidebar from "../../analysis/Sidebar";
import DashboardHeader from "../../analysis/DashboardHeader";
import Topbar from "../../analysis/TopBar";
import { getCurrentToken } from "../../../../utils/session";


const Notifications = () => {
const [notifications, setNotifications] = useState([]);
    const [sidebarOpen, setSidebarOpen] = useState(false);

useEffect(() => {
  fetchNotifications();
  markAllAsRead();

  const interval = setInterval(() => {
    fetchNotifications();
  }, 10000);

  return () => clearInterval(interval);
}, []);

const fetchNotifications = async () => {
  try {
    const token = getCurrentToken();

    const response = await fetch(
      "https://aor-q19z.onrender.com/api/notifications",
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    const data = await response.json();

    setNotifications(data);
  } catch (err) {
    console.error(err);
  }
};
const markAllAsRead = async () => {
  try {

    const token = getCurrentToken();

    await fetch(
      "https://aor-q19z.onrender.com/api/notifications/read-all",
      {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

  } catch (err) {
    console.error(err);
  }
};
const clearAll = async () => {
  try {
    const token = getCurrentToken();

   await fetch(
  "https://aor-q19z.onrender.com/api/notifications",
  {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  }
);
 fetchNotifications();

  } catch (err) {
    console.error(err);
  }
};

return ( 
<div
  className="flex bg-gray-100 dark:bg-gray-800 min-h-screen
    overflow-hidden dark:text-white " >
              {/* Sidebar Navigation */}
  <Sidebar
  sidebarOpen={sidebarOpen} 
  setSidebarOpen={setSidebarOpen} />
    
          {/* Mobile Menu Action Toggle */}
          <button
            className={`
              lg:hidden
              fixed top-4 left-4
              z-[60]
              bg-white
              p-3
              rounded-xl
              shadow-md
              border border-gray-200
              cursor-pointer
              transition-all duration-300
              ${sidebarOpen ? "hidden" : "block"}
            `}
            onClick={() => setSidebarOpen(!sidebarOpen)}
          >
            <Menu size={24} />
          </button>
    
          {/* Primary Interface View Area */}
          <div className="flex-1 lg:ml-64 p-3 sm:p-6 pt-20 lg:pt-6 overflow-hidden">
           <Topbar
            showBack = {true}
           />
            <DashboardHeader
              title="Notification"
              showExport = {false}
              showSearch ={false}
            />


<div className="p-6">

  {/* Header */}

  <div className="flex justify-between items-center mb-6"> {notifications.length > 0 && (
      <button
        onClick={clearAll}
        className="
          text-red-600
          text-sm
          font-medium
          hover:text-red-700
        "
      >
        Clear All
      </button>
    )}

  </div>

  {/* Empty State */}

  {notifications.length === 0 ? (
    <div
      className="
        bg-white
        rounded-2xl
        border
        border-gray-200
        p-12
        text-center
      "
    >
      <h3 className="text-lg font-semibold">
        No Notifications
      </h3>

      <p className="text-gray-500 mt-2">
        You're all caught up.
      </p>
    </div>
  ) : (
    <div className="space-y-4">

      {notifications.map((item) => (
        <div
          key={item._id}
          className="
            bg-white
            rounded-2xl
            border
            border-gray-200
            p-5
            hover:shadow-md
            transition-all
          "
        >
          <div className="flex justify-between items-start">

            <div>

              <div className="flex items-center gap-2">

                {!item.read && (
                  <div
                    className="
                      w-3
                      h-3
                      rounded-full
                      bg-red-500
                    "
                  />
                )}
            </div>

              <h3 className="font-semibold">
                  {item.title}
              </h3>

<p className="mt-2 text-gray-600">
    {item.message}
</p>

              <p className="text-xs text-gray-400 mt-3">
                {new Date(
                  item.createdAt
                ).toLocaleString()}
              </p>

            </div>
          </div>
        </div>
      ))}

    </div>
  )}

</div>
</div>
</div>

);
};

export default Notifications;
