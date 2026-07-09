import { useState, useRef, useEffect } from "react";
import { Download, ChevronDown, FileSpreadsheet, FileText } from "lucide-react";

const ExportDropdown = ({
  onExcelExport,
  onPdfExport,
}) => {
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef(null);

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
          <button
            onClick={() => {
              setOpen(false);
              onExcelExport();
            }}
            className="
              w-full
              flex
              items-center
              gap-4
              px-4
              py-3
              text-left
              hover:bg-gray-100
            "
          >
            <FileSpreadsheet size={18} />
            Download Excel
          </button>

          <button
            onClick={() => {
              setOpen(false);
              onPdfExport();
            }}
            className="
              w-full
              flex
              items-center
              gap-3
              px-4
              py-3
              text-left
              hover:bg-gray-100
            "
          >
            <FileText size={18} />
            Download PDF Analysis
          </button>
        </div>
      )}
    </div>
  );
};

export default ExportDropdown;