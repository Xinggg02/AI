
export type Category = '客廳' | '廚房' | '臥室' | '衛浴' | '其他';

export interface ApplianceData {
  id: string;
  name: string;
  category: Category;
  defaultWatts: number;
  surgeWatts: string;
  runningRate: number;
  defaultHours: number;
  tips: string;
  icon: string;
  isHighEfficiency?: boolean;
  upgradeTo?: string;
}

export interface UserApplianceInstance {
  id: string;
  applianceId: string;
  count: number;
  watts: number;
  hoursPerDay: number;
  label?: string;
}

export interface BillConfig {
  isSummer: boolean;
  baseKwh: number;
  useCustomRate: boolean;
  customRate: number;
}

export interface PricingTier {
  limit: number;
  rateSummer: number;
  rateNonSummer: number;
}

export interface TierBreakdown {
  range: string;
  kwh: number;
  rate: number;
  cost: number;
}

export interface ScenarioTemplate {
  name: string;
  description: string;
  icon: string;
  appliances: Omit<UserApplianceInstance, 'id'>[];
}

export type UnitType = 'TWD' | 'BUBBLE_TEA' | 'BENTO' | 'NETFLIX';

export interface AudioConfig {
  id: 'safe' | 'warning' | 'crisis';
  src: string; // Base64 or URL
  label: string;
}
