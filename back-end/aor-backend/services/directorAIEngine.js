const User = require("../models/user");
const Submission = require("../models/Submission");

// Calculate months between two dates
const calculateMonthsDifference = (
  futureDate,
  currentDate
) => {
  const years =
    futureDate.getFullYear() -
    currentDate.getFullYear();

  const months =
    futureDate.getMonth() -
    currentDate.getMonth();

  return years * 12 + months;
};


// Create a structured intelligence finding
const createFinding = ({
  type,
  severity,
  title,
  description,
  recommendation,
  school = null,
  department = null,
  affectedCount = 0,
}) => {
  return {
    type,
    severity,
    title,
    description,
    recommendation,
    school,
    department,
    affectedCount,
  };
};


const getUniversityIntelligence = async () => {
  try {

    const users = await User.find().lean();

    const submissions =
      await Submission.find().lean();

    const today = new Date();

    const findings = [];

    const retirementReport = {
      alreadyRetired: [],
      retiringWithin6Months: [],
      retiringWithin12Months: [],
      retiringWithin24Months: [],
    };


    const lecturers = users.filter(
      (user) =>
        user.role === "Lecturer"
    );


    for (const lecturer of lecturers) {

      if (
        !lecturer.dateOfBirth ||
        !lecturer.dateOfFirstAppointment
      ) {
        continue;
      }


      const birthDate =
        new Date(
          lecturer.dateOfBirth
        );

      const appointmentDate =
        new Date(
          lecturer.dateOfFirstAppointment
        );


      /*
      =====================
      CALCULATE AGE
      =====================
      */

      let age =
        today.getFullYear() -
        birthDate.getFullYear();


      const birthdayThisYear =
        new Date(
          today.getFullYear(),
          birthDate.getMonth(),
          birthDate.getDate()
        );


      if (today < birthdayThisYear) {
        age--;
      }


      /*
      =====================
      CALCULATE YEARS OF SERVICE
      =====================
      */

      let yearsOfService =
        today.getFullYear() -
        appointmentDate.getFullYear();


      const appointmentAnniversary =
        new Date(
          today.getFullYear(),
          appointmentDate.getMonth(),
          appointmentDate.getDate()
        );


      if (
        today <
        appointmentAnniversary
      ) {
        yearsOfService--;
      }


      /*
      =====================
      RETIREMENT DATE BY AGE
      =====================
      */

      const ageRetirementDate =
        new Date(birthDate);

      ageRetirementDate.setFullYear(
        birthDate.getFullYear() + 65
      );


      /*
      =====================
      RETIREMENT DATE BY SERVICE
      =====================
      */

      const serviceRetirementDate =
        new Date(appointmentDate);

      serviceRetirementDate.setFullYear(
        appointmentDate.getFullYear() + 35
      );


      /*
      =====================
      ACTUAL RETIREMENT DATE
      =====================
      */

      const retirementDate =
        ageRetirementDate <
        serviceRetirementDate
          ? ageRetirementDate
          : serviceRetirementDate;


      const monthsRemaining =
        calculateMonthsDifference(
          retirementDate,
          today
        );


      const lecturerInfo = {
        name: lecturer.name,
        pfNumber: lecturer.pfNumber,
        school: lecturer.school,
        department:
          lecturer.department,
        rank:
          lecturer.position ||
          lecturer.rank ||
          "Not specified",

        age,
        yearsOfService,
        retirementDate,
        monthsRemaining,

        retirementReason:
          ageRetirementDate <
          serviceRetirementDate
            ? "Retirement by age limit"
            : "Retirement by years of service",
      };


      /*
      =====================
      RETIREMENT GROUPING
      =====================
      */

      if (monthsRemaining <= 0) {

        retirementReport
          .alreadyRetired
          .push(lecturerInfo);

      }

      else if (
        monthsRemaining <= 6
      ) {

        retirementReport
          .retiringWithin6Months
          .push(lecturerInfo);

      }

      else if (
        monthsRemaining <= 12
      ) {

        retirementReport
          .retiringWithin12Months
          .push(lecturerInfo);

      }

      else if (
        monthsRemaining <= 24
      ) {

        retirementReport
          .retiringWithin24Months
          .push(lecturerInfo);

      }

    }


    /*
    =====================================
    USER ROLE ANALYSIS
    =====================================
    */

    const hods =
      users.filter(
        (user) =>
          user.role === "HOD"
      );


    const deans =
      users.filter(
        (user) =>
          user.role === "Dean"
      );


    const directors =
      users.filter(
        (user) =>
          user.role === "Director"
      );


    /*
    =====================================
    SCHOOLS
    =====================================
    */

    const schools = [
      ...new Set(
        lecturers
          .map(
            (user) =>
              user.school
          )
          .filter(Boolean)
      ),
    ];


    /*
    =====================================
    DEPARTMENTS
    =====================================
    */

    const departments = [
      ...new Set(
        lecturers
          .map(
            (user) =>
              user.department
          )
          .filter(Boolean)
      ),
    ];


    /*
    =====================================
    SUBMISSION STATUS
    =====================================
    */

    const approvedSubmissions =
      submissions.filter(
        (sub) =>
          sub.status === "Approved"
      ).length;


    const rejectedSubmissions =
      submissions.filter(
        (sub) =>
          sub.status === "Rejected"
      ).length;


    const pendingSubmissions =
      submissions.filter(
        (sub) =>
          [
            "Pending HOD",
            "Pending Dean",
            "Pending Director",
          ].includes(sub.status)
      ).length;


    /*
    =====================================
    SCHOOL PERFORMANCE
    =====================================
    */

    const schoolPerformance = [];


    for (
      const school of schools
    ) {

      const schoolLecturers =
        lecturers.filter(
          (lecturer) =>
            lecturer.school === school
        );


      const schoolSubmissions =
        submissions.filter(
          (submission) =>
            submission.lecturerDetails
              ?.school === school
        );


      const lecturerCount =
        schoolLecturers.length;


      const submittedCount =
        schoolSubmissions.length;


      const submissionRate =
        lecturerCount > 0
          ? Number(
              (
                submittedCount /
                lecturerCount
              ) * 100
            ).toFixed(1)
          : 0;


      schoolPerformance.push({
        school,
        lecturerCount,
        submittedCount,
        submissionRate,
      });

    }


    /*
    =====================================
    DEPARTMENT PERFORMANCE
    =====================================
    */

    const departmentPerformance = [];


    for (
      const department of departments
    ) {

      const departmentLecturers =
        lecturers.filter(
          (lecturer) =>
            lecturer.department ===
            department
        );


      const departmentSubmissions =
        submissions.filter(
          (submission) =>
            submission.lecturerDetails
              ?.department ===
              department
        );


      const lecturerCount =
        departmentLecturers.length;


      const submittedCount =
        departmentSubmissions.length;


      const submissionRate =
        lecturerCount > 0
          ? Number(
              (
                submittedCount /
                lecturerCount
              ) * 100
            ).toFixed(1)
          : 0;


      departmentPerformance.push({
        department,
        lecturerCount,
        submittedCount,
        submissionRate,
      });

    }


    /*
    =====================================
    FINDING:
    SCHOOL PERFORMANCE
    =====================================
    */

    schoolPerformance.forEach(
      (school) => {

        if (
          school.lecturerCount > 0 &&
          school.submissionRate < 50
        ) {

          findings.push(
            createFinding({

              type:
                "submission",

              severity:
                "critical",

              title:
                `Very low submission rate in ${school.school}`,

              description:
                `${school.school} currently has a submission rate of ` +
                `${school.submissionRate}%. ` +
                `Only ${school.submittedCount} out of ` +
                `${school.lecturerCount} lecturers have submitted.`,

              recommendation:
                "The Director should request an immediate explanation from the School management and ensure that all outstanding lecturers are contacted.",

              school:
                school.school,

              affectedCount:
                school.lecturerCount -
                school.submittedCount,

            })
          );

        }

        else if (
          school.lecturerCount > 0 &&
          school.submissionRate < 70
        ) {

          findings.push(
            createFinding({

              type:
                "submission",

              severity:
                "warning",

              title:
                `Submission performance requires attention in ${school.school}`,

              description:
                `${school.school} currently has a submission rate of ` +
                `${school.submissionRate}%.`,

              recommendation:
                "School management should identify lecturers with outstanding submissions and improve compliance.",

              school:
                school.school,

              affectedCount:
                school.lecturerCount -
                school.submittedCount,

            })
          );

        }

        else if (
          school.submissionRate >= 90
        ) {

          findings.push(
            createFinding({

              type:
                "performance",

              severity:
                "positive",

              title:
                `${school.school} demonstrates strong submission compliance`,

              description:
                `${school.school} has achieved a submission rate of ` +
                `${school.submissionRate}%.`,

              recommendation:
                "The Director may review the management process used by this School as a possible best practice for other Schools.",

              school:
                school.school,

            })
          );

        }

      }
    );


    /*
    =====================================
    FINDING:
    DEPARTMENT PERFORMANCE
    =====================================
    */

    departmentPerformance.forEach(
      (department) => {

        if (
          department.lecturerCount > 0 &&
          department.submissionRate < 50
        ) {

          findings.push(
            createFinding({

              type:
                "department",

              severity:
                "critical",

              title:
                `${department.department} has a critical submission problem`,

              description:
                `The department currently has a submission rate of ` +
                `${department.submissionRate}%.`,

              recommendation:
                "The HOD should immediately identify and follow up with lecturers who have not submitted their responsibility information.",

              department:
                department.department,

              affectedCount:
                department.lecturerCount -
                department.submittedCount,

            })
          );

        }

        else if (
          department.lecturerCount > 0 &&
          department.submissionRate < 70
        ) {

          findings.push(
            createFinding({

              type:
                "department",

              severity:
                "warning",

              title:
                `${department.department} requires submission follow-up`,

              description:
                `The department currently has a submission rate of ` +
                `${department.submissionRate}%.`,

              recommendation:
                "The HOD should follow up with lecturers who still have outstanding submissions.",

              department:
                department.department,

            })
          );

        }

        else if (
          department.submissionRate >= 95
        ) {

          findings.push(
            createFinding({

              type:
                "performance",

              severity:
                "positive",

              title:
                `${department.department} demonstrates excellent compliance`,

              description:
                `The department has achieved a submission rate of ` +
                `${department.submissionRate}%.`,

              recommendation:
                "The department's submission process may be reviewed as a possible best practice.",

              department:
                department.department,

            })
          );

        }

      }
    );


    /*
    =====================================
    FINDING:
    PENDING SUBMISSIONS
    =====================================
    */

    if (
      pendingSubmissions > 0
    ) {

      const pendingRate =
        submissions.length > 0
          ? Number(
              (
                pendingSubmissions /
                submissions.length
              ) * 100
            ).toFixed(1)
          : 0;


      findings.push(
        createFinding({

          type:
            "approval",

          severity:
            pendingRate > 30
              ? "warning"
              : "insight",

          title:
            "Submissions are currently awaiting approval",

          description:
            `${pendingSubmissions} submission(s) are currently pending in the approval workflow, representing ${pendingRate}% of all submissions.`,

          recommendation:
            "Approval stages should be reviewed to identify possible delays at HOD, Dean, or Director level.",

          affectedCount:
            pendingSubmissions,

        })
      );

    }


    /*
    =====================================
    FINDING:
    REJECTED SUBMISSIONS
    =====================================
    */

    if (
      rejectedSubmissions > 0
    ) {

      findings.push(
        createFinding({

          type:
            "submission",

          severity:
            "warning",

          title:
            "Rejected submissions require review",

          description:
            `${rejectedSubmissions} submission(s) have been rejected.`,

          recommendation:
            "The reasons for rejection should be reviewed to identify recurring mistakes and improve lecturer guidance.",

          affectedCount:
            rejectedSubmissions,

        })
      );

    }


    /*
    =====================================
    FINDING:
    RETIREMENT RISKS
    =====================================
    */

    if (
      retirementReport
        .alreadyRetired
        .length > 0
    ) {

      findings.push(
        createFinding({

          type:
            "retirement",

          severity:
            "critical",

          title:
            "Staff retirement records require immediate attention",

          description:
            `${retirementReport.alreadyRetired.length} academic staff member(s) appear to have reached their retirement date.`,

          recommendation:
            "The Director should verify these records with Human Resources and begin succession or replacement planning where necessary.",

          affectedCount:
            retirementReport
              .alreadyRetired
              .length,

        })
      );

    }


    if (
      retirementReport
        .retiringWithin6Months
        .length > 0
    ) {

      findings.push(
        createFinding({

          type:
            "retirement",

          severity:
            "warning",

          title:
            "Academic staff approaching retirement",

          description:
            `${retirementReport.retiringWithin6Months.length} lecturer(s) may retire within the next six months.`,

          recommendation:
            "Succession planning and possible staff replacement requirements should be reviewed early to reduce disruption.",

          affectedCount:
            retirementReport
              .retiringWithin6Months
              .length,

        })
      );

    }


    if (
      retirementReport
        .retiringWithin12Months
        .length > 0
    ) {

      findings.push(
        createFinding({

          type:
            "retirement",

          severity:
            "insight",

          title:
            "Future retirement pressure identified",

          description:
            `${retirementReport.retiringWithin12Months.length} lecturer(s) may retire within the next twelve months.`,

          recommendation:
            "The University should begin medium-term workforce and succession planning for affected departments.",

          affectedCount:
            retirementReport
              .retiringWithin12Months
              .length,

        })
      );

    }


    /*
    =====================================
    BEST AND WORST PERFORMANCE
    =====================================
    */

    const sortedSchools =
      [...schoolPerformance].sort(
        (a, b) =>
          b.submissionRate -
          a.submissionRate
      );


    const sortedDepartments =
      [...departmentPerformance].sort(
        (a, b) =>
          b.submissionRate -
          a.submissionRate
      );


    /*
    =====================================
    RETURN INTELLIGENCE
    =====================================
    */

    return {

      university: {
        totalLecturers:
          lecturers.length,

        totalHODs:
          hods.length,

        totalDeans:
          deans.length,

        totalDirectors:
          directors.length,

        totalSchools:
          schools.length,

        totalDepartments:
          departments.length,
      },


      submissions: {
        total:
          submissions.length,

        approved:
          approvedSubmissions,

        pending:
          pendingSubmissions,

        rejected:
          rejectedSubmissions,
      },


      retirement:
        retirementReport,


      performance: {

        schools:
          schoolPerformance,

        departments:
          departmentPerformance,

        bestSchool:
          sortedSchools[0] || null,

        worstSchool:
          sortedSchools[
            sortedSchools.length - 1
          ] || null,

        bestDepartment:
          sortedDepartments[0] || null,

        worstDepartment:
          sortedDepartments[
            sortedDepartments.length - 1
          ] || null,

      },


      findings,

    };

  } catch (error) {

    console.error(
      "University Intelligence Error:",
      error
    );

    return null;

  }
};


module.exports = {
  getUniversityIntelligence,
};