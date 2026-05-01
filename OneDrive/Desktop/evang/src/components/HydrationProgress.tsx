import React, { useEffect, useState } from "react";
import { motion } from "motion/react";
import { Droplets, Activity } from "lucide-react";
import { cn } from "../lib/utils";

interface HydrationProgressProps {
  flowerId: string;
  refreshTrigger?: number;
}

interface ProgressData {
  total_water_today: number;
  watering_count_today: number;
  progress_percentage: number;
  target: number;
}

export function HydrationProgress({ flowerId, refreshTrigger }: HydrationProgressProps) {
  const [data, setData] = useState<ProgressData | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchProgress = async () => {
    try {
      const res = await fetch(`/api/watering/progress/${flowerId}`);
      if (res.ok) {
        const json = await res.json();
        setData(json);
      }
    } catch (err) {
      console.error("Failed to fetch hydration progress", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProgress();
  }, [flowerId, refreshTrigger]);

  if (loading || !data) {
    return (
      <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden animate-pulse" />
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <Droplets className="w-3.5 h-3.5 text-accent" />
          <span className="text-[10px] font-black uppercase tracking-widest text-white/50">Today's Intake</span>
        </div>
        <span className="text-xs font-black text-white">{data.total_water_today}ml <span className="text-white/30">/ {data.target}ml</span></span>
      </div>

      <div className="relative h-1.5 md:h-2 w-full bg-white/5 rounded-full overflow-hidden border border-white/5">
        <motion.div 
          initial={{ width: 0 }}
          animate={{ width: `${data.progress_percentage}%` }}
          transition={{ duration: 1, ease: "circOut" }}
          className={cn(
            "h-full rounded-full shadow-[0_0_10px_rgba(46,204,113,0.3)]",
            data.progress_percentage >= 100 ? "bg-accent" : "bg-accent/70"
          )}
        />
      </div>

      <div className="flex items-center justify-between text-[8px] md:text-[9px] font-bold uppercase tracking-widest text-forest-muted">
        <div className="flex items-center gap-1.5">
          <Activity className="w-3 h-3 text-accent/50" />
          {data.watering_count_today} {data.watering_count_today === 1 ? 'Action' : 'Actions'} Today
        </div>
        <span>{data.progress_percentage}% Target Reach</span>
      </div>
    </div>
  );
}
