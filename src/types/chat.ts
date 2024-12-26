export type UserRole = "landlord" | "tenant";

export interface Message {
  text: string;
  isAi: boolean;
  timestamp: string;
}