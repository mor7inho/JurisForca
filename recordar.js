// ============================================================
// recordar.js — modo "flashcard" (inverso do jogo): mostra o
// termo e a pessoa tenta lembrar da descrição antes de revelar.
// Reaproveita obterBlocos, tituloLimpo, renderizarMarkdown e
// obterParametroURL de shared.js, e segue o mesmo padrão de fila
// por bloco com autoavaliação usado no jogo (script.js).
// ============================================================

document.addEventListener('DOMContentLoaded', () => {
    const blocos = obterBlocos();

    if (!blocos.length) {
        document.getElementById('cardBox').innerHTML = '<p class="empty-state">Nenhum conteúdo encontrado. Verifique se o arquivo dados.js foi carregado corretamente.</p>';
        return;
    }

    // ------------------------------------------------------------
    // ESTADO
    // ------------------------------------------------------------
    const estadoBlocos = blocos.map(() => null);
    let blocoAtual = 0;
    let filaAtual = [];
    let indiceFila = 0;
    let dominadosCount = 0;
    let termoAtual = null;
    let revelado = false;
    let aguardandoAutoavaliacao = false;
    let blocoFinalizado = false;

    // DOM
    const flashcardTerm = document.getElementById('flashcardTerm');
    const revealBtn = document.getElementById('revealBtn');
    const flashcardAnswer = document.getElementById('flashcardAnswer');
    const answerDescricao = document.getElementById('answerDescricao');
    const answerExplicacao = document.getElementById('answerExplicacao');
    const cardBox = document.getElementById('cardBox');
    const posPill = document.getElementById('posPill');
    const masteredPill = document.getElementById('masteredPill');
    const blockLabel = document.getElementById('blockLabel');
    const prevBlockBtn = document.getElementById('prevBlockBtn');
    const nextBlockBtn = document.getElementById('nextBlockBtn');
    const prevTermBtn = document.getElementById('prevTermBtn');
    const nextTermBtn = document.getElementById('nextTermBtn');
    const readBlockLink = document.getElementById('readBlockLink');
    const playBlockLink = document.getElementById('playBlockLink');
    const resultPanel = document.getElementById('resultPanel');
    const resultContent = document.getElementById('resultContent');

    function setResultado(html) {
        resultContent.innerHTML = html;
        if (html && html.trim()) {
            resultPanel.classList.add('has-content');
        } else {
            resultPanel.classList.remove('has-content');
        }
    }

    // ------------------------------------------------------------
    // NAVEGAÇÃO ENTRE BLOCOS
    // ------------------------------------------------------------
    function criarEstadoBloco(i) {
        return {
            fila: blocos[i].map(c => ({ ...c })),
            indice: 0,
            dominados: 0,
            finalizado: false
        };
    }

    function salvarEstadoAtual() {
        estadoBlocos[blocoAtual] = {
            fila: filaAtual,
            indice: indiceFila,
            dominados: dominadosCount,
            finalizado: blocoFinalizado
        };
    }

    function carregarBloco(i) {
        if (i < 0 || i >= blocos.length) return;
        if (estadoBlocos[blocoAtual]) salvarEstadoAtual();

        blocoAtual = i;
        if (!estadoBlocos[i]) estadoBlocos[i] = criarEstadoBloco(i);
        const estado = estadoBlocos[i];

        filaAtual = estado.fila;
        indiceFila = estado.indice;
        dominadosCount = estado.dominados;
        blocoFinalizado = estado.finalizado;
        aguardandoAutoavaliacao = false;
        revelado = false;

        blockLabel.textContent = `Bloco ${blocoAtual + 1}/${blocos.length}`;
        if (readBlockLink) readBlockLink.href = `leitura.html?bloco=${blocoAtual + 1}`;
        if (playBlockLink) playBlockLink.href = `jogo.html?bloco=${blocoAtual + 1}`;

        cardBox.hidden = false;
        if (blocoFinalizado || filaAtual.length === 0) {
            mostrarBlocoConcluido();
        } else {
            if (indiceFila >= filaAtual.length) indiceFila = filaAtual.length - 1;
            carregarTermo(filaAtual[indiceFila]);
        }
        atualizarProgresso();
    }

    function navegarBloco(direcao) {
        carregarBloco(blocoAtual + direcao);
    }

    function atualizarNavegacaoBloco() {
        prevBlockBtn.disabled = blocoAtual === 0;
        nextBlockBtn.disabled = blocoAtual === blocos.length - 1;
    }

    // ------------------------------------------------------------
    // CARTÃO ATUAL
    // ------------------------------------------------------------
    function carregarTermo(item) {
        termoAtual = item;
        revelado = false;
        aguardandoAutoavaliacao = false;

        flashcardTerm.textContent = tituloLimpo(item.termo);
        flashcardAnswer.hidden = true;
        answerDescricao.textContent = '';
        answerExplicacao.innerHTML = '';
        revealBtn.hidden = false;
        revealBtn.disabled = false;
        setResultado('');
        atualizarProgresso();
    }

    function revelarResposta() {
        if (!termoAtual || revelado) return;
        revelado = true;
        aguardandoAutoavaliacao = true;

        answerDescricao.textContent = termoAtual.descricao;
        answerExplicacao.innerHTML = renderizarMarkdown(termoAtual.explicacao);
        flashcardAnswer.hidden = false;
        revealBtn.hidden = true;
        atualizarProgresso();
    }

    function processarAutoavaliacao(avaliacao) {
        if (!aguardandoAutoavaliacao || !termoAtual) return;
        aguardandoAutoavaliacao = false;
        const item = termoAtual;
        const idx = filaAtual.findIndex(c => c.termo === item.termo);
        if (idx === -1) return;

        filaAtual.splice(idx, 1);

        if (avaliacao === 'domino') {
            dominadosCount++;
            if (indiceFila >= filaAtual.length) indiceFila = Math.max(0, filaAtual.length - 1);
        } else {
            filaAtual.push(item);
            if (indiceFila >= filaAtual.length) indiceFila = Math.max(0, filaAtual.length - 1);
        }

        if (filaAtual.length === 0) {
            finalizarBloco();
            return;
        }
        if (indiceFila >= filaAtual.length) indiceFila = filaAtual.length - 1;
        if (indiceFila < 0) indiceFila = 0;
        carregarTermo(filaAtual[indiceFila]);
    }

    function finalizarBloco() {
        blocoFinalizado = true;
        atualizarProgresso();
        mostrarBlocoConcluido();
    }

    function mostrarBlocoConcluido() {
        const totalBloco = blocos[blocoAtual].length;
        cardBox.hidden = true;
        prevTermBtn.disabled = true;
        nextTermBtn.disabled = true;
        const ultimoBloco = blocoAtual === blocos.length - 1;
        setResultado(`
            <div class="block-complete">🏆 Bloco recordado!</div>
            <div class="block-complete-sub">
                Todos os ${totalBloco} conceitos deste bloco foram revisados.
                ${ultimoBloco ? '<br>Você concluiu todos os blocos! 🎉' : '<br>Use a seta à direita para seguir para o próximo bloco.'}
            </div>
        `);
    }

    function navegarTermo(direcao) {
        if (blocoFinalizado || filaAtual.length === 0) return;
        if (aguardandoAutoavaliacao) return;
        const novoIndice = indiceFila + direcao;
        if (novoIndice < 0 || novoIndice >= filaAtual.length) return;
        indiceFila = novoIndice;
        carregarTermo(filaAtual[indiceFila]);
    }

    function atualizarProgresso() {
        const totalBloco = blocos[blocoAtual].length;
        if (!blocoFinalizado && filaAtual.length > 0) {
            posPill.textContent = `🧩 ${indiceFila + 1}/${filaAtual.length}`;
            prevTermBtn.disabled = aguardandoAutoavaliacao || indiceFila === 0;
            nextTermBtn.disabled = aguardandoAutoavaliacao || indiceFila >= filaAtual.length - 1;
        } else {
            posPill.textContent = `🧩 ${totalBloco}/${totalBloco}`;
            prevTermBtn.disabled = true;
            nextTermBtn.disabled = true;
        }
        masteredPill.textContent = `🎯 ${dominadosCount}/${totalBloco} dominados`;
        atualizarNavegacaoBloco();
    }

    // ------------------------------------------------------------
    // EVENTOS
    // ------------------------------------------------------------
    revealBtn.addEventListener('click', revelarResposta);

    document.querySelectorAll('#selfEvalRow [data-eval]').forEach(btn => {
        btn.addEventListener('click', (e) => processarAutoavaliacao(e.currentTarget.dataset.eval));
    });

    prevTermBtn.addEventListener('click', () => navegarTermo(-1));
    nextTermBtn.addEventListener('click', () => navegarTermo(1));
    prevBlockBtn.addEventListener('click', () => navegarBloco(-1));
    nextBlockBtn.addEventListener('click', () => navegarBloco(1));

    document.addEventListener('keydown', (e) => {
        if (e.key === 'ArrowLeft') { e.preventDefault(); navegarTermo(-1); }
        if (e.key === 'ArrowRight') { e.preventDefault(); navegarTermo(1); }
        if (e.key === ' ' || e.key === 'Enter') {
            if (!revelado && termoAtual) { e.preventDefault(); revelarResposta(); }
        }
    });

    // ------------------------------------------------------------
    // CONTROLE DE TAMANHO DE FONTE DA RESPOSTA
    // Reaproveita a mesma variável (--e-font-scale) e a mesma chave
    // de localStorage usadas na explicação do jogo e na leitura, para
    // que a preferência de tamanho seja consistente entre as páginas.
    // ------------------------------------------------------------
    const escalas = [1, 1.15, 1.3, 1.45];
    const chaveArmazenamento = 'forcaCarrossel_explFontScaleIndex';
    let indiceEscala = parseInt(localStorage.getItem(chaveArmazenamento), 10);
    if (isNaN(indiceEscala) || indiceEscala < 0 || indiceEscala >= escalas.length) {
        indiceEscala = 0;
    }

    const fontToggleBtn = document.getElementById('fontToggleBtn');
    const dots = document.querySelectorAll('#fontToggleDots span');

    function aplicarEscala() {
        document.documentElement.style.setProperty('--e-font-scale', escalas[indiceEscala]);
        localStorage.setItem(chaveArmazenamento, indiceEscala);
        dots.forEach((dot, idx) => dot.classList.toggle('active', idx <= indiceEscala));
    }

    if (fontToggleBtn) {
        fontToggleBtn.addEventListener('click', () => {
            indiceEscala = (indiceEscala + 1) % escalas.length;
            aplicarEscala();
        });
    }

    aplicarEscala();

    // ------------------------------------------------------------
    // INÍCIO — respeita ?bloco=N vindo de outra página
    // ------------------------------------------------------------
    const blocoParam = parseInt(obterParametroURL('bloco'), 10);
    const blocoInicial = (!isNaN(blocoParam) && blocoParam >= 1 && blocoParam <= blocos.length) ? (blocoParam - 1) : 0;
    carregarBloco(blocoInicial);
});
