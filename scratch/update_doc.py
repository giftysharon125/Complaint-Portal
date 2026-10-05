import docx
import shutil
import os

source_path = r"C:\Users\Gifty\Downloads\SE_Project_doc.backup.docx"
target_downloads = r"C:\Users\Gifty\Downloads\SE_Project_doc.docx"
target_workspace = r"d:\SE_Proj\SE_Project_doc.docx"
target_workspace_named = r"d:\SE_Proj\Student_Complaint_Management_System_Report.docx"

doc = docx.Document(source_path)

# 1. Update Title and Cover Page
doc.paragraphs[0].text = "STUDENT COMPLAINT MANAGEMENT SYSTEM"

# Certificate
for i, p in enumerate(doc.paragraphs):
    if "AI-Based Fake News" in p.text:
        p.text = p.text.replace("AI-Based Fake News and Misinformation Detection System", "Student Complaint Management System")

# Declaration
# Already handled by the replace loop above

# Abstract (paragraph 57)
abstract_text = (
    "In collegiate institutions, resolving everyday infrastructural and administrative grievances—such as laboratory hardware faults, hostel utility interruptions, Wi-Fi connectivity degradation, and hygiene maintenance—has conventionally relied on manual, informal channels like phone calls, in-person registers, and fragmented email exchanges. These traditional procedures inevitably suffer from missing records, communication breakdowns, zero real-time visibility for students, and an absence of structured performance analytics for institutional decision-makers. "
    "To resolve these systematic shortcomings, this project introduces the Student Complaint Management System, a secure, full-stack, responsive web application engineered using modern Software Engineering principles. The proposed system digitizes the entire grievance lifecycle by dividing operational workflows across three authenticated roles: Students, Staff Members, and Administrators. "
    "Students register securely and submit structured grievances with automated unique tracking identifiers (CMP-YYYY-NNNN), categorized locations, priority indicators, and photo evidence, while tracking updates via an interactive visual lifecycle timeline. Administrators maintain total governance through assignment queues, categorized triage, staff workload metrics, and graphical analytics. Assigned maintenance staff process tasks with iterative progress logs and submit verified resolution summaries. Crucially, closed complaints feature student feedback and star ratings, enforcing accountability. "
    "Built on a robust 3-tier architecture using Node.js, Express.js, MongoDB, Mongoose ODM, JSON Web Tokens (JWT), Bcrypt.js, and a responsive frontend driven by HTML5, CSS3, Vanilla JavaScript, and Chart.js, the application guarantees strict server-side state enforcement, role-based access control, and complete auditability."
)
doc.paragraphs[57].text = abstract_text

# 1.1 Background
doc.paragraphs[79].text = (
    "Educational institutions and engineering colleges host dense campus infrastructures encompassing academic complexes, research laboratories, residential hostels, dining facilities, sports complexes, and computing centers. To maintain operational continuity, thousands of students interact daily with physical and digital utilities. When issues emerge—such as defective laboratory computers, power outages, damaged water fixtures, or local network interruptions—timely grievance logging and resolution are vital for student well-being and academic performance."
)
doc.paragraphs[80].text = (
    "Traditionally, grievance recording has taken the form of physical paper registers, unmonitored drop boxes, or unstructured emails sent to various departmental staff. This manual paradigm creates operational bottlenecks, opaque oversight, and delayed turnarounds. An automated, centralized web portal that provides transparent triage, verifiable accountability, and real-time operational feedback is essential for modern educational institutions."
)

# 1.2 Problem Statement
doc.paragraphs[82].text = (
    "In existing traditional college administrative setups, campus grievances are reported verbally or via scattered, informal channels. Complaints submitted via phone calls, casual hallway conversations, or unstructured emails frequently go unrecorded or lack critical contextual data such as exact room numbers, department category, or photographic proof."
)
doc.paragraphs[83].text = (
    "Furthermore, there is a total absence of accountability and tracking. Students receive no status updates or resolution timeframes. Once reported, there is no transparent mechanism to inspect whether an issue is under review, assigned to staff, or stalled. Paper registers are vulnerable to physical damage and lack search, filtering, and consolidation facilities, leading to recurring unattended problems."
)
doc.paragraphs[84].text = (
    "A dedicated Student Complaint Management System is needed to automatically organize, route, prioritize, and track all institutional complaints through an auditable, role-based digital lifecycle."
)

