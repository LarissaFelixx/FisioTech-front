import { httpError, networkError } from '../../test/helpers';
import type { Paciente } from '../../types/paciente';
import { validarFormulario } from '../../utils/validation';
import {
  VALORES_VAZIOS,
  filtrarPacientes,
  mensagemErroExcluir,
  mensagemErroSalvar,
  montarAtualizacao,
  montarCriacao,
  schemaPaciente,
  valoresDoPaciente,
} from './pacienteLogic';

const paciente = (parcial: Partial<Paciente> = {}): Paciente => ({
  id: 1,
  nome: 'Maria Souza',
  email: 'maria@x.com',
  profissionalId: 9,
  profissionalNome: 'Dra. Ana',
  dataNascimento: null,
  sexo: null,
  profissao: null,
  telefone: null,
  endereco: null,
  bairro: null,
  foto: null,
  dataCriacao: '2026-09-01T10:00:00',
  ...parcial,
});

describe('filtrarPacientes', () => {
  const lista = [
    paciente({ id: 1, nome: 'Maria Souza', email: 'maria@x.com' }),
    paciente({ id: 2, nome: 'João Lima', email: 'jl@clinica.com' }),
  ];

  it('filtra por nome ou email, sem diferenciar maiúsculas', () => {
    expect(filtrarPacientes(lista, 'MARIA').map((p) => p.id)).toEqual([1]);
    expect(filtrarPacientes(lista, 'clinica').map((p) => p.id)).toEqual([2]);
    expect(filtrarPacientes(lista, 'zzz')).toEqual([]);
  });

  it('termo vazio ou só espaços devolve todos', () => {
    expect(filtrarPacientes(lista, '  ')).toHaveLength(2);
  });
});

describe('validação do formulário', () => {
  it('exige senha para cadastrar um paciente novo', () => {
    const erros = validarFormulario(
      { ...VALORES_VAZIOS, nome: 'Ana', email: 'ana@x.com' },
      schemaPaciente(false),
    );
    expect(erros).toEqual({ senha: 'Este campo é obrigatório.' });
  });

  it('não exige senha para salvar uma edição (regressão do F-01)', () => {
    const erros = validarFormulario(
      { ...VALORES_VAZIOS, nome: 'Ana', email: 'ana@x.com' },
      schemaPaciente(true),
    );
    expect(erros).toEqual({});
  });

  it('senha informada precisa ter 8+ caracteres; data precisa existir', () => {
    const erros = validarFormulario(
      {
        ...VALORES_VAZIOS,
        nome: 'Ana',
        email: 'ana@x.com',
        senha: '123',
        dataNascimento: '31/02/2000',
      },
      schemaPaciente(true),
    );
    expect(erros).toEqual({
      senha: 'Deve ter pelo menos 8 caracteres.',
      dataNascimento: 'Data inválida. Use DD/MM/AAAA.',
    });
  });

  it('nome e email obrigatórios, email válido e até 120 caracteres', () => {
    expect(
      validarFormulario({ ...VALORES_VAZIOS, senha: '12345678' }, schemaPaciente(false)),
    ).toEqual({
      nome: 'Este campo é obrigatório.',
      email: 'Este campo é obrigatório.',
    });
    expect(
      validarFormulario(
        { ...VALORES_VAZIOS, nome: 'x'.repeat(121), email: 'invalido', senha: '12345678' },
        schemaPaciente(false),
      ),
    ).toEqual({ nome: 'Deve ter no máximo 120 caracteres.', email: 'Email inválido.' });
  });
});

describe('montagem das requisições', () => {
  it('cadastro envia só nome, email e senha (é o que o backend aceita)', () => {
    expect(
      montarCriacao({
        ...VALORES_VAZIOS,
        nome: ' Ana ',
        email: ' ana@x.com ',
        senha: '12345678',
        bairro: 'Centro',
      }),
    ).toEqual({ nome: 'Ana', email: 'ana@x.com', senha: '12345678' });
  });

  it('edição envia senha null quando o campo fica em branco', () => {
    expect(
      montarAtualizacao({ ...VALORES_VAZIOS, nome: 'Ana', email: 'a@x.com', senha: '   ' }).senha,
    ).toBeNull();
  });

  it('edição envia a nova senha quando preenchida', () => {
    expect(
      montarAtualizacao({ ...VALORES_VAZIOS, nome: 'Ana', email: 'a@x.com', senha: 'nova-1234' })
        .senha,
    ).toBe('nova-1234');
  });

  it('edição converte a data para LocalDate e campos vazios para null', () => {
    expect(
      montarAtualizacao({
        ...VALORES_VAZIOS,
        nome: 'Ana',
        email: 'a@x.com',
        dataNascimento: '31/01/1990',
        sexo: 'Feminino',
        telefone: ' ',
        bairro: 'Centro',
      }),
    ).toEqual({
      nome: 'Ana',
      email: 'a@x.com',
      senha: null,
      dataNascimento: '1990-01-31',
      sexo: 'Feminino',
      profissao: null,
      telefone: null,
      endereco: null,
      bairro: 'Centro',
      foto: null,
    });
  });

  it('valoresDoPaciente preenche o formulário (data em DD/MM/AAAA, nulos como vazio)', () => {
    expect(
      valoresDoPaciente(paciente({ dataNascimento: '1990-01-31', sexo: 'Outro', bairro: null })),
    ).toMatchObject({
      nome: 'Maria Souza',
      email: 'maria@x.com',
      senha: '',
      dataNascimento: '31/01/1990',
      sexo: 'Outro',
      bairro: '',
    });
  });
});

describe('mensagens de erro', () => {
  it('salvar: 409 email duplicado, rede e genérica', () => {
    expect(mensagemErroSalvar(httpError(409))).toBe(
      'Já existe um paciente cadastrado com este email.',
    );
    expect(mensagemErroSalvar(networkError())).toMatch(/Sem conexão/);
    expect(mensagemErroSalvar(httpError(400))).toBe(
      'Não foi possível salvar. Confira os dados e tente novamente.',
    );
  });

  it('excluir: 409 (registros associados) tem mensagem específica', () => {
    expect(mensagemErroExcluir(httpError(409))).toBe(
      'Este paciente tem consultas ou mensagens e não pode ser excluído.',
    );
    expect(mensagemErroExcluir(httpError(500))).toBe('Não foi possível excluir o paciente.');
  });
});
