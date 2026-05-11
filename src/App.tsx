/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Calendar, 
  Sword, 
  Pickaxe, 
  Backpack, 
  User, 
  ChevronRight, 
  Heart, 
  Zap, 
  Shield, 
  AlertCircle,
  Sun,
  Leaf,
  CloudSnow,
  Trees
} from 'lucide-react';
import { 
  GameState, 
  CombatEntity, 
  InventoryItem, 
  GameView, 
  CalendarState, 
  GatheringNode,
  CombatAction
} from './types';
import { 
  DAYS_PER_SEASON, 
  SEASONS, 
  ITEMS, 
  GATHERING_NODES, 
  PLAYER_ACTIONS,
  SEASONAL_ENEMIES,
  COMMON_ENEMIES
} from './constants';
import { Coins } from 'lucide-react';

const INITIAL_STATS = {
  hp: 100,
  maxHp: 100,
  mp: 50,
  maxMp: 50,
  attack: 15,
  defense: 10,
  speed: 10,
  level: 1,
  exp: 0,
  nextLevelExp: 100,
};

const INITIAL_PLAYER: CombatEntity = {
  id: 'player',
  name: '無名玩家',
  stats: INITIAL_STATS,
  isPlayer: true,
  activeBuffs: [],
};

const SAVE_KEY = 'harvest_legend_save';

