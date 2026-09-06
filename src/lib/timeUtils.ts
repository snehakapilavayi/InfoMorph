import { StoryboardScene } from '@/types';

/**
 * Formats a duration in seconds to M:SS format.
 */
export function formatSecondsToTime(totalSeconds: number): string {
  const safeSeconds = Math.max(0, Math.floor(totalSeconds));
  const mins = Math.floor(safeSeconds / 60);
  const secs = safeSeconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

/**
 * Parses a "M:SS" or "MM:SS" string into seconds.
 */
export function parseTimeToSeconds(timeStr: string): number {
  if (!timeStr) return 0;
  const parts = timeStr.trim().split(':').map(Number);
  if (parts.length === 2 && !isNaN(parts[0]) && !isNaN(parts[1])) {
    return parts[0] * 60 + parts[1];
  }
  if (parts.length === 3 && !isNaN(parts[0]) && !isNaN(parts[1]) && !isNaN(parts[2])) {
    return parts[0] * 3600 + parts[1] * 60 + parts[2];
  }
  return 0;
}

/**
 * Calculates estimated spoken audio/narration duration in seconds based on word count.
 * Average natural human speaking speed is 135-145 words per minute (~2.3 words/sec).
 */
export function estimateSpokenDurationSeconds(text: string, wpm = 140): number {
  if (!text || !text.trim()) return 10;
  // Clean markdown tags, code blocks, URLs
  const clean = text
    .replace(/```[\s\S]*?```/g, '')
    .replace(/[#*`_~]/g, '')
    .replace(/https?:\/\/\S+/g, '')
    .trim();
  const words = clean.split(/\s+/).filter(Boolean).length;
  const seconds = Math.round((words / wpm) * 60);
  return Math.max(6, seconds);
}

/**
 * Calculates an accurate duration string (M:SS) from text.
 */
export function calculateAudioDuration(text: string, wpm = 140): string {
  return formatSecondsToTime(estimateSpokenDurationSeconds(text, wpm));
}

/**
 * Computes exact sequential timestamps for video storyboard scenes based on the narration length of each scene.
 * Guarantees that every scene has a mathematically precise start and end timestamp (e.g. 0:00 - 0:18, 0:18 - 0:42).
 */
export function calculateStoryboardTimestamps(
  scenes: { title: string; visualDescription: string; narration: string; timestamp?: string }[]
): StoryboardScene[] {
  if (!scenes || scenes.length === 0) return [];

  let accumulatedSeconds = 0;
  return scenes.map((scene) => {
    const sceneSeconds = estimateSpokenDurationSeconds(scene.narration, 130);
    const startTime = accumulatedSeconds;
    const endTime = startTime + sceneSeconds;
    accumulatedSeconds = endTime;

    return {
      title: scene.title,
      visualDescription: scene.visualDescription,
      narration: scene.narration,
      timestamp: `${formatSecondsToTime(startTime)} - ${formatSecondsToTime(endTime)}`
    };
  });
}
