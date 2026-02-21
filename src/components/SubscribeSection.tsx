import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { Mail, ArrowRight, CheckCircle2, Loader2, X, RefreshCw } from "lucide-react";

type Step = "email" | "otp" | "success";

const COOLDOWN_SECONDS = 60;

const SubscribeSection = () => {
  const [step, setStep] = useState<Step>("email");
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [showOtpModal, setShowOtpModal] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const cooldownRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const startCooldown = useCallback(() => {
    setCooldown(COOLDOWN_SECONDS);
    if (cooldownRef.current) clearInterval(cooldownRef.current);
    cooldownRef.current = setInterval(() => {
      setCooldown((prev) => {
        if (prev <= 1) {
          if (cooldownRef.current) clearInterval(cooldownRef.current);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }, []);

  useEffect(() => {
    return () => {
      if (cooldownRef.current) clearInterval(cooldownRef.current);
    };
  }, []);

  const handleSendOtp = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const trimmed = email.trim().toLowerCase();
    if (!trimmed) return;

    const emailRegex = /^[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}$/;
    if (!emailRegex.test(trimmed) || trimmed.length > 254) {
      toast({ title: "Invalid email", description: "Please enter a valid email address.", variant: "destructive" });
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("send-otp", {
        body: { email: trimmed },
      });

      if (error) throw error;

      if (!data?.success) {
        const code = data?.code;
        if (code === "already_subscribed") {
          toast({ title: "Already subscribed! 🎶", description: "This email is already on our list. Stay tuned!" });
        } else if (code === "rate_limited") {
          toast({ title: "Slow down", description: "Please wait before requesting another code." });
        } else {
          toast({ title: "Couldn't send code", description: data?.message || "Please try again.", variant: "destructive" });
        }
        setLoading(false);
        return;
      }

      toast({ title: "Code sent! ✉️", description: "Check your inbox for the 6-digit code." });
      startCooldown();
      setStep("otp");
      setShowOtpModal(true);
      setOtp("");
    } catch (err) {
      console.error(err);
      toast({ title: "Something went wrong", description: "Could not send code. Please try again.", variant: "destructive" });
    }
    setLoading(false);
  };

  const handleResendOtp = async () => {
    if (cooldown > 0 || loading) return;
    await handleSendOtp();
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedOtp = otp.trim();
    if (!/^\d{6}$/.test(trimmedOtp)) {
      toast({ title: "Invalid code", description: "Please enter the 6-digit code.", variant: "destructive" });
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("verify-otp", {
        body: { email: email.trim().toLowerCase(), otp: trimmedOtp },
      });

      if (error) throw error;

      if (!data?.success) {
        const code = data?.code;
        if (code === "already_verified") {
          toast({ title: "Already verified! 🎵", description: "You're already subscribed." });
          setStep("success");
          setShowOtpModal(false);
        } else if (code === "expired") {
          toast({ title: "Code expired", description: "Please request a new code.", variant: "destructive" });
        } else if (code === "wrong_otp") {
          toast({ title: "Wrong code", description: "The code doesn't match. Try again.", variant: "destructive" });
          setOtp("");
        } else {
          toast({ title: "Verification failed", description: data?.message || "Please try again.", variant: "destructive" });
        }
        setLoading(false);
        return;
      }

      setStep("success");
      setShowOtpModal(false);
      toast({ title: "Welcome aboard! 🎉", description: "You're now subscribed to Tone2vibe." });
    } catch (err) {
      console.error(err);
      toast({ title: "Verification failed", description: "Could not verify. Please try again.", variant: "destructive" });
    }
    setLoading(false);
  };

  const handleCloseModal = () => {
    setShowOtpModal(false);
    setStep("email");
    setOtp("");
  };

  // Mask email for display
  const maskedEmail = (() => {
    const [local, domain] = email.split("@");
    if (!local || !domain) return email;
    const show = Math.min(3, local.length);
    return local.slice(0, show) + "***@" + domain;
  })();

  return (
    <>
      <motion.div
        className="w-full max-w-sm mx-auto"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 0.6 }}
      >
        <AnimatePresence mode="wait">
          {step !== "success" ? (
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
                    maxLength={254}
                    autoComplete="email"
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
          ) : (
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

      {/* OTP Verification Modal */}
      <AnimatePresence>
        {showOtpModal && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            {/* Backdrop */}
            <motion.div
              className="absolute inset-0 bg-foreground/10 backdrop-blur-sm"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={handleCloseModal}
            />

            {/* Modal */}
            <motion.div
              className="relative w-full max-w-sm bg-card border border-border rounded-2xl shadow-lg p-6 sm:p-8"
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              transition={{ duration: 0.3, ease: "easeOut" }}
            >
              {/* Close button */}
              <button
                onClick={handleCloseModal}
                className="absolute top-3 right-3 w-8 h-8 flex items-center justify-center rounded-full text-muted-foreground hover:text-foreground hover:bg-muted transition-colors duration-200"
                aria-label="Close"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="flex flex-col items-center gap-5">
                {/* Header */}
                <div className="text-center space-y-1.5">
                  <div className="w-12 h-12 rounded-full bg-accent flex items-center justify-center mx-auto mb-2">
                    <Mail className="w-5 h-5 text-accent-foreground" />
                  </div>
                  <h3 className="text-lg font-elegant font-semibold text-foreground">Verify your email</h3>
                  <p className="text-xs text-muted-foreground font-body">
                    We sent a 6-digit code to <span className="text-foreground font-medium">{maskedEmail}</span>
                  </p>
                </div>

                {/* OTP Form */}
                <form onSubmit={handleVerifyOtp} className="w-full flex flex-col gap-4">
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
                    autoComplete="one-time-code"
                    autoFocus
                    className="w-full text-center text-2xl tracking-[0.6em] font-body py-3 rounded-xl border border-border bg-background text-foreground placeholder:text-muted-foreground/25 focus:outline-none focus:ring-2 focus:ring-ring/30 focus:border-ring transition-all duration-300"
                  />

                  <button
                    type="submit"
                    disabled={loading || otp.length !== 6}
                    className="w-full flex items-center justify-center gap-2 py-2.5 rounded-full bg-primary text-primary-foreground font-body text-sm font-medium hover:bg-primary/90 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <>
                        <CheckCircle2 className="w-4 h-4" />
                        Verify
                      </>
                    )}
                  </button>
                </form>

                {/* Resend & change email */}
                <div className="flex flex-col items-center gap-2 w-full">
                  <button
                    type="button"
                    onClick={handleResendOtp}
                    disabled={cooldown > 0 || loading}
                    className="flex items-center gap-1.5 text-xs font-body text-muted-foreground hover:text-foreground disabled:opacity-40 disabled:cursor-not-allowed transition-colors duration-200"
                  >
                    <RefreshCw className={`w-3 h-3 ${cooldown > 0 ? "" : "hover:rotate-180 transition-transform duration-500"}`} />
                    {cooldown > 0 ? `Resend in ${cooldown}s` : "Resend code"}
                  </button>
                  <button
                    type="button"
                    onClick={handleCloseModal}
                    className="text-xs text-muted-foreground/50 hover:text-muted-foreground font-body transition-colors duration-200"
                  >
                    ← Use a different email
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default SubscribeSection;
