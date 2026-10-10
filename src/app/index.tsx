import { Redirect } from 'expo-router';

// Os layouts de storyroot-auth/onboarding/main redirecionam conforme login e onboarding.
export default function Index() {
  return <Redirect href="/(app)/storyroot-auth/login" />;
}
