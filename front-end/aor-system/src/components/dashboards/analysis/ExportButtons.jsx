import { Download } from "lucide-react";

const ExportButton = ({ onExport }) => {
  return (
    <button
      onClick={onExport}
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
    </button>
  );
};

export default ExportButton;