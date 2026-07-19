import Sidebar from "../analysis/Sidebar";
import Topbar from "../analysis/TopBar";
import DashboardHeader from "../analysis/DashboardHeader";
import { Menu } from "lucide-react";
import { useState, useEffect } from "react";
import { Link, useParams } from "react-router-dom";
import DepartmentPerformanceChart from "./DepartmentPerformanceChart";
import { getCurrentToken } from "../../../utils/session";

const Departments = () => {
  const { school } = useParams();

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  
  // LIVE DATABASE BACKEND STATE
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLiveSubmissions = async () => {
      try {
        const token = getCurrentToken();
        const response = await fetch("https://aor-q19z.onrender.com/api/submissions", {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await response.json();
        setSubmissions(data || []);
      } catch (error) {
        console.error("Error fetching live submissions for department overview:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchLiveSubmissions();
  }, []);

  // Helper helper to sum internal arrays safely
  const sumField = (arr, key) => {
    if (!Array.isArray(arr)) return 0;
    return arr.reduce((sum, item) => sum + (parseFloat(item[key]) || 0), 0);
  };

  // DYNAMIC PROCESSING PIPELINE (Maps directly through raw AOR form collection)
  const processLiveSchoolsData = () => {
    const grouped = submissions.reduce((acc, sub) => {
      // 1. Fallbacks for School and Department names
      const schName = (sub.lecturerDetails?.school || sub.school || "Unassigned").toUpperCase().trim();
      const deptName = sub.lecturerDetails?.department || sub.department || "General / Unassigned";
      
      // 2. Fallbacks for Lecturer Rank
      const rank = (sub.lecturerDetails?.rank || sub.rank || "").toLowerCase();
      
      // 3. Compute Metrics safely from sub-arrays
      const teachingScore = sumField(sub.teaching, 'qap');
      const adminScore = sumField(sub.administrativeDuties, 'qap');
      const researchScore = sumField(sub.research, 'percentInput');
      const totalInputScore = Number(sub.totalDesignatedInput) || (teachingScore + adminScore + researchScore);

      let deanName = "Not Signed";
      if (sub.deanSignature && sub.deanSignature !== "Pending") {
  deanName = sub.deanSignature.split(" - ")[0];
}
      let hodName = "Not Signed";
if (sub.hodSignature && sub.hodSignature !== "Pending") {
  hodName = sub.hodSignature.split(" - ")[0];
}
      if (!acc[schName]) {
        acc[schName] = { school: schName, dean: deanName, deptsMap: {} };
      }
      
      if (deanName !== "Not Signed") acc[schName].dean = deanName;

      if (!acc[schName].deptsMap[deptName]) {
        acc[schName].deptsMap[deptName] = {
          id: deptName.toLowerCase().replace(/\s+/g, "-"),
          name: deptName,
          hod: hodName,
          totalInput: 0,
          totalLecturers: 0,
          professors: 0,
          lecturerInputSum: 0,
        };
      }

      const dObj = acc[schName].deptsMap[deptName];
      if (hodName !== "Not Signed") dObj.hod = hodName;
      dObj.totalInput += totalInputScore;
      dObj.totalLecturers += 1;
      dObj.lecturerInputSum += totalInputScore;
      
      // Check for Professor ranks variations
      if (rank.includes("prof") && !rank.includes("assoc")) dObj.professors += 1;

      return acc;
    }, {});

    return Object.values(grouped).map(sch => {
      const deptsArray = Object.values(sch.deptsMap).map(d => ({
        ...d,
        totalInput: Math.round(d.totalInput),
        departmentEffort: d.totalLecturers > 0 ? Math.round(d.lecturerInputSum / d.totalLecturers) : 0
      }));

      return {
        school: sch.school,
        dean: sch.dean,
        departments: deptsArray
      };
    });
  };

  const liveSchoolsData = processLiveSchoolsData();

  // FILTER DOWN BASED ON URL SELECTION
  const displayedSchools = school
    ? liveSchoolsData.filter((item) => item.school.toLowerCase().trim() === school.toLowerCase().trim())
    : liveSchoolsData;

  const sourceDepartments = school
    ? displayedSchools[0]?.departments || []
    : liveSchoolsData.flatMap((s) => s.departments);

  // Accurate Numeric Summary Blocks Calculations
  const totalSchools = displayedSchools.length;
  const totalDepartments = displayedSchools.reduce((total, s) => total + s.departments.length, 0);
  const totalLecturers = displayedSchools.reduce((total, s) => total + s.departments.reduce((sum, d) => sum + d.totalLecturers, 0), 0);
  
  const currentSchool = displayedSchools[0];

  const averageEffort = totalDepartments > 0
    ? (displayedSchools.reduce((sum, s) => sum + s.departments.reduce((dSum, d) => dSum + d.departmentEffort, 0), 0) / totalDepartments).toFixed(2)
    : "0.00";

  const topDepartment = sourceDepartments.length > 0
    ? sourceDepartments.reduce((best, dept) => (dept.departmentEffort > best.departmentEffort ? dept : best))
    : null;

  const rankedDepartments = [...sourceDepartments].sort((a, b) => b.departmentEffort - a.departmentEffort);
  
  const chartData = rankedDepartments.map((dept) => ({
    name: dept.name,
    departmentEffort: dept.departmentEffort,
  }));

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100 font-semibold text-gray-500 animate-pulse">
        Mapping dynamic AOR forms and building department tallies...
      </div>
    );
  }

  return (
    <div className="flex bg-gray-100 min-h-screen">
      <Sidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />

      <div className="flex-1 lg:ml-60 p-4 sm:p-6 pt-20 lg:pt-6">
        {!sidebarOpen && (
          <button
            className="lg:hidden fixed top-4 left-4 z-[60] bg-white p-3 rounded-xl shadow-md"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu size={24} />
          </button>
        )}

        <Topbar showBack />

        <DashboardHeader
          title={school ? `${school.toUpperCase()} Summary` : "Departments"}
          subtitle={school ? "School department analytics" : "View all departments grouped by school"}
          showSearch={true}
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
          showExport ={false}
          
        />

        {/* Global Summary Tickers - Always shows numbers now */}
        {!school && (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5 mb-8">
            <div className="bg-white rounded-2xl p-5 shadow-sm">
              <p className="text-sm text-gray-500">Best Performed Department</p>
              <h2 className="text-lg font-bold mt-2 text-gray-800">{topDepartment?.name || "None"}</h2>
            </div>
            <div className="bg-white rounded-2xl p-5 shadow-sm">
              <p className="text-sm text-gray-500">Total Departments Listed</p>
              <h2 className="text-3xl font-bold mt-2 text-gray-900">{totalDepartments}</h2>
            </div>
            <div className="bg-white rounded-2xl p-5 shadow-sm">
              <p className="text-sm text-gray-500">Total Registered Staff</p>
              <h2 className="text-3xl font-bold mt-2 text-gray-900">{totalLecturers}</h2>
            </div>
            <div className="bg-white rounded-2xl p-5 shadow-sm">
              <p className="text-sm text-gray-500">Average Global Effort</p>
              <h2 className="text-3xl font-bold mt-2 text-purple-700">{averageEffort}%</h2>
            </div>
          </div>
        )}

        {school && currentSchool && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 mb-8">
            <div className="p-5 border-b">
              <h2 className="text-xl font-semibold text-gray-800">Department Rankings</h2>
              <p className="text-sm text-gray-500 mt-1">Ranked by Department Effort</p>
            </div>
            <div className="p-5">
              <DepartmentPerformanceChart data={chartData} />
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 text-gray-600 text-xs font-bold uppercase">
                  <tr>
                    <th className="p-4 text-left">Rank</th>
                    <th className="p-4 text-left">Department</th>
                    <th className="p-4 text-left">HOD</th>
                    <th className="p-4 text-left">Effort Score</th>
                  </tr>
                </thead>
                <tbody className="text-sm divide-y">
                  {rankedDepartments.map((dept, index) => (
                    <tr key={dept.id} className="hover:bg-gray-50">
                      <td className="p-4 font-bold text-gray-800">{index + 1}</td>
                      <td className="p-4 font-medium text-gray-700">{dept.name}</td>
                      <td className="p-4 text-gray-600">{dept.hod}</td>
                      <td className="p-4 font-semibold text-blue-700">{dept.departmentEffort}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Dynamic School Clusters Render Block */}
        <div className="space-y-8">
          {displayedSchools.map((schItem) => (
            <div key={schItem.school} className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="bg-blue-50 px-6 py-5 border-b flex justify-between items-center">
                <div>
                  <h2 className="text-2xl font-bold text-blue-900">{schItem.school}</h2>
                  <p className="text-gray-600 mt-1">Dean: {schItem.dean}</p>
                </div>
                <span className="bg-blue-100 text-blue-800 text-xs px-3 py-1.5 font-bold uppercase tracking-wider rounded-lg">
                  {schItem.departments.length} Active Departments
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5 p-6">
                {schItem.departments
                  .filter((dept) =>
                    dept.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    dept.hod.toLowerCase().includes(searchTerm.toLowerCase())
                  )
                  .map((dept) => (
                    <div key={dept.id} className="bg-white shadow-md border border-gray-200 rounded-2xl p-5 hover:shadow-xl transition-all duration-300">
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="text-lg font-bold text-gray-800 h-12">{dept.name}</h3>
                          <p className="text-sm text-gray-500 ">HOD: {dept.hod}</p>
                        </div>
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                          dept.departmentEffort >= 80 ? "bg-green-100 text-green-700" : dept.departmentEffort >= 60 ? "bg-yellow-100 text-yellow-700" : "bg-red-100 text-red-700"
                        }`}>
                          {dept.departmentEffort >= 80 ? "Excellent" : dept.departmentEffort >= 60 ? "Average" : "Needs Attention"}
                        </span>
                      </div>

                      {/* Tally Stats grid - Verified numeric data variables */}
                      <div className="grid grid-cols-2 gap-4 mt-5 border-t pt-4">
                        <div>
                          <p className="text-xs text-gray-400 font-medium uppercase tracking-wider">Lecturers</p>
                          <h4 className="font-bold text-lg text-gray-800">{dept.totalLecturers}</h4>
                        </div>
                        <div>
                          <p className="text-xs text-gray-400 font-medium uppercase tracking-wider">Professors</p>
                          <h4 className="font-bold text-lg text-gray-800">{dept.professors}</h4>
                        </div>
                        <div>
                          <p className="text-xs text-gray-400 font-medium uppercase tracking-wider">Total Input</p>
                          <h4 className="font-bold text-lg text-gray-800">{dept.totalInput.toLocaleString()}</h4>
                        </div>
                        <div>
                          <p className="text-xs text-gray-400 font-medium uppercase tracking-wider">Effort</p>
                          <h4 className="font-bold text-lg text-blue-700">{dept.departmentEffort}%</h4>
                        </div>
                      </div>

                      <div className="mt-5">
                        <div className="flex justify-between text-xs mb-1 font-medium text-gray-500">
                          <span>Performance Level</span>
                          <span>{dept.departmentEffort}%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div className="bg-blue-600 h-2 rounded-full" style={{ width: `${Math.min(dept.departmentEffort,100)}%` }} />
                        </div>
                      </div>

                      {/* Direct Routing Endpoint to Lecturer Deep Dive View */}
                      <Link
                        to={`/department/${schItem.school}/${dept.name.toLowerCase().replace(/\s+/g, "-")}`}
                        className="mt-6 block rounded-xl btn btn-preview no-underline text-center text-lg"
                      >
                        View Lecturers
                      </Link>
                    </div>
                  ))}
              </div>
            </div>
          ))}
          
          {displayedSchools.length === 0 && (
            <div className="text-center py-12 text-gray-400 font-medium bg-white rounded-2xl border">
              No Submission yet
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Departments;