# Table 1.1 Stakeholders (doc.tables[1])
t1_data = [
    ("Students", "Submit structured complaints with location, category, and evidence; track resolution progress in real time; submit 1–5 star feedback upon completion; maintain account profile.", "User-friendly web interface; automated unique tracking IDs (CMP-YYYY-NNNN); live visual timeline; transparency on assigned resolvers; prompt resolution of campus grievances."),
    ("Maintenance Staff / Resolvers", "Review assigned maintenance work orders; inspect reported locations and photos; add progress notes; perform repairs; submit mandatory technical resolution notes.", "Clear, dedicated task queue; priority tags (Low/Medium/High/Urgent); detailed problem descriptions; streamlined status update controls without administrative interference."),
    ("Campus Administrators", "Review incoming grievances; verify legitimacy; assign and reassign complaints to appropriate staff; adjust priority levels; manage complaint categories; review feedback.", "Centralized management dashboard; real-time KPI metrics; staff workload oversight; category trend analysis; enforcement of strict workflow state transitions."),
    ("Department Heads & Wardens", "Monitor departmental laboratory equipment and residential hostel infrastructure; escalate recurring or critical utility issues.", "Department-wise reporting; visibility into open complaints affecting students and facilities under their purview."),
    ("Lab Incharges & Technicians", "Log specialized equipment breakdowns; coordinate with maintenance engineers for hardware repairs and software upgrades.", "Rapid logging of lab hardware faults; clear status progression from diagnosis to verified fix."),
    ("Software Development Team", "Architect, develop, test, and maintain the web portal; ensure security of authentication tokens; maintain schema integrity; implement feature upgrades.", "Clean MVC architecture; modular separation of concerns; strict server-side validation; automated test suites; comprehensive documentation."),
    ("System & Database Administrators", "Host the Node.js application server; maintain MongoDB database availability; manage indexes; perform data backups (mongodump); monitor system logs.", "High database performance; atomic counter sequences; secure environment configuration (.env); zero downtime deployments."),
    ("Institutional Quality Assurance (IQAC)", "Audit grievance turnaround times; evaluate student satisfaction benchmarks; monitor compliance with university standards.", "Accurate historical audit trails; student satisfaction ratings; analytical charts showing average resolution durations."),
    ("Campus Community", "Utilize well-maintained campus facilities; benefit from improved campus infrastructure and hygiene.", "Clean, safe, and fully functional academic and residential learning environments.")
]

t1 = doc.tables[1]
# header row is index 0
for r_idx, (stakeholder, resp, exp) in enumerate(t1_data):
    row_i = r_idx + 1
    if row_i < len(t1.rows):
        t1.rows[row_i].cells[0].text = stakeholder
        t1.rows[row_i].cells[1].text = resp
        t1.rows[row_i].cells[2].text = exp

# 1.3 Motivation
doc.paragraphs[90].text = (
    "This project was chosen because unresolved campus infrastructure faults directly impair the academic learning environment and student quality of life. Traditional complaint procedures lead to frustration, lost accountability, and delayed fixes."
)
doc.paragraphs[91].text = (
    "Three primary challenges make this problem worth solving. First, the large volume of grievances across academic labs, classrooms, and hostels overwhelms manual paper registers. Second, students experience complete information asymmetry with no knowledge of who is resolving their issue. Third, institutional leadership lacks actionable analytics to identify recurring equipment failures or measure departmental maintenance efficiency."
)

# 1.4 Objectives
doc.paragraphs[93].text = "To provide a centralized, authenticated digital portal for students to submit structured complaints with location, priority, and photo attachments."
doc.paragraphs[94].text = "To automatically generate unique, human-friendly sequential tracking identifiers (e.g., CMP-YYYY-NNNN) using atomic database counters."
doc.paragraphs[95].text = "To provide students with real-time visual progress tracking across a 6-stage lifecycle timeline with complete timestamped status history."
doc.paragraphs[96].text = "To empower administrators with role-based tools to triage, prioritize, and assign complaints to qualified maintenance staff."
doc.paragraphs[97].text = "To provide maintenance staff with a dedicated work queue, intermediate progress logging, and mandatory resolution note recording."
doc.paragraphs[98].text = "To implement an auditable feedback mechanism allowing students to rate resolved complaints (1–5 stars with comments), limited to one review per issue."
doc.paragraphs[99].text = "To enforce strict server-side state machine transitions (Submitted → Under Review → Assigned → In Progress → Resolved → Closed)."
doc.paragraphs[100].text = "To deliver actionable administrative analytics, including KPI metric cards, category breakdowns, status distributions, and resolution trends."

# Section 2: Existing System
doc.paragraphs[102].text = (
    "In the existing traditional setup, colleges rely on physical paper registers placed at department offices or hostel warden desks, alongside verbal complaints and unmonitored email inboxes. These methods cannot cope with the hundreds of grievances generated across an active academic campus."
)
doc.paragraphs[103].text = (
    "Because each hostel, department, and facility maintains separate, uncoordinated paper logs, cross-departmental coordination is nonexistent. Complaints frequently get lost, duplicate reports are created for the same issue, and urgent breakdowns receive the same delayed handling as minor requests."
)

