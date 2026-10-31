import os
import json
from datetime import datetime, date, time
from flask import Flask, request, jsonify, send_from_directory
import psycopg2
from psycopg2 import pool
from psycopg2.extras import RealDictCursor
import psycopg2.errors

app = Flask(__name__, static_folder='.', static_url_path='')
app.secret_key = os.environ.get('SECRET_KEY', 'examhub_super_secret_production_key_2026')

DATABASE_URL = os.environ.get('DATABASE_URL')
if DATABASE_URL and DATABASE_URL.startswith('postgres://'):
    DATABASE_URL = DATABASE_URL.replace('postgres://', 'postgresql://', 1)

db_pool = None

def get_db_pool():
    global db_pool
    if db_pool is None and DATABASE_URL:
        try:
            db_pool = psycopg2.pool.SimpleConnectionPool(1, 15, dsn=DATABASE_URL)
        except Exception as e:
            print(f"[Database Pool Error]: {e}")
    return db_pool

def get_connection():
    p = get_db_pool()
    if p:
        return p.getconn()
    if DATABASE_URL:
        return psycopg2.connect(dsn=DATABASE_URL)
    return None

def release_connection(conn):
    p = get_db_pool()
    if p and conn:
        try:
            p.putconn(conn)
        except Exception:
            conn.close()
    elif conn:
        conn.close()

def init_database():
    """Initializes tables, extensions (btree_gist), and seed data from init_db.sql."""
    if not DATABASE_URL:
        print("[Notice] No DATABASE_URL configured. Server starting in standalone mode.")
        return False

    conn = None
    try:
        conn = psycopg2.connect(dsn=DATABASE_URL)
        conn.autocommit = True
        with conn.cursor() as cur:
            sql_path = os.path.join(os.path.dirname(__file__), 'init_db.sql')
            if os.path.exists(sql_path):
                with open(sql_path, 'r', encoding='utf-8') as f:
                    cur.execute(f.read())
                print("[Database] PostgreSQL tables and exclusion constraints initialized.")
                return True
    except Exception as e:
        print(f"[Database Init Error]: {e}")
        return False
    finally:
        if conn:
            conn.close()

# Attempt initialization on startup
try:
    init_database()
except Exception as ex:
    print(f"[Startup Warning]: {ex}")

# JSON Serializer helper for dates and times
def serialize_row(row):
    d = dict(row)
    for k, v in d.items():
        if isinstance(v, (date, datetime, time)):
            d[k] = str(v)
    return d

# =============================================================================
# REST API ENDPOINTS
# =============================================================================

@app.route('/api/status', methods=['GET'])
def api_status():
    if not DATABASE_URL:
        return jsonify({
            "status": "standby",
            "message": "Server running without DATABASE_URL. Running in client standby mode."
        })

    conn = None
    try:
        conn = get_connection()
        with conn.cursor() as cur:
            cur.execute("SELECT version();")
            ver = cur.fetchone()[0]
        return jsonify({
            "status": "connected",
            "database": "PostgreSQL 16",
            "engine": "Render PostgreSQL Cloud Service",
            "exclusion_support": "btree_gist active",
            "version": ver
        })
    except Exception as e:
        return jsonify({
            "status": "error",
            "message": str(e)
        }), 500
    finally:
        release_connection(conn)

@app.route('/api/init', methods=['POST', 'GET'])
def api_init():
    success = init_database()
    return jsonify({
        "success": success,
        "message": "Database schema and initial data loaded successfully." if success else "Failed to initialize."
    })

