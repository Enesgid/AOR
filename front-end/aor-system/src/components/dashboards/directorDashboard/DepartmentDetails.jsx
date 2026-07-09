import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { Menu } from "lucide-react";
import Sidebar from "../analysis/Sidebar";
import Topbar from "../analysis/TopBar";
import DashboardHeader from "../analysis/DashboardHeader";

const DepartmentDetails = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { school, department } = useParams(); // URL params: /departments/:school/:department
  
  // Real database states
  const [lecturersList, setLecturersList] = useState([]);
  const [deptMetrics, setDeptMetrics] = useState({ hod: "Not Signed", totalInput: 0, effort: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLiveDepartmentData = async () => {
      try {
        const token = localStorage.getItem("token");
        const response = await fetch("https://aor-q19z.onrender.com/api/submissions", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        const submissions = await response.json();
        // 1. FILTER: Isolate submissions belonging ONLY to this school AND this department
        const matchingSubmissions = submissions.filter((sub) => {
          const subSchool = sub.lecturerDetails?.school || "";
          const subDept = sub.lecturerDetails?.department || "";
          
          // Match URL format parameters cleanly (handling slug conversion back to text spaces)
          const cleanParamDept = department ? department.toLowerCase().replace(/-/g, " ") : "";
          
          return (
            subSchool.toLowerCase() === school?.toLowerCase() &&
            subDept.toLowerCase() === cleanParamDept
          );
        });

        // Helper to sum array fields safely
        const sumField = (arr, key) => {
          if (!Array.isArray(arr)) return 0;
          return arr.reduce((sum, item) => sum + (parseFloat(item[key]) || 0), 0);
        };

        // 2. TRANSFORM: Convert raw submissions into your component's expected lecturer items schema
        let calculatedTotalInput = 0;
        let runningEffortSum = 0;
        let capturedHod = "Not Signed";

        const formattedLecturers = matchingSubmissions.map((sub, index) => {
          const teachingScore = sumField(sub.teaching, 'qap');
          const adminScore = sumField(sub.administrativeDuties, 'qap');
          const researchScore = sumField(sub.research, 'percentInput');
          
          const totalInputScore = Number(sub.totalDesignatedInput) || (teachingScore + adminScore + researchScore);
          calculatedTotalInput += totalInputScore;
          runningEffortSum += totalInputScore; 

          // Capture Hod Name if signed off cleanly
          if (sub.hodSignature && sub.hodSignature !== "Pending") {capturedHod = sub.hodSignature.split(" - ")[0];}
          return {
            id: sub._id || index,
            name: [
            sub.lecturerDetails?.firstName,
            sub.lecturerDetails?.middleInitial,
            sub.lecturerDetails?.lastName,].filter(Boolean).join(" "),
            rank: sub.lecturerDetails?.position || "Unekwu",
            appointment: sub.lecturerDetails?.appointment || "",
            teaching: Math.round(teachingScore),
            admin: Math.round(adminScore),
            research: Math.round(researchScore),
            totalInput: Math.round(totalInputScore),
            remark: sub.lecturerDetails?.leave ||"",
          };
        });

        const activeLecturerCount = formattedLecturers.length;

        setDeptMetrics({
          hod: capturedHod,
          totalInput: Math.round(calculatedTotalInput),
          effort: activeLecturerCount > 0 ? Math.round(runningEffortSum / activeLecturerCount) : 0
        });
        
        setLecturersList(formattedLecturers);
      } catch (error) {
        console.error("Error generating backend department views:", error);
      } finally {
        setLoading(false);
      }
    };

    if (school && department) {
      fetchLiveDepartmentData();
    }
  }, [school, department]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100">
        <div className="text-gray-500 font-semibold animate-pulse">
          Retrieving academic rosters for {department?.replace(/-/g, " ").toUpperCase()}...
        </div>
      </div>
    );
  }

  // Safe checks against empty dynamic states mapping calculations
  const totalLecturers = lecturersList.length;
  const professors = lecturersList.filter(l => l.rank.toLowerCase().includes("prof") && !l.rank.toLowerCase().includes("assoc")).length;
  const Aprof = lecturersList.filter(l => l.rank.toLowerCase().includes("assoc")).length;
  const SL = lecturersList.filter(l => l.rank.toLowerCase() === "sl" || l.rank.toLowerCase().includes("senior")).length;

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

        <Topbar showBack = {true}/>
        <DashboardHeader
          title={school ? `${school.toUpperCase()} Departments` : "Departments"}
          subtitle={`${department?.replace(/-/g, " ").toUpperCase()} Department`}
          showSearch={false}
          showExport ={false}
        />
        
        <div className="mb-6">
          <span
            className={`px-4 py-2 rounded-full text-sm font-semibold ${
              deptMetrics.effort >= 80
                ? "bg-green-100 text-green-700"
                : deptMetrics.effort >= 60
                ? "bg-yellow-100 text-yellow-700"
                : "bg-red-100 text-red-700"
            }`}
          >
            {deptMetrics.effort >= 80 ? "Excellent" : deptMetrics.effort >= 60 ? "Average" : "Needs Attention"}
          </span>
        </div>

        {/* Summary Cards Grid Layout */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5 mb-8">
          <div className="bg-white p-5 rounded-2xl shadow-sm">
            <p className="text-sm text-gray-500">HOD</p>
            <h2 className="text-xl font-bold mt-2 text-gray-800">{deptMetrics.hod}</h2>
          </div>

          <div className="bg-white p-5 rounded-2xl shadow-sm">
            <p className="text-sm text-gray-500">Lecturers</p>
            <h2 className="text-3xl font-bold mt-2 text-gray-900">{totalLecturers}</h2>
          </div>

          <div className="bg-white p-5 rounded-2xl shadow-sm">
            <p className="text-sm text-gray-500">Professors</p>
            <h2 className="text-3xl font-bold mt-2 text-gray-900">{professors}</h2>
          </div> 
          
          <div className="bg-white p-5 rounded-2xl shadow-sm">
            <p className="text-sm text-gray-500">Senior Lecturers</p>
            <h2 className="text-3xl font-bold mt-2 text-gray-900">{SL}</h2>
          </div> 
          
          <div className="bg-white p-5 rounded-2xl shadow-sm">
            <p className="text-sm text-gray-500">Assoc. Professors</p>
            <h2 className="text-3xl font-bold mt-2 text-gray-900">{Aprof}</h2>
          </div>
          
          <div className="bg-white p-5 rounded-2xl shadow-sm">
            <p className="text-sm text-gray-500">Total Input</p>
            <h2 className="text-3xl font-bold mt-2 text-blue-600">{deptMetrics.totalInput.toLocaleString()}</h2>
          </div>

          <div className="bg-white p-5 rounded-2xl shadow-sm">
            <p className="text-sm text-gray-500">Department Effort</p>
            <h2 className="text-3xl font-bold mt-2 text-purple-700">{deptMetrics.effort}%</h2>
          </div>
        </div>

        {/* Lecturer Performance Matrix Table */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-6 border-b">
             <h2 className="text-lg sm:text-xl font-semibold text-gray-800"> Lecturer Performance Records</h2>
          </div>
          <div className=" overflow-x-auto w-full">
            <table className="w-full min-w-[1000px]">
              <thead className="bg-gray-50 text-xs font-bold uppercase text-gray-500 border-b">
                <tr>
                  <th className="p-4 text-left">Name</th>
                  <th className="p-4 text-left">Rank</th>
                  <th className="p-4 text-left">Appointment</th>
                  <th className="p-4 text-center">Teaching</th>
                  <th className="p-4 text-center">Admin</th>
                  <th className="p-4 text-center">Research</th>
                  <th className="p-4 text-center">Total Input</th>
                  <th className="p-4 text-left">Remark</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-sm text-gray-700">
                {lecturersList.map((lecturer) => (
                  <tr key={lecturer.id} className="hover:bg-gray-50 transition-all">
                    <td className="p-4 font-medium text-gray-900 whitespace-nowrap">{lecturer.name}</td>
                    <td className="p-4 whitespace-nowrap">{lecturer.rank}</td>
                    <td className="p-4 whitespace-nowrap">{lecturer.appointment}</td>
                    <td className="p-4 text-center whitespace-nowrap">{lecturer.teaching}</td>
                    <td className="p-4 text-center whitespace-nowrap">{lecturer.admin}</td>
                    <td className="p-4 text-center whitespace-nowrap">{lecturer.research}</td>
                    <td className="p-4 font-semibold text-center text-purple-700 whitespace-nowrap">{lecturer.totalInput}</td>
                    <td className="p-4 whitespace-nowrap">
                      
                        {lecturer.remark}
                    </td>
                  </tr>
                ))}
                {lecturersList.length === 0 && (
                  <tr>
                    <td colSpan="8" className="text-center py-8 text-gray-400 font-medium">
                      No Submission available Yet
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DepartmentDetails;