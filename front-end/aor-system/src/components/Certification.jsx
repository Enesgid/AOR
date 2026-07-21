import React from 'react';

const Certification = ({ formData, handleChange }) => (
  <>
    <h2 className="section-title">Certification</h2>
    <div className="form-grid">
      <div className="form-group">
        <label>Lecturer's Signature / Name</label>
        <input type="text" name="lecturerSignature" value={formData.lecturerSignature || ''} onChange={handleChange} placeholder="Type your Surname" />
      </div>
      <div className="form-group">
        <label>HOD's Signature</label>
        <input type="text" disabled placeholder="(For Official Use)" />
      </div>
      <div className="form-group">
        <label>Dean's Signature</label>
        <input type="text" disabled placeholder="(For Official Use)" />
      </div>
    </div>
  </>
);

export default Certification;