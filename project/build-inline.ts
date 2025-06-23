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

if (!cssFile || !jsFile) {
  console.error("❌ Arquivo CSS ou JS não encontrado.");
  process.exit(1);
}

console.log(`🎯 CSS: ${cssFile}`);
console.log(`🎯 JS: ${jsFile}`);

// 3. Ler conteúdos dos arquivos
const cssContent = readFileSync(join(assetsPath, cssFile), "utf8");
const jsContent = readFileSync(join(assetsPath, jsFile), "utf8");

// 4. Gerar novo HTML
const finalHtml = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <link rel="icon" type="image/svg+xml" href="/vite.svg" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>DTunnel Debug Interface</title>
    <style>${cssContent}</style>
  </head>
  <body>
    <div id="root"></div>
    <script>${jsContent}</script>
  </body>
</html>
`;

writeFileSync(join(distPath, "index.html"), finalHtml);
console.log("✅ index.html gerado com sucesso em modo inline.");
