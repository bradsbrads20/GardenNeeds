export interface Plant {
  id: string;
  name: string;
  species: string;
  careTips: string;
  imageUrl: string;
  lastWatered?: string;
  nextWatering?: string;
  colors: string[]; // Palette extracted from image
  logs: { date: string }[];
  confidence?: number;
  status?: 'success' | 'uncertain' | 'suggestion';
  suggestions?: { name: string; species: string }[];
  imageQuality?: string;
}

export interface ThemeColors {
  primary: string;
  secondary: string;
  accent: string;
  background: string;
  text: string;
}
