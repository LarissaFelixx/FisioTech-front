import { createRef } from 'react';
import {
  Keyboard,
  Platform,
  ScrollView,
  StatusBar,
  StyleSheet,
  TextInput,
  type KeyboardEvent,
} from 'react-native';
import { act, fireEvent, render, screen } from '@testing-library/react-native';

import { TextField } from '../TextField/TextField';
import { AreaTeclado } from './AreaTeclado';
import { medirNaJanela, type Medida } from './medirNaJanela';
import { RolagemTeclado } from './RolagemTeclado';
import { FOLGA_BASE } from './tecladoLogic';

jest.mock('./medirNaJanela');

type Ouvinte = (e: KeyboardEvent) => void;
let ouvintes: Map<string, Ouvinte[]>;

beforeEach(() => {
  ouvintes = new Map();
  jest.spyOn(Keyboard, 'addListener').mockImplementation((evento, ouvinte) => {
    const lista = ouvintes.get(evento) ?? [];
    lista.push(ouvinte as Ouvinte);
    ouvintes.set(evento, lista);
    return {
      remove: () =>
        ouvintes.set(
          evento,
          (ouvintes.get(evento) ?? []).filter((o) => o !== ouvinte),
        ),
    } as unknown as ReturnType<typeof Keyboard.addListener>;
  });
});

afterEach(() => jest.restoreAllMocks());

/** Dispara um evento do teclado com o topo dele em `screenY`. */
async function emitir(evento: string, screenY = 0) {
  const e = { endCoordinates: { screenX: 0, screenY, width: 400, height: 800 - screenY } };
  await act(async () => {
    (ouvintes.get(evento) ?? []).forEach((ouvinte) => ouvinte(e as KeyboardEvent));
  });
}

// O iOS usa os eventos "will"; o Android, os "did" (o jest-expo roda como iOS por padrão).
const MOSTRAR = ['keyboardWillShow', 'keyboardDidShow'];
const ESCONDER = ['keyboardWillHide', 'keyboardDidHide'];

function medidas(fn: (alvo: unknown) => Medida | null) {
  jest.mocked(medirNaJanela).mockImplementation((alvo) => Promise.resolve(fn(alvo)));
}

function paddingDaArea() {
  return StyleSheet.flatten(screen.getByTestId('area').props.style).paddingBottom;
}

describe('AreaTeclado', () => {
  it('encolhe pelo tanto que o teclado cobre e volta ao fechar', async () => {
    medidas(() => ({ y: 0, height: 800 }));
    await render(<AreaTeclado testID="area" />);
    expect(paddingDaArea()).toBe(0);

    for (const evento of MOSTRAR) await emitir(evento, 500);
    expect(paddingDaArea()).toBe(300);

    for (const evento of ESCONDER) await emitir(evento);
    expect(paddingDaArea()).toBe(0);
  });

  it('no Android desconta a barra de status: measureInWindow conta a partir de baixo dela', async () => {
    // Visto no emulador: sem o desconto o botão Salvar ficava ~49dp atrás do teclado.
    const original = Platform.OS;
    const barra = StatusBar.currentHeight;
    Platform.OS = 'android';
    StatusBar.currentHeight = 49;
    try {
      medidas(() => ({ y: 56, height: 736 }));
      await render(<AreaTeclado testID="area" />);

      await emitir('keyboardDidShow', 578);
      expect(paddingDaArea()).toBe(56 + 736 - (578 - 49));
    } finally {
      Platform.OS = original;
      StatusBar.currentHeight = barra;
    }
  });

  it('no Android edge-to-edge (janela não encolhe) também tira a área de baixo do teclado', async () => {
    // Bug original: KeyboardAvoidingView sem `behavior` no Android deixava o teclado cobrir tudo.
    const original = Platform.OS;
    Platform.OS = 'android';
    try {
      medidas(() => ({ y: 0, height: 800 }));
      await render(<AreaTeclado testID="area" />);
      expect(ouvintes.has('keyboardWillShow')).toBe(false);

      await emitir('keyboardDidShow', 520);
      expect(paddingDaArea()).toBe(280);
      await emitir('keyboardDidHide');
      expect(paddingDaArea()).toBe(0);
    } finally {
      Platform.OS = original;
    }
  });

  it('não soma nada quando a janela já encolheu e a área termina acima do teclado', async () => {
    medidas(() => ({ y: 0, height: 480 }));
    await render(<AreaTeclado testID="area" />);

    for (const evento of MOSTRAR) await emitir(evento, 500);
    expect(paddingDaArea()).toBe(0);
  });

  it('usa a posição real na janela: área abaixo de um header não fica atrás do teclado', async () => {
    medidas(() => ({ y: 100, height: 700 }));
    await render(<AreaTeclado testID="area" />);

    for (const evento of MOSTRAR) await emitir(evento, 500);
    expect(paddingDaArea()).toBe(300);
  });

  it('deixa de ouvir o teclado ao desmontar', async () => {
    medidas(() => ({ y: 0, height: 800 }));
    const view = await render(<AreaTeclado testID="area" />);
    await view.unmount();
    expect([...ouvintes.values()].flat()).toHaveLength(0);
  });
});

