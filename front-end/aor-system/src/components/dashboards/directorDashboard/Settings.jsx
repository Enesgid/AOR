import DashboardHeader from "../analysis/DashboardHeader";
import Sidebar from "../analysis/Sidebar";
import Topbar from "../analysis/TopBar";
import { useState, useEffect } from "react";
import { Menu } from "lucide-react";
import ToggleSwitch from "./SettingsToggle/ToggleSwitch";



const Settings = () => {
    const [settings, setSettings] = useState({academicSession: "",semester: "", submissionDeadline: "",
    approvalDeadline: "",});
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [showProfileModal ,setShowProfileModal] =useState(false)
    const [showDeleteModal, setShowDeleteModal] = useState(false);

const [deleteText, setDeleteText] = useState("");
    const [user, setUser] = useState(() => {
   return (
    JSON.parse(localStorage.getItem("user")) || {}
  );
});
const isDirector = user.role === "Director";

const [darkMode, setDarkMode] = useState(
  () =>
    JSON.parse(
      localStorage.getItem("darkMode")
    ) ?? false
);

const [autoRefresh, setAutoRefresh] = useState(
  () =>
    JSON.parse(
      localStorage.getItem("autoRefresh")
    ) ?? false
);

const [hodNotifications, setHodNotifications] =
  useState(
    () =>
      JSON.parse(
        localStorage.getItem(
          "hodNotifications"
        )
      ) ?? true
  );

const [deanNotifications, setDeanNotifications] =
  useState(
    () =>
      JSON.parse(
        localStorage.getItem(
          "deanNotifications"
        )
      ) ?? true
  );

const [lecturerNotifications, setLecturerNotifications] =
  useState(
    () =>
      JSON.parse(
        localStorage.getItem(
          "lecturerNotifications"
        )
      ) ?? true
  );

  useEffect(() => {
  localStorage.setItem(
    "darkMode",
    JSON.stringify(darkMode)
  );
}, [darkMode]);
useEffect(() => {
  if (darkMode) {
    document.documentElement.classList.add("dark");
  } else {
    document.documentElement.classList.remove("dark");
  }
}, [darkMode]);

useEffect(() => {
  localStorage.setItem(
    "autoRefresh",
    JSON.stringify(autoRefresh)
  );
}, [autoRefresh]);

useEffect(() => {
  localStorage.setItem(
    "hodNotifications",
    JSON.stringify(hodNotifications)
  );
}, [hodNotifications]);

useEffect(() => {
  localStorage.setItem(
    "deanNotifications",
    JSON.stringify(deanNotifications)
  );
}, [deanNotifications]);

useEffect(() => {
  localStorage.setItem(
    "lecturerNotifications",
    JSON.stringify(lecturerNotifications)
  );
}, [lecturerNotifications]);

useEffect(() => {
  const fetchSettings = async () => {
    try {
      const response = await fetch(
        "https://aor-q19z.onrender.com/api/settings"
      );

      const data = await response.json();

      setSettings(data);

    } catch (error) {
      console.error(error);
    }
  };

  fetchSettings();

}, []);
const saveInstitutionSettings = async () => {
  try {
    const token = localStorage.getItem("token");

    const response = await fetch(
      "https://aor-q19z.onrender.com/api/settings",
      {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(settings),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      alert(data.message);
      return;
    }
    setSettings(data.settings);
    alert("Institution settings updated successfully.");

  } catch (error) {
    console.error(error);
    alert("Unable to save settings.");
  }
};
const deleteAllSubmissions = async () => {

  try {

    const token = localStorage.getItem("token");

    const response = await fetch(
      "https://aor-q19z.onrender.com/api/submissions/delete-all",
      {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    const data = await response.json();

    if (!response.ok) {
      alert(data.message);
      return;
    }

    alert("All submissions deleted successfully.");

    setShowDeleteModal(false);
    setDeleteText("");

  } catch (err) {

    console.error(err);
    alert("Unable to delete submissions.");

  }

};
    
  return (
<div
  className="
    flex
    bg-gray-100
    dark:bg-gray-800
    min-h-screen
    overflow-hidden
  dark:text-white

  "
>
              {/* Sidebar Navigation */}
          <Sidebar
            sidebarOpen={sidebarOpen}
            setSidebarOpen={setSidebarOpen}
          />
    
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
          
            <DashboardHeader
               title="Settings"
               subtitle="Configure institution, workflow, notifications and security"
              showExport = {false}
              showSearch ={false}
            />

    
      <div className="space-y-6 mt-6">
        <div 
  className="bg-white dark:bg-gray-600 border
  border-gray-200 dark:border-gray-700 rounded-2xl shadow-sm p-6
"
>
        <div className="flex flex-col md:flex-row md:items-center gap-6">

    <img
      src="https://ui-avatars.com/api/?name=Director"
      alt="Director"
      className="w-24 h-24 rounded-full"
    />

    <div className="flex-1">

      <h2 className="text-2xl font-bold">
  {user.name}
</h2>

<p className="text-sm text-gray-500 dark:text-gray-200">
  {user.role}
</p>

<p className="text-sm text-gray-500 dark:text-gray-200">
 pf Number: {user.pfNumber}
</p>

        <p className="text-sm text-gray-500 dark:text-gray-200 mt-2">
          {user.role === "Director" &&
            "Highest approval authority within the attendance responsibility management system."}

          {user.role === "Dean" &&
            "Responsible for validating submissions from Heads of Department."}

          {user.role === "HOD" &&
            "Responsible for reviewing submissions from lecturers in your department."}
        </p>

    </div>

        <button
          className="btn btn-clear rounded-xl"
          onClick={() => setShowProfileModal(true)}
        >
          Update Profile
        </button>

  </div>
</div>

        {/* Institution Settings */}
       {isDirector && (
         <div className="
            bg-white
            dark:bg-gray-600
            border
            border-gray-200
            dark:border-gray-700
            rounded-2xl
            shadow-sm
            p-6">
          <h2 className="text-xl font-semibold mb-6">
            Institution Settings
          </h2>

          <div className="grid md:grid-cols-2 gap-6">

            <div>
              <label className="block text-sm font-medium mb-2">
                Academic Session
              </label>

              <input type="text" value={settings.academicSession} onChange={(e) => setSettings({
                    ...settings, academicSession: e.target.value, }) }
                className="w-full border rounded-xl px-4 py-3"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                Semester
              </label>

              <select
                  value={settings.semester}
                  onChange={(e) => setSettings({...settings,
                      semester: e.target.value, }) }
                  className="w-full border rounded-xl px-4 h-10" >
                  <option>First Semester</option>
                  <option>Second Semester</option>
                </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                Submission Deadline
              </label>
            <input
              type="date"
              value={
                settings.submissionDeadline
                  ? settings.submissionDeadline.substring(0, 10)
                  : ""
              }
              onChange={(e) =>
                setSettings({
                  ...settings,
                  submissionDeadline: e.target.value,
                })
              }
              className="w-full border rounded-xl px-4 py-3"
            />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                Approval Deadline
              </label>

              <input
                type="date"
                value={
                  settings.approvalDeadline
                    ? settings.approvalDeadline.substring(0, 10)
                    : ""
                }
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    approvalDeadline: e.target.value,
                  })
                }
                className="w-full border rounded-xl px-4 py-3"
              />
            </div>

          </div>
        </div>
)}
        {/* Dashboard Settings */}
        <div 
            className="
            bg-white
            dark:bg-gray-600
            border
            border-gray-200
            dark:border-gray-700
            rounded-2xl
            shadow-sm
            p-6
          "
          >

          <h2 className="text-xl font-semibold mb-6">
            Dashboard Settings
          </h2>

          <div className="space-y-4">

            <ToggleSwitch
               label="Dark Mode"
               description="Customize dashboard appearance"
               checked={darkMode}
               onChange={() => setDarkMode(!darkMode)}
            />

                  <hr />

              <ToggleSwitch
                label="Auto Refresh Dashboard"
                description="Keep statistics updated automatically"
                checked={autoRefresh}
                onChange={() => setAutoRefresh(!autoRefresh)}
              />
                        
         </div>
        </div>

        {/* Notification Settings */}
       {isDirector && (
         <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 dark:bg-gray-600 dark:text-white">
          <h2 className="text-xl font-semibold mb-6">
            Notification Settings
          </h2>

            <ToggleSwitch
              label="HOD Notifications"
              description="Notify Heads of Departments"
              checked={hodNotifications}
              onChange={() =>
                setHodNotifications(!hodNotifications)
              }
            />

<hr />

          <ToggleSwitch
            label="Dean Notifications"
            description="Notify Deans of pending actions"
            checked={deanNotifications}
            onChange={() =>
              setDeanNotifications(!deanNotifications)
            }
          />

<hr />

        <ToggleSwitch
          label="Lecturer Notifications"
          description="Notify lecturers about submissions"
          checked={lecturerNotifications}
          onChange={() =>
            setLecturerNotifications(
              !lecturerNotifications
            )
          }
        />

        </div>
        )}
        {/* Save Button */}
       {isDirector && (
         <div className="sticky bottom-4  flex justify-end">
           <button onClick={() => setShowDeleteModal(true)}
             className="btn btn-clear rounded-xl px-"> Delete All Submissions
           </button>

          <button onClick={saveInstitutionSettings}
            className="
              btn btn-save
              p-8
              rounded-xl "
          >
            Save Changes
          </button>

        </div>
)}
      
    </div>
    </div>
    {
  showProfileModal && (
    <div className="
      fixed inset-0
      bg-black/40
      backdrop-blur-sm
      flex items-center justify-center
      z-50
    ">
      <div className="
        bg-white
        dark:bg-gray-700
        rounded-2xl
        p-6
        w-full
        max-w-md
      ">
        <h2 className="text-xl font-bold mb-4">
          Update Profile
        </h2>

        <div className="space-y-4">

          <input
            type="text"
            value={user.name || ""}
            placeholder="Name"
            onChange={(e) =>
              setUser({
                ...user,
                name: e.target.value,
              })
            }
            className="w-full border rounded-xl px-4 py-3"
          />

          <input
            type="email"
            value={user.pfNumber || ""}
            placeholder="PF Number"
            onChange={(e) =>
              setUser({
                ...user,
                pfNumber: e.target.value,
              })
            }
            className="w-[92%] border rounded-xl px-4 py-3"
          />

          <input
            type="text"
            readOnly ={true}
            value={user.role || ""}
            placeholder="Role"
            onChange={(e) =>
              setProfile({
                ...profile,
                position: e.target.value,
              })
            }
            className="w-full border rounded-xl px-4 py-3"
          />

        </div>

        <div className="flex justify-end gap-3 mt-6">

          <button
            onClick={() =>
              setShowProfileModal(false)
            }
            className="px-5 py-2 border rounded-xl"
          >
            Cancel
          </button>
          <button
                  onClick={async () => {
        try {
          const token = localStorage.getItem("token");

          const response = await fetch(
            "https://aor-q19z.onrender.com/api/users/profile",
            {
              method: "PUT",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
              },
              body: JSON.stringify({
                name: user.name,
                pfNumber: user.pfNumber,
              }),
            }
          );

          const data = await response.json();

          if (!response.ok) {
            alert(data.message);
            return;
          }

          // Update localStorage with fresh user from MongoDB
          localStorage.setItem(
            "user",
            JSON.stringify(data.user)
          );

          // Update React state
          setUser(data.user);

          alert("Profile updated successfully!");

          setShowProfileModal(false);

        } catch (err) {
          console.error(err);
          alert("Unable to update profile.");
        }
      }}
            className="btn btn-save px-5 py-2 rounded-xl"
          >
            Save
          </button>

        </div>
      </div>
    </div>
  )
}
{
  showDeleteModal && (
    <div
      className="
      fixed inset-0
      bg-black/50
      flex items-center
      justify-center
      z-50
      "
    >
      <div className="bg-white dark:bg-gray-700 rounded-2xl p-8 w-[450px]">

        <h2 className="text-2xl font-bold text-red-600 mb-4">
          Delete All
        </h2>

        <p className="mb-4">
          This action is <b> PERMANENT</b> and can not be undone.
        </p>

        <p className="mb-3">
          Type
          <b className="text-red-600">
            DELETE ALL
          </b>
          below to continue.
        </p>

        <input
          className="w-full border rounded-xl p-3"
          value={deleteText}
          onChange={(e)=>setDeleteText(e.target.value)}
          placeholder="DELETE ALL"
        />

        <div className="flex justify-end gap-3 mt-6">

          <button
            onClick={()=>{
              setShowDeleteModal(false);
              setDeleteText("");
            }}
            className="px-5 py-2 border rounded-xl"
          >
            Cancel
          </button>

          <button
            disabled={deleteText !== "DELETE ALL"}
            className={`px-5 py-2 rounded-xl text-white ${
              deleteText === "DELETE ALL"
                ? "btn btn-clear"
                : "bg-gray-400 cursor-not-allowed"
            }`}
            onClick={deleteAllSubmissions}
          >
            Delete
          </button>

        </div>

      </div>
    </div>
  )
}
    </div>
  );
};

export default Settings;