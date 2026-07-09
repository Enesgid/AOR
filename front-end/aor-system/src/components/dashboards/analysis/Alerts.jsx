const Alerts = () => {
  return (
    <div className="bg-white border-l-4 border-red-500 rounded-2xl shadow-sm p-5 mt-6">
    <h2 className="font-semibold text-red-600 mb-3 text-lg">
  System Alerts
</h2>

      <ul className="space-y-2 text-sm">
        <li>Faculty of Education submission rate below 60%</li>
        <li>15 staff members have not submitted</li>
        <li>4 submissions were rejected</li>
      </ul>
    </div>
  );
};

export default Alerts;