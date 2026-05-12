const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

// ============================================================
// CONEXÃO COM O BANCO DE DADOS (LOCAL OU RENDER)
// ============================================================
let poolConfig = {
    connectionString: process.env.DATABASE_URL,
};

if (process.env.DATABASE_URL) {
    // Ambiente Render (produção) - SSL ativado
    poolConfig.ssl = { rejectUnauthorized: false };
    console.log('✅ Conectando ao banco do Render (SSL ativado)');
} else {
    // Ambiente local - sem SSL
    console.log('⚠️ DATABASE_URL não encontrada. Usando PostgreSQL local (sem SSL)');
    poolConfig = {
        host: 'localhost',
        port: 5432,
        user: 'postgres',
        password: 'postgres',  // ← altere para sua senha local
        database: 'saude_db',
        ssl: false
    };
}

const pool = new Pool(poolConfig);

// ============================================================
// CRIA A TABELA 'respostas' SE NÃO EXISTIR
// ============================================================
async function initDatabase() {
    const createTableQuery = `
        CREATE TABLE IF NOT EXISTS respostas (
            id SERIAL PRIMARY KEY,
            nome VARCHAR(100),
            setor VARCHAR(50),
            salario VARCHAR(50),
            gasto_medicamento VARCHAR(50),
            gasto_exame VARCHAR(50),
            tem_conjuge VARCHAR(10),
            gasto_conjuge VARCHAR(50),
            qtd_filhos VARCHAR(10),
            gastos_filhos TEXT,
            participaria VARCHAR(10),
            percentual_ideal VARCHAR(10),
            comentarios TEXT,
            data TIMESTAMP DEFAULT NOW()
        )
    `;
    try {
        await pool.query(createTableQuery);
        console.log('✅ Tabela criada/verificada com sucesso');
    } catch (err) {
        console.error('❌ Erro ao criar tabela:', err.message);
    }
}
initDatabase();

// ============================================================
// ROTA DE TESTE
// ============================================================
app.get('/', (req, res) => {
    res.json({ message: 'API Saúde Solidária funcionando!' });
});

// ============================================================
// ENDPOINT PARA SALVAR RESPOSTA
// ============================================================
app.post('/api/respostas', async (req, res) => {
    const { nome, setor, salario, gasto_medicamento, gasto_exame, tem_conjuge, gasto_conjuge, qtd_filhos, gastos_filhos, participaria, percentual_ideal, comentarios } = req.body;
    try {
        const result = await pool.query(
            `INSERT INTO respostas (nome, setor, salario, gasto_medicamento, gasto_exame, tem_conjuge, gasto_conjuge, qtd_filhos, gastos_filhos, participaria, percentual_ideal, comentarios) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12) RETURNING id`,
            [nome || 'Anônimo', setor, salario, gasto_medicamento, gasto_exame, tem_conjuge, gasto_conjuge, qtd_filhos, gastos_filhos ? JSON.stringify(gastos_filhos) : '[]', participaria, percentual_ideal, comentarios || '']
        );
        res.status(201).json({ success: true, id: result.rows[0].id });
    } catch (err) {
        console.error('Erro ao salvar:', err);
        res.status(500).json({ error: 'Erro ao salvar resposta' });
    }
});

// ============================================================
// ENDPOINT PARA LISTAR RESPOSTAS
// ============================================================
app.get('/api/respostas', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM respostas ORDER BY data DESC');
        res.json(result.rows);
    } catch (err) {
        console.error('Erro ao listar:', err);
        res.status(500).json({ error: 'Erro ao buscar respostas' });
    }
});

// ============================================================
// ENDPOINT PARA ESTATÍSTICAS
// ============================================================
app.get('/api/estatisticas', async (req, res) => {
    try {
        const result = await pool.query(`SELECT COUNT(*) as total, SUM(CASE WHEN participaria = 'sim' THEN 1 ELSE 0 END) as total_sim, SUM(CASE WHEN participaria = 'nao' THEN 1 ELSE 0 END) as total_nao, SUM(CASE WHEN participaria = 'talvez' THEN 1 ELSE 0 END) as total_talvez FROM respostas`);
        const percentuais = await pool.query(`SELECT percentual_ideal, COUNT(*) as quantidade FROM respostas WHERE percentual_ideal IS NOT NULL AND percentual_ideal != '' GROUP BY percentual_ideal`);
        res.json({ total: parseInt(result.rows[0].total), total_sim: parseInt(result.rows[0].total_sim), total_nao: parseInt(result.rows[0].total_nao), total_talvez: parseInt(result.rows[0].total_talvez), percentuais: percentuais.rows });
    } catch (err) {
        console.error('Erro ao buscar estatísticas:', err);
        res.status(500).json({ error: 'Erro ao buscar estatísticas' });
    }
});

// ============================================================
// ENDPOINT PARA LIMPAR O BANCO (DELETE)
// ============================================================
app.delete('/api/limpar', async (req, res) => {
    try {
        const countResult = await pool.query('SELECT COUNT(*) FROM respostas');
        const total = parseInt(countResult.rows[0].count);
        if (total === 0) {
            return res.json({ success: true, message: 'Banco já estava vazio', deletedCount: 0 });
        }
        const result = await pool.query('DELETE FROM respostas');
        console.log(`🗑️ ${result.rowCount} respostas deletadas do banco`);
        res.json({ success: true, message: `${result.rowCount} respostas foram deletadas com sucesso!`, deletedCount: result.rowCount });
    } catch (err) {
        console.error('❌ Erro ao limpar banco:', err);
        res.status(500).json({ success: false, error: 'Erro ao limpar dados do banco' });
    }
});

// ============================================================
// INICIA O SERVIDOR
// ============================================================
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`🚀 Servidor rodando na porta ${PORT}`);
});