import { useState } from 'react';
import Modal from './Modal';
import TiltCard from './TiltCard';
import api from '../api/client';
import { useAppStore } from '../store/appStore';

const ACCENTS = ['emerald', 'amber', 'cyan', 'violet', 'crimson'];

function emptyForm() {
  return {
    name: '', affiliationCode: '', address: '', phone: '', email: '',
    receiptPrefix: '', activeAcademicYear: '2026-2027', themeAccent: 'emerald', logoDataUrl: '',
  };
}

function fileToDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export default function SchoolSwitcherModal({ open, onClose }) {
  const schools = useAppStore((s) => s.schools);
  const setSchools = useAppStore((s) => s.setSchools);
  const setActiveSchool = useAppStore((s) => s.setActiveSchool);
  const pushToast = useAppStore((s) => s.pushToast);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyForm());
  const [saving, setSaving] = useState(false);

  const canAddMore = schools.length < 5;

  async function refreshSchools() {
    const list = await api.schools.list();
    setSchools(list);
    return list;
  }

  async function handleSelect(id) {
    setActiveSchool(id);
    onClose();
  }

  async function handleLogoChange(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    const dataUrl = await fileToDataUrl(file);
    setForm((f) => ({ ...f, logoDataUrl: dataUrl }));
  }

  async function handleCreate(e) {
    e.preventDefault();
    if (!form.name.trim()) return;
    setSaving(true);
    try {
      const created = await api.schools.create(form);
      await refreshSchools();
      setActiveSchool(created.id);
      pushToast({ tone: 'success', title: 'School added', message: `${created.name} is ready to use.` });
      setForm(emptyForm());
      setShowForm(false);
      onClose();
    } catch (err) {
      pushToast({ tone: 'error', title: 'Could not add school', message: err.message });
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={showForm ? 'Add a New School' : 'Switch School'}
      subtitle={showForm ? 'Up to 5 isolated schools per organization.' : `${schools.length} / 5 schools configured`}
      width="max-w-2xl"
    >
      {!showForm && (
        <div className="grid grid-cols-2 gap-4">
          {schools.map((s) => (
            <TiltCard key={s.id} intensity={6} className="p-4 cursor-pointer" as="button" onClick={() => handleSelect(s.id)}>
              <div className="flex items-center gap-3">
                {s.logo_data_url ? (
                  <img src={s.logo_data_url} className="h-10 w-10 rounded-lg object-cover" />
                ) : (
                  <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-neon-emerald/40 to-cyan-500/30 flex items-center justify-center font-display font-bold">
                    {s.name?.[0] || 'S'}
                  </div>
                )}
                <div className="text-left">
                  <div className="font-semibold text-white text-sm">{s.name}</div>
                  <div className="text-xs text-slate-400">{s.receipt_prefix} · {s.active_academic_year}</div>
                </div>
              </div>
            </TiltCard>
          ))}
          {canAddMore && (
            <TiltCard
              intensity={6}
              as="button"
              className="p-4 flex items-center justify-center text-slate-400 hover:text-neon-emerald border-dashed"
              onClick={() => setShowForm(true)}
            >
              <span className="text-2xl mr-2">+</span> Add School
            </TiltCard>
          )}
        </div>
      )}

      {showForm && (
        <form onSubmit={handleCreate} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="label-text">School Name *</label>
              <input required className="input-field" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Greenwood Public School" />
            </div>
            <div>
              <label className="label-text">Affiliation Code</label>
              <input className="input-field" value={form.affiliationCode} onChange={(e) => setForm({ ...form, affiliationCode: e.target.value })} placeholder="CBSE/2026/1234" />
            </div>
            <div>
              <label className="label-text">Receipt Prefix</label>
              <input className="input-field" value={form.receiptPrefix} onChange={(e) => setForm({ ...form, receiptPrefix: e.target.value.toUpperCase() })} placeholder="SCH1" />
            </div>
            <div className="col-span-2">
              <label className="label-text">Address</label>
              <input className="input-field" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} placeholder="123 Main Road, City" />
            </div>
            <div>
              <label className="label-text">Phone</label>
              <input className="input-field" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
            </div>
            <div>
              <label className="label-text">Active Academic Year</label>
              <input className="input-field" value={form.activeAcademicYear} onChange={(e) => setForm({ ...form, activeAcademicYear: e.target.value })} placeholder="2026-2027" />
            </div>
            <div className="col-span-2">
              <label className="label-text">Logo</label>
              <input type="file" accept="image/*" onChange={handleLogoChange} className="text-xs text-slate-400" />
            </div>
            <div className="col-span-2">
              <label className="label-text">Accent Theme</label>
              <div className="flex gap-2">
                {ACCENTS.map((a) => (
                  <button
                    type="button"
                    key={a}
                    onClick={() => setForm({ ...form, themeAccent: a })}
                    className={`h-8 w-8 rounded-full border-2 ${form.themeAccent === a ? 'border-white' : 'border-transparent'}`}
                    style={{ background: { emerald: '#34ffb0', amber: '#ffb547', cyan: '#5eead4', violet: '#a78bfa', crimson: '#ff4d6d' }[a] }}
                  />
                ))}
              </div>
            </div>
          </div>
          <div className="flex justify-between items-center pt-2">
            <button type="button" className="btn-ghost" onClick={() => setShowForm(false)}>← Back</button>
            <button type="submit" disabled={saving} className="btn-primary">{saving ? 'Saving…' : 'Create School'}</button>
          </div>
        </form>
      )}
    </Modal>
  );
}
