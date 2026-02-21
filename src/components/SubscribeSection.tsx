import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { Mail, ArrowRight, CheckCircle2, Loader2 } from "lucide-react";

type Step = "email" | "otp" | "success";

const SubscribeSection = () => {
  const [step, setStep] = useState<Step>("email");
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = email.trim().toLowerCase();
    if (!trimmed) return;

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(trimmed)) {
      toast({ title: "Invalid email", description: "Please enter a valid email address.", variant: "destructive" });
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("send-otp", {
        body: { email: trimmed },
      });

      if (error) throw error;

      if (data?.error === "already_subscribed") {
        toast({ title: "Already subscribed!", description: "This email is already on our list. Stay tuned! 🎶" });
        setLoading(false);
        return;
      }

      if (data?.error) throw new Error(data.error);

      toast({ title: "OTP sent!", description: "Check your inbox for the verification code." });
      setStep("otp");
    } catch (err: any) {
      console.error(err);
      toast({ title: "Something went wrong", description: "Could not send OTP. Please try again.", variant: "destructive" });
    }
    setLoading(false);
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedOtp = otp.trim();
    if (trimmedOtp.length !== 6) {
      toast({ title: "Invalid OTP", description: "Please enter the 6-digit code.", variant: "destructive" });
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("verify-otp", {
        body: { email: email.trim().toLowerCase(), otp: trimmedOtp },
      });

      if (error) throw error;

      if (data?.error === "already_verified") {
        toast({ title: "Already verified!", description: "You're already subscribed. 🎵" });
        setStep("success");
        setLoading(false);
        return;
      }

      if (data?.error) {
        toast({ title: "Verification failed", description: data.error, variant: "destructive" });
        setLoading(false);
        return;
      }

      setStep("success");
      toast({ title: "Welcome aboard! 🎉", description: "You're now subscribed to Tone2vibe." });
    } catch (err: any) {
      console.error(err);
      toast({ title: "Verification failed", description: "Could not verify OTP. Please try again.", variant: "destructive" });
    }
    setLoading(false);
  };

  return (
    <motion.div
      className="w-full max-w-sm mx-auto"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8, delay: 0.6 }}
    >
      <AnimatePresence mode="wait">
        {step === "email" && (
          <motion.form
            key="email-step"
            onSubmit={handleSendOtp}
            className="flex flex-col gap-3"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3 }}
          >
            <p className="text-xs sm:text-sm text-muted-foreground font-body text-center tracking-wide">
              Get notified when we launch
            </p>
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/60" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your@email.com"
                  required
                  maxLength={255}
                  className="w-full pl-10 pr-4 py-2.5 text-sm font-body rounded-full border border-border bg-background/80 backdrop-blur-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-ring/30 focus:border-ring transition-all duration-300"
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="flex items-center justify-center w-10 h-10 rounded-full bg-primary text-primary-foreground hover:bg-primary/90 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed shrink-0"
              >
                {loading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <ArrowRight className="w-4 h-4" />
                )}
              </button>
            </div>
          </motion.form>
        )}

        {step === "otp" && (
          <motion.form
            key="otp-step"
            onSubmit={handleVerifyOtp}
            className="flex flex-col gap-3"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3 }}
          >
            <p className="text-xs sm:text-sm text-muted-foreground font-body text-center tracking-wide">
              Enter the 6-digit code sent to your email
            </p>
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={otp}
                onChange={(e) => {
                  const val = e.target.value.replace(/\D/g, "").slice(0, 6);
                  setOtp(val);
                }}
                placeholder="000000"
                maxLength={6}
                inputMode="numeric"
                autoFocus
                className="flex-1 text-center text-lg tracking-[0.5em] font-body py-2.5 rounded-full border border-border bg-background/80 backdrop-blur-sm text-foreground placeholder:text-muted-foreground/30 focus:outline-none focus:ring-2 focus:ring-ring/30 focus:border-ring transition-all duration-300"
              />
              <button
                type="submit"
                disabled={loading || otp.length !== 6}
                className="flex items-center justify-center w-10 h-10 rounded-full bg-primary text-primary-foreground hover:bg-primary/90 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed shrink-0"
              >
                {loading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <CheckCircle2 className="w-4 h-4" />
                )}
              </button>
            </div>
            <button
              type="button"
              onClick={() => { setStep("email"); setOtp(""); }}
              className="text-xs text-muted-foreground/60 hover:text-muted-foreground font-body transition-colors duration-200"
            >
              ← Use a different email
            </button>
          </motion.form>
        )}

        {step === "success" && (
          <motion.div
            key="success-step"
            className="flex flex-col items-center gap-2"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4 }}
          >
            <CheckCircle2 className="w-8 h-8 text-primary" />
            <p className="text-sm font-body text-foreground font-medium">You're in!</p>
            <p className="text-xs text-muted-foreground font-body">We'll notify you when Tone2vibe launches.</p>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default SubscribeSection;
