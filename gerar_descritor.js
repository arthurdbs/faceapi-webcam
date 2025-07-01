// Script para gerar descritor facial de uma imagem e salvar no banco Turso automaticamente
// Requer: npm install @libsql/client face-api.js canvas node-fetch

const { createClient } = require('@libsql/client');
const faceapi = require('face-api.js');
const canvas = require('canvas');
const fetch = require('node-fetch');
const path = require('path');
require('dotenv').config();

// Adaptação para Node.js: injeta implementações do canvas no face-api.js
const { Canvas, Image, ImageData } = canvas;
faceapi.env.monkeyPatch({ Canvas, Image, ImageData });

// Configuração do banco
const db = createClient({
  url: process.env.TURSO_DATABASE_URL,
  authToken: process.env.TURSO_AUTH_TOKEN,
});

// Função principal
async function main() {
  // Caminho da imagem e nome do registro
  const imagePath = process.argv[2]; // Ex: node gerar_descritor.js ./images/familia.jpg
  const nome = process.argv[3] || 'Familia_Brito_Silva';
  if (!imagePath) {
    console.error('Uso: node gerar_descritor.js <caminho_da_imagem> [nome_no_banco]');
    process.exit(1);
  }

  // Carrega modelos
  const modelPath = path.join(__dirname, 'models');
  await faceapi.nets.ssdMobilenetv1.loadFromDisk(modelPath);
  await faceapi.nets.faceLandmark68Net.loadFromDisk(modelPath);
  await faceapi.nets.faceRecognitionNet.loadFromDisk(modelPath);

  // Carrega imagem
  const img = await canvas.loadImage(imagePath);
  const detection = await faceapi.detectSingleFace(img).withFaceLandmarks().withFaceDescriptor();
  if (!detection) {
    console.error('Nenhum rosto detectado na imagem!');
    process.exit(1);
  }
  const descritorArray = Array.from(detection.descriptor);

  // Salva no banco como string SEM espaço após a vírgula
  const descritorString = descritorArray.join(',');
  console.log('DEBUG descritor salvo:', descritorString);
  await db.execute({
    sql: 'DELETE FROM image_features WHERE nome = ?',
    args: [nome]
  });
  await db.execute({
    sql: 'INSERT INTO image_features (nome, descriptor) VALUES (?, ?)',
    args: [nome, descritorString]
  });
  console.log('Descritor salvo no banco com sucesso para', nome);
}

main();
