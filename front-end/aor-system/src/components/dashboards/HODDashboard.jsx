import React, { useState, useEffect } from 'react';
import PreviewModal from '../PreviewModal';
import Header from '../Header';
import Topbar from './analysis/TopBar';
import Sidebar from './analysis/Sidebar';
import DashboardHeader from './analysis/DashboardHeader';
import { Menu } from 'lucide-react';
import { errorAlert, promptAlert } from '../../utils/alerts';
import { getCurrentToken, getCurrentUser } from '../../utils/session';
const HODDashboard = () => {
  const [submissions, setSubmissions] = useState([]);
  const [selectedIds, setSelectedIds] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [viewingForm, setViewingForm] = useState(null); 
  const [isProcessing, setIsProcessing] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [settings, setSettings] = useState({ submissionDeadline: "" });
  

  useEffect(() => {
    fetchSettings();
    fetchSubmissions();

    const handleSettingsUpdate = () => {
      fetchSettings();
    };

    window.addEventListener('settings-updated', handleSettingsUpdate);

    return () => {
      window.removeEventListener('settings-updated', handleSettingsUpdate);
    };
  }, []);

  const fetchSettings = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/settings`);
      const data = await response.json();
      setSettings({
        submissionDeadline: data?.submissionDeadline || "",
      });
    } catch (error) {
      console.error('Error fetching settings:', error);
    }
  };

  const formatDeadline = (value) => {
    if (!value) return 'Not set';

    const parsedDate = new Date(value);
    if (Number.isNaN(parsedDate.getTime())) return value;

    return parsedDate.toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

const fetchSubmissions = async () => {
    try {
      const token = getCurrentToken(); // Get the token from local storage
      // 1. Get the HOD's department from local storage
      const user = getCurrentUser();
      const hodDepartment = user?.department; 

      const response = await fetch(`${API_BASE_URL}/api/submissions`, {
        headers: {
          'Authorization': `Bearer ${token}` 
        }
      });
      
      const data = await response.json();
      
      // THE DICTIONARY: Teach React what abbreviations mean.
      const departmentAliases = {
        "css": "cyber security science",
        "ift": "information technology",
        "se": "software engineering",
        "swe": "software engineering",
        "fst": "food science technology" 
      };
      const normalizeDepartment = (deptName) => {
        if (!deptName) return "";
        const cleanName = deptName.toLowerCase().trim(); 
        return departmentAliases[cleanName] || cleanName;
      };

      const validSubmissions = data.filter(sub => {
        // 1. Check if it's a valid form waiting for the HOD
        if (!sub.lecturerDetails || !sub.lecturerDetails.pfNumber || sub.status !== 'Pending HOD') {
          return false;
        }
        // 2. Grab the names
        const formDept = sub.lecturerDetails.department;
        const hodDept = hodDepartment;
        return normalizeDepartment(formDept) === normalizeDepartment(hodDept);
      });
      
      setSubmissions(validSubmissions);
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setIsLoading(false);
    }
  };
  const handleCheckboxChange = (id) => {
    setSelectedIds((prev) => 
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  const handleUpdateStatus = async (id, action) => {
    let payload = {};

    if (action === 'Rejected') {
        const result = await promptAlert(
          "Reject Submission",
          "Reason for rejection",
        );

        if (!result.isConfirmed) return;

      const reason = result.value; 
      
      payload = {
        status: 'Rejected',
        rejectionReason: reason,
        rejectedBy: 'HOD' 
      };
    }

    if (action === 'Approved') {
        const result = await promptAlert(
          "HOD Signature",
          "Enter your full name for signature",
          "John Doe"
        );

if (!result.isConfirmed) return;

const signatureName = result.value;

      const isoDate = new Date().toISOString();

      payload = {
        status: 'Pending Dean', 
        hodSignature: signatureName,
        hodSignatureDate: isoDate,
        approvalDate: new Date().toISOString()
      };
    }

    setIsProcessing(true);
    try {
      const token = getCurrentToken(); // Get the token from local storage

      const response = await fetch(`${API_BASE_URL}/api/submissions/${id}/status`, {
        method: 'PATCH',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}` // Show the ID card to update the status!
        },
        body: JSON.stringify(payload)
      });

      if (response.ok) {
        setViewingForm(null); 
        fetchSubmissions(); 
      } else {
       await errorAlert ("Failed to update status.");
      }
    } catch (error) {
     await errorAlert("Server error while updating status.");
    } finally {
      setIsProcessing(false);
    }
  };

  if (isLoading) return <div style={{ textAlign: 'center', marginTop: '50px' }}>Loading HOD Dashboard...</div>;
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
        <Topbar/>

        {/* Header */}
        <div className="mb-8 ">
          <DashboardHeader
            title="HOD Validation Dashboard"
            subtitle="View and validate lecturer forms submitted for your department." 
            showExport={false} 
            searchTerm={searchTerm}
            setSearchTerm={setSearchTerm}
          />
        </div>

        <div className="mb-6">
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-purple-100 text-purple-700 flex items-center justify-center text-xl">
                  📅
                </div>
                <div>
                  <p className="text-xs uppercase tracking-wide font-semibold text-gray-500">
                    Submission Deadline
                  </p>
                  <h3 className="mt-1 text-2xl font-bold text-gray-900">
                    {formatDeadline(settings.submissionDeadline)}
                  </h3>
                </div>
              </div>
              <span className="px-3 py-1 rounded-full bg-purple-50 text-purple-700 text-xs font-semibold uppercase tracking-wide">
                Current
              </span>
            </div>
            <p className="mt-3 text-sm text-gray-600">
              All department submissions must be completed before this date.
            </p>
          </div>
        </div>

        {/* MAIN TABLE */}
        <div className="grid grid-cols-1 gap-6 mb-6 overflow-hidden">
        <div className="doc-section-title table-scroll">
          {submissions.length === 0 ? (
            <p style={{ textAlign: 'center', color: 'rgb(78, 9, 78)', padding: '40px 0' }}>No forms currently pending HOD validation.</p>
          ) : (
            <div className="w-full overflow-x-auto">
              <div className="w-full overflow-auto max-h-[55vh]">
                <table className="dashboard-table w-full table-auto">
              <thead>
                <tr style={{ backgroundColor: 'rgb(78, 9, 78)', color: 'white', textAlign: 'left' }}>
                  <th >PF Number</th>
                  <th >Lecturer Name</th>
                  <th >Department</th>
                  <th style={{ textAlign: 'center' }}>Actions</th>
                </tr>
              </thead>
                <tbody>
                {filteredSubmissions.map((sub, index) => (
                  <tr key={sub._id} >
                    <td className="break-words">{sub.lecturerDetails?.pfNumber}</td>
                    <td className="break-words">{sub.lecturerDetails?.firstName} {sub.lecturerDetails?.lastName}</td>
                    <td className="break-words">{sub.lecturerDetails?.department}</td>
                    
                    <td className='dashB' >
                      <button onClick={() => setViewingForm(sub)} className='btn btn-preview'>View </button>
                      
                      <button onClick={() => handleUpdateStatus(sub._id, 'Approved')} disabled={isProcessing} className='btn btn-save'>Validate </button>
                      <button onClick={() => handleUpdateStatus(sub._id, 'Rejected')} disabled={isProcessing} className='btn btn-clear'>Reject</button>
                    </td>
                  </tr>
                ))}
              </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
        </div>

     {/* view submitted fie */}
     {viewingForm && (
        <PreviewModal 
          data={viewingForm} 
          onClose={() => setViewingForm(null)} 
          onApprove={(id) => handleUpdateStatus(id, 'Approved')}
          onReject={(id) => handleUpdateStatus(id, 'Rejected')}
        />
      )}
    </div>
    </div>
  );
};

export default HODDashboard;