export default function App() {
  const [gameState, setGameState] = useState<GameState>(() => {
    const saved = localStorage.getItem(SAVE_KEY);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error("Failed to load save:", e);
      }
    }
    return {
      player: INITIAL_PLAYER,
      inventory: [],
      calendar: { day: 1, season: 'Spring', year: 1, period: 'Morning' },
      view: 'Map',
      logs: ['歡迎來到《永恆收穫傳奇》！'],
      gold: 0,
    };
  });

  useEffect(() => {
    localStorage.setItem(SAVE_KEY, JSON.stringify(gameState));
  }, [gameState]);

  const [combatState, setCombatState] = useState<{
    enemy: CombatEntity | null;
    turn: 'player' | 'enemy';
    isFinished: boolean;
  }>({
    enemy: null,
    turn: 'player',
    isFinished: false,
  });

  const [gatheringNode, setGatheringNode] = useState<GatheringNode | null>(null);
  const [isRenaming, setIsRenaming] = useState(false);
  const renameInputRef = useRef<HTMLInputElement>(null);

  // --- Utils ---
  const addLog = useCallback((message: string) => {
    setGameState(prev => ({
      ...prev,
      logs: [message, ...prev.logs].slice(0, 50)
    }));
  }, []);

  const advanceDay = useCallback(() => {
    setGameState(prev => {
      let { day, season, year, period } = prev.calendar;
      let newLogs = [...prev.logs];
      
      if (period === 'Morning') {
        period = 'Night';
        newLogs.unshift(`夜幕降臨了。`);
      } else {
        period = 'Morning';
        day++;
        // Clear logs at the start of a new day
        newLogs = [];
        
        if (day > DAYS_PER_SEASON) {
          day = 1;
          const seasonIndex = SEASONS.indexOf(season);
          const nextSeasonIndex = (seasonIndex + 1) % SEASONS.length;
          season = SEASONS[nextSeasonIndex];
          if (nextSeasonIndex === 0) year++;
        }
        
        const seasonMap: Record<string, string> = {
          'Spring': '春季',
          'Summer': '夏季',
          'Autumn': '秋季',
          'Winter': '冬季'
        };

        newLogs.unshift(`第 ${year} 年 ${seasonMap[season]} 第 ${day} 天開始了。`);
        
        // Heal player slightly every morning
        const newHp = Math.min(prev.player.stats.maxHp, prev.player.stats.hp + 10);
        const newMp = Math.min(prev.player.stats.maxMp, prev.player.stats.mp + 5);

        return {
          ...prev,
          calendar: { day, season, year, period },
          player: {
            ...prev.player,
            stats: { ...prev.player.stats, hp: newHp, mp: newMp }
          },
          logs: newLogs.slice(0, 50)
        };
      }

      return {
        ...prev,
        calendar: { ...prev.calendar, period },
        logs: newLogs.slice(0, 50)
      };
    });
  }, []);

  const handleRename = useCallback(() => {
    setIsRenaming(true);
  }, []);

  const confirmRename = useCallback(() => {
    const newName = renameInputRef.current?.value;
    if (newName && newName.trim()) {
      setGameState(prev => ({
        ...prev,
        player: { ...prev.player, name: newName.trim() },
        logs: [`名字已更改為：${newName.trim()}`, ...prev.logs].slice(0, 50)
      }));
    }
    setIsRenaming(false);
  }, []);

  // --- Combat Logic ---
  const startCombat = useCallback((enemyTemplate: Partial<CombatEntity>) => {
    const enemy: CombatEntity = {
      id: 'enemy-' + Math.random().toString(36).substr(2, 9),
      name: enemyTemplate.name || '史萊姆',
      stats: { ...INITIAL_STATS, ...(enemyTemplate.stats || {}) },
      isPlayer: false,
      activeBuffs: [],
    };
    setCombatState({ enemy, turn: 'player', isFinished: false });
    setGameState(prev => ({ ...prev, view: 'Combat' }));
    addLog(`一隻野生的 ${enemy.name} 出現了！`);
  }, [addLog]);

  const handleCombatAction = useCallback((action: CombatAction) => {
    if (!combatState.enemy || combatState.turn !== 'player' || combatState.isFinished) return;

    // Player Turn
    let damage = 0;
    let healing = 0;

    if (action.type === 'attack') {
      damage = Math.max(1, gameState.player.stats.attack - combatState.enemy.stats.defense);
    } else if (action.type === 'skill') {
      if ((action.mpCost || 0) > gameState.player.stats.mp) {
        addLog("MP 不足！");
        return;
      }
      if (action.power && action.power > 0) {
        damage = action.power * gameState.player.stats.attack * 0.5;
      } else if (action.power && action.power < 0) {
        healing = Math.abs(action.power);
      }
    }

    setGameState(prev => ({
      ...prev,
      player: {
        ...prev.player,
        stats: {
          ...prev.player.stats,
          hp: Math.min(prev.player.stats.maxHp, prev.player.stats.hp + healing),
          mp: prev.player.stats.mp - (action.mpCost || 0)
        }
      }
    }));

    if (damage > 0) {
      const newEnemyHp = Math.max(0, combatState.enemy.stats.hp - damage);
      setCombatState(prev => ({
        ...prev,
        enemy: prev.enemy ? { ...prev.enemy, stats: { ...prev.enemy.stats, hp: newEnemyHp } } : null,
        turn: 'enemy'
      }));
      addLog(`你使用了 ${action.name}，對 ${combatState.enemy.name} 造成 ${Math.floor(damage)} 點傷害。`);

      if (newEnemyHp <= 0) {
        addLog(`你擊敗了 ${combatState.enemy.name}！`);
        setCombatState(prev => ({ ...prev, isFinished: true }));
        // Win rewards
        handleWin();
        return;
      }
    } else if (healing > 0) {
      setCombatState(prev => ({ ...prev, turn: 'enemy' }));
      addLog(`你使用了 ${action.name}，恢復了 ${healing} 點 HP。`);
    }

    // Enemy Turn after delay
    setTimeout(() => {
      setCombatState(prev => {
        if (!prev.enemy || prev.isFinished) return prev;
        
        const enemyDamage = Math.max(1, prev.enemy.stats.attack - gameState.player.stats.defense);
        const newPlayerHp = Math.max(0, gameState.player.stats.hp - enemyDamage);
        
        setGameState(gPrev => {
          const logs = [`${prev.enemy!.name} 發動攻擊，造成 ${enemyDamage} 點傷害。`];
          if (newPlayerHp <= 0) {
            logs.unshift("你被打敗了...");
          }
          return {
            ...gPrev,
            player: { ...gPrev.player, stats: { ...gPrev.player.stats, hp: newPlayerHp } },
            logs: [...logs, ...gPrev.logs].slice(0, 50)
          };
        });
        
        if (newPlayerHp <= 0) {
          return { ...prev, isFinished: true, turn: 'player' };
        }

        return { ...prev, turn: 'player' };
      });
    }, 800);
  }, [combatState, gameState.player, addLog]);

  const handleWin = useCallback(() => {
    const expGain = 50;
    const enemyDrops = combatState.enemy?.drops || [];
    
    setGameState(prev => {
      let newExp = prev.player.stats.exp + expGain;
      let newLevel = prev.player.stats.level;
      let newStats = { ...prev.player.stats };
      let logsToAppend: string[] = [];

      if (newExp >= prev.player.stats.nextLevelExp) {
        newLevel++;
        newExp -= prev.player.stats.nextLevelExp;
        newStats = {
          ...newStats,
          level: newLevel,
          exp: newExp,
          maxHp: newStats.maxHp + 20,
          hp: newStats.maxHp + 20,
          maxMp: newStats.maxMp + 5,
          mp: newStats.maxMp + 5,
          attack: newStats.attack + 5,
          defense: newStats.defense + 3,
        };
        logsToAppend.push(`等級提升！你現在是等級 ${newLevel}。`);
      }

      const newInventory = [...prev.inventory];
      enemyDrops.forEach(drop => {
        if (Math.random() < drop.chance) {
          const itemTemplate = ITEMS[drop.itemId];
          if (itemTemplate) {
            const existing = newInventory.find(i => i.id === drop.itemId);
            if (existing) {
              existing.quantity += 1;
            } else {
              newInventory.push({ ...itemTemplate, quantity: 1 });
            }
            logsToAppend.push(`獲得：${itemTemplate.name} x1`);
          }
        }
      });

      return {
        ...prev,
        player: { ...prev.player, stats: { ...newStats, exp: newExp } },
        inventory: newInventory,
        logs: [...logsToAppend, ...prev.logs].slice(0, 50)
      };
    });

    setTimeout(() => {
      setGameState(prev => ({ ...prev, view: 'Map' }));
      setCombatState({ enemy: null, turn: 'player', isFinished: false });
    }, 1500);
  }, [combatState.enemy, addLog]);

  // --- Gathering Logic ---
  const handleGather = useCallback((node: GatheringNode) => {
    if (node.lastGatheredDay === gameState.calendar.day) {
      addLog("今天的資源已經採集完了。");
      return;
    }

    addLog(`正在在 ${node.name} 進行採集...`);
    const drops: InventoryItem[] = [];
    const possibleDrops = [...node.possibleDrops];

    // Add seasonal mint to forest drops
    if (node.id === 'node_forest') {
      const seasonMintMap: Record<string, string> = {
        'Spring': 'mint_green',
        'Summer': 'mint_red',
        'Autumn': 'mint_yellow',
        'Winter': 'mint_blue'
      };
      const mintId = seasonMintMap[gameState.calendar.season];
      if (mintId) {
        possibleDrops.push({ itemId: mintId, chance: 0.01 });
      }
    }

    possibleDrops.forEach(drop => {
      if (Math.random() < drop.chance) {
        const itemTemplate = ITEMS[drop.itemId];
        if (itemTemplate) {
          drops.push({ ...itemTemplate, quantity: 1 });
        }
      }
    });

    if (drops.length === 0) {
      addLog("什麼都沒有發現。");
    } else {
      setGameState(prev => {
        const newInventory = [...prev.inventory];
        const newLogs = [...prev.logs];
        
        drops.forEach(d => {
          const existing = newInventory.find(i => i.id === d.id);
          if (existing) {
            existing.quantity += 1;
          } else {
            newInventory.push(d);
          }
          newLogs.unshift(`獲得：${d.name} x1`);
        });

        return { 
          ...prev, 
          inventory: newInventory,
          logs: newLogs.slice(0, 50)
        };
      });
    }

    // Advance time slightly
    advanceDay();
  }, [gameState.calendar.day, advanceDay, addLog]);

  // --- UI Components ---
  const TopBar = () => {
    const seasonIcons = {
      'Spring': <Leaf className="text-green-400" />,
      'Summer': <Sun className="text-yellow-400" />,
      'Autumn': <Trees className="text-orange-400" />,
      'Winter': <CloudSnow className="text-blue-400" />
    };

    const seasonMap: Record<string, string> = {
      'Spring': '春季',
      'Summer': '夏季',
      'Autumn': '秋季',
      'Winter': '冬季'
    };

    const periodMap = {
      'Morning': '早上',
      'Night': '晚上'
    };

    return (
      <div className="flex flex-col bg-zinc-900 border-b border-zinc-800 sticky top-0 z-50">
        <div className="flex items-center justify-between p-4 pb-2">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 px-3 py-1 bg-zinc-800 rounded-full">
              {seasonIcons[gameState.calendar.season]}
              <span className="font-medium">{seasonMap[gameState.calendar.season]}</span>
            </div>
            <div className="text-zinc-400 text-sm">
              第 {gameState.calendar.day} 天 · 第 {gameState.calendar.year} 年
              <span className={`ml-2 px-2 py-0.5 rounded text-[10px] uppercase font-bold ${
                gameState.calendar.period === 'Morning' ? 'bg-yellow-500/20 text-yellow-500' : 'bg-indigo-500/20 text-indigo-400'
              }`}>
                {periodMap[gameState.calendar.period]}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 px-3 py-1 bg-yellow-500/10 border border-yellow-500/20 rounded-full">
              <Coins className="w-4 h-4 text-yellow-500" />
              <span className="text-sm font-bold text-yellow-500">{gameState.gold ?? 0}</span>
            </div>
            <div className="flex flex-col items-end">
              <div className="flex items-center gap-2">
                <Heart className="w-4 h-4 text-red-500 fill-red-500" />
                <div className="w-32 h-2 bg-zinc-800 rounded-full overflow-hidden">
                  <motion.div 
                    initial={false}
                    animate={{ width: `${Math.max(0, Math.min(100, (gameState.player.stats.hp / (gameState.player.stats.maxHp || 1)) * 100))}%` }}
                    className="h-full bg-red-500" 
                  />
                </div>
                <span className="text-xs text-zinc-300 w-16 text-right">
                  {gameState.player.stats.hp} / {gameState.player.stats.maxHp}
                </span>
              </div>
              <div className="flex items-center gap-2 mt-1">
                <Zap className="w-4 h-4 text-blue-400 fill-blue-400" />
                <div className="w-32 h-2 bg-zinc-800 rounded-full overflow-hidden">
                  <motion.div 
                    initial={false}
                    animate={{ width: `${Math.max(0, Math.min(100, (gameState.player.stats.mp / (gameState.player.stats.maxMp || 1)) * 100))}%` }}
                    className="h-full bg-blue-400" 
                  />
                </div>
                <span className="text-xs text-zinc-300 w-16 text-right">
                  {gameState.player.stats.mp} / {gameState.player.stats.maxMp}
                </span>
              </div>
            </div>
          </div>
        </div>
        
        {/* EXP Bar */}
        <div className="px-4 pb-2">
          <div className="flex items-center gap-2 px-2">
            <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">EXP</span>
            <div className="flex-1 h-1 bg-zinc-800 rounded-full overflow-hidden">
              <motion.div 
                initial={false}
                animate={{ width: `${Math.max(0, Math.min(100, (gameState.player.stats.exp / (gameState.player.stats.nextLevelExp || 1)) * 100))}%` }}
                className="h-full bg-emerald-500" 
              />
            </div>
            <span className="text-[10px] text-zinc-500">Lv.{gameState.player.stats.level}</span>
          </div>
        </div>
      </div>
    );
  };

  const LogPanel = () => (
    <div className="bg-black/50 border-t border-zinc-800 font-mono flex flex-col">
      {/* Latest Log (Highlighted) */}
      <div className="px-4 py-2 text-zinc-100 text-[10px] sm:text-xs min-h-[32px] flex items-center gap-2 border-b border-zinc-900 bg-zinc-900/30">
        <span className="text-emerald-500 font-bold shrink-0">{">"}</span>
        <span className="truncate">{gameState.logs[0]}</span>
      </div>
      {/* History (excluding the latest) */}
      <div className="h-24 overflow-y-auto p-4 pt-2 text-[10px] sm:text-xs space-y-1">
        {gameState.logs.slice(1).map((log, i) => (
          <div key={i} className="text-zinc-500 flex gap-2">
            <span className="opacity-0">{">"}</span>
            <span className="truncate text-zinc-600 italic">[{gameState.logs.length - 1 - i}]</span>
            <span>{log}</span>
          </div>
        ))}
      </div>
    </div>
  );

  const MapView = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-6">
      <div className="space-y-4">
        <h2 className="text-xl font-bold text-zinc-100 flex items-center gap-2">
          <Pickaxe className="w-5 h-5 text-emerald-400" />
          採集地點
        </h2>
        {GATHERING_NODES.map(node => (
          <button
            key={node.id}
            onClick={() => handleGather(node)}
            className="w-full flex items-center justify-between p-4 bg-zinc-900 border border-zinc-800 rounded-xl hover:border-emerald-500/50 transition-colors group"
          >
            <div className="text-left">
              <div className="font-medium text-zinc-200 group-hover:text-emerald-400 transition-colors">{node.name}</div>
              <div className="text-xs text-zinc-500 capitalize">{node.type === 'mining' ? '挖礦' : '採集'}</div>
            </div>
            <ChevronRight className="w-4 h-4 text-zinc-600 group-hover:text-emerald-400" />
          </button>
        ))}
      </div>

      <div className="space-y-4">
        <h2 className="text-xl font-bold text-zinc-100 flex items-center gap-2">
          <Sword className="w-5 h-5 text-red-400" />
          冒險與探索
        </h2>
        <button
          onClick={() => {
            const seasonEnemies = SEASONAL_ENEMIES[gameState.calendar.season] || [];
            const enemies = [...COMMON_ENEMIES];
            
            // 70% chance for common, 30% for seasonal?
            // Actually let's just combine and level-gate
            const availableEnemies = [...enemies, ...seasonEnemies];
            
            const enemy = availableEnemies[Math.floor(Math.random() * availableEnemies.length)];
            
            if (gameState.calendar.period === 'Night') {
              setGameState(prev => ({
                ...prev,
                logs: ["晚上太危險了，無法進行戰鬥。", ...prev.logs].slice(0, 50)
              }));
              return;
            }
            startCombat(enemy);
          }}
          disabled={gameState.calendar.period === 'Night'}
          className="w-full flex items-center justify-between p-4 bg-zinc-900 border border-zinc-800 rounded-xl hover:border-red-500/50 transition-colors group disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <div className="text-left">
            <div className="font-medium text-zinc-200 group-hover:text-red-400 transition-colors">尋找戰鬥</div>
            <div className="text-xs text-zinc-500">進入荒野探索</div>
          </div>
          <ChevronRight className="w-4 h-4 text-zinc-600 group-hover:text-red-400" />
        </button>
        <button
          onClick={advanceDay}
          className="w-full flex items-center justify-between p-4 bg-zinc-900 border border-zinc-800 rounded-xl hover:border-blue-500/50 transition-colors group"
        >
          <div className="text-left">
            <div className="font-medium text-zinc-200 group-hover:text-blue-400 transition-colors">休息與冥想</div>
            <div className="text-xs text-zinc-500">進入下一天</div>
          </div>
          <Calendar className="w-4 h-4 text-zinc-600 group-hover:text-blue-400" />
        </button>
      </div>
    </div>
  );

  const CombatView = () => {
    if (!combatState.enemy) return null;

    return (
      <div className="flex flex-col h-full bg-zinc-950 p-6">
        <div className="flex justify-between items-start mb-12">
          {/* Player Side */}
          <div className="space-y-4">
            <div className="text-lg font-bold text-zinc-100">{gameState.player.name}</div>
            <div className="space-y-2">
              <div className="w-48 h-3 bg-zinc-900 rounded-full overflow-hidden border border-zinc-800">
                <motion.div 
                  initial={false}
                  animate={{ width: `${Math.max(0, Math.min(100, (gameState.player.stats.hp / (gameState.player.stats.maxHp || 1)) * 100))}%` }}
                  className="h-full bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.5)]" 
                />
              </div>
              <div className="flex justify-between text-xs text-zinc-500">
                <span>HP</span>
                <span>{gameState.player.stats.hp} / {gameState.player.stats.maxHp}</span>
              </div>
            </div>
          </div>

          <div className="flex flex-col items-center justify-center p-4">
            <div className="text-4xl font-black text-zinc-800 uppercase tracking-widest italic opacity-20">戰鬥</div>
          </div>

          {/* Enemy Side */}
          <div className="space-y-4 text-right">
            <div className="text-lg font-bold text-zinc-100">{combatState.enemy.name}</div>
            <div className="space-y-2">
              <div className="w-48 h-3 bg-zinc-900 rounded-full overflow-hidden border border-zinc-800 ml-auto">
                <motion.div 
                  initial={false}
                  animate={{ width: `${Math.max(0, Math.min(100, (combatState.enemy.stats.hp / (combatState.enemy.stats.maxHp || 1)) * 100))}%` }}
                  className="h-full bg-purple-500 shadow-[0_0_10px_rgba(168,85,247,0.5)]" 
                />
              </div>
              <div className="flex justify-between text-xs text-zinc-500">
                <span>{combatState.enemy.stats.hp} / {combatState.enemy.stats.maxHp}</span>
                <span>HP</span>
              </div>
            </div>
          </div>
        </div>

        <div className="flex-1 flex items-center justify-center">
          <AnimatePresence mode="wait">
            <motion.div
              key={combatState.enemy.stats.hp > 0 ? 'alive' : 'dead'}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.2 }}
              className="relative"
            >
              <div className="w-32 h-32 bg-zinc-800/20 border border-zinc-700/50 rounded-full flex items-center justify-center backdrop-blur-sm">
                <Sword className={`w-16 h-16 ${combatState.turn === 'enemy' ? 'text-red-500 animate-pulse' : 'text-zinc-600'}`} />
              </div>
              {combatState.turn === 'enemy' && (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="absolute -top-8 left-1/2 -translate-x-1/2 px-3 py-1 bg-red-500/20 border border-red-500/50 rounded-full text-xs text-red-500 font-bold"
                >
                  敵人回合
                </motion.div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-auto pt-6">
          {PLAYER_ACTIONS.map(action => (
            <button
              key={action.id}
              disabled={combatState.turn !== 'player' || combatState.isFinished}
              onClick={() => handleCombatAction(action)}
              className="flex flex-col items-center justify-center p-3 bg-zinc-900 border border-zinc-800 rounded-lg hover:border-zinc-500 disabled:opacity-50 disabled:cursor-not-allowed group transition-all"
            >
              <div className="text-zinc-200 font-bold group-hover:text-white">{action.name}</div>
              <div className="text-[10px] text-zinc-500 uppercase tracking-wider mt-1">
                {action.mpCost ? `${action.mpCost} MP` : '消耗：0'}
              </div>
            </button>
          ))}
          <button
            onClick={() => setGameState(prev => ({ ...prev, view: 'Map' }))}
            className="col-span-1 p-3 bg-zinc-900/50 border border-zinc-800 rounded-lg text-zinc-400 hover:text-zinc-200"
          >
            逃跑
          </button>
        </div>
      </div>
    );
  };

  const InventoryView = () => {
    const [activeTab, setActiveTab] = useState<'items' | 'craft'>('items');

    const craftingRecipes = [
      {
        id: 'wild_berry_jam',
        name: '野果果醬',
        inputs: [{ itemId: 'wild_berry', quantity: 3 }],
        outputItemId: 'wild_berry_jam',
        description: '將 3 個野果熬製成美味的果醬。'
      },
      {
        id: 'iron_ingot',
        name: '熔煉鐵錠',
        inputs: [{ itemId: 'iron_ore', quantity: 2 }],
        outputItemId: 'iron_ingot',
        description: '將 2 個鐵礦石熔煉成一個堅固的鐵錠。'
      }
    ];

    const handleCraft = (recipe: (typeof craftingRecipes)[0]) => {
      const hasMaterials = recipe.inputs.every(input => {
        const item = gameState.inventory.find(i => i.id === input.itemId);
        return item && item.quantity >= input.quantity;
      });

      if (!hasMaterials) {
        setGameState(prev => ({
          ...prev,
          logs: ["材料不足！", ...prev.logs].slice(0, 50)
        }));
        return;
      }

      setGameState(prev => {
        const newInventory = [...prev.inventory];
        // Consume inputs
        recipe.inputs.forEach(input => {
          const index = newInventory.findIndex(i => i.id === input.itemId);
          if (index !== -1) {
            newInventory[index].quantity -= input.quantity;
          }
        });

        // Add output
        const outputTemplate = ITEMS[recipe.outputItemId];
        const existingOutput = newInventory.find(i => i.id === recipe.outputItemId);
        if (existingOutput) {
          existingOutput.quantity += 1;
        } else if (outputTemplate) {
          newInventory.push({ ...outputTemplate, quantity: 1 });
        }

        const newLogs = [`製作成功：獲得了 ${recipe.name}！`, ...prev.logs].slice(0, 50);

        return {
          ...prev,
          inventory: newInventory.filter(i => i.quantity > 0),
          logs: newLogs
        };
      });

      advanceDay();
    };

    return (
      <div className="p-6 space-y-6">
        <div className="flex items-center gap-4 border-b border-zinc-800">
          <button 
            onClick={() => setActiveTab('items')}
            className={`pb-2 px-4 text-sm font-bold transition-colors ${activeTab === 'items' ? 'text-emerald-400 border-b-2 border-emerald-400' : 'text-zinc-500'}`}
          >
            我的物品
          </button>
          <button 
            onClick={() => setActiveTab('craft')}
            className={`pb-2 px-4 text-sm font-bold transition-colors ${activeTab === 'craft' ? 'text-emerald-400 border-b-2 border-emerald-400' : 'text-zinc-500'}`}
          >
            製作
          </button>
        </div>

        {activeTab === 'items' ? (
          <>
            {gameState.inventory.length === 0 ? (
              <div className="text-center py-20 text-zinc-600">你的背包是空的。</div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {gameState.inventory.map(item => (
                  <div key={item.id} className="p-4 bg-zinc-900 border border-zinc-800 rounded-xl flex items-center justify-between">
                    <div>
                      <div className="font-medium text-zinc-200">{item.name}</div>
                      <div className="text-xs text-zinc-500">{item.description}</div>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <span className="px-2 py-0.5 bg-zinc-800 rounded text-xs text-zinc-400">x{item.quantity}</span>
                      {item.type === 'consumable' && (
                        <button 
                          onClick={() => {
                            const recoveryMap: Record<string, number> = {
                              'wild_berry': 3,
                              'herbal_medicine': 20,
                              'wild_berry_jam': 15
                            };
                            const amount = recoveryMap[item.id] || 0;
                            if (amount > 0) {
                              setGameState(prev => ({
                                ...prev,
                                player: {
                                  ...prev.player,
                                  stats: {
                                    ...prev.player.stats,
                                    hp: Math.min(prev.player.stats.maxHp, prev.player.stats.hp + amount)
                                  }
                                },
                                inventory: prev.inventory.map(i => i.id === item.id ? { ...i, quantity: i.quantity - 1 } : i).filter(i => i.quantity > 0),
                                logs: [`使用了 ${item.name}，恢復了 ${amount} 點 HP。`, ...prev.logs].slice(0, 50)
                              }));
                            }
                          }}
                          className="text-[10px] text-blue-400 hover:underline px-2 py-1 bg-blue-400/10 rounded"
                        >
                          使用
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {craftingRecipes.map(recipe => (
              <div key={recipe.id} className="p-4 bg-zinc-900 border border-zinc-800 rounded-xl flex items-center justify-between">
                <div className="space-y-1">
                  <div className="font-medium text-zinc-200">{recipe.name}</div>
                  <div className="text-xs text-zinc-500">{recipe.description}</div>
                  <div className="flex gap-2 mt-2">
                    {recipe.inputs.map(input => {
                      const invItem = gameState.inventory.find(i => i.id === input.itemId);
                      const count = invItem?.quantity || 0;
                      return (
                        <div key={input.itemId} className={`px-2 py-0.5 rounded text-[10px] border ${
                          count >= input.quantity ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' : 'bg-red-500/10 border-red-500/30 text-red-400'
                        }`}>
                          {ITEMS[input.itemId]?.name || input.itemId}: {count}/{input.quantity}
                        </div>
                      );
                    })}
                  </div>
                </div>
                <button
                  onClick={() => handleCraft(recipe)}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-sm font-bold transition-colors disabled:opacity-50"
                >
                  製作
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  const StatusView = () => (
    <div className="p-6 max-w-2xl mx-auto space-y-8">
      <div className="flex flex-col items-center text-center space-y-4">
        <div className="w-24 h-24 bg-zinc-800 rounded-full flex items-center justify-center border-2 border-zinc-700 shadow-xl">
          <User className="w-12 h-12 text-zinc-400" />
        </div>
        <div className="space-y-2">
          {isRenaming ? (
            <div className="flex flex-col items-center gap-2">
              <input
                autoFocus
                type="text"
                defaultValue={gameState.player.name}
                ref={renameInputRef}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') confirmRename();
                  if (e.key === 'Escape') setIsRenaming(false);
                }}
                className="bg-zinc-900 border border-emerald-500/50 text-zinc-100 px-3 py-1 rounded-lg text-lg text-center outline-none focus:ring-2 focus:ring-emerald-500/20"
                placeholder="輸入名字..."
              />
              <div className="flex gap-2">
                <button 
                  onClick={confirmRename}
                  className="px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-white text-[10px] rounded-full transition-colors"
                >
                  確認
                </button>
                <button 
                  onClick={() => setIsRenaming(false)}
                  className="px-3 py-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-400 text-[10px] rounded-full transition-colors"
                >
                  取消
                </button>
              </div>
            </div>
          ) : (
            <>
              <h2 className="text-3xl font-bold text-zinc-100">{gameState.player.name}</h2>
              <p className="text-zinc-500">等級 {gameState.player.stats.level} 無</p>
              <button 
                onClick={handleRename}
                className="mt-2 px-4 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs rounded-full border border-zinc-700 transition-colors"
              >
                更改名字
              </button>
            </>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {[
          { label: '攻擊力', value: gameState.player.stats.attack, icon: <Sword className="w-4 h-4" /> },
          { label: '防禦力', value: gameState.player.stats.defense, icon: <Shield className="w-4 h-4" /> },
          { label: '速度', value: gameState.player.stats.speed, icon: <Zap className="w-4 h-4" /> },
          { label: '經驗值', value: `${gameState.player.stats.exp} / ${gameState.player.stats.nextLevelExp}`, icon: <ChevronRight className="w-4 h-4" /> },
        ].map(stat => (
          <div key={stat.label} className="p-4 bg-zinc-900 border border-zinc-800 rounded-xl flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-zinc-800 rounded-lg text-zinc-400">{stat.icon}</div>
              <span className="text-sm text-zinc-400">{stat.label}</span>
            </div>
            <span className="font-mono text-zinc-200 font-bold">{stat.value}</span>
          </div>
        ))}
      </div>
    </div>
  );

  const ShopView = () => {
    const seasonMintMap: Record<string, string> = {
      'Spring': 'mint_green',
      'Summer': 'mint_red',
      'Autumn': 'mint_yellow',
      'Winter': 'mint_blue'
    };
    
    const currentSeasonMintId = seasonMintMap[gameState.calendar.season];

    const getSellPrice = (item: InventoryItem) => {
      // If it's the mint of the current season, sell for 18
      if (item.id === currentSeasonMintId) {
        return 18;
      }
      return item.price || 0;
    };

    const handleSell = (item: InventoryItem) => {
      const price = getSellPrice(item);
      if (price <= 0) return;

      setGameState(prev => {
        const itemIdx = prev.inventory.findIndex(i => i.id === item.id);
        if (itemIdx === -1) return prev;

        const newInventory = [...prev.inventory];
        newInventory[itemIdx].quantity -= 1;
        
        return {
          ...prev,
          gold: prev.gold + price,
          inventory: newInventory.filter(i => i.quantity > 0),
          logs: [`賣出了 ${item.name}，獲得了 ${price} 金幣。`, ...prev.logs].slice(0, 50)
        };
      });
    };

    const sellableItems = gameState.inventory.filter(i => i.price && i.price > 0);

    return (
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-zinc-100 flex items-center gap-2">
            <Coins className="text-yellow-500" />
            商人
          </h2>
          <div className="px-4 py-1.5 bg-yellow-500/10 border border-yellow-500/20 rounded-full flex items-center gap-2">
            <Coins className="w-4 h-4 text-yellow-500" />
            <span className="text-sm font-bold text-yellow-500">{gameState.gold}</span>
          </div>
        </div>
        
        <p className="text-zinc-500 text-sm italic">"你有什麼想要出售的素材嗎？我會給你一個好價錢。"</p>

        {sellableItems.length === 0 ? (
          <div className="text-center py-20 text-zinc-600">你沒有可以出售的有價值物品。</div>
        ) : (
          <div className="grid grid-cols-1 gap-3">
            {sellableItems.map(item => {
              const price = getSellPrice(item);
              return (
                <div key={item.id} className="p-4 bg-zinc-900 border border-zinc-800 rounded-xl flex items-center justify-between hover:bg-zinc-800/50 transition-colors">
                  <div className="flex gap-4 items-center">
                    <div className="w-10 h-10 bg-zinc-800 rounded-lg flex items-center justify-center text-zinc-500">
                      <Leaf className="w-6 h-6" />
                    </div>
                    <div>
                      <div className="font-medium text-zinc-200">{item.name} <span className="text-zinc-500 text-xs ml-2">x{item.quantity}</span></div>
                      <div className="text-xs text-zinc-500">
                        售價: {price} 金幣 
                        {item.id.startsWith('mint_') && item.id === currentSeasonMintId && 
                          <span className="ml-2 text-red-500 text-[10px] font-bold">(當季特價)</span>
                        }
                      </div>
                    </div>
                  </div>
                  <button 
                    onClick={() => handleSell(item)}
                    className="px-4 py-1.5 bg-yellow-600 hover:bg-yellow-500 text-white text-xs font-bold rounded-lg transition-colors"
                  >
                    出售 1 個
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-black text-zinc-300 font-sans selection:bg-emerald-500/30">
      <div className="max-w-4xl mx-auto min-h-screen flex flex-col bg-zinc-950 shadow-2xl border-x border-zinc-900">
        <TopBar />
        
        <main className="flex-1 overflow-y-auto">
          <AnimatePresence mode="wait">
            <motion.div
              key={gameState.view}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
              className="h-full"
            >
              {gameState.view === 'Map' && <MapView />}
              {gameState.view === 'Combat' && <CombatView />}
              {gameState.view === 'Inventory' && <InventoryView />}
              {gameState.view === 'Shop' && <ShopView />}
              {gameState.view === 'Status' && <StatusView />}
            </motion.div>
          </AnimatePresence>
        </main>

        {gameState.view !== 'Status' && <LogPanel />}

        {/* Navigation */}
        <nav className="grid grid-cols-4 border-t border-zinc-800 bg-zinc-900/50 backdrop-blur-sm sticky bottom-0 z-50">
          {[
            { id: 'Map', icon: Trees, label: '地圖' },
            { id: 'Shop', icon: Coins, label: '商人' },
            { id: 'Inventory', icon: Backpack, label: '背包' },
            { id: 'Status', icon: User, label: '狀態' },
          ].map(item => (
            <button
              key={item.id}
              onClick={() => setGameState(prev => ({ ...prev, view: item.id as GameView }))}
              className={`flex flex-col items-center py-3 gap-1 transition-colors ${
                gameState.view === item.id ? 'text-emerald-400' : 'text-zinc-500 hover:text-zinc-300'
              }`}
            >
              <item.icon className="w-5 h-5" />
              <span className="text-[10px] uppercase font-bold tracking-widest">{item.label}</span>
            </button>
          ))}
        </nav>
      </div>
    </div>
  );
}
