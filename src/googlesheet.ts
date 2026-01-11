import app from '@/utils/common/express';
import {
  handleCreateNewSpreadsheet,
  handleUserInfoUpdationInSpreadSheet,
} from '@/utils/google';
import oAuthClient from '@/utils/google/oAuth';
import { sendLinkMessage } from '@/utils/meta';
import logger from '@/utils/common/logger';
import 'dotenv/config';
import type { Request, Response } from 'express';
import { ConnectSteps, Routes } from '@/helper';

app.get(Routes.AUTH, (req: Request, res: Response) => {
  const { state } = req.params;
  logger.info({ state });
  const waId = Buffer.from(state, 'base64')
    .toString('utf-8')
    .replace(/['"\\]/g, '');
  const oAuth2Client = oAuthClient.getOAuthClientForUser(waId);
  const authUrl = oAuth2Client.generateAuthUrl({
    access_type: 'offline',
    prompt: 'consent',
    scope: process.env.SCOPES_GOOGLE_API,
    state, // have to do some hashing rather than buffer
  });
  res.redirect(authUrl);
});

app.get(Routes.OAUTH2CALLBACK, async (req: Request, res: Response) => {
  const { code, state } = req.query;
  const from = Buffer.from(state as string, 'base64')
    .toString('utf-8')
    .replace(/['"\\]/g, '');
  const oAuth2Client = oAuthClient.getOAuthClientForUser(from);
  if (!code) {
    res.status(400).send('Authorization code is missing.');
    return await sendLinkMessage(from, ConnectSteps.FAILED);
  }
  try {
    const { tokens } = await oAuth2Client.getToken(code as string);
    oAuth2Client.setCredentials(tokens);
    const cleanWaId = from.replace(/['"]/g, '');
    const { spreadsheetId } = await handleCreateNewSpreadsheet(
      cleanWaId,
      oAuth2Client
    );

    if (!spreadsheetId) {
      res.status(500).send('Failed to create spreadsheet.');
      return await sendLinkMessage(from, ConnectSteps.FAILED);
    }

    const updateToken = await handleUserInfoUpdationInSpreadSheet(
      oAuth2Client,
      cleanWaId,
      spreadsheetId,
      tokens
    );

    if (!updateToken.success) {
      res.status(500).send(`Failed to update tokens: ${updateToken.message}`);
      return await sendLinkMessage(from, ConnectSteps.FAILED);
    }

    res.status(200).send({
      message: 'Authentication successful! You can close this window.',
    });
    await sendLinkMessage(from, ConnectSteps.FINISHED);
  } catch (error) {
    logger.error(`OAuth callback error: ${error}`);
    res.status(500).send({
      message: 'Authentication failed! Please retry again.',
    });
    return await sendLinkMessage(from, ConnectSteps.FAILED);
  }
});
