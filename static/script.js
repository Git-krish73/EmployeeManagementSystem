const API_URL = "/api/employees";

const form = document.getElementById("employeeForm");
const table = document.getElementById("employeeTable");
const searchInput = document.getElementById("searchInput");
const message = document.getElementById("message");
const cancelBtn = document.getElementById("cancelBtn");

let employees = [];
let searchTimer;

function showMessage(text, type = "success") {
  message.textContent = text;
  message.className = `message ${type}`;
  message.hidden = false;
}

async function apiRequest(url, options = {}) {
  const response = await fetch(url, options);
  let data;
  try {
    data = await response.json();
  } catch {
    throw new Error("The server returned an unexpected response. Check the Flask terminal.");
  }
  if (!response.ok) throw new Error(data.error || "Request failed.");
  return data;
}

async function loadEmployees() {
  table.innerHTML = '<tr><td colspan="7" class="table-state">Loading employee records…</td></tr>';
  try {
    const query = encodeURIComponent(searchInput.value.trim());
    employees = await apiRequest(`${API_URL}?search=${query}`);
    renderEmployees();
    updateStats();
  } catch (error) {
    table.innerHTML = "";
    const row = document.createElement("tr");
    const cell = document.createElement("td");
    cell.colSpan = 7;
    cell.className = "table-state";
    cell.textContent = "Could not load employees. Make sure Flask is running, then refresh.";
    row.appendChild(cell);
    table.appendChild(row);
    showMessage(error.message, "error");
  }
}

function renderEmployees() {
  table.replaceChildren();
  if (employees.length === 0) {
    const row = document.createElement("tr");
    const cell = document.createElement("td");
    cell.colSpan = 7;
    cell.className = "table-state";
    cell.textContent = "No employees found. Try another search or add an employee.";
    row.appendChild(cell);
    table.appendChild(row);
    return;
  }

  employees.forEach(emp => {
    const row = document.createElement("tr");
    const nameCell = document.createElement("td");
    nameCell.className = "employee-name";
    nameCell.textContent = emp.name;
    row.appendChild(nameCell);

    const idCell = document.createElement("td");
    const pill = document.createElement("span");
    pill.className = "id-pill";
    pill.textContent = emp.employee_id;
    idCell.appendChild(pill);
    row.appendChild(idCell);

    [emp.department, emp.designation].forEach(value => {
      const cell = document.createElement("td");
      cell.textContent = value;
      row.appendChild(cell);
    });

    const salaryCell = document.createElement("td");
    salaryCell.className = "salary";
    salaryCell.textContent = `₹${Number(emp.salary).toLocaleString("en-IN", { maximumFractionDigits: 2 })}`;
    row.appendChild(salaryCell);

    const contactCell = document.createElement("td");
    contactCell.textContent = emp.contact;
    row.appendChild(contactCell);

    const actionCell = document.createElement("td");
    const edit = document.createElement("button");
    edit.type = "button";
    edit.className = "action-btn edit-btn";
    edit.textContent = "Edit";
    edit.addEventListener("click", () => editEmployee(emp));

    const remove = document.createElement("button");
    remove.type = "button";
    remove.className = "action-btn delete-btn";
    remove.textContent = "Delete";
    remove.addEventListener("click", () => deleteEmployee(emp));

    actionCell.append(edit, remove);
    row.appendChild(actionCell);
    table.appendChild(row);
  });
}

function updateStats() {
  document.getElementById("totalEmployees").textContent = employees.length;
  const departments = new Set(employees.map(emp => emp.department.trim().toLowerCase()));
  document.getElementById("totalDepartments").textContent = departments.size;
  const average = employees.length
    ? employees.reduce((sum, emp) => sum + Number(emp.salary), 0) / employees.length
    : 0;
  document.getElementById("averageSalary").textContent =
    `₹${Math.round(average).toLocaleString("en-IN")}`;
}

form.addEventListener("submit", async event => {
  event.preventDefault();
  const databaseId = document.getElementById("databaseId").value;
  const employee = {
    name: document.getElementById("name").value.trim(),
    employee_id: document.getElementById("employee_id").value.trim(),
    department: document.getElementById("department").value.trim(),
    designation: document.getElementById("designation").value.trim(),
    salary: document.getElementById("salary").value,
    contact: document.getElementById("contact").value.trim()
  };

  if (Object.values(employee).some(value => value === "")) {
    showMessage("Please fill in all fields.", "error");
    return;
  }
  if (!Number.isFinite(Number(employee.salary)) || Number(employee.salary) < 0) {
    showMessage("Enter a valid non-negative salary.", "error");
    return;
  }

  const editing = Boolean(databaseId);
  const submitBtn = document.getElementById("submitBtn");
  submitBtn.disabled = true;
  try {
    const result = await apiRequest(editing ? `${API_URL}/${databaseId}` : API_URL, {
      method: editing ? "PUT" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(employee)
    });
    showMessage(result.message, "success");
    resetForm();
    await loadEmployees();
  } catch (error) {
    showMessage(error.message, "error");
  } finally {
    submitBtn.disabled = false;
  }
});

function editEmployee(emp) {
  document.getElementById("databaseId").value = emp.id;
  document.getElementById("name").value = emp.name;
  document.getElementById("employee_id").value = emp.employee_id;
  document.getElementById("department").value = emp.department;
  document.getElementById("designation").value = emp.designation;
  document.getElementById("salary").value = emp.salary;
  document.getElementById("contact").value = emp.contact;
  document.getElementById("formTitle").textContent = "Edit employee details";
  document.getElementById("submitBtn").innerHTML = 'Save changes <span>→</span>';
  cancelBtn.hidden = false;
  form.scrollIntoView({ behavior: "smooth", block: "start" });
}

async function deleteEmployee(emp) {
  if (!confirm(`Delete ${emp.name} (${emp.employee_id})? This cannot be undone.`)) return;
  try {
    const result = await apiRequest(`${API_URL}/${emp.id}`, { method: "DELETE" });
    showMessage(result.message, "success");
    await loadEmployees();
  } catch (error) {
    showMessage(error.message, "error");
  }
}

function resetForm() {
  form.reset();
  document.getElementById("databaseId").value = "";
  document.getElementById("formTitle").textContent = "Add a new employee";
  document.getElementById("submitBtn").innerHTML = 'Add employee <span>→</span>';
  cancelBtn.hidden = true;
}

cancelBtn.addEventListener("click", resetForm);
searchInput.addEventListener("input", () => {
  clearTimeout(searchTimer);
  searchTimer = setTimeout(loadEmployees, 180);
});

loadEmployees();
