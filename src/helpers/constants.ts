export const WHATSAPP_BUSINESS_ACCOUNT = 'whatsapp_business_account';
export const MessageType = {
  RCM: 'recieve_text_message',
  RIM: 'recieve_interactive_message',
  SRM: 'send_regular_message',
  SIM: 'send_interactive_message',
  MS: 'message_status',
  NONE: 'none',
} as const;

export const StepType = {
  S1: 'step_one',
  S2: 'step_two',
  S3: 'step_three',
  NONE: 'none',
} as const;

export const UserResponseType = {
  BS: 'bs',
  BP: 'bp',
  CONNECT: 'connect',
  NONE: 'none',
} as const;

export const ConnectSteps = {
  STARTED: 'auth_started',
  FINISHED: 'auth_finished',
  FAILED: 'auth_failed',
} as const;

export const BiometricValue = {
  BLOOD_SUGAR: 'blood_sugar',
  BLOOD_PRESSURE: 'blood_pressure',
  NONE: 'none',
} as const;

export const BloodSugarType = {
  FASTING: 'Fasting',
  POSTING: 'Post-Meal',
} as const;

export const Routes = {
  AUTH: '/auth/:state',
  OAUTH2CALLBACK: '/oauth2callback',
  WEBHOOK: '/webhook',
} as const;
