import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
} from "recharts";

const colors = [
  "#16a34a",
  "#f59e0b",
  "#3b82f6",
  "#8b5cf6",
  "#dc2626",
];

const SubmissionPieChart = ({ data =[] }) => {
  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">

      {/* Header */}
      <div className="mb-6">

        <h2 className="text-lg font-semibold text-gray-800">
          Submission Status
        </h2>

        <p className="text-sm text-gray-500 mt-1">
          Approval distribution across faculties
        </p>

      </div>

      {/* Content */}
      <div className="flex flex-col md:flex-row items-center gap-6">

        {/* Chart */}
        <div className="w-full md:w-[50%] h-[250px] md:h-[320px]">

          <ResponsiveContainer width="100%" height="100%">

            <PieChart>

              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={40}
                outerRadius={70}
                paddingAngle={4}
                dataKey="value"
                stroke="none"
              >

                {data.map((entry, index) => (

                  <Cell
                    key={index}
                    fill={colors[index % colors.length]}
                  />

                ))}

              </Pie>

            </PieChart>

          </ResponsiveContainer>

        </div>

        {/* Legends */}
        <div className="w-full md:flex-1 space-y-3">

          {data.map((item, index) => (

            <div
                  key={index}
                  className="
                    flex
                    items-center
                    justify-between
                    border-b
                    border-gray-100
                    pb-2
                  "
                >

              {/* Left */}
              <div className="flex items-center gap-3">

                <div
                  className="w-3 h-3 rounded-full"
                  style={{
                    backgroundColor:
                      colors[index % colors.length],
                  }}
                />

                <span className="text-sm font-medium text-gray-700">

                  {item.name}

                </span>

              </div>

              {/* Right */}
              <span className="text-sm font-semibold text-gray-800">

                {item.value}

              </span>

            </div>

          ))}

        </div>

      </div>

    </div>
  );
};

export default SubmissionPieChart;