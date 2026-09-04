import { useEffect, useState } from 'react';
import Modal from '../components/Modal';
import api from '../api/client';
import { useAppStore } from '../store/appStore';
import { CLASS_LIST, SECTIONS, isSeniorSecondary } from '../utils/classList';
import { STREAMS, subjectsFor } from '../utils/streams';

function emptyForm(academicYear) {
  return {
    admissionId: '', fullName: '', fatherName: '', motherName: '', contactNumber: '',
    address: '', className: '1st', section: 'A', stream: '', subjects: [],
    academicYear, totalFee: '', concession: '', dueDate: '',
  };
}

export default function AddEditStudentModal({ open, onClose, student, onSaved }) {
  const activeSchool = useAppStore((s) => s.activeSchool());
  const academicYear = useAppStore((s) => s.academicYear);
  const pushToast = useAppStore((s) => s.pushToast);
  const [form, setForm] = useState(emptyForm(academicYear));
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (student) {
      setForm({
        admissionId: student.admission_id, fullName: student.full_name,
        fatherName: student.father_name || '', motherName: student.mother_name || '',
        contactNumber: student.contact_number || '', address: student.address || '',
        className: student.class_name, section: student.section || 'A',
        stream: student.stream || '', subjects: student.subjects || [],
        academicYear: student.academic_year, totalFee: student.total_fee,
        concession: student.concession, dueDate: student.due_date || '',
      });
    } else if (open) {
      setForm(emptyForm(academicYear));
    }
  }, [student, open, academicYear]);

  const senior = isSeniorSecondary(form.className);

  function toggleSubject(subj) {
    setForm((f) => ({
      ...f,
      subjects: f.subjects.includes(subj) ? f.subjects.filter((s) => s !== subj) : [...f.subjects, subj],
    }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!activeSchool) return;
    setSaving(true);
    const payload = {
      schoolId: activeSchool.id,
      admissionId: form.admissionId,
      fullName: form.fullName,
      fatherName: form.fatherName,
      motherName: form.motherName,
      contactNumber: form.contactNumber,
      address: form.address,
      className: form.className,
      section: form.section,
      stream: senior ? form.stream : null,
      subjects: senior ? form.subjects : [],
      academicYear: form.academicYear,
      totalFee: Number(form.totalFee) || 0,
      concession: Number(form.concession) || 0,
      dueDate: form.dueDate || null,
    };
    try {
      if (student) {
        await api.students.update({ ...payload, id: student.id });
        pushToast({ tone: 'success', title: 'Student updated' });
      } else {
        await api.students.create(payload);
        pushToast({ tone: 'success', title: 'Student added' });
      }
      onSaved?.();
      onClose();
    } catch (err) {
      pushToast({ tone: 'error', title: 'Save failed', message: err.message });
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal open={open} onClose={onClose} title={student ? 'Edit Student' : 'Add Student'} width="max-w-2xl">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label-text">Admission ID *</label>
            <input required className="input-field" value={form.admissionId} onChange={(e) => setForm({ ...form, admissionId: e.target.value })} />
          </div>
          <div>
            <label className="label-text">Full Name *</label>
            <input required className="input-field" value={form.fullName} onChange={(e) => setForm({ ...form, fullName: e.target.value })} />
          </div>
          <div>
            <label className="label-text">Father's Name</label>
            <input className="input-field" value={form.fatherName} onChange={(e) => setForm({ ...form, fatherName: e.target.value })} />
          </div>
          <div>
            <label className="label-text">Mother's Name</label>
            <input className="input-field" value={form.motherName} onChange={(e) => setForm({ ...form, motherName: e.target.value })} />
          </div>
          <div>
            <label className="label-text">Contact Number</label>
            <input className="input-field" value={form.contactNumber} onChange={(e) => setForm({ ...form, contactNumber: e.target.value })} />
          </div>
          <div>
            <label className="label-text">Due Date</label>
            <input type="date" className="input-field" value={form.dueDate || ''} onChange={(e) => setForm({ ...form, dueDate: e.target.value })} />
          </div>
          <div className="col-span-2">
            <label className="label-text">Address</label>
            <input className="input-field" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
          </div>

          <div>
            <label className="label-text">Class *</label>
            <select className="input-field" value={form.className} onChange={(e) => setForm({ ...form, className: e.target.value, stream: '', subjects: [] })}>
              {CLASS_LIST.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label className="label-text">Section</label>
            <select className="input-field" value={form.section} onChange={(e) => setForm({ ...form, section: e.target.value })}>
              {SECTIONS.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>

          {senior && (
            <div className="col-span-2 glass-panel !bg-white/[0.03] p-3.5">
              <label className="label-text">Stream *</label>
              <div className="flex flex-wrap gap-2 mb-3">
                {STREAMS.map((s) => (
                  <button
                    type="button"
                    key={s.id}
                    onClick={() => setForm({ ...form, stream: s.id, subjects: [] })}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                      form.stream === s.id
                        ? 'bg-neon-emerald/20 border-neon-emerald text-neon-emerald shadow-glow'
                        : 'border-white/10 text-slate-400 hover:text-white hover:border-white/30'
                    }`}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
              {form.stream && (
                <>
                  <label className="label-text">Subjects</label>
                  <div className="flex flex-wrap gap-2">
                    {subjectsFor(form.stream).map((subj) => (
                      <button
                        type="button"
                        key={subj}
                        onClick={() => toggleSubject(subj)}
                        className={`px-2.5 py-1 rounded-md text-xs border transition-all ${
                          form.subjects.includes(subj)
                            ? 'bg-neon-cyan/20 border-neon-cyan text-neon-cyan'
                            : 'border-white/10 text-slate-400 hover:text-white'
                        }`}
                      >
                        {subj}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>
          )}

          <div>
            <label className="label-text">Total Fee (₹) *</label>
            <input required type="number" min="0" step="0.01" className="input-field" value={form.totalFee} onChange={(e) => setForm({ ...form, totalFee: e.target.value })} />
          </div>
          <div>
            <label className="label-text">Concession / Scholarship (₹)</label>
            <input type="number" min="0" step="0.01" className="input-field" value={form.concession} onChange={(e) => setForm({ ...form, concession: e.target.value })} />
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-2">
          <button type="button" className="btn-secondary" onClick={onClose}>Cancel</button>
          <button type="submit" disabled={saving} className="btn-primary">{saving ? 'Saving…' : student ? 'Save Changes' : 'Add Student'}</button>
        </div>
      </form>
    </Modal>
  );
}
