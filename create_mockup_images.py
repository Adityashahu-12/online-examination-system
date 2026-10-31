import os
import matplotlib.pyplot as plt
import matplotlib.patches as patches

output_dir = r"C:\Users\asus\.gemini\antigravity\scratch\online_examination_system"
os.makedirs(output_dir, exist_ok=True)

# -------------------------------------------------------------
# 1. ER DIAGRAM GENERATION
# -------------------------------------------------------------
def generate_er_diagram():
    fig, ax = plt.subplots(figsize=(11, 7.5), dpi=300)
    ax.set_xlim(0, 1100)
    ax.set_ylim(0, 750)
    ax.axis('off')

    # Background
    ax.add_patch(patches.Rectangle((0, 0), 1100, 750, facecolor='#FFFFFF'))

    # Title
    ax.text(550, 720, "Online Examination System – ER Diagram", 
            fontsize=16, fontweight='bold', ha='center', va='center', color='#1E293B', fontfamily='sans-serif')

    def draw_entity(x, y, w, h, title, title_bg, attributes):
        hdr_h = 28
        ax.add_patch(patches.Rectangle((x, y + h - hdr_h), w, hdr_h, facecolor=title_bg, edgecolor='#64748B', linewidth=1.2, zorder=3))
        ax.text(x + w/2, y + h - hdr_h/2, title, fontsize=10, fontweight='bold', ha='center', va='center', color='#FFFFFF', zorder=4)
        
        ax.add_patch(patches.Rectangle((x, y), w, h - hdr_h, facecolor='#F8FAFC', edgecolor='#64748B', linewidth=1.2, zorder=3))
        
        row_h = (h - hdr_h) / len(attributes)
        for i, (col, key, typ) in enumerate(attributes):
            row_y = y + h - hdr_h - (i + 0.5) * row_h
            if i > 0:
                ax.plot([x, x + w], [y + h - hdr_h - i * row_h, y + h - hdr_h - i * row_h], color='#E2E8F0', lw=0.8, zorder=3)
            ax.text(x + 8, row_y, col, fontsize=8, fontweight='bold' if key in ['PK', 'UK'] else 'normal',
                    va='center', color='#0F172A', zorder=4)
            if key:
                key_color = '#DC2626' if 'PK' in key else ('#2563EB' if 'FK' in key else '#D97706')
                ax.text(x + w - 75, row_y, key, fontsize=7.5, fontweight='bold', va='center', color=key_color, zorder=4)
            ax.text(x + w - 10, row_y, typ, fontsize=7.5, va='center', ha='right', color='#64748B', zorder=4)

    def draw_diamond(cx, cy, w, h, text):
        poly = patches.Polygon([[cx, cy + h/2], [cx + w/2, cy], [cx, cy - h/2], [cx - w/2, cy]],
                               closed=True, facecolor='#FEF9C3', edgecolor='#EAB308', linewidth=1.2, zorder=3)
        ax.add_patch(poly)
        ax.text(cx, cy, text, fontsize=8, fontweight='bold', ha='center', va='center', color='#854D0E', zorder=4)

    # 1. USERS
    user_attrs = [
        ('user_id', 'PK', 'integer'),
        ('full_name', '', 'varchar'),
        ('email', 'UK', 'varchar'),
        ('password_hash', '', 'varchar'),
        ('role', '', 'varchar'),
        ('created_at', '', 'timestamp')
    ]
    draw_entity(40, 480, 180, 160, "USERS", "#2563EB", user_attrs)

    # 2. DEPARTMENTS
    dept_attrs = [
        ('department_id', 'PK', 'integer'),
        ('department_name', 'UK', 'varchar'),
        ('contact_person', '', 'varchar'),
        ('email', 'UK', 'varchar'),
        ('phone', '', 'varchar'),
        ('address', '', 'text'),
        ('created_at', '', 'timestamp')
    ]
    draw_entity(300, 480, 190, 175, "DEPARTMENTS", "#D97706", dept_attrs)

    # 3. SUBJECTS
    subj_attrs = [
        ('subject_id', 'PK', 'integer'),
        ('subject_name', 'UK', 'varchar'),
        ('description', '', 'text')
    ]
    draw_entity(580, 520, 180, 120, "SUBJECTS", "#059669", subj_attrs)

    # 4. EXAM_CENTERS
    center_attrs = [
        ('center_id', 'PK', 'integer'),
        ('center_name', 'UK', 'varchar'),
        ('center_type', '', 'varchar'),
        ('description', '', 'text'),
        ('active_status', '', 'boolean')
    ]
    draw_entity(850, 490, 190, 150, "EXAM_CENTERS", "#7C3AED", center_attrs)

    # 5. EXAMS
    exam_attrs = [
        ('exam_id', 'PK', 'integer'),
        ('title', '', 'varchar'),
        ('description', '', 'text'),
        ('department_id', 'FK', 'integer'),
        ('subject_id', 'FK', 'integer'),
        ('duration_minutes', '', 'integer'),
        ('created_by', 'FK', 'integer'),
        ('created_at', '', 'timestamp')
    ]
    draw_entity(320, 160, 210, 195, "EXAMS", "#DB2777", exam_attrs)

    # 6. SCHEDULES
    sched_attrs = [
        ('schedule_id', 'PK', 'integer'),
        ('exam_id', 'FK', 'integer'),
        ('center_id', 'FK', 'integer'),
        ('exam_date', '', 'date'),
        ('start_time', '', 'time'),
        ('end_time', '', 'time'),
        ('status', '', 'varchar'),
        ('created_at', '', 'timestamp')
    ]
    draw_entity(820, 160, 210, 195, "SCHEDULES", "#0891B2", sched_attrs)

    # Diamonds and lines
    draw_diamond(130, 390, 70, 36, "creates")
    ax.plot([130, 130, 320], [480, 390, 300], color='#475569', lw=1.5, zorder=2)
    ax.text(140, 460, "1", fontsize=9, fontweight='bold', color='#1E293B')
    ax.text(300, 310, "N", fontsize=9, fontweight='bold', color='#1E293B')

    draw_diamond(395, 410, 80, 36, "registers")
    ax.plot([395, 395], [480, 355], color='#475569', lw=1.5, zorder=2)
    ax.text(405, 460, "1", fontsize=9, fontweight='bold', color='#1E293B')
    ax.text(405, 365, "N", fontsize=9, fontweight='bold', color='#1E293B')

    draw_diamond(670, 430, 84, 36, "categorizes")
    ax.plot([670, 670, 530], [520, 430, 300], color='#475569', lw=1.5, zorder=2)
    ax.text(680, 500, "1", fontsize=9, fontweight='bold', color='#1E293B')
    ax.text(545, 310, "N", fontsize=9, fontweight='bold', color='#1E293B')

    draw_diamond(675, 255, 60, 36, "has")
    ax.plot([530, 820], [255, 255], color='#475569', lw=1.5, zorder=2)
    ax.text(545, 265, "1", fontsize=9, fontweight='bold', color='#1E293B')
    ax.text(805, 265, "N", fontsize=9, fontweight='bold', color='#1E293B')

    draw_diamond(945, 410, 70, 36, "hosts")
    ax.plot([945, 945], [490, 355], color='#475569', lw=1.5, zorder=2)
    ax.text(955, 470, "1", fontsize=9, fontweight='bold', color='#1E293B')
    ax.text(955, 365, "N", fontsize=9, fontweight='bold', color='#1E293B')

    plt.tight_layout()
    img_path = os.path.join(output_dir, "figure_6_1_er_diagram.png")
    plt.savefig(img_path, dpi=300, bbox_inches='tight')
    plt.close()
    print("Saved ER Diagram:", img_path)

