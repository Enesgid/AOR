const ToggleSwitch = ({
  label,
  description,
  checked,
  onChange,
}) => {
  return (
    <div className="flex justify-between gap-6 py-4">

      <div>
        <h4 className="font-medium text-gray-800">
          {label}
        </h4>

        <p className="text-sm text-gray-500 mt-1">
          {description}
        </p>
      </div>

      <button
        onClick={onChange}
        className={`
          relative
          w-12
          h-6
          rounded-full
          border-none
          transition-all
          duration-300
          ${checked
            ? "bg-[purple]"
            : "bg-gray-200"}
        `}
      >
        <span
          className={`
            absolute
            top-1
            left-1
            w-4
            h-4
            bg-white
            rounded-full
            transition-all
            duration-300
            ${checked ? "left-6" : ""}
          `}
        />
      </button>

    </div>
  );
};

export default ToggleSwitch;