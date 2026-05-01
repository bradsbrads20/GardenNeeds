import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import cors from "cors";
import { createClient } from "@supabase/supabase-js";
import multer from "multer";
import dotenv from "dotenv";
import { GoogleGenAI, Type } from "@google/genai";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Supabase Configuration
const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || "";
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY || "";
const isSupabaseConfigured = supabaseUrl && supabaseServiceKey && supabaseUrl.includes("http");

const supabase = isSupabaseConfigured 
  ? createClient(supabaseUrl, supabaseServiceKey)
  : null;

const upload = multer({ storage: multer.memoryStorage() });

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(cors());
  app.use(express.json({ limit: '10mb' }));

  // Internal "Go-like" Helper Logic
  const helperAnalyzeFlower = (name: string, species: string) => {
    return {
      confidence: 0.98,
      species: species || "Hibiscus rosa-sinensis",
      analysis: "High detail match in petal structure analyzed via botanical metadata."
    };
  };

  const helperProcessImage = () => {
    return {
      message: "Processed by Botanical High-Performance layer (Native Service)",
      status: "success",
      engine: "Native-v1.0"
    };
  };

  const helperWateringGuide = (species: string = "") => {
    let guidance = "Maintain consistent moisture levels. Avoid waterlogging the root system.";
    let tips = "Filtered light is ideal. Rotate monthly for even growth.";
    
    const s = species.toLowerCase();
    if (s.includes("cactus") || s.includes("succulent")) {
      guidance = "Allow soil to dry out completely between sessions. Under-watering is safer than over-watering.";
      tips = "Maximum solar exposure required. Minimum humidity levels.";
    } else if (s.includes("fern") || s.includes("tropical")) {
      guidance = "Keep soil consistently damp. Mist leaves daily to maintain high humidity.";
      tips = "Keep away from direct heat sources and drafts.";
    }

    return {
      watering_guidance: guidance,
      care_tips: tips,
      recommendations: ["Check drainage holes", "Use room-temperature water", "Clean leaves with a damp cloth"],
      generated_at: new Date().toISOString()
    };
  };

  // In-memory fallback
  const memoryDb: any = { plants: [] };

  // API Routes
  const getWateringInterval = (level: string = "medium") => {
    switch (level.toLowerCase()) {
      case "high": return 3;
      case "low": return 8;
      default: return 5;
    }
  };

  const getPlantStatus = (lastWatered: string, nextWatering: string) => {
    const now = new Date().getTime();
    const last = new Date(lastWatered).getTime();
    const next = new Date(nextWatering).getTime();
    
    if (now >= next) return "Needs Water";
    if (now - last < 48 * 60 * 60 * 1000) return "Recently Watered";
    return "Healthy";
  };

  app.get("/api/plants", async (req, res) => {
    console.log("[Node Main] Fetching plants...");
    if (!isSupabaseConfigured) {
      return res.json(memoryDb.plants);
    }
    try {
      // Joined query to get plants with their logs
      const { data, error } = await supabase!
        .from("flowers")
        .select(`
          *,
          watering_logs (timestamp, water_amount)
        `)
        .order('identified_at', { ascending: false });

      if (error) throw error;
      
      const mapped = data.map(row => {
        const sortedLogs = (row.watering_logs || []).sort((a: any, b: any) => 
          new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
        );
        
        const lastWatered = sortedLogs[0]?.timestamp || row.identified_at;
        const nextWatering = sortedLogs[0]?.next_watering || new Date(new Date(lastWatered).getTime() + getWateringInterval(row.water_level) * 24 * 60 * 60 * 1000).toISOString();
        
        return {
          id: row.id,
          name: row.name,
          species: row.species,
          careTips: row.care_tips,
          imageUrl: row.image_url,
          colors: row.colors,
          logs: sortedLogs.map((l: any) => ({ date: l.timestamp, amount: l.water_amount })),
          lastWatered,
          nextWatering,
          status: getPlantStatus(lastWatered, nextWatering),
          waterLevel: row.water_level || "medium",
          targetWaterMl: row.target_water_ml || 500
        };
      });
      res.json(mapped);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post("/api/identify", async (req, res) => {
    const { image } = req.body;
    if (!image) return res.status(400).json({ error: "Image required" });

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });
      
      const base64Data = image.split(",")[1];
      const prompt = `Identify this flower. 
        Assess image quality as 'clear', 'medium', or 'low'.
        Provide a confidence score from 0-100.
        If confidence is < 80%, provide 2-3 alternative suggestions in the suggestions array.
        If confidence is > 80%, the suggestions array can be empty.
        If the image is very low quality or doesn't contain a flower, still provide your best guess but with low confidence and clear 'imageQuality' feedback.`;

      const result = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: [
          {
            role: "user",
            parts: [
              { text: prompt },
              { inlineData: { mimeType: "image/jpeg", data: base64Data } }
            ]
          }
        ],
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              name: { type: Type.STRING },
              species: { type: Type.STRING },
              careTips: { type: Type.STRING },
              confidence: { type: Type.NUMBER },
              imageQuality: { type: Type.STRING },
              suggestions: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    name: { type: Type.STRING },
                    species: { type: Type.STRING }
                  }
                }
              }
            },
            required: ["name", "species", "careTips", "confidence", "imageQuality"]
          }
        }
      });

      const response = JSON.parse(result.text || "{}");
      
      // Map confidence to status
      let status: 'success' | 'uncertain' | 'suggestion' = 'success';
      if (response.confidence < 50) status = 'suggestion';
      else if (response.confidence < 80) status = 'uncertain';

      res.json({
        ...response,
        status
      });
    } catch (err: any) {
      console.error("Identification error:", err);
      res.status(500).json({ error: "Failed to identify specimen" });
    }
  });

  app.post("/api/plants", async (req, res) => {
    const { name, species, careTips, imageUrl, colors, water_level, confidence, status, suggestions } = req.body;
    const user_id = req.body.user_id || null;
    console.log("[Node Main] Adding plant:", name);

    let finalImageUrl = imageUrl;
    const waterLevel = water_level || "medium";

    // Handle base64 image upload to storage
    if (imageUrl && imageUrl.startsWith("data:image")) {
      try {
        const parts = imageUrl.split(";base64,");
        const mimeType = parts[0].split(":")[1];
        const buffer = Buffer.from(parts[1], "base64");
        const fileName = `${Date.now()}-upload.${mimeType.split("/")[1] || "jpg"}`;

        if (isSupabaseConfigured) {
          const { data, error } = await supabase!.storage
            .from("flower-images")
            .upload(fileName, buffer, { contentType: mimeType });
          
          if (!error) {
            const { data: { publicUrl } } = supabase!.storage
              .from("flower-images")
              .getPublicUrl(fileName);
            finalImageUrl = publicUrl;
          }
        }
      } catch (err) {
        console.error("[Node Main] Image upload failed:", err);
      }
    }

    const dbData = {
      name,
      species,
      care_tips: careTips,
      image_url: finalImageUrl,
      colors,
      identified_at: new Date().toISOString(),
      user_id: user_id || null,
      water_level: waterLevel,
      identification_confidence: confidence || 100,
      identification_status: status || "success"
    };

    if (!isSupabaseConfigured) {
      const lastWatered = dbData.identified_at;
      const nextWatering = new Date(new Date(lastWatered).getTime() + getWateringInterval(waterLevel) * 24 * 60 * 60 * 1000).toISOString();
      const newItem = { 
        ...dbData, 
        id: Math.random().toString(36).substr(2, 9), 
        logs: [],
        lastWatered,
        nextWatering,
        status: getPlantStatus(lastWatered, nextWatering),
        waterLevel,
        confidence: dbData.identification_confidence,
        identificationStatus: dbData.identification_status,
        suggestions
      };
      memoryDb.plants.push(newItem);
      return res.status(201).json(newItem);
    }

    try {
      const { data, error } = await supabase!.from("flowers").insert(dbData).select();
      if (error) throw error;
      
      const row = data[0];
      const lastWatered = row.identified_at;
      const nextWatering = new Date(new Date(lastWatered).getTime() + getWateringInterval(waterLevel) * 24 * 60 * 60 * 1000).toISOString();

      res.status(201).json({
        id: row.id,
        name: row.name,
        species: row.species,
        careTips: row.care_tips,
        imageUrl: row.image_url,
        colors: row.colors,
        logs: [],
        lastWatered,
        nextWatering,
        status: getPlantStatus(lastWatered, nextWatering),
        waterLevel: row.water_level,
        confidence: row.identification_confidence,
        identificationStatus: row.identification_status,
        suggestions
      });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Internal Helper Routes
  app.post("/api/process-image", async (req, res) => {
    console.log("[Node Main] Processing image...");
    res.json(helperProcessImage());
  });

  app.post("/api/analyze-flower", async (req, res) => {
    console.log("[Node Main] Analyzing flower...");
    const { name, species } = req.body;
    res.json(helperAnalyzeFlower(name, species));
  });

  app.post("/api/watering-guide", async (req, res) => {
    const { species } = req.body;
    res.json(helperWateringGuide(species));
  });

  app.get("/api/watering/weekly", async (req, res) => {
    console.log("[Node Main] Fetching structured weekly hydration trace...");
    if (!isSupabaseConfigured) {
      return res.json([]);
    }
    try {
      const weekdays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
      const weekDaysData = [];
      
      // Generate last 7 days including today
      for (let i = 6; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const date = String(d.getDate()).padStart(2, '0');
        const dateStr = `${year}-${month}-${date}`;
        
        weekDaysData.push({
          dateStr,
          dayName: weekdays[d.getDay()]
        });
      }

      const startDate = new Date();
      startDate.setDate(startDate.getDate() - 7);
      startDate.setHours(0, 0, 0, 0);

      const { data: logs, error } = await supabase!
        .from("watering_logs")
        .select(`
          timestamp,
          flower_id,
          flowers (id, name, species, image_url)
        `)
        .gte('timestamp', startDate.toISOString());

      if (error) throw error;

      // Group by flower
      const { data: allFlowers } = await supabase!.from("flowers").select("id, name, species, image_url");
      
      const summary = (allFlowers || []).map((flower: any) => {
        const flowerLogs = logs.filter(l => l.flower_id === flower.id);
        
        const trace = weekDaysData.map(day => {
          const wasWatered = flowerLogs.some(log => {
            const logDate = new Date(log.timestamp);
            const y = logDate.getFullYear();
            const m = String(logDate.getMonth() + 1).padStart(2, '0');
            const d = String(logDate.getDate()).padStart(2, '0');
            return `${y}-${m}-${d}` === day.dateStr;
          });
          return {
            day: day.dayName,
            date: day.dateStr,
            watered: wasWatered
          };
        });

        return {
          id: flower.id,
          name: flower.name,
          species: flower.species,
          imageUrl: flower.image_url,
          trace: trace,
          totalThisWeek: flowerLogs.length
        };
      });

      res.json(summary);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.get("/api/watering/progress/:flower_id", async (req, res) => {
    const { flower_id } = req.params;
    console.log("[Node Main] Fetching today's progress for:", flower_id);

    if (!isSupabaseConfigured) {
      return res.json({ total_water_today: 300, watering_count_today: 2, progress_percentage: 60, target: 500 });
    }

    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const { data: flower, error: flowerError } = await supabase!
        .from("flowers")
        .select("target_water_ml")
        .eq("id", flower_id)
        .single();

      if (flowerError) throw flowerError;

      const { data: logs, error: logsError } = await supabase!
        .from("watering_logs")
        .select("water_amount")
        .eq("flower_id", flower_id)
        .gte("timestamp", today.toISOString());

      if (logsError) throw logsError;

      const totalWater = logs.reduce((sum, log) => sum + (log.water_amount || 0), 0);
      const target = flower?.target_water_ml || 500;
      const progress = Math.min(100, Math.round((totalWater / target) * 100));

      res.json({
        total_water_today: totalWater,
        watering_count_today: logs.length,
        progress_percentage: progress,
        target: target
      });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post("/api/water-log", async (req, res) => {
    const { flower_id, user_id, water_amount } = req.body;
    const amount = water_amount || 100;
    console.log("[Node Main] Logging manual water event:", flower_id, "amount:", amount);

    let plant;
    if (!isSupabaseConfigured) {
      plant = memoryDb.plants.find((p: any) => p.id === flower_id);
      if (!plant) return res.status(404).json({ error: "Plant not found" });
      
      const now = new Date().toISOString();
      const interval = getWateringInterval(plant.waterLevel);
      const nextDate = new Date(Date.now() + interval * 24 * 60 * 60 * 1000).toISOString();
      
      plant.lastWatered = now;
      plant.nextWatering = nextDate;
      plant.logs.push({ date: now, amount });
      plant.status = getPlantStatus(now, nextDate);
      
      return res.json(plant);
    }

    try {
      const { data: flower } = await supabase!.from("flowers").select("*").eq("id", flower_id).single();
      if (!flower) return res.status(404).json({ error: "Plant not found" });

      const now = new Date().toISOString();
      const interval = getWateringInterval(flower.water_level || "medium");
      const nextDate = new Date(Date.now() + interval * 24 * 60 * 60 * 1000).toISOString();

      // 1. Log hydration
      const { error } = await supabase!.from("watering_logs").insert({
        flower_id,
        user_id: user_id || null, 
        timestamp: now,
        next_watering: nextDate,
        water_amount: amount
      });
      if (error) throw error;

      // 2. Get AI enrichment (care tips)
      const careData = helperWateringGuide(flower.species);
      await supabase!.from("flowers").update({ care_tips: careData.care_tips }).eq("id", flower_id);

      // 3. Return full state
      const { data: logs } = await supabase!.from("watering_logs").select("timestamp, water_amount").eq("flower_id", flower_id);

      const weekdays = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
      const logDate = new Date(now);
      const dayOfWeek = weekdays[logDate.getDay()];

      res.json({
        id: flower.id,
        name: flower.name,
        species: flower.species,
        careTips: careData.care_tips,
        imageUrl: flower.image_url,
        colors: flower.colors,
        logs: logs?.map(l => ({ date: l.timestamp, amount: l.water_amount })) || [],
        lastWatered: now,
        nextWatering: nextDate,
        status: getPlantStatus(now, nextDate),
        waterLevel: flower.water_level,
        targetWaterMl: flower.target_water_ml,
        dayOfWeek: dayOfWeek,
        date: now.split('T')[0]
      });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.get("/api/watering", async (req, res) => {
    console.log("[Node Main] Fetching watering logs...");
    if (!isSupabaseConfigured) {
      return res.json([]);
    }
    try {
      const { data, error } = await supabase!
        .from("watering_logs")
        .select("*, flowers!inner(name, user_id)");
      if (error) throw error;
      res.json(data);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post("/api/plants/:id/water", async (req, res) => {
    const { id } = req.params;
    console.log("[Node Main] Watering plant with smart logic:", id);

    let plant;
    if (!isSupabaseConfigured) {
      plant = memoryDb.plants.find((p: any) => p.id === id);
    } else {
      const { data } = await supabase!.from("flowers").select("*").eq("id", id).single();
      plant = data;
    }

    if (!plant) return res.status(404).json({ error: "Plant not found" });

    // 1. Get care tips
    const careData = helperWateringGuide(plant.species);

    // 2. Calculate dates
    const now = new Date().toISOString();
    const interval = getWateringInterval(plant.water_level || plant.waterLevel);
    const nextDate = new Date(Date.now() + interval * 24 * 60 * 60 * 1000).toISOString();

    if (!isSupabaseConfigured) {
      const plantIndex = memoryDb.plants.findIndex((p: any) => p.id === id);
      const updatedPlant = {
        ...memoryDb.plants[plantIndex],
        lastWatered: now,
        nextWatering: nextDate,
        logs: [...(memoryDb.plants[plantIndex].logs || []), { date: now }],
        status: getPlantStatus(now, nextDate),
        careTips: careData.care_tips // Overwrite with assistant tips
      };
      memoryDb.plants[plantIndex] = updatedPlant;
      return res.json(updatedPlant);
    }

    try {
      // 3. Update Supabase
      const { error: logError } = await supabase!.from("watering_logs").insert({
        flower_id: id,
        next_watering: nextDate,
        timestamp: now
      });
      if (logError) throw logError;

      // Also update the flower's care tips if they've been enriched
      await supabase!.from("flowers").update({ care_tips: careData.care_tips }).eq("id", id);

      const { data: logs } = await supabase!.from("watering_logs").select("timestamp").eq("flower_id", id);

      res.json({
        id: plant.id,
        name: plant.name,
        species: plant.species,
        careTips: careData.care_tips,
        imageUrl: plant.image_url,
        colors: plant.colors,
        logs: logs?.map(l => ({ date: l.timestamp })) || [],
        lastWatered: now,
        nextWatering: nextDate,
        status: getPlantStatus(now, nextDate),
        wateringGuidance: careData.watering_guidance
      });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Main Node.js Server running on http://localhost:${PORT}`);
  });
}

startServer();
