interface TokenData {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  expiresAt: number;
}

class TokenManager {
  private static readonly ACCESS_TOKEN_KEY = 'access_token';
  private static readonly REFRESH_TOKEN_KEY = 'refresh_token';
  private static readonly EXPIRES_AT_KEY = 'token_expires_at';
  private static readonly REFRESH_BUFFER = 5 * 60 * 1000; // 5分钟缓冲时间

  /**
   * 存储token数据
   */
  static setTokens(tokenData: Omit<TokenData, 'expiresAt'>): void {
    const expiresAt = Date.now() + tokenData.expiresIn;
    
    localStorage.setItem(this.ACCESS_TOKEN_KEY, tokenData.accessToken);
    localStorage.setItem(this.REFRESH_TOKEN_KEY, tokenData.refreshToken);
    localStorage.setItem(this.EXPIRES_AT_KEY, expiresAt.toString());
  }

  /**
   * 获取访问令牌
   */
  static getAccessToken(): string | null {
    return localStorage.getItem(this.ACCESS_TOKEN_KEY);
  }

  /**
   * 获取刷新令牌
   */
  static getRefreshToken(): string | null {
    return localStorage.getItem(this.REFRESH_TOKEN_KEY);
  }

  /**
   * 检查token是否即将过期（需要刷新）
   */
  static isTokenExpiringSoon(): boolean {
    const expiresAt = localStorage.getItem(this.EXPIRES_AT_KEY);
    if (!expiresAt) return true;
    
    const expirationTime = parseInt(expiresAt);
    const currentTime = Date.now();
    
    return currentTime >= (expirationTime - this.REFRESH_BUFFER);
  }

  /**
   * 检查token是否已过期
   */
  static isTokenExpired(): boolean {
    const expiresAt = localStorage.getItem(this.EXPIRES_AT_KEY);
    if (!expiresAt) return true;
    
    const expirationTime = parseInt(expiresAt);
    return Date.now() >= expirationTime;
  }

  /**
   * 清除所有token
   */
  static clearTokens(): void {
    localStorage.removeItem(this.ACCESS_TOKEN_KEY);
    localStorage.removeItem(this.REFRESH_TOKEN_KEY);
    localStorage.removeItem(this.EXPIRES_AT_KEY);
  }

  /**
   * 检查是否有有效的token
   */
  static hasValidTokens(): boolean {
    const accessToken = this.getAccessToken();
    const refreshToken = this.getRefreshToken();
    
    return !!(accessToken && refreshToken && !this.isTokenExpired());
  }

  /**
   * 刷新token
   */
  static async refreshTokens(): Promise<boolean> {
    const refreshToken = this.getRefreshToken();
    if (!refreshToken) {
      return false;
    }

    try {
      const response = await fetch('/api/auth/refresh', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ refreshToken }),
      });

      if (response.ok) {
        const tokenData = await response.json();
        this.setTokens(tokenData);
        return true;
      } else {
        // 刷新失败，清除token
        this.clearTokens();
        return false;
      }
    } catch (error) {
      console.error('Token refresh failed:', error);
      this.clearTokens();
      return false;
    }
  }

  /**
   * 获取Authorization header值
   */
  static getAuthHeader(): string | null {
    const accessToken = this.getAccessToken();
    console.log('TokenManager - 获取访问令牌:', accessToken ? `${accessToken.substring(0, 20)}...` : 'null');
    if (!accessToken) {
      return null;
    }
    const authHeader = `Bearer ${accessToken}`;
    console.log('TokenManager - 生成认证头:', `${authHeader.substring(0, 30)}...`);
    return authHeader;
  }
}

export default TokenManager;
export type { TokenData };