export interface WhatsAppMessage {
  connect_step?: string;
  messageBody?: string;
  from: string;
  waId: string;
}

export interface WhatsAppStatus {
  status: string;
  waId: string;
}

export interface WhatsAppWebhookBody {
  object: string;
  entry: Array<{
    changes: Array<{
      value: {
        messages?: Array<{
          from: string;
          id: string;
          text?: {
            body: string;
          };
          timestamp: number;
          type: string;
        }>;
        contacts?: Array<{
          wa_id: string;
        }>;
        statuses?: Array<any>;
      };
      field: string;
    }>;
  }>;
}

export interface WhatsAppMessageBodyAndId {
  from: string;
  id?: string;
  text?: {
    body: string;
  };
  interactive?: {
    type: string;
    [key: string]: any;
  };
  timestamp?: number;
  type?: string;
  waid: string;
}

export interface WhatsAppStatusBody {
  id: string;
  status: string;
  timestamp: number;
  recipient_id: string;
  recipient_logical_id: string;
  conversation: {
    id: string;
    expiration_timestamp: string;
    origin: {
      type: string;
    };
  };
  pricing: {
    billable: boolean;
    pricing_model: string;
    category: string;
    type: string;
  };
}

export interface TypeOfMessage {
  data: WhatsAppMessageBodyAndId | WhatsAppStatusBody;
  type: string;
}

export type BloodSugarResult = {
  kind: 'blood_sugar';
  type: 'Fasting' | 'Post-Meal';
  value: number;
  date: string;
  time: string;
};

export type BloodPressureResult = {
  kind: 'blood_pressure';
  systolic: number;
  diastolic: number;
  heartRate: number | string;
  date: string;
  time: string;
};
