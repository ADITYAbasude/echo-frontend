import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';

const BroadcastCollabRequest = ({ requesterName, requesterAvatar, onAccept, onReject, isVisible }) => {
  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: 50, scale: 0.3 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, scale: 0.5, transition: { duration: 0.2 } }}
          className="fixed bottom-4 right-4 w-96 bg-gradient-to-br from-[#1a1a1a] to-[#121212] rounded-lg 
                     shadow-lg border border-primary/5 overflow-hidden z-50"
        >
          <div className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3 flex-1">
                <div className="relative">
                  <div className="absolute -top-1 -right-1 w-3 h-3 bg-primary rounded-full animate-pulse" />
                  <img 
                    src={requesterAvatar} 
                    alt={requesterName}
                    className="w-10 h-10 rounded-full border border-primary/20" 
                  />
                </div>
                <div className="flex-1">
                  <h3 className="text-sm font-medium text-white">{requesterName}</h3>
                  <p className="text-xs text-white/60">Wants to collaborate</p>
                </div>
                <button
                  onClick={onReject}
                  className="flex-shrink-0 text-white/40 hover:text-white/60 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="flex gap-2 mt-3">
              <motion.button
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2 }}
                onClick={onAccept}
                className="flex-1 py-2 rounded-md bg-primary text-xs font-medium text-white 
                         hover:bg-primary/90 transition-colors"
              >
                Accept
              </motion.button>
              <motion.button
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
                onClick={onReject}
                className="flex-1 py-2 rounded-md bg-white/10 text-xs font-medium text-white
                         hover:bg-white/20 transition-colors"
              >
                Decline
              </motion.button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default BroadcastCollabRequest;