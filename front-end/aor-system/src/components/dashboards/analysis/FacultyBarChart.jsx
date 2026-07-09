import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
  CartesianGrid,
} from "recharts";

const colors = [
  "#2563eb",
  "#9333ea",
  "#14b8a6",
  "#ef4444",
  "#3b82f6",
  "#22c55e",
  "#fbbf24",
  "#e11d48",
  "#16a34a",
  "#dc2626",
  "#7c3aed",
  "#0891b2",
  "#db2777",
];

const FacultyBarChart = ({ data = [] }) => {
  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-4">

      {/* Header */}
      <div className="mb-6">

        <h2 className="text-lg font-semibold text-gray-800">
          School Effort Rates
        </h2>

        <p className="text-sm text-gray-500 mt-1">
          Performance overview across different Schools
        </p>

      </div>

      {/* Chart */}
      <div className="h-[320px]">

        <ResponsiveContainer width="100%" height="100%">

          <BarChart
            data={data}
            barCategoryGap={10}
          >

            {/* Grid */}
            <CartesianGrid
              strokeDasharray="3 3"
              vertical={true}
              stroke="#f1f5f9"
            />

            {/* X Axis */}
            <XAxis
              dataKey="Schools"
              interval={0}
              tickLine={false}
              axisLine={false}
              tick={{
                fontSize: 8,
                fill: "#6b7280",
              }}
            />

            {/* Y Axis */}
            <YAxis
              tickLine={false}
              axisLine={false}
              tick={{
                fontSize: 11,
                fill: "#6b7280",
              }}
            />

            {/* Tooltip */}
            <Tooltip
              cursor={{ fill: "transparent" }}
              contentStyle={{
                borderRadius: "12px",
                border: "1px solid #e5e7eb",
                boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
              }}
            />

            {/* Bars */}
            <Bar
            dataKey="effort"
            radius={[10, 10, 0, 0]}
            barSize={30}
            >

              {data.map((entry, index) => (

                <Cell
                  key={`cell-${index}`}
                  fill={colors[index % colors.length]}
                />

              ))}

            </Bar>

          </BarChart>

        </ResponsiveContainer>

      </div>

    </div>
  );
};

export default FacultyBarChart;