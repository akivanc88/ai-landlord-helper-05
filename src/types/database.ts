export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface DatabaseTables {
  admin_users: AdminUser;
  conversation_threads: ConversationThread;
  knowledge_pdfs: KnowledgePDF;
  knowledge_urls: KnowledgeURL;
  messages: Message;
  profiles: Profile;
  question_credits: QuestionCredit;
}

export interface AdminUser {
  created_at: string;
  user_id: string;
}

export interface ConversationThread {
  created_at: string | null;
  id: string;
  role: string;
  title: string;
  updated_at: string | null;
  user_id: string;
}

export interface KnowledgePDF {
  chunks: Json[] | null;
  content: string | null;
  created_at: string;
  file_path: string;
  filename: string;
  id: string;
  is_active: boolean | null;
  updated_at: string;
}

export interface KnowledgeURL {
  chunks: Json[] | null;
  content: string | null;
  created_at: string;
  id: string;
  is_active: boolean | null;
  title: string | null;
  updated_at: string;
  url: string;
}

export interface Message {
  citations: Json[] | null;
  created_at: string | null;
  id: string;
  is_ai: boolean;
  role: string | null;
  text: string;
  thread_id: string | null;
  timestamp: string | null;
  user_id: string;
}

export interface Profile {
  created_at: string;
  id: string;
  role: string | null;
  updated_at: string;
}

export interface QuestionCredit {
  created_at: string | null;
  expiry_date: string | null;
  id: string;
  is_purchased: boolean | null;
  remaining_questions: number;
  user_id: string;
}