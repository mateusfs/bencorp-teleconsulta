import { randomUUID } from 'node:crypto';
import {
  AuditoriaLeitura,
  AuditoriaLeituraRepository,
  RegistrarLeituraInput,
} from '@/app/contracts/auditoria-leitura.repository';
import {
  CreateProntuarioInput,
  ProntuarioRepository,
} from '@/app/contracts/prontuario.repository';
import {
  AtualizarProntuarioInput,
  Prontuario,
  ProntuarioAdendo,
} from '@/entities/prontuario';

export class InMemoryProntuarioRepository implements ProntuarioRepository {
  private readonly items = new Map<string, Prontuario>();
  private readonly byAtendimento = new Map<string, string>();

  seed(prontuario: Prontuario): void {
    this.items.set(prontuario.id, {
      ...prontuario,
      adendos: [...prontuario.adendos],
    });
    this.byAtendimento.set(prontuario.atendimentoId, prontuario.id);
  }

  findById(id: string): Promise<Prontuario | null> {
    const item = this.items.get(id);
    return Promise.resolve(item ? this.clone(item) : null);
  }

  findByAtendimentoId(atendimentoId: string): Promise<Prontuario | null> {
    const id = this.byAtendimento.get(atendimentoId);
    if (!id) return Promise.resolve(null);
    return this.findById(id);
  }

  create(input: CreateProntuarioInput): Promise<Prontuario> {
    const now = new Date();
    const prontuario: Prontuario = {
      id: randomUUID(),
      atendimentoId: input.atendimentoId,
      patientId: input.patientId,
      queixa: '',
      anamnese: '',
      conduta: '',
      prescricao: '',
      complementoMedico: '',
      paSistolica: null,
      paDiastolica: null,
      fc: null,
      temperatura: null,
      spo2: null,
      riskClassification: input.riskClassification ?? null,
      createdAt: now,
      updatedAt: now,
      adendos: [],
    };
    this.seed(prontuario);
    return Promise.resolve(this.clone(prontuario));
  }

  update(id: string, input: AtualizarProntuarioInput): Promise<Prontuario> {
    const item = this.items.get(id)!;
    Object.assign(item, input, { updatedAt: new Date() });
    return Promise.resolve(this.clone(item));
  }

  addAdendo(
    prontuarioId: string,
    authorId: string,
    texto: string,
  ): Promise<ProntuarioAdendo> {
    const item = this.items.get(prontuarioId)!;
    const adendo: ProntuarioAdendo = {
      id: randomUUID(),
      prontuarioId,
      authorId,
      texto,
      createdAt: new Date(),
    };
    item.adendos.push(adendo);
    return Promise.resolve({ ...adendo });
  }

  setPatientId(prontuarioId: string, patientId: string): void {
    const item = this.items.get(prontuarioId);
    if (item) item.patientId = patientId;
  }

  private clone(item: Prontuario): Prontuario {
    return { ...item, adendos: item.adendos.map((a) => ({ ...a })) };
  }
}

export class InMemoryAuditoriaLeituraRepository implements AuditoriaLeituraRepository {
  readonly rows: AuditoriaLeitura[] = [];

  register(input: RegistrarLeituraInput): Promise<AuditoriaLeitura> {
    const row: AuditoriaLeitura = {
      id: randomUUID(),
      ...input,
      createdAt: new Date(),
    };
    this.rows.push(row);
    return Promise.resolve({ ...row });
  }

  listByProntuario(prontuarioId: string): Promise<AuditoriaLeitura[]> {
    return Promise.resolve(
      this.rows.filter((row) => row.prontuarioId === prontuarioId),
    );
  }
}
