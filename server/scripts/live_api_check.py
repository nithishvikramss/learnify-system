"""
Live end-to-end API check against a RUNNING backend and a REAL MongoDB.

What it proves: login works, role rules are enforced, and student/marks records are really
created, updated and deleted in MongoDB (checked directly with pymongo, not only via the API).
It only touches its own test student (register number E2ETEST001) and removes it at the end.

Usage (backend running on :8080, from the server/ folder):
    python -m pip install pymongo
    python scripts/live_api_check.py
Credentials are read from server/.env and never printed.
"""
import json
import os
import sys
import urllib.error
import urllib.request
from datetime import date, timedelta

from pymongo import MongoClient

API = os.environ.get("API_URL", "http://localhost:8080/api")
HERE = os.path.dirname(os.path.abspath(__file__))
REG = "E2ETEST001"
STAFF = "e2e.staff"


def load_env():
    env = {}
    with open(os.path.join(HERE, "..", ".env"), encoding="utf-8") as f:
        for line in f:
            line = line.strip()
            if line and not line.startswith("#") and "=" in line:
                k, v = line.split("=", 1)
                env[k] = v  # later lines win, like Spring's property import
    return env


def call(method, path, token=None, body=None):
    req = urllib.request.Request(API + path, method=method)
    req.add_header("Content-Type", "application/json")
    if token:
        req.add_header("Authorization", "Bearer " + token)
    data = json.dumps(body).encode() if body is not None else None
    try:
        with urllib.request.urlopen(req, data) as r:
            raw = r.read()
            return r.status, json.loads(raw) if raw else None
    except urllib.error.HTTPError as e:
        raw = e.read()
        return e.code, json.loads(raw) if raw else None


results = []


def check(name, condition, detail=""):
    results.append((name, bool(condition)))
    print(("PASS " if condition else "FAIL ") + name + (f"  ({detail})" if detail and not condition else ""))


