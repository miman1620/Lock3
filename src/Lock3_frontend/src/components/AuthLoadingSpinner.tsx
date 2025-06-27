import React from 'react';
import { motion } from 'framer-motion';

const AuthLoadingSpinner: React.FC = () => {
  return (
    <div className="fixed inset-0 bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center z-50">
      <div className="text-center">
        <motion.div
          className="w-16 h-16 border-4 border-purple-300 border-t-purple-600 rounded-full mx-auto mb-4"
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
        />
        <motion.h2
          className="text-2xl font-bold text-white mb-2"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          Initializing Internet Identity
        </motion.h2>
        <motion.p
          className="text-purple-200"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
        >
          Setting up secure authentication...
        </motion.p>
      </div>
    </div>
  );
};

export default AuthLoadingSpinner;
