import React, { useState, useEffect } from 'react';
import Header from '../components/Header';
import LecturerInfo from '../components/LecturerInfo';
import DynamicTable from '../components/DynamicTable';
import Certification from '../components/Certification';
import PreviewModal from '../components/PreviewModal';
import { successAlert, confirmAlert } from '../utils/alerts';
import { getCurrentUser, getCurrentToken } from '../utils/session';
const AorForm = () => {
  const initialFormData = {
    session: '', semester: '', appointment: ' ', 
    lastName: '', firstName: '', middleInitial: '', pfNumber: '', 
    school: '', department: '', position: '', phone: '', 
    salaryGrade: '', teachingCredit: '', leave: '', lecturerSignature: ''
  };
  const user = getCurrentUser();
const draftKey = `aorDraft_${user?.pfNumber}`;
  const [formData, setFormData] = useState(initialFormData);
  const [institutionSettings, setInstitutionSettings] =
  useState(null);
  const [teachingRows, setTeachingRows] = useState([{ id: 1 }]);
  const [adminRows, setAdminRows] = useState([{ id: 2 }]);
  const [researchRows, setResearchRows] = useState([{ id: 3 }]);
  const [communityRows, setCommunityRows] = useState([{ id: 4 }]);
  const [draftLoaded, setDraftLoaded] = useState(false);

  const [showModal, setShowModal] = useState(false);
  const [previewData, setPreviewData] = useState(null);
  const [errorMessage, setErrorMessage] = useState("");
  
  const [submissionStatus, setSubmissionStatus] = useState(null); 
  const [rejectionComment, setRejectionComment] = useState('');
  const [rejectedBy, setRejectedBy] = useState(''); 
  const [submissionId, setSubmissionId] = useState(null);
  
  
const fetchLecturerData = async () => {
  const storedPf =
    localStorage.getItem("loggedInPF") ||
    localStorage.getItem("pfNumber");

  const token = getCurrentToken();

  if (!storedPf || !token) {
    console.warn("Stopping: No PF Number or Token found in LocalStorage");
    return null;
  }

  try {
    const response = await fetch(
      `https://aor-q19z.onrender.com/api/submissions/track/${storedPf}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    if (!response.ok)
      throw new Error(`Server returned status: ${response.status}`);

    const data = await response.json();

    if (Array.isArray(data) && data.length > 0) {
      const myForm = data[0];

      setSubmissionId(myForm._id);
      setSubmissionStatus(myForm.status);

      if (myForm.status === "Rejected") {
        setRejectionComment(
          myForm.rejectionReason ||
          myForm.reason ||
          "No specific reason provided."
        );

        setRejectedBy(
          myForm.rejectedBy || "Management"
        );
      }

      setPreviewData(myForm);

      return myForm;
    }

    // No submission found
    return null;

  } catch (error) {
    console.error("❌ Error fetching profile:", error);

    return null;
  }
};        const loadDraft = () => {
        const savedDraft = localStorage.getItem(draftKey);

        if (!savedDraft) return false;

        try {
          const draft = JSON.parse(savedDraft);

          setFormData(draft.formData || initialFormData);
          setTeachingRows(draft.teachingRows || [{ id: 1 }]);
          setAdminRows(draft.adminRows || [{ id: 2 }]);
          setResearchRows(draft.researchRows || [{ id: 3 }]);
          setCommunityRows(draft.communityRows || [{ id: 4 }]);

          return true;
        } catch (err) {
          console.error(err);
          return false;
        }};
useEffect(() => {

  const initializeForm = async () => {

    const hasDraft = loadDraft();
    const submission = await fetchLecturerData();
    if (!hasDraft && submission) {

      setFormData(prev => ({
        ...prev,
        ...submission.lecturerDetails,
      }));

      setTeachingRows(
        submission.teaching?.length
          ? submission.teaching
          : [{ id: 1 }]
      );

      setAdminRows(
        submission.administrativeDuties?.length
          ? submission.administrativeDuties
          : [{ id: 2 }]
      );

      setResearchRows(
        submission.research?.length
          ? submission.research
          : [{ id: 3 }]
      );

      setCommunityRows(
        submission.communityService?.length
          ? submission.communityService
          : [{ id: 4 }]
      );
    }

    setDraftLoaded(true);

  };

  initializeForm();

}, []);

    useEffect(() => {
    const fetchInstitutionSettings = async () => {
    try {
      const response = await fetch(
        "https://aor-q19z.onrender.com/api/settings"
      );

      const data = await response.json();

      setInstitutionSettings(data);

      setFormData((prev) => ({
        ...prev,
        session: data.academicSession,
        semester: data.semester,
      }));

    } catch (error) {
      console.error(error);
    }
  };

  fetchInstitutionSettings();

}, []);  

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    if (name === 'school') {
      setFormData((prev) => ({ ...prev, school: value, department: '' }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
    if (errorMessage) setErrorMessage("");
  };

  const getFullPayload = () => {
    const grandTotalQap = (
      calculateTotal(teachingRows, 'qap') + 
      calculateTotal(adminRows, 'qap') + 
      calculateTotal(researchRows, 'percentInput')
    ).toFixed(2);

    return {
      lecturerDetails: formData,
      teaching: teachingRows,
      administrativeDuties: adminRows,
      research: researchRows,
      communityService: communityRows,
      totalDesignatedInput: parseFloat(grandTotalQap),
      status: 'Pending HOD', 
      lecturerSignature: formData.lecturerSignature, 
      hodSignature: previewData?.hodSignature || '', 
      deanSignature: previewData?.deanSignature || '',
      rejectionReason: '', 
      rejectedBy: '', 
      submittedAt: new Date().toISOString(),
    };
  };

  const validateForm = () => {
    setErrorMessage("");
    const { lastName, firstName, appointment, pfNumber, school, department, phone, salaryGrade , lecturerSignature } = formData;

    if (!lastName || !firstName || !pfNumber) {
      setErrorMessage("Please fill in your Last Name, First Name, and PF Number.");
      return false;
    }
    if (!school || !department) {
      setErrorMessage("Please select your School and Department.");
      return false;
    }
    if (!phone || !salaryGrade || !appointment) {
      setErrorMessage("Please provide your Staff Phone Number, salary grade, and appointment type.");
      return false;
    }
    if (!lecturerSignature || lecturerSignature.trim() === "") {
      setErrorMessage('please provide your name as e signature');
      return false;
    }
    return true;
  };

  const handlePreview = () => {
    if (submissionStatus !== 'Approved') {
      if (!validateForm()) return;
      setPreviewData(getFullPayload());
    }
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!validateForm()) return;
    
    const payload = getFullPayload(); 
    const token = localStorage.getItem('token');

    try {
      let response;
      if (submissionId) {
        response = await fetch(`https://aor-q19z.onrender.com/api/submissions/${submissionId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' ,
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify(payload)
        });
      } else {
        response = await fetch('https://aor-q19z.onrender.com/api/submissions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' ,
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify(payload)
        });
      }

      if (response.ok) {
        const savedData = await response.json();
        if (!submissionId && savedData._id) {
          setSubmissionId(savedData._id);
        }
        
        successAlert(submissionId ? "✅ Form Updated & Resubmitted to HOD!" : "✅ Form Saved & Submitted to HOD!");
        setSubmissionStatus("Pending HOD"); 
        setRejectionComment('');
        setRejectedBy('');
      } else {
        setErrorMessage("❌ Failed to save. Check server connection.");
      }
    } catch (error) {
      console.error("❌ Error connecting to server:", error);
      setErrorMessage("❌ Could not reach the database.");
    }
    localStorage.removeItem(draftKey);
  };