# -------------------------------------------------------------
# 2. FRONTEND LANDING PAGE SCREENSHOT
# -------------------------------------------------------------
def generate_landing_screenshot():
    fig, ax = plt.subplots(figsize=(10, 7.5), dpi=300)
    ax.set_xlim(0, 1000)
    ax.set_ylim(0, 750)
    ax.axis('off')

    # Browser Frame
    ax.add_patch(patches.Rectangle((0, 0), 1000, 750, facecolor='#F1F5F9', edgecolor='#94A3B8', linewidth=1.5))
    ax.add_patch(patches.Rectangle((0, 710), 1000, 40, facecolor='#E2E8F0'))
    for i, c in enumerate(['#EF4444', '#F59E0B', '#10B981']):
        ax.add_patch(patches.Circle((20 + i*18, 730), 5.5, facecolor=c))
    ax.add_patch(patches.Rectangle((100, 717), 550, 26, facecolor='#FFFFFF', edgecolor='#CBD5E1'))
    ax.text(120, 730, "http://localhost:5000/ - ExamHub | Online Examination System", fontsize=8, va='center', color='#475569')

    # Navbar
    ax.add_patch(patches.Rectangle((0, 660), 1000, 50, facecolor='#FFFFFF', edgecolor='#E2E8F0', linewidth=1))
    ax.add_patch(patches.Rectangle((40, 672), 26, 26, facecolor='#1E40AF'))
    ax.text(53, 685, "EH", fontsize=10, fontweight='bold', color='#FFFFFF', ha='center', va='center')
    ax.text(75, 685, "ExamHub", fontsize=14, fontweight='bold', color='#0F172A', va='center')
    ax.text(150, 683, "Online Examination Management", fontsize=7.5, color='#64748B', va='center')

    ax.text(680, 685, "Home", fontsize=9.5, fontweight='bold', color='#1E40AF', va='center')
    ax.text(750, 685, "Available Exams", fontsize=9.5, color='#475569', va='center')
    ax.add_patch(patches.Rectangle((880, 672), 70, 26, facecolor='#1E40AF'))
    ax.text(915, 685, "Login", fontsize=9, fontweight='bold', color='#FFFFFF', ha='center', va='center')

    # Hero Banner
    ax.add_patch(patches.Rectangle((30, 390), 940, 250, facecolor='#0F172A'))
    ax.text(60, 595, "ONLINE EXAMINATION MANAGEMENT SYSTEM", fontsize=8.5, fontweight='bold', color='#38BDF8')
    ax.text(60, 555, "Manage Your Examination Schedule\nwith Absolute Precision", fontsize=18, fontweight='bold', color='#FFFFFF')
    hero_desc = ("ExamHub provides academic departments, examination controllers, and faculty members\n"
                 "with an automated platform to register exams, publish schedules, and prevent hall conflicts\n"
                 "using PostgreSQL exclusion constraints — with end-to-end administrative oversight.")
    ax.text(60, 485, hero_desc, fontsize=8.5, color='#94A3B8')

    # CTA Buttons
    ax.add_patch(patches.Rectangle((60, 425), 130, 32, facecolor='#2563EB'))
    ax.text(125, 441, "Schedule an Exam", fontsize=8.5, fontweight='bold', color='#FFFFFF', ha='center', va='center')
    ax.add_patch(patches.Rectangle((205, 425), 140, 32, facecolor='none', edgecolor='#64748B', linewidth=1))
    ax.text(275, 441, "Register Department", fontsize=8.5, fontweight='bold', color='#FFFFFF', ha='center', va='center')

    # How it works card
    ax.add_patch(patches.Rectangle((620, 415), 320, 200, facecolor='#1E293B', edgecolor='#334155', linewidth=1))
    ax.text(640, 585, "How It Works", fontsize=11, fontweight='bold', color='#FFFFFF')
    steps = [
        "1. Department registers academic profile & coordinators.",
        "2. Faculty lists exam with subject, duration & format.",
        "3. Admin validates schedules & checks center conflicts.",
        "4. Approved exams appear on live public notice board."
    ]
    for idx, s in enumerate(steps):
        ax.text(640, 550 - idx*34, s, fontsize=7.5, color='#CBD5E1')

    # Stats Bar
    stat_boxes = [("24", "Registered Users"), ("18", "Approved Exams"), ("12", "Active Exam Centers")]
    for idx, (num, label) in enumerate(stat_boxes):
        bx = 60 + idx * 130
        ax.text(bx, 365, num, fontsize=16, fontweight='bold', color='#1E40AF')
        ax.text(bx, 345, label, fontsize=7.5, color='#64748B')

    # Feature Grid
    ax.text(500, 310, "Everything you need to run a flawless examination system", fontsize=13, fontweight='bold', ha='center', color='#0F172A')
    ax.text(500, 290, "Robust ACID-compliant PostgreSQL database paired with responsive Flask web interface", fontsize=8.5, ha='center', color='#64748B')

    features = [
        ("Exam Listings", "Submit comprehensive exam metadata, subject, branch, duration, and question paper details."),
        ("Schedule Conflict Check", "PostgreSQL btree_gist exclusion constraints prevent two exams in the same hall simultaneously."),
        ("Approval Workflow", "Examination Controller reviews submissions with audit trails before publishing schedules."),
        ("Public Live Schedule", "Searchable, filterable real-time timetable for students, invigilators, and faculty."),
        ("Faculty Dashboard", "Track draft, pending, approved, and completed exams with live analytics."),
        ("Secure Admin Portal", "Role-based access control protecting administrative routes and parameterized queries.")
    ]
    for i, (f_title, f_desc) in enumerate(features):
        row = i // 3
        col = i % 3
        cx = 40 + col * 315
        cy = 160 - row * 115
        ax.add_patch(patches.Rectangle((cx, cy), 295, 95, facecolor='#FFFFFF', edgecolor='#E2E8F0', linewidth=1))
        ax.text(cx + 15, cy + 72, f_title, fontsize=9.5, fontweight='bold', color='#1E293B')
        ax.text(cx + 15, cy + 42, f_desc, fontsize=7.5, color='#64748B')

    plt.tight_layout()
    img_path = os.path.join(output_dir, "figure_9_1_landing.png")
    plt.savefig(img_path, dpi=300, bbox_inches='tight')
    plt.close()
    print("Saved Landing Screenshot:", img_path)

