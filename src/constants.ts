/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { InventoryItem, GatheringNode, CombatAction, Season } from './types';

export const DAYS_PER_SEASON = 30;
export const SEASONS: Season[] = ['Spring', 'Summer', 'Autumn', 'Winter'];

export const ITEMS: Record<string, Omit<InventoryItem, 'quantity'>> = {
  'iron_ore': {
    id: 'iron_ore',
    name: '鐵礦石',
    description: '一塊粗糙的鐵礦石。',
    type: 'material',
    rarity: 'common',
    price: 5,
  },
  'wild_berry': {
    id: 'wild_berry',
    name: '野果',
    description: '普遍的鮮紅野果。',
    type: 'consumable',
    effect: '恢復 3 HP',
    rarity: 'common',
    price: 2,
  },
  'iron_ingot': {
    id: 'iron_ingot',
    name: '鐵錠',
    description: '精煉後的純淨鐵錠。',
    type: 'material',
    rarity: 'uncommon',
    price: 15,
  },
  'crystal_fragment': {
    id: 'crystal_fragment',
    name: '水晶碎片',
    description: '閃爍著奇異的能量。',
    type: 'material',
    rarity: 'rare',
    price: 50,
  },
  'herbal_medicine': {
    id: 'herbal_medicine',
    name: '草藥',
    description: '一種普通的治療藥草。',
    type: 'consumable',
    effect: '恢復 20 HP',
    rarity: 'uncommon',
    price: 10,
  },
  'wild_berry_jam': {
    id: 'wild_berry_jam',
    name: '野果果醬',
    description: '製作簡單的果醬。',
    type: 'consumable',
    effect: '恢復 15 HP',
    rarity: 'uncommon',
    price: 12,
  },
  'mint_green': {
    id: 'mint_green',
    name: '綠色薄荷',
    description: '春季特有的清涼薄荷，聞起來有嫩草的味道。',
    type: 'material',
    rarity: 'common',
    price: 20,
  },
  'mint_red': {
    id: 'mint_red',
    name: '紅色薄荷',
    description: '夏季特有的溫暖薄荷，帶著微弱的熱氣。',
    type: 'material',
    rarity: 'common',
    price: 20,
  },
  'mint_yellow': {
    id: 'mint_yellow',
    name: '黃色薄荷',
    description: '秋季特有的甘甜薄荷，像熟成的果實。',
    type: 'material',
    rarity: 'common',
    price: 20,
  },
  'mint_blue': {
    id: 'mint_blue',
    name: '藍色薄荷',
    description: '冬季特有的冰涼薄荷，寒氣逼人。',
    type: 'material',
    rarity: 'common',
    price: 20,
  },
};

export const GATHERING_NODES: GatheringNode[] = [
  {
    id: 'node_forest',
    name: '蒼翠叢林',
    type: 'foraging',
    possibleDrops: [
      { itemId: 'wild_berry', chance: 0.7 },
      { itemId: 'herbal_medicine', chance: 0.03 },
    ],
    cooldown: 1,
  },
  {
    id: 'node_cave',
    name: '幽暗裂隙',
    type: 'mining',
    possibleDrops: [
      { itemId: 'iron_ore', chance: 0.6 },
      { itemId: 'crystal_fragment', chance: 0.05 },
    ],
    cooldown: 2,
  },
];

export const PLAYER_ACTIONS: CombatAction[] = [
  {
    id: 'attack',
    name: '普通攻擊',
    type: 'attack',
    power: 1,
    description: '基本的物理攻擊。',
  },
  {
    id: 'heavy_slash',
    name: '重擊',
    type: 'skill',
    power: 2,
    mpCost: 10,
    description: '造成大量傷害，但消耗 MP。',
  },
  {
    id: 'mend',
    name: '冥想治療',
    type: 'skill',
    power: -30, // Negative power for healing
    mpCost: 15,
    description: '使用精氣治癒傷口。',
  },
];

export const SEASONAL_ENEMIES: Record<Season, any[]> = {
  'Spring': [
    { 
      name: '花開史萊姆', 
      stats: { hp: 40, attack: 6, defense: 3 },
      drops: [{ itemId: 'wild_berry', chance: 0.5 }]
    },
    { 
      name: '春之妖精', 
      stats: { hp: 50, attack: 10, defense: 4 },
      drops: [{ itemId: 'herbal_medicine', chance: 0.3 }]
    }
  ],
  'Summer': [
    { 
      name: '熔岩怪', 
      stats: { hp: 80, attack: 15, defense: 8 },
      drops: [{ itemId: 'iron_ore', chance: 0.6 }]
    },
    { 
      name: '烈日巨蠍', 
      stats: { hp: 70, attack: 18, defense: 5 },
      drops: [{ itemId: 'wild_berry', chance: 0.2 }]
    }
  ],
  'Autumn': [
    { 
      name: '枯葉靈', 
      stats: { hp: 60, attack: 12, defense: 6 },
      drops: [{ itemId: 'herbal_medicine', chance: 0.4 }]
    },
    { 
      name: '豐收巨熊', 
      stats: { hp: 120, attack: 22, defense: 10 },
      drops: [{ itemId: 'wild_berry', chance: 0.8 }]
    }
  ],
  'Winter': [
    { 
      name: '冰晶史萊姆', 
      stats: { hp: 90, attack: 14, defense: 12 },
      drops: [{ itemId: 'crystal_fragment', chance: 0.2 }]
    },
    { 
      name: '霜降巨魔', 
      stats: { hp: 200, attack: 25, defense: 15 },
      drops: [{ itemId: 'iron_ore', chance: 0.9 }]
    }
  ]
};

export const COMMON_ENEMIES = [
  { 
    name: '史萊姆', 
    stats: { hp: 30, attack: 5, defense: 2 },
    drops: [{ itemId: 'wild_berry', chance: 0.3 }]
  },
  { 
    name: '森之狼', 
    stats: { hp: 60, attack: 12, defense: 5 },
    drops: [{ itemId: 'herbal_medicine', chance: 0.2 }, { itemId: 'wild_berry', chance: 0.4 }]
  },
  { 
    name: '古代巨像', 
    stats: { hp: 150, attack: 20, defense: 15 },
    drops: [{ itemId: 'iron_ore', chance: 0.8 }, { itemId: 'crystal_fragment', chance: 0.1 }]
  }
];
