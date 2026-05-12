const API_URL = 'https://saude-solidaria-api.onrender.com';
const SENHA_ADMIN = 'saude123';

console.log('✅ Admin carregado - Versão com Limpeza');

// Aguardar o DOM carregar
document.addEventListener('DOMContentLoaded', () => {
    if (localStorage.getItem('admin_logado') === 'true') {
        document.getElementById('loginPanel').style.display = 'none';
        document.getElementById('dashboard').style.display = 'block';
        carregarDados();
    }
});

function verificarSenha() {
    const senha = document.getElementById('adminPassword').value;
    const errorDiv = document.getElementById('loginError');
    
    if (senha === SENHA_ADMIN) {
        localStorage.setItem('admin_logado', 'true');
        document.getElementById('loginPanel').style.display = 'none';
        document.getElementById('dashboard').style.display = 'block';
        carregarDados();
    } else {
        errorDiv.textContent = '❌ Senha incorreta! Tente novamente.';
        errorDiv.style.color = '#e53e3e';
    }
}

function logout() {
    localStorage.removeItem('admin_logado');
    document.getElementById('loginPanel').style.display = 'block';
    document.getElementById('dashboard').style.display = 'none';
    document.getElementById('adminPassword').value = '';
    document.getElementById('loginError').textContent = '';
}

async function carregarDados() {
    console.log('📊 Carregando dados...');
    
    try {
        const response = await fetch(`${API_URL}/api/respostas`);
        
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }
        
        const respostas = await response.json();
        console.log(`📦 ${respostas.length} respostas recebidas`);
        
        // Atualizar cards
        document.getElementById('totalRespostas').textContent = respostas.length;
        
        const totalSim = respostas.filter(r => r.participaria === 'sim').length;
        document.getElementById('totalSim').textContent = totalSim;
        
        // Calcular média de dependentes
        let totalDep = 0;
        respostas.forEach(r => {
            totalDep += parseInt(r.qtd_filhos) || 0;
            totalDep += r.tem_conjuge === 'sim' ? 1 : 0;
        });
        const mediaDep = respostas.length > 0 ? (totalDep / respostas.length).toFixed(1) : 0;
        document.getElementById('mediaDependentes').textContent = mediaDep;
        
        // Montar tabela
        const tbody = document.getElementById('tbodyRespostas');
        tbody.innerHTML = '';
        
        const salarioMap = {
            'ate_2000': 'Até R$ 2k',
            '2001_3000': 'R$ 2-3k',
            '3001_4000': 'R$ 3-4k',
            '4001_5000': 'R$ 4-5k',
            'acima_5000': 'Acima R$ 5k'
        };
        
        if (respostas.length === 0) {
            tbody.innerHTML = '<tr><td colspan="7">📭 Nenhuma resposta ainda. Compartilhe o formulário!</td></tr>';
        } else {
            respostas.slice().reverse().forEach(r => {
                const row = tbody.insertRow();
                row.insertCell(0).textContent = r.nome || 'Anônimo';
                row.insertCell(1).textContent = r.setor || '-';
                row.insertCell(2).textContent = salarioMap[r.salario] || '-';
                row.insertCell(3).textContent = r.participaria === 'sim' ? '✅ Sim' : (r.participaria === 'nao' ? '❌ Não' : '🤔 Talvez');
                row.insertCell(4).textContent = r.percentual_ideal ? `${r.percentual_ideal}%` : '-';
                
                let dependentesText = '';
                if (r.tem_conjuge === 'sim') dependentesText += 'Cônjuge ';
                if (r.qtd_filhos && r.qtd_filhos !== '0') dependentesText += `+${r.qtd_filhos} filho(s)`;
                row.insertCell(5).textContent = dependentesText || 'Nenhum';
                row.insertCell(6).textContent = new Date(r.data).toLocaleDateString('pt-BR');
            });
        }
        
        console.log('✅ Tabela atualizada com sucesso!');
        
    } catch (error) {
        console.error('❌ Erro ao carregar:', error);
        document.getElementById('tbodyRespostas').innerHTML = `<tr><td colspan="7">❌ Erro ao carregar dados: ${error.message}</td></tr>`;
    }
}

