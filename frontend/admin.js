// Senha fixa (mude para a que quiser)
const SENHA_ADMIN = 'saude123';

function verificarSenha() {
    const senha = document.getElementById('adminPassword').value;
    if (senha === SENHA_ADMIN) {
        document.getElementById('loginPanel').style.display = 'none';
        document.getElementById('dashboard').style.display = 'block';
        carregarDados();
    } else {
        alert('Senha incorreta!');
    }
}

function logout() {
    document.getElementById('loginPanel').style.display = 'block';
    document.getElementById('dashboard').style.display = 'none';
    document.getElementById('adminPassword').value = '';
}

function carregarDados() {
    // Recuperar respostas do localStorage
    const respostas = JSON.parse(localStorage.getItem('respostas_saude_solidaria') || '[]');
    
    // Atualizar cards
    document.getElementById('totalRespostas').textContent = respostas.length;
    const totalSim = respostas.filter(r => r.participaria === 'sim').length;
    document.getElementById('totalSim').textContent = totalSim;
    
    // Média de dependentes
    let totalDependentes = 0;
    respostas.forEach(r => {
        totalDependentes += parseInt(r.qtd_filhos) || 0;
        totalDependentes += r.tem_conjuge === 'sim' ? 1 : 0;
    });
    const mediaDependentes = respostas.length > 0 ? (totalDependentes / respostas.length).toFixed(1) : 0;
    document.getElementById('mediaDependentes').textContent = mediaDependentes;
    
    // Gráfico de participação
    const participacaoContagem = {
        sim: respostas.filter(r => r.participaria === 'sim').length,
        nao: respostas.filter(r => r.participaria === 'nao').length,
        talvez: respostas.filter(r => r.participaria === 'talvez').length
    };
    
    new Chart(document.getElementById('participacaoChart'), {
        type: 'bar',
        data: {
            labels: ['Sim', 'Não', 'Talvez'],
            datasets: [{
                label: 'Número de respostas',
                data: [participacaoContagem.sim, participacaoContagem.nao, participacaoContagem.talvez],
                backgroundColor: ['#48bb78', '#e53e3e', '#ed8936']
            }]
        }
    });
    
    // Gráfico de percentual ideal
    const percentuais = { '3': 0, '5': 0, '7': 0, '10': 0 };
    respostas.forEach(r => {
        if (r.percentual_ideal && percentuais[r.percentual_ideal] !== undefined) {
            percentuais[r.percentual_ideal]++;
        }
    });
    
    new Chart(document.getElementById('percentualChart'), {
        type: 'pie',
        data: {
            labels: ['3%', '5%', '7%', '10%'],
            datasets: [{
                data: [percentuais['3'], percentuais['5'], percentuais['7'], percentuais['10']],
                backgroundColor: ['#4299e1', '#48bb78', '#ed8936', '#9f7aea']
            }]
        }
    });
    
    // Tabela de respostas
    const tbody = document.getElementById('tbodyRespostas');
    tbody.innerHTML = '';
    respostas.slice().reverse().forEach(r => {
        const row = tbody.insertRow();
        
        const salarioMap = {
            'ate_2000': 'Até R$ 2k',
            '2001_3000': 'R$ 2-3k',
            '3001_4000': 'R$ 3-4k',
            '4001_5000': 'R$ 4-5k',
            'acima_5000': 'Acima R$ 5k'
        };
        
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

function exportarCSV() {
    const respostas = JSON.parse(localStorage.getItem('respostas_saude_solidaria') || '[]');
    
    if (respostas.length === 0) {
        alert('Nenhuma resposta para exportar.');
        return;
    }
    
    let csv = '"Nome","Setor","Salário","Gasto Medicamento","Gasto Exame","Tem Cônjuge","Qtd Filhos","Participaria","% Ideal","Data"\n';
    
    const salarioMap = {
        'ate_2000': 'Até R$ 2.000',
        '2001_3000': 'R$ 2.001 a R$ 3.000',
        '3001_4000': 'R$ 3.001 a R$ 4.000',
        '4001_5000': 'R$ 4.001 a R$ 5.000',
        'acima_5000': 'Acima de R$ 5.000'
    };
    
    const gastoMap = {
        'nenhum': 'Nenhum',
        'ate_50': 'Até R$ 50',
        '51_100': 'R$ 51 a R$ 100',
        '101_200': 'R$ 101 a R$ 200',
        '201_500': 'R$ 201 a R$ 500',
        'acima_200': 'Acima de R$ 200',
        'acima_500': 'Acima de R$ 500'
    };
    
    respostas.forEach(r => {
        csv += `"${r.nome || 'Anônimo'}","${r.setor || ''}","${salarioMap[r.salario] || ''}","${gastoMap[r.gasto_medicamento] || ''}","${gastoMap[r.gasto_exame] || ''}","${r.tem_conjuge === 'sim' ? 'Sim' : 'Não'}","${r.qtd_filhos || 0}","${r.participaria === 'sim' ? 'Sim' : (r.participaria === 'nao' ? 'Não' : 'Talvez')}","${r.percentual_ideal || ''}%","${new Date(r.data).toLocaleDateString('pt-BR')}"\n`;
    });
    
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.href = url;
    link.setAttribute('download', 'respostas_saude_solidaria.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
}

// Se já estiver logado (para recarregar a página)
if (localStorage.getItem('admin_logado') === 'true') {
    document.getElementById('loginPanel').style.display = 'none';
    document.getElementById('dashboard').style.display = 'block';
    carregarDados();
}

function verificarSenha() {
    const senha = document.getElementById('adminPassword').value;
    if (senha === SENHA_ADMIN) {
        localStorage.setItem('admin_logado', 'true');
        document.getElementById('loginPanel').style.display = 'none';
        document.getElementById('dashboard').style.display = 'block';
        carregarDados();
    } else {
        alert('Senha incorreta!');
    }
}

function logout() {
    localStorage.removeItem('admin_logado');
    document.getElementById('loginPanel').style.display = 'block';
    document.getElementById('dashboard').style.display = 'none';
    document.getElementById('adminPassword').value = '';
}