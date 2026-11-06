import { useState, useEffect,useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Menu, ArrowRight } from "lucide-react";
import { processDashboardAnalytics } from "../../utils/dashboardAnalytics.jsx";
import getPieChartData from "./analysis/dashboardAnalytics.jsx";
import { getDashboardStats } from "../../utils/dashboardStats.jsx";
import Alerts from "./analysis/Alerts";
import SchoolPerformanceChart from "./analysis/SchoolPerformanceChart";
import Sidebar from "./analysis/Sidebar";
import SubmissionLineChart from "./analysis/SubmissionLineChart";
import SubmissionPieChart from "./analysis/SubmissionPieChart";
import StatCard from "./analysis/StatCard";
import AIFloatingButton from "./analysis/AIFloatingButton.jsx";
import Topbar from "./analysis/TopBar.jsx";
import DashboardHeader from "./analysis/DashboardHeader.jsx";
import { exportDashboardExcel } from "../../utils/ExportExcel.jsx";
import { exportDashboardPDF } from "../../utils/ExportPdfAnalysis.jsx";
import { getCurrentToken, getCurrentUser } from "../../utils/session";
import DirectorPdfReport from "./analysis/DirectorPdfReport.jsx";
import API_BASE_URL from "../../config/api";

const DirectorDashboard = () => {
  const navigate = useNavigate();
  const currentUser = getCurrentUser();
  const isDirector = currentUser?.role === "Director";
  const [aiAssistant, setAiAssistant] = useState(
    () => JSON.parse(localStorage.getItem("aiAssistant")) ?? false
  );
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [submissions, setSubmissions] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [institutionalCycle, setInstitutionalCycle] = useState({
    session: "2025/2026",
    semester: "First Semester",
  });
  const [selectedSession, setSelectedSession] = useState("2025/2026");
  const [selectedSemester, setSelectedSemester] = useState("First Semester");
  const [draftSession, setDraftSession] = useState("2025/2026");
  const [draftSemester, setDraftSemester] = useState("First Semester");
  const [settingsReady, setSettingsReady] = useState(false);
  const [sessionsReady, setSessionsReady] = useState(false);
  const [isCycleInitialized, setIsCycleInitialized] = useState(false);
  const [isLoadingSubmissions, setIsLoadingSubmissions] = useState(false);
  const [submissionError, setSubmissionError] = useState("");
  const [activeChart, setActiveChart] = useState(null);
  const reportRef = useRef(null);
  const latestRequestIdRef = useRef(0);

  const handleExcelExport = () => {
    exportDashboardExcel(submissions, schoolsData, insights, selectedSession, selectedSemester);
  };

  const [autoRefresh, setAutoRefresh] = useState(
    JSON.parse(localStorage.getItem("autoRefresh")) ?? false
  );

  useEffect(() => {
    const syncAutoRefresh = () => {
      setAutoRefresh(JSON.parse(localStorage.getItem("autoRefresh")) ?? false);
    };

    const handleStorage = () => syncAutoRefresh();
    const handleRefreshChange = () => syncAutoRefresh();

    window.addEventListener("storage", handleStorage);
    window.addEventListener("auto-refresh-changed", handleRefreshChange);

    return () => {
      window.removeEventListener("storage", handleStorage);
      window.removeEventListener("auto-refresh-changed", handleRefreshChange);
    };
  }, []);

  const handlePdfExport = () => {
    exportDashboardPDF(reportRef, selectedSession, selectedSemester);
  };

  const normalizeSessionOptions = (items = []) => {
    const values = [];

    items.forEach((value) => {
      if (!value) return;
      const sessionName = String(value).trim();
      if (sessionName) values.push(sessionName);
    });

    return [...new Set(values)].sort((a, b) => {
      const yearA = Number(String(a).match(/(\d{4})\//)?.[1] || 0);
      const yearB = Number(String(b).match(/(\d{4})\//)?.[1] || 0);
      return yearB - yearA;
    });
  };

  const handleApplyView = () => {
    const nextSession = draftSession?.trim();
    const nextSemester = draftSemester?.trim();

    if (!nextSession || !nextSemester) {
      setSubmissionError("Please choose a valid session and semester.");
      return;
    }

    if (!['First Semester', 'Second Semester'].includes(nextSemester)) {
      setSubmissionError("Unsupported semester selection.");
      return;
    }

    setSelectedSession(nextSession);
    setSelectedSemester(nextSemester);
    setSubmissionError("");
  };

  const fetchSubmissions = async () => {
    if (!selectedSession || !selectedSemester) return;

    const token = getCurrentToken();
    const requestId = Date.now() + Math.random();
    latestRequestIdRef.current = requestId;
    setIsLoadingSubmissions(true);
    setSubmissionError("");

    try {
      const params = new URLSearchParams();
      params.append("session", selectedSession);
      params.append("semester", selectedSemester);

      const response = await fetch(`${API_BASE_URL}/api/submissions?${params.toString()}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) {
        if (latestRequestIdRef.current !== requestId) return;
        setSubmissions([]);
        setSubmissionError(`Unable to load records for ${selectedSession} (${selectedSemester}).`);
        return;
      }

      const data = await response.json();

      if (!Array.isArray(data)) {
        if (latestRequestIdRef.current !== requestId) return;
        setSubmissions([]);
        setSubmissionError("The server did not return a valid submissions list.");
        return;
      }

      if (latestRequestIdRef.current !== requestId) return;
      setSubmissions(data);
      setSubmissionError("");
    } catch (error) {
      if (latestRequestIdRef.current !== requestId) return;
      console.error(error);
      setSubmissions([]);
      setSubmissionError("Failed to load records for the selected academic cycle.");
    } finally {
      if (latestRequestIdRef.current === requestId) {
        setIsLoadingSubmissions(false);
      }
    }
  };

  const fetchGlobalSettings = async () => {
    try {
      const token = getCurrentToken();
      const response = await fetch(`${API_BASE_URL}/api/settings`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();

      const nextSession = data?.academicSession || "2025/2026";
      const nextSemester = data?.semester || "First Semester";

      setInstitutionalCycle({ session: nextSession, semester: nextSemester });
      setSelectedSession(nextSession);
      setSelectedSemester(nextSemester);
      setDraftSession(nextSession);
      setDraftSemester(nextSemester);
      setSettingsReady(true);
    } catch (error) {
      console.error("Failed to load institution settings", error);
      setInstitutionalCycle({ session: "2025/2026", semester: "First Semester" });
      setSelectedSession("2025/2026");
      setSelectedSemester("First Semester");
      setDraftSession("2025/2026");
      setDraftSemester("First Semester");
      setSettingsReady(true);
    }
  };

  const fetchSessions = async () => {
    try {
      const token = getCurrentToken();
      const res = await fetch(`${API_BASE_URL}/api/submissions/sessions`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      const sessionOptions = normalizeSessionOptions([
        data?.currentSession,
        ...(Array.isArray(data?.sessions) ? data.sessions : []),
      ]);

      setSessions(sessionOptions);
      if (sessionOptions.length > 0 && !selectedSession) {
        setSelectedSession(sessionOptions[0]);
        setDraftSession(sessionOptions[0]);
      }
      setSessionsReady(true);
    } catch (err) {
      console.error("Failed to load sessions", err);
      setSessions([]);
      setSessionsReady(true);
    }
  };

  useEffect(() => {
    fetchGlobalSettings();
    fetchSessions();
  }, []);

  useEffect(() => {
    setIsCycleInitialized(settingsReady && sessionsReady);
  }, [settingsReady, sessionsReady]);

  useEffect(() => {
    if (!isCycleInitialized || !selectedSession || !selectedSemester) return;
    fetchSubmissions();
  }, [isCycleInitialized, selectedSession, selectedSemester]);

  useEffect(() => {
    if (!autoRefresh || !isCycleInitialized || !selectedSession || !selectedSemester) return;

    const interval = setInterval(() => {
      fetchSubmissions();
    }, 30000);

    return () => clearInterval(interval);
  }, [autoRefresh, isCycleInitialized, selectedSession, selectedSemester]);

  useEffect(() => {
    const handleStorageChange = () => {
      setAiAssistant(JSON.parse(localStorage.getItem("aiAssistant")) ?? false);
    };

    window.addEventListener("storage", handleStorageChange);

    return () => {
      window.removeEventListener("storage", handleStorageChange);
    };
  }, []);

  const isHistoricalView =
    selectedSession !== institutionalCycle.session ||
    selectedSemester !== institutionalCycle.semester;

  const dashboardStats = getDashboardStats(submissions);
  const pieChartData = getPieChartData(submissions);
  const { schoolsData, lineData, insights } = processDashboardAnalytics(submissions);

  const pendingHod = pieChartData.find(item => item.name === "Pending HOD")?.value || 0;
  const pendingDean = pieChartData.find(item => item.name === "Pending Dean")?.value || 0;
  const pendingDirector = pieChartData.find(item => item.name === "Pending Director")?.value || 0;
  const [searchTerm, setSearchTerm] = useState("");

  const totalSubmissions = submissions.length;
  const dashboardFaculties = [...schoolsData].sort((a, b) => b.effort - a.effort).slice(0, 4);
  const facultiesQuery = new URLSearchParams({
    session: selectedSession,
    semester: selectedSemester,
  }).toString();
  const filteredSubmissions = submissions.filter((sub) => {
    const fullName = `${sub.lecturerDetails?.firstName || ""} ${sub.lecturerDetails?.lastName || ""}`;

    return (
      fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      sub.lecturerDetails?.pfNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      sub.lecturerDetails?.department?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  });

  return (
    <div className="flex bg-gray-100 dark:bg-gray-800 dark:text-white min-h-screen">
      {/* Sidebar */}
      <Sidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />

      <div className="flex-1 lg:ml-64 p-4 sm:p-6 pt-20 lg:pt-6">
        {!sidebarOpen && (
          <button
            className="lg:hidden fixed top-4 left-4 z-[60] bg-white p-3 rounded-xl shadow-md border border-gray-200 cursor-pointer"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu size={24} />
          </button>
        )}

        <Topbar />
        <div className="mb-8">
          <DashboardHeader
            title="Director Dashboard"
            subtitle="Monitor overall institutional performance"
            onExcelExport={handleExcelExport}
            onPdfExport={handlePdfExport}
            sessions={sessions}
            selectedSession={selectedSession}
            selectedSemester={selectedSemester}
            setSelectedSession={setSelectedSession}
            setSelectedSemester={setSelectedSemester}
            draftSession={draftSession}
            setDraftSession={setDraftSession}
            draftSemester={draftSemester}
            setDraftSemester={setDraftSemester}
            onApplyView={handleApplyView}
            isHistoricalView={isHistoricalView}
            isLoading={isLoadingSubmissions}
            submissionError={submissionError}
            searchTerm={searchTerm}
            setSearchTerm={setSearchTerm}
          />
        </div>

        {submissionError && (
          <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {submissionError}
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-4 mb-8">
          {dashboardStats.map((item, index) => (
            <StatCard
              key={index}
              title={item.title}
              value={item.value}
              subtitle={item.subtitle}
              icon={item.icon}
              iconBg={item.iconBg}
              onClick={
                item.title === "Pending"
                  ? () => navigate("/pending")
                  : item.title === "Rejected"
                    ? () => navigate("/rejected")
                    : undefined
              }
            />
          ))}
        </div>


        {/* Charts Backdrop Blur */}
        {activeChart && (
          <div className="fixed top-0 left-64 right-0 bottom-0 lg:backdrop-blur-sm lg:bg-black/10 z-40 pointer-events-none" />
        )}

        <div className="relative mb-6 overflow-visible">
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
            {/* Pie Chart Using Your Direct Module */}
            <div
              onMouseEnter={() => setActiveChart("pie")}
              onMouseLeave={() => setActiveChart(null)}
              className={`relative transition-all duration-300 ${activeChart === "pie" ? "lg:z-[100] lg:w-[100vh] lg:h-[60vh]" : ""}`}
            >
              <SubmissionPieChart data={pieChartData} />
            </div>
            <SchoolPerformanceChart
              schoolsData={schoolsData}
              activeChart={activeChart}
              setActiveChart={setActiveChart}
            />
            <div
              onMouseEnter={() => setActiveChart("line")}
              onMouseLeave={() => setActiveChart(null)}
              className={`relative transition-all duration-300 ${activeChart === "line" ? "lg:z-[100] lg:w-[100vh] lg:h-[60vh] lg:right-[350px]" : ""}`}
            >
              <SubmissionLineChart data={lineData} />
            </div>
          </div>  
        </div>

        {/* Bottom Analytics Section */}
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 mb-6 overflow-hidden">
          <div className="xl:col-span-7 bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h2 className="text-lg font-semibold text-gray-800">School Performance Summary</h2>
                <p className="text-sm text-gray-500 mt-1">Top 4 schools by effort score</p>
              </div>
              <Link to={`/faculties?${facultiesQuery}`} className="decoration-transparent">
                <button className="flex btn btn-preview">
                  View All
                  <ArrowRight size={16} className="ml-2" />
                </button>
              </Link>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full overflow-x-auto">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left pb-4">School</th>
                    <th className="text-left pb-4">Dean</th>
                    <th className="text-center pb-4">Departments</th>
                    <th className="text-center pb-4">Total Input</th>
                    <th className="text-center pb-4">Effort</th>
                    <th className="text-center pb-4">Status</th>
                  </tr>
                </thead>
                <tbody className="text-sm text-gray-600">
                  {dashboardFaculties.map((school, index) => (
                    <tr key={index} className="border-b border-gray-100 hover:bg-purple-50 transition-all">
                      <td className="py-5 font-medium text-gray-900">{school.Schools}</td>
                      <td>{school.dean}</td>
                      <td className="text-center">{school.departmentsCount}</td>
                      <td className="text-center">{school.totalInput.toLocaleString()}</td>
                      <td className="text-center font-bold text-purple-700">{school.effort}%</td>
                      <td className="text-center">
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                          school.status === "Excellent" ? "bg-green-100 text-green-700" :
                          school.status === "Good" ? "bg-blue-100 text-blue-700" :
                          school.status === "Average" ? "bg-yellow-100 text-yellow-700" : "bg-red-100 text-red-700"
                        }`}>
                          {school.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                  {dashboardFaculties.length === 0 && (
                    <tr>
                      <td colSpan="6" className="text-center py-6 text-gray-400">No school submission data found yet.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
          <div className="xl:col-span-5 bg-white rounded-2xl border border-gray-200 shadow-sm px-6">
            <h2 className="text-lg font-semibold text-gray-800">Pending Approvals</h2>
            <p className="text-sm text-gray-500 mt-1 mb-6">Approval workflow overview</p>

            <div className="space-y-4">
              {/* HOD */}
              <div
                className="cursor-pointer rounded-xl border border-gray-100 p-4 transition hover:-translate-y-1 hover:shadow-md"
                onClick={() => navigate("/pending?status=Pending%20HOD")}
                onKeyDown={(event) => {
                  if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    navigate("/pending?status=Pending%20HOD");
                  }
                }}
                role="button"
                tabIndex={0}
              >
                <h3 className="text-3xl font-bold text-yellow-500">{pendingHod}</h3>
                <p className="text-sm text-gray-500 mt-1">Pending HOD Approval</p>
                <div className="mt-4 h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div className="h-full bg-yellow-500 rounded-full" style={{ width: `${totalSubmissions > 0 ? (pendingHod / totalSubmissions) * 100 : 0}%` }} />
                </div>
              </div>

              {/* Dean */}
              <div
                className="cursor-pointer rounded-xl border border-gray-100 p-4 transition hover:-translate-y-1 hover:shadow-md"
                onClick={() => navigate("/pending?status=Pending%20Dean")}
                onKeyDown={(event) => {
                  if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    navigate("/pending?status=Pending%20Dean");
                  }
                }}
                role="button"
                tabIndex={0}
              >
                <h3 className="text-3xl font-bold text-blue-600">{pendingDean}</h3>
                <p className="text-sm text-gray-500 mt-1">Pending Dean Approval</p>
                <div className="mt-4 h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div className="h-full bg-blue-600 rounded-full" style={{ width: `${totalSubmissions > 0 ? (pendingDean / totalSubmissions) * 100 : 0}%` }} />
                </div>
              </div>

              {/* Director */}
              <div
                className="cursor-pointer rounded-xl border border-gray-100 p-4 transition hover:-translate-y-1 hover:shadow-md"
                onClick={() => navigate("/pending?status=Pending%20Director")}
                onKeyDown={(event) => {
                  if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    navigate("/pending?status=Pending%20Director");
                  }
                }}
                role="button"
                tabIndex={0}
              >
                <h3 className="text-3xl font-bold text-red-500">{pendingDirector}</h3>
                <p className="text-sm text-gray-500 mt-1">Pending Director Approval</p>
                <div className="mt-4 h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div className="h-full bg-red-500 rounded-full" style={{ width: `${totalSubmissions > 0 ? (pendingDirector / totalSubmissions) * 100 : 0}%` }} />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Dynamic Insight Bottom Cards - Powered entirely by processDashboardAnalytics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
            <p className="text-sm text-gray-500">Top Performing School</p>
            <h3 className="text-2xl font-bold text-green-600 mt-2">{insights.topSchool.Schools}</h3>
            <p className="text-sm text-gray-500 mt-1">{insights.topSchool.effort}% Effort Score</p>
          </div>

          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
            <p className="text-sm text-gray-500">Lowest Performing School</p>
            <h3 className="text-2xl font-bold text-red-500 mt-2">{insights.lowestSchool.Schools}</h3>
            <p className="text-sm text-gray-500 mt-1">{insights.lowestSchool.effort}% Effort Score</p>
          </div>

          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
            <p className="text-sm text-gray-500">Total School Input</p>
            <h3 className="text-2xl font-bold text-blue-600 mt-2">{insights.totalInput.toLocaleString()}</h3>
            <p className="text-sm text-gray-500 mt-1">Avg Effort: {insights.averageEffort} %</p>
          </div>
        </div>
        <Alerts />
        {isDirector && aiAssistant && (
  <AIFloatingButton />
)}
        <div
          style={{
          position: "absolute",
          left: "-9999px",
          top: 0,
          }}
          >

          <DirectorPdfReport
              ref={reportRef}
              submissions={submissions}
              pieChartData={pieChartData}
              schoolData={schoolsData}
              lineData={lineData}
              session={selectedSession}
              semester={selectedSemester}
          />

          </div>
      </div>
      
    </div>
  );
};

export default DirectorDashboard;