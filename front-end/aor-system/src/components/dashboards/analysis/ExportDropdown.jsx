import { useState, useRef, useEffect } from "react";
import { Download, ChevronDown, FileSpreadsheet, FileText } from "lucide-react";

const ExportDropdown = ({
  onExcelExport,
  onPdfExport,
  sessions = [],
  selectedSession,
  setSelectedSession = () => {},
}) => {
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef(null);
  const [localSession, setLocalSession] = useState(selectedSession || "");

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target)
      ) {
        setOpen(false);
      }
    };

    document.addEventListener(
      "mousedown",
      handleClickOutside
    );

    return () =>
      document.removeEventListener(
        "mousedown",
        handleClickOutside
      );
  }, []);

  useEffect(() => {
    setLocalSession(selectedSession || "");
  }, [selectedSession]);

  return (
    <div
      className="relative"
      ref={dropdownRef}
    >
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
        <div
          className="
            absolute
            right-0
            mt-2
            w-36
           border-collapse
            rounded-sm
            shadow-lg
            z-50
            overflow-hidden
          "
        >
          <div className="px-3 py-2 bg-white">
            <label className="text-xs text-gray-500">Select session</label>
            <select
              value={localSession}
              onChange={(e) => {
                setLocalSession(e.target.value);
                setSelectedSession(e.target.value);
              }}
              className="w-full mt-2 p-2 border rounded"
            >
              <option value="">session</option>
              {sessions.map((s, i) => (
                <option key={i} value={s}>{s}</option>
              ))}
            </select>
          </div>
          <div className="border-t">
            <button
              onClick={() => {
                setOpen(false);
                onExcelExport();
              }}
              disabled={!localSession}
              className={`w-full flex items-center gap-4 px-4 py-3 text-left hover:bg-gray-100 ${!localSession ? 'opacity-60 cursor-not-allowed' : ''}`}
            >
              <FileSpreadsheet size={18} />
              Download Excel
            </button>

            <button
              onClick={() => {
                setOpen(false);
                onPdfExport();
              }}
              disabled={!localSession}
              className={`w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-gray-100 ${!localSession ? 'opacity-60 cursor-not-allowed' : ''}`}
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