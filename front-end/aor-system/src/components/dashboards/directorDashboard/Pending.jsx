import DirectorSubmissionList, { pendingStatuses } from "./DirectorSubmissionList";
import { useSearchParams } from "react-router-dom";

const Pending = () => {
  const [searchParams] = useSearchParams();
  const selectedStatus = searchParams.get("status");
  const status = pendingStatuses.includes(selectedStatus) ? selectedStatus : pendingStatuses;
  const stageLabel = selectedStatus?.replace("Pending ", "") || "HOD, Dean, or Director";

  return (
    <DirectorSubmissionList
      status={status}
      title={selectedStatus ? `Pending ${stageLabel} Submissions` : "Pending Lecturer Submissions"}
      subtitle={selectedStatus ? `Track AOR forms awaiting ${stageLabel} action` : "Track AOR forms awaiting HOD, Dean, or Director action"}
      emptyMessage={selectedStatus ? `There are no submissions pending ${stageLabel} approval.` : "There are no pending lecturer submissions."}
    />
  );
};

export default Pending;