/* =================================================================
   db.js — St.Clare Girls Centre Database Layer
   Uses Supabase (free PostgreSQL database)

   HOW TO SET UP YOUR DATABASE (one time, 10 minutes):
   ─────────────────────────────────────────────────────
   1. Go to supabase.com → click "Start your project" → sign up free
   2. Click "New Project" → give it a name like "highland-school"
   3. Set a strong database password → click "Create new project"
   4. Wait ~2 minutes for project to set up
   5. Go to Settings (gear icon) → API
   6. Copy "Project URL" → paste below as SUPABASE_URL
   7. Copy "anon/public" key → paste below as SUPABASE_KEY
   8. Go to SQL Editor → New Query → paste and run the SQL below
   9. Done! Your database is ready.

   TABLES SQL (run this in Supabase SQL Editor):
   ─────────────────────────────────────────────
   -- Staff/Teachers table
   create table staff (
     id uuid default gen_random_uuid() primary key,
     email text unique not null,
     name text not null,
     role text not null default 'teacher',
     subject text,
     grade_level text,
     created_at timestamptz default now()
   );

   -- Students table
   create table students (
     id uuid default gen_random_uuid() primary key,
     adm_number text unique not null,
     name text not null,
     grade text not null,
     curriculum text not null default 'cbc',
     stream text,
     created_at timestamptz default now()
   );

   -- Results table (one row per student per subject per exam)
   create table results (
     id uuid default gen_random_uuid() primary key,
     student_id uuid references students(id),
     subject text not null,
     grade text not null,
     curriculum text not null,
     term text not null,
     exam_type text not null,
     score numeric not null,
     max_score numeric not null default 100,
     grade_letter text,
     remarks text,
     uploaded_by uuid,
     created_at timestamptz default now()
   );

   -- Enable row-level security (keeps data private)
   alter table staff   enable row level security;
   alter table students enable row level security;
   alter table results  enable row level security;

   -- Allow authenticated users to read/write
   create policy "Staff can read all" on staff for select using (auth.role() = 'authenticated');
   create policy "Staff can read students" on students for select using (auth.role() = 'authenticated');
   create policy "Staff can manage results" on results for all using (auth.role() = 'authenticated');

   -- Insert sample students
   insert into students (adm_number, name, grade, curriculum, stream) values
     ('SC/001', 'Aisha Wanjiku',  'Grade 11', 'cbc',  'Science'),
     ('SC/002', 'Brenda Otieno',  'Grade 11', 'cbc',  'Science'),
     ('SC/003', 'Clara Njoroge',  'Form 4',   '8-4-4','4A'),
     ('SC/004', 'Diana Kamau',    'Form 4',   '8-4-4','4A'),
     ('SC/005', 'Esther Mwenda',  'Grade 7',  'cbc',  'A'),
     ('SC/006', 'Faith Achieng',  'Grade 1',  'cbc',  'A');
   ================================================================= */

  const SUPABASE_URL = 'YOUR_SUPABASE_URL';     // ← Replace this
  const SUPABASE_KEY = 'YOUR_SUPABASE_ANON_KEY'; // ← Replace this

  /* Initialize */
  const _supabase = (typeof window !== 'undefined' && window.supabase)
    ? window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY)
    : null;

  const DB_READY = SUPABASE_URL !== 'YOUR_SUPABASE_URL' && _supabase !== null;

  /* ── AUTHENTICATION ── */
  async function dbLogin(email, password) {
    if (!DB_READY) return { error: 'No database connected' };
    return await _supabase.auth.signInWithPassword({ email, password });
  }

  async function dbLogout() {
    if (!DB_READY) { sessionStorage.removeItem('hs_user'); return; }
    await _supabase.auth.signOut();
    sessionStorage.removeItem('hs_user');
  }

  async function dbResetPassword(email) {
    if (!DB_READY) return { error: 'No database' };
    return await _supabase.auth.resetPasswordForEmail(email);
  }

  /* ── STUDENTS ── */
  async function getStudents(grade, curriculum) {
    if (!DB_READY) return { data: [], error: null };
    let q = _supabase.from('students').select('*').order('name');
    if (grade)      q = q.eq('grade', grade);
    if (curriculum) q = q.eq('curriculum', curriculum);
    return await q;
  }

  async function addStudent(student) {
    if (!DB_READY) return { error: 'No database' };
    return await _supabase.from('students').insert(student);
  }

  async function importStudents(rows) {
    if (!DB_READY) return { error: 'No database' };
    return await _supabase.from('students').upsert(rows, { onConflict: 'adm_number' });
  }

  /* ── RESULTS ── */
  async function saveResults(rows) {
    if (!DB_READY) return { error: 'No database' };
    return await _supabase.from('results').insert(rows);
  }

  async function getResults({ grade, subject, term, examType, curriculum }) {
    if (!DB_READY) return { data: [], error: null };
    let q = _supabase
      .from('results')
      .select('*, students(name, adm_number, grade, stream)')
      .order('score', { ascending: false });
    if (grade)      q = q.eq('grade', grade);
    if (subject)    q = q.eq('subject', subject);
    if (term)       q = q.eq('term', term);
    if (examType)   q = q.eq('exam_type', examType);
    if (curriculum) q = q.eq('curriculum', curriculum);
    return await q;
  }

  async function getSchoolSummary() {
    if (!DB_READY) return null;
    const { data: students } = await _supabase.from('students').select('id', { count: 'exact' });
    const { data: results  } = await _supabase.from('results').select('score, max_score');
    if (!results || !results.length) return null;
    const mean = results.reduce((s, r) => s + (r.score / r.max_score) * 100, 0) / results.length;
    const pass = results.filter(r => (r.score / r.max_score) * 100 >= 50).length;
    return {
      totalStudents: students?.length || 0,
      meanScore:     Math.round(mean),
      passRate:      Math.round((pass / results.length) * 100),
    };
  }

  async function getClassRankings(grade, term) {
    if (!DB_READY) return { data: [] };
    const { data } = await _supabase
      .from('results')
      .select('student_id, score, max_score, students(name, adm_number, grade)')
      .eq('term', term)
      .eq('grade', grade);

    if (!data) return { data: [] };

    /* Aggregate by student */
    const map = {};
    data.forEach(r => {
      const id = r.student_id;
      if (!map[id]) map[id] = { ...r.students, scores: [], total: 0, count: 0 };
      map[id].scores.push((r.score / r.max_score) * 100);
      map[id].total += (r.score / r.max_score) * 100;
      map[id].count++;
    });

    const ranked = Object.values(map)
      .map(s => ({ ...s, mean: Math.round(s.total / s.count) }))
      .sort((a, b) => b.mean - a.mean)
      .map((s, i) => ({ ...s, rank: i + 1 }));

    return { data: ranked };
  }

  /* ── GRADE CALCULATION ── */
  function calcGrade(score, max) {
    const pct = (score / max) * 100;
    if (pct >= 80) return { letter: 'A', label: 'Excellent',     cssClass: 'ga' };
    if (pct >= 65) return { letter: 'B', label: 'Good',          cssClass: 'gb' };
    if (pct >= 50) return { letter: 'C', label: 'Average',       cssClass: 'gc' };
    if (pct >= 40) return { letter: 'D', label: 'Below Average', cssClass: 'gd' };
    return               { letter: 'E', label: 'Fail',           cssClass: 'gd' };
  }

  /* ── CSV EXPORT (identical to Zeraki) ── */
  function exportCSV(rows, filename, headers) {
    let csv = 'Highland Secondary School — Results Export\n';
    csv += 'Generated: ' + new Date().toLocaleDateString('en-KE') + '\n\n';
    csv += headers.map(h => '"' + h + '"').join(',') + '\n';
    rows.forEach(row => {
      csv += headers.map(h => '"' + (row[h] || '') + '"').join(',') + '\n';
    });
    const blob = new Blob([csv], { type: 'text/csv' });
    const a    = document.createElement('a');
    a.href     = URL.createObjectURL(blob);
    a.download = filename + '_' + new Date().toISOString().slice(0,10) + '.csv';
    a.click();
  }

  /* ── PDF EXPORT (identical to Zeraki) ── */
  function exportPDF(tableId, title, subtitle) {
    const { jsPDF } = window.jspdf;
    if (!jsPDF) { alert('PDF library loading, try again in a moment.'); return; }
    const doc = new jsPDF({ orientation: 'landscape' });

    /* School header */
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(26, 79, 138);
    doc.text('Highland Secondary School', 148, 18, { align: 'center' });

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(90, 110, 135);
    doc.text('Excellence · Integrity · Service  |  Off Mer-Maua Road, Meru  |  stclare@gmail.com', 148, 25, { align: 'center' });

    doc.setFontSize(13);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(13, 26, 46);
    doc.text(title, 148, 34, { align: 'center' });

    if (subtitle) {
      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(90, 110, 135);
      doc.text(subtitle, 148, 40, { align: 'center' });
    }

    /* Horizontal line */
    doc.setDrawColor(205, 216, 234);
    doc.line(14, 43, 283, 43);

    /* Table */
    const table = document.getElementById(tableId);
    if (!table) { doc.text('No data to display.', 148, 60, { align: 'center' }); doc.save(title + '.pdf'); return; }

    const headers = Array.from(table.querySelectorAll('thead th')).map(th => th.textContent.trim());
    const rows    = Array.from(table.querySelectorAll('tbody tr')).map(tr =>
      Array.from(tr.querySelectorAll('td')).map(td => td.textContent.trim())
    );

    doc.autoTable({
      head:        [headers],
      body:        rows,
      startY:      47,
      theme:       'grid',
      headStyles:  { fillColor: [26, 79, 138], textColor: 255, fontSize: 8, fontStyle: 'bold' },
      bodyStyles:  { fontSize: 8, textColor: [13, 26, 46] },
      alternateRowStyles: { fillColor: [232, 240, 251] },
      styles:      { overflow: 'linebreak', cellPadding: 3 },
      margin:      { left: 14, right: 14 },
    });

    /* Footer on every page */
    const ud       = JSON.parse(sessionStorage.getItem('hs_user') || '{}');
    const pageCount = doc.internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(7);
      doc.setTextColor(150);
      doc.text(
        'Confidential — Highland Secondary School  |  Printed by: ' + (ud.name || 'Staff') +
        '  |  Page ' + i + ' of ' + pageCount + '  |  ' + new Date().toLocaleString('en-KE'),
        148, doc.internal.pageSize.height - 8, { align: 'center' }
      );
    }

    doc.save('St.Clare_' + title.replace(/ /g, '_') + '_' + new Date().toISOString().slice(0,10) + '.pdf');
  }
