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

// Função para converter opção em valor médio
function converterParaValor(opcao) {
    const mapa = {
        'nenhum': 0,
        'ate_50': 25,
        '51_100': 75,
        '101_200': 150,
        '201_500': 350,
        'acima_200': 300,
        'acima_500': 750,
        'ate_2000': 1500,
        '2001_3000': 2500,
        '3001_4000': 3500,
        '4001_5000': 4500,
        'acima_5000': 6000
    };
    return mapa[opcao] || 0;
}

// Envio do formulário
document.getElementById('surveyForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    // Coletar dados dos filhos
    const filhosGastos = [];
    const qtdFilhos = parseInt(document.getElementById('qtd_filhos').value) || 0;
    for (let i = 0; i < Math.min(qtdFilhos, 3); i++) {
        const select = document.getElementById(`gasto_filho_${i}`);
        if (select) {
            filhosGastos.push(select.value);
        }
    }
    
    // Montar objeto com os dados
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
        comentarios: document.getElementById('comentarios').value,
        data: new Date().toISOString()
    };
    
    // Validação básica
    if (!dados.setor || !dados.participaria || !dados.percentual_ideal) {
        mostrarMensagem('Por favor, preencha os campos obrigatórios.', 'error');
        return;
    }
    
    // Mostrar loading
    const btn = document.querySelector('.btn-submit');
    const textoOriginal = btn.textContent;
    btn.textContent = 'Enviando...';
    btn.disabled = true;
    
    try {
        // Salvar localmente (enquanto não temos backend)
        const respostas = JSON.parse(localStorage.getItem('respostas_saude_solidaria') || '[]');
        respostas.push(dados);
        localStorage.setItem('respostas_saude_solidaria', JSON.stringify(respostas));
        
        mostrarMensagem('✅ Resposta enviada com sucesso! Obrigado por participar.', 'success');
        document.getElementById('surveyForm').reset();
        
        // Limpar campos dinâmicos
        document.getElementById('filhos_info').innerHTML = '';
        document.getElementById('filhos_info').style.display = 'none';
        document.getElementById('conjuge_info').style.display = 'none';
        
    } catch (error) {
        console.error('Erro ao salvar:', error);
        mostrarMensagem('❌ Erro ao enviar. Tente novamente.', 'error');
    } finally {
        btn.textContent = textoOriginal;
        btn.disabled = false;
    }
});

function mostrarMensagem(msg, tipo) {
    const messageDiv = document.getElementById('message');
    messageDiv.textContent = msg;
    messageDiv.className = `message ${tipo}`;
    
    setTimeout(() => {
        messageDiv.className = 'message';
        messageDiv.style.display = 'none';
    }, 5000);
}