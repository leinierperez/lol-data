export interface Champion {
  id: number;
  key: string;
  name: string;
  title: string;
  fullName: string;
  icon: string;
  resource: string;
  attackType: string;
  adaptiveType: string;
  stats: Stats;
  roles?: string[] | null;
  attributeRatings?: AttributeRatings;
  abilities: Abilities;
  releaseDate: string;
  releasePatch: string;
  patchLastChanged: string;
  price: Price;
  lore: string;
  faction: string;
  skins?: Skin[] | null;
}

export interface Stats {
  health: StatValues;
  healthRegen: StatValues;
  mana: StatValues;
  manaRegen: StatValues;
  armor: StatValues;
  magicResistance: StatValues;
  attackDamage: StatValues;
  movespeed: StatValues;
  acquisitionRadius: StatValues;
  selectionRadius: StatValues;
  pathingRadius: StatValues;
  gameplayRadius: StatValues;
  criticalStrikeDamage: StatValues;
  criticalStrikeDamageModifier: StatValues;
  attackSpeed: StatValues;
  attackSpeedRatio: StatValues;
  attackCastTime: StatValues;
  attackTotalTime: StatValues;
  attackDelayOffset: StatValues;
  attackRange: StatValues;
  aramDamageTaken: StatValues;
  aramDamageDealt: StatValues;
  aramHealing: StatValues;
  aramShielding: StatValues;
  urfDamageTaken: StatValues;
  urfDamageDealt: StatValues;
  urfHealing: StatValues;
  urfShielding: StatValues;
}

export interface StatValues {
  flat: number;
  percent: number;
  perLevel: number;
  percentPerLevel: number;
}

export interface AttributeRatings {
  damage: number;
  toughness: number;
  control: number;
  mobility: number;
  utility: number;
  abilityReliance: number;
  attack: number;
  defense: number;
  magic: number;
  difficulty: number;
}

export interface Abilities {
  P: Ability[] | null;
  Q: Ability[] | null;
  W: Ability[] | null;
  E: Ability[] | null;
  R: Ability[] | null;
}

export interface Ability {
  name: string;
  icon: string;
  targeting: string;
  affects: string;
  spellshieldable: string;
  damageType: string;
  spellEffects: string;
  notes: string;
  blurb: string;
  castTime: string;
  targetRange: string;
}

export interface Price {
  blueEssence: number;
  rp: number;
  saleRp: number;
}

export interface Skin {
  name: string;
  id: number;
  isBase: boolean;
  availability: string;
  formatName: string;
  lootEligible: boolean;
  cost: number | string;
  sale: number;
  distribution?: string | null;
  rarity: string;
  chromas?: (Chroma | null)[] | null;
  lore: string;
  release: string;
  set?: (string | null)[] | null;
  splashPath: string;
  uncenteredSplashPath: string;
  tilePath: string;
  loadScreenPath: string;
  loadScreenVintagePath?: string | null;
  newEffects: boolean;
  newAnimations: boolean;
  newRecall: boolean;
  newVoice: boolean;
  newQuotes: boolean;
  voiceActor?: string[] | null;
  splashArtist?: (string | null)[] | null;
}

export interface Chroma {
  name: string;
  id: number;
  chromaPath: string;
  colors?: string[] | null;
  descriptions?: Description[] | null;
  rarities?: Rarity[] | null;
}

export interface Description {
  description?: string | null;
  region?: string | null;
}

export interface Rarity {
  rarity?: number | null;
  region?: string | null;
}
