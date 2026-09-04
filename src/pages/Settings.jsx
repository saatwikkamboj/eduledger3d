import { useEffect, useState } from 'react';
import TiltCard from '../components/TiltCard';
import ConfirmDialog from '../components/ConfirmDialog';
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

export default function Settings() {
  const activeSchool = useAppStore((s) => s.activeSchool());
  const setSchools = useAppStore((s) => s.setSchools);
  const pushToast = useAppStore((s) => s.pushToast);
  const [form, setForm] = useState(null);
  const [dataDir, setDataDir] = useState('');
  const [importConfirmOpen, setImportConfirmOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (activeSchool) {
      setForm({
        name: activeSchool.name, affiliationCode: activeSchool.affiliation_code || '',
        address: activeSchool.address || '', phone: activeSchool.phone || '', email: activeSchool.email || '',
        receiptPrefix: activeSchool.receipt_prefix, activeAcademicYear: activeSchool.active_academic_year,
        logoDataUrl: activeSchool.logo_data_url || '', stampDataUrl: activeSchool.stamp_data_url || '',
      });
    }
    api.backup.getDataDir().then(setDataDir);
  }, [activeSchool?.id]);

  async function refreshSchools() {
    const list = await api.schools.list();
    setSchools(list);
  }

  async function handleImageChange(field, e) {
    const file = e.target.files?.[0];
    if (!file) return;
    const dataUrl = await fileToDataUrl(file);
    setForm((f) => ({ ...f, [field]: dataUrl }));
  }

  async function handleSave(e) {
    e.preventDefault();
    setSaving(true);
    try {
      await api.schools.update({ id: activeSchool.id, ...form });
      await refreshSchools();
      pushToast({ tone: 'success', title: 'School profile saved' });
    } catch (err) {
      pushToast({ tone: 'error', title: 'Save failed', message: err.message });
    } finally {
      setSaving(false);
    }
  }

  async function exportJson() {
    const res = await api.backup.exportJson({ schoolId: activeSchool.id });
    if (!res.canceled) pushToast({ tone: 'success', title: 'Backup exported', message: res.filePath });
  }

  async function exportDb() {
    const res = await api.backup.exportDbFile({ schoolId: activeSchool.id });
    if (!res.canceled) pushToast({ tone: 'success', title: 'Database file exported', message: res.filePath });
  }

  async function importJson() {
    const res = await api.backup.importJson({ schoolId: activeSchool.id });
    if (!res.canceled) pushToast({ tone: 'success', title: 'Backup restored', message: 'Data has been imported. Reload the Students page to see changes.' });
  }

  if (!form) return null;

  return (
    <div className="page-enter space-y-6 max-w-3xl">
      <div>
        <h1 className="text-2xl font-display font-bold text-white">Settings & Backup</h1>
        <p className="text-sm text-slate-400 mt-1">Manage this school's profile and keep local backups.</p>
      </div>

      <TiltCard intensity={2} glare={false} className="p-6">
        <h2 className="font-display font-semibold text-white mb-4">School Profile</h2>
        <form onSubmit={handleSave} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="label-text">School Name</label>
              <input className="input-field" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </div>
            <div>
              <label className="label-text">Affiliation Code</label>
              <input className="input-field" value={form.affiliationCode} onChange={(e) => setForm({ ...form, affiliationCode: e.target.value })} />
            </div>
            <div>
              <label className="label-text">Receipt Prefix</label>
              <input className="input-field" value={form.receiptPrefix} onChange={(e) => setForm({ ...form, receiptPrefix: e.target.value.toUpperCase() })} />
            </div>
            <div className="col-span-2">
              <label className="label-text">Address</label>
              <input className="input-field" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
            </div>
            <div>
              <label className="label-text">Phone</label>
              <input className="input-field" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
            </div>
            <div>
              <label className="label-text">Email</label>
              <input className="input-field" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
            </div>
            <div>
              <label className="label-text">Active Academic Year</label>
              <input className="input-field" value={form.activeAcademicYear} onChange={(e) => setForm({ ...form, activeAcademicYear: e.target.value })} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 pt-2">
            <div>
              <label className="label-text">School Logo</label>
              {form.logoDataUrl && <img src={form.logoDataUrl} className="h-12 w-12 rounded-lg object-cover mb-2" />}
              <input type="file" accept="image/*" onChange={(e) => handleImageChange('logoDataUrl', e)} className="text-xs text-slate-400" />
            </div>
            <div>
              <label className="label-text">Stamp / Signature</label>
              {form.stampDataUrl && <img src={form.stampDataUrl} className="h-12 w-24 object-contain mb-2" />}
              <input type="file" accept="image/*" onChange={(e) => handleImageChange('stampDataUrl', e)} className="text-xs text-slate-400" />
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <button type="submit" disabled={saving} className="btn-primary">{saving ? 'Saving…' : 'Save Profile'}</button>
          </div>
        </form>
      </TiltCard>

      <TiltCard intensity={2} glare={false} className="p-6">
        <h2 className="font-display font-semibold text-white mb-2">Local Backup & Restore</h2>
        <p className="text-xs text-slate-500 mb-4 font-mono break-all">Data folder: {dataDir}</p>
        <div className="flex flex-wrap gap-3">
          <button className="btn-secondary" onClick={exportJson}>Export Backup (JSON)</button>
          <button className="btn-secondary" onClick={exportDb}>Export Raw Database (.db)</button>
          <button className="btn-secondary text-neon-amber" onClick={() => setImportConfirmOpen(true)}>Import Backup (JSON)</button>
        </div>
        <p className="text-xs text-slate-500 mt-4">
          Importing a backup replaces all student, fee, and payment data for <b className="text-slate-300">{activeSchool?.name}</b> with the contents of the selected file. This cannot be undone — export a current backup first if unsure.
        </p>
      </TiltCard>

      <ConfirmDialog
        open={importConfirmOpen}
        onClose={() => setImportConfirmOpen(false)}
        onConfirm={importJson}
        title="Import Backup"
        message="This will overwrite all current data for this school with the backup file you select. Continue?"
        danger
        confirmLabel="Choose File & Import"
      />
    </div>
  );
}
