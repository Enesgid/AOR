import { Link, useLocation } from "react-router-dom";
import DashboardHeader from "../analysis/DashboardHeader";
import Sidebar from "../analysis/Sidebar";
import Topbar from "../analysis/TopBar";
import { processDashboardAnalytics } from "../../../utils/dashboardAnalytics.jsx"; 
import { getCurrentToken } from "../../../utils/session";
import {
  Building2,
  TrendingUp,
  Award,
  Menu,
  GraduationCap,
} from "lucide-react";

import { useState, useEffect, useRef } from "react";
import { errorAlert, successAlert } from "../../../utils/alerts.js";
import API_BASE_URL from "../../../config/api";

const Faculties = () => {
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [cycleInfo, setCycleInfo] = useState({ session: "", semester: "" });
  const [activeCycle, setActiveCycle] = useState({ session: "2025/2026", semester: "First Semester" });
  const [fetchError, setFetchError] = useState("");
  const requestIdRef = useRef(0);
  
  // States to hold the live processed data
  const [schoolsData, setSchoolsData] = useState([]);
  const [submissions, setSubmissions] = useState([]);
  const [totalLecturers, setTotalLecturers] = useState(0);
  const [insights, setInsights] = useState({
    topSchool: { Schools: "None", effort: 0 },
    averageEffort: "0.0",
  });
  const [loading, setLoading] = useState(true);

  const getCycleFromSearch = () => {
    const params = new URLSearchParams(location.search);
    const session = params.get("session")?.trim() || "";
    const semester = params.get("semester")?.trim() || "";
    return { session, semester };
  };

  const fetchActiveCycle = async () => {
    try {
      const token = getCurrentToken();
      const response = await fetch(`${API_BASE_URL}/api/settings`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) {
        return;
      }

      const data = await response.json();
      setActiveCycle({
        session: data?.academicSession || "2025/2026",
        semester: data?.semester || "First Semester",
      });
    } catch (error) {
      console.error("Unable to load active academic cycle settings.", error);
    }
  };

  // FETCH REAL SUBMISSIONS FROM THE BACKEND
const fetchSubmissionsData = async () => {
  const cycle = getCycleFromSearch();
  const hasSession = Boolean(cycle.session);
  const hasSemester = Boolean(cycle.semester);
  const requestId = Date.now() + Math.random();
  requestIdRef.current = requestId;

  if (hasSession !== hasSemester) {
    setFetchError("The selected academic cycle is incomplete. Please choose both session and semester.");
    setSubmissions([]);
    setSchoolsData([]);
    setInsights({ topSchool: { Schools: "None", effort: 0 }, averageEffort: "0.0" });
    setLoading(false);
    return;
  }

  try {
    const token = getCurrentToken();
    const headers = {
      Authorization: `Bearer ${token}`,
    };

    const params = new URLSearchParams();
    if (hasSession && hasSemester) {
      params.set("session", cycle.session);
      params.set("semester", cycle.semester);
    }

    const submissionsUrl = `${API_BASE_URL}/api/submissions${params.toString() ? `?${params.toString()}` : ""}`;
    const submissionsResponse = await fetch(submissionsUrl, { headers });

    if (!submissionsResponse.ok) {
      throw new Error("Unable to load school submissions.");
    }

    const data = await submissionsResponse.json();
    if (!requestIdRef.current || requestIdRef.current !== requestId) return;

    const safeData = Array.isArray(data) ? data : [];
    setSubmissions(safeData);
    setFetchError("");

    try {
      const usersResponse = await fetch(
        `${API_BASE_URL}/api/users/count`,
        { headers }
      );
      if (usersResponse.ok) {
        const userCount = await usersResponse.json();
        setTotalLecturers(Number(userCount.totalLecturers) || 0);
      }
    } catch (countError) {
      console.warn("Lecturer count unavailable; school submissions will still be shown.", countError);
    }

    const processed =
      processDashboardAnalytics(safeData);

    setSchoolsData(processed.schoolsData);
    setInsights(processed.insights);
  } catch (error) {
    console.error(error);
    if (!requestIdRef.current || requestIdRef.current !== requestId) return;
    setFetchError("The selected academic cycle could not be loaded. Please try again.");
    setSubmissions([]);
    setSchoolsData([]);
    setInsights({ topSchool: { Schools: "None", effort: 0 }, averageEffort: "0.0" });
  } finally {
    if (!requestIdRef.current || requestIdRef.current === requestId) {
      setLoading(false);
    }
    setCycleInfo(getCycleFromSearch());
  }
};

useEffect(() => {
  fetchActiveCycle();
  fetchSubmissionsData();
}, [location.search]);

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
  const cycleLabel = cycleInfo.session && cycleInfo.semester ? `${cycleInfo.session} • ${cycleInfo.semester}` : "";
  const submittedLecturers = new Set(
    submissions
      .map((submission) => submission.lecturerDetails?.pfNumber?.trim().toLowerCase())
      .filter(Boolean)
  ).size;
  const submissionRate = totalLecturers > 0
    ? ((submittedLecturers / totalLecturers) * 100).toFixed(1)
    : "0.0";
  
  const isHistoricalApprovalBlocked =
    Boolean(cycleInfo.session || cycleInfo.semester) &&
    (cycleInfo.session !== activeCycle.session || cycleInfo.semester !== activeCycle.semester);

  const handleApproveSchool = async (schoolName) => {
  try {
    if (isHistoricalApprovalBlocked) {
      await errorAlert("Historical school approval is not allowed. Please use the active academic cycle.");
      return;
    }

    const token = getCurrentToken();
    const requestBody = {
      schoolName,
      session: cycleInfo.session || activeCycle.session,
      semester: cycleInfo.semester || activeCycle.semester,
    };

    const response = await fetch(
      `${API_BASE_URL}/api/submissions/approve-school`,
      {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(requestBody),
      }
    );

    if (response.ok) {
      await successAlert(`${schoolName} validated successfully`);
      fetchSubmissionsData();
    } else {
      const errorData = await response.json().catch(() => ({}));
      await errorAlert(errorData.message || "School approval failed");
    }
  } catch (err) {
    console.error(err);
    await errorAlert("School approval failed");
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

        {cycleLabel && (
          <div className="mb-4 rounded-xl border border-purple-200 bg-purple-50 px-4 py-3 text-sm font-medium text-purple-700">
            Academic cycle: {cycleLabel}
          </div>
        )}

        {fetchError && (
          <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {fetchError}
          </div>
        )}

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
                <h1 className="text-xl sm:text-2xl font-bold text-gray-800 mt-0.5">{submissionRate}%</h1>
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
                  .map((item, index) => {
                    const resolvedStatus = getStatus(item.effort);
                    const schoolName = item.Schools || "Unknown school";
                    const schoolDepartmentsQuery = new URLSearchParams({
                      session: cycleInfo.session,
                      semester: cycleInfo.semester,
                    }).toString();

                    return (
                      <tr key={`${schoolName}-${index}`} className="hover:bg-gray-50 transition-all">
                        <td className="p-4 text-center text-gray-700">{index + 1}</td>
                        <td className="p-4 font-medium text-gray-800">{schoolName}</td>
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
                                resolvedStatus === "Excellent"
                                  ? "bg-green-100 text-green-700"
                                  : resolvedStatus === "Good"
                                  ? "bg-blue-100 text-blue-700"
                                  : resolvedStatus === "Average"
                                  ? "bg-yellow-100 text-yellow-700"
                                  : "bg-red-100 text-red-700"
                              }
                            `}
                          >
                            {resolvedStatus}
                          </span>
                        </td>

                        <td>
                          <div className="flex flex-col gap-2">
                            <Link to={`/departments/${encodeURIComponent(schoolName)}${schoolDepartmentsQuery ? `?${schoolDepartmentsQuery}` : ""}`}>
                              <button type="button" className="btn btn-preview">
                                View More
                              </button>
                            </Link>
                            <button
                              type="button"
                              disabled={item.pendingDirectorCount === 0 || isHistoricalApprovalBlocked}
                              onClick={() => handleApproveSchool(schoolName)}
                              className={`btn ${
                                item.pendingDirectorCount === 0 || isHistoricalApprovalBlocked ? "btn-disabled" : "btn-save"
                              }`}
                            >
                              {isHistoricalApprovalBlocked
                                ? "Historical cycle"
                                : item.pendingDirectorCount === 0
                                ? "Validated"
                                : `Validate (${item.pendingDirectorCount})`}
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
              </tbody>  
            </table>
          </div>

        </div>
      </div>
    </div>
  );
};

export default Faculties;