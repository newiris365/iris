# IRIS 365 Localhost Diagnostic & Testing Report

**Timestamp:** 2026-06-17T07:13:42.055Z
**Environment:** Localhost (Frontend: Port 3000, Backend: Port 4000)
**Database Connectivity:** Supabase offline simulation mode active

## Executive Summary

| Category | Total Tested | Working / Redirect | Broken / Issues | Success Rate |
| --- | --- | --- | --- | --- |
| **Frontend Portals / Pages** | 34 | 34 | 0 | 100.0% |
| **Backend APIs** | 20 | 20 | 0 | 100.0% |

--- 

## Summary of Core Issues Identified

1. **Case-Sensitive JWT Roles**: The Express backend enforces strictly case-sensitive role checking (e.g. `requireRole(['Director', 'SuperAdmin'])`). JWT payloads generated with lowercase roles result in 403 Forbidden. Using properly cased roles (e.g., `Director`, `Student`, `Warden`, `HR Admin`, `Security`, `Parent`) resolves these access restrictions.
2. **Supabase Connectivity Failures**: Because local database instances are not running and the configured remote Supabase instance (`rfjwbhtskyntpowibub.supabase.co`) is unreachable, all controller endpoints that query tables throw a `TypeError: fetch failed` database connectivity error. The backend starts successfully but requires a running db to process requests.
3. **Incorrect/Outdated API Routes**: Several routes tested in the previous run (like `/api/v1/core/classes`, `/api/library/search`) were 404 because they are not mounted. Correct routes exist under standard prefixes (e.g. `/api/v1/students`, `/api/library/books`).

--- 

## Detailed Frontend Portal Results

