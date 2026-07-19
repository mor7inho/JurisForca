// ============================================================
// inicio.js — monta o menu de blocos da página inicial.
// Usa distribuirBlocos/obterBlocos e tituloLimpo de shared.js.
// ============================================================

document.addEventListener('DOMContentLoaded', () => {
    const blocos = obterBlocos();
    const container = document.getElementById('blockList');
    const totalTermosPill = document.getElementById('totalTermosPill');
    const totalBlocosPill = document.getElementById('totalBlocosPill');

    if (!blocos.length) {
        container.innerHTML = '<p class="empty-state">Nenhum conteúdo encontrado. Verifique se o arquivo dados.js foi carregado corretamente.</p>';
        return;
    }

    const totalTermos = blocos.reduce((soma, bloco) => soma + bloco.length, 0);
    if (totalTermosPill) totalTermosPill.textContent = `📚 ${totalTermos} termos`;
    if (totalBlocosPill) totalBlocosPill.textContent = `🧱 ${blocos.length} blocos`;

    blocos.forEach((bloco, i) => {
        const numero = i + 1;
        const primeiro = tituloLimpo(bloco[0].termo);
        const ultimo = tituloLimpo(bloco[bloco.length - 1].termo);
        const faixa = bloco.length > 1 ? `${primeiro} → ${ultimo}` : primeiro;

        const card = document.createElement('div');
        card.className = 'block-card';
        card.innerHTML = `
            <div class="block-card-header">
                <span class="block-card-number">Bloco ${numero}</span>
                <span class="pill">${bloco.length} termos</span>
            </div>
            <div class="block-card-range">${faixa}</div>
            <div class="block-card-actions">
                <a class="btn" href="jogo.html?bloco=${numero}">🎮 Estudar</a>
                <a class="btn btn-outline" href="leitura.html?bloco=${numero}">📖 Ler</a>
                <a class="btn btn-outline" href="recordar.html?bloco=${numero}">🧠 Recordar</a>
            </div>
        `;
        container.appendChild(card);
    });
});
