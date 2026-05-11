const API_URL = 'https://saude-solidaria-api.onrender.com';
const SENHA_ADMIN = 'saude123';

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
        errorDiv.style.marginTop = '10px';
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
    try {
        const response = await fetch(`${API_URL}/api/respostas`);
        
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }
        
        const respostas = await response.json();
        
        // Atualizar cards
        document.getElementById('totalRespostas').textContent = respostas.length;
        
        const totalSim = respostas.filter(r => r.participaria === 'sim').length;
        document.getElementById('totalSim').textContent = totalSim;
        
        let totalDependentes = 0;
        respostas.forEach(r => {
            totalDependentes += parseInt(r.qtd_filhos) || 0;
            totalDependentes += r.tem_conjuge === 'sim' ? 1 : 0;
        });
        const mediaDependentes = respostas.length > 0 ? (totalDependentes / respostas.length).toFixed(1) : 0;
        document.getElementById('mediaDependentes').textContent = mediaDependentes;
        
        // Estatísticas para os gráficos
        const stats = {
            total_sim: respostas.filter(r => r.participaria === 'sim').length,
            total_nao: respostas.filter(r => r.participaria === 'nao').length,
            total_talvez: respostas.filter(r => r.participaria === 'talvez').length,
            percentuais: {
                '3': respostas.filter(r => r.percentual_ideal === '3').length,
                '5': respostas.filter(r => r.percentual_ideal === '5').length,
                '7': respostas.filter(r => r.percentual_ideal === '7').length,
                '10': respostas.filter(r => r.percentual_ideal === '10').length
            }
        };
        
        // Gráfico de participação
        let chart1 = Chart.getChart('participacaoChart');
        if (chart1) chart1.destroy();
        
        new Chart(document.getElementById('participacaoChart'), {
            type: 'bar',
            data: {
                labels: ['Sim', 'Não', 'Talvez'],
                datasets: [{
                    label: 'Número de respostas',
                    data: [stats.total_sim, stats.total_nao, stats.total_talvez],
                    backgroundColor: ['#4CAF50', '#E57373', '#FFB74D'],
                    borderRadius: 8
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                plugins: {
                    legend: { position: 'bottom' }
                },
                scales: {
                    y: { beginAtZero: true, ticks: { stepSize: 1 } }
                }
            }
        });
        
        // Gráfico de percentuais
        let chart2 = Chart.getChart('percentualChart');
        if (chart2) chart2.destroy();
        
        new Chart(document.getElementById('percentualChart'), {
            type: 'pie',
            data: {
                labels: ['3%', '5%', '7%', '10%'],
                datasets: [{
                    data: [stats.percentuais['3'], stats.percentuais['5'], stats.percentuais['7'], stats.percentuais['10']],
                    backgroundColor: ['#1E88E5', '#4CAF50', '#FFB74D', '#2E8B57']
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                plugins: {
                    legend: { position: 'bottom' }
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
        
        if (respostas.length === 0) {
            tbody.innerHTML = '<tr><td colspan="7">Nenhuma resposta ainda. Compartilhe o formulário!</td></tr>';
        } else {
            respostas.reverse().forEach(r => {
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
        
    } catch (error) {
        console.error('Erro:', error);
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

// Verificar login ao carregar a página
document.addEventListener('DOMContentLoaded', function() {
    if (localStorage.getItem('admin_logado') === 'true') {
        document.getElementById('loginPanel').style.display = 'none';
        document.getElementById('dashboard').style.display = 'block';
        carregarDados();
    }
});