// ]Carrega as variáveis de ambiente
require('dotenv').config();

// Importação das dependências 
const express = require('express');
const cors = require('cors');
const path = require('path');
const { Pool } = require('pg');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { GoogleGenerativeAI } = require("@google/generative-ai");
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);


//pega a senha secreta do arquivo .env

const JWT_SECRET = process.env.JWT_SECRET;


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

// SEGURANÇA (MIDDLEWARE)
function verificarToken(req, res, next) {
    const tokenHeader = req.headers['authorization'];

    if (!tokenHeader) {
        return res.status(401).json({ erro: 'Acesso negado. Faça login.' });
    }

    const token = tokenHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ erro: 'Token inválido.' });
    }

    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        
        req.usuarioId = decoded.id;
        
        next();
    } catch (erro) {
        return res.status(403).json({ erro: 'Sessão inválida ou expirada.' });
    }
}

// ROTA DE IA COM GEMINI
app.post('/interpretar-ia', verificarToken, async (req, res) => {
    const { frase } = req.body;

    if (!frase) return res.status(400).json({ erro: 'Digite uma frase!' });

    try {
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

        const prompt = `
            Você é uma API financeira. Converta a frase em JSON.
            
            IDs de Categoria:
            1: Moradia, 2: Alimentação, 3: Transporte, 4: Lazer, 5: Saúde, 
            6: Educação, 7: Compras, 8: Salário, 9: Investimentos, 10: Renda Extra

            Regras:
            - "tipo" deve ser "entrada" ou "saida".
            - Extraia o valor numérico (ex: "50" para 50.00).
            - "descricao" curta (ex: "Uber").
            - Se não souber a categoria, chute a melhor.

            Frase: "${frase}"

            Responda APENAS JSON puro:
            { "descricao": "string", "valor": number, "tipo": "entrada" ou "saida", "categoria_id": number }
        `;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        // Limpeza para remover crases do Markdown se o Gemini mandar
        let text = response.text().replace(/```json/g, '').replace(/```/g, '').trim();

        const jsonFinal = JSON.parse(text);
        res.json(jsonFinal);

    } catch (erro) {
        console.error("Erro no Gemini:", erro);
        res.status(500).json({ erro: 'Erro ao processar IA' });
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
            // Cria o token
            const token = jwt.sign({ id: usuario.id }, JWT_SECRET, { expiresIn: '1d' });

            res.status(200).json({ 
                mensagem: 'Login realizado!', 
                token: token, // <--- Envia o token (a pulseirinha)
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
app.get('/transacoes', verificarToken, async (req, res) => {
    // O ID agora vem automático do token (seguro)
    const usuarioId = req.usuarioId; 
    
    const filtro = req.query.filtro;

    if (!usuarioId) {
        return res.status(400).json({ erro: 'ID do usuário não informado.' });
    }

    try {
        let filtroData = '';
        if (filtro === 'semana') {
            filtroData = "AND t.data >= NOW() - INTERVAL '7 days'"; 
        } else if (filtro === 'mes') {
            filtroData = "AND t.data >= DATE_TRUNC('month', CURRENT_DATE)";
        } else if (filtro === 'ano') {
            filtroData = "AND t.data >= DATE_TRUNC('year', CURRENT_DATE)";
        }

        const query = `
            SELECT t.id, t.descricao, t.valor, c.tipo, c.nome as categoria_nome, t.data 
            FROM transacoes t
            LEFT JOIN categorias c ON t.categoria_id = c.id
            WHERE t.usuario_id = $1 ${filtroData} 
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
app.post('/transacoes', verificarToken, async (req, res) => {
    const { descricao, valor, categoria } = req.body;

    // ID do token validado
    const usuarioId = req.usuarioId; 

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
app.delete('/transacoes/:id', verificarToken, async (req, res) => {
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
app.put('/transacoes/:id', verificarToken, async (req, res) => {
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