// Buscar números reais do backend
async function carregarEstatisticas() {
    try {
        const response = await fetch('https://saude-solidaria-api.onrender.com/api/estatisticas');
        if (response.ok) {
            const stats = await response.json();
            document.getElementById('totalRespostas').textContent = stats.total || 0;
            document.getElementById('totalSim').textContent = stats.total_sim || 0;
        } else {
            document.getElementById('totalRespostas').textContent = '...';
            document.getElementById('totalSim').textContent = '...';
        }
    } catch (error) {
        console.log('Aguardando conexão com o servidor...');
        document.getElementById('totalRespostas').textContent = 'carregando';
        document.getElementById('totalSim').textContent = 'carregando';
    }
}

// Animação suave ao rolar
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            target.scrollIntoView({ behavior: 'smooth' });
        }
    });
});

// Efeito de fade-in nos cards ao rolar
const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.style.opacity = '1';
            entry.target.style.transform = 'translateY(0)';
        }
    });
});

document.querySelectorAll('.benefit-card, .step').forEach(card => {
    card.style.opacity = '0';
    card.style.transform = 'translateY(20px)';
    card.style.transition = 'all 0.5s ease';
    observer.observe(card);
});

// Carregar estatísticas ao iniciar
carregarEstatisticas();