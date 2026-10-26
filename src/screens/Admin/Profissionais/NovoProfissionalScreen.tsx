import { AdminOnly } from '../../../components/AdminOnly/AdminOnly';
import { ProfissionalEditor } from './ProfissionalEditor';

/** Cadastro administrativo, sem parâmetro de id e sem ações de edição/exclusão. */
export function NovoProfissionalScreen() {
  return (
    <AdminOnly>
      <ProfissionalEditor modo="cadastro" />
    </AdminOnly>
  );
}