describe('RolagemTeclado', () => {
  const ALTURA = 600;
  const SCROLL_Y = 100;

  // O mock do TextInput no Jest não acompanha o foco: os testes dizem qual campo está focado.
  let focado: string | null;

  async function focar(testID: string) {
    focado = testID;
    await fireEvent(screen.getByTestId(testID), 'focus');
  }

  async function desfocar(testID: string) {
    focado = null;
    await fireEvent(screen.getByTestId(testID), 'blur');
  }

  /** Rolagem a 100px do topo da janela; o campo fica em `campoY` (na janela). */
  async function montar(campoY: number) {
    focado = null;
    const ref = createRef<ScrollView>();
    const campos = { campo: createRef<TextInput>(), outro: createRef<TextInput>() };
    await render(
      <RolagemTeclado ref={ref} testID="rolagem">
        <TextField ref={campos.campo} label="Observações" testID="campo" />
        <TextField ref={campos.outro} label="Outro" testID="outro" />
      </RolagemTeclado>,
    );
    // Os métodos do mock são compartilhados entre instâncias: cada uma recebe o seu.
    for (const [testID, campo] of Object.entries(campos)) {
      campo.current!.isFocused = jest.fn(() => focado === testID);
    }
    const nativo = ref.current!.getNativeScrollRef();
    medidas((alvo) =>
      alvo === nativo ? { y: SCROLL_Y, height: ALTURA } : { y: campoY, height: 48 },
    );
    const scrollTo = jest.fn();
    ref.current!.scrollTo = scrollTo;
    await fireEvent(screen.getByTestId('rolagem'), 'layout', {
      nativeEvent: { layout: { x: 0, y: 0, width: 400, height: ALTURA } },
    });
    return scrollTo;
  }

  it('ao abrir o teclado, sobe até o campo focado que ficaria coberto', async () => {
    const scrollTo = await montar(500);
    await focar('campo');
    expect(scrollTo).not.toHaveBeenCalled();

    // Teclado começa em 500: só 400px da rolagem (de 100 a 500) continuam à vista.
    await emitir('keyboardDidShow', 500);
    expect(scrollTo).toHaveBeenCalledWith({
      y: 500 - SCROLL_Y + 48 + FOLGA_BASE - 400,
      animated: true,
    });
  });

  it('campo colado na borda de baixo já sobe um pouco ao ganhar foco', async () => {
    const scrollTo = await montar(650);
    await focar('campo');
    expect(scrollTo).toHaveBeenCalledWith({
      y: 650 - SCROLL_Y + 48 + FOLGA_BASE - ALTURA,
      animated: true,
    });
  });

  it('quando a área encolhe com o teclado aberto, ajusta de novo pela nova altura', async () => {
    const scrollTo = await montar(400);
    await focar('campo');
    await emitir('keyboardDidShow', 700);
    expect(scrollTo).not.toHaveBeenCalled();

    // O rodapé subiu junto com o teclado e a rolagem ficou com 300px.
    await fireEvent(screen.getByTestId('rolagem'), 'layout', {
      nativeEvent: { layout: { x: 0, y: 0, width: 400, height: 300 } },
    });
    expect(scrollTo).toHaveBeenCalledWith({
      y: 400 - SCROLL_Y + 48 + FOLGA_BASE - 300,
      animated: true,
    });
  });

  it('com o teclado já aberto, rola na hora em que o foco passa para outro campo', async () => {
    const scrollTo = await montar(500);
    await emitir('keyboardDidShow', 500);
    await focar('outro');
    expect(scrollTo).toHaveBeenCalledTimes(1);
  });

  it('não mexe na rolagem quando o campo focado já está à vista', async () => {
    const scrollTo = await montar(200);
    await focar('campo');
    await emitir('keyboardDidShow', 500);
    expect(scrollTo).not.toHaveBeenCalled();
  });

  it('não rola por um campo que já perdeu o foco', async () => {
    const scrollTo = await montar(500);
    await focar('campo');
    await desfocar('campo');
    await emitir('keyboardDidShow', 500);
    expect(scrollTo).not.toHaveBeenCalled();
  });

  it('considera a rolagem já feita pelo usuário', async () => {
    const scrollTo = await montar(500);
    await fireEvent.scroll(screen.getByTestId('rolagem'), {
      nativeEvent: { contentOffset: { x: 0, y: 80 } },
    });
    await focar('campo');
    await emitir('keyboardDidShow', 500);
    expect(scrollTo).toHaveBeenCalledWith({
      y: 80 + 500 - SCROLL_Y + 48 + FOLGA_BASE - 400,
      animated: true,
    });
  });
});
