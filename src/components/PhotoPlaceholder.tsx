import React from 'react';
import { Image as ImageIcon } from 'lucide-react';

interface PhotoPlaceholderProps {
  label?: string;
  sublabel?: string;
  className?: string;
  height?: string;
  imageUrl?: string;
  alt?: string;
}

export const PhotoPlaceholder: React.FC<PhotoPlaceholderProps> = ({
  label = 'IMAGE PLACEHOLDER',
  sublabel,
  className = '',
  height,
  imageUrl,
  alt = 'Fotografía de maquinaria',
}) => {
  if (imageUrl) {
    return (
      <div 
        style={{ height }} 
        className={`relative w-full overflow-hidden bg-white border border-slate-100 rounded-lg flex items-center justify-center p-2 ${className}`}
      >
        <img 
          src={imageUrl} 
          alt={alt} 
          loading="lazy"
          className="w-full h-full object-contain object-center transition-transform duration-300 group-hover:scale-105" 
        />
      </div>
    );
  }

  return (
    <div
      style={{ height }}
      className={`photo-placeholder w-full relative flex flex-col items-center justify-center p-4 text-center transition-colors ${className}`}
    >
      <ImageIcon className="w-8 h-8 opacity-70 mb-2" strokeWidth={1.5} />
      <span className="text-sm tracking-widest font-display text-white/90">
        {label}
      </span>
      {sublabel && (
        <span className="text-[11px] text-white/70 font-mono font-normal tracking-normal mt-1">
          {sublabel}
        </span>
      )}
    </div>
  );
};