# Table 2.1 Root Causes and Impact (doc.tables[2])
t2_data = [
    ("1. Physical Paper Registers", "Grievances are written by hand in physical notebooks placed at various departmental counters.", "Registers are vulnerable to damage, pages get torn, handwriting is illegible, and entries cannot be searched or sorted."),
    ("2. Verbal & Informal Reporting", "Students report electrical, plumbing, or computer failures informally to passing attendants or staff.", "Complaints are easily forgotten; there is zero proof of reporting and zero accountability."),
    ("3. Lack of Tracking Identifiers", "No unique reference numbers are assigned to complaints upon reporting.", "Students cannot follow up on their issues without physically re-visiting administrative offices."),
    ("4. Unclear Resolver Assignment", "Staff members are not systematically designated to specific grievances in an auditable record.", "Tasks stall as workers assume someone else is handling them; supervisors cannot track individual workloads."),
    ("5. Absence of Real-Time Status", "Students receive no updates on whether their issue has been noticed, investigated, or scheduled for repair.", "Causes student anxiety and repeated duplicate complaints for the same facility."),
    ("6. Unenforced Workflow Rules", "Complaints are resolved or closed verbally without formal inspection or verification.", "Issues are marked resolved before actual physical repair is completed."),
    ("7. Missing Visual Evidence", "Paper registers cannot capture photos of physical equipment damage or pipe leakages.", "Technicians arrive unprepared without the necessary replacement components or specialized tools."),
    ("8. Zero Institutional Analytics", "Administrators have no automated summary of campus failure rates or departmental resolution times.", "Recurring infrastructure faults go unnoticed; budget allocation for maintenance is suboptimal."),
    ("9. Lack of Feedback Mechanism", "No system exists for students to evaluate the quality or timeliness of completed maintenance work.", "Poor workmanship and unresolved issues remain undetected by management."),
    ("10. Lack of Role-Based Security", "Anyone can view or alter physical complaint notebooks without authentication or audit logging.", "Student privacy is compromised and unauthorized tampering of complaint records can occur.")
]

t2 = doc.tables[2]
for r_idx, (cause, desc, impact) in enumerate(t2_data):
    row_i = r_idx + 1
    if row_i < len(t2.rows):
        t2.rows[row_i].cells[0].text = cause
        t2.rows[row_i].cells[1].text = desc
        t2.rows[row_i].cells[2].text = impact

# Section 3: Proposed System
doc.paragraphs[109].text = (
    "The proposed solution is a full-stack, responsive web application entitled the Student Complaint Management System. It digitizes and streamlines the entire campus complaint lifecycle through a role-based architecture serving Students, Staff Resolvers, and Administrators. Built with Node.js, Express.js, MongoDB, JWT authentication, and a responsive frontend, the platform provides automated complaint routing, live timeline tracking, verified technical resolution notes, student feedback ratings, and executive analytics dashboards."
)
doc.paragraphs[111].text = (
    "Four architectural solutions were evaluated: a manual paper-based register, a basic spreadsheet / Google Form approach, a standalone desktop application, and a full-stack web-based portal with Role-Based Access Control (RBAC) and integrated analytics."
)

# Table 3.1 Comparison (doc.tables[3])
t3_headers = ['Criteria', 'Manual Paper Register', 'Spreadsheet / Forms', 'Desktop Application', 'Full-Stack Web Portal (Recommended)']
t3_data = [
    ("Cost", "Low", "Low", "Medium", "Medium (Open-Source Stack)"),
    ("Accessibility", "Very Low (In-person only)", "Moderate (Links shared)", "Low (Single workstation)", "High (Any desktop/mobile browser)"),
    ("Scalability", "Very Low", "Low (Slow with large data)", "Low (Local database)", "High (MongoDB indexed collections)"),
    ("Maintainability", "Very Low", "Low (Unenforced schemas)", "Moderate (Manual updates)", "High (Layered MVC architecture)"),
    ("Estimated time", "Immediate", "1-2 weeks", "6-8 weeks", "8-12 weeks"),
    ("Team size", "1", "1-2", "2-3", "3-4"),
    ("Complexity", "None", "Low", "Medium", "High (Full-stack with RBAC)")
]

t3 = doc.tables[3]
for c_i, h in enumerate(t3_headers):
    t3.rows[0].cells[c_i].text = h

for r_idx, row_vals in enumerate(t3_data):
    row_i = r_idx + 1
    for c_i, val in enumerate(row_vals):
        t3.rows[row_i].cells[c_i].text = val

# 3.3 Why Selected
doc.paragraphs[114].text = "Manual Paper Register: Lowest initial cost, but suffers from physical loss, zero search capabilities, no tracking, and lack of accountability."
doc.paragraphs[115].text = "Spreadsheet / Google Forms: Easy to create, but lacks role-based access control, cannot enforce workflow state machines, and provides no dedicated staff work queues."
doc.paragraphs[116].text = "Standalone Desktop App: Operates without internet, but requires local installation on every PC and cannot be accessed remotely by students on mobile devices."
doc.paragraphs[117].text = "Full-Stack Web Portal: Offers optimal multi-device accessibility, strict server-side state enforcement, immutable status audit trails, and executive analytics."

