import ExcelJS from "exceljs";
import { saveAs } from "file-saver";
export const exportDashboardExcel = async (
submissions,
schoolsData,
insights
) => {
const workbook = new ExcelJS.Workbook();

 /*

# DASHBOARD SUMMARY SHEET

*/

const summarySheet =
workbook.addWorksheet(
"Dashboard Summary"
);



summarySheet.mergeCells("A1:J1");

const titleCell =
summarySheet.getCell("A1");

titleCell.value =
"FEDERAL UNIVERSITY OF TECHNOLOGY MINNA ASSIGNMENTS OF RESPONSIBILITY REPORT SHEET";

titleCell.font = {
bold: true,
size: 16,
};

titleCell.alignment = {
horizontal: "center",
};

summarySheet.addRow([]);

summarySheet.addRow([
"Top School",
insights.topSchool?.Schools || "",
]);

summarySheet.addRow([
"Lowest School",
insights.lowestSchool?.Schools || "",
]);

summarySheet.addRow([
"Total Input",
insights.totalInput || 0,
]);

summarySheet.addRow([
"Average Effort",
insights.averageEffort || 0,
]);

summarySheet.columns = [
{ width: 25 },
{ width: 30 },
];

// # /*

// # SCHOOL SHEETS

// */

const sheet =
  workbook.addWorksheet(
    "AOR reports for ALL"
  );
sheet.mergeCells("A1:M1");
sheet.pageSetup = {
  paperSize: 9,
  orientation: "landscape",
  fitToPage: true,
  fitToWidth: 1,
  fitToHeight: 0,
};
const title =
  sheet.getCell("A1");

title.value =
  "FEDERAL UNIVERSITY OF TECHNOLOGY MINNA ASSIGNMENT OF RESPONSIBILITY REPORT SHEET";

title.font = {
  bold: true,
  size: 18,
  name: "Times New Roman",
};


title.alignment = {
  horizontal: "center",
  vertical: "middle",
};

sheet.getRow(1).height = 30;

title.alignment = {
  horizontal: "center",
};

sheet.addRow([]);
sheet.addRow([]);
sheet.mergeCells("A4:B4");
sheet.addRow([
  "Generated On:",
  new Date().toLocaleDateString("en-GB"),
]);

sheet.addRow([
  "Session:",
  "2025/2026",
]);

sheet.addRow([
  "Semester:",
  "First Semester",
]);
schoolsData.forEach((school) => {

sheet.addRow([]);
sheet.addRow([]);



sheet.addRow([]);
// SCHOOL TITLE
sheet.addRow([]);

const schoolRowIndex = sheet.lastRow.number + 1;

sheet.mergeCells(`A${schoolRowIndex}:I${schoolRowIndex}`);

const schoolRow = sheet.getCell(`A${schoolRowIndex}`);

schoolRow.value = school.Schools.toUpperCase();

schoolRow.font = {
  bold: true,
  size: 16,
  name: "Times New Roman",
};

schoolRow.alignment = {
  horizontal: "center",
  vertical: "middle",
};

schoolRow.font = {
  bold: true,
  size: 16,
};

schoolRow.alignment = {
  horizontal: "center",
};
const schoolSubmissions =
  submissions.filter(
    (sub) =>
      sub.lecturerDetails?.school ===
      school.Schools
  );

const groupedDepartments =
  schoolSubmissions.reduce(
    (acc, sub) => {
      const department =
        sub.lecturerDetails?.department ||
        "Unassigned";

      if (!acc[department]) {
        acc[department] = [];
      }

      acc[department].push(sub);

      return acc;
    },
    {}
  );

Object.entries(groupedDepartments).forEach(
  ([departmentName, deptSubs]) => {

    sheet.addRow([]);
    sheet.addRow([]);

const deptRowIndex = sheet.lastRow.number + 1;

sheet.mergeCells(`A${deptRowIndex}:I${deptRowIndex}`);

const departmentRow = sheet.getCell(`A${deptRowIndex}`);

departmentRow.value =
  departmentName.toUpperCase();

departmentRow.font = {
  bold: true,
  size: 14,
  name: "Times New Roman",
};

departmentRow.alignment = {
  horizontal: "center",
  vertical: "middle",
};

  departmentRow.font = {
  bold: true,
  size: 14,
};


const headerRow = sheet.addRow([
  "S/N",
  "Name",
  "Rank",
  "Appt",
  "Teaching",
  "Admin",
  "Research",
  "Total % Input",
  "Remark",
]);

headerRow.eachCell((cell) => {
  cell.font = {
    bold: true,
  };

  cell.alignment = {
    horizontal: "center",
    vertical: "middle",
  };

  cell.border = {
    top: { style: "medium" },
    left: { style: "medium" },
    bottom: { style: "medium" },
    right: { style: "medium" },
  };
});

headerRow.font = {
  bold: true,
};
    let serial = 1;

    deptSubs.forEach(
      (submission) => {

        const lecturer =
          submission.lecturerDetails || {};

        const teachingTotal =
          (
            submission.teaching || []
          ).reduce(
            (sum, item) =>
              sum +
              (Number(item.qap) || 0),
            0
          );

        const adminTotal =
          (
            submission.administrativeDuties ||
            []
          ).reduce(
            (sum, item) =>
              sum +
              (Number(item.qap) || 0),
            0
          );

        const researchTotal =
          (
            submission.research || []
          ).reduce(
            (sum, item) =>
              sum +
              (Number(
                item.percentInput
              ) || 0),
            0
          );
          const totalInput =teachingTotal + adminTotal + researchTotal;

          const row = sheet.addRow([
          serial++,
          `${lecturer.firstName || ""} ${
            lecturer.middleInitial || ""
          } ${lecturer.lastName || ""}`,
          lecturer.position || "",
          lecturer.appointment || "",
          teachingTotal,
          adminTotal,
          researchTotal,
          totalInput,
          lecturer.leave || "",
        ]);
        row.eachCell((cell) => {
  cell.border = {
    top: { style: "thin" },
    left: { style: "thin" },
    bottom: { style: "thin" },
    right: { style: "thin" },
  };

  cell.alignment = {
    horizontal: "center",
    vertical: "middle",
  };
});
      }
    );
  }
);


sheet.columns = [
  { width: 8 },
  { width: 35 },
  { width: 18 },
  { width: 12 },
  { width: 12 },
  { width: 12 },
  { width: 12 },
  { width: 15 },
  { width: 25 },
];

});

const buffer =
await workbook.xlsx.writeBuffer();

const file = new Blob(
[buffer],
{
type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
}
);

saveAs(
file,
`Director_Report_${
      new Date()
        .toISOString()
        .split("T")[0]
    }.xlsx`
);
};
