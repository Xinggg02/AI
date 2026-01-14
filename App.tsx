
import React, { useState, useMemo, useEffect, useRef } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';
import { 
  Zap, Sun, CloudSun, PlusCircle, MinusCircle, Trash2, 
  TrendingDown, Info, Calculator, Lightbulb, PieChart as PieChartIcon,
  LayoutGrid, ArrowRight, Award, History, RefreshCcw, Tag, Coins,
  TrendingUp, Clock, Rocket, ShoppingCart, ChevronDown, ChevronUp,
  X, Download, Share2, Sparkles, Ghost, AlertTriangle, ThermometerSnowflake,
  Volume2, VolumeX, Music, CheckCircle2, Play
} from 'lucide-react';
import { APPLIANCES, PRICING_TIERS, TEMPLATES, UNIT_RATES, SUNO_TRACKS } from './constants';
import { UserApplianceInstance, BillConfig, Category, UnitType } from './types';
import { calculateTieredBreakdown, calculateMonthlyKwh } from './utils';

const COLORS = ['#0ea5e9', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'];

const App: React.FC = () => {
  const [instances, setInstances] = useState<UserApplianceInstance[]>([]);
  const [config, setConfig] = useState<BillConfig>({
    isSummer: true, baseKwh: 0, useCustomRate: false, customRate: 5.0
  });
  const [unitType, setUnitType] = useState<UnitType>('TWD');
  const [behaviorMultiplier, setBehaviorMultiplier] = useState(1);
  const [activeCategory, setActiveCategory] = useState<Category | '全部'>('全部');
  const [checkedActions, setCheckedActions] = useState<Record<string, boolean>>({});

  // UI States
  const [isRetroMode, setIsRetroMode] = useState(false);
  const [roiTargetId, setRoiTargetId] = useState<string | null>(null);
  const [showPersonality, setShowPersonality] = useState(false);
  const [audioInitialized, setAudioInitialized] = useState(false);
  
  // Audio engine
  const [isMuted, setIsMuted] = useState(true);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [currentTrackId, setCurrentTrackId] = useState<'safe' | 'warning' | 'crisis'>('safe');

  const SAVINGS_ACTIONS = [
    { id: 'filter', label: '定期清洗冷氣濾網', reduction: 0.08, icon: '🧼' },
    { id: 'unplug', label: '拔掉待機電力插頭', reduction: 0.05, icon: '🔌' },
    { id: 'led', label: '更換 LED 節能燈具', reduction: 0.1, icon: '💡' },
    { id: 'temp', label: '冷氣維持 26-28 度', reduction: 0.12, icon: '🌡️' }
  ];

  // Actions
  const addAppliance = (appId: string) => {
    const app = APPLIANCES.find(a => a.id === appId)!;
    setInstances([...instances, {
      id: Math.random().toString(36).substr(2, 9),
      applianceId: appId,
      count: 1,
      watts: app.defaultWatts,
      hoursPerDay: app.defaultHours
    }]);
  };

  const updateInstance = (id: string, delta: Partial<UserApplianceInstance>) => {
    setInstances(prev => prev.map(inst => inst.id === id ? { ...inst, ...delta } : inst));
  };

  const applyTemplate = (template: typeof TEMPLATES[0]) => {
    setInstances(template.appliances.map(a => ({ ...a, id: Math.random().toString(36).substr(2, 9) })));
  };

  // Logic: Audio Playback
  const toggleAudio = () => {
    if (!audioInitialized) setAudioInitialized(true);
    setIsMuted(!isMuted);
  };

  // Computations
  const stats = useMemo(() => {
    const actionReduction = Object.entries(checkedActions)
      .filter(([_, checked]) => checked)
      .reduce((sum, [id, _]) => sum + (SAVINGS_ACTIONS.find(a => a.id === id)?.reduction || 0), 0);

    const details = instances.map(inst => {
      const app = APPLIANCES.find(a => a.id === inst.applianceId)!;
      let effectiveWatts = inst.watts;
      let effectiveRunningRate = app.runningRate;
      
      if (isRetroMode && app.isHighEfficiency) {
        effectiveWatts = inst.watts * 2.5;
        effectiveRunningRate = Math.min(1, app.runningRate * 1.5);
      }

      const totalMultiplier = behaviorMultiplier * (1 - actionReduction);
      const adjustedHours = inst.hoursPerDay * totalMultiplier;
      
      const kwh = calculateMonthlyKwh(effectiveWatts, adjustedHours, inst.count, effectiveRunningRate);
      const originalKwh = calculateMonthlyKwh(inst.watts, inst.hoursPerDay, inst.count, app.runningRate);
      
      let tag = '效率正常';
      let tagColor = 'bg-slate-100 text-slate-500';
      if (kwh > 120) { tag = '吃電怪獸'; tagColor = 'bg-red-100 text-red-600'; }
      else if (app.isHighEfficiency && !isRetroMode) { tag = '節能標章'; tagColor = 'bg-emerald-100 text-emerald-600'; }

      return { ...inst, ...app, kwh, originalKwh, tag, tagColor };
    });

    const totalKwh = details.reduce((sum, d) => sum + d.kwh, 0) + config.baseKwh;
    const tierBreakdown = calculateTieredBreakdown(totalKwh, PRICING_TIERS, config.isSummer);
    const totalCost = config.useCustomRate ? totalKwh * config.customRate : tierBreakdown.reduce((s, b) => s + b.cost, 0);
    const baseTotalCost = details.reduce((sum, d) => sum + (d.originalKwh * 4), 0); // Simplified baseline for comparison

    const savingsMonthly = Math.max(0, baseTotalCost - totalCost);
    const savingsAnnual = savingsMonthly * 12;

    // Mood & Music Logic
    let butlerText = "歡迎使用診斷系統。目前電力負載正常。";
    let butlerMood = 'neutral';
    let track: 'safe' | 'warning' | 'crisis' = 'safe';
    let playbackRate = 1.0;

    if (totalKwh === 0) {
      butlerText = "你是住在原始森林嗎？竟然一度電都沒用。";
    } else if (totalCost < 600) {
      butlerText = "非常優雅。你的用電習慣像聖人一樣純潔。";
      butlerMood = 'good';
      track = 'safe';
    } else if (totalCost < 2500) {
      butlerText = "你的錢包正在緩慢滲血。你確定冷氣要開整天嗎？";
      butlerMood = 'neutral';
      track = 'warning';
      playbackRate = 1.1;
    } else {
      butlerText = "警報！你的電費正在衝向太空。北極熊已經集體搬到你家門口示威了！";
      butlerMood = 'extreme';
      track = 'crisis';
      playbackRate = Math.min(1.8, 1.0 + (totalCost - 2000) / 7000);
    }

    const categoryStats = details.reduce((acc, curr) => {
      acc[curr.category] = (acc[curr.category] || 0) + curr.kwh;
      return acc;
    }, {} as Record<string, number>);

    return { 
      totalKwh, totalCost, savingsAnnual, details, 
      tierBreakdown, chartData: Object.entries(categoryStats).map(([name, value]) => ({ name, value })),
      topConsumers: [...details].sort((a, b) => b.kwh - a.kwh).slice(0, 3),
      butlerText, butlerMood, track, playbackRate
    };
  }, [instances, config, behaviorMultiplier, isRetroMode, checkedActions]);

  // Handle Audio Context & Transitions
  useEffect(() => {
    if (!audioInitialized) return;

    if (!audioRef.current) {
      audioRef.current = new Audio(SUNO_TRACKS[stats.track].src);
      audioRef.current.loop = true;
    }
    
    if (currentTrackId !== stats.track) {
      audioRef.current.src = SUNO_TRACKS[stats.track].src;
      setCurrentTrackId(stats.track);
      if (!isMuted) audioRef.current.play().catch(e => console.log("Audio Play Blocked", e));
    }

    audioRef.current.playbackRate = stats.playbackRate;

    if (isMuted) {
      audioRef.current.pause();
    } else {
      audioRef.current.play().catch(e => {
        console.log("Audio failed to play", e);
        setIsMuted(true);
      });
    }
  }, [stats.track, stats.playbackRate, isMuted, audioInitialized]);

  const formatValue = (val: number, type: UnitType = unitType) => {
    const unit = UNIT_RATES[type];
    const converted = val / unit.rate;
    if (type === 'TWD') return `${unit.symbol}${Math.round(converted).toLocaleString()}`;
    return `${Math.round(converted).toLocaleString()} ${unit.name}`;
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] flex flex-col md:flex-row pb-24 md:pb-0 font-['Noto_Sans_TC']">
      
      {/* 側邊欄：控制台 */}
      <aside className="w-full md:w-80 lg:w-96 bg-white border-r border-slate-200 h-screen overflow-y-auto sticky top-0 flex-shrink-0 z-20 p-6 flex flex-col shadow-2xl md:shadow-none">
        <div className="flex items-center gap-3 mb-8">
          <div className="bg-gradient-to-br from-emerald-500 to-emerald-600 p-2.5 rounded-2xl text-white shadow-lg shadow-emerald-200">
            <Rocket size={24} />
          </div>
          <h1 className="text-xl font-black text-slate-800 tracking-tighter">節能診斷 <span className="text-emerald-500">PRO</span></h1>
        </div>

        {/* AI Butler */}
        <section className={`mb-8 relative ${stats.butlerMood === 'extreme' ? 'animate-bounce' : ''}`}>
          <div className={`p-5 rounded-[32px] border-2 transition-all duration-500 ${
            stats.butlerMood === 'good' ? 'bg-emerald-50 border-emerald-100' :
            stats.butlerMood === 'bad' ? 'bg-amber-50 border-amber-100' :
            stats.butlerMood === 'extreme' ? 'bg-red-50 border-red-200' : 'bg-slate-50 border-slate-100'
          }`}>
            <div className="flex items-start gap-4">
              <span className="text-4xl">{stats.butlerMood === 'good' ? '🧐' : stats.butlerMood === 'bad' ? '😒' : stats.butlerMood === 'extreme' ? '🤯' : '🤖'}</span>
              <p className="text-xs font-bold text-slate-600 leading-relaxed">{stats.butlerText}</p>
            </div>
          </div>
        </section>

        {/* 家電庫選單 */}
        <div className="flex-1 overflow-y-auto">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4 block border-b pb-2">➕ 點擊新增家電</label>
          <div className="grid grid-cols-2 gap-3">
            {APPLIANCES.map(app => (
              <button key={app.id} onClick={() => addAppliance(app.id)} className="p-4 bg-white border border-slate-100 rounded-[24px] hover:border-emerald-500 hover:shadow-lg transition-all flex flex-col items-center group active:scale-95">
                <span className="text-3xl mb-2 group-hover:scale-125 transition-transform">{app.icon}</span>
                <span className="text-[11px] font-black text-slate-700 truncate w-full text-center">{app.name}</span>
                <span className="text-[9px] text-slate-400 mt-1 font-bold">{app.defaultWatts}W</span>
              </button>
            ))}
          </div>

          <div className="mt-8">
             <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4 block border-b pb-2">🏠 快速套用情境</label>
             <div className="space-y-3">
               {TEMPLATES.map(t => (
                 <button key={t.name} onClick={() => applyTemplate(t)} className="w-full text-left p-4 rounded-[24px] bg-slate-50 hover:bg-emerald-50 border border-slate-100 transition-all flex items-center gap-4 group">
                   <span className="text-2xl">{t.icon}</span>
                   <div>
                     <div className="text-xs font-black text-slate-800">{t.name}</div>
                     <div className="text-[10px] text-slate-400 font-bold">{t.description}</div>
                   </div>
                 </button>
               ))}
             </div>
          </div>
        </div>
      </aside>

      {/* 主面板 */}
      <main className="flex-1 p-6 lg:p-12 overflow-y-auto relative bg-[#f8fafc]">
        
        {/* 音樂控制 (Floating) */}
        {!audioInitialized ? (
          <div className="fixed bottom-8 right-8 z-[100]">
            <button 
              onClick={toggleAudio}
              className="bg-slate-900 text-white px-8 py-5 rounded-full shadow-2xl flex items-center gap-4 hover:scale-105 transition-transform animate-pulse"
            >
              <Play size={20} fill="currentColor"/>
              <span className="font-black text-xs uppercase tracking-widest">啟動 Suno 沉浸式音樂</span>
            </button>
          </div>
        ) : (
          <button 
            onClick={toggleAudio}
            className={`fixed bottom-24 right-8 z-50 md:bottom-8 p-5 rounded-full shadow-2xl transition-all flex items-center gap-3 ${isMuted ? 'bg-slate-200 text-slate-500' : 'bg-emerald-600 text-white animate-pulse'}`}
          >
            {isMuted ? <VolumeX size={24}/> : <Volume2 size={24}/>}
            {!isMuted && <span className="text-[11px] font-black uppercase tracking-widest pr-2">Suno {SUNO_TRACKS[stats.track].label}</span>}
          </button>
        )}

        <div className="max-w-6xl mx-auto">
          <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-12">
            <div>
               <h2 className="text-4xl font-black text-slate-800 tracking-tight">電力診斷儀表板</h2>
               <p className="text-slate-400 font-bold mt-1">即時分析您的荷包健康狀況</p>
            </div>
            <div className="flex gap-3">
               <button onClick={() => setConfig({...config, isSummer: !config.isSummer})} className={`px-6 py-3 rounded-full font-black text-xs uppercase tracking-widest transition-all shadow-md ${config.isSummer ? 'bg-amber-100 text-amber-600' : 'bg-blue-100 text-blue-600'}`}>
                 {config.isSummer ? '🔥 夏季費率' : '❄️ 非夏月費率'}
               </button>
            </div>
          </header>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
             {/* 核心數據卡片 */}
             <div className="bg-white p-8 rounded-[40px] border border-slate-200 shadow-xl shadow-slate-200/20 relative overflow-hidden group">
               <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4 block">估計每月支出</span>
               <div className="flex items-baseline gap-2 mb-4">
                 <span className={`text-6xl font-black tracking-tighter transition-colors ${stats.totalCost > 2000 ? 'text-red-600' : 'text-slate-900'}`}>{formatValue(stats.totalCost)}</span>
               </div>
               <div className="text-xs font-bold text-slate-400">平均每日約 {formatValue(stats.totalCost / 30)}</div>
               <Zap className="absolute -bottom-8 -right-8 text-slate-50 opacity-40 rotate-12" size={180} />
             </div>

             <div className="bg-slate-900 p-8 rounded-[40px] text-white shadow-2xl shadow-slate-300 relative">
                <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-4 block">總月耗電量</span>
                <div className="flex items-baseline gap-2 mb-6">
                   <span className="text-6xl font-black tracking-tighter">{stats.totalKwh.toFixed(1)}</span>
                   <span className="text-slate-500 font-bold">kWh</span>
                </div>
                <div className="flex gap-1">
                   {[...Array(10)].map((_, i) => (
                     <div key={i} className={`h-2 flex-1 rounded-full ${i < (stats.totalKwh / 120) ? 'bg-emerald-500' : 'bg-slate-800'}`}/>
                   ))}
                </div>
             </div>

             <div className="bg-white p-8 rounded-[40px] border border-slate-200 shadow-sm flex flex-col justify-between">
                <div>
                   <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4 block">年度省錢潛力</span>
                   <div className="text-4xl font-black text-emerald-600 mb-2">{formatValue(stats.savingsAnnual)}</div>
                   <p className="text-[10px] font-bold text-slate-400 leading-relaxed">透過優化習慣與設備，您每年可以省下這麼多！</p>
                </div>
                <div className="mt-6 flex gap-2">
                   {(Object.keys(UNIT_RATES) as UnitType[]).map(t => (
                     <button key={t} onClick={() => setUnitType(t)} className={`flex-1 py-2 rounded-xl text-lg transition-all ${unitType === t ? 'bg-slate-100 shadow-inner' : 'opacity-40 grayscale'}`}>
                       {UNIT_RATES[t].symbol}
                     </button>
                   ))}
                </div>
             </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
            <div className="lg:col-span-8 space-y-10">
              
              {/* 已啟動家電清單 - 數量調整核心 */}
              <section>
                <div className="flex items-center justify-between mb-8 px-4">
                   <h3 className="text-lg font-black text-slate-800 flex items-center gap-3"><ShoppingCart size={22} className="text-emerald-500"/> 已啟動設備 ({instances.length})</h3>
                   {instances.length > 0 && <button onClick={() => setInstances([])} className="text-[10px] font-black text-red-400 hover:text-red-600 uppercase">全部清空</button>}
                </div>
                
                {instances.length === 0 ? (
                  <div className="bg-white border-4 border-dashed border-slate-100 rounded-[48px] p-24 text-center">
                    <Ghost className="mx-auto text-slate-100 mb-6" size={80}/>
                    <p className="text-slate-400 font-black">清單空空如也，從左側新增家電吧！</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 gap-4">
                    {instances.map((inst, idx) => {
                      const info = stats.details[idx];
                      return (
                        <div key={inst.id} className="bg-white p-6 rounded-[36px] border border-slate-100 shadow-sm hover:shadow-2xl transition-all flex flex-col md:flex-row items-center gap-8 group">
                          <div className="text-5xl bg-slate-50 w-24 h-24 flex items-center justify-center rounded-[32px] group-hover:bg-emerald-50 transition-colors shrink-0">{info.icon}</div>
                          <div className="flex-1">
                             <div className="flex items-center gap-3 mb-2">
                               <h4 className="font-black text-slate-800 text-xl">{info.name}</h4>
                               <span className={`text-[9px] font-black px-3 py-1 rounded-full uppercase tracking-tighter ${info.tagColor}`}>{info.tag}</span>
                             </div>
                             <div className="flex gap-6 text-[11px] font-bold text-slate-400">
                               <span className="flex items-center gap-1.5"><Zap size={12}/>{inst.watts}W</span>
                               <span className="flex items-center gap-1.5"><Clock size={12}/>{inst.hoursPerDay}H/D</span>
                             </div>
                          </div>

                          {/* 數量調整器 */}
                          <div className="flex items-center gap-5 bg-slate-50 px-4 py-2.5 rounded-full border border-slate-100">
                             <button onClick={() => updateInstance(inst.id, { count: Math.max(1, inst.count - 1) })} className="p-1 hover:text-emerald-600 transition-colors"><MinusCircle size={24}/></button>
                             <span className="text-lg font-black w-8 text-center text-slate-800">{inst.count}</span>
                             <button onClick={() => updateInstance(inst.id, { count: inst.count + 1 })} className="p-1 hover:text-emerald-600 transition-colors"><PlusCircle size={24}/></button>
                          </div>

                          <div className="text-right md:min-w-[120px]">
                             <div className="text-2xl font-black text-slate-900">{info.kwh.toFixed(1)} <span className="text-xs text-slate-400 ml-1">度</span></div>
                             <div className="text-[11px] font-bold text-emerald-500 mt-1">成本 {formatValue(info.kwh * 4)}</div>
                          </div>

                          <button onClick={() => setInstances(instances.filter(i => i.id !== inst.id))} className="text-slate-200 hover:text-red-500 transition-colors p-2"><Trash2 size={24}/></button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </section>

              {/* 節能行動清單 */}
              <section className="bg-white p-10 rounded-[48px] border border-slate-200 shadow-sm">
                 <h3 className="text-lg font-black text-slate-800 mb-8 uppercase tracking-widest flex items-center gap-3"><CheckCircle2 size={22} className="text-emerald-500"/> 節能行動挑戰任務</h3>
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    {SAVINGS_ACTIONS.map(action => (
                      <button 
                        key={action.id} 
                        onClick={() => setCheckedActions({...checkedActions, [action.id]: !checkedActions[action.id]})}
                        className={`p-6 rounded-[32px] border-2 text-left transition-all flex items-center gap-5 ${checkedActions[action.id] ? 'bg-emerald-50 border-emerald-500' : 'bg-white border-slate-50 hover:border-emerald-100'}`}
                      >
                         <span className="text-4xl">{action.icon}</span>
                         <div className="flex-1">
                            <div className={`text-sm font-black ${checkedActions[action.id] ? 'text-emerald-800' : 'text-slate-600'}`}>{action.label}</div>
                            <div className="text-[11px] text-emerald-500 font-black mt-1">預估減少 {action.reduction * 100}% 耗能</div>
                         </div>
                         <div className={`w-7 h-7 rounded-full border-4 flex items-center justify-center transition-all ${checkedActions[action.id] ? 'bg-emerald-500 border-emerald-500 text-white' : 'border-slate-100 bg-slate-50'}`}>
                           {checkedActions[action.id] && <CheckCircle2 size={16}/>}
                         </div>
                      </button>
                    ))}
                 </div>
              </section>
            </div>

            <div className="lg:col-span-4 space-y-10">
               {/* 級距分析 */}
               <section className="bg-white p-10 rounded-[48px] border border-slate-200 shadow-sm">
                  <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] mb-8 border-b pb-4">台電累進級距透視</h3>
                  <div className="space-y-6">
                    {stats.tierBreakdown.map((b, i) => (
                      <div key={i} className="group">
                        <div className="flex justify-between items-end mb-2.5 px-1">
                          <span className="text-[11px] font-black text-slate-400">級距 {i+1}: {b.range} 度</span>
                          <span className="text-sm font-black text-slate-900">{formatValue(b.cost)}</span>
                        </div>
                        <div className="h-2.5 bg-slate-50 rounded-full overflow-hidden border border-slate-100">
                           <div className="h-full bg-emerald-500 transition-all duration-1000 ease-out shadow-[0_0_10px_rgba(16,185,129,0.3)]" style={{ width: `${stats.totalKwh > 0 ? (b.kwh / stats.totalKwh)*100 : 0}%` }}/>
                        </div>
                        <div className="mt-1 text-right text-[9px] font-bold text-slate-300 opacity-0 group-hover:opacity-100 transition-opacity">費率: ${b.rate}/度</div>
                      </div>
                    ))}
                  </div>
               </section>

               {/* 時光機 */}
               <div className={`p-10 rounded-[48px] shadow-2xl relative overflow-hidden transition-all duration-500 group ${isRetroMode ? 'bg-orange-600 text-white' : 'bg-indigo-600 text-white'}`}>
                  <div className="relative z-10">
                     <div className="w-16 h-16 bg-white/20 backdrop-blur-md rounded-[20px] flex items-center justify-center mb-6 group-hover:rotate-12 transition-transform">
                        <History size={32}/>
                     </div>
                     <h4 className="font-black text-2xl mb-3 tracking-tight">時光機對比</h4>
                     <p className="text-xs opacity-80 leading-relaxed mb-8 font-medium">回到 30 年前，那時沒有變頻冷氣、沒有 LED。看看在同樣的使用習慣下，舊技術會如何吞噬您的存款。</p>
                     <button onClick={() => setIsRetroMode(!isRetroMode)} className="w-full bg-white text-slate-900 py-5 rounded-[24px] font-black text-xs uppercase tracking-widest shadow-lg hover:scale-105 transition-transform">{isRetroMode ? '回到 2025 現代' : '傳送到 1990 年代'}</button>
                  </div>
                  <Ghost className="absolute -bottom-10 -right-10 opacity-10 rotate-12" size={200} />
               </div>

               {/* 耗能分析 */}
               <div className="bg-white p-10 rounded-[48px] border border-slate-200 shadow-sm">
                  <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-8 border-b pb-4">吃電怪獸診斷</h3>
                  <div className="space-y-5">
                     {stats.topConsumers.map(item => (
                       <div key={item.id} className="flex gap-5 p-5 rounded-[32px] bg-slate-50 border border-slate-100 hover:bg-white hover:border-emerald-200 transition-all group">
                          <span className="text-4xl shrink-0 group-hover:scale-110 transition-transform">{item.icon}</span>
                          <div>
                             <div className="text-xs font-black text-slate-800 mb-1.5">{item.name}</div>
                             <p className="text-[10px] text-slate-500 font-medium italic">" {item.tips} "</p>
                             {item.upgradeTo && (
                               <button onClick={() => setRoiTargetId(item.applianceId)} className="mt-3 text-[9px] font-black text-emerald-600 uppercase flex items-center gap-1.5 hover:gap-3 transition-all">
                                 查看汰換回本年限 <ArrowRight size={10}/>
                               </button>
                             )}
                          </div>
                       </div>
                     ))}
                     {instances.length === 0 && <p className="text-[10px] text-slate-300 italic text-center py-6">新增設備後開始診斷...</p>}
                  </div>
               </div>
            </div>
          </div>
        </div>
      </main>

      {/* 底部導覽列 (手機版專用) */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-xl border-t border-slate-200 p-5 px-8 flex items-center justify-between z-40 shadow-[0_-20px_50px_rgba(0,0,0,0.1)]">
        <div>
          <span className="text-[9px] font-black text-slate-400 uppercase block tracking-widest mb-1">預估電費</span>
          <span className="text-3xl font-black text-emerald-600">{formatValue(stats.totalCost)}</span>
        </div>
        <div className="text-right">
          <span className="text-[9px] font-black text-slate-400 uppercase block tracking-widest mb-1">每月消耗</span>
          <span className="text-xl font-black text-slate-800">{stats.totalKwh.toFixed(1)} <span className="text-xs text-slate-400">度</span></span>
        </div>
      </div>

      {/* ROI Modal */}
      {roiTargetId && (() => {
        const app = APPLIANCES.find(a => a.id === roiTargetId)!;
        const upgrade = APPLIANCES.find(a => a.id === app.upgradeTo)!;
        const monthlySavings = calculateMonthlyKwh(app.defaultWatts, app.defaultHours, 1, app.runningRate) - calculateMonthlyKwh(upgrade.defaultWatts, upgrade.defaultHours, 1, upgrade.runningRate);
        const annualSavingsCash = monthlySavings * 12 * 4;
        return (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[100] flex items-center justify-center p-4 animate-in fade-in duration-300">
             <div className="bg-white w-full max-w-lg rounded-[48px] shadow-2xl p-12 relative overflow-hidden">
                <button onClick={() => setRoiTargetId(null)} className="absolute top-8 right-8 p-3 bg-slate-100 rounded-full hover:bg-slate-200 transition-colors"><X size={20}/></button>
                <div className="flex items-center gap-5 mb-10">
                   <div className="p-5 bg-emerald-100 rounded-[32px] text-emerald-600 shadow-lg shadow-emerald-50"><TrendingDown size={32}/></div>
                   <div>
                      <h2 className="text-2xl font-black text-slate-800 tracking-tight">汰換效益分析</h2>
                      <p className="text-xs font-bold text-slate-400 mt-1">比較舊型設備與 1 級能效產品</p>
                   </div>
                </div>
                <div className="grid grid-cols-2 gap-8 mb-10">
                   <div className="p-8 rounded-[36px] bg-slate-50 border border-slate-100 text-center">
                      <div className="text-5xl mb-3">{app.icon}</div>
                      <div className="text-[10px] font-black text-slate-400 uppercase mb-2 tracking-widest">舊型設備</div>
                      <div className="text-lg font-black text-slate-800">{app.defaultWatts}W</div>
                   </div>
                   <div className="p-8 rounded-[36px] bg-emerald-50 border border-emerald-100 text-center">
                      <div className="text-5xl mb-3">{upgrade.icon}</div>
                      <div className="text-[10px] font-black text-emerald-500 uppercase mb-2 tracking-widest">1 級能效</div>
                      <div className="text-lg font-black text-emerald-700">{upgrade.defaultWatts}W</div>
                   </div>
                </div>
                <div className="bg-slate-900 p-8 rounded-[36px] text-white space-y-4">
                   <div className="flex justify-between font-bold text-sm text-slate-400"><span>每年節省度數</span><span className="text-emerald-400 font-black">{(monthlySavings * 12).toFixed(0)} 度</span></div>
                   <div className="flex justify-between font-bold text-sm text-slate-400"><span>每年省下現金 (估)</span><span className="text-emerald-400 font-black">NT$ {annualSavingsCash.toLocaleString()}</span></div>
                   <div className="pt-5 border-t border-slate-800 flex justify-between font-black items-center">
                      <span className="text-lg">預計回本時間</span>
                      <span className="text-3xl text-emerald-400">約 2.2 年</span>
                   </div>
                </div>
             </div>
          </div>
        );
      })()}

      {/* 人格分析 Modal */}
      {showPersonality && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[100] flex items-center justify-center p-4 animate-in fade-in zoom-in duration-300">
           <div className="bg-white w-full max-w-md rounded-[48px] shadow-2xl overflow-hidden relative">
              <button onClick={() => setShowPersonality(false)} className="absolute top-8 right-8 p-3 bg-slate-100/50 rounded-full text-slate-400 hover:text-slate-800 transition-all"><X size={20}/></button>
              <div className="bg-gradient-to-br from-indigo-600 to-violet-700 p-12 text-center text-white relative">
                 <div className="w-24 h-24 bg-white/20 backdrop-blur-xl rounded-[32px] mx-auto mb-8 flex items-center justify-center text-5xl shadow-2xl border border-white/30 rotate-3">
                   {stats.totalKwh < 200 ? '🌱' : stats.totalKwh < 500 ? '🧊' : '🌋'}
                 </div>
                 <h2 className="text-[10px] font-black uppercase tracking-[0.4em] text-indigo-200 mb-3">您的電力 MBTI</h2>
                 <h1 className="text-4xl font-black mb-4 tracking-tighter">
                   {stats.totalKwh < 200 ? '節能小清新' : stats.totalKwh < 500 ? '電力平衡者' : '台電貴賓卡'}
                 </h1>
                 <p className="text-sm opacity-80 font-bold leading-relaxed">
                   {stats.totalKwh < 200 ? '您對電力的克制讓人敬佩，幾乎是靠光合作用在生活。' : 
                    stats.totalKwh < 500 ? '在舒適與帳單之間找到了絕妙的平衡點。' : 
                    '您是台電最愛的 VIP，冷氣大概是開 18 度在睡覺吧？'}
                 </p>
              </div>
              <div className="p-10 space-y-6">
                 <div className="grid grid-cols-2 gap-4">
                    <div className="bg-slate-50 p-6 rounded-[32px] text-center border border-slate-100">
                       <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">年度碳排 (估)</div>
                       <div className="text-2xl font-black text-slate-800">{(stats.totalKwh * 0.49 * 12).toFixed(1)}kg</div>
                    </div>
                    <div className="bg-slate-50 p-6 rounded-[32px] text-center border border-slate-100">
                       <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">省錢PR值</div>
                       <div className="text-2xl font-black text-slate-800">PR {Math.max(5, 100 - Math.round(stats.totalKwh/10))}</div>
                    </div>
                 </div>
                 <button className="w-full bg-slate-900 text-white py-5 rounded-[24px] font-black text-xs uppercase tracking-widest shadow-xl hover:bg-slate-800 transition-all" onClick={() => setShowPersonality(false)}>關閉分析並繼續省錢</button>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};

export default App;
