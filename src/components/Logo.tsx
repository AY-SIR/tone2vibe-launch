import { motion } from "framer-motion";

const Logo = () => {
  return (
    <motion.div
      className="flex flex-col items-center justify-center gap-2"
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8, ease: "easeOut" }}
    >
      {/* Logo Text */}
      <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-elegant font-semibold tracking-wide text-foreground">
        Tone
        <span className="text-muted-foreground font-light">2</span>
        vibe
      </h1>
      
      {/* Tagline */}

    </motion.div>
  );
};

export default Logo;
