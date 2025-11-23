export const exportAppointmentsToCsv = (appointments: any[]) => {
  // Define CSV headers
  const headers = [
    "Patient Name",
    "Contact Number",
    "Date",
    "Time",
    "Reason",
    "Status"
  ];

  // Convert appointments to CSV rows
  const rows = appointments.map(apt => [
    `${apt.patients.first_name} ${apt.patients.last_name}`,
    apt.patients.contact_number,
    new Date(apt.appointment_date).toLocaleDateString(),
    apt.appointment_time,
    apt.reason,
    apt.status
  ]);

  // Combine headers and rows
  const csvContent = [
    headers.join(","),
    ...rows.map(row => row.map(cell => `"${cell}"`).join(","))
  ].join("\n");

  // Create blob and download
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const link = document.createElement("a");
  const url = URL.createObjectURL(blob);
  
  link.setAttribute("href", url);
  link.setAttribute("download", `appointments-${new Date().toISOString().split('T')[0]}.csv`);
  link.style.visibility = "hidden";
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};
