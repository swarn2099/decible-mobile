import type {
  BadgeId,
  BadgeCategory,
  BadgeDefinition,
  BadgeRarity,
} from "@/types/badges";

export const BADGE_DEFINITIONS: Record<BadgeId, BadgeDefinition> = {
  // --- Discovery ---
  trailblazer: {
    id: "trailblazer",
    name: "Trailblazer",
    description: "Discovered 10 artists online",
    category: "discovery",
    rarity: "rare",
    icon: "\u{1F52D}",
    criteria: "Discover 10 artists via online collection",
  },
  "first-100": {
    id: "first-100",
    name: "First 100",
    description: "Among the first 100 fans on Decibel",
    category: "discovery",
    rarity: "legendary",
    icon: "\u{1F48E}",
    criteria: "Be one of the first 100 fans to join Decibel",
  },
  "first-10-verified": {
    id: "first-10-verified",
    name: "Verified Ten",
    description: "10 verified collections",
    category: "discovery",
    rarity: "epic",
    icon: "\u2705",
    criteria: "Earn 10 verified (in-person) collections",
  },

  // --- Attendance ---
  regular: {
    id: "regular",
    name: "Regular",
    description: "Attended 5 shows",
    category: "attendance",
    rarity: "common",
    icon: "\u{1F3B6}",
    criteria: "Attend 5 verified shows",
  },
  devotee: {
    id: "devotee",
    name: "Devotee",
    description: "Attended 20 shows",
    category: "attendance",
    rarity: "rare",
    icon: "\u{1F525}",
    criteria: "Attend 20 verified shows",
  },
  "inner-circle-badge": {
    id: "inner-circle-badge",
    name: "Inner Circle",
    description: "Reached Inner Circle tier with any artist",
    category: "attendance",
    rarity: "epic",
    icon: "\u{1F451}",
    criteria: "Reach Inner Circle tier (10+ scans) with any artist",
  },
  "venue-local": {
    id: "venue-local",
    name: "Venue Local",
    description: "Visited the same venue 5 times",
    category: "attendance",
    rarity: "rare",
    icon: "\u{1F3E0}",
    criteria: "Visit the same venue 5 times",
  },
  "venue-legend": {
    id: "venue-legend",
    name: "Venue Legend",
    description: "Visited the same venue 20 times",
    category: "attendance",
    rarity: "legendary",
    icon: "\u{1F3DF}\uFE0F",
    criteria: "Visit the same venue 20 times",
  },

  // --- Exploration ---
  "genre-explorer": {
    id: "genre-explorer",
    name: "Genre Explorer",
    description: "Collected artists across 5+ genres",
    category: "exploration",
    rarity: "common",
    icon: "\u{1F3A8}",
    criteria: "Collect artists spanning 5 or more genres",
  },
  "city-hopper": {
    id: "city-hopper",
    name: "City Hopper",
    description: "Attended shows in 3+ cities",
    category: "exploration",
    rarity: "rare",
    icon: "\u2708\uFE0F",
    criteria: "Attend shows in 3 or more cities",
  },
  "night-owl": {
    id: "night-owl",
    name: "Night Owl",
    description: "Collected at 3+ unique venues",
    category: "exploration",
    rarity: "common",
    icon: "\u{1F989}",
    criteria: "Collect at 3 or more unique venues",
  },
  "scene-veteran": {
    id: "scene-veteran",
    name: "Scene Veteran",
    description: "Member for 6+ months",
    category: "exploration",
    rarity: "rare",
    icon: "\u{1F396}\uFE0F",
    criteria: "Be a Decibel member for at least 6 months",
  },
  centurion: {
    id: "centurion",
    name: "Centurion",
    description: "100 total collections",
    category: "exploration",
    rarity: "legendary",
    icon: "\u{1F4AF}",
    criteria: "Reach 100 total collections (verified + discovered)",
  },

  // --- Streak ---
  "on-fire": {
    id: "on-fire",
    name: "On Fire",
    description: "3-week attendance streak",
    category: "streak",
    rarity: "common",
    icon: "\u{1F525}",
    criteria: "Maintain a 3-week attendance streak",
  },
  unstoppable: {
    id: "unstoppable",
    name: "Unstoppable",
    description: "8-week attendance streak",
    category: "streak",
    rarity: "rare",
    icon: "\u26A1",
    criteria: "Maintain an 8-week attendance streak",
  },
  "year-round": {
    id: "year-round",
    name: "Year-Round",
    description: "26-week attendance streak",
    category: "streak",
    rarity: "legendary",
    icon: "\u{1F31F}",
    criteria: "Maintain a 26-week attendance streak (half a year)",
  },

  // --- Social ---
  tastemaker: {
    id: "tastemaker",
    name: "Tastemaker",
    description: "Discovered 25 artists",
    category: "social",
    rarity: "rare",
    icon: "\u{1F3A7}",
    criteria: "Discover 25 artists via online collection",
  },
  connector: {
    id: "connector",
    name: "Connector",
    description: "Shared passport publicly",
    category: "social",
    rarity: "common",
    icon: "\u{1F517}",
    criteria:
      "Have 10+ total collections (proxy for sharing until share tracking exists)",
  },

  // --- Special ---
  founder: {
    id: "founder",
    name: "Founder",
    description: "You were the first to add this artist to Decibel",
    category: "discovery",
    rarity: "legendary",
    icon: "\u{1F31F}",
    criteria: "Be the first person to add an artist to Decibel",
  },
};

/** Rarity color mapping for badge visuals */
export const RARITY_COLORS: Record<BadgeRarity, string> = {
  common: "#8E8E9A",
  rare: "#4D9AFF",
  epic: "#9B6DFF",
  legendary: "#FFD700",
};

/** Get all badge definitions for a given category */
export function getBadgesByCategory(
  category: BadgeCategory
): BadgeDefinition[] {
  return Object.values(BADGE_DEFINITIONS).filter(
    (b) => b.category === category
  );
}
