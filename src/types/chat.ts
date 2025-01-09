export type UserRole = "landlord" | "tenant";

export interface Citation {
  id: number;
  sourceId: string;
  sourceType: string;
  sourceName: string;
  content?: string;
}

export interface Message {
  text: string;
  isAi: boolean;
  timestamp: string;
  citations?: Citation[];
}