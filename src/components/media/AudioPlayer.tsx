'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  Play,
  Pause,
  RotateCcw,
  Volume2,
  Radio,
  FileText,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import {
  estimateSpokenDurationSeconds,
  formatSecondsToTime,
  parseTimeToSeconds
} from '@/lib/timeUtils';

interface AudioPlayerProps {
  title: string;
  narrationText: string;
  duration?: string;
}

export const AudioPlayer: React.FC<AudioPlayerProps> = ({
  title,
  narrationText,
  duration
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [showTranscript, setShowTranscript] = useState(false);
  const [speechSupported, setSpeechSupported] = useState(true);

  // Calculate actual duration based on text word count (avoiding dummy default values)
  const computedSeconds = estimateSpokenDurationSeconds(narrationText, 140);
  const totalSeconds =
    duration && duration !== '1:45' && parseTimeToSeconds(duration) > 0
      ? parseTimeToSeconds(duration)
      : computedSeconds;

  const formattedTotalDuration = formatSecondsToTime(totalSeconds);

  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const startTimeRef = useRef<number>(0);
  const pausedOffsetRef = useRef<number>(0);
  const timerRef = useRef<any>(null);

  useEffect(() => {
    if (typeof window !== 'undefined' && !('speechSynthesis' in window)) {
      setSpeechSupported(false);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  // Reset timestamps when narration text changes
  useEffect(() => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    if (timerRef.current) clearInterval(timerRef.current);
    setIsPlaying(false);
    setCurrentTime(0);
    setProgress(0);
    pausedOffsetRef.current = 0;
  }, [narrationText]);

  const cleanTextForSpeech = (text: string) => {
    return text
      .replace(/[#*`_~]/g, '')
      .replace(/https?:\/\/\S+/g, '')
      .replace(/\n+/g, '. ')
      .trim();
  };

  const startPlaybackTimer = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    startTimeRef.current = Date.now() - (pausedOffsetRef.current * 1000);

    timerRef.current = setInterval(() => {
      const elapsed = (Date.now() - startTimeRef.current) / 1000;
      const safeTime = Math.min(totalSeconds, elapsed);
      setCurrentTime(safeTime);
      setProgress(Math.min(100, (safeTime / totalSeconds) * 100));

      if (safeTime >= totalSeconds) {
        clearInterval(timerRef.current);
      }
    }, 200);
  };

  const stopPlaybackTimer = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    pausedOffsetRef.current = currentTime;
  };

  const handlePlayPause = () => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;

    if (isPlaying) {
      window.speechSynthesis.pause();
      stopPlaybackTimer();
      setIsPlaying(false);
    } else {
      if (window.speechSynthesis.paused) {
        window.speechSynthesis.resume();
        startPlaybackTimer();
        setIsPlaying(true);
      } else {
        window.speechSynthesis.cancel();
        const speechText = cleanTextForSpeech(narrationText);
        const utterance = new SpeechSynthesisUtterance(speechText);
        utteranceRef.current = utterance;

        // Select best available voice
        const voices = window.speechSynthesis.getVoices();
        const englishVoice = voices.find(
          v =>
            v.lang.startsWith('en') &&
            (v.name.includes('Natural') || v.name.includes('Google') || v.name.includes('Samantha'))
        );
        if (englishVoice) {
          utterance.voice = englishVoice;
        }

        utterance.rate = 1.0;
        utterance.pitch = 1.0;

        utterance.onboundary = (event) => {
          if (speechText.length > 0) {
            const charRatio = event.charIndex / speechText.length;
            const liveTime = charRatio * totalSeconds;
            setCurrentTime(liveTime);
            setProgress(Math.min(100, Math.round(charRatio * 100)));
          }
        };

        utterance.onend = () => {
          if (timerRef.current) clearInterval(timerRef.current);
          setIsPlaying(false);
          setCurrentTime(totalSeconds);
          setProgress(100);
          pausedOffsetRef.current = 0;
        };

        utterance.onerror = () => {
          if (timerRef.current) clearInterval(timerRef.current);
          setIsPlaying(false);
        };

        window.speechSynthesis.speak(utterance);
        startPlaybackTimer();
        setIsPlaying(true);
      }
    }
  };

  const handleRestart = () => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      if (timerRef.current) clearInterval(timerRef.current);
      setIsPlaying(false);
      setCurrentTime(0);
      setProgress(0);
      pausedOffsetRef.current = 0;
      setTimeout(() => handlePlayPause(), 150);
    }
  };

  return (
    <div className="w-full bg-white rounded-2xl border border-[#DCE7D9] overflow-hidden shadow-xs mb-6">
      {/* Top Header */}
      <div className="px-5 py-3 border-b border-[#F0F5EE] flex items-center justify-between bg-[#FAFDF9]">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-md bg-[#EAF4E3] text-[#477A3C] flex items-center justify-center">
            <Radio className="w-3.5 h-3.5" />
          </div>
          <span className="text-xs font-bold text-gray-800">Grounded Audio Briefing</span>
          <span className="text-[10px] bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full font-semibold border border-emerald-300">
            Playable Narration
          </span>
        </div>

        {/* Real Dynamic Duration Timestamp */}
        <span className="text-xs font-mono text-[#477A3C] font-semibold">
          {formattedTotalDuration}
        </span>
      </div>

      {/* Main Player Box */}
      <div className="p-6 bg-gradient-to-b from-[#FAFDF9] to-white">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
          {/* Play/Pause and Restart */}
          <div className="flex items-center gap-3">
            <button
              onClick={handlePlayPause}
              className="w-12 h-12 rounded-full bg-[#477A3C] hover:bg-[#3A6331] text-white flex items-center justify-center transition-all shadow-md shadow-[#477A3C]/20 active:scale-95 cursor-pointer"
              type="button"
              title={isPlaying ? 'Pause Audio' : 'Play Audio'}
            >
              {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 ml-0.5" />}
            </button>
            <button
              onClick={handleRestart}
              className="w-9 h-9 rounded-full bg-white border border-[#DCE7D9] hover:bg-[#F0F5EE] text-gray-600 flex items-center justify-center transition shadow-2xs cursor-pointer"
              type="button"
              title="Restart from beginning"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>

          {/* Dynamic Pulsing Waveform Visualizer */}
          <div className="flex-1 w-full flex items-center justify-center gap-1 h-10 px-4">
            {[16, 28, 40, 22, 34, 18, 48, 25, 38, 19, 32, 44, 20, 28, 36, 15, 42, 26, 33, 20, 30, 46, 24, 18].map(
              (height, idx) => (
                <div
                  key={idx}
                  className={`w-1 rounded-full transition-all duration-200 ${
                    isPlaying ? 'bg-[#477A3C] animate-pulse' : 'bg-gray-200'
                  }`}
                  style={{
                    height: isPlaying
                      ? `${Math.max(8, (height * ((idx % 3) + 1)) % 38)}px`
                      : `${height / 2}px`,
                    animationDelay: `${idx * 60}ms`
                  }}
                />
              )
            )}
          </div>

          {/* Voice Indicator Badge */}
          <div className="flex items-center gap-2 text-xs text-gray-500 font-medium shrink-0">
            <Volume2 className="w-4 h-4 text-[#477A3C]" />
            <span>AI Voice Synthesizer</span>
          </div>
        </div>

        {/* Audio Progress Bar with Real Elapsed & Total Timestamps */}
        <div className="mt-5 space-y-1.5">
          <div className="w-full h-1.5 bg-[#EDF3EB] rounded-full overflow-hidden">
            <div
              className="h-full bg-[#477A3C] transition-all duration-200 rounded-full"
              style={{ width: `${progress}%` }}
            />
          </div>
          <div className="flex justify-between text-[11px] text-gray-500 font-mono">
            <span className="font-semibold text-[#345B2B]">
              {formatSecondsToTime(currentTime)} / {formattedTotalDuration}
            </span>
            <span className="text-gray-400">
              {isPlaying
                ? `${Math.round(progress)}% Narrated`
                : progress === 100
                ? 'Completed'
                : 'Ready to listen'}
            </span>
          </div>
        </div>
      </div>

      {/* Transcript Accordion */}
      <div className="border-t border-[#F0F5EE]">
        <button
          onClick={() => setShowTranscript(!showTranscript)}
          className="w-full px-5 py-2.5 flex items-center justify-between text-xs font-semibold text-gray-600 hover:text-gray-900 hover:bg-[#F9FCF8] transition cursor-pointer"
          type="button"
        >
          <span className="flex items-center gap-2">
            <FileText className="w-3.5 h-3.5 text-[#477A3C]" />
            <span>Spoken Audio Script &amp; Narration Text</span>
          </span>
          {showTranscript ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
        </button>

        {showTranscript && (
          <div className="px-5 py-3.5 bg-[#FAFDF9] text-xs text-gray-700 leading-relaxed font-sans border-t border-[#F0F5EE] animate-fadeIn whitespace-pre-line">
            {narrationText}
          </div>
        )}
      </div>
    </div>
  );
};
