import { motion } from "framer-motion";
import BackgroundOrbs from "@/components/BackgroundOrbs";
import Logo from "@/components/Logo";
import EmailSubscribe from "@/components/EmailSubscribe";

const Index = () => {
  return (
    <div className="relative min-h-screen flex flex-col items-center justify-center px-6 py-12 overflow-hidden">
      <BackgroundOrbs />

      <div className="relative z-10 flex flex-col items-center justify-center max-w-2xl mx-auto text-center space-y-12">
        {/* Logo */}
        <Logo />

        {/* Main Headline */}
        <motion.div
          className="space-y-6"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
        >
          <h2 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-elegant font-medium leading-tight tracking-tight text-foreground">
            Something fresh
            <br />
            <span className="text-muted-foreground">is coming soon</span>
          </h2>
        </motion.div>

        {/* Subtext */}
        <motion.p
          className="text-base md:text-lg text-muted-foreground font-body font-light max-w-md leading-relaxed"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.5 }}
        >
          Where creativity meets sound. A new space for those who feel the vibe 
          and live the tone.
        </motion.p>

        {/* Email Subscribe */}
        <EmailSubscribe />

        {/* Footer Note */}
        <motion.div
          className="absolute bottom-8 left-0 right-0 text-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1, delay: 1.2 }}
        >
          <p className="text-xs text-muted-foreground/60 font-body tracking-wide">
            © 2025 tone2vibe. All rights reserved.
          </p>
        </motion.div>
      </div>
    </div>
  );
};

export default Index;
