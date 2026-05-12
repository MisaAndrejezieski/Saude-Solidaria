// 🔴 ENDPOINT PARA LIMPAR O BANCO (APAGA TODAS AS RESPOSTAS)
app.delete('/api/limpar', async (req, res) => {
    try {
        // Primeiro, contar quantos registros existem
        const countResult = await pool.query('SELECT COUNT(*) FROM respostas');
        const total = parseInt(countResult.rows[0].count);
        
        if (total === 0) {
            return res.json({ 
                success: true, 
                message: 'Banco já estava vazio',
                deletedCount: 0
            });
        }
        
        // Apagar todos os registros
        const result = await pool.query('DELETE FROM respostas');
        
        console.log(`🗑️ ${result.rowCount} respostas deletadas do banco`);
        
        res.json({ 
            success: true, 
            message: `${result.rowCount} respostas foram deletadas com sucesso!`,
            deletedCount: result.rowCount
        });
    } catch (err) {
        console.error('❌ Erro ao limpar banco:', err);
        res.status(500).json({ 
            success: false, 
            error: 'Erro ao limpar dados do banco' 
        });
    }
});