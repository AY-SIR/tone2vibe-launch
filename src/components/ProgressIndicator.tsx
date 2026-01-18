import { motion } from "framer-motion";

const ProgressIndicator = () => {
  return (
    <motion.div
      className="flex flex-col items-center gap-3"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8, delay: 0.7 }}
    >
      {/* Status Badge */}
      <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20">
        <motion.div
          className="w-2 h-2 rounded-full bg-primary"
          animate={{
            scale: [1, 1.2, 1],
            opacity: [1, 0.7, 1],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
        <span className="text-xs sm:text-sm font-body text-primary tracking-wide">
          In Development
        </span>
      </div>

      {/* Progress Bar */}
      <div className="w-48 sm:w-64 h-1 bg-muted rounded-full overflow-hidden">
        <motion.div
          className="h-full bg-gradient-to-r from-primary/60 via-primary to-primary/60 rounded-full"
          initial={{ width: "0%" }}
          animate={{ width: "65%" }}
          transition={{
            duration: 1.5,
            delay: 1,
            ease: "easeOut",
          }}
        />
      </div>

      {/* Progress Text */}
      <span className="text-[10px] sm:text-xs font-body text-muted-foreground/70">
        65% Complete
      </span>
    </motion.div>
  );
};

export default ProgressIndicator;
