// WattWise AI — Welcome page: Hindi AI greeting + Get Started
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Zap, Volume2, VolumeX } from 'lucide-react';
import { useStore } from '../store';
import { playSound } from '../sound';
import { useState } from 'react';

export default function Welcome() {
  const setHasSeenWelcome = useStore((s) => s.setHasSeenWelcome);
  const navigate = useNavigate();
  const [isSpeaking, setIsSpeaking] = useState(false);

  const greeting = `नमस्ते! 🙏
WattWise AI में आपका स्वागत है।
मैं आपके घर की बिजली समझने,
बेकार ऊर्जा पहचानने और आपका बिल कम करने में आपकी मदद करूँगा।`;

  const handleStart = () => {
    playSound('activate');
    setHasSeenWelcome(true);
    navigate('/');
  };

  const handleVoice = () => {
    if (isSpeaking) {
      speechSynthesis.cancel();
      setIsSpeaking(false);
      return;
    }
    const utterance = new SpeechSynthesisUtterance(
      'Namaste! WattWise AI mein aapka swagat hai. Main aapke ghar ki bijli samajhne, bekaar oorja pehchanne aur aapka bill kam karne mein aapki madad karunga.'
    );
    utterance.lang = 'hi-IN';
    utterance.rate = 0.9;
    utterance.onend = () => setIsSpeaking(false);
    setIsSpeaking(true);
    speechSynthesis.speak(utterance);
  };

  return (
    <div className="fixed inset-0 bg-ww-bg flex items-center justify-center overflow-hidden">
      {/* Ambient background glow */}
      <div className="absolute inset-0 overflow-hidden">
        <motion.div
          className="absolute w-[600px] h-[600px] rounded-full"
          style={{
            background: 'radial-gradient(circle, rgba(212,160,71,0.06) 0%, transparent 70%)',
            top: '20%',
            left: '30%',
          }}
          animate={{ scale: [1, 1.2, 1], opacity: [0.5, 0.8, 0.5] }}
          transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
        />
        <motion.div
          className="absolute w-[400px] h-[400px] rounded-full"
          style={{
            background: 'radial-gradient(circle, rgba(232,118,45,0.05) 0%, transparent 70%)',
            bottom: '10%',
            right: '20%',
          }}
          animate={{ scale: [1, 1.3, 1], opacity: [0.3, 0.6, 0.3] }}
          transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut', delay: 2 }}
        />

        {/* Floating particles */}
        {Array.from({ length: 20 }).map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-[2px] h-[2px] rounded-full bg-ww-amber/30"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
            }}
            animate={{
              y: [0, -(20 + Math.random() * 30), 0],
              opacity: [0, 0.6, 0],
            }}
            transition={{
              duration: 4 + Math.random() * 4,
              repeat: Infinity,
              delay: Math.random() * 5,
            }}
          />
        ))}
      </div>

      {/* Content */}
      <motion.div
        className="relative z-10 text-center max-w-lg px-6"
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: 'easeOut' }}
      >
        {/* Logo */}
        <motion.div
          className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br from-ww-amber/20 to-ww-orange/20 border border-ww-amber/30 mb-8"
          initial={{ scale: 0, rotate: -180 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: 'spring', damping: 12, delay: 0.3 }}
        >
          <Zap className="w-10 h-10 text-ww-amber" />
        </motion.div>

        {/* App name */}
        <motion.h1
          className="text-4xl md:text-5xl font-bold mb-8"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          <span className="text-gradient">WattWise AI</span>
        </motion.h1>

        {/* Hindi greeting */}
        <motion.div
          className="glass-card p-6 md:p-8 text-left mb-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
        >
          <p className="text-lg md:text-xl text-ww-ivory leading-relaxed whitespace-pre-line">
            {greeting}
          </p>
          <button
            onClick={handleVoice}
            className="mt-4 flex items-center gap-2 text-sm text-ww-amber-dim hover:text-ww-amber transition-colors"
          >
            {isSpeaking ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
            {isSpeaking ? 'Stop' : 'Listen in Hindi 🔊'}
          </button>
        </motion.div>

        {/* Get Started button */}
        <motion.button
          onClick={handleStart}
          className="px-8 py-4 rounded-2xl bg-gradient-to-r from-ww-amber to-ww-orange
            text-ww-bg font-bold text-lg tracking-wide
            hover:shadow-xl hover:shadow-ww-amber/20 transition-all duration-300
            active:scale-95"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1 }}
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
        >
          शुरू करें / Get Started
        </motion.button>
      </motion.div>
    </div>
  );
}
