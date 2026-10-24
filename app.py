from flask import Flask, render_template, request, jsonify
import sqlite3
import math
from pathlib import Path

app = Flask(__name__)
DATABASE = Path(__file__).with_name("employees.db")


def get_db():
    conn = sqlite3.connect(DATABASE)
    conn.row_factory = sqlite3.Row
    return conn


def init_db():
    with get_db() as conn:
        conn.execute("""
            CREATE TABLE IF NOT EXISTS employees (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                employee_id TEXT NOT NULL UNIQUE,
                department TEXT NOT NULL,
                designation TEXT NOT NULL,
                salary REAL NOT NULL CHECK (salary >= 0),
                contact TEXT NOT NULL
            )
        """)
        count = conn.execute("SELECT COUNT(*) FROM employees").fetchone()[0]
        if count == 0:
            conn.executemany("""
                INSERT INTO employees
                (name, employee_id, department, designation, salary, contact)
                VALUES (?, ?, ?, ?, ?, ?)
            """, [
                ("Rahul Sharma", "EMP001", "IT", "Software Developer", 35000, "9876543210"),
                ("Priya Das", "EMP002", "HR", "HR Executive", 28000, "9876543211"),
                ("Amit Kumar", "EMP003", "Finance", "Accountant", 32000, "9876543212"),
                ("Sneha Roy", "EMP004", "Marketing", "Marketing Executive", 30000, "9876543213"),
                ("Arjun Singh", "EMP005", "IT", "Web Developer", 40000, "9876543214"),
            ])


def clean_employee(data):
    fields = ("name", "employee_id", "department", "designation", "salary", "contact")
    if not isinstance(data, dict) or any(
        data.get(field) is None or str(data.get(field)).strip() == "" for field in fields
    ):
        return None, "All fields are required."

    try:
        salary = float(data["salary"])
        if not math.isfinite(salary) or salary < 0:
            raise ValueError
    except (ValueError, TypeError):
        return None, "Salary must be a valid non-negative number."

    employee = {field: str(data[field]).strip() for field in fields if field != "salary"}
    employee["salary"] = salary
    return employee, None


@app.route("/")
def home():
    return render_template("index.html")


@app.route("/api/employees", methods=["GET"])
def list_employees():
    search = request.args.get("search", "").strip()
    with get_db() as conn:
        rows = conn.execute("""
            SELECT * FROM employees
            WHERE name LIKE ? OR employee_id LIKE ? OR department LIKE ?
            ORDER BY id DESC
        """, (f"%{search}%", f"%{search}%", f"%{search}%")).fetchall()
    return jsonify([dict(row) for row in rows])


@app.route("/api/employees", methods=["POST"])
def add_employee():
    data, error = clean_employee(request.get_json(silent=True))
    if error:
        return jsonify({"error": error}), 400

    try:
        with get_db() as conn:
            conn.execute("""
                INSERT INTO employees
                (name, employee_id, department, designation, salary, contact)
                VALUES (?, ?, ?, ?, ?, ?)
            """, (
                data["name"], data["employee_id"], data["department"],
                data["designation"], data["salary"], data["contact"]
            ))
        return jsonify({"message": "Employee added successfully."}), 201
    except sqlite3.IntegrityError:
        return jsonify({"error": "Employee ID already exists."}), 409


@app.route("/api/employees/<int:emp_id>", methods=["PUT"])
def update_employee(emp_id):
    data, error = clean_employee(request.get_json(silent=True))
    if error:
        return jsonify({"error": error}), 400

    try:
        with get_db() as conn:
            cursor = conn.execute("""
                UPDATE employees
                SET name=?, employee_id=?, department=?, designation=?, salary=?, contact=?
                WHERE id=?
            """, (
                data["name"], data["employee_id"], data["department"],
                data["designation"], data["salary"], data["contact"], emp_id
            ))
            if cursor.rowcount == 0:
                return jsonify({"error": "Employee not found."}), 404
        return jsonify({"message": "Employee updated successfully."})
    except sqlite3.IntegrityError:
        return jsonify({"error": "Employee ID already exists."}), 409


@app.route("/api/employees/<int:emp_id>", methods=["DELETE"])
def delete_employee(emp_id):
    with get_db() as conn:
        cursor = conn.execute("DELETE FROM employees WHERE id=?", (emp_id,))
        if cursor.rowcount == 0:
            return jsonify({"error": "Employee not found."}), 404
    return jsonify({"message": "Employee deleted successfully."})


if __name__ == "__main__":
    init_db()
    app.run(debug=True)
