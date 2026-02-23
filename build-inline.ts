import { execSync } from "child_process";
import { readdirSync, readFileSync, writeFileSync, existsSync, unlinkSync } from "fs";
import { join } from "path";

// 1. Criar vite config temporário sem code splitting
const inlineConfig = `import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: { '@': path.resolve(__dirname, './src') }
  },
  build: {
    outDir: 'dist',
    minify: 'esbuild',
    cssMinify: 'esbuild',
    cssCodeSplit: false,
    rollupOptions: {
      output: {
        manualChunks: undefined, // Desabilita code splitting
        inlineDynamicImports: true // Força tudo inline
      }
    }
  }
});`;

const configPath = join(process.cwd(), "vite.config.inline.ts");
writeFileSync(configPath, inlineConfig);

console.log("🔧 Executando build inline (sem code splitting)...");
try {
  execSync("bunx vite build --config vite.config.inline.ts", { stdio: "inherit" });
  unlinkSync(configPath); // Remove config temporário
} catch (err) {
  console.error("❌ Erro ao compilar com Vite.");
  if (existsSync(configPath)) unlinkSync(configPath);
  process.exit(1);
}

// 2. Pegar arquivos da pasta assets
const distPath = join(process.cwd(), "dist");
const assetsPath = join(distPath, "assets");

const files = readdirSync(assetsPath);

// Identifica o arquivo CSS
const cssFile = files.find((f) => f.endsWith(".css"));

// Identifica o arquivo JS principal (agora será o único)
const jsFile = files.find((f) => f.endsWith(".js"));

if (!jsFile) {
  console.error("❌ Arquivo JS não encontrado.");
  process.exit(1);
}

console.log(`🎯 JS Bundle: ${jsFile} (${(readFileSync(join(assetsPath, jsFile), "utf8").length / 1024).toFixed(2)} KB)`);
if (cssFile) {
  console.log(`🎯 CSS: ${cssFile} (${(readFileSync(join(assetsPath, cssFile), "utf8").length / 1024).toFixed(2)} KB)`);
}

// 3. Ler conteúdos dos arquivos
const cssContent = cssFile ? readFileSync(join(assetsPath, cssFile), "utf8") : "";
const jsContent = readFileSync(join(assetsPath, jsFile), "utf8");

// 4. Gerar novo HTML com tudo inline
const finalHtml = `<!DOCTYPE html>
<html lang="pt-BR">
  <head>
    <meta charset="UTF-8" />
    <meta http-equiv="X-UA-Compatible" content="IE=edge" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
    <meta name="theme-color" content="#2A0A3E" />
    <meta name="mobile-web-app-capable" content="yes" />
    
    <!-- Meta tags específicas para WebView Android -->
    <meta name="format-detection" content="telephone=no" />
    <meta name="format-detection" content="address=no" />
    <meta name="format-detection" content="email=no" />
    <meta name="msapplication-tap-highlight" content="no" />
    <meta name="apple-mobile-web-app-capable" content="yes" />
    <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
    <meta name="apple-touch-fullscreen" content="yes" />
    
    <link rel="icon" href="data:,">
    <title>@SSH_T_PROJECT @Telks13 - SSH T PROJECT LAYOUT</title>
    ${cssContent ? `<style>${cssContent}</style>` : ''}
  </head>
  <body>
    <div id="root"></div>
    <script type="module">${jsContent}</script>
  </body>
</html>
`;

writeFileSync(join(distPath, "index.html"), finalHtml);
console.log("✅ HTML inline gerado com sucesso!");
console.log(`📊 JS embutido: ${(jsContent.length / 1024).toFixed(2)} KB`);
console.log(`📊 CSS embutido: ${(cssContent.length / 1024).toFixed(2)} KB`);
console.log(`📊 Total HTML: ${(finalHtml.length / 1024).toFixed(2)} KB`);