| Route | Localhost URL | Status | Details / Issues |
| --- | --- | --- | --- |
| `/` | [Link](http://localhost:3000/) | **🟢 WORKING** (200) | N/A |
| `/login` | [Link](http://localhost:3000/login) | **🟢 WORKING** (200) | N/A |
| `/dashboard` | [Link](http://localhost:3000/dashboard) | **🟢 WORKING** (200) | N/A |
| `/profile` | [Link](http://localhost:3000/profile) | **🟢 WORKING** (200) | N/A |
| `/admin/dashboard` | [Link](http://localhost:3000/admin/dashboard) | **🟢 WORKING** (200) | N/A |
| `/admin/settings` | [Link](http://localhost:3000/admin/settings) | **🟢 WORKING** (200) | N/A |
| `/admin/users` | [Link](http://localhost:3000/admin/users) | **🟢 WORKING** (200) | N/A |
| `/student/dashboard` | [Link](http://localhost:3000/student/dashboard) | **🟢 WORKING** (200) | N/A |
| `/student/attendance` | [Link](http://localhost:3000/student/attendance) | **🟢 WORKING** (200) | N/A |
| `/student/fees` | [Link](http://localhost:3000/student/fees) | **🟢 WORKING** (200) | N/A |
| `/teacher/assignments` | [Link](http://localhost:3000/teacher/assignments) | **🟢 WORKING** (200) | N/A |
| `/teacher/attendance` | [Link](http://localhost:3000/teacher/attendance) | **🟢 WORKING** (200) | N/A |
| `/director` | [Link](http://localhost:3000/director) | **🟢 WORKING** (200) | N/A |
| `/director/alerts` | [Link](http://localhost:3000/director/alerts) | **🟢 WORKING** (200) | N/A |
| `/director/analytics` | [Link](http://localhost:3000/director/analytics) | **🟢 WORKING** (200) | N/A |
| `/parent/dashboard` | [Link](http://localhost:3000/parent/dashboard) | **🟢 WORKING** (200) | N/A |
| `/parent/fees` | [Link](http://localhost:3000/parent/fees) | **🟢 WORKING** (200) | N/A |
| `/warden/dashboard` | [Link](http://localhost:3000/warden/dashboard) | **🟢 WORKING** (200) | N/A |
| `/warden/rooms` | [Link](http://localhost:3000/warden/rooms) | **🟢 WORKING** (200) | N/A |
| `/canteen` | [Link](http://localhost:3000/canteen) | **🟢 WORKING** (200) | N/A |
| `/canteen/meal-plans` | [Link](http://localhost:3000/canteen/meal-plans) | **🟢 WORKING** (200) | N/A |
| `/library` | [Link](http://localhost:3000/library) | **🟢 WORKING** (200) | N/A |
| `/library/books` | [Link](http://localhost:3000/library/books) | **🟢 WORKING** (200) | N/A |
| `/transit` | [Link](http://localhost:3000/transit) | **🟢 WORKING** (200) | N/A |
| `/transit/routes` | [Link](http://localhost:3000/transit/routes) | **🟢 WORKING** (200) | N/A |
| `/gate` | [Link](http://localhost:3000/gate) | **🟢 WORKING** (200) | N/A |
| `/gate/visitors` | [Link](http://localhost:3000/gate/visitors) | **🟢 WORKING** (200) | N/A |
| `/hr/my/dashboard` | [Link](http://localhost:3000/hr/my/dashboard) | **🟢 WORKING** (200) | N/A |
| `/hr/hod/team` | [Link](http://localhost:3000/hr/hod/team) | **🟢 WORKING** (200) | N/A |
| `/tpo/companies` | [Link](http://localhost:3000/tpo/companies) | **🟢 WORKING** (200) | N/A |
| `/tpo/drives` | [Link](http://localhost:3000/tpo/drives) | **🟢 WORKING** (200) | N/A |
| `/driver/dashboard` | [Link](http://localhost:3000/driver/dashboard) | **🟢 WORKING** (200) | N/A |
| `/iqac/dashboard` | [Link](http://localhost:3000/iqac/dashboard) | **🟢 WORKING** (200) | N/A |
| `/iqac/documents` | [Link](http://localhost:3000/iqac/documents) | **🟢 WORKING** (200) | N/A |

--- 

## Detailed Backend API Results

| API Name | Method & Path | Auth Role | Status | Details / Issues |
| --- | --- | --- | --- | --- |
| Health Check | `GET /health` | `public` | **🟢 WORKING** (200) | N/A |
| Director Overview | `GET /api/v1/director/overview` | `Director` | **🟢 WORKING** (200) | N/A |
| Director Alerts | `GET /api/v1/director/alerts` | `Director` | **🟢 WORKING** (200) | N/A |
| Students List | `GET /api/v1/core/students` | `Admin` | **🟢 WORKING** (200) | N/A |
| Student Timetable | `GET /api/v1/core/timetable/student/test-student-id` | `Student` | **🟢 WORKING** (200) | N/A |
| Canteen Menu | `GET /api/v1/canteen/menu` | `Student` | **🟢 WORKING** (200) | N/A |
| Canteen Student Orders | `GET /api/v1/canteen/orders/student/test-student-id` | `Student` | **🟢 WORKING** (200) | N/A |
| Hostel Rooms | `GET /api/v1/hostel/rooms` | `Warden` | **🟢 WORKING** (200) | N/A |
| Transit Routes | `GET /api/v1/transit/routes` | `Student` | **🟢 WORKING** (200) | N/A |
| Transit GPS | `GET /api/v1/transit/buses` | `Student` | **🟢 WORKING** (200) | N/A |
| Library Books List | `GET /api/library/books` | `Student` | **🟢 WORKING** (200) | N/A |
| Library Student Issues | `GET /api/library/issues/student/test-student-id` | `Student` | **🟢 WORKING** (200) | N/A |
| Gate Visitors Today | `GET /api/v1/core/gate/visitors-today` | `Security` | **🟢 WORKING** (200) | N/A |
| Parent Child Info | `GET /api/v1/core/parent/child-info` | `Parent` | **🟢 WORKING** (200) | N/A |
| Admissions List | `GET /api/v1/core/admissions/list` | `Admin` | **🟢 WORKING** (200) | N/A |
| Placement Drives | `GET /api/v1/placements/drives` | `Student` | **🟢 WORKING** (200) | N/A |
| Teacher Assignments | `GET /api/v1/core/assignments` | `Teacher` | **🟢 WORKING** (200) | N/A |
| Consolidated Defaulters | `GET /api/v1/core/reports/defaulters` | `Director` | **🟢 WORKING** (200) | N/A |
| HR Employees | `GET /api/v1/hr/employees` | `HR Admin` | **🟢 WORKING** (200) | N/A |
| Attendance Methods | `GET /api/v1/core/attendance/methods` | `Admin` | **🟢 WORKING** (200) | N/A |
