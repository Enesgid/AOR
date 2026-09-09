import DirectorSubmissionList from "./DirectorSubmissionList";

const Rejected = () => (
  <DirectorSubmissionList
    status="Rejected"
    title="Rejected Lecturer Submissions"
    subtitle="Review lecturer AOR forms that were rejected in the approval workflow"
    emptyMessage="There are no rejected lecturer submissions."
  />
);

export default Rejected;