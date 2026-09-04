const { ipcMain, dialog, BrowserWindow, app } = require('electron');
const fs = require('fs');
const path = require('path');
const db = require('./db');
const { buildReceiptHtml } = require('./utils/receiptTemplate');

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function computeStatus(totalFee, concession, totalPaid, dueDate) {
  const net = Math.max(0, Number(totalFee) - Number(concession || 0));
  const paid = Number(totalPaid) || 0;
  const balance = Math.max(0, net - paid);
  if (net <= 0 || balance <= 0.009) return 'Fully Paid';
  const isPastDue = dueDate && new Date(dueDate) < new Date(new Date().toDateString());
  if (isPastDue) return 'Overdue';
  if (paid > 0) return 'Partially Paid';
  return 'Pending';
}

function studentTotalsRow(schoolDb, studentId) {
  const paidRow = schoolDb
    .prepare('SELECT COALESCE(SUM(amount),0) AS total FROM payments WHERE student_id = ?')
    .get(studentId);
  return paidRow.total || 0;
}

function refreshStudentStatus(schoolDb, studentId) {
  const student = schoolDb.prepare('SELECT * FROM students WHERE id = ?').get(studentId);
  if (!student) return null;
  const totalPaid = studentTotalsRow(schoolDb, studentId);
  const status = computeStatus(student.total_fee, student.concession, totalPaid, student.due_date);
  schoolDb
    .prepare('UPDATE students SET status = ?, updated_at = datetime(\'now\') WHERE id = ?')
    .run(status, studentId);
  return { ...student, status, total_paid: totalPaid };
}

function nextReceiptNumber(schoolDb, schoolSlug, academicYear) {
  const row = schoolDb.prepare('SELECT next_number FROM receipt_counters WHERE academic_year = ?').get(academicYear);
  let n;
  if (!row) {
    n = 1;
    schoolDb.prepare('INSERT INTO receipt_counters (academic_year, next_number) VALUES (?, ?)').run(academicYear, 2);
  } else {
    n = row.next_number;
    schoolDb.prepare('UPDATE receipt_counters SET next_number = next_number + 1 WHERE academic_year = ?').run(academicYear);
  }
  const yearShort = (academicYear.match(/\d{4}/) || ['2026'])[0];
  const padded = String(n).padStart(4, '0');
  return `${schoolSlug.toUpperCase()}-${yearShort}-${padded}`;
}

function studentWithLedger(row, totalPaidMap) {
  const totalPaid = totalPaidMap.get(row.id) || 0;
  const net = Math.max(0, row.total_fee - row.concession);
  const balance = Math.max(0, net - totalPaid);
  return {
    ...row,
    subjects: row.subjects ? JSON.parse(row.subjects) : [],
    total_paid: totalPaid,
    net_fee: net,
    balance_pending: balance,
  };
}

function getSchoolMeta(schoolId) {
  const orgDb = db.getOrgDb();
  return orgDb.prepare('SELECT * FROM schools WHERE id = ?').get(schoolId);
}

// ---------------------------------------------------------------------------
// Registration
// ---------------------------------------------------------------------------

