// ============================================================
// leitura.js — monta a página de leitura geral, permitindo
// escolher quais blocos exibir, e controla o tamanho de fonte
// da leitura e o botão de voltar ao topo.
// Usa obterBlocos, tituloLimpo, renderizarMarkdown e
// obterParametroURL de shared.js.
// ============================================================

document.addEventListener('DOMContentLoaded', () => {
    const blocos = obterBlocos();
    const main = document.getElementById('readingContent');
    const jumpLinks = document.getElementById('blockJumpLinks');
    const selectList = document.getElementById('blockSelectList');
    const selectAllBtn = document.getElementById('selectAllBtn');
    const selectNoneBtn = document.getElementById('selectNoneBtn');

    if (!blocos.length) {
        main.innerHTML = '<p class="empty-state">Nenhum conteúdo encontrado. Verifique se o arquivo dados.js foi carregado corretamente.</p>';
        return;
    }

    const chaveSelecao = 'forcaCarrossel_leituraBlocosSelecionados';

    // ------------------------------------------------------------
    // Define a seleção inicial de blocos:
    // - se veio de um link com ?bloco=N, seleciona só aquele bloco;
    // - caso contrário, usa a última seleção salva;
    // - se não houver nada salvo ainda, seleciona todos os blocos.
    // ------------------------------------------------------------
    const blocoParam = parseInt(obterParametroURL('bloco'), 10);
    const veioDeParametro = !isNaN(blocoParam) && blocoParam >= 1 && blocoParam <= blocos.length;

    let selecionados;
    if (veioDeParametro) {
        selecionados = new Set([blocoParam]);
    } else {
        let salvo = null;
        try {
            salvo = JSON.parse(localStorage.getItem(chaveSelecao));
        } catch (e) {}
        if (Array.isArray(salvo) && salvo.length) {
            selecionados = new Set(salvo.filter(n => n >= 1 && n <= blocos.length));
        }
        if (!selecionados || !selecionados.size) {
            selecionados = new Set(blocos.map((_, i) => i + 1));
        }
    }

    function salvarSelecao() {
        try {
            localStorage.setItem(chaveSelecao, JSON.stringify([...selecionados]));
        } catch (e) {}
    }

    // ------------------------------------------------------------
    // Checkboxes de seleção de bloco
    // ------------------------------------------------------------
    function montarSeletor() {
        selectList.innerHTML = '';
        blocos.forEach((bloco, i) => {
            const numero = i + 1;
            const label = document.createElement('label');
            label.className = 'block-select-item';
            label.innerHTML = `
                <input type="checkbox" value="${numero}" ${selecionados.has(numero) ? 'checked' : ''}>
                <span>Bloco ${numero}</span>
            `;
            label.classList.toggle('checked', selecionados.has(numero));

            const checkbox = label.querySelector('input');
            checkbox.addEventListener('change', () => {
                if (checkbox.checked) {
                    selecionados.add(numero);
                } else {
                    selecionados.delete(numero);
                }
                label.classList.toggle('checked', checkbox.checked);
                salvarSelecao();
                montarLeitura();
            });

            selectList.appendChild(label);
        });
    }

    // ------------------------------------------------------------
    // Renderiza os blocos escolhidos no conteúdo de leitura
    // ------------------------------------------------------------
    function montarLeitura() {
        main.innerHTML = '';
        jumpLinks.innerHTML = '';

        const numerosSelecionados = blocos
            .map((_, i) => i + 1)
            .filter(numero => selecionados.has(numero));

        if (!numerosSelecionados.length) {
            main.innerHTML = '<p class="empty-state">Nenhum bloco selecionado. Marque ao menos um bloco acima para começar a leitura.</p>';
            return;
        }

        numerosSelecionados.forEach((numero) => {
            const bloco = blocos[numero - 1];
            const anchorId = `bloco-${numero}`;

            const link = document.createElement('a');
            link.href = `#${anchorId}`;
            link.className = 'pill pill-link';
            link.textContent = `Bloco ${numero}`;
            jumpLinks.appendChild(link);

            const section = document.createElement('section');
            section.className = 'block-section';
            section.id = anchorId;

            const header = document.createElement('div');
            header.className = 'block-section-header';
            header.innerHTML = `
                <h2>Bloco ${numero}</h2>
                <span class="pill">${bloco.length} termos</span>
                <a class="btn btn-outline btn-sm" href="jogo.html?bloco=${numero}">🎮 Estudar este bloco</a>
            `;
            section.appendChild(header);

            bloco.forEach((item) => {
                const article = document.createElement('article');
                article.className = 'term-card';
                article.innerHTML = `
                    <h3 class="term-card-title">${tituloLimpo(item.termo)}</h3>
                    <p class="term-card-desc">${item.descricao}</p>
                    <div class="explanation">${renderizarMarkdown(item.explicacao)}</div>
                `;
                section.appendChild(article);
            });

            main.appendChild(section);
        });
    }

    montarSeletor();
    montarLeitura();

    selectAllBtn.addEventListener('click', () => {
        selecionados = new Set(blocos.map((_, i) => i + 1));
        salvarSelecao();
        montarSeletor();
        montarLeitura();
    });

    selectNoneBtn.addEventListener('click', () => {
        selecionados = new Set();
        salvarSelecao();
        montarSeletor();
        montarLeitura();
    });

    // Se veio de um link com ?bloco=N (a partir da página inicial ou do
    // jogo), rola suavemente até a seção correspondente.
    if (veioDeParametro) {
        const alvo = document.getElementById(`bloco-${blocoParam}`);
        if (alvo) {
            setTimeout(() => alvo.scrollIntoView({ behavior: 'smooth', block: 'start' }), 60);
        }
    }

    // ------------------------------------------------------------
    // CONTROLE DE TAMANHO DE FONTE DA LEITURA
    // Reaproveita a mesma variável (--e-font-scale) e a mesma chave
    // de localStorage usadas pela explicação dentro do jogo, para
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
    // BOTÃO DE VOLTAR AO TOPO
    // Aparece depois de rolar um pouco a página e leva de volta
    // suavemente ao início.
    // ------------------------------------------------------------
    const scrollTopBtn = document.getElementById('scrollTopBtn');
    if (scrollTopBtn) {
        const atualizarVisibilidade = () => {
            scrollTopBtn.classList.toggle('visible', window.scrollY > 400);
        };
        window.addEventListener('scroll', atualizarVisibilidade, { passive: true });
        atualizarVisibilidade();

        scrollTopBtn.addEventListener('click', () => {
            window.scrollTo({ top: 0, behavior: 'smooth' });
        });
    }
});
