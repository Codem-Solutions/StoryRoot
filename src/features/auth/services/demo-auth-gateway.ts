import type { AuthGateway, Session } from '@/features/auth/domain/auth';

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

function createSession(name: string, email: string): Session {
  return {
    accessToken: `demo-access-${Date.now()}`,
    refreshToken: `demo-refresh-${Date.now()}`,
    user: {
      id: 'demo-user',
      name,
      email,
    },
  };
}

export const demoAuthGateway: AuthGateway = {
  async signIn(email) {
    await delay(650);
    return createSession('Alex Morgan', email);
  },
  async register(name, email) {
    await delay(650);
    return createSession(name, email);
  },
  async requestPasswordReset() {
    await delay(650);
  },
  async refresh(refreshToken) {
    await delay(250);
    return {
      ...createSession('Alex Morgan', 'alex@example.com'),
      refreshToken,
    };
  },
};

// Troque somente esta exportação por um gateway HTTP, Firebase, Supabase ou Clerk.
export const authGateway: AuthGateway = demoAuthGateway;
