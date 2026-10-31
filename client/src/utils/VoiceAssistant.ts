// SpeechSynthesis Voice Assistant for WattWise AI
// Supports Hindi (hi-IN) and English (en-IN / en-US) with automatic voice detection

class VoiceAssistant {
  private isEnabled: boolean = true;
  private currentLanguage: 'hi' | 'en' = 'hi';

  public setEnabled(enabled: boolean) {
    this.isEnabled = enabled;
    if (!enabled) {
      this.stop();
    }
  }

  public getEnabled(): boolean {
    return this.isEnabled;
  }

  public setLanguage(lang: 'hi' | 'en') {
    this.currentLanguage = lang;
  }

  public getLanguage(): 'hi' | 'en' {
    return this.currentLanguage;
  }

  public stop() {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
  }

  public speak(text: string, lang?: 'hi' | 'en'): Promise<void> {
    return new Promise((resolve) => {
      if (!this.isEnabled) {
        resolve();
        return;
      }

      if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
        resolve();
        return;
      }

      // Stop any ongoing speech
      window.speechSynthesis.cancel();

      const targetLang = lang || this.currentLanguage;
      const utterance = new SpeechSynthesisUtterance(text);

      utterance.lang = targetLang === 'hi' ? 'hi-IN' : 'en-IN';
      utterance.rate = targetLang === 'hi' ? 0.95 : 1.0;
      utterance.pitch = 1.02;

      // Find matching voice
      const voices = window.speechSynthesis.getVoices();
      if (voices && voices.length > 0) {
        let matchingVoice = null;
        if (targetLang === 'hi') {
          matchingVoice = voices.find(v => v.lang.startsWith('hi') || v.name.toLowerCase().includes('hindi') || v.name.toLowerCase().includes('kalpana') || v.name.toLowerCase().includes('neerja'));
        }
        if (!matchingVoice) {
          matchingVoice = voices.find(v => v.lang.startsWith('en-IN') || v.lang.startsWith('en'));
        }
        if (matchingVoice) {
          utterance.voice = matchingVoice;
        }
      }

      utterance.onend = () => resolve();
      utterance.onerror = () => resolve();

      window.speechSynthesis.speak(utterance);
    });
  }

  public speakHindiGreeting(): Promise<void> {
    const hindiWelcome = "नमस्ते! WattWise में आपका स्वागत है। मैं आपका Smart Home Energy Assistant हूँ। आइए आपके घर की ऊर्जा को समझदारी से बचाते हैं।";
    return this.speak(hindiWelcome, 'hi');
  }

  public speakEnglishGreeting(): Promise<void> {
    const englishWelcome = "Hello! Welcome to WattWise. I am your Smart Home Energy Assistant. Let's make your home intelligent and save electricity together.";
    return this.speak(englishWelcome, 'en');
  }

  public replayWelcome(lang?: 'hi' | 'en'): Promise<void> {
    const target = lang || this.currentLanguage;
    if (target === 'hi') {
      return this.speakHindiGreeting();
    }
    return this.speakEnglishGreeting();
  }
}

export const voiceAssistant = new VoiceAssistant();
