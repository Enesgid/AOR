
const DynamicTable = ({ title, btnText, headers, rows, setRows, drawRowContent, children }) => {
  
  // 1. ADD A ROW: Create a blank row and add it to the list
  const handleAddRow = () => {
    const blankRow = { id: Date.now() }; // Give it a unique ID
    const updatedRows = [...rows, blankRow]; // Combine old rows with the new one
    setRows(updatedRows); // Save it
  };

  // 2. REMOVE A ROW: Keep all rows EXCEPT the one we clicked "Remove" on
  const handleRemoveRow = (rowIdToRemove) => {
    const remainingRows = rows.filter((row) => row.id !== rowIdToRemove);
    setRows(remainingRows); // Save it
  };

  // 3. UPDATE A CELL: Find the exact row we are typing in, and update that specific input
  const handleUpdateCell = (rowIdToUpdate, fieldName, newValue) => {
    const updatedRows = rows.map((row) => {
      // If this is the row we are currently typing in...
      if (row.id === rowIdToUpdate) {
        // ...update that specific field (like 'code' or 'venue')
        return { ...row, [fieldName]: newValue };
      }
      // Otherwise, leave the row alone
      return row;
    });
    setRows(updatedRows); // Save it
  };

  return (
    <div className="dynamic-section">
      
      {/* --- HEADER & ADD BUTTON --- */}
      <div className="section-header-flex">
        <h2 className="section-title" style={{ margin: 0, marginRight: 'auto' }}>
          {title}
        </h2>
        <button type="button" className="btn btn-add" onClick={handleAddRow}>
          + {btnText}
        </button>
      </div>

      {/* --- THE TABLE & SCROLL WRAPPER --- */}
      <div className="table-scroll-wrapper">
        <table className="custom-table">
          
          <thead className="thead">
            <tr>
              {/* Draw the headers (Course Code, Venue, etc.) */}
              {headers.map((headerText, index) => (
                <th key={index}>{headerText}</th>
              ))}
              <th>Action</th> {/* Header for the Remove button */}
            </tr>
          </thead>
          
          <tbody>
            {/* Go through every row in our state and draw it */}
            {rows.map((row) => (
              <tr key={row.id}>
                
                {/* This asks AorForm to draw the inputs (<td><input/></td>).
                  It gives AorForm a simple function called 'updateField' to save typing.
                */}
                {drawRowContent(row, (fieldName, newValue) => {
                  handleUpdateCell(row.id, fieldName, newValue);
                })}
                
                {/* The Remove Button for this specific row */}
                <td>
                  <button type="button" className="btn btn-remove" onClick={() => handleRemoveRow(row.id)}>
                    Remove
                  </button>
                </td>
                
              </tr>
            ))}
          </tbody>
          
        </table>
      </div>
      
      {children}
    </div>
  );
};

export default DynamicTable;