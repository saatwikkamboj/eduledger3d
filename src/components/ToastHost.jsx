import { AnimatePresence, motion } from 'framer-motion';
import { useAppStore } from '../store/appStore';

const TONE = {
  success: 'border-neon-emerald/50 shadow-glow',
  error: 'border-neon-crimson/50 shadow-glow-crimson',
  info: 'border-white/20 shadow-glass',
};

export default function ToastHost() {
  const toasts = useAppStore((s) => s.toasts);
  const dismissToast = useAppStore((s) => s.dismissToast);

  return (
    <div className="fixed bottom-6 right-6 z-[80] flex flex-col gap-3 w-80">
      <AnimatePresence>
        {toasts.map((t) => (
          <motion.div
            key={t.id}
            initial={{ opacity: 0, x: 40, scale: 0.95 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 40, scale: 0.95 }}
            className={`glass-panel border ${TONE[t.tone || 'info']} px-4 py-3 cursor-pointer`}
            onClick={() => dismissToast(t.id)}
          >
            {t.title && <div className="text-sm font-semibold text-white">{t.title}</div>}
            {t.message && <div className="text-xs text-slate-400 mt-0.5">{t.message}</div>}
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
