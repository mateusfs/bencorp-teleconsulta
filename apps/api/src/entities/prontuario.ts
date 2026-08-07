import { ClassificacaoRisco } from '@/entities/atendimento';

export type ProntuarioAdendo = {
  id: string;
  prontuarioId: string;
  authorId: string;
  texto: string;
  createdAt: Date;
};

export type Prontuario = {
  id: string;
  atendimentoId: string;
  patientId: string;
  queixa: string;
  anamnese: string;
  conduta: string;
  prescricao: string;
  complementoMedico: string;
  paSistolica: number | null;
  paDiastolica: number | null;
  fc: number | null;
  temperatura: number | null;
  spo2: number | null;
  riskClassification: ClassificacaoRisco | null;
  createdAt: Date;
  updatedAt: Date;
  adendos: ProntuarioAdendo[];
};

export type AtualizarProntuarioInput = {
  queixa?: string;
  anamnese?: string;
  conduta?: string;
  prescricao?: string;
  complementoMedico?: string;
  paSistolica?: number | null;
  paDiastolica?: number | null;
  fc?: number | null;
  temperatura?: number | null;
  spo2?: number | null;
  riskClassification?: ClassificacaoRisco | null;
};
