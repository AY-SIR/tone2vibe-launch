import { motion } from "framer-motion";
import { useLocation } from "react-router-dom";
import { useEffect } from "react";
import { Link } from "react-router-dom";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error(
      "404 Error: User attempted to access non-existent route:",
      location.pathname
    );
  }, [location.pathname]);

  return (
    <div className="relative min-h-screen flex items-center justify-center overflow-hidden bg-background px-6">

      {/* Background glow */}
      <div className="absolute w-[500px] h-[500px] bg-primary/10 blur-3xl rounded-full" />

      <motion.div
        className="relative z-10 text-center max-w-xl space-y-6"
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
      >
       <motion.h1
  className="text-5xl md:text-6xl font-elegant font-medium tracking-tight text-foreground"
  initial={{ opacity: 0, y: 20 }}
  animate={{ opacity: 1, y: 0 }}
  transition={{ duration: 0.6 }}
>
  Page not found
</motion.h1>

<motion.p
  className="text-sm md:text-base text-muted-foreground tracking-wide"
  initial={{ opacity: 0 }}
  animate={{ opacity: 1 }}
  transition={{ delay: 0.3, duration: 0.6 }}
>
  The page you’re looking for doesn’t exist or has been moved.
</motion.p>


        {/* Button */}
        <Link
          to="/"
          className="inline-block mt-4 px-6 py-3 rounded-full bg-primary text-primary-foreground font-medium transition-all hover:scale-105 hover:shadow-lg"
        >
          Return to Home
        </Link>
      </motion.div>
    </div>
  );
};

export default NotFound;
