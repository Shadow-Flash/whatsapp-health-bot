import logger from '@/utils/common/logger';
import {
  getRegularMessage,
  getLinkMessage,
  getInteractiveMessage,
} from '@/utils/meta/template';
import { whatsappApiPost } from '@/utils/common/axios';
import {
  getGraphEndpointUrl,
  MessageType,
  StepType,
  UserResponseType,
  ConnectSteps,
  validateTheMessage,
  parseBioDataInput,
  BiometricValue,
} from '@/helper';
import {
  WhatsAppMessage,
  WhatsAppWebhookBody,
  WhatsAppMessageBodyAndId,
  TypeOfMessage,
  WhatsAppStatusBody,
  WhatsAppStatus,
} from './types';
import 'dotenv/config';
import { saveBpData, saveBsData } from '../google';

/**
 * First-time user or no session
 */
export const handleFirstTimeUser = async (from: string, waId: string) => {
  logger.info(`First-time user: ${waId}`);

  await sendRegularMessage(
    from,
    `🙏🏼 *Welcome !!*

_Please read below message:_

🔐 *Privacy Disclaimer*
Data is saved only on your Google Sheet.
There is no server storage.`
  );

  // Send connect button
  await sendLinkMessage(from, ConnectSteps.STARTED);
};

/**
 * Authenticated user - process their message
 */
export const handleAuthenticatedMessage = async (
  from: string,
  waId: string,
  messageBody: string | undefined,
  spreadsheetId: string
) => {
  logger.info(`Processing authenticated message for ${waId}`);

  // Validate the message format
  const validateMessage = validateTheMessage(messageBody!);

  if (
    validateMessage.type === UserResponseType.BS ||
    validateMessage.type === UserResponseType.BP
  ) {
    // Parse bio data and save to Google Sheets
    const bioData = parseBioDataInput(validateMessage);

    try {
      // Save to Google Sheets using the authenticated session
      if (bioData.kind === BiometricValue.BLOOD_SUGAR) {
        await saveBsData(bioData, spreadsheetId, waId); // Pass spreadsheetId
      } else {
        await saveBpData(bioData, spreadsheetId, waId); // Pass spreadsheetId
      }

      // Send confirmation
      await sendInteractiveMessage(
        from,
        StepType.S2,
        validateMessage.type,
        bioData
      );
      logger.info(`Data saved successfully for ${waId}`);
    } catch (error) {
      logger.error(`Error saving data for ${waId}: ${error}`);
      await sendRegularMessage(
        from,
        '❌ Failed to save data. Please try again.'
      );
    }
  } else {
    // Invalid format or other commands
    await sendInteractiveMessage(from, StepType.S1, validateMessage.type);
  }
};

/**
 * Session expired - ask user to reconnect
 */
export const handleExpiredSession = async (from: string, waId: string) => {
  logger.info(`Expired session for ${waId}`);

  await sendRegularMessage(
    from,
    '⚠️ Your session has expired. Please reconnect your Google Sheet.'
  );

  // Send reconnect button
  await sendLinkMessage(from, ConnectSteps.STARTED);
};

export const sendRegularMessage = async (
  to: string,
  message: string
): Promise<void> => {
  try {
    const url = getGraphEndpointUrl(process.env.PHONE_NUMBER_ID!);
    const payload = getRegularMessage(to, message);
    const response = await whatsappApiPost(url, payload);
    logger.info(`Regular message sent to ${to}: ${response}`);
  } catch (error) {
    logger.error(`Error sending message to ${to}: ${error}`);
    throw error;
  }
};

export const sendLinkMessage = async (
  to: string,
  type: string
): Promise<void> => {
  try {
    const url: string = getGraphEndpointUrl(process.env.PHONE_NUMBER_ID!);
    const state = Buffer.from(JSON.stringify(to)).toString('base64');
    const messageFn = getLinkMessage(to);
    const payload =
      messageFn[type as keyof ReturnType<typeof getLinkMessage>](state);
    const response = await whatsappApiPost<any, any>(url, payload);
    logger.info(`${JSON.stringify(response, null, 2)}`);
    return;
  } catch (error: any) {
    logger.error(`Error sending message: ${JSON.stringify(error, null, 2)}`);
    throw error;
  }
};

export const sendInteractiveMessage = async (
  to: string,
  step: string,
  type: string,
  data?: any
): Promise<void> => {
  try {
    const url: string = getGraphEndpointUrl(process.env.PHONE_NUMBER_ID!);
    const messages = getInteractiveMessage(to);
    const messageType = type as keyof typeof messages;
    const messageObj = messages[messageType];

    const payload =
      step === StepType.S1
        ? messageObj.step_one()
        : (messageObj as any).step_two(data);
    logger.info(JSON.stringify(payload, null, 2));
    const response = await whatsappApiPost<any, any>(url, payload);
    logger.info(`${JSON.stringify(response, null, 2)}`);
    return;
  } catch (error: any) {
    logger.error(`Error sending message: ${JSON.stringify(error, null, 2)}`);
    throw error;
  }
};

export const typeOfMessage = (body: WhatsAppWebhookBody): TypeOfMessage => {
  try {
    const change = body.entry[0].changes[0];
    if (change.field === 'messages') {
      const value = change.value;
      const wa_id = value.contacts?.[0]?.wa_id!; //doesn't come in statuses
      if (
        value.messages &&
        value.messages.length > 0 &&
        value.messages[0].type === 'text'
      ) {
        return {
          data: { ...value.messages[0], waid: wa_id },
          type: MessageType.RCM,
        };
      }
      if (
        value.messages &&
        value.messages.length > 0 &&
        value.messages[0].type === 'interactive'
      ) {
        return {
          data: { ...value.messages[0], waid: wa_id },
          type: MessageType.RIM,
        };
      }
      if (value.statuses && value.statuses.length > 0) {
        return {
          data: { ...value.statuses[0] },
          type: MessageType.MS,
        };
      }
    }
    throw new Error('Unkown field type');
  } catch (error) {
    logger.error(`Error determining message type: ${error}`);
    throw error;
  }
};

/**
 * Extract message details from WhatsApp webhook message body
 * @param data - The WhatsApp webhook message body
 * @returns {WhatsAppMessage} Object containing messageBody, from, and waId
 */
export const extractMessageDetails = (
  data: WhatsAppMessageBodyAndId
): WhatsAppMessage => {
  try {
    const messageBody =
      data!.type === 'text'
        ? data!.text?.body
        : data!.interactive![data.interactive!.type].id;
    const from = data!.from;
    const waId = data!.waid;
    return {
      messageBody,
      from,
      waId,
    };
  } catch (error) {
    logger.error(`Error extracting message details: ${error}`);
    throw error;
  }
};

/**
 * Extract status details from WhatsApp webhook status body
 * @param data - The WhatsApp webhook status body
 * @returns {WhatsAppStatus} Object containing status and waId
 */
export const extractStatusDetails = (
  data: WhatsAppStatusBody
): WhatsAppStatus => {
  try {
    const status = data.status;
    const waId = data.recipient_id;
    return {
      status,
      waId,
    };
  } catch (error) {
    logger.error(`Error extracting status details: ${error}`);
    throw error;
  }
};