# -------------------------------------------------------------
# 3. PUBLIC SCHEDULE & DASHBOARD SCREENSHOT
# -------------------------------------------------------------
def generate_schedule_dashboard_screenshot():
    fig, ax = plt.subplots(figsize=(10, 8.5), dpi=300)
    ax.set_xlim(0, 1000)
    ax.set_ylim(0, 850)
    ax.axis('off')

    # Browser Frame
    ax.add_patch(patches.Rectangle((0, 0), 1000, 850, facecolor='#F8FAFC', edgecolor='#94A3B8', linewidth=1.5))
    ax.add_patch(patches.Rectangle((0, 810), 1000, 40, facecolor='#E2E8F0'))
    for i, c in enumerate(['#EF4444', '#F59E0B', '#10B981']):
        ax.add_patch(patches.Circle((20 + i*18, 830), 5.5, facecolor=c))
    ax.add_patch(patches.Rectangle((100, 817), 550, 26, facecolor='#FFFFFF', edgecolor='#CBD5E1'))
    ax.text(120, 830, "http://localhost:5000/schedules - ExamHub | Active Examination Schedule", fontsize=8, va='center', color='#475569')

    # Top Navbar
    ax.add_patch(patches.Rectangle((0, 760), 1000, 50, facecolor='#FFFFFF', edgecolor='#E2E8F0', linewidth=1))
    ax.add_patch(patches.Rectangle((40, 772), 26, 26, facecolor='#1E40AF'))
    ax.text(53, 785, "EH", fontsize=10, fontweight='bold', color='#FFFFFF', ha='center', va='center')
    ax.text(75, 785, "ExamHub", fontsize=14, fontweight='bold', color='#0F172A', va='center')
    ax.text(560, 785, "Dashboard", fontsize=9, color='#475569', va='center')
    ax.text(650, 785, "My Exams", fontsize=9, color='#475569', va='center')
    ax.text(730, 785, "Available Exams", fontsize=9, fontweight='bold', color='#1E40AF', va='center')
    ax.add_patch(patches.Rectangle((840, 772), 120, 26, facecolor='#F1F5F9', edgecolor='#CBD5E1'))
    ax.text(900, 785, "Aryan Kajne (Admin)", fontsize=7.5, color='#334155', ha='center', va='center')

    # Filter Bar Card
    ax.add_patch(patches.Rectangle((40, 640), 920, 100, facecolor='#FFFFFF', edgecolor='#E2E8F0'))
    ax.text(60, 715, "Public Examination Timetable", fontsize=12, fontweight='bold', color='#0F172A')
    ax.text(60, 698, "Browse verified upcoming exams across all departments and testing centers.", fontsize=7.5, color='#64748B')

    inputs = [
        ("Search by title", "e.g. DBMS Mid-Sem", 60, 180),
        ("Subject", "All Subjects ▼", 260, 150),
        ("Center / Hall", "All Centers ▼", 430, 150),
        ("Exam Date", "2026-10-20", 600, 140),
        ("Sort by", "Schedule (Earliest) ▼", 760, 180)
    ]
    for lbl, val, ix, iw in inputs:
        ax.text(ix, 680, lbl, fontsize=7.5, fontweight='bold', color='#475569')
        ax.add_patch(patches.Rectangle((ix, 652), iw, 24, facecolor='#F8FAFC', edgecolor='#CBD5E1'))
        ax.text(ix + 6, 664, val, fontsize=7, color='#64748B', va='center')

    # Public Schedule Table
    th_y = 605
    ax.add_patch(patches.Rectangle((40, th_y), 920, 24, facecolor='#F1F5F9'))
    headers = [("EXAM TITLE", 50), ("DEPARTMENT", 260), ("CENTER / HALL", 430), ("SUBJECT", 600), ("DATE", 720), ("TIME SLOT", 810), ("STATUS", 900)]
    for h, hx in headers:
        ax.text(hx, th_y + 12, h, fontsize=7, fontweight='bold', color='#475569', va='center')

    rows = [
        ("DBMS Mid-Semester Examination", "Dept of Information Tech", "Turing Lab 101", "Database Systems", "2026-10-20", "09:00 - 10:30", "Scheduled"),
        ("Data Structures Practical Exam", "Dept of Computer Science", "Babbage Lab 202", "Data Structures", "2026-10-20", "11:00 - 12:30", "Scheduled"),
        ("Operating Systems Term Test", "Dept of Information Tech", "Virtual Hall Alpha", "Operating Systems", "2026-10-20", "14:00 - 15:30", "Scheduled"),
        ("Computer Networks Final Viva", "Dept of Electronics & TC", "Aryabhata Lab 104", "Computer Networks", "2026-10-20", "16:00 - 17:00", "Scheduled")
    ]
    for idx, (etitle, dept, center, subj, edate, tslot, status) in enumerate(rows):
        ry = th_y - 28 * (idx + 1)
        ax.add_patch(patches.Rectangle((40, ry), 920, 28, facecolor='#FFFFFF' if idx%2==0 else '#F8FAFC', edgecolor='#E2E8F0', lw=0.5))
        ax.text(50, ry + 14, etitle, fontsize=7.2, fontweight='bold', color='#1E293B', va='center')
        ax.text(260, ry + 14, dept, fontsize=7, color='#475569', va='center')
        ax.text(430, ry + 14, center, fontsize=7, color='#475569', va='center')
        ax.text(600, ry + 14, subj, fontsize=7, color='#475569', va='center')
        ax.text(720, ry + 14, edate, fontsize=7, color='#475569', va='center')
        ax.text(810, ry + 14, tslot, fontsize=7, color='#475569', va='center')
        ax.add_patch(patches.Rectangle((895, ry + 6), 55, 16, facecolor='#DCFCE7'))
        ax.text(922, ry + 14, status, fontsize=6.5, fontweight='bold', color='#15803D', ha='center', va='center')

    ax.plot([40, 960], [455, 455], color='#CBD5E1', lw=1, linestyle='--')

    # Dashboard Section
    ax.text(50, 425, "Faculty & Administration Dashboard", fontsize=13, fontweight='bold', color='#0F172A')
    ax.text(50, 408, "Welcome back, Aryan Kajne | Role: Examination Administrator (Exam Cell)", fontsize=8, color='#64748B')

    kpis = [("TOTAL EXAMS", "25", "Submitted across college", "#2563EB"),
            ("APPROVED", "23", "Published to live timetable", "#16A34A"),
            ("PENDING", "1", "Awaiting room verification", "#D97706"),
            ("CANCELLED", "1", "Schedule conflict / cancelled", "#DC2626")]
    for idx, (k_title, k_val, k_sub, k_color) in enumerate(kpis):
        kx = 50 + idx * 230
        ax.add_patch(patches.Rectangle((kx, 305), 215, 85, facecolor='#FFFFFF', edgecolor='#E2E8F0'))
        ax.text(kx + 15, 365, k_title, fontsize=7.5, fontweight='bold', color='#64748B')
        ax.text(kx + 15, 338, k_val, fontsize=20, fontweight='bold', color=k_color)
        ax.text(kx + 15, 318, k_sub, fontsize=6.8, color='#94A3B8')

    # Left: Upcoming Approved
    ax.add_patch(patches.Rectangle((50, 60), 430, 225, facecolor='#FFFFFF', edgecolor='#E2E8F0'))
    ax.text(65, 260, "Upcoming Approved Exams", fontsize=9.5, fontweight='bold', color='#0F172A')
    ax.add_patch(patches.Rectangle((60, 225), 410, 20, facecolor='#F1F5F9'))
    ax.text(70, 235, "EXAM", fontsize=7, fontweight='bold', color='#475569', va='center')
    ax.text(220, 235, "CENTER", fontsize=7, fontweight='bold', color='#475569', va='center')
    ax.text(330, 235, "DATE & TIME", fontsize=7, fontweight='bold', color='#475569', va='center')
    up_data = [
        ("DBMS Mid-Sem", "Turing Lab 101", "20-10-2026, 09:00"),
        ("DSA Practical", "Babbage Lab 202", "20-10-2026, 11:00"),
        ("OS Theory Test", "Virtual Hall Alpha", "20-10-2026, 14:00"),
        ("Cyber Security Quiz", "Aryabhata Lab", "21-10-2026, 10:00"),
        ("AI Mid-Term", "Shannon Lab 301", "21-10-2026, 14:30")
    ]
    for i, (ex, cn, dt) in enumerate(up_data):
        ax.text(70, 208 - i*25, ex, fontsize=7, color='#1E293B')
        ax.text(220, 208 - i*25, cn, fontsize=6.8, color='#64748B')
        ax.text(330, 208 - i*25, dt, fontsize=6.8, color='#2563EB')

    # Right: Recent Submissions
    ax.add_patch(patches.Rectangle((520, 60), 440, 225, facecolor='#FFFFFF', edgecolor='#E2E8F0'))
    ax.text(535, 260, "Recent Department Submissions", fontsize=9.5, fontweight='bold', color='#0F172A')
    ax.add_patch(patches.Rectangle((530, 225), 420, 20, facecolor='#F1F5F9'))
    ax.text(540, 235, "EXAM TITLE", fontsize=7, fontweight='bold', color='#475569', va='center')
    ax.text(720, 235, "SUBMITTED ON", fontsize=7, fontweight='bold', color='#475569', va='center')
    ax.text(850, 235, "STATUS", fontsize=7, fontweight='bold', color='#475569', va='center')
    sub_data = [
        ("DBMS Mid-Sem", "20-10-2026", "Approved", "#16A34A", "#DCFCE7"),
        ("DSA Practical", "20-10-2026", "Approved", "#16A34A", "#DCFCE7"),
        ("Discrete Math Test", "21-10-2026", "Pending", "#D97706", "#FEF3C7"),
        ("Compiler Design Quiz", "22-10-2026", "Approved", "#16A34A", "#DCFCE7"),
        ("IoT Practical Viva", "22-10-2026", "Approved", "#16A34A", "#DCFCE7")
    ]
    for i, (ex, dt, st, tc, bg) in enumerate(sub_data):
        ax.text(540, 208 - i*25, ex, fontsize=7, color='#1E293B')
        ax.text(720, 208 - i*25, dt, fontsize=6.8, color='#64748B')
        ax.add_patch(patches.Rectangle((845, 200 - i*25), 50, 16, facecolor=bg))
        ax.text(870, 208 - i*25, st, fontsize=6.5, fontweight='bold', color=tc, ha='center', va='center')

    plt.tight_layout()
    img_path = os.path.join(output_dir, "figure_9_2_schedule_dashboard.png")
    plt.savefig(img_path, dpi=300, bbox_inches='tight')
    plt.close()
    print("Saved Schedule & Dashboard Screenshot:", img_path)

