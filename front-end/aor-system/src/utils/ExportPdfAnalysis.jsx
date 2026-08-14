import html2canvas from "html2canvas";
import jsPDF from "jspdf";

export const exportDashboardPDF = async (reportRef) => {
  if (!reportRef.current) return;

  const canvas = await html2canvas(reportRef.current, {
    scale: 2,
    useCORS: true,
    backgroundColor: "#ffffff",
  });

  const imgData = canvas.toDataURL("image/png");

  const pdf = new jsPDF("p", "mm", "a4");

  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();

  const margin = 10;

  const imgWidth = pageWidth - margin * 2;
  const imgHeight =
    (canvas.height * imgWidth) / canvas.width;

  let heightLeft = imgHeight;
  let position = 0;

  pdf.addImage(
    imgData,
    "PNG",
    margin,
    margin,
    imgWidth,
    imgHeight
  );

  heightLeft -= pageHeight;

  while (heightLeft > 0) {
    position = heightLeft - imgHeight;

    pdf.addPage();

    pdf.addImage(
      imgData,
      "PNG",
      margin,
      position,
      imgWidth,
      imgHeight
    );

    heightLeft -= pageHeight;
  }

  pdf.save("AOR_Analytics_Report.pdf");
};