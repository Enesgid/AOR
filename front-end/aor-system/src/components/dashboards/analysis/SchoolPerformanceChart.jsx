import FacultyBarChart from "./FacultyBarChart";

const SchoolPerformanceChart = ({
  schoolsData,
  activeChart,
  setActiveChart,
}) => {
  const topFiveSchools = [...schoolsData]
    .sort((a, b) => b.effort - a.effort)
    .slice(0, 5);

  return (
    <div
      onMouseEnter={() => setActiveChart("bar")}
      onMouseLeave={() => setActiveChart(null)}
      className={`
        relative transition-all duration-300
        ${
          activeChart === "bar"
            ? `
                lg:z-[100]
                lg:w-[100vh]
                lg:h-[60vh]
                lg:right-[200px]
              `
            : ""
        }
      `}
    >
      <FacultyBarChart
        data={
          activeChart === "bar"
            ? schoolsData
            : topFiveSchools
        }
      />
    </div>
  );
};

export default SchoolPerformanceChart;