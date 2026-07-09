import {
  Users,
  CheckCircle2,
  Clock3,
  XCircle,
  XIcon,
  TrendingUp,
} from "lucide-react";

export const getDashboardStats = (submissions) => {
  const totalSubmitted = submissions.length;

  const approvedCount = submissions.filter(
    (item) => item.status === "Approved"
  ).length;

  const pendingCount = submissions.filter(
    (item) =>
      item.status === "Pending HOD" ||
      item.status === "Pending Dean" ||
      item.status === "Pending Director"
  ).length;

  const rejectedCount = submissions.filter(
    (item) => item.status === "Rejected"
  ).length;

  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();

  const currentMonthSubmissions =
    submissions.filter((item) => {
      const date = new Date(item.createdAt);

      return (
        date.getMonth() === currentMonth &&
        date.getFullYear() === currentYear
      );
    }).length;

  const previousMonthSubmissions =
    submissions.filter((item) => {
      const date = new Date(item.createdAt);

      return (
        date.getMonth() === currentMonth - 1 &&
        date.getFullYear() === currentYear
      );
    }).length;

  const submissionTrend =
    currentMonthSubmissions -
    previousMonthSubmissions;

  return [
    {
      title: "Total Submissions",
      value: totalSubmitted,
      subtitle: "All lecturers",
      icon: <Users size={28} />,
      iconBg: "bg-blue-100 text-blue-700",
    },

    {
      title: "Approved",
      value: approvedCount,
      subtitle: "Completed",
      icon: <CheckCircle2 size={28} />,
      iconBg: "bg-green-100 text-green-700",
    },

    {
      title: "Pending",
      value: pendingCount,
      subtitle: "Awaiting approval",
      icon: <Clock3 size={28} />,
      iconBg: "bg-yellow-100 text-yellow-700",
    },

    {
      title: "Rejected",
      value: rejectedCount,
      subtitle: "Returned forms",
      icon: <XIcon size={28} />,
      iconBg: "bg-red-100 text-red-700",
    },

    {
      title: "Submission Trend",
      value:
        submissionTrend > 0
          ? `+${submissionTrend}`
          : submissionTrend,
      subtitle: "vs last month",
      icon: <TrendingUp size={28} />,
      iconBg: "bg-purple-100 text-purple-700",
    },
  ];
};