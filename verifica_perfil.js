const onvif = require('onvif');

console.log('Tentando conectar na câmera para verificar os perfis ONVIF...');

const cam = new onvif.Cam({
    hostname: '192.168.18.88',
    username: 'admin',
    password: 'APPIA-DADOOH',
    port: 80,
    timeout: 10000
}, function(err) {
    // Primeiro, checamos por um erro de conexão fundamental
    if (err) {
        console.error('ERRO FUNDAMENTAL DE CONEXÃO ONVIF:');
        console.error(err);
        return;
    }

    // Se não houve erro, a conexão foi bem-sucedida!
    console.log('\nCONEXÃO ONVIF BEM-SUCEDIDA!');
    console.log('=======================================');

    // AGORA, VERIFICAMOS SE A INFORMAÇÃO DO DISPOSITIVO VEIO NA RESPOSTA
    if (this.device) {
        console.log('Informações básicas da câmera:');
        console.log(`- Fabricante: ${this.device.manufacturer || 'Não informado'}`);
        console.log(`- Modelo: ${this.device.model || 'Não informado'}`);
        console.log(`- Firmware: ${this.device.firmwareVersion || 'Não informado'}`);
    } else {
        console.log('AVISO: A câmera conectou, mas não retornou informações de dispositivo (fabricante, modelo).');
    }
    
    console.log('=======================================');

    // E VERIFICAMOS SE A LISTA DE PERFIS VEIO NA RESPOSTA
    if (this.profiles && this.profiles.length > 0) {
        console.log('\nPerfis de mídia encontrados:');
        this.profiles.forEach(profile => {
            console.log(`- Nome do Perfil: ${profile.name}, Token: ${profile.token}`);
        });
    } else {
        console.log('AVISO: A câmera conectou, mas não retornou uma lista de perfis de mídia.');
    }

    // Para fins de depuração, vamos imprimir tudo que a biblioteca conseguiu extrair
    // console.log('\nObjeto "cam" completo recebido:', this);
});