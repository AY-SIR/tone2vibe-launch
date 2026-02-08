import { motion } from "framer-motion";
import { Instagram, Linkedin } from "lucide-react";

// Official X Logo SVG Component
const XLogo = ({ className }) => (
  <svg
    viewBox="0 0 24 24"
    aria-hidden="true"
    className={className}
    fill="currentColor"
  >
    <path d="M18.244 2H21.5l-7.19 8.21L22 22h-6.828l-5.348-6.99L3.5 22H.244l7.695-8.79L.5 2h6.828l4.83 6.32L18.244 2zm-2.396 18h1.89L6.1 4H4.07l11.778 16z" />
  </svg>
);

const socialLinks = [
  {
    name: "Instagram",
    icon: Instagram,
    href: "https://instagram.com/tone2vibe",
    hoverColor: "group-hover:text-pink-500",
    borderColor: "group-hover:border-pink-500/50",
  },
  {
    name: "LinkedIn",
    icon: Linkedin,
    href: "https://linkedin.com/company/tone2vibe",
    hoverColor: "group-hover:text-blue-600",
    borderColor: "group-hover:border-blue-600/50",
  },
  {
    name: "X",
    icon: XLogo,
    href: "https://x.com/tone2vibe",
    hoverColor: "group-hover:text-foreground",
    borderColor: "group-hover:border-foreground/40",
  },
];

const SocialLinks = () => {
  return (
    <motion.div
      className="flex items-center justify-center gap-6"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8, delay: 0.8 }}
    >
      {socialLinks.map((social, index) => (
        <motion.a
          key={social.name}
          href={social.href}
          target="_blank"
          rel="noopener noreferrer"
          className={`group relative p-3 rounded-full border border-border bg-card/50 backdrop-blur-sm transition-all duration-300 hover:bg-card ${social.borderColor}`}
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.9 + index * 0.1 }}
          whileHover={{ scale: 1.1, y: -2 }}
          whileTap={{ scale: 0.95 }}
          aria-label={social.name}
        >
          <social.icon
            className={`w-5 h-5 text-muted-foreground transition-all duration-300 ease-in-out ${social.hoverColor}`}
          />
        </motion.a>
      ))}
    </motion.div>
  );
};

export default SocialLinks;
