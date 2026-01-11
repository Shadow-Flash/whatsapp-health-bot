import app from '@/utils/common/express';
import {
  extractMessageDetails,
  extractStatusDetails,
  handleAuthenticatedMessage,
  handleExpiredSession,
  handleFirstTimeUser,
  sendInteractiveMessage,
  sendLinkMessage,
  sendRegularMessage,
  typeOfMessage,
} from '@/utils/meta';
import {
  ErrorType,
  verifyWebhook,
  MessageType,
  StepType,
  UserResponseType,
  Routes,
  ConnectSteps,
} from '@/helper';
import { checkUserSession } from '@/utils/google';
import { SessionState } from '@/utils/google/types';
import 'dotenv/config';
import logger from '@/utils/common/logger';
import {
  WhatsAppMessageBodyAndId,
  WhatsAppStatusBody,
} from '@/utils/meta/types';

app.get(Routes.WEBHOOK, (req, res) => {
  logger.info('Verification request received');
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];

  if (verifyWebhook(mode, token)) {
    res.status(200).send(challenge);
    return;
  }

  res.status(403).json(`${ErrorType.UNAUTHORIZED}: Verification failed`);
});

app.post(Routes.WEBHOOK, async (req, res) => {
  try {
    const body = req.body;
    const { data, type } = typeOfMessage(body);

    switch (type) {
      case MessageType.RCM:
        await handleRegularMessage(data as WhatsAppMessageBodyAndId);
        break;

      case MessageType.RIM:
        await handleInteractiveMessage(data as WhatsAppMessageBodyAndId);
        break;

      case MessageType.MS:
        await handleMessageStatus(data as WhatsAppStatusBody);
        break;

      default:
        logger.info('No actionable message type found.');
    }

    res.status(200).json('Data Received!');
  } catch (error) {
    logger.error(`Error processing webhook: ${error}`);
    res
      .status(400)
      .json(
        `${ErrorType.INTERNAL_SERVER_ERROR}: Error while processing webhook`
      );
  }
});

/**
 * Handle regular text messages
 * This is where session management kicks in
 */
const handleRegularMessage = async (data: WhatsAppMessageBodyAndId) => {
  const { messageBody, from, waId } = extractMessageDetails(data);
  logger.info(`WhatsApp ID ${waId} message received: ${messageBody}`);
  let sessionCheck = { state: SessionState.NO_SESSION };
  // STEP 1: Check user session before processing
  if (messageBody !== 'Hi') {
    sessionCheck = await checkUserSession(waId);

    logger.info(`Session state for ${waId}: ${sessionCheck.state}`);
  }

  // STEP 2: Handle based on session state
  switch (sessionCheck.state) {
    case SessionState.NO_SESSION:
      // First-time user - ask them to connect
      await handleFirstTimeUser(from, waId);
      break;
    case SessionState.VALID:
    case SessionState.EXPIRED_WITH_REFRESH:
      // User authenticated - process their message normally
      await handleAuthenticatedMessage(
        from,
        waId,
        messageBody,
        sessionCheck.spreadsheetId!
      );
      break;

    case SessionState.EXPIRED_NO_REFRESH:
    case SessionState.REVOKED:
      // Session expired - ask them to reconnect
      await handleExpiredSession(from, waId);
      break;

    default:
      logger.error(`Unknown session state: ${sessionCheck.state}`);
      await handleExpiredSession(from, waId);
  }
};

/**
 * Handle interactive button/list messages
 */
const handleInteractiveMessage = async (data: WhatsAppMessageBodyAndId) => {
  const { messageBody, from, waId, connect_step } = extractMessageDetails(data);
  logger.info(
    `WhatsApp ID ${waId} interactive message received: ${messageBody}`
  );

  // For other interactive messages, check session
  const sessionCheck = await checkUserSession(waId);

  switch (sessionCheck.state) {
    case SessionState.NO_SESSION:
    case SessionState.EXPIRED_NO_REFRESH:
    case SessionState.REVOKED:
      // Need to connect first
      await sendRegularMessage(
        from,
        '⚠️ Please connect your Google Sheet first before using this feature.'
      );
      await sendLinkMessage(from, ConnectSteps.STARTED);
      break;

    case SessionState.VALID:
    case SessionState.EXPIRED_WITH_REFRESH:
      // Process interactive message
      if (messageBody === UserResponseType.BS) {
        await sendInteractiveMessage(from, StepType.S1, UserResponseType.BS);
      } else if (messageBody === UserResponseType.BP) {
        await sendInteractiveMessage(from, StepType.S1, UserResponseType.BP);
      } else {
        await sendInteractiveMessage(from, StepType.S1, UserResponseType.NONE);
      }
      break;
  }
};

/**
 * Handle message status updates (delivered, read, etc.)
 */
const handleMessageStatus = async (data: WhatsAppStatusBody) => {
  const { status, waId } = extractStatusDetails(data);
  logger.info(`WhatsApp ID ${waId} status received: ${status}`);
  // Add any status tracking logic here if needed
};
