const getPieChartData = (submissions = []) => {
  const approved = submissions.filter(
    (item) => item.status === "Approved"
  ).length;

  const pendingHod = submissions.filter(
    (item) => item.status === "Pending HOD"
  ).length;

  const pendingDean = submissions.filter(
    (item) => item.status === "Pending Dean"
  ).length;

  const pendingDirector = submissions.filter(
    (item) => item.status === "Pending Director"
  ).length;

  const rejected = submissions.filter(
    (item) => item.status === "Rejected"
  ).length;

  return [
    {
      name: "Approved",
      value: approved,
    },
    {
      name: "Pending HOD",
      value: pendingHod,
    },
    {
      name: "Pending Dean",
      value: pendingDean,
    },
    {
      name: "Pending Director",
      value: pendingDirector,
    },
    {
      name: "Rejected",
      value: rejected,
    },
  ];
};
export default getPieChartData