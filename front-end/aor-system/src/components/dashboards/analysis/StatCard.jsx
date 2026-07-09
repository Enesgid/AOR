const StatCard = ({
  title,
  value,
  subtitle,
  icon,
  iconBg,
}) => {
  return (
    <div className="
      bg-white
      rounded-2xl
      border border-gray-200
      shadow-sm
      hover:shadow-md
      transition-all duration-300
      p-5
    ">
      <div className="flex items-center gap-4">
        {/* Icon Container */}
        <div
          className={`
            w-14 h-14
            rounded-full
            flex items-center justify-center
            ${iconBg}
            shrink-0
          `}
        >
          {/* This renders the Lucide component directly as code, not an image file */}
          {icon}
        </div>

        {/* Text Contents */}
        <div>
          <p className="text-xs uppercase tracking-wide font-semibold text-gray-500">
            {title}
          </p>
          <h1 className="text-xl font-bold mt-1">
            {value}
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            {subtitle}
          </p>
        </div>
      </div>
    </div>
  );
};

export default StatCard;