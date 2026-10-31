/* =====================================================================
   CTF Marcelinho — área do aluno (modo demonstração)
   Login de exemplo (aluno@demo / 1234) → plano e vencimento, frequência
   do mês (calendário), evolução por fundamento (gráfico SVG próprio,
   sem biblioteca), próximas aulas, eventos e avisos do professor.
   Tudo lido do mesmo lugar que o painel grava (window.CTFDB).
   ===================================================================== */
(function () {
  'use strict';
  var CFG = window.CTF || {}, DB = window.CTFDB, esc = DB.esc;
  var K_SESSAO = (CFG.prefixo || 'ctf_') + 'sessao_aluno';
  function $(s, r) { return (r || document).querySelector(s); }
  function $$(s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); }

  function sessao() { try { return sessionStorage.getItem(K_SESSAO); } catch (e) { return null; } }
  function entra(id) { try { sessionStorage.setItem(K_SESSAO, id); } catch (e) {} }
  function sai() { try { sessionStorage.removeItem(K_SESSAO); } catch (e) {} }

  $('#lg-demo').addEventListener('click', function () {
    $('#lg-email').value = CFG.loginAluno.email; $('#lg-senha').value = CFG.loginAluno.senha; $('#lg-senha').focus();
  });
  $('#form-login').addEventListener('submit', function (ev) {
    ev.preventDefault();
    var em = $('#lg-email').value.trim().toLowerCase(), se = $('#lg-senha').value, erro = $('#lg-erro');
    var al = DB.le().alunos.filter(function (a) { return a.email && a.email.toLowerCase() === em; })[0];
    if (!al || se !== CFG.loginAluno.senha) { erro.textContent = 'E-mail ou senha não conferem. Na demonstração: aluno@demo e 1234.'; erro.hidden = false; return; }
    erro.hidden = true; entra(al.id); mostra();
  });
  $('#sair').addEventListener('click', function () { sai(); mostra(); });

  function mostra() {
    var id = sessao(), al = id ? DB.aluno(id) : null;
    $('#tela-login').hidden = !!al; $('#tela-aluno').hidden = !al; $('#sair').hidden = !al;
    if (al) pinta(al);
  }

  var fundAtual = (CFG.fundamentos[0] || {}).id;

  function pinta(a) {
    var d = DB.le();
    var primeiro = DB.semExemplo(a.nome).split(' ')[0];
    $('#al-nome').textContent = 'Fala, ' + primeiro + '.';
    $('#al-nivel').textContent = 'Nível ' + DB.nivelNome(a.nivel);
    $('#al-turmas').textContent = a.turmas.map(function (t) { var x = DB.turma(t); return x ? x.nome + ' (' + DB.horario(x) + ')' : ''; }).join(' · ');

    // plano
    var pl = DB.plano(a.plano), st = DB.statusPag(a);
    $('#al-plano').textContent = pl.nome;
    $('#al-status').innerHTML = '<span class="selo ' + (st.id === 'emdia' ? 'selo-ok' : st.id === 'vence' ? 'selo-alerta' : 'selo-erro') + '">' + esc(st.txt) + '</span>';
    $('#al-venc').textContent = DB.longo(a.vencimento);
    $('#al-valor').textContent = pl.valor ? 'R$ ' + pl.valor.toLocaleString('pt-BR') : 'A confirmar';
    $('#al-desde').textContent = DB.MESES[DB.deIso(a.desde).getMonth()] + ' de ' + DB.deIso(a.desde).getFullYear();
    $('#al-pagar').href = DB.zap('Oi, Prof. Marcelinho! Segue o comprovante da mensalidade (' + pl.nome + ', vencimento ' + DB.dm(a.vencimento) + '). ' + DB.semExemplo(a.nome));

    // frequência
    var f = DB.freqMes(a);
    $('#al-pct').textContent = f.previstas ? f.pct + '%' : '—';
    $('#al-freq-txt').textContent = f.previstas ? 'Você veio em ' + f.foi + ' de ' + f.previstas + ' aulas este mês.' : 'Nenhuma aula com chamada neste mês ainda.';
    var hoje = DB.deIso(DB.hoje()), ini = new Date(hoje.getFullYear(), hoje.getMonth(), 1, 12);
    var ult = new Date(hoje.getFullYear(), hoje.getMonth() + 1, 0).getDate();
    var cal = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S'].map(function (x) { return '<span class="cab-d" aria-hidden="true">' + x + '</span>'; }).join('');
    for (var b = 0; b < ini.getDay(); b++) cal += '<span></span>';
    for (var dd = 1; dd <= ult; dd++) {
      var s = DB.iso(new Date(hoje.getFullYear(), hoje.getMonth(), dd, 12));
      var reg = f.dias.filter(function (x) { return x.dia === s; });
      var foi = reg.some(function (x) { return x.veio; }), falt = reg.length && !foi;
      var cls = (foi ? 'foi' : falt ? 'faltou' : '') + (s === DB.hoje() ? ' hoje' : '');
      var lab = DB.curto(s) + (foi ? ': presente' : falt ? ': faltou' : '');
      cal += '<span class="' + cls + '" title="' + esc(lab) + '" aria-label="' + esc(lab) + '">' + dd + '</span>';
    }
    $('#al-cal').innerHTML = cal;

    // evolução
    var bts = $('#al-fund-bts');
    bts.innerHTML = CFG.fundamentos.map(function (fu) { return '<button type="button" data-f="' + fu.id + '" aria-pressed="' + (fu.id === fundAtual) + '">' + esc(fu.nome) + '</button>'; }).join('');
    bts.onclick = function (ev) { var bt = ev.target.closest('[data-f]'); if (!bt) return; fundAtual = bt.getAttribute('data-f'); pinta(a); };
    $('#al-grafico').innerHTML = grafico(a.avaliacoes, fundAtual);
    var pri = a.avaliacoes[0], atu = a.avaliacoes[a.avaliacoes.length - 1];
    $('#al-barras').innerHTML = CFG.fundamentos.map(function (fu) {
      var v = atu ? atu.notas[fu.id] : 0, p = pri ? pri.notas[fu.id] : 0;
      return '<div class="bf"><span>' + esc(fu.nome) + '</span><span class="trilho" role="img" aria-label="' + esc(fu.nome) + ': ' + v + ' de 10, começou em ' + p + '"><i style="width:' + v * 10 + '%"></i><u style="left:calc(' + p * 10 + '% - 1px)"></u></span><b>' + fmt(v) + '</b></div>';
    }).join('');

    // próximas aulas e eventos
    var aulas = DB.proximasAulas(a, 3);
    $('#al-aulas').innerHTML = aulas.length ? aulas.map(function (x) {
      return '<li><b>' + esc(rel(x.dia)) + ' · ' + esc(x.turma.hora.replace(':00', 'h').replace(':', 'h')) + '</b><small>' + esc(x.turma.nome) + ' · Arena do CTF</small></li>';
    }).join('') : '<li class="vazio-txt">Sem aula marcada nos próximos dias.</li>';
    var evs = d.eventos.filter(function (e) { return e.data >= DB.hoje(); }).sort(function (x, y) { return x.data < y.data ? -1 : 1; }).slice(0, 3);
    $('#al-eventos').innerHTML = evs.length ? evs.map(function (e) {
      return '<li><b>' + esc(e.nome) + '</b><small>' + esc(DB.curto(e.data)) + ' · ' + esc(e.hora || '') + ' · ' + esc(e.local) + (e.tipo === 'copa' ? ' · <a href="copa.html">ver a Copa</a>' : '') + '</small></li>';
    }).join('') :'<li class="vazio-txt">Nenhum evento marcado.</li>';

    // avisos
    var av = d.avisos.filter(function (v) { return v.para === 'todos' || v.para === a.nivel || a.turmas.indexOf(v.para) >= 0; })
      .sort(function (x, y) { return (y.fixo - x.fixo) || (x.data < y.data ? 1 : -1); });
    $('#al-avisos').innerHTML = av.length ? av.map(function (v) {
      return '<div class="aviso-item"><h3>' + esc(v.titulo) + (v.fixo ? ' <span class="tag-ex" style="border-style:solid">Fixado</span>' : '') + '</h3><time datetime="' + v.data + '">' + esc(DB.longo(v.data)) + '</time><p>' + esc(v.texto) + '</p></div>';
    }).join('') : '<p class="vazio-txt">Nenhum aviso por enquanto.</p>';
  }

  function rel(s) { var h = DB.hoje(); return s === h ? 'Hoje' : s === DB.soma(h, 1) ? 'Amanhã' : DB.curto(s); }
  function fmt(v) { return String(v).replace('.', ','); }

  // gráfico de linha em SVG, escala 0–10
  function grafico(avs, f) {
    var W = 640, H = 250, L = 34, R = 16, T = 18, B = 34;
    if (!avs || !avs.length) return '<p class="vazio-txt">Sua primeira avaliação sai no fim do primeiro mês.</p>';
    var n = avs.length, w = W - L - R, h = H - T - B;
    function x(i) { return L + (n === 1 ? w / 2 : i * w / (n - 1)); }
    function y(v) { return T + h - v / 10 * h; }
    var s = '<svg viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-label="Evolução em ' + esc(nomeF(f)) + ': ' + avs.map(function (a) { return fmt(a.notas[f]); }).join(', ') + '">';
    [0, 2, 4, 6, 8, 10].forEach(function (g) {
      s += '<line x1="' + L + '" x2="' + (W - R) + '" y1="' + y(g) + '" y2="' + y(g) + '" stroke="#D9CBA8" stroke-width="1"/>' +
        '<text x="' + (L - 8) + '" y="' + (y(g) + 5) + '" text-anchor="end" font-size="13" fill="#3B4759">' + g + '</text>';
    });
    var pts = avs.map(function (a, i) { return x(i) + ',' + y(a.notas[f]); }).join(' ');
    s += '<polygon points="' + x(0) + ',' + y(0) + ' ' + pts + ' ' + x(n - 1) + ',' + y(0) + '" fill="#1557C0" opacity=".08"/>';
    s += '<polyline points="' + pts + '" fill="none" stroke="#1557C0" stroke-width="3.5" stroke-linejoin="round" stroke-linecap="round"/>';
    avs.forEach(function (a, i) {
      var v = a.notas[f], ult = i === n - 1;
      s += '<circle cx="' + x(i) + '" cy="' + y(v) + '" r="' + (ult ? 7 : 5) + '" fill="' + (ult ? '#E2AE2A' : '#fff') + '" stroke="#0A2F63" stroke-width="2.5"/>' +
        '<text x="' + x(i) + '" y="' + (y(v) - 13) + '" text-anchor="middle" font-size="15" font-weight="800" fill="#0A2F63">' + fmt(v) + '</text>' +
        '<text x="' + x(i) + '" y="' + (H - 10) + '" text-anchor="middle" font-size="13" fill="#3B4759">' + DB.MESES[DB.deIso(a.data).getMonth()].slice(0, 3) + '</text>';
    });
    return s + '</svg>';
  }
  function nomeF(id) { return (CFG.fundamentos.filter(function (f) { return f.id === id; })[0] || {}).nome || id; }

  mostra();
})();
