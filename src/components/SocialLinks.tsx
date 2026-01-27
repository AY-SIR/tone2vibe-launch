import { motion } from "framer-motion";
import { Instagram, Linkedin, Twitter } from "lucide-react";

const socialLinks = [
  {
    name: "Instagram",
    icon: Instagram,
    href: "https://instagram.com/tone2vibe",
  },
  {
    name: "LinkedIn",
    icon: Linkedin,
    href: "https://linkedin.com/company/tone2vibe",
  },
  {
    name: "Twitter",
    icon: Twitter,
    href: "https://twitter.com/tone2vibe",
  },
];

const SocialLinks = () => {
  return (
    <motion.div
      className="flex items-center justify-center gap-6 "
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
          className="group relative p-3 rounded-full border border-border bg-card/50 backdrop-blur-sm transition-all duration-300 hover:border-foreground/30 hover:bg-card"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.9 + index * 0.1 }}
          whileHover={{ scale: 1.1, y: -2 }}
          whileTap={{ scale: 0.95 }}
          aria-label={social.name}
        >
          <social.icon className="w-5 h-5 text-muted-foreground transition-colors duration-300 group-hover:text-foreground" />
        </motion.a>
      ))}
    </motion.div>
  );
};

export default SocialLinks;
