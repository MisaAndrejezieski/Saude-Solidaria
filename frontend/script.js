const API_URL = 'https://saude-solidaria-api.onrender.com';

console.log('🚀 Script do formulário carregado');

// Mostrar/esconder campos de dependentes
document.getElementById('tem_conjuge').addEventListener('change', function() {
    const conjugeDiv = document.getElementById('conjuge_info');
    conjugeDiv.style.display = this.value === 'sim' ? 'block' : 'none';
});

document.getElementById('qtd_filhos').addEventListener('change', function() {
    const qtd = parseInt(this.value) || 0;
    const container = document.getElementById('filhos_info');
    container.innerHTML = '';
    
    if (qtd > 0) {
        container.style.display = 'block';
        for (let i = 0; i < Math.min(qtd, 3); i++) {
            container.innerHTML += `
                <div class="filho-item">
                    <label>Filho(a) ${i+1}</label>
                    <select id="gasto_filho_${i}" class="gasto-filho">
                        <option value="nenhum">Sem gastos com saúde</option>
                        <option value="ate_50">Até R$ 50/mês</option>
                        <option value="51_100">R$ 51 a R$ 100/mês</option>
                        <option value="101_200">R$ 101 a R$ 200/mês</option>
                        <option value="acima_200">Acima de R$ 200/mês</option>
                    </select>
                </div>
            `;
        }
    } else {
        container.style.display = 'none';
    }
});

// Função para converter opção em valor médio (usada para estatísticas)
function converterParaValor(opcao) {
    const mapa = {
        'nenhum': 0,
        'ate_50': 25,
        '51_100': 75,
        '101_200': 150,
        '201_500': 350,
        'acima_200': 300,
        'acima_500': 750
    };
    return mapa[opcao] || 0;
}

// Envio do formulário
document.getElementById('surveyForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    console.log('📝 Formulário enviado!');
    
    // Coletar dados dos filhos
    const filhosGastos = [];
    const qtdFilhos = parseInt(document.getElementById('qtd_filhos').value) || 0;
    for (let i = 0; i < Math.min(qtdFilhos, 3); i++) {
        const select = document.getElementById(`gasto_filho_${i}`);
        if (select) {
            filhosGastos.push(select.value);
        }
    }
    
    // Montar objeto com os dados (mesmo formato que funciona no console)
    const dados = {
        nome: document.getElementById('nome').value || 'Anônimo',
        setor: document.getElementById('setor').value,
        salario: document.getElementById('salario').value,
        gasto_medicamento: document.getElementById('gasto_medicamento').value,
        gasto_exame: document.getElementById('gasto_exame').value,
        tem_conjuge: document.getElementById('tem_conjuge').value,
        gasto_conjuge: document.getElementById('gasto_conjuge')?.value || 'nenhum',
        qtd_filhos: qtdFilhos.toString(),
        gastos_filhos: filhosGastos,
        participaria: document.getElementById('participaria').value,
        percentual_ideal: document.getElementById('percentual_ideal').value,
        comentarios: document.getElementById('comentarios').value
    };
    
    console.log('📦 Dados a enviar:', dados);
    
    // Validação básica
    if (!dados.setor || !dados.participaria || !dados.percentual_ideal) {
        mostrarMensagem('❌ Por favor, preencha os campos obrigatórios.', 'error');
        return;
    }
    
    // Mostrar loading
    const btn = document.querySelector('.btn-submit');
    const textoOriginal = btn.textContent;
    btn.textContent = 'Enviando...';
    btn.disabled = true;
    
    try {
        const response = await fetch(`${API_URL}/api/respostas`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(dados)
        });
        
        console.log('📡 Status da resposta:', response.status);
        
        if (response.ok) {
            const result = await response.json();
            console.log('✅ Resposta salva! ID:', result.id);
            mostrarMensagem(`✅ Resposta enviada com sucesso! ID: ${result.id}`, 'success');
            
            // Limpar formulário
            document.getElementById('surveyForm').reset();
            document.getElementById('filhos_info').innerHTML = '';
            document.getElementById('filhos_info').style.display = 'none';
            document.getElementById('conjuge_info').style.display = 'none';
        } else {
            const error = await response.text();
            console.error('❌ Erro do servidor:', error);
            mostrarMensagem('❌ Erro ao enviar. Tente novamente.', 'error');
        }
    } catch (error) {
        console.error('❌ Erro de rede:', error);
        mostrarMensagem('❌ Erro de conexão. Verifique sua internet.', 'error');
    } finally {
        btn.textContent = textoOriginal;
        btn.disabled = false;
    }
});

function mostrarMensagem(msg, tipo) {
    const messageDiv = document.getElementById('message');
    messageDiv.textContent = msg;
    messageDiv.className = `message ${tipo}`;
    messageDiv.style.display = 'block';
    
    setTimeout(() => {
        messageDiv.style.display = 'none';
    }, 5000);
}