import { useFocusEffect } from '@react-navigation/native';
import { useCallback, useEffect, useRef } from 'react';

/**
 * Recarrega os dados quando a tela volta a ficar em foco, ignorando o primeiro foco (a query
 * já carrega ao montar). Substitui o recarregamento que o Angular fazia a cada navegação.
 *
 * `refetch` fica numa ref: se ele mudasse de identidade a cada render, o `useFocusEffect`
 * rodaria de novo e dispararia recargas em loop.
 */
export function useRefetchOnFocus(refetch: () => unknown) {
  const refetchRef = useRef(refetch);
  const primeiroFoco = useRef(true);

  useEffect(() => {
    refetchRef.current = refetch;
  }, [refetch]);

  useFocusEffect(
    useCallback(() => {
      if (primeiroFoco.current) {
        primeiroFoco.current = false;
        return;
      }
      refetchRef.current();
    }, []),
  );
}