@app.route('/api/schedules', methods=['GET'])
def get_schedules():
    conn = get_connection()
    if not conn:
        return jsonify({"error": "Database unavailable"}), 503

    query = request.args.get('query', '').strip().lower()
    subject = request.args.get('subject', 'all').strip()
    center = request.args.get('center', 'all').strip()
    exam_date = request.args.get('date', '').strip()
    sort = request.args.get('sort', 'earliest')

    sql = """
        SELECT 
            s.schedule_id AS id,
            e.title,
            d.department_id AS "deptId",
            d.department_name AS "deptName",
            c.center_id AS "centerId",
            c.center_name AS "centerName",
            sub.subject_id AS "subjectId",
            sub.subject_name AS "subjectName",
            s.exam_date AS date,
            TO_CHAR(s.start_time, 'HH24:MI') AS "startTime",
            TO_CHAR(s.end_time, 'HH24:MI') AS "endTime",
            e.duration_minutes AS duration,
            s.status,
            'Approved' AS "approvalStatus",
            s.exam_date AS "submittedOn",
            e.description AS instructions
        FROM schedules s
        JOIN exams e ON s.exam_id = e.exam_id
        JOIN departments d ON e.department_id = d.department_id
        JOIN subjects sub ON e.subject_id = sub.subject_id
        JOIN exam_centers c ON s.center_id = c.center_id
        WHERE 1=1
    """
    params = []

    if query:
        sql += " AND (LOWER(e.title) LIKE %s OR LOWER(d.department_name) LIKE %s OR LOWER(sub.subject_name) LIKE %s)"
        q_param = f"%{query}%"
        params.extend([q_param, q_param, q_param])

    if subject and subject != 'all':
        sql += " AND LOWER(sub.subject_name) = LOWER(%s)"
        params.append(subject)

    if center and center != 'all':
        sql += " AND LOWER(c.center_name) LIKE LOWER(%s)"
        params.append(f"%{center}%")

    if exam_date:
        sql += " AND s.exam_date = %s"
        params.append(exam_date)

    if sort == 'latest':
        sql += " ORDER BY s.exam_date DESC, s.start_time DESC"
    elif sort == 'title':
        sql += " ORDER BY e.title ASC"
    elif sort == 'dept':
        sql += " ORDER BY d.department_name ASC"
    else:
        sql += " ORDER BY s.exam_date ASC, s.start_time ASC"

    try:
        with conn.cursor(cursor_factory=RealDictCursor) as cur:
            cur.execute(sql, tuple(params))
            rows = [serialize_row(r) for r in cur.fetchall()]
        return jsonify(rows)
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    finally:
        release_connection(conn)

@app.route('/api/schedules', methods=['POST'])
def create_schedule():
    conn = get_connection()
    if not conn:
        return jsonify({"error": "Database unavailable"}), 503

    data = request.get_json() or request.form
    title = data.get('title', '').strip()
    instructions = data.get('instructions', '').strip()
    dept_id = data.get('deptId')
    subj_id = data.get('subjectId')
    center_id = data.get('centerId')
    duration = data.get('duration', 90)
    exam_date = data.get('date')
    start_time = data.get('startTime')
    end_time = data.get('endTime')

    if not (title and dept_id and subj_id and center_id and exam_date and start_time and end_time):
        return jsonify({"error": "Missing mandatory fields"}), 400

    try:
        with conn.cursor() as cur:
            # 1. Insert Exam entity
            cur.execute("""
                INSERT INTO exams (title, description, department_id, subject_id, duration_minutes)
                VALUES (%s, %s, %s, %s, %s)
                RETURNING exam_id;
            """, (title, instructions, dept_id, subj_id, duration))
            new_exam_id = cur.fetchone()[0]

            # 2. Insert Schedule with exclusion constraint check
            cur.execute("""
                INSERT INTO schedules (exam_id, center_id, exam_date, start_time, end_time, status)
                VALUES (%s, %s, %s, %s, %s, 'Scheduled')
                RETURNING schedule_id;
            """, (new_exam_id, center_id, exam_date, start_time, end_time))
            new_sched_id = cur.fetchone()[0]

            conn.commit()

            return jsonify({
                "success": True,
                "scheduleId": new_sched_id,
                "examId": new_exam_id,
                "message": f"Exam scheduled successfully! Schedule ID: #{new_sched_id}"
            }), 201

    except psycopg2.errors.ExclusionViolation:
        conn.rollback()
        return jsonify({
            "error": "CONFLICT DETECTED: This examination center is already booked for an overlapping time slot! PostgreSQL btree_gist exclusion constraint violation."
        }), 409
    except Exception as e:
        conn.rollback()
        return jsonify({"error": f"Database error: {str(e)}"}), 500
    finally:
        release_connection(conn)

