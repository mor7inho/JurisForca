// ============================================================
// shared.js — funções e utilitários compartilhados entre as
// páginas do Juris Forca (início, jogo e leitura).
//
// Depende de:
//  - dados.js carregado ANTES deste arquivo (expõe CONCEITOS_RAW)
//  - marked.js + DOMPurify carregados ANTES deste arquivo, apenas
//    nas páginas que renderizam markdown (jogo e leitura)
// ============================================================

// ------------------------------------------------------------
// CONFIGURAÇÃO: quantidade ideal de termos por bloco.
// Alterar este número aqui é suficiente — início, jogo e leitura
// usam todos este mesmo valor (via obterBlocos()).
// ------------------------------------------------------------
const TAMANHO_IDEAL_BLOCO = 5;

// ------------------------------------------------------------
// ALGORITMO DE DISTRIBUIÇÃO EM BLOCOS
// ------------------------------------------------------------
function distribuirBlocos(conceitos, tamanhoIdeal = TAMANHO_IDEAL_BLOCO) {
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

// Cache simples para não recalcular a divisão em cada chamada
let _blocosCache = null;
function obterBlocos(tamanhoIdeal = TAMANHO_IDEAL_BLOCO) {
    if (typeof CONCEITOS_RAW === 'undefined') return [];
    if (!_blocosCache) {
        _blocosCache = distribuirBlocos(CONCEITOS_RAW, tamanhoIdeal);
    }
    return _blocosCache;
}

// ------------------------------------------------------------
// TERMO: extração da palavra oculta e limpeza da marcação
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

// Título limpo (sem marcação [OCULTAR]) pronto para exibição
function tituloLimpo(termo) {
    return removerMarcaOcultar(termo).replace(/\s+/g, ' ').trim();
}

// ------------------------------------------------------------
// MARKDOWN (usado nas explicações, tanto no jogo quanto na leitura)
// ------------------------------------------------------------
if (typeof marked !== 'undefined') {
    marked.setOptions({ breaks: true, gfm: true });
}

function renderizarMarkdown(md) {
    if (!md) return '';
    const html = marked.parse(md);
    return (typeof DOMPurify !== 'undefined') ? DOMPurify.sanitize(html) : html;
}

// ------------------------------------------------------------
// URL: leitura de parâmetros (ex.: ?bloco=2)
// ------------------------------------------------------------
function obterParametroURL(nome) {
    return new URLSearchParams(window.location.search).get(nome);
}

// ------------------------------------------------------------
// TEMA (claro/escuro) — compartilhado por todas as páginas.
// Qualquer botão com a classe "theme-toggle-btn" fica vinculado
// automaticamente.
// ------------------------------------------------------------
(function() {
    const chaveTema = 'forcaCarrossel_theme';
    const chaveManual = 'forcaCarrossel_theme_manual';
    const root = document.documentElement;

    function temaPreferidoSistema() {
        return (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) ? 'dark' : 'light';
    }

    // O tema inicial já foi aplicado por um pequeno script inline no <head>
    // de cada página (evita "flash" de tema errado ao carregar).
    let temaAtual = root.getAttribute('data-theme') || localStorage.getItem(chaveTema) || temaPreferidoSistema();

    function aplicarTema() {
        root.setAttribute('data-theme', temaAtual);
        localStorage.setItem(chaveTema, temaAtual);
        document.querySelectorAll('.theme-toggle-btn').forEach((btn) => {
            btn.setAttribute('aria-label', temaAtual === 'dark' ? 'Ativar modo claro' : 'Ativar modo escuro');
        });
    }

    function alternarTema() {
        temaAtual = (temaAtual === 'dark') ? 'light' : 'dark';
        localStorage.setItem(chaveManual, '1');
        aplicarTema();
    }

    function vincularBotoes() {
        document.querySelectorAll('.theme-toggle-btn').forEach((btn) => {
            if (btn.dataset.temaVinculado) return;
            btn.dataset.temaVinculado = '1';
            btn.addEventListener('click', alternarTema);
        });
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', vincularBotoes);
    } else {
        vincularBotoes();
    }

    // Acompanha mudança de preferência do sistema, caso o usuário nunca
    // tenha escolhido manualmente um tema.
    if (window.matchMedia) {
        window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
            if (!localStorage.getItem(chaveManual)) {
                temaAtual = e.matches ? 'dark' : 'light';
                aplicarTema();
            }
        });
    }

    aplicarTema();
})();
