import type { Paciente } from '../../../types/paciente';
import { mensagemDeErro } from '../../../utils/mensagensErro';

export function filtrarPacientesAdmin(pacientes: Paciente[], busca: string): Paciente[] {
  const normalizar = (texto: string) =>
    texto
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase();
  const termo = normalizar(busca.trim());

  return pacientes.filter((paciente) =>
    [paciente.nome, paciente.email, paciente.profissionalNome ?? ''].some((texto) =>
      normalizar(texto).includes(termo),
    ),
  );
}

export function mensagemErroPacienteAdmin(error: unknown): string {
  return mensagemDeErro(
    error,
    {
      400: 'Confira os dados informados. A operação não foi aceita pelo servidor.',
      403: 'Você não tem permissão para administrar pacientes.',
      404: 'Paciente ou profissional não encontrado. Atualize os dados e tente novamente.',
      409: 'Email já cadastrado. Informe um email único.',
    },
    'Não foi possível carregar ou salvar os dados do paciente. Tente novamente.',
  );
}
