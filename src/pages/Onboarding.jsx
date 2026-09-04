import { useState } from 'react';
import TiltCard from '../components/TiltCard';
import api from '../api/client';
import { useAppStore } from '../store/appStore';

function fileToDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export default function Onboarding() {
  const setSchools = useAppStore((s) => s.setSchools);
  const setActiveSchool = useAppStore((s) => s.setActiveSchool);
  const pushToast = useAppStore((s) => s.pushToast);
  const [form, setForm] = useState({
    name: '', affiliationCode: '', address: '', phone: '',
    receiptPrefix: '', activeAcademicYear: '2026-2027', logoDataUrl: '',
  });
  const [saving, setSaving] = useState(false);

  async function handleLogo(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setForm((f) => ({ ...f, logoDataUrl: undefined }));
    const dataUrl = await fileToDataUrl(file);
    setForm((f) => ({ ...f, logoDataUrl: dataUrl }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.name.trim()) return;
    setSaving(true);
    try {
      const created = await api.schools.create(form);
      const list = await api.schools.list();
      setSchools(list);
      setActiveSchool(created.id);
      pushToast({ tone: 'success', title: 'Welcome to EduLedger 3D', message: `${created.name} is set up and ready.` });
    } catch (err) {
      pushToast({ tone: 'error', title: 'Setup failed', message: err.message });
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="h-full w-full flex items-center justify-center p-8 page-enter">
      <TiltCard intensity={4} className="w-full max-w-xl p-8" glare={false}>
        <div className="mb-6 text-center">
          <div className="mx-auto h-14 w-14 rounded-2xl bg-gradient-to-br from-neon-emerald to-cyan-500 shadow-glow flex items-center justify-center font-display font-bold text-2xl text-ink-950 mb-4">
            E
          </div>
          <h1 className="text-2xl font-display font-bold text-white">Set Up Your First School</h1>
          <p className="text-sm text-slate-400 mt-1">EduLedger 3D works fully offline — everything is saved to this computer. You can add up to 5 schools.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="label-text">School Name *</label>
              <input required autoFocus className="input-field" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Greenwood Public School" />
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
              <label className="label-text">Academic Year</label>
              <input className="input-field" value={form.activeAcademicYear} onChange={(e) => setForm({ ...form, activeAcademicYear: e.target.value })} />
            </div>
            <div className="col-span-2">
              <label className="label-text">School Logo (optional)</label>
              <input type="file" accept="image/*" onChange={handleLogo} className="text-xs text-slate-400" />
            </div>
          </div>
          <button type="submit" disabled={saving} className="btn-primary w-full mt-2">
            {saving ? 'Setting up…' : 'Create School & Continue'}
          </button>
        </form>
      </TiltCard>
    </div>
  );
}
