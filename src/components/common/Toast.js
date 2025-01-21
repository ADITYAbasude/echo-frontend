import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle, XCircle, AlertCircle, X, BellRingIcon } from "lucide-react";

const Toast = ({ message, type, isVisible, onClose, duration = 5000 }) => {
  const colors = {
    success: "text-emerald-500 bg-emerald-500/10",
    error: "text-rose-500 bg-rose-500/10",
    alert: "text-amber-500 bg-amber-500/10",
    notification: "text-primary bg-primary/10",
  };

  const icons = {
    success: <CheckCircle className="w-6 h-6" />,
    error: <XCircle className="w-6 h-6" />,
    alert: <AlertCircle className="w-6 h-6" />,
    notification: <BellRingIcon className="w-6 h-6" />,
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: 50, scale: 0.3 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, scale: 0.5, transition: { duration: 0.2 } }}
          className="fixed bottom-2 sm:bottom-4 right-2 sm:right-4 w-[calc(100%-1rem)] sm:w-[420px] 
            bg-[var(--card-background)] rounded-lg border border-white/5 shadow-lg overflow-hidden z-50"
        >
          <div className="h-0.5 w-full bg-gradient-to-r from-primary/80 to-primary/20"></div>
          <div className="p-3 sm:p-4">
            <div className="flex items-start sm:items-center gap-3">
              <div className={`${colors[type]} p-1.5 sm:p-2 rounded-sm shrink-0`}>
                {icons[type]}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs sm:text-sm text-white/90 break-words">
                  {message}
                </p>
              </div>
              <button
                onClick={onClose}
                className="ml-2 flex-shrink-0 text-white/50 hover:text-white/90 transition-colors"
              >
                <X className="w-4 h-4 sm:w-5 sm:h-5" />
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default Toast;
