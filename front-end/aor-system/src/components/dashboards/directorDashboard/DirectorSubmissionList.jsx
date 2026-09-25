import { useEffect, useState } from "react";
import { AlertCircle, Menu, RefreshCw } from "lucide-react";
import PreviewModal from "../../PreviewModal";
import Sidebar from "../analysis/Sidebar";
import Topbar from "../analysis/TopBar";
import DashboardHeader from "../analysis/DashboardHeader";
import { getCurrentToken } from "../../../utils/session";
import API_BASE_URL from "../../../config/api";

const SUBMISSIONS_URL = `${API_BASE_URL}/api/submissions`;

const getLecturerName = (submission) => {
  const details = submission.lecturerDetails || {};
  return [details.firstName, details.middleInitial, details.lastName]
    .filter(Boolean)
    .join(" ") || "Unnamed lecturer";
};

export const pendingStatuses = ["Pending HOD", "Pending Dean", "Pending Director"];

const getCurrentHolder = (status) => ({
  "Pending HOD": "HOD",
  "Pending Dean": "Dean",
  "Pending Director": "Director",
}[status] || "-");

const DirectorSubmissionList = ({ status, title, subtitle, emptyMessage }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [submissions, setSubmissions] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [viewingForm, setViewingForm] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchSubmissions = async () => {
    setIsLoading(true);
    setError("");

    try {
      const response = await fetch(SUBMISSIONS_URL, {
        headers: { Authorization: `Bearer ${getCurrentToken()}` },
      });

      if (!response.ok) {
        throw new Error("Unable to load submissions.");
      }

      const data = await response.json();
      const statuses = Array.isArray(status) ? status : [status];
      setSubmissions(Array.isArray(data) ? data.filter((item) => statuses.includes(item.status)) : []);
    } catch (fetchError) {
      console.error("Error fetching director submissions:", fetchError);
      setError("The submission list could not be loaded.");
      setSubmissions([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSubmissions();
  }, [status]);

  const filteredSubmissions = submissions.filter((submission) => {
    const details = submission.lecturerDetails || {};
    const searchableText = [
      getLecturerName(submission),
      details.pfNumber,
      details.department,
      details.school,
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();

    return searchableText.includes(searchTerm.toLowerCase());
  });

  return (
    <div className="flex min-h-screen bg-gray-100 dark:bg-gray-800 dark:text-white">
      <Sidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />

      <main className="min-w-0 flex-1 p-4 pt-20 sm:p-6 sm:pt-20 lg:ml-64 lg:pt-6">
        {!sidebarOpen && (
          <button
            className="fixed left-4 top-4 z-[60] rounded-xl border border-gray-200 bg-white p-3 shadow-md lg:hidden"
            onClick={() => setSidebarOpen(true)}
            aria-label="Open navigation"
          >
            <Menu size={24} />
          </button>
        )}

        <Topbar />
        <DashboardHeader
          title={title}
          subtitle={subtitle}
          showExport={false}
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
        />

        <section className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm dark:bg-gray-900">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-200 px-5 py-4">
            <div>
              <h2 className="text-lg font-semibold text-gray-800 dark:text-white">{title}</h2>
              <p className="text-sm text-gray-500">{filteredSubmissions.length} submission{filteredSubmissions.length === 1 ? "" : "s"}</p>
            </div>
            <button
              className="btn btn-preview inline-flex items-center gap-2"
              onClick={fetchSubmissions}
              disabled={isLoading}
            >
              <RefreshCw size={16} className={isLoading ? "animate-spin" : ""} />
              Refresh
            </button>
          </div>

          {isLoading ? (
            <p className="px-5 py-12 text-center text-gray-500">Loading submissions...</p>
          ) : error ? (
            <div className="flex flex-col items-center gap-3 px-5 py-12 text-center text-red-600">
              <AlertCircle size={24} />
              <p>{error}</p>
              <button className="btn btn-preview" onClick={fetchSubmissions}>Try again</button>
            </div>
          ) : filteredSubmissions.length === 0 ? (
            <p className="px-5 py-12 text-center text-gray-500">{searchTerm ? "No matching submissions found." : emptyMessage}</p>
          ) : (
            <div className="w-full overflow-x-auto overflow-y-auto max-h-[55vh]">
              <table className="w-full min-w-0 text-left text-sm table-auto">
                <thead className="bg-[var(--primary-color)] text-xs uppercase text-white">
                  <tr>
                    <th className="px-5 py-4">PF Number</th>
                    <th className="px-5 py-4">Lecturer</th>
                    <th className="px-5 py-4">School</th>
                    <th className="px-5 py-4">Department</th>
                    {Array.isArray(status) && <th className="px-5 py-4">Currently with</th>}
                    {status === "Rejected" && (
                      <>
                        <th className="px-5 py-4">Rejected by</th>
                        <th className="px-5 py-4">Reason</th>
                      </>
                    )}
                    <th className="px-5 py-4 text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 text-gray-700 dark:text-gray-200">
                  {filteredSubmissions.map((submission) => {
                    const details = submission.lecturerDetails || {};
                    return (
                      <tr key={submission._id} className="hover:bg-purple-50 dark:hover:bg-gray-800">
                        <td className="px-5 py-4 font-medium break-words">{details.pfNumber || "-"}</td>
                        <td className="px-5 py-4 break-words">{getLecturerName(submission)}</td>
                        <td className="px-5 py-4 break-words">{details.school || "-"}</td>
                        <td className="px-5 py-4 break-words">{details.department || "-"}</td>
                        {Array.isArray(status) && (
                          <td className="px-5 py-4">
                            <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-800">
                              {getCurrentHolder(submission.status)}
                            </span>
                          </td>
                        )}
                        {status === "Rejected" && (
                          <>
                            <td className="px-5 py-4 font-medium break-words">{submission.rejectedBy || "-"}</td>
                            <td className="max-w-xs px-5 py-4 text-gray-600 break-words" title={submission.rejectionReason || "No reason provided"}>
                              {submission.rejectionReason || "No reason provided"}
                            </td>
                          </>
                        )}
                        <td className="px-5 py-4 text-center">
                          <button className="btn btn-preview" onClick={() => setViewingForm(submission)}>
                            View form
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </main>

      {viewingForm && <PreviewModal data={viewingForm} onClose={() => setViewingForm(null)} />}
    </div>
  );
};

export default DirectorSubmissionList;