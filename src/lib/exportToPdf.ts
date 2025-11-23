import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

export const exportAppointmentsToPdf = (appointments: any[]) => {
  const doc = new jsPDF();

  // Add title
  doc.setFontSize(18);
  doc.text("Appointments Report", 14, 20);
  
  // Add generation date
  doc.setFontSize(11);
  doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 14, 30);

  // Prepare table data
  const tableData = appointments.map(apt => [
    `${apt.patients.first_name} ${apt.patients.last_name}`,
    apt.patients.contact_number,
    new Date(apt.appointment_date).toLocaleDateString(),
    apt.appointment_time,
    apt.reason,
    apt.status.charAt(0).toUpperCase() + apt.status.slice(1)
  ]);

  // Add table
  autoTable(doc, {
    head: [["Patient Name", "Contact", "Date", "Time", "Reason", "Status"]],
    body: tableData,
    startY: 40,
    styles: { fontSize: 9 },
    headStyles: { fillColor: [59, 130, 246] }
  });

  // Save the PDF
  doc.save(`appointments-${new Date().toISOString().split('T')[0]}.pdf`);
};
