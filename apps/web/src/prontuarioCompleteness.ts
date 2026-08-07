import type { ClassificacaoRisco, Prontuario, UserRole } from './api';

export type ProntuarioFieldKey =
  | 'queixa'
  | 'anamnese'
  | 'conduta'
  | 'paSistolica'
  | 'paDiastolica'
  | 'fc'
  | 'temperatura'
  | 'spo2'
  | 'riskClassification'
  | 'prescricao';

const FIELD_LABELS: Record<ProntuarioFieldKey, string> = {
  queixa: 'Queixa',
  anamnese: 'Anamnese',
  conduta: 'Conduta',
  paSistolica: 'PA sistólica',
  paDiastolica: 'PA diastólica',
  fc: 'Frequência cardíaca',
  temperatura: 'Temperatura',
  spo2: 'SpO₂',
  riskClassification: 'Classificação de risco',
  prescricao: 'Prescrição',
};

const TRIAGEM_REQUIRED: ProntuarioFieldKey[] = [
  'queixa',
  'anamnese',
  'conduta',
  'paSistolica',
  'paDiastolica',
  'fc',
  'temperatura',
  'spo2',
  'riskClassification',
];

export const VITAL_RANGES = {
  paSistolica: { min: 50, max: 300, label: 'PA sistólica' },
  paDiastolica: { min: 20, max: 200, label: 'PA diastólica' },
  fc: { min: 20, max: 250, label: 'FC' },
  temperatura: { min: 30, max: 45, label: 'Temperatura' },
  spo2: { min: 50, max: 100, label: 'SpO₂' },
} as const;

export type VitalFieldKey = keyof typeof VITAL_RANGES;

function isFilledText(value: string): boolean {
  return value.trim().length > 0;
}

export function vitalFieldError(
  key: VitalFieldKey,
  value: number | null,
): string | null {
  const range = VITAL_RANGES[key];
  if (value === null || !Number.isFinite(value)) {
    return `${range.label} é obrigatório`;
  }
  if (value < range.min) {
    return `${range.label} deve ser no mínimo ${range.min}`;
  }
  if (value > range.max) {
    return `${range.label} deve ser no máximo ${range.max}`;
  }
  if (key !== 'temperatura' && !Number.isInteger(value)) {
    return `${range.label} deve ser um número inteiro`;
  }
  return null;
}

export function collectVitalErrors(
  prontuario: Prontuario,
): Partial<Record<VitalFieldKey, string>> {
  const errors: Partial<Record<VitalFieldKey, string>> = {};
  (Object.keys(VITAL_RANGES) as VitalFieldKey[]).forEach((key) => {
    const message = vitalFieldError(key, prontuario[key]);
    if (message) {
      errors[key] = message;
    }
  });
  return errors;
}

export function missingProntuarioFields(
  prontuario: Prontuario,
  role: UserRole,
): ProntuarioFieldKey[] {
  const missing: ProntuarioFieldKey[] = [];

  for (const key of TRIAGEM_REQUIRED) {
    switch (key) {
      case 'queixa':
      case 'anamnese':
      case 'conduta':
        if (!isFilledText(prontuario[key])) missing.push(key);
        break;
      case 'paSistolica':
      case 'paDiastolica':
      case 'fc':
      case 'temperatura':
      case 'spo2':
        if (vitalFieldError(key, prontuario[key])) missing.push(key);
        break;
      case 'riskClassification':
        if (!prontuario.riskClassification) missing.push(key);
        break;
      default:
        break;
    }
  }

  if (role === 'MEDICO' && !isFilledText(prontuario.prescricao)) {
    missing.push('prescricao');
  }

  return missing;
}

export function isProntuarioComplete(
  prontuario: Prontuario,
  role: UserRole,
): boolean {
  return missingProntuarioFields(prontuario, role).length === 0;
}

export function labelForProntuarioField(key: ProntuarioFieldKey): string {
  return FIELD_LABELS[key];
}

export function parseRiskClassification(
  value: string,
): ClassificacaoRisco | null {
  if (
    value === 'VERMELHO' ||
    value === 'LARANJA' ||
    value === 'AMARELO' ||
    value === 'VERDE' ||
    value === 'AZUL'
  ) {
    return value;
  }
  return null;
}

export function parseApiFieldErrors(
  message: string,
): Partial<Record<VitalFieldKey, string>> {
  const errors: Partial<Record<VitalFieldKey, string>> = {};
  const parts = message.split(',').map((part) => part.trim());
  for (const part of parts) {
    const key = (Object.keys(VITAL_RANGES) as VitalFieldKey[]).find((field) =>
      part.toLowerCase().startsWith(field.toLowerCase()),
    );
    if (!key) continue;
    const range = VITAL_RANGES[key];
    if (part.includes('greater than') || part.includes('não deve ser maior')) {
      errors[key] = `${range.label} deve ser no máximo ${range.max}`;
    } else if (part.includes('less than') || part.includes('não deve ser menor')) {
      errors[key] = `${range.label} deve ser no mínimo ${range.min}`;
    } else {
      errors[key] = `${range.label} inválido`;
    }
  }
  return errors;
}

export function toVitalPayload(prontuario: Prontuario): {
  paSistolica: number;
  paDiastolica: number;
  fc: number;
  temperatura: number;
  spo2: number;
} {
  return {
    paSistolica: Math.round(Number(prontuario.paSistolica)),
    paDiastolica: Math.round(Number(prontuario.paDiastolica)),
    fc: Math.round(Number(prontuario.fc)),
    temperatura: Number(Number(prontuario.temperatura).toFixed(1)),
    spo2: Math.round(Number(prontuario.spo2)),
  };
}
