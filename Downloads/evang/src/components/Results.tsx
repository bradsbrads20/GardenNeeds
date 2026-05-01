import { Check, ArrowRight, AlertCircle, Info, CheckCircle2 } from "lucide-react";
import { Plant } from "../types";
import { cn } from "../lib/utils";

interface ResultsProps {
  plant: Plant;
  onAdd: (plant: Plant) => void;
}

export function Results({ plant, onAdd }: ResultsProps) {
  const getConfidenceColor = (conf: number = 100) => {
    if (conf >= 80) return "text-accent";
    if (conf >= 50) return "text-yellow-400";
    return "text-red-400";
  };

  const getStatusIcon = (status: string = "success") => {
    switch (status) {
      case "success": return <CheckCircle2 className="w-5 h-5 text-accent" />;
      case "uncertain": return <Info className="w-5 h-5 text-yellow-400" />;
      case "suggestion": return <AlertCircle className="w-5 h-5 text-red-400" />;
      default: return <CheckCircle2 className="w-5 h-5 text-accent" />;
    }
  };

  const statusLabel = {
    success: "High Confidence Match",
    uncertain: "Probable Match",
    suggestion: "Approximate Match"
  };

  return (
    <div className="max-w-6xl mx-auto py-6 md:py-10 px-4 md:px-0">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 md:gap-16 items-center">
        {/* Left: Image Card */}
        <div className="relative group max-w-lg mx-auto lg:max-w-none w-full">
          <div className="absolute inset-0 bg-accent/20 rounded-[2rem] md:rounded-[3rem] blur-3xl opacity-20 group-hover:opacity-40 transition-opacity duration-700" />
          <div className="relative aspect-[4/5] rounded-[2rem] md:rounded-[3rem] overflow-hidden glass-panel p-2 md:p-3">
            <div className="w-full h-full rounded-[1.8rem] md:rounded-[2.5rem] overflow-hidden">
              <img src={plant.imageUrl} alt={plant.name} className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110" />
            </div>
          </div>
          
          {/* Color Swatches */}
          <div className="absolute -bottom-6 md:-bottom-10 right-6 md:right-10 flex flex-col gap-2 md:gap-3">
            {plant.colors.map((color, i) => (
              <div 
                key={i} 
                className="w-10 h-10 md:w-14 md:h-14 rounded-xl md:rounded-2xl border-4 border-forest-base shadow-[0_10px_20px_rgba(0,0,0,0.4)] transition-all duration-500 hover:scale-110"
                style={{ backgroundColor: color, transitionDelay: `${i * 100}ms` }}
              />
            ))}
          </div>
        </div>

        {/* Right: Content Details */}
        <div className="flex flex-col gap-8 md:gap-10">
          <div className="space-y-3 md:space-y-4">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 px-3 py-1 bg-white/5 rounded-full border border-white/10">
                {getStatusIcon(plant.status)}
                <span className={cn("text-[10px] font-black uppercase tracking-widest", getConfidenceColor(plant.confidence))}>
                  {plant.confidence}% Confidence
                </span>
              </div>
              {plant.imageQuality && plant.imageQuality !== 'clear' && (
                <div className="flex items-center gap-1.5 text-red-400">
                  <AlertCircle className="w-3.5 h-3.5" />
                  <span className="text-[10px] font-bold uppercase tracking-tight">Image Quality: {plant.imageQuality}</span>
                </div>
              )}
              <span className="text-[10px] font-bold text-forest-muted uppercase tracking-[0.2em]">
                {statusLabel[plant.status || 'success']}
              </span>
            </div>

            <div className="space-y-2">
              <h1 className="text-4xl md:text-6xl lg:text-7xl font-black text-white leading-[0.9] tracking-tighter uppercase">
                {plant.name}
              </h1>
              <p className="text-xl md:text-2xl italic text-forest-muted font-light">
                — {plant.species}
              </p>
            </div>
          </div>

          {(plant.status === "uncertain" || plant.status === "suggestion") && plant.suggestions && plant.suggestions.length > 0 && (
            <div className="glass-panel p-6 rounded-[1.5rem] border-white/10 bg-white/5 space-y-4">
              <div className="flex items-center gap-2 text-forest-muted">
                <Info className="w-4 h-4" />
                <span className="text-[10px] font-black uppercase tracking-widest">Similarity Suggestions</span>
              </div>
              <div className="grid grid-cols-1 gap-2">
                {plant.suggestions.map((s, i) => (
                  <div key={i} className="flex justify-between items-center p-3 bg-white/5 rounded-xl border border-white/5">
                    <div>
                      <h4 className="text-sm font-bold text-white uppercase">{s.name}</h4>
                      <p className="text-[10px] text-forest-muted italic">{s.species}</p>
                    </div>
                    <button 
                      onClick={() => onAdd({ ...plant, name: s.name, species: s.species, status: 'success', confidence: 100 })}
                      className="text-[9px] font-black uppercase tracking-widest text-accent hover:underline"
                    >
                      Use This
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="glass-card p-6 md:p-10 rounded-[2rem] md:rounded-[2.5rem] hover-glow space-y-4 md:space-y-6">
            <div className="flex items-center gap-3 md:gap-4">
              <div className="p-2 md:p-3 bg-accent/10 rounded-xl">
                <Check className="w-5 h-5 md:w-6 md:h-6 text-accent" />
              </div>
              <h3 className="font-bold text-lg md:text-xl text-white uppercase tracking-wider">Cultivation Profile</h3>
            </div>
            <p className="text-sm md:text-lg text-forest-muted leading-relaxed font-medium">
              {plant.careTips}
            </p>
          </div>

          <div className="flex flex-col gap-4 md:gap-6">
            <button 
              onClick={() => onAdd(plant)}
              className="w-full px-6 md:px-10 py-5 md:py-6 bg-accent text-forest-base rounded-[1.5rem] md:rounded-[2rem] font-black uppercase tracking-widest text-base md:text-lg flex items-center justify-center gap-3 md:gap-4 group transition-all duration-300 hover:scale-[1.03] active:scale-[0.98] shadow-[0_15px_30px_-5px_rgba(46,204,113,0.3)]"
            >
              Archive to My Garden
              <ArrowRight className="w-5 h-5 md:w-6 md:h-6 group-hover:translate-x-2 transition-transform duration-300" />
            </button>
            <div className="flex flex-wrap items-center justify-center gap-3 md:gap-6 text-forest-muted/40 uppercase text-[9px] md:text-[10px] font-black tracking-[0.2em]">
              <span>Scientific Scan Verified</span>
              <div className="hidden sm:block w-1 h-1 bg-white/20 rounded-full" />
              <span>Full Archive Integration</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