const handleClear = async () => {
  const result = await confirmAlert(
    "Clear Form",
    "All unsaved changes will be lost."
  );

  if (!result.isConfirmed) return;

  setFormData(initialFormData);
  setTeachingRows([{ id: Date.now() }]);
  setAdminRows([{ id: Date.now() + 1 }]);
  setResearchRows([{ id: Date.now() + 2 }]);
  setCommunityRows([{ id: Date.now() + 3 }]);

  setErrorMessage("");
  setSubmissionStatus(null);
  setRejectionComment("");
  setRejectedBy("");
  setSubmissionId(null);

  localStorage.removeItem(draftKey);
};

  const isPending = submissionStatus && submissionStatus.startsWith('Pending');

  // --- MATH HELPER FUNCTIONS ---

  const calculateTotal = (rows, fieldName) => {
    return rows.reduce((total, row) => {
      const value = parseFloat(row[fieldName]) || 0;
      return total + value;
    }, 0);
  };

  const calculateTeachingRowQap = (code, creditValue, lecturersCount) => {
    const hours = parseFloat(creditValue);
    const lecturersNum = parseInt(lecturersCount, 10) || 1;
    
    if (isNaN(hours) || !code || hours <= 0) return '';

    let baseEffortMultiplier = 100; 
    // Check for combined mixed levels structures like "IFT411/611" or "411/611"
    const isMixedLevel = code.toLowerCase().includes('/') && code.match(/[1-5]/) && code.match(/[6-9]/);
    
    if (isMixedLevel) {
      baseEffortMultiplier = 133; // Graduate and Undergraduate combined level weight parameter (133%) 
    } else {
      // Find the first occurrence of a digit inside the string identifier input
      const match = code.match(/\d/);
      const firstDigit = match ? parseInt(match[0], 10) : 0;
      
      if (firstDigit >= 6) {
        baseEffortMultiplier = 125; // Postgraduate/Graduate standard level weight parameter (125%) 
      }
    }

    // Precise formula execution matching the documentation rule sets
    const baseQap = (hours / 16) * baseEffortMultiplier;

    // Distribute fractional shares smoothly across the registered lecturer volume
    const dividedQap = baseQap / (lecturersNum > 0 ? lecturersNum : 1);
    
    return dividedQap.toFixed(2);
  };

  // Handler for teaching matrix text changes updates 
  const handleTeachingFieldChange = (rowId, fieldName, value) => {
    setTeachingRows(prevRows => prevRows.map(row => {
      if (row.id === rowId) {
        const updatedRow = { ...row, [fieldName]: value };
        
        // Synchronized triggers deployment pipeline
        const code = updatedRow.code || '';
        const credit = updatedRow.credit || '';
        const lecturers = updatedRow.lecturers || '1';
        
        updatedRow.qap = calculateTeachingRowQap(code, credit, lecturers);
        return updatedRow;
      }
      return row;
    }));
  };

  // Safely updates BOTH Role and QAP at the exact same time
  const handleAdminRoleChange = (rowId, selectedRole) => {
    let qapValue = '';
    switch(selectedRole) {
      case 'VC':qapValue = ''; break;
      case 'DVC': qapValue =80.0; break;
      case 'Deans/Directors': qapValue = 75.00; break;
      case 'Deputy Deans/ Directors': qapValue = 62.50; break;
      case 'HOD': qapValue = 50.00; break;
      case 'Sub Deans/Asst. Dir': qapValue = 37.50; break;
      case 'Examination Officers': qapValue = 25.00; break;
      case 'Assistant Examination Officer': qapValue=12.50; break;
      case 'PG Cordinators': qapValue =25.0; break;
      case 'Assistant PG Cordinators':qapValue =12.50;break;
      case 'Academic/ level Advisers': qapValue = 12.50; break;
      case 'Assistant Level Advisers':qapValue =6.25; break;
      case 'Turnitin Officeres' :qapValue =12.50 ; break;
      case 'Center Cordinators': qapValue =5.0;break;
      case 'research & Sponsored Activities': qapValue=15.0 ; break;
      case 'Project': qapValue =12.50; break;
      case 'Thesis': qapValue =16.62; break;
      case 'SIWES Coordinators': qapValue = 12.50; break;
      case 'SIWES Supervision':qapValue =5.0; break;
      case 'Time-Table /Registrtion Officer': qapValue =12.50; break;
      case 'Staff/Student/Assiociation Advisers' : qapValue =5.0; break;
      case 'NYSC Mobilization/Coordination': qapValue =5.0; break
      case 'Committee': qapValue = 5.0; break;
      case 'Student Support Activities': qapValue = 5.00; break;
      case 'Committee Membership': qapValue = 5.00; break;
      case 'Public/Institutional service': qapValue = 5.00; break;
      case 'University Governance/Council': qapValue = 5.00; break;
      case 'Other Instructional inputs': qapValue = 5.00; break;
      default: qapValue = '';
    }
    
    setAdminRows(prevRows => prevRows.map(row => 
      row.id === rowId ? { ...row, role: selectedRole, qap: qapValue } : row
    ));
  };