# -------------------------------------------------------------
# 4. CREATE EXAM FORM SCREENSHOT
# -------------------------------------------------------------
def generate_create_exam_screenshot():
    fig, ax = plt.subplots(figsize=(10, 7.5), dpi=300)
    ax.set_xlim(0, 1000)
    ax.set_ylim(0, 750)
    ax.axis('off')

    # Browser Frame
    ax.add_patch(patches.Rectangle((0, 0), 1000, 750, facecolor='#F8FAFC', edgecolor='#94A3B8', linewidth=1.5))
    ax.add_patch(patches.Rectangle((0, 710), 1000, 40, facecolor='#E2E8F0'))
    for i, c in enumerate(['#EF4444', '#F59E0B', '#10B981']):
        ax.add_patch(patches.Circle((20 + i*18, 730), 5.5, facecolor=c))
    ax.add_patch(patches.Rectangle((100, 717), 550, 26, facecolor='#FFFFFF', edgecolor='#CBD5E1'))
    ax.text(120, 730, "http://localhost:5000/exams/create - ExamHub | Schedule New Exam", fontsize=8, va='center', color='#475569')

    # Top Navbar
    ax.add_patch(patches.Rectangle((0, 660), 1000, 50, facecolor='#FFFFFF', edgecolor='#E2E8F0', linewidth=1))
    ax.add_patch(patches.Rectangle((40, 672), 26, 26, facecolor='#1E40AF'))
    ax.text(53, 685, "EH", fontsize=10, fontweight='bold', color='#FFFFFF', ha='center', va='center')
    ax.text(75, 685, "ExamHub", fontsize=14, fontweight='bold', color='#0F172A', va='center')
    ax.text(580, 685, "Dashboard", fontsize=9, color='#475569', va='center')
    ax.text(670, 685, "My Exams", fontsize=9, color='#475569', va='center')
    ax.text(755, 685, "Schedule Exam", fontsize=9, fontweight='bold', color='#1E40AF', va='center')
    ax.text(880, 685, "Logout", fontsize=9, color='#EF4444', va='center')

    # Form Container
    ax.add_patch(patches.Rectangle((160, 40), 680, 600, facecolor='#FFFFFF', edgecolor='#CBD5E1', linewidth=1.2))
    ax.text(200, 605, "Schedule a New Examination", fontsize=15, fontweight='bold', color='#0F172A')
    ax.text(200, 585, "All submissions are validated against PostgreSQL exclusion constraints for conflict prevention.", fontsize=8, color='#64748B')
    ax.plot([200, 800], [570, 570], color='#E2E8F0', lw=1)

    # Form Fields
    ax.text(200, 550, "Examination Title *", fontsize=8, fontweight='bold', color='#334155')
    ax.add_patch(patches.Rectangle((200, 520), 600, 26, facecolor='#FFFFFF', edgecolor='#94A3B8'))
    ax.text(210, 533, "e.g. Database Management Systems Mid-Semester Theory Examination", fontsize=7.5, color='#1E293B', va='center')

    ax.text(200, 500, "Examination Instructions & Syllabus Covered *", fontsize=8, fontweight='bold', color='#334155')
    ax.add_patch(patches.Rectangle((200, 440), 600, 52, facecolor='#FFFFFF', edgecolor='#CBD5E1'))
    desc_txt = "Comprehensive theoretical and practical exam covering Relational Algebra, SQL, Normalization,\nand Transaction Management with ACID compliance."
    ax.text(210, 468, desc_txt, fontsize=7.5, color='#475569')

    ax.text(200, 415, "Academic Department *", fontsize=8, fontweight='bold', color='#334155')
    ax.add_patch(patches.Rectangle((200, 385), 290, 26, facecolor='#F8FAFC', edgecolor='#CBD5E1'))
    ax.text(210, 398, "Department of Information Technology ▼", fontsize=7.5, color='#1E293B', va='center')

    ax.text(510, 415, "Subject / Discipline *", fontsize=8, fontweight='bold', color='#334155')
    ax.add_patch(patches.Rectangle((510, 385), 290, 26, facecolor='#F8FAFC', edgecolor='#CBD5E1'))
    ax.text(520, 398, "Database Management Systems (24IT501T) ▼", fontsize=7.5, color='#1E293B', va='center')

    ax.text(200, 355, "Examination Center / Computer Lab *", fontsize=8, fontweight='bold', color='#334155')
    ax.add_patch(patches.Rectangle((200, 325), 290, 26, facecolor='#F8FAFC', edgecolor='#CBD5E1'))
    ax.text(210, 338, "Turing Computer Center Lab 101 ▼", fontsize=7.5, color='#1E293B', va='center')

    ax.text(510, 355, "Duration (Minutes) *", fontsize=8, fontweight='bold', color='#334155')
    ax.add_patch(patches.Rectangle((510, 325), 290, 26, facecolor='#FFFFFF', edgecolor='#CBD5E1'))
    ax.text(520, 338, "90", fontsize=7.5, color='#1E293B', va='center')

    ax.text(200, 295, "Scheduled Date *", fontsize=8, fontweight='bold', color='#334155')
    ax.add_patch(patches.Rectangle((200, 265), 180, 26, facecolor='#FFFFFF', edgecolor='#CBD5E1'))
    ax.text(210, 278, "2026-10-20", fontsize=7.5, color='#1E293B', va='center')

    ax.text(410, 295, "Start Time *", fontsize=8, fontweight='bold', color='#334155')
    ax.add_patch(patches.Rectangle((410, 265), 180, 26, facecolor='#FFFFFF', edgecolor='#CBD5E1'))
    ax.text(420, 278, "09:00:00", fontsize=7.5, color='#1E293B', va='center')

    ax.text(620, 295, "End Time *", fontsize=8, fontweight='bold', color='#334155')
    ax.add_patch(patches.Rectangle((620, 265), 180, 26, facecolor='#FFFFFF', edgecolor='#CBD5E1'))
    ax.text(630, 278, "10:30:00", fontsize=7.5, color='#1E293B', va='center')

    # Conflict Prevention Notice
    ax.add_patch(patches.Rectangle((200, 185), 600, 55, facecolor='#EFF6FF', edgecolor='#BFDBFE'))
    ax.text(215, 222, "PostgreSQL Conflict Prevention Active:", fontsize=7.5, fontweight='bold', color='#1D4ED8')
    notice_msg = "The system automatically validates that Turing Lab 101 has no conflicting scheduled examination\nbetween 09:00 and 10:30 on 2026-10-20 via btree_gist GiST index."
    ax.text(215, 200, notice_msg, fontsize=7, color='#1E40AF')

    # Submit Button
    ax.add_patch(patches.Rectangle((200, 110), 220, 36, facecolor='#1E40AF'))
    ax.text(310, 128, "Submit Examination Schedule", fontsize=8.5, fontweight='bold', color='#FFFFFF', ha='center', va='center')

    ax.add_patch(patches.Rectangle((440, 110), 100, 36, facecolor='#F1F5F9', edgecolor='#CBD5E1'))
    ax.text(490, 128, "Cancel", fontsize=8.5, color='#475569', ha='center', va='center')

    plt.tight_layout()
    img_path = os.path.join(output_dir, "figure_9_3_create_exam.png")
    plt.savefig(img_path, dpi=300, bbox_inches='tight')
    plt.close()
    print("Saved Create Exam Screenshot:", img_path)

