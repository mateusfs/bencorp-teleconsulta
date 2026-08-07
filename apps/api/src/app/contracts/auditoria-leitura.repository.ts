export const AUDITORIA_LEITURA_REPOSITORY = Symbol(
  'AUDITORIA_LEITURA_REPOSITORY',
);

export type RegistrarLeituraInput = {
  prontuarioId: string;
  patientId: string;
  userId: string;
  endpoint: string;
};

export type AuditoriaLeitura = {
  id: string;
  prontuarioId: string;
  patientId: string;
  userId: string;
  endpoint: string;
  createdAt: Date;
};

export interface AuditoriaLeituraRepository {
  register(input: RegistrarLeituraInput): Promise<AuditoriaLeitura>;
  listByProntuario(prontuarioId: string): Promise<AuditoriaLeitura[]>;
}
