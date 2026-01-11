import {
  HealthResult,
  ValidateObjectType,
  ValidateTheMessageResponse,
  WebHookOptions,
} from './types';
import logger from '@/utils/common/logger';
import { UserResponseType, BiometricValue, BloodSugarType } from './constants';
import 'dotenv/config';

/**
 * Verifies webhook subscription request from external services
 *
 * @param mode - The webhook mode, should be "subscribe" for verification
 * @param token - The verification token sent by the webhook provider
 * @param challenge - The challenge string that needs to be echoed back upon successful verification
 *
 * @returns {boolean}
 */
export const verifyWebhook = (
  mode: WebHookOptions,
  token: WebHookOptions
): boolean => {
  if (mode === 'subscribe' && token === process.env.WEBHOOK_VERIFY_TOKEN) {
    logger.info('Webhook verified successfully!');
    return true;
  } else {
    logger.error('Verification failed');
    return false;
  }
};

/**
 * Constructs the Facebook Graph API URL for sending messages.
 * @param phoneNumberId - The unique ID for the phone number provided by the Meta Business suite.
 * @param version - The Graph API version (defaults to 'v24.0').
 * @returns A fully qualified URL string for the messages endpoint.
 */
export const getGraphEndpointUrl = (
  phoneNumberId: string,
  version: string = process.env.WHATSAPP_API_VERSION || 'v24.0'
): string => {
  const baseUrl: string = `https://graph.facebook.com/${version}/${phoneNumberId}/`;
  const messageEndpoint: string = 'messages';
  return baseUrl + messageEndpoint;
};

const BS_REGEX =
  /^\s*(?:(?:fasting|fast|f|post(?:[-\s]?meal)?|p)\s+(\d{2,3})|(\d{2,3})\s+(?:fasting|fast|f|post(?:[-\s]?meal)?|p))\s*$/i;
const BP_REGEX =
  /^(?:\d{2,3}\s*\/\s*\d{2,3}(?:\s+\d{2,3})?|\d{2,3}\s+\d{2,3}\s*\/\s*\d{2,3})$/;
/**
 * Validates and classifies a biometric measurement message.
 *
 * This function examines an input string to determine if it contains a valid
 * blood sugar or blood pressure measurement based on predefined regex patterns.
 * It returns an object containing the original input value and its identified type.
 *
 * @param {string} input - The message string to validate and classify
 *
 * @returns {ValidateTheMessageResponse} An object containing:
 *   - value: The original input string
 *   - type: The classified biometric type (UserResponseType.BS for blood sugar,
 *           UserResponseType.BP for blood pressure, or UserResponseType.NONE if neither)
 */
export const validateTheMessage = (
  input: string
): ValidateTheMessageResponse => {
  const isBloodSugar = BS_REGEX.test(input);
  const isBloodPressure = BP_REGEX.test(input);
  let validatedObject: ValidateObjectType = {
    value: input,
    type: UserResponseType.NONE,
  };
  if (isBloodSugar) {
    validatedObject.type = UserResponseType.BS;
    return validatedObject;
  } else if (isBloodPressure) {
    validatedObject.type = UserResponseType.BP;
    return validatedObject;
  }
  return validatedObject;
};

/**
 * Formats a Date object into a string in DD-MM-YYYY format.
 *
 * @param {Date} date - The date to format
 * @returns {string} Formatted date string (e.g., "07-01-2026")
 */
const formatDate = (date: Date): string => {
  const d = String(date.getDate()).padStart(2, '0');
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const y = date.getFullYear();
  return `${d}-${m}-${y}`;
};

/**
 * Formats a Date object into a 12-hour time string with am/pm.
 *
 * @param {Date} date - The date to extract time from
 * @returns {string} Formatted time string (e.g., "2:30pm", "11:05am")
 */
const formatTime = (date: Date): string => {
  let h = date.getHours();
  const m = String(date.getMinutes()).padStart(2, '0');
  const ampm = h >= 12 ? 'pm' : 'am';
  h = h % 12 || 12;
  return `${h}:${m}${ampm}`;
};

/**
 * Parses biometric data input and returns structured health data.
 * Supports two formats:
 * - Blood Sugar: "120 f" or "f 120" (fasting/posting)
 * - Blood Pressure: "120/80 70" or "70 120/80" (BP + heart rate)
 *
 * @param {ValidateObjectType} message - Validated message object containing type and value
 * @returns {HealthResult} Parsed health data with current date/time
 */
export const parseBioDataInput = (
  message: ValidateObjectType
): HealthResult => {
  const text = message.value.split(' ');
  const bm_type = message.type;
  const now = new Date();
  const date = formatDate(now);
  const time = formatTime(now);

  if (bm_type === UserResponseType.BS) {
    const isFirstTokenNumeric = !isNaN(Number(text[0]));
    const typeToken = isFirstTokenNumeric ? text[1] : text[0];
    const valueToken = isFirstTokenNumeric ? text[0] : text[1];
    const type = typeToken.toLowerCase().startsWith('f')
      ? BloodSugarType.FASTING
      : BloodSugarType.POSTING;

    return {
      kind: BiometricValue.BLOOD_SUGAR,
      type,
      value: Number(valueToken),
      date,
      time,
    };
  }

  const isFirstTokenNumeric = !isNaN(Number(text[0]));
  const bpToken = isFirstTokenNumeric ? text[1] : text[0];
  const bpval = bpToken.split('/');
  const heartRateToken = isFirstTokenNumeric ? text[0] : text[1];

  return {
    kind: BiometricValue.BLOOD_PRESSURE,
    systolic: Number(bpval[0]),
    diastolic: Number(bpval[1]),
    heartRate: heartRateToken
      ? `${Number(heartRateToken)} bpm`
      : 'value not entered',
    date,
    time,
  };
};