# -------------------------------------------------------------
# 5. BACKEND DATABASE & FLASK SERVER SCREENSHOT
# -------------------------------------------------------------
def generate_backend_screenshot():
    fig, ax = plt.subplots(figsize=(10, 6.8), dpi=300)
    ax.set_xlim(0, 1000)
    ax.set_ylim(0, 680)
    ax.axis('off')

    ax.add_patch(patches.Rectangle((0, 0), 1000, 680, facecolor='#0F172A', edgecolor='#334155', linewidth=1.5))

    ax.add_patch(patches.Rectangle((0, 645), 1000, 35, facecolor='#1E293B'))
    for i, c in enumerate(['#EF4444', '#F59E0B', '#10B981']):
        ax.add_patch(patches.Circle((20 + i*18, 662), 5, facecolor=c))
    ax.text(500, 662, "Terminal 1: PostgreSQL 16 (psql) & Terminal 2: Flask Application Service", fontsize=8.5, color='#94A3B8', ha='center', va='center')

    # Left: PostgreSQL psql
    ax.add_patch(patches.Rectangle((20, 20), 465, 605, facecolor='#020617', edgecolor='#334155'))
    ax.text(35, 605, "postgres@server:~$ psql -d online_examination_system_portal", fontsize=8, color='#38BDF8', fontfamily='monospace')
    ax.text(35, 585, "psql (16.2, server 16.2 (Debian 16.2-1.pgdg110+1))", fontsize=7.5, color='#64748B', fontfamily='monospace')
    ax.text(35, 570, 'Type "help" for help.', fontsize=7.5, color='#64748B', fontfamily='monospace')
    
    psql_lines = [
        ("online_exam=# \\dt", '#F8FAFC'),
        ("                List of relations", '#94A3B8'),
        (" Schema |     Name     | Type  |  Owner   ", '#CBD5E1'),
        ("--------+--------------+-------+----------", '#64748B'),
        (" public | departments  | table | postgres ", '#34D399'),
        (" public | exam_centers | table | postgres ", '#34D399'),
        (" public | exams        | table | postgres ", '#34D399'),
        (" public | schedules    | table | postgres ", '#34D399'),
        (" public | subjects     | table | postgres ", '#34D399'),
        (" public | users        | table | postgres ", '#34D399'),
        ("(6 rows)", '#94A3B8'),
        ("", '#FFFFFF'),
        ("online_exam=# SELECT count(*) FROM schedules;", '#F8FAFC'),
        (" count ", '#CBD5E1'),
        ("-------", '#64748B'),
        ("    25", '#FBBF24'),
        ("(1 row)", '#94A3B8'),
        ("", '#FFFFFF'),
        ("online_exam=# -- Exclusion Constraint Active:", '#94A3B8'),
        ("online_exam=# \\d schedules", '#F8FAFC'),
        ("Exclusion constraints:", '#F43F5E'),
        ('  "no_overlap" EXCLUDE USING gist (center_id', '#FB7185'),
        ("  WITH =, daterange(exam_date, exam_date, '[]')", '#FB7185'),
        ("  WITH &&) WHERE (status <> 'Cancelled')", '#FB7185')
    ]
    for idx, (txt, col) in enumerate(psql_lines):
        ax.text(35, 540 - idx*19, txt, fontsize=7.2, color=col, fontfamily='monospace')

    # Right: Python Flask Service
    ax.add_patch(patches.Rectangle((515, 20), 465, 605, facecolor='#020617', edgecolor='#334155'))
    ax.text(530, 605, "developer@server:~/exam_portal$ python app.py", fontsize=8, color='#38BDF8', fontfamily='monospace')
    
    flask_lines = [
        (" * Serving Flask app 'app'", '#CBD5E1'),
        (" * Debug mode: on", '#F59E0B'),
        ("WARNING: This is a development server.", '#E2E8F0'),
        (" * Running on http://127.0.0.1:5000 (Press CTRL+C)", '#34D399'),
        (" * Database connection pool established: 10 conns", '#38BDF8'),
        (" * btree_gist extension verified on PostgreSQL.", '#34D399'),
        ("", '#FFFFFF'),
        ('[2026-10-20 09:12:04] "GET / HTTP/1.1" 200 -', '#94A3B8'),
        ('[2026-10-20 09:12:05] "GET /static/css/style.css" 200 -', '#94A3B8'),
        ('[2026-10-20 09:12:18] "GET /schedules HTTP/1.1" 200 -', '#94A3B8'),
        ('[2026-10-20 09:13:02] "POST /login HTTP/1.1" 302 -', '#FBBF24'),
        ('[2026-10-20 09:13:03] "GET /dashboard HTTP/1.1" 200 -', '#94A3B8'),
        ('[2026-10-20 09:14:15] "GET /exams/create HTTP/1.1" 200 -', '#94A3B8'),
        ('[2026-10-20 09:15:30] "POST /exams/create HTTP/1.1" 302 -', '#34D399'),
        ("INFO: New Exam Schedule #26 added successfully.", '#34D399'),
        ("QUERY: INSERT INTO schedules (exam_id, center_id,", '#64748B'),
        ("       exam_date, start_time, end_time, status)", '#64748B'),
        ("       VALUES (%s, %s, %s, %s, %s, %s);", '#64748B'),
        ('[2026-10-20 09:16:01] "GET /schedules HTTP/1.1" 200 -', '#94A3B8')
    ]
    for idx, (txt, col) in enumerate(flask_lines):
        ax.text(530, 580 - idx*20, txt, fontsize=7.2, color=col, fontfamily='monospace')

    plt.tight_layout()
    img_path = os.path.join(output_dir, "figure_9_4_backend.png")
    plt.savefig(img_path, dpi=300, bbox_inches='tight')
    plt.close()
    print("Saved Backend Screenshot:", img_path)

if __name__ == '__main__':
    generate_er_diagram()
    generate_landing_screenshot()
    generate_schedule_dashboard_screenshot()
    generate_create_exam_screenshot()
    generate_backend_screenshot()
    print("All mockup figures successfully generated!")
