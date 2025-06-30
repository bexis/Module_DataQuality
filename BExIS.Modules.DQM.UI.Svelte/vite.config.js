import { defineConfig } from 'vite';
import { svelte } from '@sveltejs/vite-plugin-svelte';
import path from 'path';
import  stringPlugin  from 'vite-plugin-string';

export default defineConfig({
  build: {
    lib: {
      entry: 'src/DataQuality.svelte',
      name: 'DataQuality',
      fileName: () => 'data-quality.js',
      formats: ['iife']
    }
  },
  plugins: [
    svelte({ compilerOptions: { customElement: true} }),  
    stringPlugin({ include: '**/*.css' }) 
  ],
   resolve: {
    alias: {
      '$app/environment': path.resolve('./src/shims/environment.js')
    }
  }
});