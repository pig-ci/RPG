/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type Season = 'Spring' | 'Summer' | 'Autumn' | 'Winter';

export interface CalendarState {
  day: number;
  season: Season;
  year: number;
  period: 'Morning' | 'Night';
}

export interface CharacterStats {
  hp: number;
  maxHp: number;
  mp: number;
  maxMp: number;
  attack: number;
  defense: number;
  speed: number;
  level: number;
  exp: number;
  nextLevelExp: number;
}

export interface InventoryItem {
  id: string;
  name: string;
  description: string;
  type: 'material' | 'consumable' | 'equipment';
  effect?: string;
  quantity: number;
  rarity: 'common' | 'uncommon' | 'rare' | 'epic';
  price?: number;
}

export interface GatheringNode {
  id: string;
  name: string;
  type: 'mining' | 'foraging' | 'fishing';
  requiredSeason?: Season;
  possibleDrops: { itemId: string; chance: number }[];
  cooldown: number; // in days
  lastGatheredDay?: number;
}

export interface CombatEntity {
  id: string;
  name: string;
  stats: CharacterStats;
  isPlayer: boolean;
  activeBuffs: string[];
  drops?: { itemId: string; chance: number }[];
}

export interface CombatAction {
  id: string;
  name: string;
  type: 'attack' | 'skill' | 'item' | 'flee';
  power?: number;
  mpCost?: number;
  description: string;
}

export type GameView = 'Map' | 'Combat' | 'Gathering' | 'Inventory' | 'Status' | 'Shop';

export interface GameState {
  player: CombatEntity;
  inventory: InventoryItem[];
  calendar: CalendarState;
  view: GameView;
  logs: string[];
  gold: number;
}
