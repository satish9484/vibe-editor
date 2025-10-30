import { getTemplateFallback, templatePaths, toCanonicalTemplateKey } from '@/lib/template';
import { scanTemplateDirectory, TemplateFolder } from '@/modules/playground/lib/path-to-json';
import { NextRequest } from 'next/server';
import path from 'path';

// Runtime configuration
export const runtime = 'nodejs';

function validateJsonStructure(data: unknown): boolean {
  try {
    JSON.parse(JSON.stringify(data)); // Ensures it's serializable
    return true;
  } catch (error) {
    console.error('Invalid JSON structure:', error);
    return false;
  }
}

export async function GET(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { id } = await context.params;

  // Use template from query (?template=REACT|NEXTJS|...) or default to REACT
  const rawTemplate = request.nextUrl.searchParams.get('template') ?? undefined;
  const templateKey = toCanonicalTemplateKey(rawTemplate) ?? 'REACT';
  const templatePath = templatePaths[templateKey];

  console.group('🧩 Template API Request');
  console.log('1️⃣ Query params:', { rawTemplate });
  console.log('2️⃣ Resolved template key:', { templateKey });
  console.log('3️⃣ Resolved template path:', { templatePath });

  if (!templatePath) {
    const fallback = getTemplateFallback(String(templateKey || 'REACT'));
    console.warn('⚠️ No templatePath found; returning fallback');
    console.groupEnd();
    return Response.json({ success: true, templateJson: fallback, fallback: true }, { status: 200 });
  }

  try {
    const normalized = templatePath.replace(/^[\\\/]+/, '');
    const inputPath = path.join(process.cwd(), normalized);
    console.log('4️⃣ Scanning directory:', { cwd: process.cwd(), normalized, inputPath });
    const scanned: TemplateFolder = await scanTemplateDirectory(inputPath);

    if (!validateJsonStructure(scanned.items)) {
      const fallback = getTemplateFallback(String(templateKey || 'REACT'));
      console.warn('⚠️ Invalid JSON structure from scan; returning fallback');
      console.groupEnd();
      return Response.json({ success: true, templateJson: fallback, fallback: true }, { status: 200 });
    }

    console.log('5️⃣ ✅ Scan successful; returning template JSON');
    console.groupEnd();
    return Response.json({ success: true, templateJson: scanned }, { status: 200 });
  } catch (error) {
    console.error('❌ Template scan failed, using fallback:', error);
    const fallback = getTemplateFallback(String(templateKey || 'REACT'));
    console.groupEnd();
    return Response.json({ success: true, templateJson: fallback, fallback: true }, { status: 200 });
  }
}
