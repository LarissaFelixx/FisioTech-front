import { useEffect, useRef, useState } from 'react';
import {
  Keyboard,
  LayoutAnimation,
  Platform,
  StyleSheet,
  View,
  type KeyboardEvent,
  type ViewProps,
} from 'react-native';

import { medirNaJanela } from './medirNaJanela';
import { sobreposicaoTeclado, topoDoTecladoNaJanela } from './tecladoLogic';

/**
 * Substitui o `KeyboardAvoidingView`: encolhe a área pelo tanto que o teclado cobre dela.
 * Com edge-to-edge o Android não redimensiona mais a janela (o `adjustResize` não age), e o
 * `KeyboardAvoidingView` sem `behavior` no Android deixava o teclado por cima dos campos.
 * A conta usa a posição da área na janela, então header nativo e safe area não exigem offset.
 */
export function AreaTeclado({ style, children, ...props }: ViewProps) {
  const area = useRef<View>(null);
  const [cobertura, setCobertura] = useState(0);

  useEffect(() => {
    // No iOS o evento "will" chega antes da animação do teclado, e a área sobe junto com ele.
    const ios = Platform.OS === 'ios';
    const aoMostrar = (e: KeyboardEvent) => {
      void medirNaJanela(area.current).then((medida) => {
        if (!medida) return;
        animar(e);
        setCobertura(sobreposicaoTeclado(medida.y + medida.height, topoDoTecladoNaJanela(e)));
      });
    };
    const aoEsconder = (e: KeyboardEvent) => {
      animar(e);
      setCobertura(0);
    };
    const inscricoes = [
      Keyboard.addListener(ios ? 'keyboardWillShow' : 'keyboardDidShow', aoMostrar),
      Keyboard.addListener(ios ? 'keyboardWillHide' : 'keyboardDidHide', aoEsconder),
    ];
    return () => inscricoes.forEach((inscricao) => inscricao.remove());
  }, []);

  return (
    <View ref={area} style={[styles.area, style, { paddingBottom: cobertura }]} {...props}>
      {children}
    </View>
  );
}

/** Mesma animação do `KeyboardAvoidingView`: acompanha a duração e a curva do teclado. */
function animar(e: KeyboardEvent) {
  if (!e?.duration) return;
  LayoutAnimation.configureNext({
    duration: e.duration,
    update: { duration: e.duration, type: e.easing ?? 'keyboard' },
  });
}

const styles = StyleSheet.create({
  area: { flex: 1 },
});
