export const templatePaths = {
  REACT: '/vibecode-starters/react-ts',
  NEXTJS: '/vibecode-starters/nextjs-new',
  EXPRESS: '/vibecode-starters/express-simple',
  VUE: '/vibecode-starters/vue',
  HONO: '/vibecode-starters/hono-nodejs-starter',
  ANGULAR: '/vibecode-starters/angular',
};

// Minimal per-template fallbacks used when starter directories are unavailable
export const templateFallbacks = {
  REACT: {
    folderName: 'react-app',
    items: [
      {
        folderName: 'src',
        items: [
          {
            filename: 'main',
            fileExtension: 'tsx',
            content:
              "import React from 'react';\nimport { createRoot } from 'react-dom/client';\nfunction App(){ return <h1>React Starter</h1>; }\ncreateRoot(document.getElementById('root')!).render(<App />);\n",
          },
        ],
      },
      {
        filename: 'index',
        fileExtension: 'html',
        content: '<!doctype html>\n<html><body><div id="root"></div></body></html>\n',
      },
      {
        filename: 'package',
        fileExtension: 'json',
        content: '{"name":"react-starter","private":true,"scripts":{"start":"vite"}}\n',
      },
      {
        filename: 'README',
        fileExtension: 'md',
        content: '# React Starter (Fallback)\n',
      },
    ],
  },
  NEXTJS: {
    folderName: 'next-app',
    items: [
      {
        folderName: 'app',
        items: [
          {
            filename: 'page',
            fileExtension: 'tsx',
            content: 'export default function Page(){ return <h1>Next.js Starter</h1>; }\n',
          },
        ],
      },
      {
        filename: 'package',
        fileExtension: 'json',
        content: '{"name":"next-starter","private":true,"scripts":{"dev":"next dev"}}\n',
      },
      {
        filename: 'README',
        fileExtension: 'md',
        content: '# Next.js Starter (Fallback)\n',
      },
    ],
  },
  EXPRESS: {
    folderName: 'express-app',
    items: [
      {
        filename: 'server',
        fileExtension: 'js',
        content: "const express=require('express');const app=express();app.get('/',(_,res)=>res.send('Express Starter'));app.listen(3000);\n",
      },
      {
        filename: 'package',
        fileExtension: 'json',
        content: '{"name":"express-starter","private":true,"scripts":{"start":"node server.js"}}\n',
      },
      {
        filename: 'README',
        fileExtension: 'md',
        content: '# Express Starter (Fallback)\n',
      },
    ],
  },
  VUE: {
    folderName: 'vue-app',
    items: [
      {
        folderName: 'src',
        items: [
          {
            filename: 'main',
            fileExtension: 'ts',
            content: "import { createApp } from 'vue';\nconst App={ template: '<h1>Vue Starter</h1>' };\ncreateApp(App).mount('#app');\n",
          },
        ],
      },
      {
        filename: 'index',
        fileExtension: 'html',
        content: '<!doctype html>\n<html><body><div id="app"></div></body></html>\n',
      },
      {
        filename: 'package',
        fileExtension: 'json',
        content: '{"name":"vue-starter","private":true,"scripts":{"start":"vite"}}\n',
      },
      {
        filename: 'README',
        fileExtension: 'md',
        content: '# Vue Starter (Fallback)\n',
      },
    ],
  },
  HONO: {
    folderName: 'hono-app',
    items: [
      {
        filename: 'server',
        fileExtension: 'ts',
        content: "import { Hono } from 'hono';\nconst app=new Hono();\napp.get('/', c=>c.text('Hono Starter'));\nexport default app;\n",
      },
      {
        filename: 'README',
        fileExtension: 'md',
        content: '# Hono Starter (Fallback)\n',
      },
    ],
  },
  ANGULAR: {
    folderName: 'angular-app',
    items: [
      {
        filename: 'README',
        fileExtension: 'md',
        content: '# Angular Starter (Fallback)\n',
      },
      {
        filename: 'package',
        fileExtension: 'json',
        content: '{"name":"angular-starter","private":true,"scripts":{"start":"ng serve"}}\n',
      },
    ],
  },
} as const;

export type TemplateKey = keyof typeof templatePaths;

// Common aliases to map various user/database values to canonical TemplateKey
export const templateAliases: Record<string, TemplateKey> = {
  // React variants
  react: 'REACT',
  'react-ts': 'REACT',
  reactjs: 'REACT',
  // Next.js variants
  next: 'NEXTJS',
  nextjs: 'NEXTJS',
  'next-js': 'NEXTJS',
  // Express variants
  express: 'EXPRESS',
  expressjs: 'EXPRESS',
  'node-express': 'EXPRESS',
  // Vue variants
  vue: 'VUE',
  vuejs: 'VUE',
  'vue-js': 'VUE',
  // Hono variants
  hono: 'HONO',
  honojs: 'HONO',
  'hono-js': 'HONO',
  // Angular variants
  angular: 'ANGULAR',
  angularjs: 'ANGULAR',
  ng: 'ANGULAR',
};

export function toCanonicalTemplateKey(input: string | null | undefined): TemplateKey | null {
  if (!input) return null;
  const lower = input.trim().toLowerCase();
  if (!lower) return null;
  const alias = templateAliases[lower];
  if (alias) return alias;
  const upper = lower.toUpperCase() as TemplateKey;
  if (upper in templatePaths) return upper;
  return null;
}

export function getTemplateFallback(templateKey: string) {
  const key = (templateKey || 'REACT') as TemplateKey;
  return templateFallbacks[key] ?? templateFallbacks.REACT;
}
