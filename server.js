const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');

const app = express();
const port = 3000;

app.use(express.json());
app.use(cors());


const pool = new Pool({
    user: 'postgres',
    host: 'localhost',
    database: 'financas_db',
    password: 'senha_do_banco)', 
    port: 5432,
});


app.get('/transacoes', async (req, res) => {
    try {
        
        const query = `
            SELECT t.id, t.descricao, t.valor, c.tipo, t.data 
            FROM transacoes t
            JOIN categorias c ON t.categoria_id = c.id
            ORDER BY t.data DESC
        `;
        const resultado = await pool.query(query);
        res.json(resultado.rows);
    } catch (erro) {
        console.error(erro);
        res.status(500).json({ erro: 'Erro ao buscar dados' });
    }
});


app.post('/transacoes', async (req, res) => {
    const { descricao, valor, tipo } = req.body;

    try {
        
        let categoria_id = (tipo === 'entrada') ? 1 : 2; 

        const query = `
            INSERT INTO transacoes (descricao, valor, usuario_id, categoria_id)
            VALUES ($1, $2, 1, $3) RETURNING *
        `;
      
        
        const values = [descricao, valor, categoria_id];

        const resultado = await pool.query(query, values);
        res.status(201).json(resultado.rows[0]);
    } catch (erro) {
        console.error(erro);
        res.status(500).json({ erro: 'Erro ao salvar' });
    }
});

app.listen(port, () => {
    console.log(`Servidor rodando em http://localhost:${port}`);
});