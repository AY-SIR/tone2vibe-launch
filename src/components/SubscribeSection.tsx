import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { Mail, ArrowRight, CheckCircle2, Loader2, X, RefreshCw, Users } from "lucide-react";

type Step = "email" | "otp" | "success";

const COOLDOWN_SECONDS = 60;

const SubscribeSection = () => {
  const [step, setStep] = useState<Step>("email");
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [showOtpModal, setShowOtpModal] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const [subscriberCount, setSubscriberCount] = useState<number | null>(null);
  const cooldownRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchSubscriberCount = useCallback(async () => {
    try {
      const { count, error } = await supabase
        .from("subscribers")
        .select("*", { count: "exact", head: true })
        .eq("verified", true);
      if (!error && count !== null) setSubscriberCount(count);
    } catch {}
  }, []);

  useEffect(() => {
    fetchSubscriberCount();
  }, [fetchSubscriberCount]);

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

  // AUTO-VERIFY: Triggers when 6th digit is entered
  useEffect(() => {
    if (otp.length === 6 && !loading && step === "otp") {
      handleVerifyOtp();
    }
  }, [otp]);

  const validateEmail = (email: string) => {
    const emailRegex = /^[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}$/;
    if (!email) {
      toast({ title: "Email required", description: "Please enter your email address.", variant: "destructive" });
      return false;
    }
    if (!emailRegex.test(email) || email.length > 254) {
      toast({ title: "Invalid email", description: "Please enter a valid email address.", variant: "destructive" });
      return false;
    }
    return true;
  };

  const handleSendOtp = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const trimmed = email.trim().toLowerCase();
    if (!validateEmail(trimmed)) return;

    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("send-otp", {
        body: { email: trimmed },
      });

      if (error) throw error;

      if (!data?.success) {
        const code = data?.code;
        if (code === "already_subscribed") {
          toast({ title: "Already subscribed!", description: "This email is already on our list." });
          setStep("success");
        } else if (code === "rate_limited") {
          toast({ title: "Slow down", description: "Please wait before requesting another code.", variant: "destructive" });
        } else {
          toast({ title: "Error", description: data?.message || "Please try again.", variant: "destructive" });
        }
        setLoading(false);
        return;
      }

      toast({ title: "Code sent!", description: "Check your inbox for the 6-digit code." });
      startCooldown();
      setStep("otp");
      setShowOtpModal(true);
      setOtp("");
    } catch (err) {
      console.error(err);
      toast({ title: "Temporary issue", description: "We're unable to connect right now. Please check your internet and try again shortly.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const trimmedOtp = otp.trim();
    if (trimmedOtp.length !== 6) return;

    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("verify-otp", {
        body: { email: email.trim().toLowerCase(), otp: trimmedOtp },
      });

      if (error) throw error;

      if (!data?.success) {
        const code = data?.code;
        if (code === "already_verified") {
          setStep("success");
          setShowOtpModal(false);
        } else if (code === "wrong_otp") {
          toast({ title: "Incorrect code", description: "The code you entered is invalid.", variant: "destructive" });
          setOtp("");
        } else {
          toast({ title: "Verification failed", description: data?.message || "Please try again.", variant: "destructive" });
        }
        setLoading(false);
        return;
      }

      setStep("success");
      setShowOtpModal(false);
      toast({ title: "Welcome aboard!", description: "You're now subscribed to Tone2vibe." });
      fetchSubscriberCount(); // Refresh count after successful subscribe
    } catch (err) {
      console.error(err);
      toast({ title: "Error", description: "Something went wrong during verification.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleCloseModal = () => {
    setShowOtpModal(false);
    setStep("email");
    setOtp("");
  };

  const maskedEmail = (() => {
    const [local, domain] = email.split("@");
    if (!local || !domain) return email;
    return `${local.substring(0, 2)}***@${domain}`;
  })();

  return (
    <>
      <motion.div
        className="w-full max-w-sm mx-auto"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 0.2 }}
      >
        <AnimatePresence mode="wait">
          {step !== "success" ? (
            <motion.form
              key="email-step"
              onSubmit={handleSendOtp}
              noValidate
              className="flex flex-col gap-3"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3 }}
            >
              <div className="flex items-center gap-2">
                <div className="relative flex-1">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/60 z-10 pointer-events-none" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    maxLength={254}
                    placeholder="your@email.com"
                    className="w-full pl-10 pr-4 py-2.5 text-sm font-body rounded-full border border-border bg-background/80 backdrop-blur-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-ring/30 focus:border-ring transition-all duration-300"
                  />
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex items-center justify-center w-10 h-10 rounded-full bg-primary text-primary-foreground hover:bg-primary/90 transition-all duration-300 disabled:opacity-50 shrink-0 shadow-lg shadow-primary/20"
                >
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ArrowRight className="w-4 h-4" />}
                </button>
              </div>
            </motion.form>
          ) : (
            <motion.div
              key="success-step"
              className="flex flex-col items-center gap-2 py-4"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ type: "spring", damping: 12 }}
            >
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-1">
                <CheckCircle2 className="w-6 h-6 text-primary" />
              </div>
              <p className="text-sm font-body text-foreground font-medium">You're in!</p>
              <p className="text-xs text-muted-foreground font-body text-center">We'll notify you when Tone2vibe launches.</p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Subscriber Count */}
        {subscriberCount !== null && subscriberCount > 0 && (
          <motion.div
            className="flex items-center justify-center gap-1.5 mt-3"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.5 }}
          >
            <Users className="w-3 h-3 text-muted-foreground/60" />
            <span className="text-[11px] sm:text-xs text-muted-foreground/60 font-body tracking-wide">
              {subscriberCount.toLocaleString()} {subscriberCount === 1 ? "person has" : "people have"} joined
            </span>
          </motion.div>
        )}
      </motion.div>

      {/* OTP Modal */}
      <AnimatePresence>
        {showOtpModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 overflow-hidden">
            <motion.div
              className="absolute inset-0 bg-background/80 backdrop-blur-md"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={handleCloseModal}
            />

            <motion.div
              className="relative w-full max-w-sm bg-card border border-border rounded-3xl shadow-2xl p-6 sm:p-8 z-10"
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
            >
              <button
                onClick={handleCloseModal}
                className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full text-muted-foreground hover:bg-muted transition-colors"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="flex flex-col items-center gap-6">
                <div className="text-center space-y-2">
                  <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-2 rotate-3">
                    <Mail className="w-6 h-6 text-primary -rotate-3" />
                  </div>
                  <h3 className="text-xl font-semibold tracking-tight">Check your email</h3>
                  <p className="text-xs text-muted-foreground px-4">
                    Enter the 6-digit code sent to <span className="text-foreground font-medium">{maskedEmail}</span>
                  </p>
                </div>

                <form onSubmit={handleVerifyOtp} noValidate className="w-full flex flex-col gap-4">
                  <input
                    type="text"
                    inputMode="numeric"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                    placeholder="••••••"
                    className="w-full text-center text-3xl tracking-[0.4em] font-mono py-4 rounded-2xl border border-border bg-muted/50 focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all outline-none"
                    autoFocus
                    autoComplete="one-time-code"
                  />

                  <button
                    type="submit"
                    disabled={loading || otp.length !== 6}
                    className="w-full h-12 flex items-center justify-center gap-2 rounded-xl bg-primary text-primary-foreground font-medium hover:opacity-90 transition-all disabled:opacity-50"
                  >
                    {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Confirm & Subscribe"}
                  </button>
                </form>

                <div className="flex flex-col items-center gap-3">
                  <button
                    type="button"
                    onClick={() => !cooldown && handleSendOtp()}
                    disabled={cooldown > 0 || loading}
                    className="flex items-center gap-2 text-xs font-medium text-muted-foreground hover:text-primary disabled:opacity-50 transition-colors"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${cooldown === 0 && !loading ? "hover:rotate-180 transition-transform" : ""}`} />
                    {cooldown > 0 ? `Resend in ${cooldown}s` : "Resend code"}
                  </button>
                  <button
                    type="button"
                    onClick={handleCloseModal}
                    className="text-xs text-muted-foreground/60 hover:underline"
                  >
                    Use a different email
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
};

export default SubscribeSection;
