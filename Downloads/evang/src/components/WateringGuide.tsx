import React from "react";
import { motion, AnimatePresence } from "motion/react";
import { Check, Calendar, Droplet, Sun, Wind, X } from "lucide-react";
import { Plant } from "../types";
import { cn } from "../lib/utils";

interface WateringGuideProps {
  plant: Plant | null;
  isOpen: boolean;
  onClose: () => void;
}

export function WateringGuide({ plant, isOpen, onClose }: WateringGuideProps) {
  if (!plant) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 md:p-6 overflow-hidden">
          {/* Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-forest-base/90 backdrop-blur-md"
          />

          {/* Modal Panel */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative w-full max-w-2xl glass-panel rounded-[2rem] md:rounded-[3rem] overflow-hidden shadow-2xl flex flex-col max-h-[90vh]"
          >
            {/* Header */}
            <div className="relative h-48 md:h-64 shrink-0">
              <img src={plant.imageUrl} className="w-full h-full object-cover" alt={plant.name} />
              <div className="absolute inset-0 bg-gradient-to-t from-forest-base via-transparent to-transparent" />
              <button
                onClick={onClose}
                className="absolute top-4 right-4 md:top-6 md:right-6 w-10 h-10 md:w-12 md:h-12 bg-white/10 backdrop-blur-md rounded-2xl flex items-center justify-center hover:bg-white/20 transition-all border border-white/10"
              >
                <X className="w-6 h-6 text-white" />
              </button>
              <div className="absolute bottom-6 left-6 md:bottom-10 md:left-10 space-y-2">
                <div className="flex items-center gap-2">
                  <span className="px-3 py-1 bg-accent/20 border border-accent/30 rounded-full text-[10px] font-bold text-accent uppercase tracking-widest backdrop-blur-sm">
                    Success
                  </span>
                </div>
                <h2 className="text-3xl md:text-5xl font-black text-white tracking-tighter leading-none uppercase">
                  Trace <span className="text-accent">Complete</span>
                </h2>
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 p-6 md:p-10 overflow-y-auto space-y-8 md:space-y-10">
              <div className="space-y-6">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div>
                    <h3 className="text-2xl font-bold text-white tracking-tight">{plant.name}</h3>
                    <p className="text-forest-muted italic font-medium">{plant.species}</p>
                  </div>
                  <div className="flex gap-2">
                    {plant.colors.map((c, i) => (
                      <div key={i} className="w-6 h-6 rounded-lg border border-white/10" style={{ backgroundColor: c }} />
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 md:gap-4">
                  <div className="glass-card p-4 rounded-2xl border-white/5 bg-white/[0.02] flex flex-col gap-2">
                    <div className="flex items-center gap-2 text-accent">
                      <Droplet className="w-4 h-4" />
                      <span className="text-[10px] font-bold uppercase tracking-widest leading-none">Last Hydrated</span>
                    </div>
                    <p className="text-white font-bold">{new Date().toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>
                  </div>
                  <div className="glass-card p-4 rounded-2xl border-white/5 bg-white/[0.02] flex flex-col gap-2">
                    <div className="flex items-center gap-2 text-accent">
                      <Calendar className="w-4 h-4" />
                      <span className="text-[10px] font-bold uppercase tracking-widest leading-none">Next Cycle</span>
                    </div>
                    <p className="text-white font-bold">{new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toLocaleDateString([], { month: 'short', day: 'numeric' })}</p>
                  </div>
                </div>
              </div>

              <div className="space-y-6">
                <h4 className="text-sm font-black text-white uppercase tracking-[0.2em] flex items-center gap-3">
                  <span className="w-6 h-[1px] bg-accent/50" />
                  Cultivation Checklist
                </h4>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex gap-4 p-4 glass-card rounded-2xl bg-white/[0.01] border-white/5">
                    <div className="w-10 h-10 shrink-0 bg-accent/10 rounded-xl flex items-center justify-center">
                      <Sun className="w-5 h-5 text-accent" />
                    </div>
                    <div className="space-y-1">
                      <p className="text-xs font-bold text-white uppercase tracking-wider">Lighting</p>
                      <p className="text-xs text-forest-muted leading-relaxed">Bright indirect sunlight preferred for optimal photosynthesis.</p>
                    </div>
                  </div>
                  <div className="flex gap-4 p-4 glass-card rounded-2xl bg-white/[0.01] border-white/5">
                    <div className="w-10 h-10 shrink-0 bg-accent/10 rounded-xl flex items-center justify-center">
                      <Wind className="w-5 h-5 text-accent" />
                    </div>
                    <div className="space-y-1">
                      <p className="text-xs font-bold text-white uppercase tracking-wider">Atmosphere</p>
                      <p className="text-xs text-forest-muted leading-relaxed">Maintain moderate humidity; avoid direct AC drafts.</p>
                    </div>
                  </div>
                </div>

                <div className="p-6 glass-card rounded-[2rem] bg-accent/5 border-accent/10 space-y-3">
                  <div className="flex items-center gap-2 mb-2">
                    <Check className="w-5 h-5 text-accent" />
                    <span className="font-bold text-white text-sm uppercase tracking-widest">Protocol Insight</span>
                  </div>
                  <p className="text-sm text-forest-muted italic leading-relaxed">
                    "{plant.careTips}"
                  </p>
                </div>
              </div>

              <button
                onClick={onClose}
                className="w-full py-5 bg-accent text-forest-base rounded-2xl font-black uppercase tracking-widest text-sm hover:scale-[1.02] active:scale-[0.98] transition-all shadow-[0_15px_30px_-5px_rgba(46,204,113,0.3)]"
              >
                Acknowledge Protocol
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
