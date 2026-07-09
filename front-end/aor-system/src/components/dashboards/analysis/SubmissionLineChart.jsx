import {
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  AreaChart,
  Area,
} from "recharts";


const SubmissionLineChart = ({ data = [] }) => {
  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">

      {/* Header */}
      <div className="mb-6">

        <h2 className="text-lg font-semibold text-gray-800">
          Submission Trend
        </h2>

        <p className="text-sm text-gray-500 mt-1">
          Daily submission performance overview
        </p>

      </div>

      {/* Chart */}
      <div className="h-[320px]">

        <ResponsiveContainer width="100%" height="100%">

          <AreaChart data={data}>

            {/* Gradient */}
            <defs>

              <linearGradient
                id="submissionGradient"
                x1="0"
                y1="0"
                x2="0"
                y2="1"
              >

                <stop
                  offset="5%"
                  stopColor="#16a34a"
                  stopOpacity={0.35}
                />

                <stop
                  offset="95%"
                  stopColor="#16a34a"
                  stopOpacity={0}
                />

              </linearGradient>

            </defs>

            {/* Grid */}
            <CartesianGrid
              strokeDasharray="3 3"
              vertical={false}
              stroke="#e5e7eb"
            />

            {/* X Axis */}
            <XAxis
              dataKey="day"
              tickLine={false}
              axisLine={false}
              tick={{
                fontSize: 12,
                fill: "#6b7280",
              }}
            />

            {/* Y Axis */}
            <YAxis
              tickLine={false}
              axisLine={false}
              tick={{
                fontSize: 12,
                fill: "#6b7280",
              }}
            />

            {/* Tooltip */}
            <Tooltip
              contentStyle={{
                borderRadius: "12px",
                border: "1px solid #e5e7eb",
                boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
              }}
            />

            {/* Area */}
            <Area
              type="monotone"
              dataKey="submissions"
              stroke="#16a34a"
              strokeWidth={3}
              fill="url(#submissionGradient)"
              dot={{
                r: 4,
                fill: "#16a34a",
                strokeWidth: 2,
                stroke: "#fff",
              }}
              activeDot={{
                r: 6,
              }}
            />

          </AreaChart>

        </ResponsiveContainer>

      </div>

    </div>
  );
};

export default SubmissionLineChart;