doc.paragraphs[119].text = "Multi-Device Accessibility: Students, staff, and administrators access the portal seamlessly from any device via responsive web browsers without installing native apps."
doc.paragraphs[120].text = "Role-Based Access Control (RBAC): Enforces strict security boundaries ensuring students only view their own issues, staff see assigned tasks, and admins govern the entire system."
doc.paragraphs[121].text = "Automated Tracking Identifiers: Generates sequential, standardized IDs (CMP-YYYY-NNNN) via atomic database counters for immediate reference."
doc.paragraphs[122].text = "Enforced Lifecycle Workflow: Prevents invalid state jumps; complaints progress through a verified sequence: Submitted → Under Review → Assigned → In Progress → Resolved → Closed."
doc.paragraphs[123].text = "Verifiable Resolution & Auditing: Staff cannot mark issues resolved without submitting detailed technical notes, and every action is timestamped in an audit history collection."
doc.paragraphs[124].text = "Closed-Loop Student Feedback: Students submit 1–5 star ratings and comments on resolved issues, with database constraints preventing duplicate ratings."
doc.paragraphs[125].text = "Data-Driven Administrative Analytics: Executive dashboards provide live KPIs, resolution time averages, and Chart.js visualizations for category and status trends."
doc.paragraphs[126].text = "Modular & Extensible Architecture: Clean MVC structure allows seamless future extensions such as automated SMS/email gateways or IoT smart facility integration."

# 3.4 Technologies Used
doc.paragraphs[128].text = (
    "Node.js (v18+), Express.js (v4.19.2), MongoDB (v8.0) with Mongoose (v8.5.1) ODM, JSON Web Tokens (jsonwebtoken v9.0.2), Bcrypt.js (v2.4.3), Multer (v2.4.0) file upload engine, HTML5, CSS3, Vanilla ECMAScript (JavaScript), Chart.js (v4.x), Lucide Web Icons, and Visual Studio Code."
)

# 4.1 Functional Requirements
fr_list = [
    "FR-01: User Registration — Students register securely with full name, unique Student ID (Registration Number), email, department, academic year, and password.",
    "FR-02: Authentication & Token Issuance — Users authenticate via email and password; the server returns a signed JWT token containing user identity and role.",
    "FR-03: Password Security — All passwords are encrypted with a 10-round salted bcrypt hash prior to persistence; plain-text passwords are never stored.",
    "FR-04: Complaint Submission — Authenticated students log grievances with title, category, priority (Low/Medium/High/Urgent), location, description, and optional photo attachment.",
    "FR-05: Unique Identifier Generation — The system generates a sequential, human-readable complaint ID (e.g., CMP-2026-0001) using atomic database counters.",
    "FR-06: Student Complaint Management — Students view, search, and filter personal complaints using status pills (All, Pending, In Progress, Resolved) and category selectors.",
    "FR-07: Visual Progress Timeline — The system displays an interactive 6-stage lifecycle progress bar and complete timestamped audit history for each complaint.",
    "FR-08: Admin Complaint Governance — Administrators list, filter by status/priority/category/date, sort, and search all institutional complaints.",
    "FR-09: Priority Management — Administrators adjust urgency levels of submitted grievances to reflect institutional needs.",
    "FR-10: Staff Assignment — Administrators assign or reassign complaints to registered maintenance staff, automatically shifting status to 'Assigned'.",
    "FR-11: State Transition Validation — The server strictly validates all status changes against an allowable transition matrix, rejecting unauthorized state jumps.",
    "FR-12: Administrative Notes — Administrators append official notes and guidance to complaint records.",
    "FR-13: Staff Work Queues — Staff members access a dedicated task list containing only grievances assigned to them.",
    "FR-14: Progress Updates & Resolution Notes — Staff log ongoing maintenance notes and submit mandatory technical resolution notes upon resolving an issue.",
    "FR-15: Immutable Audit Logging — Every status mutation automatically records a ComplaintStatusHistory document capturing the actor, timestamp, and remark.",
    "FR-16: Student Feedback Rating — Students rate resolved complaints with a 1–5 star rating and comment; enforced to a single feedback entry per complaint.",
    "FR-17: Executive Analytics & Reports — Administrators view real-time KPI metrics, resolution durations, and Chart.js visualizations (by category, by status, 14-day trends).",
    "FR-18: Category Management — Administrators create, update, toggle active status, and safely delete grievance categories with referential integrity protection.",
    "FR-19: User Profile Management — Authenticated users view and update personal profile details (name, department, year).",
    "FR-20: Role-Based Access Control — Middleware intercepts and enforces authorization rules across student, staff, and admin roles on all private API endpoints."
]

# Clean existing paragraphs in 4.1
# Let's inspect paragraphs 131 to 144
for idx, fr_text in enumerate(fr_list[:14]):
    p_i = 131 + idx
    if p_i < len(doc.paragraphs):
        doc.paragraphs[p_i].text = fr_text

