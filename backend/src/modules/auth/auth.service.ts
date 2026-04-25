import jwt from 'jsonwebtoken';
import { findUserByCredentials } from './auth.repository';

export interface AuthPayload {
  id: string;
  nome: string;
  email: string;
  id_grupo: number;
  perfil: 'consultor' | 'gestor' | 'cs';
}

// Grupos de gestor: BDR gestor + administradores IXC + admin Centro de Solução (140)
const GESTOR_GROUPS  = [134, 101, 147, 140, 123];
// Grupos de Centro de Solução
const CS_GROUPS      = [109];

export async function login(email: string, password: string): Promise<{ token: string; user: Omit<AuthPayload, 'id'> }> {
  if (!email || !password) {
    throw new Error('E-mail e senha são obrigatórios.');
  }

  const user = await findUserByCredentials(email.toLowerCase().trim(), password);
  if (!user) {
    throw new Error('Credenciais inválidas.');
  }

  const perfil: AuthPayload['perfil'] =
    GESTOR_GROUPS.includes(user.id_grupo) ? 'gestor' :
    CS_GROUPS.includes(user.id_grupo)     ? 'cs'      :
    'consultor';

  const payload: AuthPayload = {
    id:       user.id,
    nome:     user.nome,
    email:    user.email,
    id_grupo: user.id_grupo,
    perfil,
  };

  const token = jwt.sign(payload, process.env.JWT_SECRET!, { expiresIn: '8h' });

  return {
    token,
    user: { nome: user.nome, email: user.email, id_grupo: user.id_grupo, perfil },
  };
}
