export const processDashboardAnalytics = (submissions = []) => {
  // 1. Fallback default object if there are no submissions yet
  const defaultPerformanceObj = { Schools: "None", school: "None", effort: 0, totalInput: 0, dean: "Not Signed", departments: [], departmentsCount: 0, status: "Poor" };
  
  if (!submissions || submissions.length === 0) {
    return {
      schoolsData: [],
      lineData: [],
      insights: { topSchool: defaultPerformanceObj, lowestSchool: defaultPerformanceObj, totalInput: 0, averageEffort: "0.0" }
    };
  }

  const validSubmissions = submissions.filter(
  (sub) => sub.lecturerDetails?.school
);

  const groupedSchools = submissions.reduce((acc, sub) => {
       if (!sub.lecturerDetails?.school) return acc;

const schoolName = sub.lecturerDetails.school;
    
    const deptName = sub.lecturerDetails?.department || "";
    // Check if dean signature exists, else mark as not signed
    const deanName = sub.deanSignature && sub.deanSignature !== "Pending" ? sub.deanSignature : "Not Signed";
    
    // Calculate this single lecturer's total QAP score by adding up their inputs
    const lecturerQapScore = Number(sub.totalDesignatedInput) || 
      (reduceArrayQap(sub.teaching, 'qap') + 
       reduceArrayQap(sub.administrativeDuties, 'qap') + 
       reduceArrayQap(sub.research, 'percentInput'));

    // If we haven't seen this school yet, initialize it
    if (!acc[schoolName]) {
      acc[schoolName] = {
        Schools: schoolName,
        dean: deanName,
        departmentsSet: new Set(),
        totalQapSum: 0,
        lecturerCount: 0,
      };
    }

    if (deptName) acc[schoolName].departmentsSet.add(deptName);
    acc[schoolName].totalQapSum += lecturerQapScore;
    acc[schoolName].lecturerCount += 1;

    return acc;
  }, {});

  const schoolsData = Object.values(groupedSchools).map((school) => {
    const avgEffort = school.lecturerCount > 0 
      ? Math.round(school.totalQapSum / school.lecturerCount) 
      : 0;

    // Convert Set into a real, readable JavaScript Array
    const departmentsArray = Array.from(school.departmentsSet);

    const pendingDirectorCount = submissions.filter(
      (sub) =>
        sub.lecturerDetails?.school ===
          school.Schools &&
        sub.status === "Pending Director"
    ).length;
    return {
        Schools: school.Schools,
        school: school.Schools,
        dean: school.dean,

        departments: departmentsArray,
        departmentsCount:
          departmentsArray.length || 1,

        totalInput: Math.round(
          school.totalQapSum
        ),

        effort: avgEffort,

        pendingDirectorCount,

        status:
          avgEffort >= 75
            ? "Excellent"
            : avgEffort >= 60
            ? "Good"
            : avgEffort >= 45
            ? "Average"
            : "Poor",
      };
  });

  // 3. Process Chronological Trend (Powers Line/Area Chart)
  const groupedDates = submissions.reduce((acc, sub) => {
    let dateRaw = sub.createdAt || sub.submittedAt;
    let dateStr = "Recent";

    if (dateRaw && typeof dateRaw === "string") {
      dateStr = dateRaw.split("T")[0]; 
    } else if (dateRaw instanceof Date) {
      dateStr = dateRaw.toISOString().split("T")[0];
    } else {
      dateStr = new Date().toISOString().split("T")[0];
    }

    acc[dateStr] = (acc[dateStr] || 0) + 1;
    return acc;
  }, {});

  const lineData = Object.keys(groupedDates)
    .sort((a, b) => new Date(a) - new Date(b))
    .map((date) => ({
      day: date,          
      submissions: groupedDates[date], 
    }));

  // 4. Calculate Top, Lowest, and Average Metrics for your Cards
  const sortedSchools = [...schoolsData].sort((a, b) => b.effort - a.effort);
  const topSchool = sortedSchools[0] || defaultPerformanceObj;
  const lowestSchool = sortedSchools[sortedSchools.length - 1] || defaultPerformanceObj;
  const totalInput = schoolsData.reduce((sum, school) => sum + school.totalInput, 0);
  const averageEffort = schoolsData.length > 0
    ? (schoolsData.reduce((sum, item) => sum + item.effort, 0) / schoolsData.length).toFixed(1)
    : "0.0";

  return {
    schoolsData,
    lineData,
    insights: { topSchool, lowestSchool, totalInput, averageEffort }
  };
};

// Simple helper to safely loop and sum array properties
const reduceArrayQap = (arr, key) => {
  if (!Array.isArray(arr)) return 0;
  return arr.reduce((sum, item) => sum + (parseFloat(item[key]) || 0), 0);
};