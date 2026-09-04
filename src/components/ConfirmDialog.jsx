import Modal from './Modal';

export default function ConfirmDialog({ open, onClose, onConfirm, title, message, danger = false, confirmLabel = 'Confirm' }) {
  return (
    <Modal open={open} onClose={onClose} title={title} width="max-w-sm">
      <p className="text-sm text-slate-300">{message}</p>
      <div className="mt-6 flex justify-end gap-3">
        <button className="btn-secondary" onClick={onClose}>Cancel</button>
        <button
          className={danger ? 'btn-primary !from-neon-crimson !to-red-600 !text-white' : 'btn-primary'}
          onClick={() => { onConfirm(); onClose(); }}
        >
          {confirmLabel}
        </button>
      </div>
    </Modal>
  );
}