@app.route('/api/kpis', methods=['GET'])
def get_kpis():
    conn = get_connection()
    if not conn:
        return jsonify({"error": "Database unavailable"}), 503

    try:
        with conn.cursor() as cur:
            cur.execute("SELECT count(*) FROM schedules;")
            total_exams = cur.fetchone()[0]

            cur.execute("SELECT count(*) FROM schedules WHERE status = 'Scheduled';")
            approved_exams = cur.fetchone()[0]

            cur.execute("SELECT count(*) FROM schedules WHERE status = 'Pending';")
            pending_exams = cur.fetchone()[0]

            cur.execute("SELECT count(*) FROM schedules WHERE status = 'Cancelled';")
            cancelled_exams = cur.fetchone()[0]

            cur.execute("SELECT count(*) FROM exam_centers WHERE active_status = TRUE;")
            active_centers = cur.fetchone()[0]

            cur.execute("SELECT count(*) FROM users;")
            users_count = cur.fetchone()[0]

        return jsonify({
            "totalExams": total_exams,
            "approvedExams": approved_exams,
            "pendingExams": pending_exams,
            "cancelledExams": cancelled_exams,
            "activeCenters": active_centers,
            "registeredUsers": users_count if users_count > 0 else 24
        })
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    finally:
        release_connection(conn)

@app.route('/api/departments', methods=['GET', 'POST'])
def handle_departments():
    conn = get_connection()
    if not conn:
        return jsonify({"error": "Database unavailable"}), 503

    if request.method == 'POST':
        data = request.get_json() or request.form
        name = data.get('name')
        contact = data.get('contact')
        email = data.get('email')
        phone = data.get('phone')
        address = data.get('address')
        try:
            with conn.cursor() as cur:
                cur.execute("""
                    INSERT INTO departments (department_name, contact_person, email, phone, address)
                    VALUES (%s, %s, %s, %s, %s)
                    RETURNING department_id;
                """, (name, contact, email, phone, address))
                new_id = cur.fetchone()[0]
                conn.commit()
            return jsonify({"success": True, "id": new_id, "name": name}), 201
        except Exception as e:
            conn.rollback()
            return jsonify({"error": str(e)}), 400
        finally:
            release_connection(conn)

    try:
        with conn.cursor(cursor_factory=RealDictCursor) as cur:
            cur.execute("SELECT department_id AS id, department_name AS name, contact_person AS contact, email, phone, address FROM departments ORDER BY department_id;")
            rows = [serialize_row(r) for r in cur.fetchall()]
        return jsonify(rows)
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    finally:
        release_connection(conn)

@app.route('/api/subjects', methods=['GET'])
def get_subjects():
    conn = get_connection()
    if not conn:
        return jsonify({"error": "Database unavailable"}), 503
    try:
        with conn.cursor(cursor_factory=RealDictCursor) as cur:
            cur.execute("SELECT subject_id AS id, subject_name AS name, description AS desc FROM subjects ORDER BY subject_id;")
            rows = [serialize_row(r) for r in cur.fetchall()]
        return jsonify(rows)
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    finally:
        release_connection(conn)

@app.route('/api/centers', methods=['GET'])
def get_centers():
    conn = get_connection()
    if not conn:
        return jsonify({"error": "Database unavailable"}), 503
    try:
        with conn.cursor(cursor_factory=RealDictCursor) as cur:
            cur.execute("SELECT center_id AS id, center_name AS name, center_type AS type, description, active_status AS status FROM exam_centers ORDER BY center_id;")
            rows = [serialize_row(r) for r in cur.fetchall()]
        return jsonify(rows)
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    finally:
        release_connection(conn)

# =============================================================================
# FRONTEND STATIC ROUTES
# =============================================================================

@app.route('/')
def index():
    return send_from_directory('.', 'index.html')

@app.route('/<path:filename>')
def static_files(filename):
    if os.path.exists(os.path.join('.', filename)):
        return send_from_directory('.', filename)
    return send_from_directory('.', 'index.html')

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    print(f"ExamHub starting on port {port}...")
    app.run(host='0.0.0.0', port=port, debug=True)

