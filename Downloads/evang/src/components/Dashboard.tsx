import { useState } from "react";
import { Droplet, Calendar, Plus, Clock, ExternalLink, Leaf, Beaker } from "lucide-react";
import { Plant } from "../types";
import { cn } from "../lib/utils";
import { motion } from "motion/react";
import { WateringGuide } from "./WateringGuide";
import { WeeklyTracker } from "./WeeklyTracker";
import { HydrationProgress } from "./HydrationProgress";

interface DashboardProps {
  plants: Plant[];
  setPlants: (plants: Plant[]) => void;
}

export function Dashboard({ plants, setPlants }: DashboardProps) {
  const [selectedPlant, setSelectedPlant] = useState<Plant | null>(plants[0] || null);
  const [wateringLoading, setWateringLoading] = useState<string | null>(null);
  const [isGuideOpen, setIsGuideOpen] = useState(false);
  const [guidePlant, setGuidePlant] = useState<Plant | null>(null);
  const [waterAmounts, setWaterAmounts] = useState<Record<string, number>>({});
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const waterPlant = async (id: string) => {
    const amount = waterAmounts[id] || 100;
    setWateringLoading(id);
    try {
      // Use the new consolidated water-log endpoint
      const res = await fetch("/api/water-log", { 
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ flower_id: id, water_amount: amount })
      });
      
      if (res.ok) {
        const updatedPlant = await res.json();
        const updatedPlants = plants.map(p => p.id === id ? updatedPlant : p);
        setPlants(updatedPlants);
        if (selectedPlant?.id === id) {
          setSelectedPlant(updatedPlant);
        }
        setGuidePlant(updatedPlant);
        setIsGuideOpen(true);
        setRefreshTrigger(prev => prev + 1);
      }
    } catch (err) {
      console.error("Failed to water plant", err);
    } finally {
      setWateringLoading(null);
    }
  };

  const handleAmountChange = (id: string, val: string) => {
    const num = parseInt(val);
    if (!isNaN(num)) {
      setWaterAmounts({ ...waterAmounts, [id]: num });
    }
  };

  if (plants.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center text-center py-32 px-6 glass-panel rounded-[3rem] border border-white/10 hover-glow">
        <div className="w-24 h-24 bg-accent/20 rounded-full flex items-center justify-center mb-8 shadow-[0_0_30px_rgba(46,204,113,0.3)]">
          <Plus className="w-12 h-12 text-accent" />
        </div>
        <h2 className="text-4xl font-black text-white mb-4 tracking-tighter">Your garden is silent.</h2>
        <p className="text-forest-muted mb-10 max-w-md mx-auto text-lg font-medium leading-relaxed">
          The collection is empty. Identify your first botanical specimen to begin the archive.
        </p>
        <button className="btn-forest px-10 py-4 text-lg">Start Scouting</button>
      </div>
    );
  }

  return (
    <div className="space-y-8 md:space-y-12">
      {/* Dashboard Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 px-2 md:px-4">
        <div className="space-y-2 md:space-y-3">
          <div className="flex items-center gap-3">
            <span className="w-8 md:w-10 h-[2px] bg-accent/50" />
            <span className="text-[10px] font-black uppercase tracking-[0.3em] text-accent">Active Collection</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-black text-white tracking-tighter uppercase leading-[0.8]">
            My <span className="italic text-accent">Garden</span> Hub
          </h1>
        </div>
        <div className="flex gap-4">
          <div className="glass-card px-4 md:px-6 py-2.5 md:py-3 rounded-xl md:rounded-2xl flex items-center gap-3 md:gap-4 border-white/5">
            <div className="w-8 h-8 bg-accent/20 rounded-lg flex items-center justify-center">
              <Leaf className="w-4 h-4 text-accent" />
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-forest-muted">Specimens</p>
              <p className="text-base md:text-lg font-bold text-white leading-none">{plants.length}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Grid Layout */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-10">
        {plants.map((plant) => (
          <motion.div 
            key={plant.id}
            whileHover={{ y: -8 }}
            className="group glass-panel rounded-[2rem] md:rounded-[2.5rem] overflow-hidden flex flex-col hover-glow"
          >
            <div className="relative aspect-[4/3] overflow-hidden p-2 md:p-3 pb-0">
              <div className="w-full h-full rounded-[1.5rem] md:rounded-[2rem] overflow-hidden relative">
                <img src={plant.imageUrl} className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110" alt={plant.name} />
                <div className="absolute top-3 right-3 md:top-4 md:right-4 flex flex-col items-end gap-2">
                  <div className="flex items-center gap-2 bg-forest-base/60 backdrop-blur-md p-1.5 md:p-2 rounded-xl md:rounded-2xl border border-white/10 opacity-0 group-hover:opacity-100 transition-all duration-300 translate-y-2 group-hover:translate-y-0">
                    <Beaker className="w-3.5 h-3.5 text-accent" />
                    <input 
                      type="number" 
                      value={waterAmounts[plant.id] || 100}
                      onChange={(e) => handleAmountChange(plant.id, e.target.value)}
                      className="w-12 bg-transparent text-[10px] font-bold text-white focus:outline-none"
                    />
                    <span className="text-[9px] font-bold text-forest-muted uppercase">ml</span>
                  </div>
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      waterPlant(plant.id);
                    }}
                    disabled={wateringLoading === plant.id}
                    className={cn(
                      "p-3 md:p-4 bg-accent text-forest-base rounded-xl md:rounded-2xl shadow-lg transition-all duration-300 hover:scale-110 active:scale-90 hover:shadow-accent/40",
                      wateringLoading === plant.id && "bg-accent/70 cursor-not-allowed"
                    )}
                  >
                    {wateringLoading === plant.id ? (
                      <div className="w-4 h-4 md:w-5 md:h-5 border-2 border-forest-base/30 border-t-forest-base rounded-full animate-spin" />
                    ) : (
                      <Droplet className="w-4 h-4 md:w-5 md:h-5" />
                    )}
                  </button>
                </div>
              </div>
            </div>
            
            <div className="p-6 md:p-8 space-y-5 md:space-y-7 flex-1 flex flex-col justify-between">
              <div className="space-y-4 md:space-y-6">
                <div className="space-y-1 md:space-y-2 text-center md:text-left">
                  <h3 className="text-2xl md:text-3xl font-black text-white tracking-tighter truncate uppercase">{plant.name}</h3>
                  <p className="text-xs md:text-sm font-semibold italic text-accent opacity-80">{plant.species}</p>
                </div>

                {/* Hydration Progress */}
                <HydrationProgress flowerId={plant.id} refreshTrigger={refreshTrigger} />
              </div>

              <div className="grid grid-cols-2 gap-3 md:gap-4 pt-2">
                <div className="glass-card p-3 md:p-4 rounded-xl md:rounded-2xl border-white/5 bg-white/[0.02]">
                  <p className="text-[8px] md:text-[9px] font-black uppercase tracking-widest text-forest-muted mb-0.5 md:mb-1">Status</p>
                  <p className="text-[10px] md:text-xs font-bold text-accent flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    Hydrated
                  </p>
                </div>
                <div className="glass-card p-3 md:p-4 rounded-xl md:rounded-2xl border-white/5 bg-white/[0.02]">
                  <p className="text-[8px] md:text-[9px] font-black uppercase tracking-widest text-forest-muted mb-0.5 md:mb-1">Last Date</p>
                  <p className="text-[10px] md:text-xs font-bold text-white">
                    {plant.lastWatered ? new Date(plant.lastWatered).toLocaleDateString([], { month: 'short', day: 'numeric' }) : "None"}
                  </p>
                </div>
              </div>

              <div className="pt-2 border-t border-white/5 flex items-center justify-between">
                <div className="flex gap-1.5">
                  {[...Array(3)].map((_, i) => (
                    <div key={`status-dot-${i}`} className={cn("w-1 h-1 md:w-1.5 md:h-1.5 rounded-full", i === 0 ? "bg-accent" : "bg-white/10")} />
                  ))}
                </div>
                <button 
                  onClick={() => setSelectedPlant(plant)}
                  className="text-[9px] md:text-[10px] font-black uppercase tracking-[0.2em] text-white hover:text-accent transition-colors flex items-center gap-2"
                >
                  View Archive <ExternalLink className="w-3 h-3" />
                </button>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Weekly Tracker Section */}
      <WeeklyTracker plants={plants} refreshTrigger={refreshTrigger} />

      {/* Expanded Modal for Details */}
      {selectedPlant && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 md:p-12">
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="absolute inset-0 bg-forest-base/80 backdrop-blur-xl"
            onClick={() => setSelectedPlant(null)}
          />
          <motion.div 
            initial={{ opacity: 0, scale: 0.9, y: 30 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            className="relative w-full max-w-5xl glass-panel rounded-[2rem] md:rounded-[3rem] overflow-hidden shadow-2xl flex flex-col md:flex-row max-h-[90vh] md:h-auto"
          >
            <div className="w-full md:w-2/5 h-48 md:h-auto relative shrink-0">
              <img src={selectedPlant.imageUrl} className="w-full h-full object-cover" alt={selectedPlant.name} />
              <div className="absolute top-4 left-4 md:top-6 md:left-6">
                <button 
                  onClick={() => setSelectedPlant(null)}
                  className="w-10 h-10 md:w-12 md:h-12 bg-forest-base/50 backdrop-blur-md rounded-xl md:rounded-2xl flex items-center justify-center hover:bg-forest-base transition-colors"
                >
                  <Plus className="w-6 h-6 md:w-8 md:h-8 text-white rotate-45" />
                </button>
              </div>
            </div>
            <div className="flex-1 p-6 md:p-16 overflow-y-auto space-y-8 md:space-y-12">
              <div className="space-y-2 md:space-y-4">
                <div className="flex items-center gap-3">
                  <span className="w-6 md:w-8 h-[1px] bg-accent/50" />
                  <span className="text-[8px] md:text-[10px] font-black uppercase tracking-[0.3em] text-accent">Technical Log</span>
                </div>
                <h2 className="text-4xl md:text-6xl font-black text-white tracking-tighter leading-none">{selectedPlant.name}</h2>
                <p className="text-base md:text-2xl font-light italic text-forest-muted">Care Guidelines Applied</p>
              </div>

              <div className="glass-card p-5 md:p-8 rounded-2xl md:rounded-3xl space-y-4 border-white/5 bg-white/[0.02]">
                <p className="text-sm md:text-lg text-forest-muted leading-relaxed font-medium">{selectedPlant.careTips}</p>
              </div>

              <div className="space-y-4 md:space-y-6">
                <h4 className="flex items-center gap-3 text-base md:text-lg font-black text-white uppercase tracking-widest">
                  <Calendar className="w-4 h-4 md:w-5 md:h-5 text-accent" />
                  Activity History
                </h4>
                <div className="grid grid-cols-1 gap-2 md:gap-3">
                  {selectedPlant.logs.length > 0 ? (
                    [...selectedPlant.logs].slice(0, 5).map((log, idx) => (
                      <div key={`${selectedPlant.id}-log-${log.date}-${idx}`} className="flex items-center justify-between p-4 md:p-5 glass-card rounded-xl md:rounded-2xl border-white/5 bg-white/[0.01]">
                        <div className="flex items-center gap-3 md:gap-4">
                          <div className="w-8 h-8 md:w-10 md:h-10 rounded-lg md:rounded-xl bg-accent/10 flex items-center justify-center">
                            <Droplet className="w-4 h-4 md:w-5 md:h-5 text-accent" />
                          </div>
                          <span className="font-bold text-white text-xs md:text-sm">System Hydration</span>
                        </div>
                        <span className="text-[10px] md:text-xs font-medium text-forest-muted">{new Date(log.date).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}</span>
                      </div>
                    ))
                  ) : (
                    <div className="p-8 md:p-10 text-center glass-card rounded-2xl md:rounded-3xl border-dashed border-2 border-white/10">
                      <p className="text-forest-muted text-xs md:text-sm font-medium italic">No historical activities found in primary archive.</p>
                    </div>
                  )}
                </div>
              </div>

              <button 
                onClick={() => waterPlant(selectedPlant.id)}
                disabled={!!wateringLoading}
                className={cn(
                  "w-full py-4 md:py-6 bg-accent text-forest-base rounded-2xl md:rounded-[2rem] font-black uppercase tracking-widest flex items-center justify-center gap-3 md:gap-4 shadow-[0_15px_30px_-5px_rgba(46,204,113,0.3)] transition-all",
                  wateringLoading === selectedPlant.id ? "opacity-70 cursor-not-allowed" : "hover:scale-[1.02]"
                )}
              >
                {wateringLoading === selectedPlant.id ? (
                  <div className="w-5 h-5 md:w-6 md:h-6 border-4 border-forest-base/30 border-t-forest-base rounded-full animate-spin" />
                ) : (
                  <Droplet className="w-4 h-4 md:w-5 md:h-5" />
                )}
                <span className="text-sm md:text-base">{wateringLoading === selectedPlant.id ? "Executing Trace..." : "Execute Watering Trace"}</span>
              </button>
            </div>
          </motion.div>
        </div>
      )}

      <WateringGuide 
        plant={guidePlant} 
        isOpen={isGuideOpen} 
        onClose={() => setIsGuideOpen(false)} 
      />
    </div>
  );
}
