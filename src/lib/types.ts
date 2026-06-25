export type Category =
  | "photo"
  | "walk"
  | "creativity"
  | "home"
  | "new-experience"
  | "self-care"
  | "communication"
  | "pair"
  | "friends"
  | "good-deeds"
  | "custom";

export const CATEGORY_LABELS: Record<Category, string> = {
  photo: "Фото",
  walk: "Прогулка",
  creativity: "Творчество",
  home: "Дом",
  "new-experience": "Новые впечатления",
  "self-care": "Забота о себе",
  communication: "Общение",
  pair: "Пара",
  friends: "Друзья",
  "good-deeds": "Добрые дела",
  custom: "Свой челлендж",
};

export type Difficulty = "easy" | "medium" | "hard";

export const DIFFICULTY_LABELS: Record<Difficulty, string> = {
  easy: "Лёгкий",
  medium: "Средний",
  hard: "Сложный",
};

export const DIFFICULTY_TIME: Record<Difficulty, string> = {
  easy: "1–5 мин",
  medium: "10–30 мин",
  hard: "от 30 мин",
};

export type ProofType = "photo" | "text" | "voice" | "checkbox";

export const PROOF_LABELS: Record<ProofType, string> = {
  photo: "Фото",
  text: "Текст",
  voice: "Голос",
  checkbox: "Отметка «сделано»",
};

export type PairSubmissionType = "joint" | "separate";

export const PAIR_SUBMISSION_LABELS: Record<PairSubmissionType, string> = {
  joint: "Совместное доказательство",
  separate: "Доказательство от каждого",
};

export interface Challenge {
  id: string;
  title: string;
  description: string;
  category: Category;
  difficulty: Difficulty;
  proofType: ProofType;
  forMode: "single" | "pair" | "friends";
  isCustom?: boolean;
  /** Только для forMode "pair": совместное доказательство грузит один человек,
   * раздельное — каждый партнёр грузит своё, и они раскрываются одновременно. */
  pairSubmissionType?: PairSubmissionType;
}

export type UserMode = "single" | "pair" | "friends";

export interface UserProfile {
  id: string;
  name: string;
  avatarEmoji: string;
  mode: UserMode;
  streak: number;
  level: number;
  badges: string[];
  isSubscribed: boolean;
}

export interface HistoryEntry {
  id: string;
  date: string; // ISO date
  challengeTitle: string;
  category: Category;
  proofType: ProofType;
  proofPreview?: string; // текстовое доказательство
  photoUrl?: string; // подписанная ссылка на фото в Storage
  photoExpired?: boolean;
}

