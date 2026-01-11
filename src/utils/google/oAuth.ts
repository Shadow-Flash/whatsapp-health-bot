// oAuthClientManager.ts
import { google } from 'googleapis';
import logger from '@/utils/common/logger';

class OAuthClientManager {
  private static instance: OAuthClientManager;
  private userOAuthClients: Map<
    string,
    InstanceType<typeof google.auth.OAuth2>
  >;

  private constructor() {
    this.userOAuthClients = new Map();
    logger.info(
      '🔧 OAuthClientManager CONSTRUCTOR CALLED - New instance created'
    );
  }

  public static getInstance(): OAuthClientManager {
    if (!OAuthClientManager.instance) {
      logger.info('🆕 Creating NEW OAuthClientManager instance');
      OAuthClientManager.instance = new OAuthClientManager();
    } else {
      logger.info('♻️ Reusing EXISTING OAuthClientManager instance');
    }
    return OAuthClientManager.instance;
  }

  public getOAuthClientForUser(
    waId: string
  ): InstanceType<typeof google.auth.OAuth2> {
    logger.info(
      `🔍 Getting OAuth client for ${waId}. Current map size: ${this.userOAuthClients.size}`
    );

    if (!this.userOAuthClients.has(waId)) {
      logger.info(`➕ Creating NEW OAuth client for ${waId}`);
      const client = new google.auth.OAuth2(
        process.env.CLIENT_ID_GOOGLE_API!,
        process.env.CLIENT_SECRET_GOOGLE_API!,
        process.env.REDIRECT_URI_GOOGLE_API!
      );
      this.userOAuthClients.set(waId, client);
    } else {
      logger.info(`✅ Reusing EXISTING OAuth client for ${waId}`);
    }

    return this.userOAuthClients.get(waId)!;
  }

  public removeClient(waId: string): void {
    this.userOAuthClients.delete(waId);
    logger.info(`🗑️ Removed client for ${waId}`);
  }

  public clearAllClients(): void {
    this.userOAuthClients.clear();
    logger.info('🧹 Cleared all clients');
  }

  public getClientCount(): number {
    return this.userOAuthClients.size;
  }
}

export default OAuthClientManager.getInstance();
