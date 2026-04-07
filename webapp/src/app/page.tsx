'use client';

import { AppShell } from '@/components/AppShell';
import { useSpecFlow } from '@/hooks/useSpecFlow';

export default function Home() {
  const flow = useSpecFlow();
  return <AppShell flow={flow} />;
}
