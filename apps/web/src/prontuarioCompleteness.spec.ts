import { describe, expect, it } from 'vitest';
import type { Prontuario } from './api';
import {
  collectVitalErrors,
  isProntuarioComplete,
  missingProntuarioFields,
  parseRiskClassification,
  vitalFieldError,
} from './prontuarioCompleteness';

function baseProntuario(overrides: Partial<Prontuario> = {}): Prontuario {
  return {
    id: 'p1',
    atendimentoId: 'a1',
    patientId: 'pac1',
    queixa: 'dor de cabeça',
    anamnese: 'início há 2h',
    conduta: 'orientação',
    prescricao: '',
    complementoMedico: '',
    paSistolica: 120,
    paDiastolica: 80,
    fc: 70,
    temperatura: 36.5,
    spo2: 98,
    riskClassification: 'VERDE',
    adendos: [],
    ...overrides,
  };
}

describe('prontuarioCompleteness', () => {
  it('triagem completa para enfermeiro sem prescrição', () => {
    const prontuario = baseProntuario();
    expect(isProntuarioComplete(prontuario, 'ENFERMEIRO')).toBe(true);
    expect(missingProntuarioFields(prontuario, 'MEDICO')).toContain(
      'prescricao',
    );
  });

  it('marca vitais e textos faltantes', () => {
    const prontuario = baseProntuario({
      queixa: '  ',
      paSistolica: null,
      spo2: 30,
      riskClassification: null,
    });
    expect(missingProntuarioFields(prontuario, 'ENFERMEIRO')).toEqual(
      expect.arrayContaining([
        'queixa',
        'paSistolica',
        'spo2',
        'riskClassification',
      ]),
    );
    expect(collectVitalErrors(prontuario).spo2).toMatch(/mínimo/);
  });

  it('valida faixas e inteiros dos vitais', () => {
    expect(vitalFieldError('temperatura', 36.2)).toBeNull();
    expect(vitalFieldError('fc', 70.5)).toMatch(/inteiro/);
    expect(vitalFieldError('paSistolica', 400)).toMatch(/máximo/);
  });

  it('parseRiskClassification só aceita enum conhecido', () => {
    expect(parseRiskClassification('VERMELHO')).toBe('VERMELHO');
    expect(parseRiskClassification('roxo')).toBeNull();
  });
});
