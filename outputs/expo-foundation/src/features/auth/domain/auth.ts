export type User = {
  id: string;
  name: string;
  email: string;
};

export type Session = {
  accessToken: string;
  refreshToken: string;
  user: User;
};

export interface AuthGateway {
  signIn(email: string, password: string): Promise<Session>;
  register(name: string, email: string, password: string): Promise<Session>;
  requestPasswordReset(email: string): Promise<void>;
  refresh(refreshToken: string): Promise<Session>;
}
