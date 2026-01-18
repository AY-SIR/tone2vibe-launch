import { motion } from "framer-motion";

const Logo = () => {
  return (
    <motion.div
      className="flex items-center justify-center"
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8, ease: "easeOut" }}
    >
      <h1 className="text-3xl md:text-4xl font-elegant font-semibold tracking-wide text-foreground">
        tone
        <span className="text-muted-foreground font-light">2</span>
        vibe
      </h1>
    </motion.div>
  );
};

export default Logo;
