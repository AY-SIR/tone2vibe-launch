import { useState } from "react";
import { motion } from "framer-motion";
import { ArrowRight, Check } from "lucide-react";

const EmailSubscribe = () => {
  const [email, setEmail] = useState("");
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isFocused, setIsFocused] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (email) {
      setIsSubmitted(true);
      setTimeout(() => {
        setEmail("");
        setIsSubmitted(false);
      }, 3000);
    }
  };

  return (
    <motion.form
      onSubmit={handleSubmit}
      className="w-full max-w-md mx-auto"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8, delay: 0.8 }}
    >
      <div
        className={`relative flex items-center bg-card border rounded-full p-1.5 transition-all duration-300 ${
          isFocused ? "border-primary/30 shadow-lg shadow-primary/5" : "border-border"
        }`}
      >
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          placeholder="Enter your email"
          className="flex-1 bg-transparent px-5 py-3 text-sm font-body text-foreground placeholder:text-muted-foreground focus:outline-none"
          required
          disabled={isSubmitted}
        />
        <motion.button
          type="submit"
          disabled={isSubmitted}
          className="flex items-center justify-center gap-2 bg-primary text-primary-foreground px-6 py-3 rounded-full text-sm font-medium font-body transition-all duration-300 hover:opacity-90 disabled:opacity-70"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          {isSubmitted ? (
            <>
              <Check className="w-4 h-4" />
              <span>Subscribed</span>
            </>
          ) : (
            <>
              <span>Notify Me</span>
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </motion.button>
      </div>
      <p className="text-center text-xs text-muted-foreground mt-4 font-body">
        Be the first to know. No spam, ever.
      </p>
    </motion.form>
  );
};

export default EmailSubscribe;
