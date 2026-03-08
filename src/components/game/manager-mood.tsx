import React from 'react';
import { ManagerMood } from '@/lib/game-logic';
import Image from 'next/image';
import { PlaceHolderImages } from '@/lib/placeholder-images';

export const ManagerMoodView = ({ mood }: { mood: ManagerMood }) => {
  const image = PlaceHolderImages.find(img => img.id === `manager-${mood}`) || PlaceHolderImages[1];

  return (
    <div className="flex flex-col items-center gap-1 bg-transparent">
      <div className="bg-accent/10 text-accent px-2 py-0.5 rounded-full text-[7px] font-headline uppercase tracking-[0.2em] border border-accent/20 mb-1 font-bold">
        {mood}
      </div>
      <div className="relative w-20 h-20">
        <div className="absolute inset-0 bg-primary/10 rounded-full blur-xl animate-pulse-slow" />
        <div className="relative w-full h-full rounded-full border-2 border-white/20 overflow-hidden bg-black/20 shadow-2xl">
          <Image
            src={image.imageUrl}
            alt={`Manager status: ${mood}`}
            fill
            unoptimized
            className="object-cover transition-opacity duration-700"
            data-ai-hint={image.imageHint}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-50" />
        </div>
      </div>
    </div>
  );
};
