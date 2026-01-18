import { motion } from "framer-motion";

const BackgroundOrbs = () => {
  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none">
      {/* Large orb - top right */}
      <motion.div
        className="absolute -top-32 -right-32 w-[600px] h-[600px] orb-1 rounded-full blur-3xl"
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 2, ease: "easeOut" }}
      />

      {/* Medium orb - bottom left */}
      <motion.div
        className="absolute -bottom-48 -left-24 w-[500px] h-[500px] orb-2 rounded-full blur-3xl animate-float-delayed"
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 2, delay: 0.3, ease: "easeOut" }}
      />

      {/* Small orb - center */}
      <motion.div
        className="absolute top-1/3 left-1/4 w-[400px] h-[400px] orb-3 rounded-full blur-3xl animate-float-slow"
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 2, delay: 0.6, ease: "easeOut" }}
      />

      {/* Subtle accent orb - top left */}
      <motion.div
        className="absolute top-20 left-10 w-[300px] h-[300px] orb-1 rounded-full blur-3xl animate-float"
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 0.6, scale: 1 }}
        transition={{ duration: 2, delay: 0.9, ease: "easeOut" }}
      />
    </div>
  );
};

export default BackgroundOrbs;
