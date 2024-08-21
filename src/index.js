const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const path = require('path');
const routes = require('./routes');

const app = express();

// Conectar ao banco de dados MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/pousada')
    .then(() => {
        console.log('Conectado ao MongoDB');
    })
    .catch(err => {
        console.error('Erro ao conectar ao MongoDB:', err);
    });


// Configurar middleware
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Servir arquivos estáticos
app.use(express.static(path.join(__dirname, '../public')));

// Definir rotas API
app.use('/api', routes);

// Página inicial
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../public/index.html'));
});

// Middleware para tratamento de erros
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).send('Algo deu errado!');
});

// Definir a porta e iniciar o servidor
const PORT = process.env.PORT || 3001;
app.listen(PORT, async () => {
    console.log(`Servidor rodando na porta ${PORT}`);
    
    // Importar o módulo open dinamicamente
    const open = (await import('open')).default;
    open(`http://localhost:${PORT}`);
});
