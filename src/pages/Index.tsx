import { motion } from "framer-motion";
import BackgroundOrbs from "@/components/BackgroundOrbs";
import Logo from "@/components/Logo";
import SocialLinks from "@/components/SocialLinks";

const Index = () => {
  return (
    <div className="relative min-h-screen flex flex-col items-center justify-center px-4 sm:px-6 py-8 sm:py-12 overflow-hidden">
      <BackgroundOrbs />

      <div className="relative z-10 flex flex-col items-center justify-center max-w-2xl mx-auto text-center space-y-8 sm:space-y-12">
        {/* Logo */}
        <Logo />

        {/* Main Headline */}
        <motion.div
          className="space-y-4 sm:space-y-6"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
        >
          <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-elegant font-medium leading-tight tracking-tight text-foreground px-2">
            Something fresh
            <br />
            <span className="text-muted-foreground">is coming soon</span>
          </h2>
        </motion.div>

        {/* Subtext */}
        <motion.p
          className="text-sm sm:text-base md:text-lg text-muted-foreground font-body font-light max-w-sm sm:max-w-md leading-relaxed px-4"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.5 }}
        >
          Transform your text into natural, lifelike speech. 
          A new era of voice technology is coming.
        </motion.p>

        {/* Launch Year */}
        <motion.div
          className="flex items-center gap-3"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.6 }}
        >
          <div className="h-px w-8 sm:w-12 bg-border" />
          <span className="text-xs sm:text-sm font-body text-muted-foreground tracking-widest uppercase">
            Launching 2026
          </span>
          <div className="h-px w-8 sm:w-12 bg-border" />
        </motion.div>

        {/* Social Links */}
        <SocialLinks />
      </div>

      {/* Footer */}
      <motion.footer
        className="absolute bottom-4 sm:bottom-8 left-0 right-0 text-center px-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1, delay: 1.2 }}
      >
        <p className="text-[10px] sm:text-xs text-muted-foreground/60 font-body tracking-wide">
          © 2026 tone2vibe.in · All rights reserved.
        </p>
      </motion.footer>
    </div>
  );
};

export default Index;
