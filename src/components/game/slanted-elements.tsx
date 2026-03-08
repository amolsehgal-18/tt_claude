import React from 'react';
import { cn } from '@/lib/utils';

interface SlantedProps {
  children: React.ReactNode;
  className?: string;
}

export const SlantedButton = ({ children, className, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement>) => {
  return (
    <button
      className={cn(
        "slanted-button relative bg-primary hover:bg-primary/90 text-white font-headline px-8 py-3 transition-transform active:scale-95",
        className
      )}
      {...props}
    >
      <span className="relative z-10">{children}</span>
    </button>
  );
};

export const SlantedContainer = ({ children, className }: SlantedProps) => {
  return (
    <div className={cn("slanted-container premium-glass p-6 relative overflow-hidden", className)}>
      {children}
    </div>
  );
};

export const StatBar = ({ label, value, colorClass }: { label: string; value: number; colorClass: string }) => {
  return (
    <div className="flex flex-col gap-1 w-full">
      <div className="flex justify-between text-[10px] uppercase font-headline tracking-widest opacity-70">
        <span>{label}</span>
        <span>{Math.round(value * 100)}%</span>
      </div>
      <div className="h-2 w-full bg-white/10 slanted-container overflow-hidden">
        <div 
          className={cn("h-full transition-all duration-500", colorClass)}
          style={{ width: `${value * 100}%` }}
        />
      </div>
    </div>
  );
};