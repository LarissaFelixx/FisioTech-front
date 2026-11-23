import {
  calcularRolagem,
  FOLGA_BASE,
  FOLGA_TOPO,
  sobreposicaoTeclado,
  topoDoTeclado,
} from './tecladoLogic';

describe('calcularRolagem', () => {
  it('não rola quando o campo, com as folgas, já está inteiro à vista', () => {
    expect(
      calcularRolagem({ campoTopo: 100, campoAltura: 48, rolagemAtual: 0, alturaVisivel: 400 }),
    ).toBeNull();
  });

  it('sobe o conteúdo até o campo coberto pelo teclado ficar acima dele, com folga', () => {
    // Campo de 48 a 550px do topo visível; só 400px estão livres do teclado.
    expect(
      calcularRolagem({ campoTopo: 550, campoAltura: 48, rolagemAtual: 30, alturaVisivel: 400 }),
    ).toBe(30 + 550 + 48 + FOLGA_BASE - 400);
  });

  it('desce até o campo que ficou acima da área visível, mostrando o rótulo', () => {
    expect(
      calcularRolagem({ campoTopo: -60, campoAltura: 48, rolagemAtual: 200, alturaVisivel: 400 }),
    ).toBe(200 - 60 - FOLGA_TOPO);
  });

  it('nunca rola para antes do início do conteúdo', () => {
    expect(
      calcularRolagem({ campoTopo: 10, campoAltura: 48, rolagemAtual: 5, alturaVisivel: 400 }),
    ).toBe(0);
  });

  it('campo multilinha maior que a área visível fica alinhado pelo topo', () => {
    expect(
      calcularRolagem({ campoTopo: 300, campoAltura: 500, rolagemAtual: 0, alturaVisivel: 400 }),
    ).toBe(300 - FOLGA_TOPO);
  });

  it('campo alto já alinhado pelo topo não rola de novo', () => {
    expect(
      calcularRolagem({
        campoTopo: FOLGA_TOPO,
        campoAltura: 500,
        rolagemAtual: 120,
        alturaVisivel: 400,
      }),
    ).toBeNull();
  });

  it('sem área visível (rolagem ainda sem layout) não rola', () => {
    expect(
      calcularRolagem({ campoTopo: 550, campoAltura: 48, rolagemAtual: 0, alturaVisivel: 0 }),
    ).toBeNull();
  });
});

describe('sobreposicaoTeclado', () => {
  it('é o trecho da área abaixo do topo do teclado', () => {
    expect(sobreposicaoTeclado(800, 500)).toBe(300);
  });

  it('é zero quando a janela já encolheu e a área termina acima do teclado', () => {
    expect(sobreposicaoTeclado(480, 500)).toBe(0);
  });

  it('arredonda frações de pixel', () => {
    expect(sobreposicaoTeclado(800.6, 500.2)).toBe(300);
  });
});

describe('topoDoTeclado', () => {
  // Medido no emulador (1080x2400, densidade 2,625): teclado em screenY 577,9dp (1517px),
  // barra de status 48,8dp (128px) e a área do Meu Perfil com measureInWindow y = 56dp,
  // embora comece de fato em 104,8dp (275px).
  it('no Android desconta a barra de status para ficar no referencial do measureInWindow', () => {
    expect(
      topoDoTeclado({ plataforma: 'android', screenY: 577.9, barraDeStatus: 48.76 }),
    ).toBeCloseTo(529.14);
  });

  it('com o desconto, a área do Meu Perfil encolhe até o rodapé ficar acima do teclado', () => {
    const topo = topoDoTeclado({ plataforma: 'android', screenY: 577.9, barraDeStatus: 48.76 });
    // Base da área = 56 + 736,4; sem o desconto sobravam ~49dp do rodapé atrás do teclado.
    expect(sobreposicaoTeclado(56 + 736.4, topo)).toBe(263);
  });

  it('no iOS usa o screenY como veio', () => {
    expect(topoDoTeclado({ plataforma: 'ios', screenY: 500, barraDeStatus: 0 })).toBe(500);
  });
});
