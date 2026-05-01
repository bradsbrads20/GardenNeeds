import React, { useState, useRef } from "react";
import { Trash2, Camera, Search, Loader2, Leaf } from "lucide-react";
import { extractColorsFromImage, cn } from "../lib/utils";
import { Plant } from "../types";
import { motion } from "motion/react";

interface LandingProps {
  onIdentify: (plant: Plant) => void;
}

export function Landing({ onIdentify }: LandingProps) {
  const [image, setImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const identifyFlower = async () => {
    if (!image) return;
    setLoading(true);

    try {
      // 1. Send to "Go Service" for high-performance processing (simulated via API proxy)
      try {
        const processRes = await fetch("/api/process-image", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ image: image.slice(0, 100) + "..." })
        });
        if (processRes.ok) {
          const processInfo = await processRes.json();
          console.log("Image processing status:", processInfo);
        }
      } catch (e) {
        console.warn("Go service unreachable or failed", e);
      }

      // 2. Extract colors locally for UI immediate feedback
      const colors = await extractColorsFromImage(image);

      // 3. AI Identification using Backend
      const idRes = await fetch("/api/identify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image })
      });

      if (!idRes.ok) throw new Error("Identification service returned error");
      const result = await idRes.json();
      
      const plant: Plant = {
        id: "", 
        name: result.name || "Unknown Flower",
        species: result.species || "Unknown Species",
        careTips: result.careTips || "Water regularly and ensure adequate sunlight.",
        imageUrl: image,
        colors,
        logs: [],
        confidence: result.confidence,
        status: result.status,
        suggestions: result.suggestions,
        imageQuality: result.imageQuality
      };

      onIdentify(plant);
    } catch (error) {
      console.error("Identification failed:", error);
      // Instead of just an alert, we can still allow adding the plant as "Unknown" if user wants
      const fallback: Plant = {
        id: "",
        name: "Unknown Specimen",
        species: "Unknown Species",
        careTips: "Basic botanical care recommended: moderate water and light.",
        imageUrl: image || "",
        colors: ["#2ecc71"],
        logs: [],
        confidence: 0,
        status: 'suggestion',
        suggestions: []
      };
      onIdentify(fallback);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-[calc(100vh-80px)] flex flex-col items-center">
      {/* Background Decorative Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-accent/5 rounded-full blur-[120px]" />
        <div className="absolute bottom-[10%] right-[-5%] w-[30%] h-[30%] bg-primary/10 rounded-full blur-[100px]" />
      </div>

      <div className="relative z-10 flex flex-col items-center text-center max-w-5xl mx-auto py-10 md:py-20 px-4 md:px-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8 }}
          className="mb-12 md:mb-16"
        >
          <span className="inline-block px-4 py-1.5 bg-accent/10 border border-accent/20 rounded-full text-accent text-[10px] md:text-xs font-bold tracking-[0.2em] uppercase mb-6 md:mb-8 shadow-[0_0_15px_rgba(46,204,113,0.1)]">
            Powered by Spidey Tech-TSE
          </span>
          <h1 className="text-4xl sm:text-6xl md:text-8xl font-black tracking-tighter text-white mb-6 md:mb-8 leading-[0.9]">
            Hear what your <span className="text-accent italic">Garden</span> <br className="hidden sm:block"/>
            <span className="text-forest-muted">needs.</span>
          </h1>
          <p className="text-base md:text-xl text-forest-muted mb-8 md:mb-12 max-w-2xl mx-auto leading-relaxed font-light px-2">
            Professional plant analysis at your fingertips.
          </p>

          <div className="flex flex-col items-center gap-6 md:gap-8 w-full px-4 sm:px-0 relative">
            {!image ? (
              <motion.div 
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => fileInputRef.current?.click()}
                className="group cursor-pointer w-full max-w-xl p-8 md:p-16 glass-panel rounded-[1.5rem] md:rounded-[2rem] hover:bg-white/10 transition-all duration-500 hover-glow border-dashed border-2 border-white/20"
              >
                <div className="flex flex-col items-center gap-4 md:gap-6">
                  <div className="w-16 h-16 md:w-20 md:h-20 bg-accent/20 rounded-[1.5rem] md:rounded-[2rem] shadow-[0_0_25px_rgba(46,204,113,0.2)] flex items-center justify-center group-hover:rotate-12 transition-transform duration-500">
                    <Camera className="w-8 h-8 md:w-10 md:h-10 text-accent" />
                  </div>
                  <div className="space-y-1">
                    <h3 className="text-xl md:text-2xl font-bold text-white uppercase tracking-wider">Upload Specimen</h3>
                    <p className="text-forest-muted text-xs md:text-sm tracking-wide">Upload plant photo</p>
                  </div>
                </div>
                <input 
                  type="file" 
                  className="hidden" 
                  ref={fileInputRef} 
                  onChange={handleFileChange}
                  accept="image/*"
                />
              </motion.div>
            ) : (
              <motion.div 
                layoutId="preview-card"
                className="relative group rounded-[1.5rem] md:rounded-[2.5rem] overflow-hidden glass-panel p-2 md:p-3 w-full max-w-2xl"
              >
                <div className="relative rounded-[1.2rem] md:rounded-[2rem] overflow-hidden aspect-[16/10]">
                  <img src={image} alt="Preview" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                  <div className="absolute inset-0 bg-forest-base/60 opacity-100 md:opacity-0 group-hover:opacity-100 transition-opacity duration-500 flex items-center justify-center gap-4 md:gap-6 backdrop-blur-sm">
                    <button 
                      onClick={() => setImage(null)}
                      className="p-3 md:p-4 bg-white/10 border border-white/10 rounded-xl md:rounded-2xl hover:bg-red-500/20 hover:border-red-500/40 transition-all duration-300"
                      title="Discard"
                    >
                      <Trash2 className="w-5 h-5 md:w-6 md:h-6 text-white" />
                    </button>
                    <button 
                      onClick={identifyFlower}
                      disabled={loading}
                      className="px-6 md:px-10 py-3 md:py-4 bg-accent text-forest-base rounded-xl md:rounded-2xl font-black uppercase tracking-tighter flex items-center gap-2 md:gap-3 hover:scale-105 active:scale-95 transition-all shadow-[0_0_30px_rgba(46,204,113,0.4)]"
                    >
                      {loading ? <Loader2 className="w-5 h-5 md:w-6 md:h-6 animate-spin text-forest-base" /> : <Search className="w-5 h-5 md:w-6 md:h-6 text-forest-base" />}
                      <span className="text-sm md:text-base">Analyze</span>
                    </button>
                  </div>
                </div>
              </motion.div>
            )}
          </div>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8 w-full mt-12 md:mt-24 text-left border-t border-white/5 pt-12 md:pt-20">
          {[
            { title: "Bionic Vision", desc: "Identify thousands of plants instantly with high accuracy.", icon: <Search className="w-5 h-5 md:w-6 md:h-6 text-accent" /> },
            { title: "Hydra Metrics", desc: "Smart watering tracker that adjusts based on climate data.", icon: <Leaf className="w-5 h-5 md:w-6 md:h-6 text-accent" /> },
            { title: "Garden Hub", desc: "A place to store and manage all your plants in one spot.", icon: <Camera className="w-5 h-5 md:w-6 md:h-6 text-accent" /> }
          ].map((feat, i) => (
            <div key={i} className="glass-card p-6 md:p-10 rounded-[1.5rem] md:rounded-[2rem] hover-glow space-y-4 md:space-y-6">
              <div className="w-10 h-10 md:w-12 md:h-12 bg-white/5 rounded-xl flex items-center justify-center border border-white/10">
                {feat.icon}
              </div>
              <div className="space-y-2 md:space-y-3">
                <h3 className="font-bold text-lg md:text-xl text-white tracking-tight">{feat.title}</h3>
                <p className="text-xs md:text-sm text-forest-muted leading-relaxed font-medium">{feat.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