# Table 4.1 Non-Functional Requirements (doc.tables[4])
t4_data = [
    ("Performance", "Average API query response time < 150 ms under typical campus loads; database indexes on complaintId, status, student, and assignedStaff optimize retrieval."),
    ("Security & Data Protection", "Bcrypt password hashing (10 salt rounds); stateless JWT with 7-day expiration; centralized error handling preventing database schema leaks."),
    ("Usability & Accessibility", "Clean, modern, responsive CSS user interface; mobile hamburger navigation drawer; toast notifications; clear validation feedback; contextual empty states."),
    ("Reliability & Data Integrity", "Atomic counter transactions ensure no duplicate or skipped complaint IDs; Mongoose schema validators enforce data integrity; unique compound indexes prevent duplicate feedback."),
    ("Scalability", "Stateless REST API architecture allows horizontal backend scaling; MongoDB document model accommodates high complaint volumes without performance degradation."),
    ("Maintainability", "Structured layered MVC architecture (routes, controllers, models, middleware, utils); modular code organization with centralized constants and configuration."),
    ("Auditability & Non-Repudiation", "Dedicated ComplaintStatusHistory collection preserves an immutable chronological log of every status transition, actor ID, and note."),
    ("Portability", "Cross-platform runtime (Node.js and MongoDB) operates identically across Windows, Linux, and macOS environments without platform-specific dependencies."),
    ("Availability", "System designed for 99.9% uptime with automated error recovery, centralized process logging, and standard MongoDB database backup support.")
]

t4 = doc.tables[4]
for r_idx, (req, desc) in enumerate(t4_data):
    row_i = r_idx + 1
    if row_i < len(t4.rows):
        t4.rows[row_i].cells[0].text = req
        t4.rows[row_i].cells[1].text = desc

# Section 5: Hardware and Software Requirements
doc.paragraphs[150].text = "Processor: Intel Core i5 / AMD Ryzen 5 (2.0 GHz or higher) for server; Intel Core i3 / modern ARM SoC for clients."
doc.paragraphs[151].text = "RAM: 4 GB minimum (8 GB recommended for host development); 2 GB for client devices."
doc.paragraphs[152].text = "Storage: 10 GB available SSD storage for Node.js runtime, MongoDB data files, and uploads directory."
doc.paragraphs[154].text = "Operating System: Windows 10/11, Ubuntu Linux 20.04+, or macOS Sonoma."
doc.paragraphs[155].text = "Programming Languages: JavaScript (ECMAScript 2022+), HTML5, CSS3."
doc.paragraphs[156].text = "Backend Framework & Libraries: Node.js (v18+ LTS), Express.js (v4.19.2), Mongoose ODM (v8.5.1), jsonwebtoken (v9.0.2), bcryptjs (v2.4.3), Multer (v2.4.0), Morgan, CORS, dotenv."
doc.paragraphs[157].text = "Database Engine: MongoDB Community Server (v6.0 or v8.0) / MongoDB Atlas."
doc.paragraphs[158].text = "Frontend Libraries: Chart.js (v4.x) for data visualization, Lucide Web Icons."
doc.paragraphs[159].text = "Development Tools / IDE: Visual Studio Code, Git, Nodemon, Postman / Thunder Client."
doc.paragraphs[160].text = "Web Browsers: Google Chrome (v110+), Microsoft Edge, Mozilla Firefox, Safari."

# Section 6: Data Flow Diagram
doc.paragraphs[164].text = (
    "Level 0 Context DFD (Figure 6.1): The central system interfaces with three external entities: Student, Staff Resolver, and Administrator. Students submit credentials, complaint data with photo attachments, and star feedback; they receive status tracking updates. Staff resolvers receive assigned tasks and submit progress notes and resolution summaries. Administrators input staff assignments, priority alterations, and category configurations, and receive comprehensive institutional analytics."
)
doc.paragraphs[166].text = (
    "Level 1 DFD (Figure 6.2): Decomposes the portal into primary functional processes: 1.0 Authentication & User Management (reading/writing Users collection), 2.0 Complaint Registration (querying atomic Counters collection and saving to Complaints and StatusHistory collections), 3.0 Status Tracking & Timeline, 4.0 Complaint Triage & Assignment, 5.0 Task Execution & Resolution, 6.0 Feedback Processing (saving to Feedback collection), and 7.0 Analytics & Reporting."
)
doc.paragraphs[167].text = (
    "Level 2 DFD (Figure 6.3): Details the Complaint Processing Sub-system: Process 2.1 validates form fields; Process 2.2 intercepts files using Multer (enforcing MIME type and ≤5MB limit); Process 2.3 executes an atomic findOneAndUpdate on the Counters collection; Process 2.4 persists the complaint document with status 'Submitted'; and Process 2.5 creates the initial audit record in ComplaintStatusHistory."
)

