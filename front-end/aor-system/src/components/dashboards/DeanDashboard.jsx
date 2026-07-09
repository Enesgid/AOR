import React, { useState, useEffect } from 'react';
import PreviewModal from '../PreviewModal';
import Header from '../Header';
import Topbar from './analysis/TopBar';
import DashboardHeader from './analysis/DashboardHeader';
import Sidebar from './analysis/Sidebar';
import { Menu } from 'lucide-react';

const DeanDashboard = () => {
  const [submissions, setSubmissions] = useState([]);
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

  const response = await fetch(
    'http://localhost:5000/api/submissions',
    {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    }
  );
  

  const data = await response.json();

  // Get Dean's school
  const deanSchool =
    localStorage.getItem('school');
  // Filter only forms meant for this Dean
  const validSubmissions = data.filter(
    (sub) => {

      if (
        !sub.lecturerDetails ||
        !sub.lecturerDetails.pfNumber ||
        sub.status !== 'Pending Dean'
      ) {
        return false;
      }

      const formSchool =
        sub.lecturerDetails?.school;

      return (
        formSchool?.toLowerCase().trim() ===
        deanSchool?.toLowerCase().trim()
      );
    }
  );

  setSubmissions(validSubmissions);

} catch (error) {
  console.error(
    "Error fetching data:",
    error
  );
}finally {
      setIsLoading(false);
    }
  };

  const handleUpdateStatus = async (id, action) => {
    let payload = {};

    if (action === 'Rejected') {
      const reason = window.prompt("Please provide a reason for rejecting this form back to the Lecturer:");
      if (reason === null || reason.trim() === '') return; 
      
      payload = {
        status: 'Rejected',
        rejectionReason: reason,
        rejectedBy: 'Dean' 
      };
    }

    if (action === 'Approved') {
      const signatureName = window.prompt("Enter your full name to officially sign and forward to the Director:");
      if (signatureName === null || signatureName.trim() === '') return;

      const formattedDate = new Date().toLocaleDateString('en-GB', {
        day: 'numeric', month: 'short', year: 'numeric'
      });

      payload = {
        status: 'Pending Director', 
        deanSignature: `${signatureName} - ${formattedDate}`,
        approvalDate: new Date().toISOString()
      };
    }

    setIsProcessing(true);
   try {
      const token = localStorage.getItem('token'); 


      const response = await fetch(`http://localhost:5000/api/submissions/${id}/status`, {
        method: 'PATCH',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      if (response.ok) {
        setViewingForm(null); 
        fetchSubmissions(); 
      } else {
        alert("Failed to update status.");
      }
    } catch (error) {
      alert("Server error while updating status.");
    } finally {
      setIsProcessing(false);
    }
  };

  if (isLoading) return <div style={{ textAlign: 'center', marginTop: '50px' }}>Loading Dean Dashboard...</div>;
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
        <Topbar />

        {/* Header */}
        <div className="mb-8 ">
          <DashboardHeader
            title="Dean Validation Dashboard"
            subtitle="Review and Validate each forms submitted to you"  
            showExport={false}
            searchTerm={searchTerm}
            setSearchTerm={setSearchTerm}
          />
        </div>
        {/* MAIN TABLE */}
        <div className="grid grid-cols-1 gap-6 mb-6 overflow-hidden">
          
        <div className="doc-section-title table-scroll">
          {submissions.length === 0 ? (
            <p style={{ textAlign: 'center', color: 'rgb(78, 9, 78)', padding: '40px 0' }}>No forms currently pending Dean validation.</p>
          ) : (
            <table className='dashboard-table overflow-x-auto'>
              <thead>
                <tr style={{ backgroundColor: 'rgb(78, 9, 78)', color: 'white', textAlign: 'left' }}>
                  <th >PF Number</th>
                  <th >Lecturer Name</th>
                  <th >Department</th>
                  <th >HOD Signature</th>
                  <th style={{textAlign: 'center' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredSubmissions.map((sub, index) => (
                  <tr key={sub._id} >
                    <td >{sub.lecturerDetails?.pfNumber}</td>
                    <td >{sub.lecturerDetails?.firstName} {sub.lecturerDetails?.lastName}</td>
                    <td >{sub.lecturerDetails?.department}</td>
                    
                    <td style={{ padding: '12px', color: 'rgb(18, 99, 18)', fontSize: '13px' }}>
                      ✓ {sub.hodSignature || 'Signed'}
                    </td>
                    
                    <td className='dashB'>
                      <button onClick={() => setViewingForm(sub)} className='btn btn-preview'>View </button>
                      
                      <button onClick={() => handleUpdateStatus(sub._id, 'Approved')} disabled={isProcessing} className='btn btn-save'>Validate</button>
                      <button onClick={() => handleUpdateStatus(sub._id, 'Rejected')} disabled={isProcessing} className='btn btn-clear'>Reject </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* --- view submitted files --- */}
      {viewingForm && (
        <PreviewModal 
          data={viewingForm} 
          onClose={() => setViewingForm(null)} 
          onApprove={(id) => handleUpdateStatus(id, 'Approved')}
          onReject={(id) => handleUpdateStatus(id, 'Rejected')}
        />
      )}
    {/* </div> */}
    </div>
    </div>
  );
};

export default DeanDashboard;