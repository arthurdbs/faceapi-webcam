require('dotenv').config();
const express = require('express');
const { createClient } = require('@libsql/client');
const path = require('path');
require('./stream.js'); // Inicia o stream da câmera

const app = express();
const port = 3000;

// Servir arquivos estáticos do diretório atual
app.use(express.static(__dirname));

// Rota principal que serve o index.html
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// Configuração do cliente Turso
const db = createClient({
  url: process.env.TURSO_DATABASE_URL,
  authToken: process.env.TURSO_AUTH_TOKEN,
});

// Endpoint para buscar os descritores faciais
app.get('/descriptors/:label', async (req, res) => {
  const { label } = req.params;

  try {
    const rs = await db.execute({
      sql: "SELECT descriptor FROM image_features WHERE nome = ?",
      args: [label],
    });

    if (rs.rows.length === 0) {
      return res.status(404).json({ error: `Descritor não encontrado para o rótulo: ${label}` });
    }

    const descriptorRaw = rs.rows[0].descriptor;
    let descriptorArray;

    // Adicionando logs para depuração no terminal
    console.log(`[DEBUG] Rótulo: ${label}`);
    console.log(`[DEBUG] Tipo do descritor recebido do DB: ${typeof descriptorRaw}`);
    console.log(`[DEBUG] É Buffer? ${Buffer.isBuffer(descriptorRaw)}`);

    // Lógica robusta para conversão de tipo
    if (Buffer.isBuffer(descriptorRaw)) {
        // Se for um Buffer (BLOB), converte para Float32Array
        descriptorArray = Array.from(new Float32Array(descriptorRaw.buffer, descriptorRaw.byteOffset, descriptorRaw.byteLength / Float32Array.BYTES_PER_ELEMENT));
    } else if (typeof descriptorRaw === 'string') {
        // Se for uma string, converte para array de números
        descriptorArray = descriptorRaw.split(',').map(s => parseFloat(s.trim())).filter(n => !isNaN(n));
    } else if (Array.isArray(descriptorRaw)){
        // Se já for um array, usa diretamente
        descriptorArray = descriptorRaw;
    } else {
        console.error(`[ERROR] Formato de descritor não suportado para o rótulo: ${label}`);
        throw new Error('Formato de descritor não suportado no banco de dados.');
    }

    // Validação final para garantir que o descritor é válido para o face-api.js
    if (!descriptorArray || descriptorArray.length !== 128) {
        console.error(`[ERROR] O descritor para '${label}' é inválido. Comprimento: ${descriptorArray ? descriptorArray.length : 'nulo'}`);
        return res.status(500).json({ error: `O descritor para '${label}' é inválido ou está corrompido.` });
    }

    console.log(`[SUCCESS] Descritor para '${label}' processado com sucesso.`);
    // O face-api espera um array de descritores
    res.json([descriptorArray]);

  } catch (error) {
    console.error(`[FATAL] Erro ao buscar descritores para '${label}':`, error);
    res.status(500).json({ error: 'Erro interno no servidor ao processar o descritor facial.' });
  }
});

app.listen(port, () => {
  console.log(`Servidor rodando em http://localhost:${port}`);
});
