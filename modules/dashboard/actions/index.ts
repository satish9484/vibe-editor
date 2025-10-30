'use server';

import { db } from '@/lib/db';
import { getTemplateFallback, templatePaths, toCanonicalTemplateKey } from '@/lib/template';
import { currentUser } from '@/modules/auth/actions';
import { scanTemplateDirectory, TemplateFolder } from '@/modules/playground/lib/path-to-json';
import type { Prisma } from '@prisma/client';
import { revalidatePath } from 'next/cache';
import path from 'path';

export const toggleStarMarked = async (playgroundId: string, isChecked: boolean) => {
  const user = await currentUser();
  const userId = user?.id;
  if (!userId) {
    throw new Error('User Id is Required');
  }

  try {
    if (isChecked) {
      await db.starMark.create({
        data: {
          userId: userId!,
          playgroundId,
          isMarked: isChecked,
        },
      });
    } else {
      await db.starMark.delete({
        where: {
          userId_playgroundId: {
            userId,
            playgroundId: playgroundId,
          },
        },
      });
    }

    revalidatePath('/dashboard');
    return { success: true, isMarked: isChecked };
  } catch (error) {
    console.error('Error updating problem:', error);
    return { success: false, error: 'Failed to update problem' };
  }
};

export const getAllPlaygroundForUser = async () => {
  const user = await currentUser();

  // If no authenticated user, return empty list to avoid unsafe non-null assertions
  if (!user?.id) {
    return [];
  }

  try {
    const playground = await db.playground.findMany({
      where: {
        userId: user.id,
      },
      include: {
        user: true,
        Starmark: {
          where: {
            userId: user.id,
          },
          select: {
            isMarked: true,
          },
        },
      },
    });

    return playground;
  } catch (error) {
    console.error('Error fetching playgrounds:', error);
    return [];
  }
};

export const createPlayground = async (data: {
  title: string;
  template: 'REACT' | 'NEXTJS' | 'EXPRESS' | 'VUE' | 'HONO' | 'ANGULAR';
  description?: string;
}) => {
  console.group('🆕 Server: Creating Playground');
  console.log('1️⃣ Server received data:', data);

  const user = await currentUser();
  console.log('2️⃣ User check:', {
    hasUser: !!user,
    userId: user?.id,
    userEmail: user?.email,
  });

  if (!user || !user.id) {
    console.error('3️⃣ ❌ FAILED: No authenticated user');
    throw new Error('User authentication required');
  }

  const { template, title, description } = data;
  console.log('3️⃣ Processing playground data:', { template, title, description });

  try {
    console.log('4️⃣ Creating playground in database...');
    const canonicalTemplate = toCanonicalTemplateKey(template) ?? 'REACT';
    console.log('🧭 Normalized template key:', { input: template, canonicalTemplate });
    const playground = await db.playground.create({
      data: {
        title: title,
        description: description,
        template: canonicalTemplate,
        userId: user.id,
      },
    });

    console.log('5️⃣ ✅ SUCCESS: Playground created:', {
      id: playground.id,
      title: playground.title,
      template: playground.template,
    });
    console.log('📝 Playground row written to DB with normalized template.');
    // Seed starter files from vibecode-starters so first load doesn't require runtime scan
    try {
      const startersPath = templatePaths[canonicalTemplate];
      const normalizedStartersPath = startersPath.replace(/^[\\\/]+/, '');
      const inputPath = path.join(process.cwd(), normalizedStartersPath);
      console.log('📁 Scanning and saving starter tree to templateFiles.content from:', inputPath);
      const scanned: TemplateFolder = await scanTemplateDirectory(inputPath);
      const jsonContent: Prisma.InputJsonValue = JSON.parse(JSON.stringify(scanned));
      await db.templateFile.create({
        data: {
          playgroundId: playground.id,
          content: jsonContent,
        },
      });
      console.log('6️⃣ ✅ Seeded starter template files for playground:', playground.id);
    } catch (seedError) {
      console.error('6️⃣ ❌ Failed to seed starter; writing minimal fallback JSON:', seedError);
      const fallback = getTemplateFallback(canonicalTemplate);
      const jsonFallback: Prisma.InputJsonValue = JSON.parse(JSON.stringify(fallback));
      console.log('🛟 Seeding fallback template JSON to templateFiles.content');
      await db.templateFile.create({
        data: {
          playgroundId: playground.id,
          content: jsonFallback,
        },
      });
    }

    console.groupEnd();
    return playground;
  } catch (error) {
    console.error('5️⃣ ❌ FAILED: Database error:', error);
    console.groupEnd();
    throw new Error(`Failed to create playground: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

export const deleteProjectById = async (id: string) => {
  try {
    await db.playground.delete({
      where: {
        id,
      },
    });
    revalidatePath('/dashboard');
  } catch (error) {
    console.log(error);
  }
};

export const editProjectById = async (id: string, data: { title: string; description: string }) => {
  try {
    await db.playground.update({
      where: {
        id,
      },
      data: data,
    });
    revalidatePath('/dashboard');
  } catch (error) {
    console.log(error);
  }
};

export const duplicateProjectById = async (id: string): Promise<void> => {
  try {
    const originalPlayground = await db.playground.findUnique({
      where: { id },
      // todo: add tempalte files
    });
    if (!originalPlayground) {
      throw new Error('Original playground not found');
    }

    await db.playground.create({
      data: {
        title: `${originalPlayground.title} (Copy)`,
        description: originalPlayground.description,
        template: originalPlayground.template,
        userId: originalPlayground.userId,

        // todo: add template files
      },
    });

    revalidatePath('/dashboard');
  } catch (error) {
    console.error('Error duplicating project:', error);
  }
};
