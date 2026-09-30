/** Hora atual. Isolada num módulo para que os testes possam fixar o "agora". */
export const clock = {
  agora: (): Date => new Date(),
};
