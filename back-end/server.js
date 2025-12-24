// Importação das dependências 
const express = require('express');
const cors = require('cors');
const path = require('path');
const { Pool } = require('pg');
const bcrypt = require('bcrypt');

// Criação da aplicação Express
const app = express();
const port = 3000;

// permite que o servidor entenda dados enviados em formato json
app.use(express.json());

//libera acesso para que qualquer página consuma essa API
app.use(cors());

// Configura o servidor para entregar os arquivos html,css e js que estão na pasta
//public, o path.join garante que o caminho funcione tanto em windows quanto em 
//linux/mac
app.use(express.static(path.join(__dirname, '..' ,'public')));

// Conexão com o banco de dados
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
        rejectUnauthorized: false
    }
});

// 1. Rota de cadastro - com criptografia
app.post('/cadastro', async (req, res) => {
    const {nome, email, senha} = req.body;

    if (!nome || !email || !senha) {
        return res.status(400).json({erro: 'todos os campos são obrigatórios'});
    }
    try {
        //verifica duplicidade
        const userCheck = await pool.query('select * from usuarios where email = $1', [email]);
        if (userCheck.rows.length > 0) {
            return res.status(400).json({ erro: 'este e-mail já está cadastrado.'});
        }
        //criptografa a senha antes de salvar
        const saltRounds = 10;
        const senhaCriptografada = await bcrypt.hash(senha, saltRounds);

        //insere no banco a senha criptografada
        const query = 'insert into usuarios (nome, email, senha) values ($1, $2, $3) returning id, nome, email';
        const values = [nome, email, senhaCriptografada];

        const resultado = await pool.query(query, values);

        res.status(201).json({
            mensagem: 'usuário cadastrado com sucesso!',
            usuario: resultado.rows[0]
        });

    } catch (erro) {
        console.error(erro);
        res.status(500).json({erro: 'erro ao cadastrar usuário'});
    }
});

// 2. ROTA DE LOGIN - com comparação segura
app.post('/login', async (req, res) => {
    const { email, senha } = req.body;

    try {
        const query = 'SELECT * FROM usuarios WHERE email = $1';
        const resultado = await pool.query(query, [email]);

        if (resultado.rows.length === 0) {
            return res.status(401).json({ erro: 'E-mail não encontrado' });
        }

        const usuario = resultado.rows[0];

        // --- AQUI A COMPARAÇÃO SEGURA ---
        // Verifica se a senha digitada bate com a criptografada no banco
        const senhaCorreta = await bcrypt.compare(senha, usuario.senha);

        if (senhaCorreta) {
            res.status(200).json({ 
                mensagem: 'Login realizado!', 
                usuarioId: usuario.id,
                nome: usuario.nome 
            });
        } else {
            res.status(401).json({ erro: 'Senha incorreta' });
        }

    } catch (erro) {
        console.error(erro);
        res.status(500).json({ erro: 'Erro no servidor' });
    }
});

// 3. Rota de listagem de transações (AGORA FILTRANDO POR USUÁRIO)
app.get('/transacoes', async (req, res) => {
    // Pegamos o ID do usuário que vem pelo cabeçalho da requisição (headers)
    const usuarioId = req.headers['usuario-id']; 

    if (!usuarioId) {
        return res.status(400).json({ erro: 'ID do usuário não informado.' });
    }

    try {
        const query = `
            SELECT t.id, t.descricao, t.valor, c.tipo, t.data 
            FROM transacoes t
            JOIN categorias c ON t.categoria_id = c.id
            WHERE t.usuario_id = $1  -- O segredo está aqui: filtro WHERE
            ORDER BY t.data DESC
        `;
        const resultado = await pool.query(query, [usuarioId]);
        res.json(resultado.rows);
    } catch (erro) {
        console.error(erro);
        res.status(500).json({ erro: 'Erro ao buscar dados' });
    }
});


// 4. Rota de criação de transação (AGORA COM ID DINÂMICO)
app.post('/transacoes', async (req, res) => {
    const { descricao, valor, tipo, usuarioId } = req.body; // Recebe usuarioId do front

    try {
        let categoria_id = (tipo === 'entrada') ? 1 : 2; 

        const query = `
            INSERT INTO transacoes (descricao, valor, usuario_id, categoria_id)
            VALUES ($1, $2, $3, $4) RETURNING *
        `;
        
        const values = [descricao, valor, usuarioId, categoria_id];

        const resultado = await pool.query(query, values);
        res.status(201).json(resultado.rows[0]);
    } catch (erro) {
        console.error(erro);
        res.status(500).json({ erro: 'Erro ao salvar transação' });
    }
});

// INICIALIZAÇÃO DO SERVIDOR (Esta é a parte que mantém ele rodando)
app.listen(port, () => {
    console.log(`Servidor rodando em http://localhost:${port}`);
});