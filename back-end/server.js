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

// 3. Rota de listagem de transações (COM FILTRO DE DATA)
app.get('/transacoes', async (req, res) => {
    const usuarioId = req.headers['usuario-id']; 
    const filtro = req.query.filtro; // <--- Pegamos o filtro da URL (?filtro=mes)

    if (!usuarioId) {
        return res.status(400).json({ erro: 'ID do usuário não informado.' });
    }

    try {
        let filtroData = '';

        // Lógica do SQL dinâmico
        if (filtro === 'semana') {
            // Últimos 7 dias
            filtroData = "AND t.data >= NOW() - INTERVAL '7 days'"; 
        } else if (filtro === 'mes') {
            // Desde o dia 1º deste mês atual
            filtroData = "AND t.data >= DATE_TRUNC('month', CURRENT_DATE)";
        } else if (filtro === 'ano') {
            // Desde o dia 1º de Janeiro deste ano
            filtroData = "AND t.data >= DATE_TRUNC('year', CURRENT_DATE)";
        }
        // Se for 'todos', a variável filtroData fica vazia e busca tudo.

        const query = `
            SELECT t.id, t.descricao, t.valor, c.tipo, c.nome as categoria_nome, t.data 
            FROM transacoes t
            LEFT JOIN categorias c ON t.categoria_id = c.id
            WHERE t.usuario_id = $1 ${filtroData} 
            ORDER BY t.data DESC
        `;
        
        // Note que adicionamos o ${filtroData} dentro da query
        const resultado = await pool.query(query, [usuarioId]);
        
        res.json(resultado.rows);
    } catch (erro) {
        console.error(erro);
        res.status(500).json({ erro: 'Erro ao buscar dados' });
    }
});


// 4. Rota de criação de transação (AGORA COM ID DINÂMICO)
app.post('/transacoes', async (req, res) => {
    const { descricao, valor, usuarioId, categoria } = req.body; // Recebe usuarioId do front

    try {
        

        const query = `
            INSERT INTO transacoes (descricao, valor, usuario_id, categoria_id)
            VALUES ($1, $2, $3, $4) RETURNING *
        `;
        
        const values = [descricao, valor, usuarioId, categoria];

        const resultado = await pool.query(query, values);
        res.status(201).json(resultado.rows[0]);
    } catch (erro) {
        console.error(erro);
        res.status(500).json({ erro: 'Erro ao salvar transação' });
    }
});

// 5.Rota para DELETAR transação
app.delete('/transacoes/:id', async (req, res) => {
    const { id } = req.params; 

    try {
        await pool.query('DELETE FROM transacoes WHERE id = $1', [id]);
        res.status(200).json({ mensagem: 'Deletado com sucesso!' });
    } catch (erro) {
        console.error(erro);
        res.status(500).json({ erro: 'Erro ao deletar' });
    }
});

// 6. Rota para ATUALIZAR transação (PUT)
app.put('/transacoes/:id', async (req, res) => {
    const { id } = req.params;
    const { descricao, valor, categoria } = req.body; 

    try {
        const query = `
            UPDATE transacoes 
            SET descricao = $1, valor = $2, categoria_id = $3
            WHERE id = $4
        `;
        
        await pool.query(query, [descricao, valor, categoria, id]);
        
        res.status(200).json({ mensagem: 'Atualizado com sucesso!' });
    } catch (erro) {
        console.error(erro);
        res.status(500).json({ erro: 'Erro ao atualizar' });
    }
});

// INICIALIZAÇÃO DO SERVIDOR 
app.listen(port, () => {
    console.log(`Servidor rodando em http://localhost:${port}`);
});