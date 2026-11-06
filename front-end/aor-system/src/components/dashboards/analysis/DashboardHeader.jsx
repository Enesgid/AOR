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
  sessions = [],
  selectedSession,
  setSelectedSession = () => {},
  selectedSemester,
  setSelectedSemester = () => {},
  draftSession,
  setDraftSession = () => {},
  draftSemester,
  setDraftSemester = () => {},
  onApplyView = () => {},
  isHistoricalView = false,
  isLoading = false,
  submissionError = "",
}) => {
  const cycleLabel = selectedSession && selectedSemester
    ? `${selectedSession} • ${selectedSemester}`
    : "No cycle selected";

  return (
    <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-8 p-4">
      <div className="text-left">
        <h1 className="text-3xl font-bold dark:text-white text-gray-900">{title}</h1>
        <p className="text-gray-500 mt-1 dark:text-gray-200">{subtitle}</p>
        {selectedSession && (
          <div className="mt-2 text-xs text-gray-600 dark:text-gray-200">
            <span className="font-medium">Academic view:</span> {cycleLabel}
            {isHistoricalView && (
              <span className="ml-2 text-amber-600 font-medium">(Historical view)</span>
            )}
          </div>
        )}
      </div>

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

          {showExport && (
            <ExportDropdown
              onExcelExport={onExcelExport}
              onPdfExport={onPdfExport}
              sessions={sessions}
              selectedSession={selectedSession}
              setSelectedSession={setSelectedSession}
              selectedSemester={selectedSemester}
              setSelectedSemester={setSelectedSemester}
              draftSession={draftSession}
              setDraftSession={setDraftSession}
              draftSemester={draftSemester}
              setDraftSemester={setDraftSemester}
              onApplyView={onApplyView}
              isHistoricalView={isHistoricalView}
              isLoading={isLoading}
              submissionError={submissionError}
            />
          )}
        </div>
      )}
    </div>
  );
};

export default DashboardHeader;