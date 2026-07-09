import React from 'react';

const PreviewModal = ({ data, onClose ,onApprove ,onReject}) => {
  if (!data) return null;
  const { lecturerDetails, teaching, administrativeDuties, research, communityService } = data;

  // --- MATH HELPER ---
  const calculateTotal = (rows, fieldName) => {
    if (!rows || rows.length === 0) return 0;
    return rows.reduce((total, row) => {
      const value = parseFloat(row[fieldName]) || 0;
      return total + value;
    }, 0).toFixed(2); 
  };

  return (
    <>
      
      <style>
        {`
          @media print {
            @page { size: A4; margin: 10mm; } /* Tight margins to save space */
            body * { visibility: hidden; }
            .modal-overlay, .modal-overlay * { visibility: visible; }
            .modal-overlay {
              position: absolute; left: 0; top: 0; width: 100%;
              background: transparent !important; padding: 0; display: block;
              overflow: visible !important;
            }
            .modal-content {
              max-width: 100% !important; width: 100%; max-height: none !important;
              overflow: visible !important; padding: 0 !important;
              box-shadow: none !important; border: none !important; position: static;
            }
            .modal-header-actions, .bottom-actions { display: none !important; }
            
            /* Squeeze Headers */
            .doc-preview h1 { font-size: 16px !important; margin-bottom: 2px !important; }
            .doc-preview h2 { font-size: 14px !important; margin-bottom: 10px !important; }
            .doc-section-title { margin-top: 10px !important; padding: 4px !important; font-size: 12px !important; }
            
            /* Force 2 Columns for Lecturer Info */
            .doc-grid { 
              display: grid !important; 
              grid-template-columns: 1fr 1fr !important; 
              font-size: 11px !important; 
              gap: 4px 20px !important; 
              margin: 5px 0 10px 0 !important;
            }

            /* Squeeze Tables to fit 1 page */
            .doc-table { width: 100%; margin-top: 5px !important; }
            .doc-table th, .doc-table td { padding: 4px !important; font-size: 10px !important; }
          }
        `}
      </style>

      <div className="modal-overlay" onClick={onClose}>
        <div className="modal-content" onClick={(e) => e.stopPropagation()}>
          
          <div className="modal-header-actions">
            <button className="modal-print" onClick={() => window.print()}>Print / Save as PDF</button>
            <button className="modal-close" onClick={onClose}>Close</button>
          </div>

          <div className="doc-preview">
            <h1>Federal University of Technology, Minna</h1>
            <h2>Assignment of Responsibility (AOR) Form</h2>

            {/* --- LECTURER INFO (Reordered for 2 Columns) --- */}
            <div className="doc-section-title">Lecturer Information</div>
            <div className="doc-grid">
              {/* Row 1 */}
              <div><strong>Name:</strong> {lecturerDetails.lastName}, {lecturerDetails.firstName} {lecturerDetails.middleInitial}</div>
              <div><strong>Session/Semester:</strong> {lecturerDetails.session} / {lecturerDetails.semester}</div>
              
              {/* Row 2 */}
              <div><strong>PF Number:</strong> {lecturerDetails.pfNumber}</div>
              <div><strong>Rank/Position:</strong> {lecturerDetails.position}</div>
              
              {/* Row 3 */}
              <div><strong>School:</strong> {lecturerDetails.school}</div>
              <div><strong>Appointment:</strong> {lecturerDetails.appointment}</div>
              
              {/* Row 4 */}
              <div><strong>Department:</strong> {lecturerDetails.department}</div>
              <div><strong>Salary Grade:</strong> {lecturerDetails.salaryGrade}</div>
              
              {/* Row 5 */}
              <div><strong>Phone:</strong> {lecturerDetails.phone}</div>
              <div><strong>Teaching Credit:</strong> {lecturerDetails.teachingCredit}</div>
              
              {/* Row 6 */}
              <div><strong>Leave Status:</strong> {lecturerDetails.leave || 'None'}</div>
              <div></div> {/* Empty div to balance the grid */}
            </div>

            {/* --- 1. TEACHING --- */}
            <div className="doc-section-title">1. Teaching Responsibilities</div>
            <table className="doc-table">
              <thead>
                <tr>
                  <th>Course Code</th>
                  <th>Lecturers</th>
                  <th>Students</th>
                  <th>Venue</th>
                  <th>Days</th>
                  <th>Time</th>
                  <th>Credit Unit</th>
                  <th>Studio/Lab</th>
                  <th>% Input (QAP)</th>
                </tr>
              </thead>
              <tbody>
                {teaching.map((row, i) => (
                  <tr key={i}>
                    <td>{row.code || '-'}</td>
                    <td>{row.lecturers || '-'}</td>
                    <td>{row.students || '-'}</td>
                    <td>{row.venue || '-'}</td>
                    <td>{row.days !== 'NILL' ? row.days : '-'}</td>
                    <td>{row.time || '-'}</td>
                    <td>{row.credit || '-'}</td>
                    <td>{row.studio || '-'}</td>
                    <td>{row.qap || '-'}</td>
                  </tr>
                ))}
                <tr style={{ backgroundColor: '#f1f3f5', fontWeight: 'bold' }}>
                  <td colSpan="8" style={{ textAlign: 'right', paddingRight: '10px' }}>TOTAL % INPUT:</td>
                  <td>{calculateTotal(teaching, 'qap')}</td>
                </tr>
              </tbody>
            </table>

            {/* --- 2. ADMIN DUTIES --- */}
            <div className="doc-section-title">2. Administrative Duties</div>
            <table className="doc-table">
              <thead>
                <tr>
                  <th>Type of Activity (Role)</th>
                  <th id="input" >% Input (QAP use)</th>
                </tr>
              </thead>
              <tbody>
                {administrativeDuties.map((row, i) => (
                  <tr key={i}>
                    <td>{row.role || '-'}</td>
                    <td>{row.qap || '-'}</td>
                  </tr>
                ))}
                <tr style={{ backgroundColor: '#f1f3f5', fontWeight: 'bold' }}>
                  <td style={{ textAlign: 'right', paddingRight: '10px' }}>TOTAL % INPUT:</td>
                  <td>{calculateTotal(administrativeDuties, 'qap')}</td>
                </tr>
              </tbody>
            </table>

            {/* --- 3. RESEARCH --- */}
            <div className="doc-section-title">3. Funded Research & Consultancy</div>
            <table className="doc-table">
              <thead>
                <tr>
                  <th>Project No</th>
                  <th>Title of Award</th>
                  <th>In-kind required by</th>
                  <th>Release Time</th>
                  <th>Total Amount</th>
                  <th>Remark</th>
                  <th>% Input</th>
                </tr>
              </thead>
              <tbody>
                {research.map((row, i) => (
                  <tr key={i}>
                    <td>{row.projectNo || '-'}</td>
                    <td>{row.title || '-'}</td>
                    <td>{row.inKind || '-'}</td>
                    <td>{row.releaseTime || '-'}</td>
                    <td>{row.amount ? `#${row.amount}` : '-'}</td>
                    <td>{row.remark || '-'}</td>
                    <td>{row.percentInput || '-'}</td>
                  </tr>
                ))}
                <tr style={{ backgroundColor: '#f1f3f5', fontWeight: 'bold' }}>
                  <td colSpan="6" style={{ textAlign: 'right', paddingRight: '10px' }}>TOTAL % INPUT:</td>
                  <td>{calculateTotal(research, 'percentInput')}</td>
                </tr>
              </tbody>
            </table>

            {/* --- 4. COMMUNITY SERVICE --- */}
            <div className="doc-section-title">4. Community Service</div>
            <table className="doc-table">
              <thead>
                <tr>
                  <th>Type</th>
                  <th>Beneficiary</th>
                  <th>Effect</th>
                  <th>Date</th>
                </tr>
              </thead>
              <tbody>
                {communityService.map((row, i) => (
                  <tr key={i}>
                    <td>{row.type || '-'}</td>
                    <td>{row.beneficiary || '-'}</td>
                    <td>{row.effect || '-'}</td>
                    <td>{row.date || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* --- CERTIFICATION --- */}
            <div className="doc-section-title">Certification</div>
            <div className="doc-grid" style={{ marginTop: '15px' }}>
              
              {/* Lecturer Signature */}
              <div>
                <div style={{ borderBottom: '1px solid #000', marginBottom: '5px', minHeight: '24px' }}>
                {lecturerDetails.lecturerSignature ? (
                  <span style={{ fontStyle: 'italic' }}>
                    {lecturerDetails.lecturerSignature} - {new Date().toLocaleDateString('en-GB', {
                      day: 'numeric', month: 'short', year: 'numeric'
                    })} (E-Signed)
                  </span>
                ) : (
                  '\u00A0'
                )}
                </div>
                <strong>Lecturer's Signature / Date</strong>
              </div>
              
              {/* HOD Signature */}
              <div>
                <div style={{ borderBottom: '1px solid #000', marginBottom: '5px', minHeight: '24px' }}>
                  {data.hodSignature ? (
                    <span style={{fontStyle: 'italic' }}>
                      {data.hodSignature} (E-Signed)
                    </span>
                  ) : (
                    '\u00A0'
                  )}
                </div>
                <strong>HOD's Signature / Date</strong>
              </div> 
              
              {/* Dean Signature */}
              <div>
              <div style={{ borderBottom: '1px solid #000', marginBottom: '5px', minHeight: '24px' }}>
                {data.deanSignature ? (
                  <span style={{ fontStyle: 'italic' }}> {data.deanSignature} (E-Signed)</span>
                ) : (
                  '\u00A0'
                )}
              </div>
                <strong>Dean Signature / Date</strong>
              </div>

            </div>

            {/* ACTION BUTTONS (Only visible on screen, hidden on print) */}
            {onApprove && onReject && (
              <div className="bottom-actions" style={{ marginTop: '20px' }}>
                <button onClick={() => onApprove(data._id)} className="btn btn-save">
                  Approve Document
                </button>
                <button onClick={() => onReject(data._id)} className="btn btn-remove">
                  Reject & Return
                </button>
              </div>
            )}

          </div>
        </div>
      </div>
    </>
  );
};

export default PreviewModal;