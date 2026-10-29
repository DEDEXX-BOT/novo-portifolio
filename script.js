/* ============================================================================
   script.js — COMPORTAMENTO do portfólio de André Matheus
   ----------------------------------------------------------------------------
   Ligado ao index.html por: <script src="script.js" defer></script>
   ("defer" faz o navegador executar o arquivo só depois de montar o HTML.)
   MAPA: 1 Brilho do cursor | 2 Cards 3D no toque | 3 Planos e WhatsApp
         4 Modais dos modelos | 5 Tema da clínica | 6 Tecla Esc
   ============================================================================ */

(function () {
  'use strict';

  /* ----------------------------------------------------------------------
     CONFIGURAÇÃO
     O número do WhatsApp (formato internacional: 55 + DDD + número) fica
     aqui, em um lugar só, para ser fácil de trocar.
     ---------------------------------------------------------------------- */
  var NUMERO_WHATSAPP = '5521965694646';

  /* ----------------------------------------------------------------------
     FUNÇÃO AUXILIAR: travar/liberar a rolagem da página
     O QUE FAZ: enquanto algum modal estiver aberto, impede a página de trás
     de rolar. Quando todos fecharem, libera de novo. Centralizar isso evita
     o bug de um modal "destravar" a rolagem do outro.
     ---------------------------------------------------------------------- */
  function atualizarTravaDeRolagem() {
    var algumAberto = document.querySelector('.plano-modal.aberto, .project-modal.active');
    document.body.style.overflow = algumAberto ? 'hidden' : '';
  }

  /* ======================================================================
     JS 1. BRILHO QUE SEGUE O CURSOR
     O QUE FAZ: guarda a posição do mouse e, a cada quadro de animação, move
     cada círculo um pouquinho em direção a ela. Cada círculo tem uma
     "velocidade" diferente (0.15, 0.08, 0.04), por isso se atrasam e dão
     sensação de profundidade.
     Só roda com mouse de verdade (no celular não há cursor) e respeita
     quem pediu "movimento reduzido".
     ====================================================================== */
  var brilhos = [
    { el: document.querySelector('.cursor-glow'),   velocidade: 0.15, x: 0, y: 0 },
    { el: document.querySelector('.cursor-glow-2'), velocidade: 0.08, x: 0, y: 0 },
    { el: document.querySelector('.cursor-glow-3'), velocidade: 0.04, x: 0, y: 0 }
  ];

  // Posição-alvo (onde o mouse está). Começa no centro da tela, e não no canto 0,0.
  var alvoX = window.innerWidth / 2;
  var alvoY = window.innerHeight / 2;

  // Aplica a posição (x, y) de um brilho no elemento
  function posicionarBrilho(b) {
    if (!b.el) return;
    b.el.style.left = b.x + 'px';
    b.el.style.top = b.y + 'px';
  }

  // Posição inicial dos 3 círculos
  brilhos.forEach(function (b) { b.x = alvoX; b.y = alvoY; posicionarBrilho(b); });

  var temMouse = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  var reduzMovimento = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  if (temMouse && !reduzMovimento) {
    // Atualiza o alvo sempre que o mouse se mexe
    document.addEventListener('mousemove', function (evento) {
      alvoX = evento.clientX;
      alvoY = evento.clientY;
    });

    // Loop de animação: aproxima cada círculo do alvo (interpolação suave)
    var animarBrilhos = function () {
      brilhos.forEach(function (b) {
        b.x += (alvoX - b.x) * b.velocidade;
        b.y += (alvoY - b.y) * b.velocidade;
        posicionarBrilho(b);
      });
      requestAnimationFrame(animarBrilhos);   // pede o próximo quadro ao navegador
    };
    animarBrilhos();
  }

  /* ======================================================================
     JS 2. CARDS 3D NO TOQUE E NO TECLADO
     O QUE FAZ: no computador o giro é feito só pelo CSS (:hover). Em telas de
     toque não existe hover, então aqui alternamos a classe "virado":
       - toque no card → vira/desvira;
       - Enter ou Espaço (card focado pelo Tab) → vira/desvira;
       - foco no botão do verso (via Tab) → vira para mostrar o botão.
     ====================================================================== */
  var cardsProjeto = document.querySelectorAll('.projetos-card');
  var dispositivoComMouse = window.matchMedia('(hover: hover)').matches;

  cardsProjeto.forEach(function (card) {
    // Toque: só alterna se o aparelho NÃO tem hover (evita conflito com o mouse)
    card.addEventListener('click', function (evento) {
      if (dispositivoComMouse) return;
      if (evento.target.closest('.link-projeto')) return;   // clique no botão não desvira
      card.classList.toggle('virado');
    });

    // Teclado: Enter/Espaço no próprio card
    card.addEventListener('keydown', function (evento) {
      if (evento.target !== card) return;
      if (evento.key === 'Enter' || evento.key === ' ') {
        evento.preventDefault();               // impede o Espaço de rolar a página
        card.classList.toggle('virado');
      }
    });

    // Ao chegar no botão do verso pelo Tab, garante que o card esteja virado
    var botaoVerso = card.querySelector('.link-projeto');
    if (botaoVerso) {
      botaoVerso.addEventListener('focus', function () { card.classList.add('virado'); });
    }
  });

  /* ======================================================================
     JS 3. PLANOS, MODAL DE PRÉ-CADASTRO E WHATSAPP
     O QUE FAZ:
       a) clicar num plano o destaca (classe "ativo");
       b) clicar em "Quero este plano" abre o modal com os dados do plano;
       c) o campo de celular recebe máscara e validação;
       d) ao enviar, monta uma mensagem pronta e abre o WhatsApp;
       e) se o navegador bloquear o pop-up, mostra um botão alternativo.
     ====================================================================== */
  var planos = document.querySelectorAll('.plano');
  var modalPlano = document.getElementById('planoModal');
  var formPlano = document.getElementById('planoForm');
  var blocoOk = document.getElementById('planoModalOk');
  var linkWhats = document.getElementById('planoLinkWhats');
  var campoNome = document.getElementById('plano-nome-cliente');
  var campoCelular = document.getElementById('plano-celular');
  var campoMensagem = document.getElementById('plano-mensagem');

  var planoAtual = document.querySelector('.plano.ativo') || planos[0];   // plano selecionado agora
  var focoAnteriorPlano = null;                                           // quem tinha o foco antes de abrir o modal

  // a) Destaca um plano e tira o destaque dos outros
  function selecionarPlano(card) {
    planos.forEach(function (p) { p.classList.remove('ativo'); });
    card.classList.add('ativo');
    planoAtual = card;
  }

  // b) Abre o modal preenchendo título e valor com os data-atributos do plano
  function abrirModalPlano(card) {
    selecionarPlano(card);
    document.getElementById('planoModalTitulo').textContent = 'Plano: ' + card.dataset.nome;
    document.getElementById('planoModalSub').textContent = 'Valor: ' + card.dataset.preco + ' — digite seus dados abaixo.';
    formPlano.hidden = false;       // mostra o formulário
    blocoOk.hidden = true;          // esconde a tela alternativa
    focoAnteriorPlano = document.activeElement;
    modalPlano.classList.add('aberto');
    atualizarTravaDeRolagem();
    setTimeout(function () { campoNome.focus(); }, 50);   // leva o cursor ao 1º campo
  }

  // Fecha o modal e devolve o foco ao botão que o abriu (acessibilidade)
  function fecharModalPlano() {
    modalPlano.classList.remove('aberto');
    atualizarTravaDeRolagem();
    if (focoAnteriorPlano) focoAnteriorPlano.focus();
  }

  // Clicar em qualquer parte do card só destaca o plano
  planos.forEach(function (card) {
    card.addEventListener('click', function () { selecionarPlano(card); });
  });

  // Clicar no botão do card abre o modal (closest sobe até o <article> .plano)
  document.querySelectorAll('.plano-botao').forEach(function (botao) {
    botao.addEventListener('click', function () {
      abrirModalPlano(botao.closest('.plano'));
    });
  });

  // Fechar: pelo "×" ou clicando no fundo escuro (fora da caixa)
  document.getElementById('planoModalFechar').addEventListener('click', fecharModalPlano);
  modalPlano.addEventListener('click', function (evento) {
    if (evento.target === modalPlano) fecharModalPlano();
  });

  // c) Máscara: transforma "21965694646" em "(21) 96569-4646" enquanto digita.
  //    Aceita 10 dígitos (fixo) ou 11 (celular com 9).
  function mascararCelular(valor) {
    var d = valor.replace(/\D/g, '').slice(0, 11);   // mantém só números, máx. 11
    if (d.length <= 2) return d;
    var corte = d.length > 10 ? 7 : 6;               // onde o hífen entra
    if (d.length <= corte) return '(' + d.slice(0, 2) + ') ' + d.slice(2);
    return '(' + d.slice(0, 2) + ') ' + d.slice(2, corte) + '-' + d.slice(corte);
  }

  campoCelular.addEventListener('input', function () {
    campoCelular.value = mascararCelular(campoCelular.value);
    campoCelular.setCustomValidity('');              // limpa o erro assim que o usuário corrige
  });

  // d) Envio do formulário
  formPlano.addEventListener('submit', function (evento) {
    evento.preventDefault();                         // impede o envio padrão (recarregar a página)

    var nome = campoNome.value.trim();
    var celular = campoCelular.value.trim();
    var extra = campoMensagem.value.trim();
    var digitos = celular.replace(/\D/g, '');

    // Validação: nome preenchido e celular com DDD + número (10 ou 11 dígitos)
    if (nome.length < 2) {
      campoNome.setCustomValidity('Digite seu nome.');
    } else {
      campoNome.setCustomValidity('');
    }
    if (digitos.length < 10) {
      campoCelular.setCustomValidity('Digite o DDD e o número. Ex.: (21) 99999-9999');
    } else {
      campoCelular.setCustomValidity('');
    }
    if (!formPlano.reportValidity()) return;         // mostra o aviso do navegador e para aqui

    // Texto da mensagem (os asteriscos deixam em negrito no WhatsApp)
    var texto = 'Olá André! Meu nome é *' + nome + '* (' + celular + ').\n\n' +
                'Gostaria de contratar o plano *' + planoAtual.dataset.nome + '* (' + planoAtual.dataset.preco + ').\n';
    if (extra) texto += '\n*Detalhes:* ' + extra;

    // encodeURIComponent converte espaços, acentos e quebras de linha para uso em URL
    var url = 'https://wa.me/' + NUMERO_WHATSAPP + '?text=' + encodeURIComponent(texto);

    var janela = window.open(url, '_blank');
    if (janela) {
      janela.opener = null;                          // segurança: a nova aba não controla esta
      formPlano.reset();
      fecharModalPlano();
    } else {
      // e) Pop-up bloqueado: mostra um link que o usuário clica manualmente
      linkWhats.href = url;
      formPlano.hidden = true;
      blocoOk.hidden = false;
    }
  });

  /* ======================================================================
     JS 4. MODAIS DOS MODELOS (abrir e fechar)
     O QUE FAZ: botões com data-abrir-projeto="id-do-modal" mostram o modelo;
     botões com data-fechar-projeto fecham o modal em que estão.
     Usar data-atributos (em vez de onclick="..." no HTML) mantém o HTML limpo
     e toda a lógica no JavaScript.
     ====================================================================== */
  var focoAnteriorProjeto = null;

  function abrirProjeto(idModal) {
    var modal = document.getElementById(idModal);
    if (!modal) return;
    focoAnteriorProjeto = document.activeElement;
    modal.classList.add('active');
    modal.scrollTop = 0;                             // sempre abre no topo
    atualizarTravaDeRolagem();
    modal.querySelector('.close-project-btn').focus();
  }

  function fecharProjeto(modal) {
    modal.classList.remove('active');
    atualizarTravaDeRolagem();
    if (focoAnteriorProjeto) focoAnteriorProjeto.focus();
  }

  document.querySelectorAll('[data-abrir-projeto]').forEach(function (botao) {
    botao.addEventListener('click', function () {
      abrirProjeto(botao.dataset.abrirProjeto);
    });
  });

  document.querySelectorAll('[data-fechar-projeto]').forEach(function (botao) {
    botao.addEventListener('click', function () {
      fecharProjeto(botao.closest('.project-modal'));
    });
  });

  /* ======================================================================
     JS 5. TEMA CLARO/ESCURO DO MODELO DA CLÍNICA
     O QUE FAZ: alterna o atributo data-theme entre "light" e "dark".
     O CSS (11.3) troca as cores via variáveis quando data-theme="dark".
     ====================================================================== */
  var containerClinica = document.getElementById('clinica-container');
  document.getElementById('btnTemaClinica').addEventListener('click', function () {
    var atual = containerClinica.getAttribute('data-theme');
    containerClinica.setAttribute('data-theme', atual === 'dark' ? 'light' : 'dark');
  });

  /* ======================================================================
     JS 6. TECLA ESC
     O QUE FAZ: Esc fecha o que estiver aberto (primeiro o modal de plano,
     senão o modelo em tela cheia). Padrão esperado em qualquer modal.
     ====================================================================== */
  document.addEventListener('keydown', function (evento) {
    if (evento.key !== 'Escape') return;
    if (modalPlano.classList.contains('aberto')) {
      fecharModalPlano();
      return;
    }
    var projetoAberto = document.querySelector('.project-modal.active');
    if (projetoAberto) fecharProjeto(projetoAberto);
  });
})();
