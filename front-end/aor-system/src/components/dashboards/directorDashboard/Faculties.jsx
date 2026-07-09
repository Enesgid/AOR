import { Link } from "react-router-dom";
import DashboardHeader from "../analysis/DashboardHeader";
import Sidebar from "../analysis/Sidebar";
import Topbar from "../analysis/TopBar";
import { processDashboardAnalytics } from "../../../utils/dashboardAnalytics.jsx"; 

import {
  Building2,
  TrendingUp,
  Award,
  Menu,
  GraduationCap,
} from "lucide-react";

import { useState, useEffect } from "react";

const Faculties = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  
  // States to hold the live processed data
  const [schoolsData, setSchoolsData] = useState([]);
  const [insights, setInsights] = useState({
    topSchool: { Schools: "None", effort: 0 },
    averageEffort: "0.0",
  });
  const [loading, setLoading] = useState(true);

  // FETCH REAL SUBMISSIONS FROM THE BACKEND
const fetchSubmissionsData = async () => {
  try {
    const token = localStorage.getItem("token");

    const response = await fetch(
      "http://localhost:5000/api/submissions",
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    const data = await response.json();

    const processed =
      processDashboardAnalytics(data);

    setSchoolsData(processed.schoolsData);
    setInsights(processed.insights);
  } catch (error) {
    console.error(error);
  } finally {
    setLoading(false);
  }
};

useEffect(() => {
  fetchSubmissionsData();
}, []);

  const getStatus = (effort) => {
    if (effort >= 80) return "Excellent";
    if (effort >= 65) return "Good";
    if (effort >= 50) return "Average";
    return "Poor";
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100">
        <div className="text-gray-500 font-semibold animate-pulse">
          Loading ...
        </div>
      </div>
    );
  }
  const totalFacultiesCount = schoolsData.length;
  const averageEffort = insights.averageEffort;
  const topSchool = insights.topSchool;
  
  const handleApproveSchool = async (schoolName) => {
  try {
    const token = localStorage.getItem("token");

    const response = await fetch(
      "http://localhost:5000/api/submissions/approve-school",
      {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ schoolName }),
      }
    );

    if (response.ok) {
      alert(`${schoolName} validated successfully`);
      fetchSubmissionsData();
    } else {
      alert("School approval failed");
    }
  } catch (err) {
    console.error(err);
  }
};

  return (
    <div className="flex bg-gray-100 min-h-screen ">

      {/* Sidebar Navigation */}

      <Sidebar
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
      />
        {/* mobile view */}
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

      <div className="flex-1 lg:ml-64 p-3 sm:p-6 pt-20 lg:pt-6 overflow-hidden">

        <Topbar />
        
        <DashboardHeader
          title="Analysis of schools"
          subtitle="search and monitor performance across different schools in the institutions"
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
          showExport ={false}
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 sm:gap-5 mb-8">

          {/* Core Scale Card */}
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
            <div className="flex items-center gap-3 sm:gap-4">
              <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-xl bg-blue-100 flex items-center justify-center">
                <Building2 className="text-blue-700" size={22} />
              </div>
              <div>
                <p className="text-gray-400 text-xs font-semibold uppercase tracking-wider">Total schools</p>
                <h1 className="text-xl sm:text-2xl font-bold text-gray-800 mt-0.5">{totalFacultiesCount}</h1>
              </div>
            </div>
          </div>

          {/* Compliance Card */}
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
            <div className="flex items-center gap-3 sm:gap-4">
              <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-xl bg-green-100 flex items-center justify-center">
                <TrendingUp className="text-green-700" size={22} />
              </div>
              <div>
                <p className="text-gray-400 text-xs font-semibold uppercase tracking-wider">Submission Rate</p>
                <h1 className="text-xl sm:text-2xl font-bold text-gray-800 mt-0.5">82.4%</h1>
              </div>
            </div>
          </div>

          {/* Total Average Card */}
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
            <div className="flex items-center gap-3 sm:gap-4">
              <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-xl bg-amber-100 flex items-center justify-center">
                <GraduationCap className="text-amber-700" size={22} />
              </div>
              <div>
                <p className="text-gray-400 text-xs font-semibold uppercase tracking-wider">Total Institutional Input %</p>
                <h1 className="text-xl sm:text-2xl font-bold text-gray-800 mt-0.5">{averageEffort}%</h1>
              </div>
            </div>
          </div>

          {/* Outperformer Card */}
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
            <div className="flex items-center gap-3 sm:gap-4">
              <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-xl bg-purple-100 flex items-center justify-center">
                <Award className="text-purple-700" size={22} />
              </div>
              <div>
                <p className="text-gray-400 text-xs font-semibold uppercase tracking-wider">Top Performing School </p>
                <h1 className="text-lg sm:text-xl font-bold text-gray-800 mt-0.5">{topSchool?.Schools || "None"}</h1>
              </div>
            </div>
          </div>

        </div>

        {/* Primary Analytical Data Matrix Table */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">

          {/* Section Description Header Block */}
          <div className="p-4 sm:p-6 border-b border-gray-100">
            <h2 className="text-lg sm:text-xl font-semibold text-gray-800">
              Institutional Performance
            </h2>
            <p className="text-sm text-gray-500 mt-1">
              Cross-sectional compliance analysis across academic divisions, leadership staff, and seniority distributions
            </p>
          </div>

          {/* Scroll Vector Container */}
          <div className="overflow-x-auto w-full">
            <table className="w-full min-w-[950px]">
              <thead className="bg-gray-50">
                <tr>
                  <th className="text-center p-4 text-xs font-bold uppercase text-gray-500">S/N</th>
                  <th className="text-left p-4 text-xs font-bold uppercase text-gray-500">School</th>
                  <th className="text-left p-4 text-xs font-bold uppercase text-gray-500">Dean</th>
                  <th className="text-center p-4 text-xs font-bold uppercase text-gray-500">Departments</th>
                  <th className="text-center p-4 text-xs font-bold uppercase text-gray-500">Total Input</th>
                  <th className="text-center p-4 text-xs font-bold uppercase text-gray-500">Effort</th>
                  <th className="text-center p-4 text-xs font-bold uppercase text-gray-500">Status</th>
                  <th className="text-center p-4 text-xs font-bold uppercase text-gray-500">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {[...schoolsData]
                  .sort((a, b) => b.effort - a.effort)
                  .filter((item) => {
                    const search = searchTerm.toLowerCase();
                    const schoolMatch = item.Schools ? item.Schools.toLowerCase().includes(search) : false;
                    const deanMatch = item.dean ? item.dean.toLowerCase().includes(search) : false;
                    return schoolMatch || deanMatch;
                  })
                  .map((item, index) => (
                    <tr key={index} className="hover:bg-gray-50 transition-all">
                      <td className="p-4 text-center text-gray-700">{index + 1}</td>
                      <td className="p-4 font-medium text-gray-800">{item.Schools}</td>
                      <td className="p-4">{item.dean}</td>

                      <td className="p-4 text-center">
                        {Array.isArray(item.departments) ? item.departments.length : (item.departmentsCount || 0)}
                      </td>

                      <td className="p-4 text-center font-semibold">
                        {item.totalInput.toLocaleString()}
                      </td>

                      <td className="p-4">
                        <div className="flex items-center gap-3 justify-center">
                          <span className="font-semibold text-sm">
                            {item.effort}%
                          </span>
                        </div>
                      </td>

                      <td className="p-4 text-center">
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-semibold
                            ${
                              getStatus(item.effort) === "Excellent"
                                ? "bg-green-100 text-green-700"
                                : item.status === "Good"
                                ? "bg-blue-100 text-blue-700"
                                : item.status === "Average"
                                ? "bg-yellow-100 text-yellow-700"
                                : "bg-red-100 text-red-700"
                            }
                          `}
                        >
                          {getStatus(item.effort)}
                        </span>
                      </td>

                      <td >
                        <Link to={`/departments/${item.Schools}`}>
                          <button className="btn btn-preview">
                            View More
                          </button>
                         
                        </Link> 
                      <button
                        disabled={item.pendingDirectorCount === 0}
                        onClick={() =>
                          handleApproveSchool(item.Schools)
                        }
                        className={`btn ${
                          item.pendingDirectorCount === 0
                            ? "btn-disabled"
                            : "btn-save"
                        } mt-1`}
                        >
                        {item.pendingDirectorCount === 0
                          ? "Validated"
                          : `Validate (${item.pendingDirectorCount})`}
                      </button>
                      </td>
                    </tr>
                  ))}
              </tbody>  
            </table>
          </div>

        </div>

      </div>
    </div>
  );
};

export default Faculties;