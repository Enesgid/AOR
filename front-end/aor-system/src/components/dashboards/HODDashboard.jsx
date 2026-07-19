import React, { useState, useEffect } from 'react';
import PreviewModal from '../PreviewModal';
import Header from '../Header';
import Topbar from './analysis/TopBar';
import Sidebar from './analysis/Sidebar';
import DashboardHeader from './analysis/DashboardHeader';
import { Menu } from 'lucide-react';
import { errorAlert, promptAlert } from '../../utils/alerts';
const HODDashboard = () => {
  const [submissions, setSubmissions] = useState([]);
  const [selectedIds, setSelectedIds] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [viewingForm, setViewingForm] = useState(null); 
  const [isProcessing, setIsProcessing] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  

  useEffect(() => {
    fetchSubmissions();
  }, []);


const fetchSubmissions = async () => {
    try {
      const token = localStorage.getItem('token'); 
      // 1. Get the HOD's department from local storage
      const hodDepartment = localStorage.getItem('department'); 

      const response = await fetch('https://aor-q19z.onrender.com/api/submissions', {
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

      const formattedDate = new Date().toLocaleDateString('en-GB', {
        day: 'numeric', month: 'short', year: 'numeric'
      });

      payload = {
        status: 'Pending Dean', 
        hodSignature: `${signatureName} - ${formattedDate}`,
        approvalDate: new Date().toISOString()
      };
    }

    setIsProcessing(true);
    try {
      const token = localStorage.getItem('token'); // Grab the ID card again

      const response = await fetch(`https://aor-q19z.onrender.com/api/submissions/${id}/status`, {
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


        {/* MAIN TABLE */}
        <div className="grid grid-cols-1 gap-6 mb-6 overflow-hidden">
        <div className="doc-section-title table-scroll">
          {submissions.length === 0 ? (
            <p style={{ textAlign: 'center', color: 'rgb(78, 9, 78)', padding: '40px 0' }}>No forms currently pending HOD validation.</p>
          ) : (
            <table className=" dashboard-table overflow-x-auto">
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
                    <td >{sub.lecturerDetails?.pfNumber}</td>
                    <td >{sub.lecturerDetails?.firstName} {sub.lecturerDetails?.lastName}</td>
                    <td >{sub.lecturerDetails?.department}</td>
                    
                    <td className='dashB' >
                      <button onClick={() => setViewingForm(sub)} className='btn btn-preview'>View </button>
                      
                      <button onClick={() => handleUpdateStatus(sub._id, 'Approved')} disabled={isProcessing} className='btn btn-save'>Validate </button>
                      <button onClick={() => handleUpdateStatus(sub._id, 'Rejected')} disabled={isProcessing} className='btn btn-clear'>Reject</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
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