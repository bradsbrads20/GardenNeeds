import { useState } from "react";
import { Droplet, Calendar, Plus, Clock, ExternalLink, Leaf, Beaker } from "lucide-react";
import { Plant } from "../types";
import { cn } from "../lib/utils";
import { motion } from "framer-motion"; // ✅ FIXED
import { WateringGuide } from "./WateringGuide";
import { WeeklyTracker } from "./WeeklyTracker";
import { HydrationProgress } from "./HydrationProgress";

interface DashboardProps {
  plants: Plant[];
  setPlants: (plants: Plant[]) => void;
}

export function Dashboard({ plants, setPlants }: DashboardProps) {
  const [selectedPlant, setSelectedPlant] = useState<Plant | null>(plants[0] ?? null);
  const [wateringLoading, setWateringLoading] = useState<string | null>(null);
  const [isGuideOpen, setIsGuideOpen] = useState(false);
  const [guidePlant, setGuidePlant] = useState<Plant | null>(null);
  const [waterAmounts, setWaterAmounts] = useState<Record<string, number>>({});
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const waterPlant = async (id: string) => {
    const amount = waterAmounts[id] ?? 100;
    setWateringLoading(id);

    try {
      const res = await fetch("/.netlify/functions/water-log", { // ✅ FIXED (Netlify)
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ flower_id: id, water_amount: amount })
      });

      if (!res.ok) throw new Error("Request failed");

      const updatedPlant: Plant = await res.json();

      const updatedPlants = plants.map(p => p.id === id ? updatedPlant : p);
      setPlants(updatedPlants);

      if (selectedPlant?.id === id) {
        setSelectedPlant(updatedPlant);
      }

      setGuidePlant(updatedPlant);
      setIsGuideOpen(true);
      setRefreshTrigger(prev => prev + 1);

    } catch (err) {
      console.error("Failed to water plant", err);
    } finally {
      setWateringLoading(null);
    }
  };

  const handleAmountChange = (id: string, val: string) => {
    const num = parseInt(val || "0"); // ✅ safer
    setWaterAmounts(prev => ({ ...prev, [id]: num }));
  };

  if (plants.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center text-center py-32 px-6">
        <Plus className="w-12 h-12 text-green-500 mb-4" />
        <h2 className="text-2xl font-bold">No plants yet</h2>
        <p className="text-gray-400">Add your first plant 🌱</p>
      </div>
    );
  }

  return (
    <div className="space-y-10">

      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-white">
          My Garden ({plants.length})
        </h1>
      </div>

      {/* Plants Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {plants.map((plant) => (
          <motion.div
            key={plant.id}
            whileHover={{ y: -5 }}
            className="bg-gray-900 rounded-2xl p-4"
          >
            <img
              src={plant.imageUrl}
              alt={plant.name}
              className="w-full h-40 object-cover rounded-xl"
            />

            <h3 className="text-xl font-bold mt-3">{plant.name}</h3>
            <p className="text-sm text-green-400 italic">{plant.species}</p>

            {/* Hydration */}
            <HydrationProgress
              flowerId={plant.id}
              refreshTrigger={refreshTrigger}
            />

            {/* Water input */}
            <div className="flex items-center gap-2 mt-3">
              <Beaker className="w-4 h-4 text-green-400" />
              <input
                type="number"
                value={waterAmounts[plant.id] ?? 100}
                onChange={(e) => handleAmountChange(plant.id, e.target.value)}
                className="w-16 bg-black text-white px-2 py-1 rounded"
              />
              <span className="text-xs">ml</span>
            </div>

            {/* Water button */}
            <button
              onClick={() => waterPlant(plant.id)}
              disabled={wateringLoading === plant.id}
              className="mt-4 w-full bg-green-500 text-black py-2 rounded-lg"
            >
              {wateringLoading === plant.id ? "Watering..." : "Water"}
            </button>

            {/* Info */}
            <div className="mt-3 text-xs text-gray-400">
              Last:{" "}
              {plant.lastWatered
                ? new Date(plant.lastWatered).toLocaleDateString()
                : "Never"}
            </div>
          </motion.div>
        ))}
      </div>

      {/* Weekly tracker */}
      <WeeklyTracker plants={plants} refreshTrigger={refreshTrigger} />

      {/* Modal */}
      {selectedPlant && (
        <div className="fixed inset-0 bg-black/70 flex justify-center items-center">
          <div className="bg-gray-900 p-6 rounded-2xl max-w-lg w-full">
            <h2 className="text-2xl font-bold">{selectedPlant.name}</h2>
            <p className="text-gray-400">{selectedPlant.careTips}</p>

            {/* Logs */}
            <div className="mt-4">
              <h4 className="font-bold flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                Activity
              </h4>

              {selectedPlant.logs?.length ? (
                selectedPlant.logs.slice(0, 5).map((log, i) => (
                  <div key={i} className="text-sm text-gray-400">
                    {new Date(log.date).toLocaleString()}
                  </div>
                ))
              ) : (
                <p className="text-gray-500 text-sm">No logs</p>
              )}
            </div>

            <button
              onClick={() => setSelectedPlant(null)}
              className="mt-4 w-full bg-red-500 py-2 rounded"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* Guide */}
      <WateringGuide
        plant={guidePlant}
        isOpen={isGuideOpen}
        onClose={() => setIsGuideOpen(false)}
      />
    </div>
  );
}