import { unwrap, type Envelope } from '../../../shared/api/envelope';
import { httpClient } from '../../../shared/api/http-client';
import type { AuthUser, Credentials, Session } from '../domain/auth.types';

interface LoginResponse {
  readonly accessToken: string;
  readonly user: AuthUser;
}

export const authApi = {
  async login(credentials: Credentials): Promise<Session> {
    const response = await httpClient.post<Envelope<LoginResponse>>('/auth/login', credentials);
    const { accessToken, user } = unwrap(response);
    return { token: accessToken, user };
  },
};
