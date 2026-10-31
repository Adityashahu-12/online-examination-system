const bcrypt = require('bcryptjs');
const { pool } = require('../server/config/database');

async function seedDatabase() {
  console.log('[Seed] Beginning initial institutional dataset seed...');
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // 1. Password Hashes (bcrypt)
    const adminPasswordHash = await bcrypt.hash('Admin@123', 10);
    const studentPasswordHash = await bcrypt.hash('Student@123', 10);

    // 2. Seed Admin User
    const adminRes = await client.query(`
      INSERT INTO users (full_name, email, password_hash, role)
      VALUES ($1, $2, $3, 'Admin')
      ON CONFLICT (email) DO UPDATE SET password_hash = EXCLUDED.password_hash
      RETURNING user_id;
    `, ['Aryan Kajne', 'admin@examhub.local', adminPasswordHash]);
    const adminId = adminRes.rows[0].user_id;

    // 3. Seed Student User (Aditya Shahu - UID: 24010024)
    const studentRes = await client.query(`
      INSERT INTO users (full_name, email, password_hash, role)
      VALUES ($1, $2, $3, 'Student')
      ON CONFLICT (email) DO UPDATE SET password_hash = EXCLUDED.password_hash
      RETURNING user_id;
    `, ['Aditya Shahu', 'student@examhub.local', studentPasswordHash]);
    const studentId = studentRes.rows[0].user_id;

    // Additional test students
    const demoStudents = [
      ['Rahul Deshmukh', 'rahul@example.com', '24010025', 1, 5],
      ['Priya Sharma', 'priya@example.com', '24010026', 1, 5],
      ['Amit Kumar', 'amit@example.com', '24010027', 2, 5],
      ['Sneha Joshi', 'sneha@example.com', '24010028', 2, 5]
    ];

    // 4. Seed Departments (20 rows from Case Study)
    const departments = [
      ['Department of Information Technology', 'IT', 'Dr. Rajesh Kapoor', 'it@college.ac.in', '9876543210', 'Block A, Room 201'],
      ['Department of Computer Science', 'CSE', 'Dr. Sunita Agarwal', 'cse@college.ac.in', '9876543211', 'Block A, Room 301'],
      ['Department of AI and Data Science', 'AIDS', 'Dr. K. Rajendran', 'aids@college.ac.in', '9876543212', 'Block B, Room 102'],
      ['Department of Electronics & TC', 'ETC', 'Dr. Prannoy Roy', 'etc@college.ac.in', '9876543213', 'Block C, Room 205'],
      ['Department of Mechanical Engg', 'MECH', 'Dr. Nikhil Advani', 'mech@college.ac.in', '9876543214', 'Workshop Complex W1'],
      ['Department of Civil Engineering', 'CIVIL', 'Dr. Sudhanshu Vats', 'civil@college.ac.in', '9876543215', 'Block D, Room 101'],
      ['Department of Electrical Engg', 'EE', 'Dr. Aroon Purie', 'ee@college.ac.in', '9876543216', 'Block C, Room 108'],
      ['Department of Cyber Security', 'CYBER', 'Dr. Deepak Chaurasia', 'cyber@college.ac.in', '9876543217', 'Block B, Room 305'],
      ['Department of Chemical Engg', 'CHEM', 'Dr. Avinash Pandey', 'chem@college.ac.in', '9876543218', 'Science Wing, S204'],
      ['Department of Biotechnology', 'BIOTECH', 'Dr. Arnab Goswami', 'biotech@college.ac.in', '9876543219', 'Life Sciences Wing L1'],
      ['Department of Mathematics', 'MATHS', 'Dr. Amit Bajaj', 'maths@college.ac.in', '9876543220', 'Science Wing, S102'],
      ['Department of Physics', 'PHYSICS', 'Dr. Megha Tata', 'physics@college.ac.in', '9876543221', 'Science Wing, S105'],
      ['Department of Management Studies', 'MBA', 'Dr. Sylvia Bland', 'mba@college.ac.in', '9876543222', 'MBA Block, M201'],
      ['Department of Computer Applications', 'MCA', 'Dr. Raj Nayak', 'mca@college.ac.in', '9876543223', 'Block A, Room 402'],
      ['Department of Humanities & Social Sc', 'HSS', 'Dr. Gautam Talwar', 'humanities@college.ac.in', '9876543224', 'Main Admin Block, R12'],
      ['Department of Aerospace Engg', 'AERO', 'Dr. Punit Goenka', 'aero@college.ac.in', '9876543225', 'Aviation Annex, A101'],
      ['Department of Robotics & Automation', 'ROBOT', 'Dr. NP Singh', 'robotics@college.ac.in', '9876543226', 'Mechatronics Lab, M04'],
      ['Department of Environmental Engg', 'ENVIRO', 'Dr. Warsi Khan', 'enviro@college.ac.in', '9876543227', 'Green Technology Wing'],
      ['Department of Mechatronics', 'MECHTRON', 'Dr. Shalini Sethi', 'mechatronics@college.ac.in', '9876543228', 'Block C, Room 310'],
      ['Examination Regulatory Authority', 'EXAMCELL', 'Dr. S. Jaishankar', 'examcell@college.ac.in', '9876543229', 'Central Exam Cell, E01']
    ];

    const deptMap = {};
    for (const [name, code, contact, email, phone, addr] of departments) {
      const res = await client.query(`
        INSERT INTO departments (department_name, department_code, contact_person, email, phone, address)
        VALUES ($1, $2, $3, $4, $5, $6)
        ON CONFLICT (department_name) DO UPDATE SET contact_person = EXCLUDED.contact_person
        RETURNING department_id, department_name;
      `, [name, code, contact, email, phone, addr]);
      deptMap[res.rows[0].department_name] = res.rows[0].department_id;
    }

    // 5. Seed Student Profiles
    await client.query(`
      INSERT INTO student_profiles (user_id, student_id, department_id, semester, academic_year, phone)
      VALUES ($1, '24010024', $2, 5, '2026-27', '9876543210')
      ON CONFLICT (user_id) DO UPDATE SET student_id = EXCLUDED.student_id;
    `, [studentId, deptMap['Department of Information Technology']]);

    for (const [name, email, uid, dIdx, sem] of demoStudents) {
      const uRes = await client.query(`
        INSERT INTO users (full_name, email, password_hash, role)
        VALUES ($1, $2, $3, 'Student')
        ON CONFLICT (email) DO UPDATE SET full_name = EXCLUDED.full_name
        RETURNING user_id;
      `, [name, email, studentPasswordHash]);
      const uId = uRes.rows[0].user_id;

      await client.query(`
        INSERT INTO student_profiles (user_id, student_id, department_id, semester, academic_year)
        VALUES ($1, $2, $3, $4, '2026-27')
        ON CONFLICT (user_id) DO UPDATE SET student_id = EXCLUDED.student_id;
      `, [uId, uid, dIdx, sem]);
    }

    // 6. Seed Exam Centers (20 rows from Case Study)
    const centers = [
      ['Turing Computer Center Lab 1', 'Campus Lab', 60, 'High-performance lab with 60 workstations'],
      ['Babbage Computing Lab 2', 'Campus Lab', 60, 'Equipped with dual-monitor developer stations'],
      ['Ada Lovelace Virtual Hall A', 'Virtual Hall', 150, 'Secure remote proctoring cluster with AI monitoring'],
      ['Aryabhata Lab 104', 'Campus Lab', 50, 'General engineering computer laboratory'],
      ['Von Neumann Center 201', 'Campus Lab', 55, 'Advanced networking and database lab'],
      ['Ramanujan Testing Hall', 'Campus Lab', 60, 'Specialized quantitative computing laboratory'],
      ['Shannon Proctored Cluster 1', 'Proctored Center', 45, 'Biometric authenticated testing laboratory'],
      ['Knuth Algorithm Testing Center', 'Campus Lab', 50, 'Programming contests and practical examinations'],
      ['Hopper Software Studio', 'Campus Lab', 40, 'Dedicated software architecture and testing lab'],
      ['Linus Open Source Lab', 'Campus Lab', 45, 'Linux-based OS and systems programming lab'],
      ['Codd Relational Data Lab', 'Campus Lab', 50, 'Optimized for high-throughput SQL exam environments'],
      ['Dijkstra Distributed Systems Lab', 'Campus Lab', 45, 'Network testing and distributed computing facility'],
      ['Berners-Lee Web Innovation Lab', 'Campus Lab', 40, 'Web technologies and frontend computing lab'],
      ['Chomsky Language Lab', 'Campus Lab', 40, 'Automata, compiler design and NLP test lab'],
      ['Gosling Java Testing Facility', 'Campus Lab', 45, 'Object-oriented programming practical hall'],
      ['Stroustrup C++ Computing Hall', 'Campus Lab', 45, 'Embedded systems and algorithmic testing cluster'],
      ['Ritchie Systems Lab', 'Campus Lab', 40, 'Core operating systems and kernel lab'],
      ['Tesla Robotics Simulator Center', 'Campus Lab', 35, 'Simulation cluster for CAD and robotics viva'],
      ['Virtual Exam Hall Beta', 'Virtual Hall', 200, 'Automated cloud-hosted browser exam portal'],
      ['Central Auditorium Testing Hall', 'Regional Center', 300, 'Capacity for 300 candidates with CCTV monitoring']
    ];

    const centerMap = {};
    for (const [name, type, cap, desc] of centers) {
      const res = await client.query(`
        INSERT INTO exam_centers (center_name, center_type, capacity, description, active_status)
        VALUES ($1, $2, $3, $4, TRUE)
        ON CONFLICT (center_name) DO UPDATE SET capacity = EXCLUDED.capacity
        RETURNING center_id, center_name;
      `, [name, type, cap, desc]);
      centerMap[res.rows[0].center_name] = res.rows[0].center_id;
    }

    // 7. Seed Subjects (20 rows from Case Study)
    const subjects = [
      ['Database Management Systems', '24IT501T', 'Relational models, SQL, Normalization, ACID and indexing'],
      ['Data Structures & Algorithms', '24CS301T', 'Stacks, Queues, Trees, Graphs, Sorting and Dynamic Programming'],
      ['Operating Systems', '24IT502T', 'Process synchronization, memory management, threads and file systems'],
      ['Computer Networks', '24EC401T', 'OSI model, TCP/IP, routing algorithms and socket programming'],
      ['Software Engineering', '24IT401T', 'Agile methodologies, SDLC, requirements and design patterns'],
      ['Machine Learning', '24AI502T', 'Supervised, unsupervised learning, regression and neural networks'],
      ['Artificial Intelligence', '24AI501T', 'Heuristic search, logic programming, planning and game theory'],
      ['Cyber Security & Cryptography', '24IT601T', 'Symmetric/asymmetric crypto, hashing, network defense and PKI'],
      ['Web Technologies', '24IT503T', 'HTML5, CSS3, JavaScript, REST APIs and modern web frameworks'],
      ['Discrete Mathematics', '24CS201T', 'Set theory, graph theory, combinatorics and predicate logic'],
      ['Cloud Computing', '24CS602T', 'Virtualization, AWS/GCP architecture, Docker and microservices'],
      ['Compiler Design', '24CS502T', 'Lexical analysis, syntax trees, parsing techniques and code generation'],
      ['Digital Signal Processing', '24EC502T', 'Fourier transforms, digital filters, sampling and convolution'],
      ['Embedded Systems', '24EC503T', 'Microcontrollers, ARM architecture, RTOS and IoT interfaces'],
      ['Computer Architecture', '24CS401T', 'Instruction set architecture, pipelining, cache memory and ALU'],
      ['Data Mining & Warehousing', '24IT602T', 'ETL processes, OLAP, association rule mining and data clustering'],
      ['Blockchain Technology', '24IT701T', 'Decentralized ledgers, consensus algorithms and smart contracts'],
      ['Internet of Things', '24EC601T', 'Sensor networks, MQTT, edge computing and embedded hardware'],
      ['Mobile Application Development', '24IT603T', 'Android, iOS, Flutter and reactive mobile UI architecture'],
      ['Human Computer Interaction', '24IT702T', 'UI/UX heuristics, usability testing, accessibility and prototyping']
    ];

    const subjectMap = {};
    for (const [name, code, desc] of subjects) {
      const res = await client.query(`
        INSERT INTO subjects (subject_name, subject_code, description)
        VALUES ($1, $2, $3)
        ON CONFLICT (subject_name) DO UPDATE SET subject_code = EXCLUDED.subject_code
        RETURNING subject_id, subject_name;
      `, [name, code, desc]);
      subjectMap[res.rows[0].subject_name] = res.rows[0].subject_id;
    }

    // 8. Seed Master Exams
    const itDeptId = deptMap['Department of Information Technology'];
    const csDeptId = deptMap['Department of Computer Science'];
    const dbmsSubjId = subjectMap['Database Management Systems'];
    const dsaSubjId = subjectMap['Data Structures & Algorithms'];
    const osSubjId = subjectMap['Operating Systems'];

    const exam1Res = await client.query(`
      INSERT INTO exams (title, description, department_id, subject_id, semester, duration_minutes, total_questions, total_marks, passing_marks, negative_marking, status, created_by)
      VALUES ($1, $2, $3, $4, 5, 30, 5, 50.00, 20.00, 0.00, 'Published', $5)
      RETURNING exam_id;
    `, [
      'DBMS Mid-Semester Examination',
      'Comprehensive theoretical and practical exam covering Relational Algebra, SQL, Normalization, and Transaction Management with ACID compliance.',
      itDeptId, dbmsSubjId, adminId
    ]);
    const exam1Id = exam1Res.rows[0].exam_id;

    const exam2Res = await client.query(`
      INSERT INTO exams (title, description, department_id, subject_id, semester, duration_minutes, total_questions, total_marks, passing_marks, negative_marking, status, created_by)
      VALUES ($1, $2, $3, $4, 5, 45, 5, 50.00, 20.00, 0.25, 'Published', $5)
      RETURNING exam_id;
    `, [
      'Data Structures Practical Exam',
      'Hands-on evaluation of Trees, Graph Traversals, Balanced Search Trees, Sorting algorithms, and asymptotic complexity.',
      csDeptId, dsaSubjId, adminId
    ]);
    const exam2Id = exam2Res.rows[0].exam_id;

    const exam3Res = await client.query(`
      INSERT INTO exams (title, description, department_id, subject_id, semester, duration_minutes, total_questions, total_marks, passing_marks, negative_marking, status, created_by)
      VALUES ($1, $2, $3, $4, 5, 60, 0, 100.00, 40.00, 0.00, 'Draft', $5)
      RETURNING exam_id;
    `, [
      'Operating Systems Term Test',
      'End-term written examination on scheduling, deadlock avoidance, paging, and virtual memory.',
      itDeptId, osSubjId, adminId
    ]);
    const exam3Id = exam3Res.rows[0].exam_id;

    // 9. Seed MCQs & Options for Exam 1 (DBMS)
    const dbmsQuestions = [
      {
        text: 'Which normal form eliminates partial dependency where a non-prime attribute depends on a proper subset of a candidate key?',
        marks: 10,
        options: [
          { text: 'First Normal Form (1NF)', isCorrect: false },
          { text: 'Second Normal Form (2NF)', isCorrect: true },
          { text: 'Third Normal Form (3NF)', isCorrect: false },
          { text: 'Boyce-Codd Normal Form (BCNF)', isCorrect: false }
        ]
      },
      {
        text: 'In PostgreSQL, which index extension provides GiST indexing for non-geometric scalar data types to enable exclusion constraints?',
        marks: 10,
        options: [
          { text: 'pg_trgm', isCorrect: false },
          { text: 'btree_gist', isCorrect: true },
          { text: 'uuid-ossp', isCorrect: false },
          { text: 'hstore', isCorrect: false }
        ]
      },
      {
        text: 'Which ACID property ensures that all operations in a database transaction complete successfully, or all are rolled back?',
        marks: 10,
        options: [
          { text: 'Atomicity', isCorrect: true },
          { text: 'Consistency', isCorrect: false },
          { text: 'Isolation', isCorrect: false },
          { text: 'Durability', isCorrect: false }
        ]
      },
      {
        text: 'Which SQL clause is used to filter groups created by the GROUP BY clause based on aggregate calculations?',
        marks: 10,
        options: [
          { text: 'WHERE', isCorrect: false },
          { text: 'ORDER BY', isCorrect: false },
          { text: 'HAVING', isCorrect: true },
          { text: 'LIMIT', isCorrect: false }
        ]
      },
      {
        text: 'In relational algebra, which fundamental operator is denoted by the Greek letter sigma (σ)?',
        marks: 10,
        options: [
          { text: 'Projection', isCorrect: false },
          { text: 'Selection', isCorrect: true },
          { text: 'Cartesian Product', isCorrect: false },
          { text: 'Natural Join', isCorrect: false }
        ]
      }
    ];

    for (let i = 0; i < dbmsQuestions.length; i++) {
      const q = dbmsQuestions[i];
      const qRes = await client.query(`
        INSERT INTO questions (exam_id, question_text, marks, negative_marks, question_order)
        VALUES ($1, $2, $3, 0.00, $4)
        RETURNING question_id;
      `, [exam1Id, q.text, q.marks, i + 1]);
      const qId = qRes.rows[0].question_id;

      for (let j = 0; j < q.options.length; j++) {
        const opt = q.options[j];
        await client.query(`
          INSERT INTO question_options (question_id, option_text, is_correct, option_order)
          VALUES ($1, $2, $3, $4);
        `, [qId, opt.text, opt.isCorrect, j + 1]);
      }
    }

    // 10. Seed Schedules with Proper Non-Overlapping Verification
    const turingCenterId = centerMap['Turing Computer Center Lab 1'];
    const babbageCenterId = centerMap['Babbage Computing Lab 2'];
    const virtualCenterId = centerMap['Ada Lovelace Virtual Hall A'];

    // Schedule 1: Turing Lab, 09:00 - 10:30 (Morning Shift)
    await client.query(`
      INSERT INTO schedules (exam_id, center_id, exam_date, start_time, end_time, status)
      VALUES ($1, $2, '2026-10-20', '09:00:00', '10:30:00', 'Scheduled');
    `, [exam1Id, turingCenterId]);

    // Schedule 2: Turing Lab, 11:30 - 13:00 (Afternoon Shift in SAME lab - MUST SUCCEED with corrected constraint!)
    await client.query(`
      INSERT INTO schedules (exam_id, center_id, exam_date, start_time, end_time, status)
      VALUES ($1, $2, '2026-10-20', '11:30:00', '13:00:00', 'Scheduled');
    `, [exam1Id, turingCenterId]);

    // Schedule 3: Babbage Lab, 11:00 - 12:30
    await client.query(`
      INSERT INTO schedules (exam_id, center_id, exam_date, start_time, end_time, status)
      VALUES ($1, $2, '2026-10-20', '11:00:00', '12:30:00', 'Scheduled');
    `, [exam2Id, babbageCenterId]);

    // Schedule 4: Virtual Hall, 14:00 - 15:30
    await client.query(`
      INSERT INTO schedules (exam_id, center_id, exam_date, start_time, end_time, status)
      VALUES ($1, $2, '2026-10-20', '14:00:00', '15:30:00', 'Scheduled');
    `, [exam3Id, virtualCenterId]);

    // 11. Assign Exam 1 and Exam 2 to Aditya Shahu
    await client.query(`
      INSERT INTO exam_assignments (exam_id, student_id)
      VALUES ($1, $2), ($3, $2)
      ON CONFLICT (exam_id, student_id) DO NOTHING;
    `, [exam1Id, studentId, exam2Id]);

    // 12. Audit Log
    await client.query(`
      INSERT INTO audit_logs (user_id, action, details)
      VALUES ($1, 'DATABASE_SEED', '{"status":"success","modules":["auth","exams","schedules","questions"]}');
    `, [adminId]);

    await client.query('COMMIT');
    console.log('[Seed] Database successfully populated with initial institutional data.');
    return true;
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('[Seed Error]:', error);
    throw error;
  } finally {
    client.release();
  }
}

if (require.main === module) {
  seedDatabase()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}

module.exports = { seedDatabase };
