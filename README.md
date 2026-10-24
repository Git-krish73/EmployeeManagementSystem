# Employee Management System (Aim 5)

A beginner-friendly full-stack CRUD application using HTML, CSS, JavaScript, Python Flask, and SQLite.

## Requirements
- Python 3.9 or newer
- Flask

## Run the application (Windows / VS Code)
1. Extract the ZIP file.
2. Open the `EmployeeManagementSystem` folder in VS Code.
3. Open Terminal > New Terminal.
4. Install Flask if needed:
   ```bash
   python -m pip install flask
   ```
5. Start the app:
   ```bash
   python app.py
   ```
6. Open http://127.0.0.1:5000 in your browser.

The `employees.db` SQLite database is created automatically on first run, with five sample employee records.

## Features
- Add, list, search, update, and delete employees.
- Search by employee name, employee ID, or department.
- Unique Employee ID enforced by SQLite.
- Server-side validation for required fields and salary.
- JSON REST API using GET, POST, PUT, and DELETE.
- Responsive dashboard; JavaScript updates the table without a page reload.

## API endpoints
- `GET /api/employees?search=IT`
- `POST /api/employees`
- `PUT /api/employees/<database_id>`
- `DELETE /api/employees/<database_id>`

## Notes
- `employees.db` is generated at runtime and is not included in the ZIP, so each first run creates a fresh sample database.
- Node.js is not required to run this plain HTML/CSS/JavaScript frontend; Flask serves the static files directly.
- This is a local educational project, not hardened for public production deployment.
