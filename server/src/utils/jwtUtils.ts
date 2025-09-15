import jwt, { SignOptions, Secret } from 'jsonwebtoken';
import crypto from 'crypto';

export interface JWTPayload {
  userId: string;
  hospitalName: string;
  productBatch: string;
  type: 'access' | 'refresh';
  iat?: number;
  exp?: number;
}

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

class JWTUtils {
  private accessTokenSecret: string;
  private refreshTokenSecret: string;
  private accessTokenExpiry: string;
  private refreshTokenExpiry: string;

  constructor() {
    // 从环境变量获取密钥，如果没有则生成默认密钥
    this.accessTokenSecret = process.env.JWT_ACCESS_SECRET || this.generateSecret();
    this.refreshTokenSecret = process.env.JWT_REFRESH_SECRET || this.generateSecret();
    this.accessTokenExpiry = process.env.JWT_ACCESS_EXPIRY || '15m'; // 15分钟
    this.refreshTokenExpiry = process.env.JWT_REFRESH_EXPIRY || '7d'; // 7天

    // 如果是生产环境但没有设置密钥，发出警告
    if (process.env.NODE_ENV === 'production' && (!process.env.JWT_ACCESS_SECRET || !process.env.JWT_REFRESH_SECRET)) {
      console.warn('警告: 生产环境中应该设置 JWT_ACCESS_SECRET 和 JWT_REFRESH_SECRET 环境变量');
    }
  }

  private generateSecret(): string {
    return crypto.randomBytes(64).toString('hex');
  }

  /**
   * 生成访问令牌和刷新令牌对
   */
  generateTokenPair(userId: string, hospitalName: string, productBatch: string): TokenPair {
    const accessPayload: JWTPayload = {
      userId,
      hospitalName,
      productBatch,
      type: 'access'
    };

    const refreshPayload: JWTPayload = {
      userId,
      hospitalName,
      productBatch,
      type: 'refresh'
    };

    const accessToken = jwt.sign(accessPayload, this.accessTokenSecret, {
      expiresIn: this.accessTokenExpiry,
      issuer: 'hospital-login-system',
      audience: 'hospital-users'
    } as SignOptions);

    const refreshToken = jwt.sign(refreshPayload, this.refreshTokenSecret, {
      expiresIn: this.refreshTokenExpiry,
      issuer: 'hospital-login-system',
      audience: 'hospital-users'
    } as SignOptions);

    // 计算访问令牌过期时间（毫秒）
    const expiresIn = this.parseExpiry(this.accessTokenExpiry);

    return {
      accessToken,
      refreshToken,
      expiresIn
    };
  }

  /**
   * 验证访问令牌
   */
  verifyAccessToken(token: string): JWTPayload | null {
    try {
      const decoded = jwt.verify(token, this.accessTokenSecret, {
        issuer: 'hospital-login-system',
        audience: 'hospital-users'
      }) as JWTPayload;

      if (decoded.type !== 'access') {
        return null;
      }

      return decoded;
    } catch (error) {
      console.error('访问令牌验证失败:', error);
      return null;
    }
  }

  /**
   * 验证刷新令牌
   */
  verifyRefreshToken(token: string): JWTPayload | null {
    try {
      const decoded = jwt.verify(token, this.refreshTokenSecret, {
        issuer: 'hospital-login-system',
        audience: 'hospital-users'
      }) as JWTPayload;

      if (decoded.type !== 'refresh') {
        return null;
      }

      return decoded;
    } catch (error) {
      console.error('刷新令牌验证失败:', error);
      return null;
    }
  }

  /**
   * 使用刷新令牌生成新的令牌对
   */
  refreshTokenPair(refreshToken: string): TokenPair | null {
    const decoded = this.verifyRefreshToken(refreshToken);
    if (!decoded) {
      return null;
    }

    return this.generateTokenPair(decoded.userId, decoded.hospitalName, decoded.productBatch);
  }

  /**
   * 解析过期时间字符串为毫秒数
   */
  private parseExpiry(expiry: string): number {
    const match = expiry.match(/^(\d+)([smhd])$/);
    if (!match) {
      return 15 * 60 * 1000; // 默认15分钟
    }

    const value = parseInt(match[1]);
    const unit = match[2];

    switch (unit) {
      case 's': return value * 1000;
      case 'm': return value * 60 * 1000;
      case 'h': return value * 60 * 60 * 1000;
      case 'd': return value * 24 * 60 * 60 * 1000;
      default: return 15 * 60 * 1000;
    }
  }

  /**
   * 从Bearer token中提取token
   */
  extractTokenFromHeader(authHeader: string | undefined): string | null {
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return null;
    }
    return authHeader.substring(7);
  }
}

export const jwtUtils = new JWTUtils();
export default jwtUtils;