require('dotenv').config();
const express = require('express');
const { createClient } = require('@libsql/client');
const path = require('path');
require('./stream.js');

const app = express();
const port = 3000;

// --- Servir arquivos estáticos ---
// Define o diretório raiz para servir os arquivos
const publicDir = path.join(__dirname);
app.use(express.static(publicDir));

// Rota principal que serve o index.html
app.get('/', (req, res) => {
  res.sendFile(path.join(publicDir, 'index.html'));
});

// Configuração do cliente Turso
const db = createClient({
  url: process.env.TURSO_DATABASE_URL,
  authToken: process.env.TURSO_AUTH_TOKEN,
});

// Endpoint para buscar os descritores faciais
// Ex: http://localhost:3000/descriptors/Familia_Brito_Silva
app.get('/descriptors/:label', async (req, res) => {
  const label = req.params.label;

  try {
    const rs = await db.execute({
      sql: "SELECT descriptor FROM image_features WHERE nome = ?",
      args: [label]
    });

    if (rs.rows.length > 0) {
      let descriptor = rs.rows[0].descriptor;
      // Log para depuração
      console.log('DEBUG descriptor:', descriptor);
      console.log('DEBUG typeof:', typeof descriptor);
      console.log('DEBUG constructor:', descriptor && descriptor.constructor && descriptor.constructor.name);
      let descriptorAsArray;

      if (Buffer.isBuffer(descriptor)) {
        // Caso 1: Buffer binário
        const float32Array = new Float32Array(
          descriptor.buffer,
          descriptor.byteOffset,
          descriptor.byteLength / 4
        );
        descriptorAsArray = Array.from(float32Array);
      } else if (Array.isArray(descriptor)) {
        // Caso 2: Array de números
        descriptorAsArray = descriptor;
      } else if (typeof descriptor === 'string') {
        // Caso 3: String de números separados por vírgula (com ou sem espaço)
        descriptorAsArray = descriptor.split(',').map(s => Number(s.trim())).filter(n => !isNaN(n));
        console.log('DEBUG tamanho do descritor convertido:', descriptorAsArray.length);
      } else if (descriptor && typeof descriptor === 'object' && descriptor.constructor && descriptor.constructor.name === 'Uint8Array') {
        // Caso 4: Uint8Array
        const float32Array = new Float32Array(
          descriptor.buffer,
          descriptor.byteOffset,
          descriptor.byteLength / 4
        );
        descriptorAsArray = Array.from(float32Array);
      } else if (descriptor instanceof ArrayBuffer) {
        // Caso 5: ArrayBuffer
        const float32Array = new Float32Array(descriptor);
        descriptorAsArray = Array.from(float32Array);
      } else {
        throw new Error("Formato de dado do descritor não suportado.");
      }

      res.json([descriptorAsArray]);
    } else {
      res.status(404).send('Descritores não encontrados para o rótulo');
    }
  } catch (error) {
    console.error('Erro ao buscar descritores:', error);
    res.status(500).send('Erro no servidor');
  }
});

app.listen(port, () => {
  console.log(`Servidor rodando em http://localhost:${port}`);
  console.log(`Acesse a aplicação em http://localhost:${port}/index.html`);
});
