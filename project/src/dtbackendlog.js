const express = require("express");
const fs = require("fs");
const path = require("path");

const app = express();
const PORT = 3333;

// Permite JSON
app.use(express.json());

// Endpoint para exportar os dados
app.post("/export", (req, res) => {
  const data = req.body;
  const filename = `dt-explorer-${Date.now()}.json`;

  fs.writeFile(
    path.join(__dirname, "exports", filename),
    JSON.stringify(data, null, 2),
    (err) => {
      if (err) {
        console.error("Erro ao salvar:", err);
        return res.status(500).send("Erro ao salvar");
      }
      console.log("Export salvo:", filename);
      res.send("Export recebido com sucesso");
    }
  );
});

// Cria pasta exports se não existir
const dir = path.join(__dirname, "exports");
if (!fs.existsSync(dir)) fs.mkdirSync(dir);

app.listen(PORT, () => {
  console.log(`🛰️  Backend rodando em http://localhost:${PORT}`);
});
