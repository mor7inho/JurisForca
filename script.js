
   
    

    // ------------------------------------------------------------
    // ALGORITMO DE DISTRIBUIÇÃO
    // ------------------------------------------------------------
    function distribuirBlocos(conceitos, tamanhoIdeal = 10) {
        const total = conceitos.length;
        if (total <= tamanhoIdeal) return [conceitos.slice()];
        let qtdBlocos = Math.ceil(total / tamanhoIdeal);
        let base = Math.floor(total / qtdBlocos);
        let resto = total % qtdBlocos;
        const blocos = [];
        let inicio = 0;
        for (let i = 0; i < qtdBlocos; i++) {
            let adicional = (i < resto) ? 1 : 0;
            let tamanho = base + adicional;
            if (i === qtdBlocos - 1) tamanho = total - inicio;
            blocos.push(conceitos.slice(inicio, inicio + tamanho));
            inicio += tamanho;
        }
        return blocos;
    }
    
    
    // ------------------------------------------------------------
    // FUNÇÃO PARA EXTRAIR A PALAVRA OCULTA DO TERMO
    // ------------------------------------------------------------
    function extrairPalavraOculta(termo) {
        // Busca o padrão [OCULTAR]palavra
        const match = termo.match(/\[OCULTAR\](\S+)/);
        if (match) {
            return match[1];
        }
        // Fallback: usa a palavra mais longa
        const palavras = termo.split(' ');
        let maior = '';
        for (const p of palavras) {
            if (p.length > maior.length) maior = p;
        }
        return maior;
    }

    function removerMarcaOcultar(termo) {
        return termo.replace(/\[OCULTAR\]/g, '');
    }

    // ------------------------------------------------------------
    // RENDERIZAÇÃO DE MARKDOWN (usada apenas na explicação)
    // ------------------------------------------------------------
    marked.setOptions({ breaks: true });

    function renderizarMarkdown(md) {
        if (!md) return '';
        const html = marked.parse(md);
        return DOMPurify.sanitize(html);
    }

    // ------------------------------------------------------------
    // NORMALIZAÇÃO DE TEXTO
    // ------------------------------------------------------------
    function normalizarTexto(texto) {
        return texto
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .replace(/[^a-zA-Z0-9\s]/g, '')
            .toLowerCase()
            .trim();
    }

    function compararTermos(resposta, termoCorreto) {
        return normalizarTexto(resposta) === normalizarTexto(termoCorreto);
    }

    // ------------------------------------------------------------
    // TRATAMENTO DE LETRAS ACENTUADAS
    // ------------------------------------------------------------
    function normalizarLetra(letra) {
        return letra
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .toUpperCase();
    }

    function letrasCorrespondentes(letra) {
        const mapa = {
            'A': ['A', 'Á', 'À', 'Ã', 'Â', 'Ä'],
            'E': ['E', 'É', 'È', 'Ê', 'Ë'],
            'I': ['I', 'Í', 'Ì', 'Î', 'Ï'],
            'O': ['O', 'Ó', 'Ò', 'Õ', 'Ô', 'Ö'],
            'U': ['U', 'Ú', 'Ù', 'Û', 'Ü'],
            'C': ['C', 'Ç']
        };
        const chave = normalizarLetra(letra);
        return mapa[chave] || [letra.toUpperCase()];
    }

    // ------------------------------------------------------------
    // FUNÇÃO PRINCIPAL: OMITE A PALAVRA MARCADA
    // ------------------------------------------------------------
    function renderizarPalavraComOmissaoInteligente(termo, letrasUsadas, termoRevelado) {
        // Remove a marcação para exibição
        const termoLimpo = removerMarcaOcultar(termo);
        const palavras = termoLimpo.split(' ');
        const palavraOculta = extrairPalavraOculta(termo);
        
        // Encontra o índice da palavra oculta
        let indiceOculto = -1;
        for (let i = 0; i < palavras.length; i++) {
            // Remove pontuação para comparação
            const pLimpa = palavras[i].replace(/[^a-zA-ZÀ-ÿ]/g, '');
            if (pLimpa.toLowerCase() === palavraOculta.toLowerCase()) {
                indiceOculto = i;
                break;
            }
        }
        
        // Se não encontrou, usa a mais longa (fallback)
        if (indiceOculto === -1) {
            let maior = 0;
            for (let i = 0; i < palavras.length; i++) {
                if (palavras[i].length > palavras[maior].length) maior = i;
            }
            indiceOculto = maior;
        }
        
        let html = '';
        palavras.forEach((palavra, idx) => {
            const isOculta = (idx === indiceOculto);
            
            if (isOculta) {
                // Palavra oculta
                html += `<span class="word-group hidden">`;
                for (let i = 0; i < palavra.length; i++) {
                    const letra = palavra[i];
                    // Verifica se é caractere especial (pontuação)
                    if (!/[a-zA-ZÀ-ÿ]/.test(letra)) {
                        html += `<span class="letter-slot filled" style="border-bottom-color: transparent; color: #2c2c3a;">${letra}</span>`;
                        continue;
                    }
                    
                    let revelada = false;
                    if (termoRevelado) {
                        revelada = true;
                    } else {
                        for (const usada of letrasUsadas) {
                            const variacoes = letrasCorrespondentes(usada);
                            if (variacoes.includes(letra.toUpperCase())) {
                                revelada = true;
                                break;
                            }
                        }
                    }
                    
                    const classe = revelada ? 'letter-slot filled' : 'letter-slot';
                    const conteudo = revelada ? letra.toUpperCase() : '_';
                    html += `<span class="${classe}">${conteudo}</span>`;
                }
                html += `</span>`;
            } else {
                // Palavra revelada
                html += `<span class="word-group revealed">`;
                for (let i = 0; i < palavra.length; i++) {
                    const letra = palavra[i];
                    html += `<span class="letter-slot filled" style="border-bottom-color: #2b7a4b; color: #2b7a4b;">${letra.toUpperCase()}</span>`;
                }
                html += `</span>`;
            }
            
            if (idx < palavras.length - 1) {
                html += `<span class="space-slot"></span>`;
            }
        });

        return html;
    }

    // ------------------------------------------------------------
    // ESTADO
    // ------------------------------------------------------------
    const blocos = distribuirBlocos(CONCEITOS_RAW, 10);
    const estadoBlocos = blocos.map(() => null);
    let blocoAtual = 0;
    let filaAtual = [];
    let indiceFila = 0;
    let dominadosCount = 0;
    let termoAtual = null;
    let letrasUsadas = new Set();
    let errosFeitos = 0;
    const MAX_ERROS = 3;
    let jogoFinalizado = false;
    let aguardandoAutoavaliacao = false;
    let termoRevelado = false;
    let tentativaPalavraUsada = false;
    let letrasErradas = new Set();
    let palavraOcultaAtual = '';

    // DOM
    const descriptionText = document.getElementById('descriptionText');
    const wordDisplay = document.getElementById('wordDisplay');
    const heartsDisplay = document.getElementById('heartsDisplay');
    const letterGrid = document.getElementById('letterGrid');
    const answerInput = document.getElementById('answerInput');
    const submitWordBtn = document.getElementById('submitWordBtn');
    const resultPanel = document.getElementById('resultPanel');
    const resultContent = document.getElementById('resultContent');
    const posPill = document.getElementById('posPill');
    const masteredPill = document.getElementById('masteredPill');
    const blockLabel = document.getElementById('blockLabel');
    const prevBlockBtn = document.getElementById('prevBlockBtn');
    const nextBlockBtn = document.getElementById('nextBlockBtn');
    const prevTermBtn = document.getElementById('prevTermBtn');
    const nextTermBtn = document.getElementById('nextTermBtn');

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
            finalizado: jogoFinalizado
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
        jogoFinalizado = estado.finalizado;
        aguardandoAutoavaliacao = false;
        termoRevelado = false;

        blockLabel.textContent = `Bloco ${blocoAtual + 1}/${blocos.length}`;

        if (jogoFinalizado || filaAtual.length === 0) {
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
    // FUNÇÕES PRINCIPAIS
    // ------------------------------------------------------------
    function carregarTermo(item) {
        termoAtual = item;
        termoRevelado = false;
        aguardandoAutoavaliacao = false;
        letrasUsadas = new Set();
        letrasErradas = new Set();
        errosFeitos = 0;
        tentativaPalavraUsada = false;

        // PALAVRA OCULTA: extrai da marcação [OCULTAR]
        palavraOcultaAtual = extrairPalavraOculta(item.termo);

        // Descrição usa o termo sem a marcação
        descriptionText.textContent = item.descricao;
        
        answerInput.value = '';
        answerInput.disabled = false;
        submitWordBtn.disabled = false;
        answerInput.placeholder = 'Digite a palavra que falta...';

        renderizarPalavra();
        renderizarLetras();
        renderizarCoracoes();
        setResultado('');
        habilitarInput(true);
        atualizarProgresso();
    }

    function renderizarPalavra() {
        if (!termoAtual) return;
        const html = renderizarPalavraComOmissaoInteligente(
            termoAtual.termo,
            letrasUsadas,
            termoRevelado
        );
        wordDisplay.innerHTML = html;
        ajustarFonteWordGroups();
    }

    // ------------------------------------------------------------
    // AJUSTE DE FONTE PARA PALAVRAS OCULTAS MUITO LONGAS
    // Atua apenas dentro de #wordDisplay, e apenas nos grupos
    // (.word-group) que ultrapassam a largura disponível — não
    // afeta o restante da página nem força a frase inteira numa
    // única linha (o wrap normal da frase é preservado).
    // ------------------------------------------------------------
    function ajustarFonteWordGroups() {
        const containerWidth = wordDisplay.clientWidth;
        if (!containerWidth) return;

        wordDisplay.querySelectorAll('.word-group').forEach(grupo => {
            grupo.style.fontSize = '';
            grupo.classList.remove('wrap-line');

            // Encolhe moderadamente (até 75%) antes de recorrer à quebra de linha
            let escala = 100;
            const MIN_ESCALA = 75;
            while (grupo.scrollWidth > containerWidth && escala > MIN_ESCALA) {
                escala -= 5;
                grupo.style.fontSize = escala + '%';
            }

            // Se mesmo reduzida ainda não coube numa linha, permite quebrar
            // internamente e destaca com cor diferente, voltando ao tamanho normal
            if (grupo.scrollWidth > containerWidth) {
                grupo.style.fontSize = '';
                grupo.classList.add('wrap-line');
            }
        });
    }

    function renderizarCoracoes() {
        let html = '';
        for (let i = 0; i < MAX_ERROS; i++) {
            const perdido = i < errosFeitos;
            html += `<span class="heart ${perdido ? 'lost' : ''}">${perdido ? '🖤' : '❤️'}</span>`;
        }
        heartsDisplay.innerHTML = html;
    }

    function renderizarLetras() {
        const letras = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
        letterGrid.innerHTML = '';
        letras.forEach(letra => {
            const btn = document.createElement('button');
            btn.className = 'letter-btn';
            btn.textContent = letra;
            
            let usada = false;
            for (const usadaLetra of letrasUsadas) {
                const variacoes = letrasCorrespondentes(usadaLetra);
                if (variacoes.includes(letra)) {
                    usada = true;
                    break;
                }
            }
            
            let isWrong = false;
            for (const errada of letrasErradas) {
                const variacoes = letrasCorrespondentes(errada);
                if (variacoes.includes(letra)) {
                    isWrong = true;
                    break;
                }
            }
            
            if (isWrong && !usada) {
                btn.classList.add('wrong');
            }
            
            const disabled = usada || jogoFinalizado || aguardandoAutoavaliacao || termoRevelado;
            btn.disabled = disabled;
            btn.addEventListener('click', () => tentarLetra(letra));
            letterGrid.appendChild(btn);
        });
    }

    function tentarLetra(letra) {
        if (aguardandoAutoavaliacao || jogoFinalizado || termoRevelado) return;
        
        // Verifica se a letra já foi usada
        for (const usada of letrasUsadas) {
            const variacoes = letrasCorrespondentes(usada);
            if (variacoes.includes(letra.toUpperCase())) return;
        }
        
        // Verifica se a letra está ERRADA (não existe na palavra oculta)
        let existe = false;
        for (const char of palavraOcultaAtual) {
            const variacoes = letrasCorrespondentes(letra);
            if (variacoes.includes(char.toUpperCase())) {
                existe = true;
                break;
            }
        }
        
        if (!existe) {
            letrasErradas.add(letra.toUpperCase());
            errosFeitos++;
            renderizarCoracoes();
            renderizarLetras();
            
            if (errosFeitos >= MAX_ERROS) {
                termoRevelado = true;
                renderizarPalavra();
                mostrarResultado(false);
            }
            return;
        }
        
        // Letra existe - adiciona às usadas
        letrasUsadas.add(letra.toUpperCase());
        
        // Verifica se a palavra oculta foi completamente revelada
        let todasReveladas = true;
        for (const char of palavraOcultaAtual) {
            let encontrado = false;
            for (const usada of letrasUsadas) {
                const variacoes = letrasCorrespondentes(usada);
                if (variacoes.includes(char.toUpperCase())) {
                    encontrado = true;
                    break;
                }
            }
            if (!encontrado) {
                todasReveladas = false;
                break;
            }
        }
        
        renderizarPalavra();
        renderizarLetras();
        
        if (todasReveladas) {
            termoRevelado = true;
            mostrarResultado(true);
        }
    }

    function tentarPalavraCompleta() {
        if (aguardandoAutoavaliacao || jogoFinalizado || termoRevelado) return;
        if (tentativaPalavraUsada) {
            setResultado(`<span style="color: #b68b5c;">⚠️ Você já usou sua tentativa para este termo.</span>`);
            return;
        }
        
        const resposta = answerInput.value.trim();
        if (!resposta) {
            setResultado(`<span style="color: #b34a4a;">⚠️ Digite a palavra que falta.</span>`);
            return;
        }
        
        tentativaPalavraUsada = true;

        if (compararTermos(resposta, palavraOcultaAtual)) {
            termoRevelado = true;
            for (let char of palavraOcultaAtual) {
                if (char !== ' ') {
                    const normalizado = normalizarLetra(char);
                    letrasUsadas.add(normalizado);
                }
            }
            renderizarPalavra();
            renderizarLetras();
            mostrarResultado(true);
        } else {
            termoRevelado = true;
            for (let char of palavraOcultaAtual) {
                if (char !== ' ') {
                    const normalizado = normalizarLetra(char);
                    letrasUsadas.add(normalizado);
                }
            }
            renderizarPalavra();
            renderizarLetras();
            
            const termoExibicao = removerMarcaOcultar(termoAtual.termo);
            setResultado(`
                <span style="color: #b34a4a;">❌ Palavra incorreta!</span>
                <div style="margin-top:4px;"><span class="term-display">${termoExibicao.toUpperCase()}</span></div>
                <div class="explanation">${renderizarMarkdown(termoAtual.explicacao)}</div>
                <div class="self-eval">
                    <button class="btn btn-success" data-eval="domino">🟢 Domino</button>
                    <button class="btn btn-warning" data-eval="maisomenos">🟡 Mais ou menos</button>
                    <button class="btn btn-danger" data-eval="naodomino">🔴 Não domino</button>
                </div>
            `);
            document.querySelectorAll('[data-eval]').forEach(btn => {
                btn.addEventListener('click', (e) => processarAutoavaliacao(e.target.dataset.eval));
            });
            answerInput.disabled = true;
            submitWordBtn.disabled = true;
            habilitarInput(false);
            renderizarLetras();
            aguardandoAutoavaliacao = true;
        }
    }

    function mostrarResultado(acertou) {
        aguardandoAutoavaliacao = true;
        const termoExibicao = removerMarcaOcultar(termoAtual.termo);
        const explicacao = termoAtual.explicacao;
        const emoji = acertou ? '✅' : '❌';
        const status = acertou ? 'Acertou!' : 'Errou!';
        const statusClass = acertou ? 'correct' : 'wrong';

        // Revela todas as letras da palavra oculta
        for (let char of palavraOcultaAtual) {
            if (char !== ' ') {
                const normalizado = normalizarLetra(char);
                letrasUsadas.add(normalizado);
            }
        }
        renderizarPalavra();
        renderizarLetras();

        setResultado(`
            <div>
                <div><span class="${statusClass}">${emoji} ${status}</span> <span class="term-display">${termoExibicao.toUpperCase()}</span></div>
                <div class="explanation">${renderizarMarkdown(explicacao)}</div>
                <div class="self-eval">
                    <button class="btn btn-success" data-eval="domino">🟢 Domino</button>
                    <button class="btn btn-warning" data-eval="maisomenos">🟡 Mais ou menos</button>
                    <button class="btn btn-danger" data-eval="naodomino">🔴 Não domino</button>
                </div>
            </div>
        `);
        document.querySelectorAll('[data-eval]').forEach(btn => {
            btn.addEventListener('click', (e) => processarAutoavaliacao(e.target.dataset.eval));
        });
        answerInput.disabled = true;
        submitWordBtn.disabled = true;
        habilitarInput(false);
        renderizarLetras();
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
        habilitarInput(true);
    }

    function finalizarBloco() {
        jogoFinalizado = true;
        atualizarProgresso();
        mostrarBlocoConcluido();
    }

    function mostrarBlocoConcluido() {
        const totalBloco = blocos[blocoAtual].length;
        descriptionText.textContent = '';
        wordDisplay.innerHTML = '';
        letterGrid.innerHTML = '';
        heartsDisplay.innerHTML = '';
        answerInput.disabled = true;
        submitWordBtn.disabled = true;
        prevTermBtn.disabled = true;
        nextTermBtn.disabled = true;
        const ultimoBloco = blocoAtual === blocos.length - 1;
        setResultado(`
            <div class="block-complete">🏆 Bloco concluído!</div>
            <div class="block-complete-sub">
                Todos os ${totalBloco} conceitos deste bloco foram dominados.
                ${ultimoBloco ? '<br>Você concluiu todos os blocos! 🎉' : '<br>Use a seta à direita para seguir para o próximo bloco.'}
            </div>
        `);
    }

    function habilitarInput(habilitado) {
        const enabled = habilitado && !jogoFinalizado && !aguardandoAutoavaliacao && !termoRevelado;
        if (enabled && !tentativaPalavraUsada) {
            answerInput.disabled = false;
            submitWordBtn.disabled = false;
        } else {
            answerInput.disabled = true;
            submitWordBtn.disabled = true;
        }
    }

    function navegarTermo(direcao) {
        if (jogoFinalizado || filaAtual.length === 0) return;
        if (aguardandoAutoavaliacao) return;
        const novoIndice = indiceFila + direcao;
        if (novoIndice < 0 || novoIndice >= filaAtual.length) return;
        indiceFila = novoIndice;
        carregarTermo(filaAtual[indiceFila]);
    }

    function atualizarProgresso() {
        const totalBloco = blocos[blocoAtual].length;
        if (!jogoFinalizado && filaAtual.length > 0) {
            posPill.textContent = `🧩 ${indiceFila + 1}/${filaAtual.length}`;
            prevTermBtn.disabled = indiceFila === 0;
            nextTermBtn.disabled = indiceFila >= filaAtual.length - 1;
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
    document.addEventListener('keydown', (e) => {
        if (e.target === answerInput) return;
        const key = e.key.toUpperCase();
        if (key.length === 1 && key >= 'A' && key <= 'Z') {
            e.preventDefault();
            tentarLetra(key);
        }
        if (e.key === 'ArrowLeft') { e.preventDefault(); navegarTermo(-1); }
        if (e.key === 'ArrowRight') { e.preventDefault(); navegarTermo(1); }
    });

    submitWordBtn.addEventListener('click', tentarPalavraCompleta);
    answerInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') { e.preventDefault(); tentarPalavraCompleta(); }
    });

    prevTermBtn.addEventListener('click', () => navegarTermo(-1));
    nextTermBtn.addEventListener('click', () => navegarTermo(1));
    prevBlockBtn.addEventListener('click', () => navegarBloco(-1));
    nextBlockBtn.addEventListener('click', () => navegarBloco(1));

    // ------------------------------------------------------------
    // CONTROLE DE TAMANHO DE FONTE DA PERGUNTA
    // ------------------------------------------------------------
    (function() {
        const escalas = [1, 1.2, 1.4, 1.6];
        const chaveArmazenamento = 'forcaCarrossel_fontScaleIndex';
        let indiceEscala = parseInt(localStorage.getItem(chaveArmazenamento), 10);
        if (isNaN(indiceEscala) || indiceEscala < 0 || indiceEscala >= escalas.length) {
            indiceEscala = 0;
        }

        const fontToggleBtn = document.getElementById('fontToggleBtn');
        const dots = document.querySelectorAll('#fontToggleDots span');

        function aplicarEscala() {
            document.documentElement.style.setProperty('--q-font-scale', escalas[indiceEscala]);
            localStorage.setItem(chaveArmazenamento, indiceEscala);
            dots.forEach((dot, i) => dot.classList.toggle('active', i <= indiceEscala));
        }

        fontToggleBtn.addEventListener('click', () => {
            indiceEscala = (indiceEscala + 1) % escalas.length;
            aplicarEscala();
        });

        aplicarEscala();
    })();

    // Reajusta o tamanho da(s) palavra(s) oculta(s) longa(s) ao
    // redimensionar/girar a tela. Não afeta nenhum outro elemento.
    let resizeTimeoutWordDisplay = null;
    window.addEventListener('resize', () => {
        clearTimeout(resizeTimeoutWordDisplay);
        resizeTimeoutWordDisplay = setTimeout(ajustarFonteWordGroups, 150);
    });

    carregarBloco(0);
