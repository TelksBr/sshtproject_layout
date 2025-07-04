import { execSync } from "child_process";
import { readdirSync, readFileSync, writeFileSync } from "fs";
import { join } from "path";

// 1. Rodar build
console.log("🔧 Executando build com Bun...");
try {
  execSync("bun run build", { stdio: "inherit" });
} catch (err) {
  console.error("❌ Erro ao compilar com Bun.");
  process.exit(1);
}

// 2. Pegar arquivos da pasta assets
const distPath = join(process.cwd(), "dist");
const assetsPath = join(distPath, "assets");

const files = readdirSync(assetsPath);
const cssFile = files.find((f) => f.endsWith(".css"));
const jsFile = files.find((f) => f.endsWith(".js"));

if (!jsFile) {
  console.error("❌ Arquivo JS não encontrado.");
  process.exit(1);
}

console.log(`🎯 JS: ${jsFile}`);
if (cssFile) {
  console.log(`🎯 CSS: ${cssFile}`);
} else {
  console.log("📦 CSS embutido no JS (bundle)");
}

// 3. Ler conteúdos dos arquivos
const cssContent = cssFile ? readFileSync(join(assetsPath, cssFile), "utf8") : "";
const jsContent = readFileSync(join(assetsPath, jsFile), "utf8");

// 4. Gerar novo HTML
const finalHtml = `<!DOCTYPE html>
<html lang="pt-BR">
  <head>
    <meta charset="UTF-8" />
    <meta http-equiv="X-UA-Compatible" content="IE=edge" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
    <meta name="theme-color" content="#2A0A3E" />
    <meta name="mobile-web-app-capable" content="yes" />
    <link rel="icon" href="data:,">
    <title>@SSH_T_PROJECT @Telks13 - SSH T PROJECT LAYOUT</title>
    ${cssContent ? `<style>${cssContent}</style>` : ''}
  </head>
  <body>
    <div id="root"></div>
    <script>${jsContent}</script>
  </body>
</html>

`;

writeFileSync(join(distPath, "index.html"), finalHtml);
console.log("✅ index.html gerado com sucesso em modo inline.");
