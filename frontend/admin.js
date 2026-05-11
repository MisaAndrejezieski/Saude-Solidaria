const API_URL = 'https://saude-solidaria-api.onrender.com';
const SENHA_ADMIN = 'saude123';

// Função de login
function verificarSenha() {
    const senha = document.getElementById('adminPassword').value;
    const errorDiv = document.getElementById('loginError');
    
    if (senha === SENHA_ADMIN) {
        localStorage.setItem('admin_logado', 'true');
        document.getElementById('loginPanel').style.display = 'none';
        document.getElementById('dashboard').style.display = 'block';
        carregarDados();
    } else {
        if (errorDiv) {
            errorDiv.textContent = '❌ Senha incorreta!';
            errorDiv.style.display = 'block';
        } else {
            alert('Senha incorreta!');
        }
    }
}

function logout() {
    localStorage.removeItem('admin_logado');
    document.getElementById('loginPanel').style.display = 'block';
    document.getElementById('dashboard').style.display = 'none';
    document.getElementById('adminPassword').value = '';
    
    const errorDiv = document.getElementById('loginError');
    if (errorDiv) errorDiv.style.display = 'none';
}

async function carregarDados() {
    try {
        // Buscar respostas
        const respResponse = await fetch(`${API_URL}/api/respostas`);
        
        if (!respResponse.ok) {
            throw new Error(`HTTP ${respResponse.status}`);
        }
        
        const respostas = await respResponse.json();
        
        // Buscar estatísticas
        const statsResponse = await fetch(`${API_URL}/api/estatisticas`);
        const stats = await statsResponse.json();
        
        // Atualizar cards
        document.getElementById('totalRespostas').textContent = stats.total || 0;
        document.getElementById('totalSim').textContent = stats.total_sim || 0;
        
        // Média de dependentes (calcular localmente)
        let totalDependentes = 0;
        respostas.forEach(r => {
            totalDependentes += parseInt(r.qtd_filhos) || 0;
            totalDependentes += r.tem_conjuge === 'sim' ? 1 : 0;
        });
        const mediaDependentes = respostas.length > 0 ? (totalDependentes / respostas.length).toFixed(1) : 0;
        document.getElementById('mediaDependentes').textContent = mediaDependentes;
        
        // Gráfico de participação (barra)
        let chart1 = Chart.getChart('participacaoChart');
        if (chart1) chart1.destroy();
        
        new Chart(document.getElementById('participacaoChart'), {
            type: 'bar',
            data: {
                labels: ['Sim', 'Não', 'Talvez'],
                datasets: [{
                    label: 'Número de respostas',
                    data: [stats.total_sim || 0, stats.total_nao || 0, stats.total_talvez || 0],
                    backgroundColor: ['#4CAF50', '#E57373', '#FFB74D'],
                    borderRadius: 8,
                    barPercentage: 0.6
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: { font: { size: 11 } }
                    }
                },
                scales: {
                    y: { beginAtZero: true, ticks: { stepSize: 1, font: { size: 10 } } },
                    x: { ticks: { font: { size: 11 } } }
                }
            }
        });
        
        // Gráfico de percentual ideal (pizza)
        const percentuaisMap = { '3': 0, '5': 0, '7': 0, '10': 0 };
        if (stats.percentuais) {
            stats.percentuais.forEach(p => {
                if (percentuaisMap[p.percentual_ideal] !== undefined) {
                    percentuaisMap[p.percentual_ideal] = p.quantidade;
                }
            });
        }
        
        let chart2 = Chart.getChart('percentualChart');
        if (chart2) chart2.destroy();
        
        new Chart(document.getElementById('percentualChart'), {
            type: 'pie',
            data: {
                labels: ['3%', '5%', '7%', '10%'],
                datasets: [{
                    data: [percentuaisMap['3'], percentuaisMap['5'], percentuaisMap['7'], percentuaisMap['10']],
                    backgroundColor: ['#1E88E5', '#4CAF50', '#FFB74D', '#2E8B57'],
                    borderWidth: 0
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                plugins: {
                    legend: { position: 'bottom', labels: { font: { size: 11 } } },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                const total = percentuaisMap['3'] + percentuaisMap['5'] + percentuaisMap['7'] + percentuaisMap['10'];
                                const percentual = total > 0 ? ((context.raw / total) * 100).toFixed(1) : 0;
                                return `${context.label}: ${context.raw} resposta(s) (${percentual}%)`;
                            }
                        }
                    }
                }
            }
        });
        
        // Tabela de respostas
        const tbody = document.getElementById('tbodyRespostas');
        tbody.innerHTML = '';
        
        const salarioMap = {
            'ate_2000': 'Até R$ 2k',
            '2001_3000': 'R$ 2-3k',
            '3001_4000': 'R$ 3-4k',
            '4001_5000': 'R$ 4-5k',
            'acima_5000': 'Acima R$ 5k'
        };
        
        respostas.forEach(r => {
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
        
    } catch (error) {
        console.error('Erro ao carregar dados:', error);
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
        
    } catch (error) {
        console.error('Erro ao exportar:', error);
        alert('Erro ao exportar dados.');
    }
}

// Verificar login ao carregar
document.addEventListener('DOMContentLoaded', function() {
    if (localStorage.getItem('admin_logado') === 'true') {
        document.getElementById('loginPanel').style.display = 'none';
        document.getElementById('dashboard').style.display = 'block';
        carregarDados();
    }
});