
import { ApplianceData, PricingTier, ScenarioTemplate, AudioConfig } from './types';

export const APPLIANCES: ApplianceData[] = [
  { id: 'ac_fixed', name: '定頻舊冷氣', category: '客廳', defaultWatts: 1200, surgeWatts: "4000", runningRate: 0.8, defaultHours: 8, tips: "建議更換變頻，省電約 50% 以上。", icon: '🧊', upgradeTo: 'ac_inv' },
  { id: 'ac_inv', name: '變頻冷氣(1級)', category: '客廳', defaultWatts: 600, surgeWatts: "1500", runningRate: 0.4, defaultHours: 8, tips: "一級能效最省電，建議搭配循環扇。", icon: '❄️', isHighEfficiency: true },
  { id: 'fridge_old', name: '老舊冰箱', category: '廚房', defaultWatts: 280, surgeWatts: "800", runningRate: 0.5, defaultHours: 24, tips: "門縫膠條老化是耗電元兇。", icon: '🛒', upgradeTo: 'fridge_inv' },
  { id: 'fridge_inv', name: '變頻冰箱', category: '廚房', defaultWatts: 150, surgeWatts: "500", runningRate: 0.3, defaultHours: 24, tips: "建議保持 7-8 分滿。", icon: '🍏', isHighEfficiency: true },
  { id: 'dehumidifier', name: '除濕機(1級)', category: '客廳', defaultWatts: 200, surgeWatts: "400", runningRate: 0.5, defaultHours: 6, tips: "定期清洗濾網可省下 8% 用電。", icon: '💧', isHighEfficiency: true },
  { id: 'water_heater', name: '儲熱式熱水器', category: '衛浴', defaultWatts: 4500, surgeWatts: "6000", runningRate: 0.2, defaultHours: 2, tips: "加裝定時器避免半夜反覆加熱。", icon: '🚿' },
  { id: 'electric_pot', name: '大同電鍋', category: '廚房', defaultWatts: 800, surgeWatts: "1000", runningRate: 0.4, defaultHours: 1, tips: "不用時拔掉插頭，減少保溫電力。", icon: '🍲' },
  { id: 'kettle', name: '開飲機', category: '廚房', defaultWatts: 750, surgeWatts: "800", runningRate: 0.2, defaultHours: 24, tips: "改用快煮壺搭配保溫瓶更省錢。", icon: '☕' },
  { id: 'tv_55', name: '55吋液晶電視', category: '客廳', defaultWatts: 150, surgeWatts: "200", runningRate: 1.0, defaultHours: 5, tips: "隨手關機，減少待機電力消耗。", icon: '📺' },
  { id: 'pc_gaming', name: '電競桌機', category: '臥室', defaultWatts: 450, surgeWatts: "750", runningRate: 1.0, defaultHours: 5, tips: "不使用時請進入睡眠或關機。", icon: '🎮' },
  { id: 'laptop', name: '筆記型電腦', category: '臥室', defaultWatts: 65, surgeWatts: "100", runningRate: 1.0, defaultHours: 8, tips: "比桌機節能 80% 以上。", icon: '💻', isHighEfficiency: true },
  { id: 'light_led', name: 'LED 燈泡', category: '客廳', defaultWatts: 12, surgeWatts: "12", runningRate: 1.0, defaultHours: 6, tips: "養成隨手關燈的好習慣。", icon: '🌟', isHighEfficiency: true }
];

export const TEMPLATES: ScenarioTemplate[] = [
  {
    name: "老舊套房風",
    description: "二手定頻冷氣與小冰箱的組合",
    icon: "🏚️",
    appliances: [
      { applianceId: 'ac_fixed', count: 1, watts: 1200, hoursPerDay: 8 },
      { applianceId: 'fridge_old', count: 1, watts: 200, hoursPerDay: 24 },
      { applianceId: 'kettle', count: 1, watts: 750, hoursPerDay: 24 }
    ]
  },
  {
    name: "現代節能家",
    description: "全室一級能效與變頻家電",
    icon: "🏢",
    appliances: [
      { applianceId: 'ac_inv', count: 2, watts: 600, hoursPerDay: 8 },
      { applianceId: 'fridge_inv', count: 1, watts: 150, hoursPerDay: 24 },
      { applianceId: 'light_led', count: 10, watts: 12, hoursPerDay: 6 }
    ]
  }
];

export const PRICING_TIERS: PricingTier[] = [
  { limit: 120, rateSummer: 1.63, rateNonSummer: 1.63 },
  { limit: 330, rateSummer: 2.38, rateNonSummer: 2.10 },
  { limit: 500, rateSummer: 3.52, rateNonSummer: 2.89 },
  { limit: 700, rateSummer: 4.80, rateNonSummer: 3.94 },
  { limit: 1000, rateSummer: 5.83, rateNonSummer: 4.74 },
  { limit: Infinity, rateSummer: 7.69, rateNonSummer: 6.03 }
];

export const UNIT_RATES = {
  TWD: { symbol: '$', rate: 1, name: '台幣' },
  BUBBLE_TEA: { symbol: '🧋', rate: 65, name: '杯珍奶' },
  BENTO: { symbol: '🍱', rate: 110, name: '個便當' },
  NETFLIX: { symbol: '📺', rate: 390, name: '月訂閱' }
};

// --- SUNO 音樂配置區 ---
// 請在這裡貼上您的 Base64 字串
// 例如: src: "data:audio/mp3;base64,AAAA..."
export const SUNO_TRACKS: Record<string, AudioConfig> = {
  safe: {
    id: 'safe',
    label: 'Chill 省電模式',
    src: 'https://assets.mixkit.co/music/preview/mixkit-sun-and-clouds-585.mp3'
  },
  warning: {
    id: 'warning',
    label: 'Suspense 耗能警戒',
    src: 'https://assets.mixkit.co/music/preview/mixkit-cbpd-400.mp3'
  },
  crisis: {
    id: 'crisis',
    label: 'Crisis 荷包崩潰',
    src: 'https://assets.mixkit.co/music/preview/mixkit-driving-ambition-32.mp3'
  }
};
