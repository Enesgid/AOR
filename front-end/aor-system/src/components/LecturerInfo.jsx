const schoolDepartments = {
  SAFT: [ 'Forestry',' Wildlife technology', 'Crop Production','Horticulture Soil science and land management'],
  SAMET: ['Agribusiness', 'Agricultural economics and farm mangement ','Agricultural Extension and Rural Development'],
  SAT: ['Architecture', 'Interior Architecture and Design', 'Landscape Architecture', 'Furniture Design'],
  SEET: ['Computer Engineering ','Telecommunication Engineering', 'Electrical and Electronics Engineering', 'Mechatronics Engineering'],
  SET: ['Building Technology','Estate Management and Valuation','Quantity Surveying', 'Surveying and Geoinformatics', 'Urban and Regional Planning'],
  SFAT: ['Food Science Technology', 'Animal Production','Water Resourses','Aquaculture and Fisheries Technology','Human Nutrition and Dietetics'],
  SICT: ['Computer Science', 'Cyber Security Science', 'Information Technology', 'Information Science and Media Studies','Software Engineering', 'Data Science'],
  SIPET: ['Agricultural and Bio-resources Engineering', 'Chemical Engineering', 'Civil Engineering','Material and Metallurgical Engineering','Mechanical Engineering','Petroleum and Gas Engineering'],
  SIT: ['Logistics and Transport Technology','Entrepreneurship','Project Managemnet Technology'],
  SLS: ['Biochemistry', 'Forensic science', 'Microbiology','Plant Biology', 'Animal Biology', 'Public health'],
  SPS: ['Chemistry', 'Geography', 'Mathematics', 'Physics','Applied GeoPhysics', 'Geology', 'Statistics','Meterology','Industrial Mathematics'],
  SSTE: ['Industrial and Technology Education', 'Science Education','Educational Technology','Library and Information Science'],
  PGS: ['Postgraduate Schools'],
  SBMS:['Medicine and surgery', 'Human Anatomy','Human Physiology'],
  SAHS:['Nursing Science','Medical Laboratory Science'],
  SPhS:['Doctor Of Pharmacy(Pharm D)']
};

const LecturerInfo = ({ formData, handleChange }) => {
  const availableDepartments = formData.school ? schoolDepartments[formData.school] : [];

  return (
    <>
      <h2 className="section-title">Lecturer Information</h2>
      
      <div className="form-grid">
        <div className="form-group">
          <label htmlFor="session">Session</label>
           <input
              type="text"
              value={formData.session}
              readOnly
              className="bg-gray-100 cursor-not-allowed"
            />
        </div>
        <div className="form-group">
          <label>Semester</label>
          <input
            type="text"
            value={formData.semester}
            readOnly
            className="bg-gray-100 cursor-not-allowed"
          />
        </div>
        <div className="form-group">
          <label htmlFor="label">Appointment</label>
            <select id="label" name="appointment" value={formData.appointment} onChange={handleChange}>
            <option value="nill">Select appointment</option>
            <option value="PT" >Per Time</option>
            <option value="FT">Full Time</option>
            <option value="Contract">Contract</option>
          </select>
        </div>
      </div>

      <div className="form-grid">
        <div className="form-group">
          <label htmlFor="last">Last Name</label>
          <input type="text" name="lastName" value={formData.lastName} onChange={handleChange}  id="last"/>
        </div>
        <div className="form-group">
          <label htmlFor="first">First Name</label>
          <input type="text" name="firstName" value={formData.firstName} onChange={handleChange}  id="first"/>
        </div>
        <div className="form-group">
          <label htmlFor="initial">Middle Initial</label>
          <input type="text" name="middleInitial" value={formData.middleInitial} onChange={handleChange}  id="initial"/>
        </div>
        <div className="form-group">
          <label htmlFor="pfNumber">PF Number</label>
          <input type="text" name="pfNumber" value={formData.pfNumber} onChange={handleChange}  id="pfNumber"/>
        </div>
      </div>

      <div className="form-grid"  id="school">
        <div className="form-group" id="department">
          <label htmlFor="school"  >Name of School</label>
          <select id="school" name="school" value={formData.school} onChange={handleChange}>
            <option value="">Select a School </option>
            <option value="SAFT">SAFT</option>
            <option value="SAMET">SAMET</option>
            <option value="SAT">SAT</option>
            <option value="SEET">SEET</option>
            <option value="SET">SET</option>
            <option value="SFAT">SFAT</option>
            <option value="SICT">SICT</option>
            <option value="SIPET">SIPET</option>
            <option value="SIT">SIT</option>
            <option value="SLS">SLS</option>
            <option value="SPS">SPS</option>
            <option value="SSTE">SSTE</option>
            <option value="PGS">PGS</option>
            <option value="SBMS">SBMS</option>
            <option value ="SAHS">SAHS</option>
            <option value ="SPhS">SPhS</option>
          </select>
        </div>
        <div className="form-group" id="department">
          <label htmlFor="department">Department</label>
          <select name="department" value={formData.department} onChange={handleChange} disabled={!formData.school}>
            <option value="">Select Department </option>
            {availableDepartments && availableDepartments.map((dept, index) => (
              <option key={index} value={dept}>
                {dept}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="form-grid">
        <div className="form-group">
          <label>Position / Rank</label>
          <select name="position" value={formData.position} onChange={handleChange}>
            <option value="NILL"> Select Rank </option>
            <option value="Prof">Prof</option>
            <option value="Assoc.Prof">Assoc.Prof</option>
            <option value="SL">SL</option>
            <option value="L1">L1</option>
            <option value="L2">L2</option>
            <option value="GA">GA</option>
            <option value="AL">AL</option>
          </select>
        </div>
        <div className="form-group">
          <label>Staff Phone No</label>
          <input type="number" name="phone" value={formData.phone} onChange={handleChange} />
        </div>
        <div className="form-group">
          <label>Salary Grade Level(CONUASS)</label>  
          <select name="salaryGrade" value={formData.salaryGrade} onChange={handleChange}>

            <option> Select Salary Grade </option>
            <option> 7</option>
            <option> 6</option>
            <option> 5</option>
            <option> 4</option>
            <option> 3</option>
            <option> 2</option>
            <option> 1</option>
          </select>
        </div>
      </div>

      <div className="form-grid">
        <div className="form-group">
          <label>Teaching Credit units</label>  
          <select name="teachingCredit" value={formData.teachingCredit} onChange={handleChange}>
            <option>Select Unit</option>
            <option>1</option>
            <option>2</option>
            <option>3</option>
            <option>4</option>
            <option>5</option>
            <option>6</option>
            <option>7</option>
            <option>8</option>
            <option>9</option>
            <option>10</option>
            <option>11</option>
            <option>12</option>
            <option>13</option>
            <option>14</option>
            <option>15</option>
            <option>16</option>
            <option>17</option>
            <option>18</option>
            <option>19</option>
            <option>20</option>
          </select>
        </div>
        <div className="form-group">
          <label>Leave of Absence / Study Leave</label>
          <select type="text" name="leave" value={formData.leave} onChange={handleChange} >
            <option value=" ">Select Leave of Absence</option>
            <option value="Study Leave">Study Leave</option>
            <option value="Sabbatica">Sabbatical </option>
            <option value="N/A">N/A</option>
          </select>
        </div>
      </div>
    </>
  );
};

export default LecturerInfo;