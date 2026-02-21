import { motion } from "framer-motion";
import BackgroundOrbs from "@/components/BackgroundOrbs";
import Logo from "@/components/Logo";
import SubscribeSection from "@/components/SubscribeSection";


const Index = () => {
  return (
    <div className="relative min-h-[100dvh] flex flex-col justify-between px-4 sm:px-6 overflow-hidden">

      <BackgroundOrbs />

      {/* Center Content */}
      <div className="relative z-10 flex flex-col items-center justify-center flex-1 max-w-2xl mx-auto text-center space-y-8 sm:space-y-12">

        {/* Logo */}
        <Logo />

        {/* Headline */}
        <motion.div
          className="space-y-4 sm:space-y-6"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
        >
          <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-elegant font-medium leading-tight tracking-tight text-foreground px-2">
            Something fresh
            <br />
            <span className="text-muted-foreground">
              is coming soon
            </span>
          </h2>
        </motion.div>

        {/* Launch Year */}
        <motion.div
          className="flex items-center justify-center gap-3"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.9 }}
        >
          <div className="h-px w-8 sm:w-12 bg-border" />
          <span className="text-xs sm:text-sm font-body text-muted-foreground tracking-widest uppercase">
            Launching Soon
          </span>
          <div className="h-px w-8 sm:w-12 bg-border" />
        </motion.div>

        {/* Subscribe Section */}
        <SubscribeSection />

        {/* Contact Email */}
        <p className="text-xs sm:text-sm text-muted-foreground/80 font-body tracking-wide">
          For any queries:
          <a
            href="mailto:info@tone2vibe.in"
            className="ml-1 underline underline-offset-4 hover:text-foreground hover:opacity-80 transition-all duration-300"
          >
            info@tone2vibe.in
          </a>
        </p>
      </div>

      {/* Footer */}
      <motion.footer
        className="relative z-10 text-center py-4"
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
