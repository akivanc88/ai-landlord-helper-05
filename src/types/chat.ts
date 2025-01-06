export type UserRole = "landlord" | "tenant";

interface Citation {
  id: number;
  sourceId: string;
  sourceType: string;
  sourceName: string;
}

export interface Message {
  text: string;
  isAi: boolean;
  timestamp: string;
  citations?: Citation[];
}