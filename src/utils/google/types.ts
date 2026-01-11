export type TokenType = {
  access_token?: string;
  refresh_token?: string;
  scope?: string;
  token_type?: string;
  refresh_token_expires_in?: number;
  expiry_date?: string | number;
};

export enum SessionState {
  NO_SESSION = 'no_session',
  VALID = 'valid',
  EXPIRED_WITH_REFRESH = 'expired_with_refresh',
  EXPIRED_NO_REFRESH = 'expired_no_refresh',
  REVOKED = 'revoked',
}

export interface SessionCheckResult<T> {
  state: SessionState;
  tokens?: T;
  spreadsheetId?: string;
  needsReauth: boolean;
}