useEffect(() => {

  if (!draftLoaded) return;

  if (
    submissionStatus &&
    submissionStatus !== "Rejected"
  ) {
    return;
  }

  localStorage.setItem(
    draftKey,
    JSON.stringify({
      formData,
      teachingRows,
      adminRows,
      researchRows,
      communityRows,
    })
  );

}, [
  draftLoaded, submissionStatus, formData, teachingRows, adminRows, researchRows, communityRows, ]);
  return (
    <div className="containers border">
      <Header />

      {/* --- PIPELINE STATUS BANNER --- */}
      {submissionStatus && (
        <div className={`status-banner`} style={{
          padding: '15px', 
          marginBottom: '20px', 
          borderRadius: '5px',
          backgroundColor: submissionStatus === 'Approved' ? '#d4edda' : submissionStatus === 'Rejected' ? '#f8d7da' : '#e1f5fe',
          color: submissionStatus === 'Approved' ? '#155724' : 
                 submissionStatus === 'Rejected' ? '#dc3545' : '#0277bd',
          border: '1px solid currentColor'
        }}>
          <h3 style={{ margin: '0 0 5px 0' }}>Status: {submissionStatus}</h3>
          
          {submissionStatus === 'Pending HOD' && <p style={{ margin: 0 }}>Your form has been submitted and is currently with your <strong>HOD</strong> for validation.</p>}
          {submissionStatus === 'Pending Dean' && <p style={{ margin: 0 }}>Your HOD has validated your form. It is now with the <strong>Dean</strong> for review.</p>}
          {submissionStatus === 'Pending Director' && <p style={{ margin: 0 }}>The Dean has validated your form. It is now with the <strong>Director </strong> for final approval.</p>}
          
          {submissionStatus === 'Approved' && <p style={{ margin: 0 }}>Your form is officially approved! Click the Preview button at the bottom to view and print your copy.</p>}
          
          {submissionStatus === 'Rejected' && (
            <div>
              <p style={{ margin: '5px 0 0 0' }}><strong>Returned by:</strong> {rejectedBy}</p>
              <p style={{ margin: '5px 0 0 0' }}><strong>Reason:</strong> {rejectionComment}</p>
              <p style={{ margin: '5px 0 0 0', fontSize: '0.9em' }}><em>Please correct the requested items below and click "Save & Resubmit".</em></p>
            </div>
          )}
        </div>
      )}

      <form onSubmit={(e) => e.preventDefault()}>
        <LecturerInfo formData={formData} handleChange={handleInputChange} />

        {/* --- 1. TEACHING --- */}
        <DynamicTable
          title="1. Teaching"
          btnText="Add Course"
          headers={['Course Code', 'No of lecturer','Total student enrolled', 'Venue', 'Days ', 'Time', 'Credit Unit', 'Studio/Lab','% input (QAP use)']}
          rows={teachingRows}
          setRows={setTeachingRows}
          drawRowContent={(row, updateField) => (
            <>
              <td>
                <input 
                  type="text" 
                  value={row.code || ''} 
                  onChange={(e) => handleTeachingFieldChange(row.id, 'code', e.target.value)} 
                  placeholder="A211/B611"
                />
              </td>
              <td>
                <input 
                  type="number" 
                  value={row.lecturers || ''} 
                  onChange={(e) => handleTeachingFieldChange(row.id, 'lecturers', e.target.value)} 
                />
              </td>
              <td>
                <input 
                  type="number" 
                  value={row.students || ''} 
                  onChange={(e) => updateField('students', e.target.value)} 
                />
              </td>
              <td>
                <input 
                  type="text" 
                  value={row.venue || ''} 
                  onChange={(e) => updateField('venue', e.target.value)} 
                />
              </td>
              <td>  
                <select value={row.days || 'NILL'} onChange={(e) => updateField('days', e.target.value)}>
                  <option value="NILL">Days</option>
                  <option value="Monday">Monday</option>
                  <option value="Tuesday">Tuesday</option>
                  <option value="Wednesday">Wednesday</option>
                  <option value="Thursday">Thursday</option>
                  <option value="Friday">Friday</option>
                  <option value="Saturday">Saturday</option>
                </select>
             </td>
              <td>
                <input 
                  type="text" 
                  value={row.time || ''} 
                  onChange={(e) => updateField('time', e.target.value)} 
                />
              </td>
              <td>
                <input 
                  type="text" 
                  value={row.credit || ''} 
                  onChange={(e) => handleTeachingFieldChange(row.id, 'credit', e.target.value)} 
                />
              </td>
              <td>
                <input 
                  type="number" 
                  value={row.studio || ''} 
                  onChange={(e) => updateField('studio', e.target.value)} 
                />
              </td>
              <td>
                <input 
                  type="number" 
                  value={row.qap || ''} 
                  readOnly 
                  style={{ backgroundColor: '#f9f9f9', cursor: 'not-allowed' }}
                />
              </td>
            </>
          )}
        />
        <div className='total'>
          <label> TOTAL : </label>
          <input id='alpha'
            type="number" 
            value={calculateTotal(teachingRows, 'qap').toFixed(2)} 
            readOnly  
          />
        </div>
        

        {/* --- 2. ADMINISTRATIVE DUTIES --- */}
        <DynamicTable
          title="2. Administrative Duties"
          btnText="Add Duty"
          headers={['Type of Activity ','% input (QAP use)']}
          rows={adminRows}
          setRows={setAdminRows}
          drawRowContent={(row, updateField) => (
            <>
          <td>
            <select 
              className="select"
              value={row.role || 'Nill'} 
              onChange={(e) => handleAdminRoleChange(row.id, e.target.value)}>
                <option value="Nill">Select Activity</option>
                <option value="Deans/Directors">Deans/Directors</option>
                <option value="Deputy Deans/ Directors">Deputy Deans/ Directors</option>
                <option value="HOD">HOD</option>
                <option value="Sub Deans/Asst. Dir">Sub Deans/Asst. Dir</option>
                <option value="Examination Officers">Examination Officers</option>
                <option value="Academic/ level Advisers">Academic/ level Advisers</option>
                <option value="SIWES Coordinators">SIWES Coordinators</option>
                <option value="Student Support Activities">Student Support Activities</option>
                <option value="Committee Membership">Committee Membership</option>
                <option value="Public/Institutional service">Public/Institutional service</option>
                <option value="University Governance/Council">University Governance/Council</option>
                <option value="Other Instructional inputs">Other Instructional inputs</option>
                <option value="NYSC Mobilization/Corrdinators">NYSC Mobilization/Corrdinators</option>
                <option value="Committee">Committee</option>
                <option value="Project">Project</option>
                <option value="Thesis ">thesis </option>
                <option value="Seminar Cordinator">Seminar Cordinator</option>
                <option value="Assistant Level Advisers">Assistant Level Advisers</option>
                <option value="Assistant Examination Officers">Assistant Examination Officers</option>
                <option value="VC">VC</option>
                <option value="DVC">DVC</option>
                <option value="Assistant PG Coordinators">Assistant PG Coordinators</option>
                <option value="Center Coordinator">Center Coordinator</option>
                <option value="Project">Project</option>
                <option value="PG Coordinators">PG Coordinators</option>
                <option value="Staff/Student/Association Advisers ">Staff/Student/Association Advisers </option>
                <option value="Turnitin Officers">Turnitin Officers</option>
                <option value="Center Coordinators">Center Coordinators</option>
                <option value="Time-Table/Registration Officers">Time-Table/Registration Officers</option>
                <option value="SIWES Supervision">SIWES Supervision</option>
                <option value="Research & Sponsored Activities">Research & Sponsored Activities</option>
            </select> 
          </td>
          <td>
             <input type="number" value={row.qap || ''} onChange={(e) => updateField('qap', e.target.value)} />
          </td>
            </>
          )}
        />
        <div className='total'>
          <label> TOTAL : </label>
          <input id='alpha'
            type="number" 
            value={calculateTotal(adminRows, 'qap').toFixed(2)} 
            readOnly  
          />
        </div>


        {/* --- 3. FUNDED RESEARCH --- */}
        <DynamicTable
          title="3. Funded Research & Consultancy"
          btnText="Add Project"
          headers={['Project No', 'Title of Award', 'In-kind required by', 'Release Time', 'Total Amount', 'Remark','%Input']}
          rows={researchRows}
          setRows={setResearchRows}
          drawRowContent={(row, updateField) => (
            <>
              <td><input type="text" value={row.projectNo || ''} onChange={(e) => updateField('projectNo', e.target.value)} /></td>
              <td><input type="text" value={row.title || ''} onChange={(e) => updateField('title', e.target.value)} /></td>
              <td><input type="text" value={row.inKind || ''} onChange={(e) => updateField('inKind', e.target.value)} /></td>
              <td><input type="text" value={row.releaseTime || ''} onChange={(e) => updateField('releaseTime', e.target.value)} /></td>
              <td><input type="number" value={row.amount || ''} onChange={(e) => updateField('amount', e.target.value)} /></td>
              <td><input type="text" value={row.remark || ''} onChange={(e) => updateField('remark', e.target.value)} /></td>
              <td><input type="number" value={row.percentInput || ''} onChange={(e) => updateField('percentInput', e.target.value)} /></td>
            </>
          )}
        />
        <div className='total'>
          <label> TOTAL : </label>
          <input id='alpha'
            type="number" 
            value={calculateTotal(researchRows, 'percentInput').toFixed(2)} 
            readOnly  
          />
        </div>

        <div className='total'>
          <label >
            TOTAL DESIGNATED INPUT (qap use):
          </label>
          <input id='alpha'
            type="text" 
            value={(
              calculateTotal(teachingRows, 'qap') + 
              calculateTotal(adminRows, 'qap') + 
              calculateTotal(researchRows, 'percentInput')
            ).toFixed(2)} 
            readOnly 
          />
        </div>

        {/* --- 4. COMMUNITY SERVICE --- */}
        <DynamicTable
          title="4. Community Service"
          btnText="Add Service"
          headers={['Type', 'Beneficiary', 'Effect', 'Date']}
          rows={communityRows}
          setRows={setCommunityRows}
          drawRowContent={(row, updateField) => (
            <>
              <td><input type="text" value={row.type || ''} onChange={(e) => updateField('type', e.target.value)} /></td>
              <td><input type="text" value={row.beneficiary || ''} onChange={(e) => updateField('beneficiary', e.target.value)} /></td>
              <td><input type="text" value={row.effect || ''} onChange={(e) => updateField('effect', e.target.value)} /></td>
              <td><input type="date" value={row.date || ''} onChange={(e) => updateField('date', e.target.value)} /></td>
            </>
          )}
        />

        <Certification formData={formData} handleChange={handleInputChange} />
        
        {errorMessage && (
          <div style={{ 
            color: '#d9534f', backgroundColor: '#fdf7f7', padding: '10px', 
            borderRadius: '4px', border: '1px solid #d9534f', textAlign: 'center', 
            marginBottom: '15px', fontWeight: 'bold' 
          }}>
            {errorMessage}
          </div>
        )}

        <div className="bottom-actions">
          <button 
            type="button" 
            className="btn btn-preview" 
            onClick={handlePreview}
            disabled={isPending}
          >
            {submissionStatus === 'Approved' ? 'Preview / Print Official Copy' : 
             isPending ? 'Preview Locked (Under Review)' : 
             'Preview Draft'}
          </button>
          
          <button 
            type="button" 
            className="btn btn-save" 
            onClick={handleSave}
            disabled={isPending || submissionStatus === 'Approved'}
          >
            {submissionStatus === 'Approved' ? 'Already Approved' : 
             isPending ? 'Form is under review' : 
             submissionStatus === 'Rejected' ? 'Save & Resubmit to HOD' :
             'Save & Submit to HOD'}
          </button>
          
          <button type="button" className="btn btn-clear" onClick={handleClear}>Clear Form</button>
        </div>
      </form>

      {showModal && (
        <PreviewModal 
          data={previewData} 
          onClose={() => setShowModal(false)} 
        />
      )}
    </div>
  );
};

export default AorForm;