async function exportarCSV() {
    try {
        const response = await fetch(`${API_URL}/api/respostas`);
        const respostas = await response.json();
        
        if (respostas.length === 0) {
            alert('Nenhuma resposta para exportar.');
            return;
        }
        
        let csv = '"Nome","Setor","Salário","Participaria","% Ideal","Data"\n';
        
        const salarioMap = {
            'ate_2000': 'Até R$ 2.000',
            '2001_3000': 'R$ 2.001 a R$ 3.000',
            '3001_4000': 'R$ 3.001 a R$ 4.000',
            '4001_5000': 'R$ 4.001 a R$ 5.000',
            'acima_5000': 'Acima de R$ 5.000'
        };
        
        respostas.forEach(r => {
            csv += `"${r.nome || 'Anônimo'}","${r.setor || ''}","${salarioMap[r.salario] || ''}","${r.participaria === 'sim' ? 'Sim' : (r.participaria === 'nao' ? 'Não' : 'Talvez')}","${r.percentual_ideal || ''}%","${new Date(r.data).toLocaleDateString('pt-BR')}"\n`;
        });
        
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.href = url;
        link.setAttribute('download', `respostas_saude_solidaria_${new Date().toISOString().split('T')[0]}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        
        alert('✅ CSV exportado com sucesso!');
        
    } catch (error) {
        console.error('Erro ao exportar:', error);
        alert('❌ Erro ao exportar dados.');
    }
}

// 🔴 FUNÇÃO PARA LIMPAR O BANCO (COM CONFIRMAÇÃO)
function confirmarLimpeza() {
    const totalEl = document.getElementById('totalRespostas');
    const totalRespostas = totalEl ? totalEl.textContent : '0';
    
    if (totalRespostas === '0') {
        alert('ℹ️ O banco já está vazio. Nada para deletar.');
        return;
    }
    
    const confirmado = confirm(
        `⚠️ ATENÇÃO! ⚠️\n\n` +
        `Você está prestes a DELETAR PERMANENTEMENTE todas as ${totalRespostas} respostas do banco de dados.\n\n` +
        `Esta ação NÃO pode ser desfeita!\n\n` +
        `Recomendamos exportar um backup (CSV) antes de continuar.\n\n` +
        `Clique em OK para continuar.`
    );
    
    if (confirmado) {
        const senhaConfirmacao = prompt('Digite "ZERAR" para confirmar a exclusão de todos os dados:');
        if (senhaConfirmacao === 'ZERAR') {
            zerarBanco();
        } else {
            alert('❌ Operação cancelada. Código de confirmação incorreto.');
        }
    }
}

async function zerarBanco() {
    console.log('🗑️ Iniciando limpeza do banco...');
    
    const btnLimpar = document.querySelector('.btn-danger');
    if (!btnLimpar) return;
    
    const textoOriginal = btnLimpar.textContent;
    btnLimpar.textContent = '⏳ Limpando...';
    btnLimpar.disabled = true;
    
    try {
        const response = await fetch(`${API_URL}/api/limpar`, {
            method: 'DELETE'
        });
        
        const result = await response.json();
        
        if (result.success) {
            console.log('✅ Banco limpo:', result);
            alert(`✅ ${result.message}\n${result.deletedCount} registros removidos.`);
            await carregarDados();
        } else {
            throw new Error(result.error || 'Erro desconhecido');
        }
    } catch (error) {
        console.error('❌ Erro ao limpar:', error);
        alert(`❌ Erro ao limpar o banco: ${error.message}\n\nVerifique se o backend está rodando e o endpoint /api/limpar existe.`);
    } finally {
        btnLimpar.textContent = textoOriginal;
        btnLimpar.disabled = false;
    }
}