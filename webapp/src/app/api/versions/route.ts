import { NextResponse } from 'next/server';
import { listVersions, createVersion } from '@/lib/db';
import type { SpecFlowState } from '@/lib/types';

export async function GET() {
  const versions = listVersions();
  return NextResponse.json(versions);
}

export async function POST(request: Request) {
  const { label, trigger, state } = (await request.json()) as {
    label: string;
    trigger: string;
    state: SpecFlowState;
  };

  if (!label || !trigger || !state) {
    return NextResponse.json(
      { error: 'label, trigger, and state are required' },
      { status: 400 },
    );
  }

  const id = createVersion(label, trigger, state);
  return NextResponse.json({ id }, { status: 201 });
}
