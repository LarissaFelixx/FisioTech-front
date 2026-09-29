import { avatarTint } from './avatarTint';
import { formatDiaMesCurto, formatHora, mesmoDia, parseDataHora } from './date';
import { iniciais } from './iniciais';
import {
  MENSAGENS,
  email,
  maximo,
  minimo,
  obrigatorio,
  validar,
  validarFormulario,
} from './validation';

describe('iniciais', () => {
  it('pega as iniciais das duas primeiras palavras, em maiúsculas', () => {
    expect(iniciais('maria da silva')).toBe('MD');
    expect(iniciais('  Ana  ')).toBe('A');
  });

  it('retorna vazio para nome ausente', () => {
    expect(iniciais('')).toBe('');
    expect(iniciais(undefined)).toBe('');
    expect(iniciais(null)).toBe('');
  });
});

describe('avatarTint', () => {
  it('é estável para o mesmo nome e usa só as 4 cores do tema', () => {
    expect(avatarTint('Maria Souza')).toBe(avatarTint('Maria Souza'));
    const cores = new Set(['Ana', 'Bruno', 'Carla', 'Diego', 'Eva', 'Fabio'].map(avatarTint));
    for (const cor of cores) {
      expect(['blue', 'orange', 'green', 'purple']).toContain(cor);
    }
  });

  it('reproduz o hash do Angular (hash * 31 + charCode, módulo 4)', () => {
    // 'a' = 97 → 97 % 4 = 1 → orange; '' → 0 → blue
    expect(avatarTint('a')).toBe('orange');
    expect(avatarTint('')).toBe('blue');
  });
});

describe('datas', () => {
  it('lê LocalDateTime do backend como hora local', () => {
    const d = parseDataHora('2026-09-29T14:05:30');
    expect([d.getFullYear(), d.getMonth(), d.getDate(), d.getHours(), d.getMinutes()]).toEqual([
      2026, 8, 29, 14, 5,
    ]);
    expect(parseDataHora('2026-09-29T14:05:30.123').getSeconds()).toBe(30);
    expect(parseDataHora('2026-09-29').getHours()).toBe(0);
  });

  it('formata hora como HH:mm e dia/mês curto em pt-BR', () => {
    expect(formatHora(new Date(2026, 8, 5, 7, 3))).toBe('07:03');
    expect(formatDiaMesCurto(new Date(2026, 8, 5))).toBe('05 de set.');
    expect(formatDiaMesCurto(new Date(2026, 0, 31))).toBe('31 de jan.');
  });

  it('compara o mesmo dia ignorando o horário', () => {
    expect(mesmoDia(new Date(2026, 8, 29, 0, 0), new Date(2026, 8, 29, 23, 59))).toBe(true);
    expect(mesmoDia(new Date(2026, 8, 29), new Date(2026, 8, 30))).toBe(false);
  });
});

describe('validação (mesmas mensagens de field-error.ts)', () => {
  it('obrigatório considera vazio e só espaços', () => {
    expect(obrigatorio('')).toBe(MENSAGENS.obrigatorio);
    expect(obrigatorio('   ')).toBe('Este campo é obrigatório.');
    expect(obrigatorio('x')).toBeNull();
  });

  it('email usa a regra do Angular e ignora valor vazio', () => {
    expect(email('')).toBeNull();
    expect(email('pessoa@clinica.com')).toBeNull();
    expect(email('pessoa@clinica')).toBeNull(); // Angular também aceita domínio sem ponto
    expect(email('pessoa')).toBe('Email inválido.');
    expect(email('pessoa @x.com')).toBe('Email inválido.');
  });

  it('mínimo e máximo informam o limite', () => {
    expect(minimo(8)('1234567')).toBe('Deve ter pelo menos 8 caracteres.');
    expect(minimo(8)('')).toBeNull();
    expect(minimo(8)('12345678')).toBeNull();
    expect(maximo(3)('abcd')).toBe('Deve ter no máximo 3 caracteres.');
    expect(maximo(3)('abc')).toBeNull();
  });

  it('validar devolve o primeiro erro na ordem das regras', () => {
    expect(validar('', [obrigatorio, email])).toBe(MENSAGENS.obrigatorio);
    expect(validar('x', [obrigatorio, email])).toBe(MENSAGENS.email);
    expect(validar('a@b.com', [obrigatorio, email])).toBeNull();
  });

  it('validarFormulario devolve só os campos com erro', () => {
    expect(
      validarFormulario(
        { email: 'a@b.com', senha: '' },
        { email: [obrigatorio, email], senha: [obrigatorio] },
      ),
    ).toEqual({ senha: MENSAGENS.obrigatorio });
  });
});
