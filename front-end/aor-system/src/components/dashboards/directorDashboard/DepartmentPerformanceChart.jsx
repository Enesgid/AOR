import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";

const DepartmentPerformanceChart = ({ data }) => {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-5">

      <h2 className="text-xl font-semibold mb-5">
        Department Performance Overview
      </h2>

      <ResponsiveContainer
        width="100%"
        height={350}
      >
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />

          <XAxis dataKey="name" />

          <YAxis />

          <Tooltip />

          <Bar
            dataKey="departmentEffort"
            fill="#2563eb"
            radius={[6, 6, 0, 0]}
          />
        </BarChart>
      </ResponsiveContainer>

    </div>
  );
};      

export default DepartmentPerformanceChart;