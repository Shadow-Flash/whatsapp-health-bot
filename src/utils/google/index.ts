import { google, sheets_v4 } from 'googleapis';
import logger from '@/utils/common/logger';
import { newSheetTemplate } from './template';
import 'dotenv/config';
import { SessionCheckResult, SessionState } from './types';
import oAuthClientManager from './oAuth';

// Helper to get OAuth client for a user
const getOAuthClientForUser = (waId: string) => {
  waId = waId.replace(/['"\\]/g, '');
  return oAuthClientManager.getOAuthClientForUser(waId);
};

// Rest of your code stays the same...

// Master client for operations that need to happen before user auth
const masterOAuthClient = new google.auth.OAuth2(
  process.env.CLIENT_ID_GOOGLE_API!,
  process.env.CLIENT_SECRET_GOOGLE_API!,
  process.env.REDIRECT_URI_GOOGLE_API!
);

// Set master credentials (for searching spreadsheets)
// You need to generate these once and store them
if (process.env.MASTER_ACCESS_TOKEN && process.env.MASTER_REFRESH_TOKEN) {
  masterOAuthClient.setCredentials({
    access_token: process.env.MASTER_ACCESS_TOKEN,
    refresh_token: process.env.MASTER_REFRESH_TOKEN,
  });
}

const driveMaster = google.drive({
  version: 'v3',
  auth: masterOAuthClient,
});

export const sheets = google.sheets({
  version: 'v4',
  auth: masterOAuthClient,
});

export const setupTokenRefreshHandler = (waId: string) => {
  const oAuth2Client = getOAuthClientForUser(waId);

  // Remove any existing listeners to avoid duplicates
  oAuth2Client.removeAllListeners('tokens');

  oAuth2Client.on('tokens', async (tokens) => {
    try {
      oAuth2Client.setCredentials(tokens);
      const spreadsheetId = await getUserSpreadsheetId(waId);
      if (!spreadsheetId) {
        logger.info('No spreadsheet found to save refreshed tokens.');
        return;
      }
      await handleUserInfoUpdationInSpreadSheet(
        oAuth2Client,
        waId,
        spreadsheetId,
        tokens
      );
      logger.info('Tokens updated and persisted to Google Sheet');
    } catch (error) {
      logger.error(`Failed to persist refreshed tokens: ${error}`);
    }
  });
};
// Remove driveMaster entirely and use user's credentials
export const getUserSpreadsheetId = async (
  waId: string,
  userAuth?: InstanceType<typeof google.auth.OAuth2>
): Promise<string | null> => {
  try {
    const cleanWaId = waId.replace(/['"\\]/g, '');

    // If we have user auth, use it. Otherwise we can't search.
    if (!userAuth) {
      logger.warn('No auth provided to search for spreadsheet');
      return null;
    }

    const drive = google.drive({
      version: 'v3',
      auth: userAuth,
    });

    const response = await drive.files.list({
      q: `appProperties has { key='bot_identifier' and value='whatsapp_bot_${cleanWaId}' } and trashed = false`,
      fields: 'files(id, name)',
    });

    logger.info(JSON.stringify(response, null, 2));
    return response.data.files?.[0]?.id || null;
  } catch (error) {
    logger.error(`Error finding spreadsheet: ${error}`);
    return null;
  }
};

export const getTokensFromSheet = async (
  waId: string,
  spreadsheetId: string
): Promise<any | null> => {
  try {
    const oAuth2Client = getOAuthClientForUser(waId);
    const sheets = google.sheets({
      version: 'v4',
      auth: oAuth2Client,
    });

    const res = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: 'User Profiles!A1',
    });

    const jsonString = res.data.values?.[0]?.[0];
    if (!jsonString) {
      logger.info('No tokens found in sheet');
      return null;
    }

    const tokens = JSON.parse(jsonString);
    logger.info('Tokens retrieved from sheet');
    return tokens;
  } catch (error: any) {
    if (error.code === 404 || error.code === 400) {
      logger.info('Sheet or range not found');
      return null;
    }
    logger.error(`Error reading tokens: ${error}`);
    return null;
  }
};

export const isTokenExpired = (tokens: any): boolean => {
  if (!tokens.expiry_date) {
    return true;
  }

  const now = Date.now();
  const bufferTime = 5 * 60 * 1000; // 5 minutes buffer

  return now >= tokens.expiry_date - bufferTime;
};

export const tryRefreshToken = async (
  waId: string,
  spreadsheetId: string
): Promise<boolean> => {
  try {
    const oAuth2Client = getOAuthClientForUser(waId);
    const sheets = google.sheets({
      version: 'v4',
      auth: oAuth2Client,
    });

    await sheets.spreadsheets.get({
      spreadsheetId,
      fields: 'spreadsheetId',
    });

    logger.info('Token refreshed successfully');
    return true;
  } catch (error: any) {
    logger.error(`Token refresh failed: ${error.message}`);

    if (error.code === 401 || error.code === 403) {
      return false;
    }

    return false;
  }
};

export const checkUserSession = async (
  waId: string
): Promise<SessionCheckResult<any>> => {
  try {
    const cleanWaId = waId.replace(/['"\\]/g, '');
    logger.info(`Checking session for user ${cleanWaId}`);

    const oAuth2Client = getOAuthClientForUser(cleanWaId);

    // PROBLEM: We don't have credentials yet, so we can't search for spreadsheet
    // SOLUTION: Store spreadsheet ID elsewhere (database, cache) OR use master credentials

    // For now, let's assume you have a way to get spreadsheet ID without auth
    // This could be from a database, Redis, or you maintain a mapping
    const spreadsheetId = await getUserSpreadsheetId(cleanWaId, oAuth2Client);

    if (!spreadsheetId) {
      logger.info(`No spreadsheet found - first time user`);
      return {
        state: SessionState.NO_SESSION,
        needsReauth: true,
      };
    }

    // Now get tokens from the sheet
    const tokens = await getTokensFromSheet(cleanWaId, spreadsheetId);

    if (!tokens || !tokens.access_token) {
      logger.info(`No tokens found - needs authentication`);
      return {
        state: SessionState.NO_SESSION,
        spreadsheetId,
        needsReauth: true,
      };
    }

    // Set credentials BEFORE any API calls
    oAuth2Client.setCredentials(tokens);
    setupTokenRefreshHandler(cleanWaId);

    const expired = isTokenExpired(tokens);

    if (!expired) {
      const testSuccess = await tryRefreshToken(cleanWaId, spreadsheetId);

      if (testSuccess) {
        logger.info(`Valid session for ${cleanWaId}`);
        return {
          state: SessionState.VALID,
          tokens,
          spreadsheetId,
          needsReauth: false,
        };
      } else {
        logger.warn(`Token exists but API call failed for ${cleanWaId}`);
        return {
          state: SessionState.REVOKED,
          spreadsheetId,
          needsReauth: true,
        };
      }
    }

    if (tokens.refresh_token) {
      logger.info(`Token expired for ${cleanWaId}, attempting refresh...`);

      const refreshSuccess = await tryRefreshToken(cleanWaId, spreadsheetId);

      if (refreshSuccess) {
        logger.info(`Token refreshed successfully for ${cleanWaId}`);
        return {
          state: SessionState.EXPIRED_WITH_REFRESH,
          tokens: oAuth2Client.credentials,
          spreadsheetId,
          needsReauth: false,
        };
      } else {
        logger.warn(`Token refresh failed for ${cleanWaId}`);
        return {
          state: SessionState.REVOKED,
          spreadsheetId,
          needsReauth: true,
        };
      }
    } else {
      logger.warn(`Token expired and no refresh token for ${cleanWaId}`);
      return {
        state: SessionState.EXPIRED_NO_REFRESH,
        spreadsheetId,
        needsReauth: true,
      };
    }
  } catch (error) {
    logger.error(`Error checking session for ${waId}: ${error}`);
    return {
      state: SessionState.NO_SESSION,
      needsReauth: true,
    };
  }
};
export const canUserProceed = async (waId: string): Promise<boolean> => {
  const sessionCheck = await checkUserSession(waId);
  return !sessionCheck.needsReauth;
};

export const handleCreateNewSpreadsheet = async (
  waId: string,
  oAuth2Client: any
) => {
  try {
    // const oAuth2Client = getOAuthClientForUser(waId);
    const sheets = google.sheets({
      version: 'v4',
      auth: oAuth2Client,
    });
    const drive = google.drive({
      version: 'v3',
      auth: oAuth2Client,
    });

    const spreadsheet = await sheets.spreadsheets.create({
      requestBody: newSheetTemplate,
      fields: 'spreadsheetId',
    });
    const spreadsheetId = spreadsheet.data.spreadsheetId;
    logger.info(`Spreadsheet ID: ${spreadsheetId}`);

    await drive.files.update({
      fileId: spreadsheetId as string,
      requestBody: {
        appProperties: {
          bot_identifier: `whatsapp_bot_${waId}`,
        },
        copyRequiresWriterPermission: true,
        writersCanShare: false,
      },
    });

    return {
      message: 'Spreadsheet created successfully!',
      spreadsheetId: spreadsheet.data.spreadsheetId,
    };
  } catch (error) {
    logger.error(`The API returned an error: ${error}`);
    return {
      message: 'Error creating spreadsheet',
      spreadsheetId: null,
    };
  }
};

export const handleUserInfoUpdationInSpreadSheet = async (
  oAuth2Client: any,
  waId: string,
  spreadsheetId: string,
  tokens: any
) => {
  const { access_token, refresh_token, scope, token_type, expiry_date } =
    tokens;
  try {
    const sheets = google.sheets({
      version: 'v4',
      auth: oAuth2Client,
    });

    const combinedValue = JSON.stringify({
      spreadsheetId,
      access_token,
      refresh_token,
      scope,
      token_type,
      expiry_date,
    });

    const request: sheets_v4.Params$Resource$Spreadsheets$Values$Update = {
      spreadsheetId,
      range: 'User Profiles!A1',
      valueInputOption: 'RAW',
      requestBody: {
        values: [[combinedValue]],
      },
    };

    const response = await sheets.spreadsheets.values.update(request);
    logger.info(`Response from update for ${waId}: ${response.data}`);
    return {
      success: response.status,
      message: response.statusText,
    };
  } catch (error) {
    logger.error(`Error updating spreadsheet for ${waId}: ${error}`);
    return {
      success: false,
      message: `Error updating spreadsheet: ${error}`,
    };
  }
};

// Helper function to get sheets client for a user
export const getSheetsClientForUser = (waId: string) => {
  const oAuth2Client = getOAuthClientForUser(waId);
  return google.sheets({
    version: 'v4',
    auth: oAuth2Client,
  });
};

/**
 * Save bio data to Google Sheets
 * Now accepts spreadsheetId to save to the correct user's sheet
 */
export const saveBsData = async (
  bioData: any,
  spreadsheetId: string,
  waId: string
): Promise<boolean> => {
  try {
    logger.info(`Saving data to spreadsheet: ${spreadsheetId}`);
    const sheets = getSheetsClientForUser(waId);
    // Prepare the row data
    const rowData = [bioData.date, bioData.time, bioData.type, bioData.value];

    // Append to the sheet
    const response = await sheets.spreadsheets.values.append({
      spreadsheetId,
      range: 'Blood Sugar!A:D', // Adjust based on your sheet structure
      valueInputOption: 'USER_ENTERED',
      requestBody: {
        values: [rowData],
      },
    });

    logger.info(`Data saved successfully: ${response.status}`);
    return true;
  } catch (error) {
    logger.error(`Error saving data to sheet: ${error}`);
    throw error; // Re-throw to be handled by the caller
  }
};

/**
 * Save bio data to Google Sheets
 * Now accepts spreadsheetId to save to the correct user's sheet
 */
export const saveBpData = async (
  bioData: any,
  spreadsheetId: string,
  waId: string
): Promise<boolean> => {
  try {
    logger.info(`Saving data to spreadsheet: ${spreadsheetId}`);
    const sheets = getSheetsClientForUser(waId);
    // Prepare the row data
    const rowData = [
      bioData.date,
      bioData.time,
      bioData.systolic,
      bioData.diastolic,
      bioData.heartRate,
    ];

    // Append to the sheet
    const response = await sheets.spreadsheets.values.append({
      spreadsheetId,
      range: 'Blood Pressure!A:E', // Adjust based on your sheet structure
      valueInputOption: 'USER_ENTERED',
      requestBody: {
        values: [rowData],
      },
    });

    logger.info(`Data saved successfully: ${response.status}`);
    return true;
  } catch (error) {
    logger.error(`Error saving data to sheet: ${error}`);
    throw error; // Re-throw to be handled by the caller
  }
};