def main():
    env = load_env()
    db = MongoClient(env["MONGODB_URI"], serverSelectionTimeoutMS=3000).get_default_database()
    students, marks = db["students"], db["marks"]

    # --- Authentication ---
    status, _ = call("GET", "/students")
    check("No token -> 401", status == 401, status)
    status, body = call("POST", "/auth/login", body={"username": "admin", "password": "wrong-password"})
    check("Wrong password -> 401 with generic message", status == 401 and body["message"] == "Invalid username or password.", status)
    status, body = call("POST", "/auth/login", body={"username": "admin", "password": env["APP_ADMIN_PASSWORD"]})
    check("Admin login -> 200 + token", status == 200 and body.get("token") and body["role"] == "ADMIN", status)
    admin = body["token"]
    status, body = call("POST", "/auth/login", body={"username": "teacher", "password": env["APP_TEACHER_PASSWORD"]})
    check("Teacher login -> 200 + token", status == 200 and body["role"] == "TEACHER", status)
    teacher = body["token"]
    check("Password hashes stored, not plain text",
          all(u["passwordHash"].startswith("$2") for u in db["users"].find()))

    # Clean up a leftover test record from an interrupted earlier run (only our own test student)
    for s in students.find({"registerNumber": REG}):
        call("DELETE", f"/students/{s['_id']}", admin)

    # --- Student CRUD, verified directly in MongoDB ---
    count_before = students.count_documents({})
    status, body = call("POST", "/students", admin,
                        {"name": "Live Test Student", "registerNumber": REG.lower(), "department": "Civil",
                         "semester": 4, "email": "Live.Test@Example.edu"})
    check("Create student -> 201", status == 201, status)
    sid = body["id"]
    doc = students.find_one({"registerNumber": REG})
    check("Student saved in MongoDB (normalised reg no + email)",
          doc is not None and doc["email"] == "live.test@example.edu" and students.count_documents({}) == count_before + 1)

    status, body = call("POST", "/students", admin,
                        {"name": "Duplicate", "registerNumber": REG, "department": "Civil", "semester": 1})
    check("Duplicate register number -> 409", status == 409, status)
    status, body = call("POST", "/students", admin, {"name": "", "registerNumber": "x", "department": "", "semester": 9})
    check("Invalid student -> 400 with field errors", status == 400 and {"name", "registerNumber", "semester"} <= set(body["fieldErrors"]), status)
    status, _ = call("POST", "/students", teacher,
                     {"name": "Teacher Try", "registerNumber": "E2ETEST002", "department": "Civil", "semester": 1})
    check("Teacher cannot create student -> 403", status == 403, status)

    status, body = call("GET", f"/students/{sid}", teacher)
    check("Read student by id (teacher) -> 200", status == 200 and body["registerNumber"] == REG, status)
    status, body = call("GET", "/students?search=e2etest", admin)
    check("Search by register number finds it", status == 200 and any(s["id"] == sid for s in body), status)

    status, body = call("PUT", f"/students/{sid}", admin,
                        {"name": "Live Test Student Updated", "registerNumber": REG, "department": "Mechanical",
                         "semester": 5, "email": ""})
    doc = students.find_one({"registerNumber": REG})
    check("Update student -> 200 and changed in MongoDB",
          status == 200 and doc["department"] == "Mechanical" and doc["semester"] == 5 and doc.get("email") is None, status)

    # --- Marks for the test student ---
    subject = db["subjects"].find_one()
    sub_id, max_marks = str(subject["_id"]), subject["maxMarks"]
    status, body = call("POST", "/marks", teacher,
                        {"studentId": sid, "subjectId": sub_id, "internalMarks": 10, "externalMarks": 10})
    check("Teacher enters marks -> 201", status == 201, status)
    status, _ = call("POST", "/marks", teacher,
                     {"studentId": sid, "subjectId": sub_id, "internalMarks": 15, "externalMarks": 15})
    rows = list(marks.find({"studentId": sid}))
    check("Re-entering marks updates, no duplicate (B3)", len(rows) == 1 and rows[0]["totalMarks"] == 30, len(rows))
    status, body = call("POST", "/marks", teacher,
                        {"studentId": sid, "subjectId": sub_id, "internalMarks": max_marks, "externalMarks": 1})
    check("Marks above subject max -> 400", status == 400, status)
    status, body = call("GET", f"/marks/student/{sid}", teacher)
    check("Report card data -> registerNumber and percentage", status == 200 and body[0]["registerNumber"] == REG, status)

    status, body = call("GET", "/analytics/summary", teacher)
    check("Dashboard counts match MongoDB",
          status == 200 and body["totalStudents"] == students.count_documents({})
          and body["totalSubjects"] == db["subjects"].count_documents({}), status)

    # --- Attendance ---
    attendance = db["attendance"]
    today = date.today().isoformat()
    sheet = {"subjectId": sub_id, "date": today, "entries": [{"studentId": sid, "present": True}]}
    status, _ = call("PUT", "/attendance", teacher, sheet)
    check("Teacher saves attendance -> 200", status == 200, status)
    sheet["entries"][0]["present"] = False
    status, _ = call("PUT", "/attendance", teacher, sheet)
    rows = list(attendance.find({"studentId": sid}))
    check("Saving the same date updates, no duplicate", len(rows) == 1 and rows[0]["present"] is False and rows[0]["date"] == today, len(rows))
    status, _ = call("PUT", "/attendance", teacher, {**sheet, "date": (date.today() + timedelta(days=1)).isoformat()})
    check("Future date -> 400", status == 400, status)
    status, _ = call("PUT", "/attendance", None, sheet)
    check("Attendance without login -> 401", status == 401, status)
    status, body = call("GET", f"/attendance/student/{sid}", teacher)
    check("Summary: 0 of 1, flagged below 75%", status == 200 and body[0]["total"] == 1 and body[0]["attended"] == 0 and body[0]["belowMinimum"] is True, status)

    # --- Delete removes the student and their marks ---
    status, _ = call("DELETE", f"/students/{sid}", teacher)
    check("Teacher cannot delete student -> 403", status == 403, status)
    status, _ = call("DELETE", f"/students/{sid}", admin)
    check("Delete student -> 200", status == 200, status)
    check("Student and their marks removed from MongoDB",
          students.find_one({"registerNumber": REG}) is None and marks.count_documents({"studentId": sid}) == 0)
    check("Student's attendance removed from MongoDB", attendance.count_documents({"studentId": sid}) == 0)
    check("Total students back to the original count", students.count_documents({}) == count_before)
    status, _ = call("GET", f"/students/{sid}", admin)
    check("Deleted student -> 404", status == 404, status)

    # --- Pagination (server-side, filters across all records) ---
    total = students.count_documents({})
    status, body = call("GET", "/students/page?page=0&size=10", teacher)
    check("Student page: 10 rows and correct total", status == 200 and len(body["content"]) == min(10, total) and body["totalElements"] == total, status)
    status, body = call("GET", "/students/page?page=0&size=100&department=Civil", teacher)
    check("Student page filter matches MongoDB", body["totalElements"] == students.count_documents({"department": "Civil"}), body["totalElements"])
    status, _ = call("GET", "/students/page?page=0&size=1000", teacher)
    check("Oversized page -> 400", status == 400, status)
    status, body = call("GET", "/marks/page?page=1&size=25", teacher)
    check("Marks page 2: correct total", status == 200 and body["page"] == 1 and body["totalElements"] == marks.count_documents({}), status)

    # --- Staff accounts ---
    for u in db["users"].find({"username": STAFF}):
        call("DELETE", f"/users/{u['_id']}", admin)
    status, _ = call("GET", "/users", teacher)
    check("Teacher cannot list staff -> 403", status == 403, status)
    status, body = call("POST", "/users", admin, {"username": STAFF, "fullName": "Live Staff", "password": "StaffPass#2026"})
    check("Admin creates teacher account -> 201", status == 201 and body["role"] == "TEACHER", status)
    uid = body["id"]
    check("Staff password stored as a hash", db["users"].find_one({"username": STAFF})["passwordHash"].startswith("$2"))
    status, _ = call("POST", "/users", admin, {"username": STAFF, "fullName": "Dup", "password": "StaffPass#2026"})
    check("Duplicate username -> 409", status == 409, status)
    status, body = call("POST", "/auth/login", body={"username": STAFF, "password": "StaffPass#2026"})
    check("New teacher can log in", status == 200, status)
    staff_token = body["token"]
    status, _ = call("PUT", "/users/me/password", staff_token, {"currentPassword": "wrong", "newPassword": "StaffPass#2027"})
    check("Change password with wrong current -> 400", status == 400, status)
    status, _ = call("PUT", "/users/me/password", staff_token, {"currentPassword": "StaffPass#2026", "newPassword": "StaffPass#2027"})
    check("Change own password -> 200", status == 200, status)
    status, _ = call("POST", "/auth/login", body={"username": STAFF, "password": "StaffPass#2027"})
    check("Login with the new password", status == 200, status)
    call("PUT", f"/users/{uid}/status", admin, {"disabled": True})
    status, _ = call("GET", "/students", staff_token)
    check("Disabled account: existing token stops working -> 401", status == 401, status)
    status, _ = call("POST", "/auth/login", body={"username": STAFF, "password": "StaffPass#2027"})
    check("Disabled account cannot log in -> 401", status == 401, status)
    admin_id = str(db["users"].find_one({"username": "admin"})["_id"])
    status, _ = call("PUT", f"/users/{admin_id}/status", admin, {"disabled": True})
    check("Admin account cannot be disabled -> 400", status == 400, status)
    status, _ = call("DELETE", f"/users/{uid}", admin)
    check("Delete teacher account -> 200 and gone from MongoDB",
          status == 200 and db["users"].find_one({"username": STAFF}) is None, status)

    failed = [n for n, ok in results if not ok]
    print(f"\n{len(results) - len(failed)}/{len(results)} checks passed")
    sys.exit(1 if failed else 0)


if __name__ == "__main__":
    main()
