import { motion } from 'framer-motion'

export function LoadingScreen() {
  return (
    <motion.div
      className="fixed inset-0 flex flex-col items-center justify-center bg-bg-primary z-50"
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.4 }}
    >
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="text-center"
      >
        {/* Logo */}
        <div className="mb-8 flex items-center justify-center gap-3">
          <div className="relative">
            <motion.div
              className="w-16 h-16 rounded-2xl bg-gradient-to-br from-accent-blue to-accent-cyan flex items-center justify-center text-3xl"
              animate={{ rotate: [0, 5, -5, 0] }}
              transition={{ duration: 3, repeat: Infinity }}
            >
              🏙️
            </motion.div>
            <motion.div
              className="absolute -inset-1 rounded-2xl bg-gradient-to-br from-accent-blue to-accent-cyan opacity-30 blur-md"
              animate={{ opacity: [0.2, 0.5, 0.2] }}
              transition={{ duration: 2, repeat: Infinity }}
            />
          </div>
          <div className="text-left">
            <h1 className="text-3xl font-bold text-text-primary tracking-tight">UrbanMind AI</h1>
            <p className="text-sm text-accent-cyan font-mono tracking-widest uppercase">Smart City Expansion Planner</p>
          </div>
        </div>

        {/* Progress bar */}
        <div className="w-64 h-1 bg-bg-card rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-gradient-to-r from-accent-blue to-accent-cyan"
            initial={{ width: '0%' }}
            animate={{ width: '100%' }}
            transition={{ duration: 1.1, ease: 'easeInOut' }}
          />
        </div>

        <motion.p
          className="mt-4 text-text-muted text-sm font-mono"
          animate={{ opacity: [0.4, 1, 0.4] }}
          transition={{ duration: 1.5, repeat: Infinity }}
        >
          Initializing simulation engine...
        </motion.p>
      </motion.div>

      {/* Background grid */}
      <div className="fixed inset-0 -z-10 opacity-5"
        style={{
          backgroundImage: 'linear-gradient(#3b82f6 1px, transparent 1px), linear-gradient(90deg, #3b82f6 1px, transparent 1px)',
          backgroundSize: '40px 40px',
        }}
      />
    </motion.div>
  )
}
