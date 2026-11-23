import type { Paciente } from '../../../types/paciente';
import type { Profissional } from '../../../types/profissional';
import { validarFormulario } from '../../../utils/validation';
import {
  correcoesPacienteAdmin,
  montarAtualizacaoPacienteAdmin,
  schemaPacienteAdmin,
  valoresPacienteAdmin,
} from './pacienteAdminLogic';

const paciente = { nome: 'João', email: 'joao@exemplo.com', profissionalId: 7 } as Paciente;
const profissionais = [{ id: 7 }] as Profissional[];

describe('contrato da edição administrativa de pacientes', () => {
  it('inicia sem senha e representa ausência de responsável como campo vazio', () => {
    expect(valoresPacienteAdmin({ ...paciente, profissionalId: null })).toEqual({
      nome: 'João',
      email: 'joao@exemplo.com',
      senha: '',
      profissionalId: '',
    });
  });

  it('envia somente os campos aceitos e preserva espaços de uma senha não vazia', () => {
    expect(
      montarAtualizacaoPacienteAdmin({
        nome: ' João ',
        email: ' joao@exemplo.com ',
        senha: ' senha-nova ',
        profissionalId: '7',
      }),
    ).toEqual({
      nome: 'João',
      email: 'joao@exemplo.com',
      senha: ' senha-nova ',
      profissionalId: 7,
    });
    expect(
      montarAtualizacaoPacienteAdmin({ ...valoresPacienteAdmin(paciente), senha: '  ' }).senha,
    ).toBeNull();
  });

  it.each(['0', '-1', '1.5', 'NaN', '999', '7x'])(
    'rejeita o responsável inválido ou indisponível %s',
    (profissionalId) => {
      expect(
        validarFormulario(
          { ...valoresPacienteAdmin(paciente), profissionalId },
          schemaPacienteAdmin(profissionais),
        ).profissionalId,
      ).toBeTruthy();
    },
  );

  it('aplica limites de tamanho do contrato e aceita senha vazia na edição', () => {
    expect(
      validarFormulario(valoresPacienteAdmin(paciente), schemaPacienteAdmin(profissionais)),
    ).toEqual({});
    const erros = validarFormulario(
      { ...valoresPacienteAdmin(paciente), nome: 'a'.repeat(121), senha: 's'.repeat(101) },
      schemaPacienteAdmin(profissionais),
    );
    expect(erros.nome).toBeTruthy();
    expect(erros.senha).toBeTruthy();
  });

  it('identifica correções sensíveis sem expor segredos', () => {
    expect(
      correcoesPacienteAdmin(paciente, { ...valoresPacienteAdmin(paciente), nome: 'Outro nome' }),
    ).toEqual([]);
    expect(
      correcoesPacienteAdmin(paciente, {
        nome: 'João',
        email: 'outro@exemplo.com',
        senha: 'nova-senha',
        profissionalId: '8',
      }),
    ).toEqual(['email de acesso', 'senha de acesso', 'profissional responsável']);
  });
});