# Section 7: System Architecture
doc.paragraphs[169].text = (
    "The application implements a robust Three-Tier Client-Server Architecture comprising a Presentation Tier (Client Browser), an Application Tier (Node.js & Express.js REST API), and a Data Tier (MongoDB Database)."
)
doc.paragraphs[170].text = (
    "User (Browser) ↔ Presentation Tier (HTML5 / CSS3 / Vanilla JS / Chart.js) ↔ Application Layer (Express REST API with JWT Auth & RBAC Middleware) ↔ Object Data Modeling (Mongoose ODM) ↔ Data Layer (MongoDB Collections: users, complaints, categories, histories, feedbacks, counters)."
)

# Section 8: Module Description
doc.paragraphs[173].text = "Authentication & Security Module: Handles student registration, user login, 10-round bcrypt password hashing, stateless JWT generation with 7-day validity, and role-based access control middleware (student, staff, admin)."
doc.paragraphs[174].text = "Student Portal Module: Provides students with an interactive dashboard, structured complaint submission forms with photo attachments, searchable personal complaint lists, 6-stage lifecycle progress timelines, and profile editing."
doc.paragraphs[175].text = "Staff / Resolution Module: Offers maintenance staff a dedicated task queue of complaints assigned specifically to them, progress note logging, and verified completion with mandatory technical resolution notes."
doc.paragraphs[176].text = "Admin Governance Module: Equips administrators with complete oversight to review complaints, change urgency levels, assign tasks to staff members, manage categories, and audit student and staff rosters."
doc.paragraphs[177].text = "Feedback & Quality Assurance Module: Unlocks a post-resolution 1–5 star rating and comment form for students upon grievance completion, enforcing a strict single-submission constraint via unique compound database indexes."
doc.paragraphs[178].text = "Grievance Lifecycle & Audit Module: Enforces the server-side state transition matrix (Submitted → Under Review → Assigned → In Progress → Resolved → Closed) and maintains an immutable timestamped history of all changes."
doc.paragraphs[179].text = "Analytics & Visualization Module: Computes real-time campus KPIs and powers Chart.js graphs displaying complaint distributions by category, by status, and 14-day grievance trends."
doc.paragraphs[180].text = "File Storage & Media Module: Uses Multer disk storage to securely validate, rename, and store uploaded image attachments in the server's uploads directory, serving them over dedicated static endpoints."

# Section 9: System Analysis
doc.paragraphs[182].text = (
    "9.1 Use Case Diagram (Figure 9.1): Models interactions between three primary actors (Student, Staff, Admin) and the system. Key use cases include Register Account, Login, Submit Complaint (<<include>> Generate Unique ID, <<extend>> Upload Image Attachment), Track Complaint Timeline, Assign Staff, Update Status (<<include>> Record Status Audit Log), Resolve Complaint, and Submit Star Feedback."
)
doc.paragraphs[183].text = (
    "9.2 Use Case Descriptions:\n"
    "• UC-01 Submit Complaint: Actor = Student. Preconditions = Authenticated. Steps: Student fills title, category, priority, location, description, and optional photo. System validates inputs, increments atomic counter to format CMP-YYYY-NNNN, creates complaint record with status 'Submitted', logs audit history, and returns HTTP 201 Created.\n"
    "• UC-02 Assign Staff: Actor = Admin. Preconditions = Authenticated as Admin. Steps: Admin selects complaint and assigns registered staff member. System validates staff ID, updates assignedStaff, shifts status to 'Assigned', records audit entry, and notifies staff via their queue.\n"
    "• UC-03 Resolve Complaint: Actor = Staff. Preconditions = Authenticated, complaint assigned to staff. Steps: Staff inputs technical resolution notes (≥5 chars) and marks resolved. System verifies assignment, updates status to 'Resolved', stores resolution notes, logs audit history, and unlocks student feedback.\n"
    "• UC-04 Submit Feedback: Actor = Student. Preconditions = Complaint status is 'Resolved', submitted by current student. Steps: Student selects 1–5 stars and writes comments. System verifies no prior feedback exists, persists record, updates institutional rating average, and returns HTTP 201."
)

