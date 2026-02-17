import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getTestBySlug, TEST_REGISTRY } from '@/lib/tests/registry';
import TestPageClient from '../_shared/TestPageClient';

type TestPageProps = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ flow?: string | string[]; start?: string | string[] }>;
};

export async function generateStaticParams() {
  return TEST_REGISTRY.filter((test) => test.playable !== false).map((test) => ({ slug: test.slug }));
}

export async function generateMetadata({ params }: TestPageProps): Promise<Metadata> {
  const { slug } = await params;
  const test = getTestBySlug(slug);
  if (!test) {
    return {
      title: 'Test Not Found - HumansOnly',
    };
  }

  return {
    title: `${test.name} - HumansOnly`,
    description: test.description,
  };
}

export default async function TestPage({ params, searchParams }: TestPageProps) {
  const { slug } = await params;
  const query = await searchParams;
  const test = getTestBySlug(slug);
  if (!test || test.playable === false) {
    notFound();
  }

  const flowParam = typeof query.flow === 'string' ? query.flow : null;
  const startParam = typeof query.start === 'string' ? query.start : null;

  return <TestPageClient definition={test} flowParam={flowParam} startParam={startParam} />;
}