function registerIpcHandlers() {
  // ---- Organization ----
  ipcMain.handle('org:get', () => {
    const orgDb = db.getOrgDb();
    return orgDb.prepare('SELECT * FROM organization WHERE id = 1').get();
  });

  ipcMain.handle('org:update', (_e, { name }) => {
    const orgDb = db.getOrgDb();
    orgDb.prepare('UPDATE organization SET name = ? WHERE id = 1').run(name);
    return orgDb.prepare('SELECT * FROM organization WHERE id = 1').get();
  });

  // ---- Schools ----
  ipcMain.handle('schools:list', () => {
    const orgDb = db.getOrgDb();
    return orgDb.prepare('SELECT * FROM schools WHERE archived = 0 ORDER BY sort_order ASC, id ASC').all();
  });

  ipcMain.handle('schools:create', (_e, payload) => {
    const orgDb = db.getOrgDb();
    const count = orgDb.prepare('SELECT COUNT(*) AS c FROM schools WHERE archived = 0').get().c;
    if (count >= 5) throw new Error('Maximum of 5 schools reached for this organization.');
    const slug = (payload.slug || `sch${count + 1}`).toLowerCase().replace(/[^a-z0-9]/g, '');
    const info = orgDb
      .prepare(`INSERT INTO schools
        (slug, name, affiliation_code, address, phone, email, logo_data_url, stamp_data_url, receipt_prefix, active_academic_year, theme_accent, sort_order)
        VALUES (@slug, @name, @affiliation_code, @address, @phone, @email, @logo_data_url, @stamp_data_url, @receipt_prefix, @active_academic_year, @theme_accent, @sort_order)`)
      .run({
        slug,
        name: payload.name,
        affiliation_code: payload.affiliationCode || null,
        address: payload.address || null,
        phone: payload.phone || null,
        email: payload.email || null,
        logo_data_url: payload.logoDataUrl || null,
        stamp_data_url: payload.stampDataUrl || null,
        receipt_prefix: (payload.receiptPrefix || slug).toUpperCase(),
        active_academic_year: payload.activeAcademicYear || '2026-2027',
        theme_accent: payload.themeAccent || 'emerald',
        sort_order: count,
      });
    // initialize the isolated school database immediately
    db.getSchoolDb(info.lastInsertRowid);
    return orgDb.prepare('SELECT * FROM schools WHERE id = ?').get(info.lastInsertRowid);
  });

  ipcMain.handle('schools:update', (_e, { id, ...payload }) => {
    const orgDb = db.getOrgDb();
    const existing = orgDb.prepare('SELECT * FROM schools WHERE id = ?').get(id);
    if (!existing) throw new Error('School not found');
    const merged = {
      name: payload.name ?? existing.name,
      affiliation_code: payload.affiliationCode ?? existing.affiliation_code,
      address: payload.address ?? existing.address,
      phone: payload.phone ?? existing.phone,
      email: payload.email ?? existing.email,
      logo_data_url: payload.logoDataUrl ?? existing.logo_data_url,
      stamp_data_url: payload.stampDataUrl ?? existing.stamp_data_url,
      receipt_prefix: payload.receiptPrefix ?? existing.receipt_prefix,
      active_academic_year: payload.activeAcademicYear ?? existing.active_academic_year,
      theme_accent: payload.themeAccent ?? existing.theme_accent,
      id,
    };
    orgDb.prepare(`UPDATE schools SET name=@name, affiliation_code=@affiliation_code, address=@address,
      phone=@phone, email=@email, logo_data_url=@logo_data_url, stamp_data_url=@stamp_data_url,
      receipt_prefix=@receipt_prefix, active_academic_year=@active_academic_year, theme_accent=@theme_accent
      WHERE id=@id`).run(merged);
    return orgDb.prepare('SELECT * FROM schools WHERE id = ?').get(id);
  });

  ipcMain.handle('schools:archive', (_e, { id }) => {
    const orgDb = db.getOrgDb();
    orgDb.prepare('UPDATE schools SET archived = 1 WHERE id = ?').run(id);
    db.closeSchoolDb(id);
    return true;
  });

  // ---- Academic Years ----
  ipcMain.handle('academicYears:list', (_e, { schoolId }) => {
    const sdb = db.getSchoolDb(schoolId);
    return sdb.prepare('SELECT * FROM academic_years ORDER BY label DESC').all();
  });

  ipcMain.handle('academicYears:create', (_e, { schoolId, label }) => {
    const sdb = db.getSchoolDb(schoolId);
    sdb.prepare('INSERT OR IGNORE INTO academic_years (label) VALUES (?)').run(label);
    return sdb.prepare('SELECT * FROM academic_years ORDER BY label DESC').all();
  });

  // ---- Fee Structures ----
  ipcMain.handle('feeStructures:list', (_e, { schoolId, academicYear, classFilter }) => {
    const sdb = db.getSchoolDb(schoolId);
    let q = 'SELECT * FROM fee_structures WHERE academic_year = ?';
    const params = [academicYear];
    if (classFilter) {
      q += ' AND class_name = ?';
      params.push(classFilter);
    }
    q += ' ORDER BY class_name ASC, fee_type ASC';
    return sdb.prepare(q).all(...params);
  });

  ipcMain.handle('feeStructures:create', (_e, { schoolId, ...payload }) => {
    const sdb = db.getSchoolDb(schoolId);
    const info = sdb.prepare(`INSERT INTO fee_structures
      (academic_year, class_name, stream, fee_type, label, amount, frequency)
      VALUES (@academic_year, @class_name, @stream, @fee_type, @label, @amount, @frequency)`).run({
      academic_year: payload.academicYear,
      class_name: payload.className,
      stream: payload.stream || null,
      fee_type: payload.feeType,
      label: payload.label,
      amount: payload.amount,
      frequency: payload.frequency || 'Annual',
    });
    return sdb.prepare('SELECT * FROM fee_structures WHERE id = ?').get(info.lastInsertRowid);
  });

  ipcMain.handle('feeStructures:update', (_e, { schoolId, id, ...payload }) => {
    const sdb = db.getSchoolDb(schoolId);
    sdb.prepare(`UPDATE fee_structures SET class_name=@class_name, stream=@stream, fee_type=@fee_type,
      label=@label, amount=@amount, frequency=@frequency WHERE id=@id`).run({
      id,
      class_name: payload.className,
      stream: payload.stream || null,
      fee_type: payload.feeType,
      label: payload.label,
      amount: payload.amount,
      frequency: payload.frequency || 'Annual',
    });
    return sdb.prepare('SELECT * FROM fee_structures WHERE id = ?').get(id);
  });

  ipcMain.handle('feeStructures:delete', (_e, { schoolId, id }) => {
    const sdb = db.getSchoolDb(schoolId);
    sdb.prepare('DELETE FROM fee_structures WHERE id = ?').run(id);
    return true;
  });

  // ---- Students ----
  ipcMain.handle('students:list', (_e, { schoolId, search, classFilter, streamFilter, statusFilter, academicYear }) => {
    const sdb = db.getSchoolDb(schoolId);
    let q = 'SELECT * FROM students WHERE is_active = 1';
    const params = [];
    if (academicYear) { q += ' AND academic_year = ?'; params.push(academicYear); }
    if (classFilter) { q += ' AND class_name = ?'; params.push(classFilter); }
    if (streamFilter) { q += ' AND stream = ?'; params.push(streamFilter); }
    if (statusFilter) { q += ' AND status = ?'; params.push(statusFilter); }
    if (search) {
      q += ' AND (full_name LIKE ? OR admission_id LIKE ? OR father_name LIKE ? OR contact_number LIKE ?)';
      const s = `%${search}%`;
      params.push(s, s, s, s);
    }
    q += ' ORDER BY full_name ASC';
    const rows = sdb.prepare(q).all(...params);
    const ids = rows.map((r) => r.id);
    const totalPaidMap = new Map();
    if (ids.length) {
      const placeholders = ids.map(() => '?').join(',');
      const paidRows = sdb
        .prepare(`SELECT student_id, COALESCE(SUM(amount),0) AS total FROM payments WHERE student_id IN (${placeholders}) GROUP BY student_id`)
        .all(...ids);
      paidRows.forEach((r) => totalPaidMap.set(r.student_id, r.total));
    }
    return rows.map((r) => studentWithLedger(r, totalPaidMap));
  });

  ipcMain.handle('students:get', (_e, { schoolId, id }) => {
    const sdb = db.getSchoolDb(schoolId);
    const row = sdb.prepare('SELECT * FROM students WHERE id = ?').get(id);
    if (!row) return null;
    const totalPaid = studentTotalsRow(sdb, id);
    const map = new Map([[id, totalPaid]]);
    const payments = sdb.prepare('SELECT * FROM payments WHERE student_id = ? ORDER BY payment_date DESC, id DESC').all(id);
    return {
      ...studentWithLedger(row, map),
      payments: payments.map((p) => ({ ...p, fee_breakdown: p.fee_breakdown ? JSON.parse(p.fee_breakdown) : [] })),
    };
  });

  ipcMain.handle('students:create', (_e, { schoolId, ...payload }) => {
    const sdb = db.getSchoolDb(schoolId);
    const info = sdb.prepare(`INSERT INTO students
      (admission_id, full_name, father_name, mother_name, contact_number, address, class_name, section,
       stream, subjects, academic_year, photo_data_url, total_fee, concession, due_date, status)
      VALUES (@admission_id, @full_name, @father_name, @mother_name, @contact_number, @address, @class_name, @section,
       @stream, @subjects, @academic_year, @photo_data_url, @total_fee, @concession, @due_date, @status)`).run({
      admission_id: payload.admissionId,
      full_name: payload.fullName,
      father_name: payload.fatherName || null,
      mother_name: payload.motherName || null,
      contact_number: payload.contactNumber || null,
      address: payload.address || null,
      class_name: payload.className,
      section: payload.section || null,
      stream: payload.stream || null,
      subjects: payload.subjects ? JSON.stringify(payload.subjects) : null,
      academic_year: payload.academicYear,
      photo_data_url: payload.photoDataUrl || null,
      total_fee: payload.totalFee || 0,
      concession: payload.concession || 0,
      due_date: payload.dueDate || null,
      status: computeStatus(payload.totalFee || 0, payload.concession || 0, 0, payload.dueDate || null),
    });
    return refreshStudentStatus(sdb, info.lastInsertRowid);
  });

  ipcMain.handle('students:update', (_e, { schoolId, id, ...payload }) => {
    const sdb = db.getSchoolDb(schoolId);
    const existing = sdb.prepare('SELECT * FROM students WHERE id = ?').get(id);
    if (!existing) throw new Error('Student not found');
    sdb.prepare(`UPDATE students SET
        admission_id=@admission_id, full_name=@full_name, father_name=@father_name, mother_name=@mother_name,
        contact_number=@contact_number, address=@address, class_name=@class_name, section=@section,
        stream=@stream, subjects=@subjects, academic_year=@academic_year, photo_data_url=@photo_data_url,
        total_fee=@total_fee, concession=@concession, due_date=@due_date, updated_at=datetime('now')
      WHERE id=@id`).run({
      id,
      admission_id: payload.admissionId ?? existing.admission_id,
      full_name: payload.fullName ?? existing.full_name,
      father_name: payload.fatherName ?? existing.father_name,
      mother_name: payload.motherName ?? existing.mother_name,
      contact_number: payload.contactNumber ?? existing.contact_number,
      address: payload.address ?? existing.address,
      class_name: payload.className ?? existing.class_name,
      section: payload.section ?? existing.section,
      stream: payload.stream ?? existing.stream,
      subjects: payload.subjects ? JSON.stringify(payload.subjects) : existing.subjects,
      academic_year: payload.academicYear ?? existing.academic_year,
      photo_data_url: payload.photoDataUrl ?? existing.photo_data_url,
      total_fee: payload.totalFee ?? existing.total_fee,
      concession: payload.concession ?? existing.concession,
      due_date: payload.dueDate ?? existing.due_date,
    });
    return refreshStudentStatus(sdb, id);
  });

  ipcMain.handle('students:delete', (_e, { schoolId, id }) => {
    const sdb = db.getSchoolDb(schoolId);
    sdb.prepare('UPDATE students SET is_active = 0 WHERE id = ?').run(id);
    return true;
  });

  // ---- Payments / Fee Entry ----
  ipcMain.handle('payments:create', (_e, { schoolId, studentId, amount, paymentMode, referenceNumber, feeBreakdown, paymentDate, cashierName, remarks }) => {
    const sdb = db.getSchoolDb(schoolId);
    const schoolMeta = getSchoolMeta(schoolId);
    const student = sdb.prepare('SELECT * FROM students WHERE id = ?').get(studentId);
    if (!student) throw new Error('Student not found');

    const receiptNumber = nextReceiptNumber(sdb, schoolMeta.receipt_prefix || schoolMeta.slug, student.academic_year);

    const info = sdb.prepare(`INSERT INTO payments
      (student_id, receipt_number, amount, payment_mode, reference_number, fee_breakdown, payment_date, cashier_name, remarks)
      VALUES (@student_id, @receipt_number, @amount, @payment_mode, @reference_number, @fee_breakdown, @payment_date, @cashier_name, @remarks)`).run({
      student_id: studentId,
      receipt_number: receiptNumber,
      amount,
      payment_mode: paymentMode,
      reference_number: referenceNumber || null,
      fee_breakdown: feeBreakdown ? JSON.stringify(feeBreakdown) : null,
      payment_date: paymentDate || new Date().toISOString().slice(0, 10),
      cashier_name: cashierName || null,
      remarks: remarks || null,
    });

    const updatedStudent = refreshStudentStatus(sdb, studentId);
    const payment = sdb.prepare('SELECT * FROM payments WHERE id = ?').get(info.lastInsertRowid);

    return {
      payment: { ...payment, fee_breakdown: payment.fee_breakdown ? JSON.parse(payment.fee_breakdown) : [] },
      student: updatedStudent,
    };
  });

  ipcMain.handle('payments:listByStudent', (_e, { schoolId, studentId }) => {
    const sdb = db.getSchoolDb(schoolId);
    return sdb.prepare('SELECT * FROM payments WHERE student_id = ? ORDER BY payment_date DESC, id DESC').all(studentId)
      .map((p) => ({ ...p, fee_breakdown: p.fee_breakdown ? JSON.parse(p.fee_breakdown) : [] }));
  });

  ipcMain.handle('payments:listAll', (_e, { schoolId, search, fromDate, toDate }) => {
    const sdb = db.getSchoolDb(schoolId);
    let q = `SELECT payments.*, students.full_name, students.admission_id, students.class_name, students.section
      FROM payments JOIN students ON students.id = payments.student_id WHERE 1=1`;
    const params = [];
    if (search) {
      q += ' AND (students.full_name LIKE ? OR payments.receipt_number LIKE ? OR students.admission_id LIKE ?)';
      const s = `%${search}%`;
      params.push(s, s, s);
    }
    if (fromDate) { q += ' AND payments.payment_date >= ?'; params.push(fromDate); }
    if (toDate) { q += ' AND payments.payment_date <= ?'; params.push(toDate); }
    q += ' ORDER BY payments.id DESC';
    return sdb.prepare(q).all(...params).map((p) => ({ ...p, fee_breakdown: p.fee_breakdown ? JSON.parse(p.fee_breakdown) : [] }));
  });

  ipcMain.handle('payments:recent', (_e, { schoolId, limit }) => {
    const sdb = db.getSchoolDb(schoolId);
    return sdb.prepare(`SELECT payments.*, students.full_name, students.class_name, students.section
      FROM payments JOIN students ON students.id = payments.student_id
      ORDER BY payments.id DESC LIMIT ?`).all(limit || 8);
  });

  // ---- Dashboard stats ----
  ipcMain.handle('dashboard:stats', (_e, { schoolId, academicYear }) => {
    const sdb = db.getSchoolDb(schoolId);
    const students = sdb.prepare('SELECT * FROM students WHERE is_active = 1 AND academic_year = ?').all(academicYear);
    const ids = students.map((s) => s.id);
    let totalPaid = 0;
    const paidMap = new Map();
    if (ids.length) {
      const placeholders = ids.map(() => '?').join(',');
      const rows = sdb.prepare(`SELECT student_id, COALESCE(SUM(amount),0) AS total FROM payments WHERE student_id IN (${placeholders}) GROUP BY student_id`).all(...ids);
      rows.forEach((r) => { paidMap.set(r.student_id, r.total); totalPaid += r.total; });
    }
    let totalFee = 0, totalConcession = 0, fullyPaid = 0, partiallyPaid = 0, overdue = 0, pending = 0;
    students.forEach((s) => {
      totalFee += s.total_fee;
      totalConcession += s.concession;
      const status = computeStatus(s.total_fee, s.concession, paidMap.get(s.id) || 0, s.due_date);
      if (status === 'Fully Paid') fullyPaid++;
      else if (status === 'Partially Paid') partiallyPaid++;
      else if (status === 'Overdue') overdue++;
      else pending++;
    });
    const netFee = Math.max(0, totalFee - totalConcession);
    return {
      totalStudents: students.length,
      totalFee, totalConcession, netFee,
      totalCollected: totalPaid,
      totalPending: Math.max(0, netFee - totalPaid),
      fullyPaid, partiallyPaid, overdue, pending,
    };
  });

  // ---- Receipts: print & PDF ----
  ipcMain.handle('receipts:print', async (_e, { schoolId, paymentId }) => {
    const sdb = db.getSchoolDb(schoolId);
    const payment = sdb.prepare('SELECT * FROM payments WHERE id = ?').get(paymentId);
    const student = sdb.prepare('SELECT * FROM students WHERE id = ?').get(payment.student_id);
    const school = getSchoolMeta(schoolId);
    const net = Math.max(0, student.total_fee - student.concession);
    const totalPaid = studentTotalsRow(sdb, student.id);
    const html = buildReceiptHtml({
      school: {
        name: school.name, address: school.address, affiliationCode: school.affiliation_code,
        phone: school.phone, logoDataUrl: school.logo_data_url, stampDataUrl: school.stamp_data_url,
      },
      student: { fullName: student.full_name, admissionId: student.admission_id, className: student.class_name, section: student.section, fatherName: student.father_name },
      payment: {
        receiptNumber: payment.receipt_number, amount: payment.amount, paymentMode: payment.payment_mode,
        referenceNumber: payment.reference_number, paymentDate: payment.payment_date, cashierName: payment.cashier_name,
        feeBreakdown: payment.fee_breakdown ? JSON.parse(payment.fee_breakdown) : [],
        balanceAfter: Math.max(0, net - totalPaid),
      },
    });

    const printWin = new BrowserWindow({ show: false, webPreferences: { offscreen: false } });
    await printWin.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(html)}`);
    printWin.webContents.print({ silent: false, printBackground: true }, () => {
      printWin.close();
    });
    return true;
  });

  ipcMain.handle('receipts:savePdf', async (_e, { schoolId, paymentId }) => {
    const sdb = db.getSchoolDb(schoolId);
    const payment = sdb.prepare('SELECT * FROM payments WHERE id = ?').get(paymentId);
    const student = sdb.prepare('SELECT * FROM students WHERE id = ?').get(payment.student_id);
    const school = getSchoolMeta(schoolId);
    const net = Math.max(0, student.total_fee - student.concession);
    const totalPaid = studentTotalsRow(sdb, student.id);
    const html = buildReceiptHtml({
      school: {
        name: school.name, address: school.address, affiliationCode: school.affiliation_code,
        phone: school.phone, logoDataUrl: school.logo_data_url, stampDataUrl: school.stamp_data_url,
      },
      student: { fullName: student.full_name, admissionId: student.admission_id, className: student.class_name, section: student.section, fatherName: student.father_name },
      payment: {
        receiptNumber: payment.receipt_number, amount: payment.amount, paymentMode: payment.payment_mode,
        referenceNumber: payment.reference_number, paymentDate: payment.payment_date, cashierName: payment.cashier_name,
        feeBreakdown: payment.fee_breakdown ? JSON.parse(payment.fee_breakdown) : [],
        balanceAfter: Math.max(0, net - totalPaid),
      },
    });

    const { filePath, canceled } = await dialog.showSaveDialog({
      title: 'Save Receipt as PDF',
      defaultPath: `${payment.receipt_number}.pdf`,
      filters: [{ name: 'PDF', extensions: ['pdf'] }],
    });
    if (canceled || !filePath) return { canceled: true };

    const pdfWin = new BrowserWindow({ show: false });
    await pdfWin.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(html)}`);
    const buffer = await pdfWin.webContents.printToPDF({ printBackground: true, pageSize: 'A4' });
    fs.writeFileSync(filePath, buffer);
    pdfWin.close();
    return { canceled: false, filePath };
  });

  // ---- Backup / Restore ----
  ipcMain.handle('backup:exportJson', async (_e, { schoolId }) => {
    const sdb = db.getSchoolDb(schoolId);
    const school = getSchoolMeta(schoolId);
    const payload = {
      exportedAt: new Date().toISOString(),
      school,
      academicYears: sdb.prepare('SELECT * FROM academic_years').all(),
      feeStructures: sdb.prepare('SELECT * FROM fee_structures').all(),
      students: sdb.prepare('SELECT * FROM students').all(),
      payments: sdb.prepare('SELECT * FROM payments').all(),
      receiptCounters: sdb.prepare('SELECT * FROM receipt_counters').all(),
    };
    const { filePath, canceled } = await dialog.showSaveDialog({
      title: 'Export School Backup (JSON)',
      defaultPath: `${school.slug}-backup-${Date.now()}.json`,
      filters: [{ name: 'JSON', extensions: ['json'] }],
    });
    if (canceled || !filePath) return { canceled: true };
    fs.writeFileSync(filePath, JSON.stringify(payload, null, 2));
    return { canceled: false, filePath };
  });

  ipcMain.handle('backup:exportDbFile', async (_e, { schoolId }) => {
    const school = getSchoolMeta(schoolId);
    const src = db.schoolDbPath(schoolId);
    const { filePath, canceled } = await dialog.showSaveDialog({
      title: 'Export Raw Database File',
      defaultPath: `${school.slug}-${Date.now()}.db`,
      filters: [{ name: 'SQLite DB', extensions: ['db'] }],
    });
    if (canceled || !filePath) return { canceled: true };
    fs.copyFileSync(src, filePath);
    return { canceled: false, filePath };
  });

  ipcMain.handle('backup:importJson', async (_e, { schoolId }) => {
    const { filePaths, canceled } = await dialog.showOpenDialog({
      title: 'Import School Backup (JSON)',
      properties: ['openFile'],
      filters: [{ name: 'JSON', extensions: ['json'] }],
    });
    if (canceled || !filePaths.length) return { canceled: true };
    const raw = JSON.parse(fs.readFileSync(filePaths[0], 'utf-8'));
    const sdb = db.getSchoolDb(schoolId);

    const tx = sdb.transaction(() => {
      sdb.prepare('DELETE FROM payments').run();
      sdb.prepare('DELETE FROM students').run();
      sdb.prepare('DELETE FROM fee_structures').run();
      sdb.prepare('DELETE FROM academic_years').run();
      sdb.prepare('DELETE FROM receipt_counters').run();

      const insAY = sdb.prepare('INSERT INTO academic_years (id, label, is_active, created_at) VALUES (@id,@label,@is_active,@created_at)');
      (raw.academicYears || []).forEach((r) => insAY.run(r));

      const insFS = sdb.prepare(`INSERT INTO fee_structures (id, academic_year, class_name, stream, fee_type, label, amount, frequency, created_at)
        VALUES (@id,@academic_year,@class_name,@stream,@fee_type,@label,@amount,@frequency,@created_at)`);
      (raw.feeStructures || []).forEach((r) => insFS.run(r));

      const insSt = sdb.prepare(`INSERT INTO students (id, admission_id, full_name, father_name, mother_name, contact_number,
        address, class_name, section, stream, subjects, academic_year, photo_data_url, total_fee, concession, due_date,
        status, is_active, created_at, updated_at)
        VALUES (@id,@admission_id,@full_name,@father_name,@mother_name,@contact_number,@address,@class_name,@section,
        @stream,@subjects,@academic_year,@photo_data_url,@total_fee,@concession,@due_date,@status,@is_active,@created_at,@updated_at)`);
      (raw.students || []).forEach((r) => insSt.run(r));

      const insPay = sdb.prepare(`INSERT INTO payments (id, student_id, receipt_number, amount, payment_mode, reference_number,
        fee_breakdown, payment_date, cashier_name, remarks, created_at)
        VALUES (@id,@student_id,@receipt_number,@amount,@payment_mode,@reference_number,@fee_breakdown,@payment_date,@cashier_name,@remarks,@created_at)`);
      (raw.payments || []).forEach((r) => insPay.run(r));

      const insRC = sdb.prepare('INSERT INTO receipt_counters (academic_year, next_number) VALUES (@academic_year,@next_number)');
      (raw.receiptCounters || []).forEach((r) => insRC.run(r));
    });
    tx();

    return { canceled: false, imported: true };
  });

  ipcMain.handle('backup:getDataDir', () => db.getDataDir());
}

module.exports = { registerIpcHandlers };
