import { BloodPressureResult, BloodSugarResult } from './types';
import 'dotenv/config';

export const getRegularMessage = (
  to_num: string = process.env.TESTING_NUMBER!,
  text: string
) => {
  return {
    messaging_product: 'whatsapp',
    recipient_type: 'individual',
    to: to_num,
    type: 'text',
    text: {
      body: text,
    },
  };
};

export const stepOneMessage = (
  to_num: string = process.env.TESTING_NUMBER!
) => {
  return {
    messaging_product: 'whatsapp',
    recipient_type: 'individual',
    to: to_num,
    type: 'interactive',
    interactive: {
      type: 'button',
      header: {
        type: 'text',
        text: '🩺 Health Check-In',
      },
      body: {
        text: `Hi there! 👋\n\nWhat would you like to record today?`,
      },
      footer: {
        text: 'Please choose one option',
      },
      action: {
        buttons: [
          {
            type: 'reply',
            reply: {
              id: 'bp',
              title: '🫀 Blood Pressure',
            },
          },
          {
            type: 'reply',
            reply: {
              id: 'bs',
              title: '🩸 Blood Sugar',
            },
          },
        ],
      },
    },
  };
};

const createWhatsAppMessage = (
  to_num: string,
  header: string,
  bodyText: string,
  footer: string,
  button: Array<object>
) => ({
  messaging_product: 'whatsapp',
  recipient_type: 'individual',
  to: to_num,
  type: 'interactive',
  interactive: {
    type: 'button',
    header: { type: 'text', text: header },
    body: { text: bodyText },
    footer: { text: footer },
    action: {
      buttons: button,
    },
  },
});

export const getInteractiveMessage = (
  to_num: string = process.env.TESTING_NUMBER!
) => ({
  none: {
    step_one: () =>
      createWhatsAppMessage(
        to_num,
        '🩺 Health Check-In',
        'Hi there! 👋\n\nWhat would you like to record today?',
        '*Please choose one option*',
        [
          {
            type: 'reply',
            reply: {
              id: 'bp',
              title: '🫀 Blood Pressure',
            },
          },
          {
            type: 'reply',
            reply: {
              id: 'bs',
              title: '🩸 Blood Sugar',
            },
          },
        ]
      ),
  },
  bs: {
    step_one: () =>
      createWhatsAppMessage(
        to_num,
        '🩸 Blood Sugar Selected',
        'Please reply in this format:\n• *Type:* Fasting (F) / Post-Meal (P)\n• *Value:* mg/dL',
        '✨ Example: *F 95*',
        [
          {
            type: 'reply',
            reply: {
              id: 'none',
              title: 'Go Back',
            },
          },
        ]
      ),
    step_two: (data: BloodSugarResult) =>
      createWhatsAppMessage(
        to_num,
        `✅ Got it! Here's what I have received:`,
        `🩸 *Type:* ${data.type}\n📊 *Value:* ${data.value} mg/dL\n📅 *Date:* ${data.date}\n⏰ *Time:* ${data.time}`,
        '*Your reading is saved successfully.*',
        [
          {
            type: 'reply',
            reply: {
              id: 'none',
              title: 'Start Again',
            },
          },
        ]
      ),
  },
  bp: {
    step_one: () =>
      createWhatsAppMessage(
        to_num,
        '🫀 Blood Pressure Selected',
        'Please reply in this format:\n• *BP:* Systolic/Diastolic (mmHg)\n• *HR:* Beats per minute',
        '✨ Example: *120/80 72*',
        [
          {
            type: 'reply',
            reply: {
              id: 'none',
              title: 'Go Back',
            },
          },
        ]
      ),
    step_two: (data: BloodPressureResult) =>
      createWhatsAppMessage(
        to_num,
        `✅ Got it! Here's what I have received:`,
        `🫀 *Blood Pressure:* ${data.systolic}/${data.diastolic} mmHg\n📊 *Heart Rate:* ${data.heartRate} bpm\n📅 *Date:* ${data.date}\n⏰ *Time:* ${data.time}`,
        '*Your reading is saved successfully.*',
        [
          {
            type: 'reply',
            reply: {
              id: 'none',
              title: 'Start Again',
            },
          },
        ]
      ),
  },
});

export const getLinkMessage = (
  to_num: string = process.env.TESTING_NUMBER!
) => ({
  auth_started: (state: string) => ({
    messaging_product: 'whatsapp',
    recipient_type: 'individual',
    to: to_num,
    type: 'interactive',
    interactive: {
      type: 'cta_url',
      body: {
        text: 'Please connect your Google account to continue.',
      },
      action: {
        name: 'cta_url',
        parameters: {
          display_text: 'Continue',
          url: `https://genaro-unfauceted-compunctiously.ngrok-free.dev/auth/:${state}`,
        },
      },
    },
  }),
  auth_finished: () => ({
    messaging_product: 'whatsapp',
    recipient_type: 'individual',
    to: to_num,
    type: 'interactive',
    interactive: {
      type: 'button',
      body: {
        text: '✅ Account connected successfully!\nTap Start to continue.',
      },
      action: {
        buttons: [
          {
            type: 'reply',
            reply: {
              id: 'none',
              title: 'Start',
            },
          },
        ],
      },
    },
  }),
  auth_failed: (state: string) => ({
    messaging_product: 'whatsapp',
    recipient_type: 'individual',
    to: to_num,
    type: 'interactive',
    interactive: {
      type: 'cta_url',
      body: {
        text: '⚠️ Hmm… we couldn’t complete the connection.\nPlease try connecting again to continue.',
      },
      action: {
        name: 'cta_url',
        parameters: {
          display_text: 'Retry Connection',
          url: `https://genaro-unfauceted-compunctiously.ngrok-free.dev/auth/:${state}`,
        },
      },
    },
  }),
});
