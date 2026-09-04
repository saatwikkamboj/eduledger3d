import { AnimatePresence, motion } from 'framer-motion';

export default function Modal({ open, onClose, title, subtitle, children, width = 'max-w-lg', footer }) {
  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-6">
          <motion.div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <motion.div
            className={`relative w-full ${width} glass-panel neon-border-emerald p-6 max-h-[88vh] overflow-y-auto`}
            initial={{ opacity: 0, y: 24, scale: 0.96, rotateX: -6 }}
            animate={{ opacity: 1, y: 0, scale: 1, rotateX: 0 }}
            exit={{ opacity: 0, y: 14, scale: 0.97 }}
            transition={{ type: 'spring', stiffness: 260, damping: 24 }}
            style={{ transformPerspective: 1200 }}
          >
            {(title || subtitle) && (
              <div className="mb-5">
                {title && <h3 className="text-lg font-display font-semibold text-white">{title}</h3>}
                {subtitle && <p className="text-sm text-slate-400 mt-0.5">{subtitle}</p>}
              </div>
            )}
            <button
              onClick={onClose}
              className="absolute top-4 right-4 text-slate-400 hover:text-white transition-colors text-xl leading-none"
              aria-label="Close"
            >
              ×
            </button>
            {children}
            {footer && <div className="mt-6 flex justify-end gap-3">{footer}</div>}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
