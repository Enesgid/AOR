import ExportDropdown from "./ExportDropdown";
const DashboardHeader = ({
  title,
  subtitle,
  showSearch = true,
  showExport = true,
  searchTerm = "",
  setSearchTerm = () => {},
  onExcelExport,
  onPdfExport,
}) => {
  return (
    <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-8 p-4">

      {/* Left */}
      
      <div className="text-left">
        <h1 className="text-3xl font-bold dark:text-white text-gray-900">{title}</h1>
        <p className="text-gray-500 mt-1 dark:text-gray-200">{subtitle}</p>
        
      </div>

      {/* Right */}
      {(showSearch || showExport) && (
        <div className="flex items-center gap-3">
          {showSearch && (
            <input
              type="search"
              placeholder="Search..."
              className="bg-white border border-gray-200 h-11 px-4 rounded-xl shadow-sm text-sm text-gray-600"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)} 
            />
          )}

{showExport && (<ExportDropdown
  onExcelExport={onExcelExport}
  onPdfExport={onPdfExport}
/>
)}
        </div>
      )}

    </div>
  );
};

export default DashboardHeader;