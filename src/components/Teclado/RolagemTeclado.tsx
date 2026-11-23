import {
  createContext,
  forwardRef,
  useCallback,
  useContext,
  useEffect,
  useImperativeHandle,
  useRef,
} from 'react';
import { Keyboard, ScrollView, type ScrollViewProps, type TextInput } from 'react-native';

import { medirNaJanela } from './medirNaJanela';
import { calcularRolagem, topoDoTecladoNaJanela } from './tecladoLogic';

type RevelarCampo = (campo: TextInput | null) => void;

const RevelarCampoContext = createContext<RevelarCampo | null>(null);

/** Chamado pelo `TextField` ao ganhar foco; fora de uma `RolagemTeclado` não há nada a rolar. */
export function useRevelarCampo() {
  return useContext(RevelarCampoContext);
}

/**
 * `ScrollView` de formulário que rola até o campo focado quando o teclado abre, quando a área
 * encolhe (dentro de uma `AreaTeclado`) e quando o foco passa para outro campo.
 */
export const RolagemTeclado = forwardRef<ScrollView, ScrollViewProps>(function RolagemTeclado(
  {
    onScroll,
    onLayout,
    keyboardShouldPersistTaps = 'handled',
    scrollEventThrottle = 16,
    children,
    ...props
  },
  ref,
) {
  const scroll = useRef<ScrollView>(null);
  const campoFocado = useRef<TextInput | null>(null);
  const rolagem = useRef(0);
  const altura = useRef(0);
  const tecladoTopo = useRef<number | null>(null);
  useImperativeHandle(ref, () => scroll.current as ScrollView);

  const ajustar = useCallback(() => {
    const campo = campoFocado.current;
    if (!campo?.isFocused() || !scroll.current) return;
    void Promise.all([
      medirNaJanela(campo),
      medirNaJanela(scroll.current.getNativeScrollRef()),
    ]).then(([medidaCampo, medidaScroll]) => {
      if (!medidaCampo || !medidaScroll) return;
      // Antes de a área encolher, o teclado ainda cobre a parte de baixo da rolagem.
      const alturaVisivel =
        tecladoTopo.current === null
          ? altura.current
          : Math.min(altura.current, tecladoTopo.current - medidaScroll.y);
      const destino = calcularRolagem({
        campoTopo: medidaCampo.y - medidaScroll.y,
        campoAltura: medidaCampo.height,
        rolagemAtual: rolagem.current,
        alturaVisivel,
      });
      if (destino !== null) scroll.current?.scrollTo({ y: destino, animated: true });
    });
  }, []);

  const revelar = useCallback<RevelarCampo>(
    (campo) => {
      campoFocado.current = campo;
      ajustar();
    },
    [ajustar],
  );

  useEffect(() => {
    const inscricoes = [
      Keyboard.addListener('keyboardDidShow', (e) => {
        tecladoTopo.current = topoDoTecladoNaJanela(e);
        ajustar();
      }),
      Keyboard.addListener('keyboardDidHide', () => {
        tecladoTopo.current = null;
      }),
    ];
    return () => inscricoes.forEach((inscricao) => inscricao.remove());
  }, [ajustar]);

  return (
    <RevelarCampoContext.Provider value={revelar}>
      <ScrollView
        ref={scroll}
        keyboardShouldPersistTaps={keyboardShouldPersistTaps}
        scrollEventThrottle={scrollEventThrottle}
        onScroll={(e) => {
          rolagem.current = e.nativeEvent.contentOffset.y;
          onScroll?.(e);
        }}
        onLayout={(e) => {
          altura.current = e.nativeEvent.layout.height;
          ajustar();
          onLayout?.(e);
        }}
        {...props}
      >
        {children}
      </ScrollView>
    </RevelarCampoContext.Provider>
  );
});
