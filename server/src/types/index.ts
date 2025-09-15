// 数据库模型类型
export interface AuthPair {
  id?: number;
  hospital_name: string;
  product_batch: string;
  created_at: number;
}

export interface AdminUser {
  id?: number;
  username: string;
  password_hash: string;
  created_at: number;
}

export interface UserSession {
  id: string;
  session_data: string;
  expires_at: number;
}

// 请求和响应类型
export interface LoginRequest {
  hospital_name: string;
  product_batch: string;
}

export interface AdminLoginRequest {
  username: string;
  password: string;
}

export interface AuthResponse {
  ok: boolean;
  message?: string;
}

export interface UserInfo {
  hospital_name: string;
  product_batch: string;
  user_id: string;
  conversation_id?: string;
}

// Coze API 类型
export interface CozeCreateConversationRequest {
  bot_id: string;
  meta_data: {
    app_user_id: string;
  };
}

export interface CozeCreateConversationResponse {
  id?: string;
  conversation?: {
    id: string;
  };
}

export interface CozeSendMessageRequest {
  bot_id: string;
  user_id: string;
  stream: boolean;
  additional_messages: {
    role: string;
    type: string;
    content_type: string;
    content: string;
  }[];
}

export interface CozeSendMessageResponse {
  answer?: string;
  messages?: {
    role: string;
    type: string;
    content: string;
  }[];
}

// 扩展Express会话类型
declare global {
  namespace Express {
    interface Request {
      session?: {
        user?: UserInfo;
        isAdmin?: boolean;
        isWechatAuth?: boolean;
        wechatUser?: {
          openid: string;
          nickname: string;
          headimgurl: string;
        } | null;
        adminUser?: {
          username: string;
          user_id: string;
        };
      } | null;
    }
  }
}