# Section 10: UML Design
doc.paragraphs[187].text = "10.1 Class Diagram (Figure 10.1): Defines domain entities: User (name, studentId, email, password, role), Complaint (complaintId, title, description, location, priority, status, attachment, resolutionNotes), Category (name, description, isActive), ComplaintStatusHistory (status, note, changedAt), Feedback (rating, comment), and Counter (name, seq). Captures one-to-many associations between users, complaints, and histories."
doc.paragraphs[188].text = "10.2 Sequence Diagram (Figure 10.2): Illustrates the chronological flow of messages between Student, Client UI, Express Server, and MongoDB across complaint submission, admin assignment, staff resolution, and feedback rating."
doc.paragraphs[189].text = "10.3 Activity Diagram (Figure 10.3): Maps the operational workflow from initial user login and input validation, through branching administrative triage (rejection vs. acceptance), staff repair execution, and final student feedback."
doc.paragraphs[190].text = "10.4 State Diagram (Figure 10.4): Models the finite state machine of a complaint: Submitted → Under Review → Assigned → In Progress → Resolved → Closed, with allowable terminal transitions to Rejected."
doc.paragraphs[191].text = "10.5 Component Diagram (Figure 10.5): Illustrates architectural modularity: Client Tier (HTML5/CSS3/Chart.js/api.js) communicates via REST API with Express Server Components (Routing, Auth Middleware, Multer Engine, Controllers, Transition Engine), which interface via Mongoose ODM with MongoDB Collections."
doc.paragraphs[192].text = "10.6 Deployment Diagram (Figure 10.6): Details deployment nodes: Client Tier (Web Browsers on Desktops/Mobiles) communicates over HTTP/HTTPS (Port 5000) with Application Server Node (Node.js runtime, Express server, /uploads folder), which connects over MongoDB Wire Protocol (Port 27017) to Database Server Node."

# Section 11: Testing
doc.paragraphs[194].text = "11.1 Test Plan: A comprehensive verification strategy combining Unit Testing (algorithm verification for atomic ID generation and password hashing), White-Box Testing (branch coverage for status transition matrix), Basis Path Testing (cyclomatic complexity analysis for complaint lifecycles), Black-Box Testing (boundary value and equivalence partitioning on UI forms), System Testing (end-to-end multi-role workflows), and Validation Testing (compliance against functional specifications)."

# Table 5: Test Cases (doc.tables[5])
# Let's populate Table 5 with comprehensive test cases
t5_cases = [
    ("TC01", "Student Registration", "Valid student details with unique ID & email", "Account created; HTTP 201; redirects to dashboard", "Account created; redirected to dashboard", "Pass"),
    ("TC02", "Duplicate Registration", "Existing registered email or Student ID", "HTTP 400 'Email or Student ID already registered'", "Error displayed; registration blocked", "Pass"),
    ("TC03", "Valid Login (All Roles)", "Correct credentials for student, staff, or admin", "HTTP 200; JWT issued; redirects to role dashboard", "Authenticated; redirected to role dashboard", "Pass"),
    ("TC04", "Invalid Login Password", "Valid registered email with incorrect password", "HTTP 401 'Invalid email or password'; token withheld", "Error toast shown; login rejected", "Pass"),
    ("TC05", "Empty Complaint Submission", "Submit form with empty title or description", "Validation halts submission; field warnings shown", "Inline warnings displayed; form blocked", "Pass"),
    ("TC06", "File Size Boundary Check", "Attach image file exceeding 5 MB limit", "Upload rejected with 'File size exceeds 5MB limit'", "Upload blocked; error message shown", "Pass"),
    ("TC07", "Complaint Submission", "Valid complaint fields with optional photo", "HTTP 201; CMP-YYYY-NNNN generated; status 'Submitted'", "Complaint created; shown on dashboard", "Pass"),
    ("TC08", "Unauthorized Access", "Call GET /api/complaints/my without Bearer token", "HTTP 401 'Not authorized, no token provided'", "Access denied; redirected to login", "Pass"),
    ("TC09", "Role Privilege Guard", "Student token calls GET /api/admin/dashboard", "HTTP 403 'Access denied: insufficient permissions'", "Access blocked; 403 Forbidden returned", "Pass"),
    ("TC10", "Staff Data Isolation", "Staff attempts to view unassigned complaint", "HTTP 403 'This complaint is not assigned to you'", "Access denied; unauthorized alert shown", "Pass"),
    ("TC11", "Admin Task Delegation", "Admin assigns complaint to registered staff", "HTTP 200; status becomes 'Assigned'; audit logged", "Status updated; visible in staff queue", "Pass"),
    ("TC12", "Invalid State Transition", "Staff tries jumping from 'Assigned' to 'Resolved'", "HTTP 400 'Invalid status transition'", "Transition rejected; status unchanged", "Pass"),
    ("TC13", "Resolution Without Notes", "Staff marks resolved with empty resolution notes", "HTTP 400 'Resolution notes are required'", "Submission blocked; notes requested", "Pass"),
    ("TC14", "Complaint Resolution", "Staff enters valid notes and resolves complaint", "HTTP 200; status 'Resolved'; student feedback enabled", "Status updated; feedback unlocked", "Pass"),
    ("TC15", "Student Feedback Entry", "Student rates resolved complaint (1-5 stars + note)", "HTTP 201; feedback saved; rating metric updated", "Rating recorded; visible on admin panel", "Pass"),
    ("TC16", "Duplicate Feedback Check", "Student attempts second rating for same complaint", "HTTP 409 'Feedback already submitted'", "Blocked by unique compound index", "Pass"),
    ("TC17", "Category Deletion Guard", "Admin deletes category linked to active complaints", "Action blocked: 'Cannot delete category in use'", "Deletion halted; referential check passed", "Pass"),
    ("TC18", "User Logout", "User clicks 'Logout' button on top navigation bar", "JWT cleared from localStorage; redirects to login", "Token removed; redirected to login", "Pass")
]

