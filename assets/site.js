/* =====================================================================
   CTF Marcelinho — vitrine (index, trajetória, copa)
   Menu, estrelas, contagem dos títulos, grade de turmas (lida do mesmo
   lugar que o painel edita), aula experimental → WhatsApp, Copa:
   vagas por categoria, inscrição e chaves com placar.
   ===================================================================== */
(function () {
  'use strict';
  var CFG = window.CTF || {}, DB = window.CTFDB;
  function $(s, r) { return (r || document).querySelector(s); }
  function $$(s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); }
  var esc = DB.esc;

  /* ---------- menu ---------- */
  var bt = $('.bt-menu'), menu = $('#menu');
  if (bt && menu) {
    bt.addEventListener('click', function () {
      var ab = menu.classList.toggle('aberto');
      bt.setAttribute('aria-expanded', ab ? 'true' : 'false');
    });
    $$('a', menu).forEach(function (a) { a.addEventListener('click', function () { menu.classList.remove('aberto'); bt.setAttribute('aria-expanded', 'false'); }); });
  }

  /* ---------- cinco estrelas (assinatura) ---------- */
  var ESTRELA = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 1.8l3.1 6.6 7.1.9-5.2 4.9 1.3 7.1L12 17.8l-6.3 3.5 1.3-7.1L1.8 9.3l7.1-.9z"/></svg>';
  $$('[data-estrelas]').forEach(function (e) {
    e.innerHTML = new Array(6).join(ESTRELA);
    e.setAttribute('role', 'img');
    if (!e.getAttribute('aria-label')) e.setAttribute('aria-label', 'Cinco estrelas: pentacampeão mundial');
  });

  /* ---------- contagem dos títulos ---------- */
  var reduz = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var contas = $$('[data-conta]');
  if (contas.length && 'IntersectionObserver' in window && !reduz) {
    contas.forEach(function (e) { e.textContent = '0'; });
    var io = new IntersectionObserver(function (ents) {
      ents.forEach(function (en) {
        if (!en.isIntersecting) return;
        io.unobserve(en.target);
        var alvo = +en.target.getAttribute('data-conta'), t0 = null, dur = 900 + alvo * 90;
        (function passo(t) {
          if (!t0) t0 = t;
          var p = Math.min(1, (t - t0) / dur), v = Math.round(alvo * (1 - Math.pow(1 - p, 3)));
          en.target.textContent = String(v);
          if (p < 1) requestAnimationFrame(passo);
        })(performance.now());
      });
    }, { threshold: .5 });
    contas.forEach(function (e) { io.observe(e); });
  }

  /* ---------- ano no rodapé ---------- */
  $$('[data-ano]').forEach(function (e) { e.textContent = String(new Date().getFullYear()); });

  /* ---------- grade de turmas ---------- */
  var grade = $('#niveis');
  if (grade) {
    var dados = DB.le();
    grade.innerHTML = (CFG.niveis || []).map(function (n) {
      var ts = dados.turmas.filter(function (t) { return t.nivel === n.id; });
      return '<article class="nivel"><h3>' + esc(n.nome) + '</h3><p>' + esc(n.texto) + '</p><ul>' +
        (ts.length ? ts.map(function (t) {
          return '<li><b>' + esc(t.nome) + '</b><span>' + esc(DB.horario(t)) + '</span></li>';
        }).join('') : '<li class="vazio">Horário a combinar no WhatsApp</li>') + '</ul></article>';
    }).join('');
  }

  /* ---------- aula experimental ---------- */
  var fx = $('#form-exp');
  if (fx) {
    var sel = $('#exp-turma', fx);
    DB.le().turmas.forEach(function (t) {
      var o = document.createElement('option');
      o.value = t.nome; o.textContent = t.nome + ' — ' + DB.horario(t);
      sel.appendChild(o);
    });
    var qs = new URLSearchParams(location.search);
    if (qs.get('turma')) sel.value = qs.get('turma');
    fx.addEventListener('submit', function (ev) {
      ev.preventDefault();
      var nome = $('#exp-nome', fx).value.trim(), tel = $('#exp-tel', fx).value.replace(/\D/g, '');
      var nivel = (fx.querySelector('input[name=nivel]:checked') || {}).value || '';
      var erro = $('#exp-erro');
      if (nome.length < 2) return mostraErro(erro, 'Escreve seu nome pra gente te chamar.', '#exp-nome');
      if (tel.length < 10) return mostraErro(erro, 'Confere o WhatsApp com DDD.', '#exp-tel');
      if (!nivel) return mostraErro(erro, 'Marca como está seu jogo hoje.', null);
      erro.hidden = true;
      var turma = sel.value || 'Qualquer turma', quando = $('#exp-quando', fx).value.trim();
      var txt = 'Oi, Prof. Marcelinho! Quero agendar uma aula experimental no CTF.\n\n' +
        'Nome: ' + nome + '\nWhatsApp: ' + tel + '\nMeu jogo hoje: ' + nivel + '\nTurma de interesse: ' + turma +
        (quando ? '\nMelhor dia/horário: ' + quando : '') + '\n\n(enviado pelo site)';
      var d = DB.le();
      d.experimentais.unshift({ id: DB.id('x'), nome: nome, telefone: tel, nivel: nivel, turma: turma, quando: quando, criado: DB.hoje(), status: 'novo' });
      DB.grava(d);
      var url = DB.zap(txt);
      var ok = $('#exp-ok');
      ok.hidden = false;
      $('a', ok).href = url;
      window.open(url, '_blank', 'noopener');
    });
  }
  function mostraErro(box, txt, foco) {
    box.textContent = txt; box.hidden = false;
    if (foco) { var f = $(foco); if (f) f.focus(); }
  }

  /* ---------- COPA ---------- */
  var cats = $('#cats');
  function vagasDe(cat) {
    var d = DB.le(), usadas = d.inscricoes.filter(function (i) { return i.cat === cat.id; }).length;
    return { usadas: usadas, livres: Math.max(0, cat.vagas - usadas) };
  }
  function pintaCats() {
    if (!cats) return;
    cats.innerHTML = CFG.copa.categorias.map(function (c) {
      var v = vagasDe(c);
      return '<article class="cat"><h3>' + esc(c.nome) + '</h3><p class="vagas"><b>' + v.livres + '</b> de ' + c.vagas + ' vagas para duplas</p>' +
        '<div class="barra" aria-hidden="true"><i style="width:' + Math.round(v.usadas / c.vagas * 100) + '%"></i></div></article>';
    }).join('');
  }
  pintaCats();

  var fc = $('#form-copa');
  if (fc) {
    var op = $('#copa-cats', fc);
    op.innerHTML = CFG.copa.categorias.map(function (c, i) {
      var v = vagasDe(c);
      return '<label><input type="radio" name="cat" value="' + c.id + '"' + (v.livres ? '' : ' disabled') + (i === 0 && v.livres ? ' checked' : '') + '><span>' + esc(c.nome) + (v.livres ? '' : ' · esgotada') + '</span></label>';
    }).join('');
    fc.addEventListener('submit', function (ev) {
      ev.preventDefault();
      var cat = (fc.querySelector('input[name=cat]:checked') || {}).value;
      var a1 = $('#copa-a1', fc).value.trim(), a2 = $('#copa-a2', fc).value.trim(), tel = $('#copa-tel', fc).value.replace(/\D/g, '');
      var erro = $('#copa-erro');
      if (!cat) return mostraErro(erro, 'Escolhe a categoria da dupla.', null);
      if (a1.length < 2 || a2.length < 2) return mostraErro(erro, 'Coloca o nome dos dois atletas da dupla.', a1.length < 2 ? '#copa-a1' : '#copa-a2');
      if (tel.length < 10) return mostraErro(erro, 'Confere o WhatsApp com DDD.', '#copa-tel');
      erro.hidden = true;
      var c = CFG.copa.categorias.filter(function (x) { return x.id === cat; })[0];
      var d = DB.le();
      d.inscricoes.push({ id: DB.id('i'), cat: cat, atleta1: a1, atleta2: a2, telefone: tel, criado: DB.hoje(), status: 'pendente' });
      DB.grava(d);
      var txt = 'Oi, Prof. Marcelinho! Quero inscrever minha dupla na Copa Marcelinho.\n\nCategoria: ' + c.nome +
        '\nAtleta 1: ' + a1 + '\nAtleta 2: ' + a2 + '\nWhatsApp: ' + tel + '\n\n(enviado pelo site)';
      var url = DB.zap(txt), ok = $('#copa-ok');
      ok.hidden = false; $('a', ok).href = url;
      fc.reset(); pintaCats();
      window.open(url, '_blank', 'noopener');
    });
  }

  var chaves = $('#chaves'), abas = $('#chave-abas');
  if (chaves && abas) {
    var atual = CFG.copa.categorias[0].id;
    abas.innerHTML = CFG.copa.categorias.map(function (c) {
      return '<button class="aba" role="tab" type="button" data-cat="' + c.id + '" aria-selected="' + (c.id === atual) + '">' + esc(c.nome) + '</button>';
    }).join('');
    abas.addEventListener('click', function (ev) {
      var b = ev.target.closest('[data-cat]'); if (!b) return;
      atual = b.getAttribute('data-cat');
      $$('[data-cat]', abas).forEach(function (x) { x.setAttribute('aria-selected', String(x === b)); });
      pintaChave();
    });
    pintaChave();
  }
  function jogoHtml(j) {
    var tem = j.pa != null && j.pb != null, va = tem && j.pa > j.pb, vb = tem && j.pb > j.pa;
    return '<div class="jogo"><div class="jogo-l' + (va ? ' venceu' : '') + '"><span>' + esc(DB.dupla(j.a)) + '</span><b>' + (tem ? j.pa : '–') + '</b></div>' +
      '<div class="jogo-l' + (vb ? ' venceu' : '') + '"><span>' + esc(DB.dupla(j.b)) + '</span><b>' + (tem ? j.pb : '–') + '</b></div>' +
      '<div class="quando">' + esc(j.quando || '') + (tem ? ' · encerrado' : ' · a jogar') + '</div></div>';
  }
  function pintaChave() {
    var d = DB.le(), js = d.jogos.filter(function (j) { return j.cat === atual; });
    if (!js.length) { chaves.innerHTML = '<p class="vazio-txt">As chaves desta categoria saem quando as inscrições fecharem.</p>'; return; }
    var fases = [];
    js.forEach(function (j) { if (fases.indexOf(j.fase) < 0) fases.push(j.fase); });
    var grupos = fases.filter(function (f) { return /^Grupo/.test(f); }), mata = fases.filter(function (f) { return !/^Grupo/.test(f); });
    var html = '<div class="chave-cols">';
    if (grupos.length) {
      html += '<div>' + grupos.map(function (g) {
        var jg = js.filter(function (j) { return j.fase === g; }), tab = {};
        jg.forEach(function (j) {
          [j.a, j.b].forEach(function (x) { if (x && !tab[x]) tab[x] = { id: x, j: 0, v: 0, s: 0 }; });
          if (j.pa == null || j.pb == null) return;
          tab[j.a].j++; tab[j.b].j++;
          tab[j.a].s += j.pa - j.pb; tab[j.b].s += j.pb - j.pa;
          if (j.pa > j.pb) tab[j.a].v++; else tab[j.b].v++;
        });
        var linhas = Object.keys(tab).map(function (k) { return tab[k]; }).sort(function (x, y) { return y.v - x.v || y.s - x.s; });
        return '<section class="fase"><h3>' + esc(g) + '</h3><table class="tabela"><thead><tr><th>Dupla</th><th class="num">J</th><th class="num">V</th><th class="num">Saldo</th></tr></thead><tbody>' +
          linhas.map(function (l) { return '<tr><td>' + esc(DB.dupla(l.id)) + '</td><td class="num">' + l.j + '</td><td class="num">' + l.v + '</td><td class="num">' + (l.s > 0 ? '+' : '') + l.s + '</td></tr>'; }).join('') +
          '</tbody></table><div style="margin-top:.8rem">' + jg.map(jogoHtml).join('') + '</div></section>';
      }).join('') + '</div>';
    }
    if (mata.length) {
      html += '<div>' + mata.map(function (f) {
        var jf = js.filter(function (j) { return j.fase === f; });
        var campeao = '';
        if (f === 'Final' && jf[0] && jf[0].pa != null && jf[0].pb != null) {
          campeao = '<p class="nota" style="margin-top:.4rem"><b>Campeões:</b> ' + esc(DB.dupla(jf[0].pa > jf[0].pb ? jf[0].a : jf[0].b)) + '</p>';
        }
        return '<section class="fase"><h3>' + esc(f) + '</h3>' + jf.map(jogoHtml).join('') + campeao + '</section>';
      }).join('') + '</div>';
    }
    chaves.innerHTML = html + '</div>';
  }
})();
