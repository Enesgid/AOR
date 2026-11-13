import { useState, useRef, useEffect } from "react";
import { Download, ChevronDown, FileSpreadsheet, FileText } from "lucide-react";

const ExportDropdown = ({
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
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef(null);
  const [localSession, setLocalSession] = useState(draftSession || selectedSession || "");
  const [localSemester, setLocalSemester] = useState(draftSemester || selectedSemester || "First Semester");

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);

    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    setLocalSession(draftSession || selectedSession || "");
  }, [draftSession, selectedSession]);

  useEffect(() => {
    setLocalSemester(draftSemester || selectedSemester || "First Semester");
  }, [draftSemester, selectedSemester]);

  const handleApply = () => {
    setSelectedSession(localSession);
    setSelectedSemester(localSemester);
    onApplyView();
    setOpen(false);
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setOpen(!open)}
        className="
          flex
          items-center
          gap-2
          px-4
          h-11
          btn btn-preview
          rounded-xl
          shadow-sm
          text-sm
          font-medium
        "
      >
        <Download size={18} />
        Export
        <ChevronDown size={16} />
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-48 border-collapse rounded-sm shadow-lg z-50 overflow-hidden">
          <div className="px-3 py-2 bg-white space-y-3">
            <div>
              <label className="text-xs text-gray-500">Select session</label>
              <select
                value={localSession}
                onChange={(e) => {
                  const nextValue = e.target.value;
                  setLocalSession(nextValue);
                  setDraftSession(nextValue);
                }}
                className="w-full mt-2 p-2 border rounded"
              >
                <option value="">session</option>
                {sessions.map((s, i) => (
                  <option key={`${s}-${i}`} value={s}>{s}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs text-gray-500">Select semester</label>
              <select
                value={localSemester}
                onChange={(e) => {
                  const nextValue = e.target.value;
                  setLocalSemester(nextValue);
                  setDraftSemester(nextValue);
                }}
                className="w-full mt-2 p-2 border rounded"
              >
                <option value="First Semester">First Semester</option>
                <option value="Second Semester">Second Semester</option>
              </select>
            </div>
            <div className="pt-1">
              <button
                type="button"
                onClick={handleApply}
                disabled={!localSession || !localSemester || isLoading}
                className={`w-full rounded-md px-3 py-2 text-sm font-medium text-white ${!localSession || !localSemester || isLoading ? "bg-slate-400 cursor-not-allowed" : "bg-blue-600 hover:bg-blue-700"}`}
              >
                {isLoading ? "Loading..." : "View Records"}
              </button>
            </div>
            {isHistoricalView && (
              <div className="text-[14px] text-red-500">
                Historical view active
              </div>
            )}
            {submissionError && (
              <div className="text-[11px] text-red-600">{submissionError}</div>
            )}
          </div>

          <div className="border-t py-2 justify-between w-full">
            <button
              onClick={() => {
                setOpen(false);
                onExcelExport();
              }}
              disabled={!selectedSession || !selectedSemester}
              className={`w-full flex items-center gap-4 px-4  text-left btn btn-add ${!selectedSession || !selectedSemester ? "opacity-60 cursor-not-allowed" : ""}`}
            >
              <FileSpreadsheet size={18} />
              Download Excel
            </button>

            <button
              onClick={() => {
                setOpen(false);
                onPdfExport();
              }}
              disabled={!selectedSession || !selectedSemester}
              className={`w-full flex items-center gap-3 px-4 py-3 text-left btn btn-add ${!selectedSession || !selectedSemester ? "opacity-60 cursor-not-allowed" : ""}`}
            >
              <FileText size={18} />
              Download PDF Analysis
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ExportDropdown;