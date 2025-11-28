const data = JSON.parse(localStorage.getItem("students")) || [];

let sessions = {};
data.forEach(s => {
  sessions[s.session] = (sessions[s.session] || 0) + 1;
});

const labels = Object.keys(sessions);
const values = Object.values(sessions);

new Chart(document.getElementById("chart"), {
  type: "bar",
  data: {
    labels: labels,
    datasets: [{
      label: "Students per Session",
      data: values,
      backgroundColor: "#2563eb",
      barThickness: 20
    }]
  },
  options: {
    responsive: true,
    scales: {
      y: {
        min: 0,
        ticks: { stepSize: 1 }
      }
    }
  }
});
