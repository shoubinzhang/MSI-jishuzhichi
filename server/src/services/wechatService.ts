import crypto from 'crypto';
import axios from 'axios';

export interface WechatUserInfo {
  openid: string;
  nickname: string;
  sex: number;
  province: string;
  city: string;
  country: string;
  headimgurl: string;
  privilege: string[];
  unionid?: string;
}

export interface WechatAccessToken {
  access_token: string;
  expires_in: number;
  refresh_token: string;
  openid: string;
  scope: string;
}

class WechatService {
  private appId: string;
  private appSecret: string;
  private token: string;

  constructor() {
    this.appId = process.env.WECHAT_APP_ID || '';
    this.appSecret = process.env.WECHAT_APP_SECRET || '';
    this.token = process.env.WECHAT_TOKEN || 'your_token';
  }

  /**
   * 验证微信服务器签名
   */
  verifySignature(signature: string, timestamp: string, nonce: string): boolean {
    const tmpArr = [this.token, timestamp, nonce].sort();
    const tmpStr = tmpArr.join('');
    const hash = crypto.createHash('sha1').update(tmpStr).digest('hex');
    return hash === signature;
  }

  /**
   * 获取微信网页授权URL
   */
  getAuthUrl(redirectUri: string, state?: string): string {
    const encodedRedirectUri = encodeURIComponent(redirectUri);
    const scope = 'snsapi_userinfo';
    const stateParam = state || 'STATE';
    
    return `https://open.weixin.qq.com/connect/oauth2/authorize?appid=${this.appId}&redirect_uri=${encodedRedirectUri}&response_type=code&scope=${scope}&state=${stateParam}#wechat_redirect`;
  }

  /**
   * 通过code获取access_token
   */
  async getAccessToken(code: string): Promise<WechatAccessToken> {
    const url = 'https://api.weixin.qq.com/sns/oauth2/access_token';
    const params = {
      appid: this.appId,
      secret: this.appSecret,
      code,
      grant_type: 'authorization_code'
    };

    try {
      const response = await axios.get(url, { params });
      const data = response.data;
      
      if (data.errcode) {
        throw new Error(`微信API错误: ${data.errcode} - ${data.errmsg}`);
      }
      
      return data;
    } catch (error) {
      console.error('获取微信access_token失败:', error);
      throw error;
    }
  }

  /**
   * 获取用户信息
   */
  async getUserInfo(accessToken: string, openid: string): Promise<WechatUserInfo> {
    const url = 'https://api.weixin.qq.com/sns/userinfo';
    const params = {
      access_token: accessToken,
      openid,
      lang: 'zh_CN'
    };

    try {
      const response = await axios.get(url, { params });
      const data = response.data;
      
      if (data.errcode) {
        throw new Error(`微信API错误: ${data.errcode} - ${data.errmsg}`);
      }
      
      return data;
    } catch (error) {
      console.error('获取微信用户信息失败:', error);
      throw error;
    }
  }

  /**
   * 刷新access_token
   */
  async refreshAccessToken(refreshToken: string): Promise<WechatAccessToken> {
    const url = 'https://api.weixin.qq.com/sns/oauth2/refresh_token';
    const params = {
      appid: this.appId,
      grant_type: 'refresh_token',
      refresh_token: refreshToken
    };

    try {
      const response = await axios.get(url, { params });
      const data = response.data;
      
      if (data.errcode) {
        throw new Error(`微信API错误: ${data.errcode} - ${data.errmsg}`);
      }
      
      return data;
    } catch (error) {
      console.error('刷新微信access_token失败:', error);
      throw error;
    }
  }

  /**
   * 检验授权凭证是否有效
   */
  async validateAccessToken(accessToken: string, openid: string): Promise<boolean> {
    const url = 'https://api.weixin.qq.com/sns/auth';
    const params = {
      access_token: accessToken,
      openid
    };

    try {
      const response = await axios.get(url, { params });
      const data = response.data;
      return data.errcode === 0;
    } catch (error) {
      console.error('验证微信access_token失败:', error);
      return false;
    }
  }
}

export const wechatService = new WechatService();
export default wechatService;