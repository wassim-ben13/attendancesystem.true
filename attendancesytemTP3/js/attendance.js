function addStudent() {
  const name = document.getElementById("name").value;
  const session = document.getElementById("session").value;

  if (name === "" || session === "") {
    alert("Fill all fields!");
    return;
  }

  let data = JSON.parse(localStorage.getItem("students")) || [];
  data.push({ name, session });

  localStorage.setItem("students", JSON.stringify(data));
  alert("Student Added!");

  document.getElementById("name").value = "";
  document.getElementById("session").value = "";
}
