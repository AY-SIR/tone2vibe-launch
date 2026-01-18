import { motion } from "framer-motion";

const Logo = () => {
  return (
    <motion.div
      className="flex flex-col items-center justify-center gap-3"
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8, ease: "easeOut" }}
    >
      {/* Logo Mark - Abstract sound wave */}
      <div className="relative w-16 h-16 md:w-20 md:h-20">
        <motion.div
          className="absolute inset-0 flex items-center justify-center gap-1"
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          {[0.4, 0.7, 1, 0.7, 0.4].map((height, i) => (
            <motion.div
              key={i}
              className="w-1.5 md:w-2 bg-foreground rounded-full"
              style={{ height: `${height * 100}%` }}
              initial={{ scaleY: 0 }}
              animate={{ scaleY: 1 }}
              transition={{
                duration: 0.5,
                delay: 0.3 + i * 0.1,
                ease: "easeOut",
              }}
            />
          ))}
        </motion.div>
      </div>

      {/* Logo Text */}
      <h1 className="text-3xl md:text-4xl lg:text-5xl font-elegant font-semibold tracking-wide text-foreground">
        tone
        <span className="text-muted-foreground font-light">2</span>
        vibe
      </h1>
    </motion.div>
  );
};

export default Logo;
