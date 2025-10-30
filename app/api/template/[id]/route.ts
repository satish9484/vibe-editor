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

  if (!templatePath) {
    const fallback = getTemplateFallback(String(templateKey || 'REACT'));
    return Response.json({ success: true, templateJson: fallback, fallback: true }, { status: 200 });
  }

  try {
    const inputPath = path.join(process.cwd(), templatePath);
    const scanned: TemplateFolder = await scanTemplateDirectory(inputPath);

    if (!validateJsonStructure(scanned.items)) {
      const fallback = getTemplateFallback(String(templateKey || 'REACT'));
      return Response.json({ success: true, templateJson: fallback, fallback: true }, { status: 200 });
    }

    return Response.json({ success: true, templateJson: scanned }, { status: 200 });
  } catch (error) {
    console.error('Template scan failed, using fallback:', error);
    const fallback = getTemplateFallback(String(templateKey || 'REACT'));
    return Response.json({ success: true, templateJson: fallback, fallback: true }, { status: 200 });
  }
}
