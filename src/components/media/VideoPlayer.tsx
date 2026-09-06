'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { StoryboardScene } from '@/types';
import {
  Play,
  Pause,
  SkipForward,
  SkipBack,
  Clapperboard,
  Video
} from 'lucide-react';
import {
  calculateStoryboardTimestamps,
  formatSecondsToTime,
  parseTimeToSeconds,
  estimateSpokenDurationSeconds
} from '@/lib/timeUtils';

interface VideoPlayerProps {
  title: string;
  storyboard?: StoryboardScene[];
  duration?: string;
  imageUrl?: string;
}

export const VideoPlayer: React.FC<VideoPlayerProps> = ({
  title,
  storyboard = [],
  duration,
  imageUrl
}) => {
  const [currentSceneIndex, setCurrentSceneIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);

  const timerRef = useRef<any>(null);

  // Compute realistic, mathematically precise scenes and timestamps
  const scenes: StoryboardScene[] = useMemo(() => {
    const rawScenes: Array<{
      title: string;
      visualDescription: string;
      narration: string;
      timestamp?: string;
    }> =
      storyboard && storyboard.length > 0
        ? storyboard
        : [
            {
              title: 'Scene 1: Hook & Strategic Context',
              visualDescription: 'Kinetic title sequence introducing the primary document headline.',
              narration: title
            },
            {
              title: 'Scene 2: Evidence & Grounded Findings',
              visualDescription: 'High-contrast data highlight cards and metric callouts.',
              narration:
                'Core factual takeaways and critical claims grounded directly from verified document records.'
            },
            {
              title: 'Scene 3: Deep Dive Analysis & Metrics',
              visualDescription: 'Split screen data visualization showcasing verified trends and operational impact.',
              narration:
                'Comprehensive quantitative breakdown validating primary metrics with zero factual drift.'
            },
            {
              title: 'Scene 4: Executive Takeaway & Wrap-up',
              visualDescription: 'Closing hero frame with InfoMorph verification seal and next steps.',
              narration:
                'Explore the full canonical transformation verified against canonical grounding references.'
            }
          ];

    // Check if timestamps are dummy placeholders (e.g., '0:00 - 0:30', '0:00 - 0:25')
    const hasDummyTimestamps = rawScenes.some(
      s =>
        !s.timestamp ||
        s.timestamp === '0:00 - 0:30' ||
        s.timestamp === '0:00 - 0:25' ||
        s.timestamp === '0:30 - 1:15'
    );

    if (hasDummyTimestamps) {
      return calculateStoryboardTimestamps(rawScenes);
    }

    return rawScenes as StoryboardScene[];
  }, [storyboard, title]);

  // Calculate start and end seconds for each scene
  const sceneIntervals = useMemo(() => {
    let accumulated = 0;
    return scenes.map(s => {
      const match = s.timestamp.match(/(\d+:\d+)\s*-\s*(\d+:\d+)/);
      if (match) {
        const start = parseTimeToSeconds(match[1]);
        const end = parseTimeToSeconds(match[2]);
        accumulated = end;
        return { start, end, duration: Math.max(1, end - start) };
      }
      const dur = estimateSpokenDurationSeconds(s.narration, 130);
      const start = accumulated;
      const end = start + dur;
      accumulated = end;
      return { start, end, duration: dur };
    });
  }, [scenes]);

  const totalVideoSeconds = useMemo(() => {
    if (sceneIntervals.length > 0) {
      return sceneIntervals[sceneIntervals.length - 1].end;
    }
    return 60;
  }, [sceneIntervals]);

  const totalDurationStr = formatSecondsToTime(totalVideoSeconds);
  const currentScene = scenes[currentSceneIndex] || scenes[0];

  // Live video playhead timer
  useEffect(() => {
    if (isPlaying) {
      timerRef.current = setInterval(() => {
        setCurrentTime(prev => {
          const next = prev + 1;
          if (next >= totalVideoSeconds) {
            setIsPlaying(false);
            return totalVideoSeconds;
          }

          // Check if we entered a new scene
          const activeIdx = sceneIntervals.findIndex(
            interval => next >= interval.start && next < interval.end
          );
          if (activeIdx !== -1 && activeIdx !== currentSceneIndex) {
            setCurrentSceneIndex(activeIdx);
          }

          return next;
        });
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isPlaying, totalVideoSeconds, sceneIntervals, currentSceneIndex]);

  const jumpToScene = (idx: number) => {
    const targetIdx = Math.max(0, Math.min(scenes.length - 1, idx));
    setCurrentSceneIndex(targetIdx);
    if (sceneIntervals[targetIdx]) {
      setCurrentTime(sceneIntervals[targetIdx].start);
    }
  };

  const handlePlayPause = () => {
    if (currentTime >= totalVideoSeconds) {
      setCurrentTime(0);
      setCurrentSceneIndex(0);
    }
    setIsPlaying(!isPlaying);
  };

  return (
    <div className="w-full bg-white rounded-2xl border border-[#DCE7D9] overflow-hidden shadow-xs mb-6">
      {/* Top Header */}
      <div className="px-5 py-3 border-b border-[#F0F5EE] flex items-center justify-between bg-[#FAFDF9]">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-md bg-red-100 text-red-600 flex items-center justify-center">
            <Video className="w-3.5 h-3.5" />
          </div>
          <span className="text-xs font-bold text-gray-800">Video Studio Preview &amp; Storyboard</span>
          <span className="text-[10px] bg-red-50 text-red-700 px-2 py-0.5 rounded-full font-semibold border border-red-200">
            Reel / Video
          </span>
        </div>

        {/* Real Calculated Duration */}
        <span className="text-xs font-mono text-[#477A3C] font-semibold">
          {totalDurationStr} Total Run
        </span>
      </div>

      {/* Interactive Cinematic Preview Window */}
      <div className="relative aspect-video w-full bg-gradient-to-br from-slate-950 via-slate-900 to-black overflow-hidden flex flex-col justify-between p-6 text-white group">
        {/* Background Ambient Glow & Optional Image Layer */}
        {imageUrl && (
          <img
            src={imageUrl}
            alt=""
            className="absolute inset-0 w-full h-full object-cover opacity-20 filter blur-xs"
          />
        )}
        <div className="absolute inset-0 bg-black/50" />

        {/* Top Video HUD with Live Playhead Timestamp */}
        <div className="relative z-10 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className={`w-2 h-2 rounded-full ${isPlaying ? 'bg-red-500 animate-pulse' : 'bg-amber-400'}`} />
            <span className="text-[11px] font-mono uppercase tracking-widest text-red-400 font-bold">
              {isPlaying ? 'PLAYING PREVIEW' : 'STORYBOARD CUE'}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <span className="px-2.5 py-1 rounded-md bg-white/10 backdrop-blur-md text-[11px] font-mono text-white/90 border border-white/10 font-bold">
              {formatSecondsToTime(currentTime)} / {totalDurationStr}
            </span>
            <span className="px-2 py-0.5 rounded-md bg-[#8DBF67]/20 text-[10px] font-mono text-[#8DBF67] border border-[#8DBF67]/30">
              {currentScene.timestamp}
            </span>
          </div>
        </div>

        {/* Center Scene Title & Narration */}
        <div className="relative z-10 max-w-xl mx-auto text-center space-y-3 my-auto">
          <span className="inline-block text-[10px] font-mono uppercase tracking-widest text-[#8DBF67] bg-[#8DBF67]/10 px-3 py-1 rounded-full border border-[#8DBF67]/20 font-bold">
            {currentScene.title}
          </span>
          <h4 className="text-lg sm:text-xl font-extrabold text-white tracking-tight leading-snug drop-shadow-md">
            &ldquo;{currentScene.narration}&rdquo;
          </h4>
          <p className="text-xs text-gray-300 italic max-w-md mx-auto">
            Visual: {currentScene.visualDescription}
          </p>
        </div>

        {/* Bottom Playback Bar */}
        <div className="relative z-10 space-y-3">
          {/* Progress Scrubber */}
          <div className="w-full h-1 bg-white/20 rounded-full overflow-hidden">
            <div
              className="h-full bg-[#8DBF67] transition-all duration-300 rounded-full"
              style={{ width: `${Math.min(100, (currentTime / totalVideoSeconds) * 100)}%` }}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <button
                onClick={() => jumpToScene(currentSceneIndex - 1)}
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition cursor-pointer"
                type="button"
                title="Previous scene"
              >
                <SkipBack className="w-4 h-4" />
              </button>

              <button
                onClick={handlePlayPause}
                className="w-10 h-10 rounded-full bg-[#477A3C] hover:bg-[#3A6331] text-white flex items-center justify-center transition shadow-lg cursor-pointer active:scale-95"
                type="button"
                title={isPlaying ? 'Pause Preview' : 'Play Preview'}
              >
                {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 ml-0.5" />}
              </button>

              <button
                onClick={() => jumpToScene(currentSceneIndex + 1)}
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition cursor-pointer"
                type="button"
                title="Next scene"
              >
                <SkipForward className="w-4 h-4" />
              </button>
            </div>

            {/* Scene Indicators */}
            <div className="flex items-center gap-1.5">
              {scenes.map((_, i) => (
                <button
                  key={i}
                  onClick={() => jumpToScene(i)}
                  className={`h-1.5 rounded-full transition-all cursor-pointer ${
                    i === currentSceneIndex ? 'w-6 bg-[#8DBF67]' : 'w-2 bg-white/30 hover:bg-white/60'
                  }`}
                  type="button"
                  title={`Scene ${i + 1}`}
                />
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Storyboard Scene Breakdown */}
      <div className="p-5 border-t border-[#F0F5EE]">
        <h4 className="text-xs font-bold text-gray-800 uppercase tracking-wider mb-3 flex items-center gap-2">
          <Clapperboard className="w-3.5 h-3.5 text-[#477A3C]" />
          <span>Scene Storyboard Breakdown ({scenes.length} Scenes)</span>
        </h4>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {scenes.map((scene, idx) => (
            <div
              key={idx}
              onClick={() => jumpToScene(idx)}
              className={`p-3.5 rounded-xl border transition-all cursor-pointer text-left ${
                idx === currentSceneIndex
                  ? 'border-[#8DBF67] bg-[#FAFDF9] shadow-xs ring-1 ring-[#8DBF67]/30'
                  : 'border-[#E5ECE3] bg-white hover:border-[#8DBF67]/50 hover:bg-[#FAFDF9]'
              }`}
            >
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs font-bold text-[#172019]">{scene.title}</span>
                <span className="text-[10px] font-mono text-[#477A3C] font-semibold bg-[#EAF4E3] px-2 py-0.5 rounded border border-[#8DBF67]/30">
                  {scene.timestamp}
                </span>
              </div>
              <p className="text-[11px] text-[#627063] line-clamp-2 leading-relaxed mb-1.5">
                {scene.narration}
              </p>
              <p className="text-[10px] text-gray-400 italic truncate">
                Visual: {scene.visualDescription}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
