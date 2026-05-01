import React, { useEffect, useState } from "react";
import { Check, X, Calendar, Droplets } from "lucide-react";
import { motion } from "motion/react";
import { cn } from "../lib/utils";

interface WeeklyTrackerProps {
  plants: any[];
  refreshTrigger?: number;
}

export function WeeklyTracker({ plants, refreshTrigger }: WeeklyTrackerProps) {
  const [weeklyData, setWeeklyData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchWeeklySummary = async () => {
    try {
      const res = await fetch("/api/watering/weekly");
      if (res.ok) {
        const data = await res.json();
        setWeeklyData(data);
      }
    } catch (err) {
      console.error("Failed to fetch weekly summary", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWeeklySummary();
  }, [plants, refreshTrigger]);

  if (loading) {
    return (
      <div className="w-full py-12 flex flex-col items-center justify-center gap-4 glass-panel rounded-[2.5rem] border border-white/10">
        <motion.div 
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
          className="w-10 h-10 border-4 border-accent/20 border-t-accent rounded-full"
        />
        <p className="text-forest-muted text-xs font-black uppercase tracking-[0.2em]">Synchronizing Archive</p>
      </div>
    );
  }

  return (
    <section id="weekly-tracker" className="space-y-6 md:space-y-8">
      <div className="flex items-center gap-4">
        <div className="p-3 bg-accent/20 rounded-2xl shadow-[0_0_20px_rgba(46,204,113,0.2)]">
          <Calendar className="w-6 h-6 text-accent" />
        </div>
        <div className="space-y-1">
          <h2 className="text-2xl md:text-3xl font-black text-white tracking-tighter uppercase">Weekly Hydration Trace</h2>
          <p className="text-[10px] md:text-xs font-bold text-forest-muted uppercase tracking-widest leading-none">Last 7 Cycles of Botanical Maintenance</p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {weeklyData.map((plantSummary) => {
          return (
            <motion.div 
              key={`weekly-${plantSummary.id}`}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              className="glass-panel p-6 md:p-8 rounded-[2rem] border border-white/10 hover-glow transition-all"
            >
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="flex items-center gap-4 md:gap-7 min-w-[220px]">
                  <div className="w-14 h-14 md:w-20 md:h-20 rounded-[1.25rem] md:rounded-[1.75rem] overflow-hidden border-2 border-white/10 shadow-2xl relative group-hover:border-accent/40 transition-colors">
                    <img src={plantSummary.imageUrl} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" alt={plantSummary.name} />
                  </div>
                  <div className="space-y-1">
                    <h3 className="text-2xl md:text-3xl font-black text-white truncate max-w-[180px] uppercase tracking-tighter leading-none">{plantSummary.name}</h3>
                    <p className="text-[10px] md:text-xs font-black italic text-accent/80 truncate max-w-[180px] tracking-tight">{plantSummary.species}</p>
                    <div className="flex items-center gap-2 pt-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse" />
                      <span className="text-[8px] font-black uppercase tracking-[0.2em] text-forest-muted">Botanical Sequence Active</span>
                    </div>
                  </div>
                </div>

                <div className="flex-1 grid grid-cols-7 gap-1.5 md:gap-3 p-3 bg-forest-base/40 rounded-[1.75rem] md:rounded-[2.25rem] border border-white/5 shadow-inner">
                  {plantSummary.trace.map((dayInfo: any) => {
                    const watered = dayInfo.watered;
                    return (
                      <div key={`${plantSummary.id}-${dayInfo.date}`} className="flex flex-col items-center gap-2 md:gap-3 py-1">
                        <span className="text-[9px] md:text-[10px] font-black uppercase tracking-tighter text-forest-muted opacity-60">{dayInfo.day}</span>
                        <motion.div 
                          whileHover={{ scale: 1.1, y: -2 }}
                          className={cn(
                          "w-9 h-9 md:w-14 md:h-14 rounded-xl md:rounded-2xl flex items-center justify-center transition-all duration-500 border",
                          watered 
                            ? "bg-accent border-accent/20 shadow-[0_8px_20px_-5px_rgba(46,204,113,0.6)]" 
                            : "bg-white/[0.02] border-white/5 opacity-30 hover:opacity-100 hover:bg-white/[0.05]"
                        )}>
                          {watered ? (
                            <Check className="w-4 h-4 md:w-7 md:h-7 text-forest-base stroke-[4px]" />
                          ) : (
                            <X className="w-3 h-3 md:w-4 md:h-4 text-white/20" />
                          )}
                        </motion.div>
                      </div>
                    );
                  })}
                </div>

                <div className="hidden lg:flex flex-col items-end gap-1 px-4 border-l border-white/5">
                   <div className="flex items-center gap-2 text-accent">
                      <Droplets className="w-4 h-4" />
                      <span className="text-xl font-black">{plantSummary.totalThisWeek}</span>
                   </div>
                   <span className="text-[9px] font-bold text-forest-muted uppercase tracking-widest">Logs This Week</span>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>
    </section>
  );
}