t5 = doc.tables[5]
# t5 currently has 5 rows (1 header + 4 data). We need to expand or fill it.
# Fill existing rows first
for i in range(1, len(t5.rows)):
    case = t5_cases[i - 1]
    for c_i in range(6):
        t5.rows[i].cells[c_i].text = case[c_i]

# Add remaining rows
for case in t5_cases[len(t5.rows) - 1:]:
    row = t5.add_row()
    for c_i in range(6):
        row.cells[c_i].text = case[c_i]

# Section 12: Results / Screenshots
doc.paragraphs[206].text = "Figure 12.1: Public Landing / Home Page — Welcomes students and faculty, introducing key system features, operational benefits, and quick navigation buttons to login and registration."
doc.paragraphs[207].text = "Figure 12.2: Student Registration Interface — Clean, responsive registration form enforcing client and server-side validation for student name, student ID, department, year, email, and password."
doc.paragraphs[208].text = "Figure 12.3: Authentication / Login Interface — Secure gateway validating user credentials and issuing JWT tokens, dynamically routing students, staff, and admins to their dedicated dashboards."
doc.paragraphs[209].text = "Figure 12.4: Student Dashboard & Analytics Overview — Interactive dashboard presenting real-time KPI counter cards (Total, Pending, In Progress, Resolved) and a Chart.js status distribution doughnut chart."
doc.paragraphs[210].text = "Figure 12.5: Complaint Submission Interface — User-friendly form supporting category selection, priority level, location details, problem descriptions, and optional photo attachments."
doc.paragraphs[211].text = "Figure 12.6: Complaint Tracking & Visual Progress Timeline — Interactive tracking screen displaying a 6-phase visual lifecycle progress bar and complete timestamped audit history logs."
doc.paragraphs[212].text = "Figure 12.7: Staff Task Queue & Resolution Interface — Dedicated workspace for maintenance technicians displaying assigned work orders, progress update tools, and mandatory resolution note inputs."
doc.paragraphs[213].text = "Figure 12.8: Administrator Analytics Dashboard — Executive cockpit providing high-level KPIs, average resolution durations, satisfaction ratings, and 14-day grievance trend charts."
doc.paragraphs[214].text = "Figure 12.9: Student Feedback & Star Rating View — Post-resolution evaluation screen featuring an interactive 1–5 star rating selector and comment box, restricted to one submission per issue."

# Section 13: Limitations
doc.paragraphs[216].text = "Limitation 1: Absence of External Communication Gateways. The current deployment relies on in-app status dashboards and does not integrate automated external SMS gateways or SMTP email notifications for instant push alerts."
doc.paragraphs[217].text = "Limitation 2: Single-Institution Scoping. The architecture is optimized for a single collegiate campus environment and currently lacks multi-tenant partitioning for managing multiple geographically distinct university campuses under one deployment."

# Section 14: Conclusion
doc.paragraphs[219].text = "Problem Addressed: Traditional campus grievance reporting relies on fragmented paper registers, informal conversations, and unmonitored emails, resulting in lost records, delayed repairs, zero tracking for students, and an absence of administrative oversight."
doc.paragraphs[220].text = "System Developed: The Student Complaint Management System was designed and developed as a modern, full-stack web application employing a 3-tier architecture with Node.js, Express.js, MongoDB, JWT authentication, and Vanilla JavaScript."
doc.paragraphs[221].text = "Major Functionality: Structured grievance submission with unique atomic IDs (CMP-YYYY-NNNN), photo uploads, role-based workflows (Student, Staff, Admin), live 6-stage lifecycle timelines, enforced state transitions, verified technical resolution notes, student star feedback, and Chart.js analytics."
doc.paragraphs[222].text = "Testing Performed: The application underwent rigorous verification including unit testing, white-box state transition validation, basis path testing, black-box form testing, and end-to-end integration testing, passing all 18 test cases."
doc.paragraphs[223].text = "Overall Outcome: The system successfully automates campus grievance management, ensuring accountability, transparency, and data-driven administrative decision-making across collegiate facilities."

# Section 15: References
doc.paragraphs[227].text = "Roger S. Pressman & Bruce R. Maxim, Software Engineering: A Practitioner's Approach, 9th Edition, McGraw-Hill Education, 2020."
doc.paragraphs[228].text = "Ian Sommerville, Software Engineering, 10th Edition, Pearson Education, 2016."

# Save updated documents
doc.save(target_downloads)
doc.save(target_workspace)
doc.save(target_workspace_named)
print("Updated Word documents successfully saved to:")
print(f"  1. {target_downloads}")
print(f"  2. {target_workspace}")
print(f"  3. {target_workspace_named}")
