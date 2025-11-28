const tableBody = document.querySelector("#studentsTable tbody");
const data = JSON.parse(localStorage.getItem("students")) || [];

data.forEach((student, index) => {
  const row = document.createElement("tr");

  row.innerHTML = `
    <td>${index + 1}</td>
    <td>${student.name}</td>
    <td>${student.session}</td>
  `;

  tableBody.appendChild(row);
});

function clearStudents() {
  if (confirm("Are you sure you want to delete all students?")) {
    localStorage.removeItem("students");
    location.reload();
  }
}
