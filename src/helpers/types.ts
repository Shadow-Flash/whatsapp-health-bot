export type WebHookOptions =
  | string
  | Record<string, any>
  | (string | Record<string, any>)[]
  | undefined;

export enum ErrorType {
  BAD_REQUEST = 'BAD_REQUEST',
  UNAUTHORIZED = 'UNAUTHORIZED',
  FORBIDDEN = 'FORBIDDEN',
  NOT_FOUND = 'NOT_FOUND',
  CONFLICT = 'CONFLICT',
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  RATE_LIMIT_EXCEEDED = 'RATE_LIMIT_EXCEEDED',
  INTERNAL_SERVER_ERROR = 'INTERNAL_SERVER_ERROR',
  SERVICE_UNAVAILABLE = 'SERVICE_UNAVAILABLE',
}

export type ValidateObjectType = {
  value: string;
  type: string;
};

export type ValidateTheMessageResponse = ValidateObjectType;

type BloodSugarResult = {
  kind: 'blood_sugar';
  type: 'Fasting' | 'Post-Meal';
  value: number;
  date: string;
  time: string;
};

type BloodPressureResult = {
  kind: 'blood_pressure';
  systolic: number;
  diastolic: number;
  heartRate: number | string;
  date: string;
  time: string;
};

export type HealthResult = BloodSugarResult | BloodPressureResult;
