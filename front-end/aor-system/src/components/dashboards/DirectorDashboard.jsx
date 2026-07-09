import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
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
import Topbar from "./analysis/TopBar.jsx";
import DashboardHeader from "./analysis/DashboardHeader.jsx";
import { exportDashboardExcel } from "../../utils/ExportExcel.jsx";

const DirectorDashboard = ({ aiEngineActive = true }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [submissions, setSubmissions] = useState([]);
  const [activeChart, setActiveChart] = useState(null);
  const handleExcelExport = () => {
  exportDashboardExcel(
    submissions,
    schoolsData,
    insights
  );
};
const [autoRefresh, setAutoRefresh] = useState(
  JSON.parse(localStorage.getItem("autoRefresh")) ?? false
);
useEffect(() => {
  const handleStorage = () => {
    setAutoRefresh(
      JSON.parse(localStorage.getItem("autoRefresh")) ?? false
    );
  };

  window.addEventListener("storage", handleStorage);

  return () =>
    window.removeEventListener(
      "storage",
      handleStorage
    );
}, []);
const handlePdfExport = () => {
  console.log("PDF Export");
};

 const fetchSubmissions = async () => {
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

    setSubmissions(data);

  } catch (error) {
    console.error(error);
  }
};
useEffect(() => {
  fetchSubmissions();
}, []);
useEffect(() => {
  if (!autoRefresh) return;

  const interval = setInterval(() => {
    fetchSubmissions();
  }, 30000); // every 30 seconds

  return () => clearInterval(interval);

}, [autoRefresh]);

  const dashboardStats = getDashboardStats(submissions);
  const pieChartData = getPieChartData(submissions); 
 const {schoolsData, lineData, insights,} = processDashboardAnalytics(submissions);

  const pendingHod = pieChartData.find(item => item.name === "Pending HOD")?.value || 0;
  const pendingDean = pieChartData.find(item => item.name === "Pending Dean")?.value || 0;
  const pendingDirector = pieChartData.find(item => item.name === "Pending Director")?.value || 0;
  const [searchTerm, setSearchTerm] = useState("");
  
  // Total count for progress bar
  const totalSubmissions = submissions.length;
  const dashboardFaculties = [...schoolsData].sort((a, b) => b.effort - a.effort).slice(0, 4);
  const filteredSubmissions = submissions.filter((sub) => {
  const fullName = `${sub.lecturerDetails?.firstName || ""} ${sub.lecturerDetails?.lastName || ""}`;

  return (
    fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    sub.lecturerDetails?.pfNumber
      ?.toLowerCase()
      .includes(searchTerm.toLowerCase()) ||
    sub.lecturerDetails?.department
      ?.toLowerCase()
      .includes(searchTerm.toLowerCase())
  );
});

  return (
    <div className="flex bg-gray-100 dark:bg-gray-800 dark:text-white min-h-screen">
      {/* Sidebar */}
      <Sidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />

      <div className="flex-1 lg:ml-64 p-4 sm:p-6 pt-20 lg:pt-6">
        {/* Mobile Toggle */}
        {!sidebarOpen && (
          <button
            className="lg:hidden fixed top-4 left-4 z-[60] bg-white p-3 rounded-xl shadow-md border border-gray-200 cursor-pointer"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu size={24} />
          </button>
        )}

        {/* Topbar */}
        <Topbar />
        {/* Header */}
        <div className="mb-8">
          <DashboardHeader
            title="Director Dashboard"
            subtitle="Monitor overall institutional performance"  
            onExcelExport={handleExcelExport}
            onPdfExport={handlePdfExport}
            searchTerm={searchTerm}
            setSearchTerm={setSearchTerm}
          />
        </div>

        {/* Stat Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-4 mb-8">
          {dashboardStats.map((item, index) => (
            <StatCard
              key={index}
              title={item.title}
              value={item.value}
              subtitle={item.subtitle}
              icon={item.icon}
              iconBg={item.iconBg}
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
              <Link to="/faculties" className="decoration-transparent">
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
              <div className="border border-gray-100 rounded-xl p-4">
                <h3 className="text-3xl font-bold text-yellow-500">{pendingHod}</h3>
                <p className="text-sm text-gray-500 mt-1">Pending HOD Approval</p>
                <div className="mt-4 h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div className="h-full bg-yellow-500 rounded-full" style={{ width: `${totalSubmissions > 0 ? (pendingHod / totalSubmissions) * 100 : 0}%` }} />
                </div>
              </div>

              {/* Dean */}
              <div className="border border-gray-100 rounded-xl p-4">
                <h3 className="text-3xl font-bold text-blue-600">{pendingDean}</h3>
                <p className="text-sm text-gray-500 mt-1">Pending Dean Approval</p>
                <div className="mt-4 h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div className="h-full bg-blue-600 rounded-full" style={{ width: `${totalSubmissions > 0 ? (pendingDean / totalSubmissions) * 100 : 0}%` }} />
                </div>
              </div>

              {/* Director */}
              <div className="border border-gray-100 rounded-xl p-4">
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

        {aiEngineActive && <Alerts />}
      </div>
    </div>
  );
};

export default DirectorDashboard;