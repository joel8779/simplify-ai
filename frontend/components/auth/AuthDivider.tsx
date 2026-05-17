"use client";

import { motion } from "framer-motion";

export function AuthDivider() {
  return (
    <motion.div
      className="relative my-6"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 0.3 }}
    >
      <div className="absolute inset-0 flex items-center">
        <span className="w-full border-t border-white/10" />
      </div>
      <div className="relative flex justify-center text-xs uppercase tracking-wider">
        <span className="bg-transparent px-3 text-muted-foreground">
          Or continue with
        </span>
      </div>
    </motion.div>
  );
}
