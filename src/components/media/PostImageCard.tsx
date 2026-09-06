'use client';

import React, { useState } from 'react';
import {
  Image as ImageIcon,
  Download,
  Copy,
  Check,
  Maximize2,
  Sparkles,
  ExternalLink
} from 'lucide-react';

interface PostImageCardProps {
  imageUrl?: string;
  title: string;
  topic?: string;
}

export const PostImageCard: React.FC<PostImageCardProps> = ({ imageUrl, title, topic }) => {
  const [copied, setCopied] = useState(false);
  const [aspectRatio, setAspectRatio] = useState<'16/9' | '1/1' | '4/5'>('16/9');

  const defaultUrl = imageUrl || 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=1200&q=80';

  const handleCopy = () => {
    navigator.clipboard.writeText(defaultUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const a = document.createElement('a');
    a.href = defaultUrl;
    a.target = '_blank';
    a.download = `infomorph-asset-${Date.now()}.jpg`;
    a.click();
  };

  return (
    <div className="w-full bg-white rounded-2xl border border-[#DCE7D9] overflow-hidden shadow-xs mb-6">
      {/* Top Header */}
      <div className="px-5 py-3 border-b border-[#F0F5EE] flex items-center justify-between bg-[#FAFDF9]">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-md bg-[#EAF4E3] text-[#477A3C] flex items-center justify-center">
            <ImageIcon className="w-3.5 h-3.5" />
          </div>
          <span className="text-xs font-bold text-gray-800">Visual Post Asset</span>
          <span className="text-[10px] bg-[#EAF4E3] text-[#477A3C] px-2 py-0.5 rounded-full font-semibold border border-[#8DBF67]/30">
            Generated Graphic
          </span>
        </div>

        {/* Aspect Ratio Selector */}
        <div className="flex items-center gap-1 text-[10px] font-semibold bg-white p-0.5 rounded-lg border border-[#E0E9DD]">
          <button
            onClick={() => setAspectRatio('16/9')}
            className={`px-2 py-1 rounded-md transition cursor-pointer ${
              aspectRatio === '16/9' ? 'bg-[#477A3C] text-white' : 'text-gray-500 hover:text-gray-900'
            }`}
            type="button"
          >
            16:9 Banner
          </button>
          <button
            onClick={() => setAspectRatio('1/1')}
            className={`px-2 py-1 rounded-md transition cursor-pointer ${
              aspectRatio === '1/1' ? 'bg-[#477A3C] text-white' : 'text-gray-500 hover:text-gray-900'
            }`}
            type="button"
          >
            1:1 Square
          </button>
          <button
            onClick={() => setAspectRatio('4/5')}
            className={`px-2 py-1 rounded-md transition cursor-pointer ${
              aspectRatio === '4/5' ? 'bg-[#477A3C] text-white' : 'text-gray-500 hover:text-gray-900'
            }`}
            type="button"
          >
            4:5 Portrait
          </button>
        </div>
      </div>

      {/* Image Container with Dynamic Aspect Ratio */}
      <div className="relative w-full bg-slate-900 overflow-hidden flex items-center justify-center group">
        <div
          className="w-full relative transition-all duration-300"
          style={{
            aspectRatio: aspectRatio === '16/9' ? '16 / 9' : aspectRatio === '1/1' ? '1 / 1' : '4 / 5',
            maxHeight: '420px'
          }}
        >
          <img
            src={defaultUrl}
            alt={title}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          />

          {/* Gradient Overlay for Editorial Title */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent flex flex-col justify-end p-6 text-white">
            <span className="text-[10px] font-mono tracking-widest text-[#8DBF67] uppercase font-bold mb-1">
              INFOMORPH GROUNDED ASSET
            </span>
            <h3 className="text-base sm:text-lg font-bold leading-snug line-clamp-2 max-w-xl text-white/95">
              {title}
            </h3>
          </div>
        </div>

        {/* Action Overlay Buttons */}
        <div className="absolute top-3 right-3 flex items-center gap-1.5 opacity-90 group-hover:opacity-100 transition-opacity">
          <button
            onClick={handleCopy}
            className="px-2.5 py-1.5 rounded-lg bg-black/60 hover:bg-black/80 backdrop-blur-md text-white text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer shadow-sm"
            type="button"
            title="Copy image link"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? 'Copied' : 'Copy'}</span>
          </button>
          <button
            onClick={handleDownload}
            className="px-2.5 py-1.5 rounded-lg bg-[#477A3C] hover:bg-[#3A6331] text-white text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer shadow-sm"
            type="button"
            title="Download image"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download</span>
          </button>
        </div>
      </div>
    </div>
  );
};
