/* =====================================================================
   CTF Marcelinho — painel do professor (modo demonstração)
   Visão geral · Alunos e planos (em dia / vence logo / atrasada, ficha
   com avaliação por fundamento) · Presença por turma · Turmas e
   horários · Copa e eventos (inscritos, placares) · Avisos · Ajustes.
   Lê e grava em window.CTFDB (localStorage ctf_dados): o site, a página
   da Copa e a área do aluno leem o mesmo lugar.
   ===================================================================== */
(function () {
  'use strict';
  var CFG = window.CTF || {}, DB = window.CTFDB, esc = DB.esc;
  var K_SESSAO = (CFG.prefixo || 'ctf_') + 'sessao_prof';
  var FASES = ['Grupo A', 'Grupo B', 'Quartas', 'Semifinal', 'Final'];
  var STATUS_EXP = ['novo', 'agendada', 'virou aluno', 'não veio'];
  function $(s, r) { return (r || document).querySelector(s); }
  function $$(s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); }
  function primeiro(n) { return DB.semExemplo(n).split(' ')[0]; }
  function telFmt(t) { var x = String(t || '').replace(/\D/g, ''); return x.length === 11 ? '(' + x.slice(0, 2) + ') ' + x[2] + ' ' + x.slice(3, 7) + '-' + x.slice(7) : (t || '—'); }
  function zapAluno(tel, txt) { var x = String(tel || '').replace(/\D/g, ''); return DB.zap(txt, x.length <= 11 ? '55' + x : x); }
  function rel(s) { var h = DB.hoje(); return s === h ? 'Hoje' : s === DB.soma(h, 1) ? 'Amanhã' : s === DB.soma(h, -1) ? 'Ontem' : DB.curto(s); }
  function selo(st) { return '<span class="selo ' + (st.id === 'emdia' ? 'selo-ok' : st.id === 'vence' ? 'selo-alerta' : 'selo-erro') + '">' + esc(st.txt) + '</span>'; }
  function flash(elm, txt) { elm.textContent = txt; elm.hidden = false; clearTimeout(elm._t); elm._t = setTimeout(function () { elm.hidden = true; }, 2600); }
  function hora(h) { return String(h || '').replace(':00', 'h').replace(':', 'h'); }

  var d = DB.le();
  function salva() { DB.grava(d); bolhas(); }

  /* ---------------- login ---------------- */
  function logado() { try { return sessionStorage.getItem(K_SESSAO) === '1'; } catch (e) { return false; } }
  function mostra() {
    var ok = logado();
    $('#tela-login').hidden = ok; $('#tela-painel').hidden = !ok;
    if (ok) { var q = new URLSearchParams(location.search).get('aba'); ativa(q && $('[data-painel="' + q + '"]') ? q : 'geral'); }
  }
  $('#lg-demo').addEventListener('click', function () { $('#lg-email').value = CFG.loginProfessor.email; $('#lg-senha').value = CFG.loginProfessor.senha; $('#lg-senha').focus(); });
  $('#form-login').addEventListener('submit', function (ev) {
    ev.preventDefault();
    var em = $('#lg-email').value.trim().toLowerCase(), se = $('#lg-senha').value;
    if (em !== CFG.loginProfessor.email || se !== CFG.loginProfessor.senha) {
      var e = $('#lg-erro'); e.textContent = 'E-mail ou senha não conferem. Na demonstração: professor@demo e penta5.'; e.hidden = false; return;
    }
    try { sessionStorage.setItem(K_SESSAO, '1'); } catch (x) {}
    mostra();
  });
  $('#sair').addEventListener('click', function () { try { sessionStorage.removeItem(K_SESSAO); } catch (x) {} mostra(); });

  /* ---------------- abas ---------------- */
  var abaAtual = 'geral';
  function ativa(id) {
    abaAtual = id;
    $$('.adm-aba').forEach(function (b) { b.setAttribute('aria-selected', String(b.getAttribute('data-aba') === id)); });
    $$('.adm-painel').forEach(function (p) { if (p.getAttribute('data-painel') === id) p.setAttribute('data-ativa', ''); else p.removeAttribute('data-ativa'); });
    ({ geral: pGeral, alunos: pAlunos, presenca: pPresenca, turmas: pTurmas, copa: pCopa, avisos: pAvisos, ajustes: pAjustes })[id]();
    bolhas();
  }
  $$('.adm-aba').forEach(function (b) { b.addEventListener('click', function () { ativa(b.getAttribute('data-aba')); window.scrollTo(0, 0); }); });
  document.addEventListener('click', function (ev) {
    var b = ev.target.closest('[data-ir]'); if (!b) return;
    if (b.getAttribute('data-filtro')) fStatus = b.getAttribute('data-filtro');
    if (b.getAttribute('data-turma')) { pTurma = b.getAttribute('data-turma'); pDia = DB.hoje(); }
    ativa(b.getAttribute('data-ir')); window.scrollTo(0, 0);
  });
  function bolhas() {
    var atr = d.alunos.filter(function (a) { return DB.statusPag(a).id === 'atrasada'; }).length;
    var pend = d.inscricoes.filter(function (i) { return i.status === 'pendente'; }).length;
    $('#bolha-atraso').textContent = atr || ''; $('#bolha-copa').textContent = pend || '';
  }

  /* ---------------- VISÃO GERAL ---------------- */
  function pGeral() {
    var H = DB.hoje(), wd = DB.deIso(H).getDay();
    $('#geral-tit').textContent = DB.SEMANA[wd] + ', ' + DB.longo(H);
    var atr = d.alunos.filter(function (a) { return DB.statusPag(a).id === 'atrasada'; });
    var fs = d.alunos.map(function (a) { return DB.freqMes(a); }).filter(function (f) { return f.previstas; });
    var media = fs.length ? Math.round(fs.reduce(function (s, f) { return s + f.pct; }, 0) / fs.length) : 0;
    var novos = d.experimentais.filter(function (x) { return x.status === 'novo'; }).length;
    var pend = d.inscricoes.filter(function (i) { return i.status === 'pendente'; }).length;
    $('#kpis').innerHTML =
      kpi(d.alunos.length, 'Alunos ativos', d.turmas.length + ' turmas') +
      kpi(atr.length, 'Mensalidades atrasadas', atr.length ? 'cobrar hoje' : 'tudo em dia', atr.length > 0) +
      kpi(media + '%', 'Frequência do mês', 'média dos alunos') +
      kpi(novos, 'Aulas experimentais', 'pedidos novos no site') +
      kpi(d.inscricoes.length, 'Duplas na Copa', pend + ' pendentes');

    var hoje = d.turmas.filter(function (t) { return t.dias.indexOf(wd) >= 0; }).sort(function (a, b) { return a.hora < b.hora ? -1 : 1; });
    $('#g-aulas').innerHTML = hoje.length ? hoje.map(function (t) {
      var al = alunosDa(t.id), ch = d.presencas[t.id + '|' + H];
      return '<div class="item"><div class="info"><b>' + esc(hora(t.hora)) + ' · ' + esc(t.nome) + '</b><small>' + al.length + ' alunos · ' + (ch ? 'chamada feita: ' + ch.length + ' presentes' : 'chamada pendente') + '</small></div>' +
        '<div class="lado"><button class="btn btn-mar mini" type="button" data-ir="presenca" data-turma="' + t.id + '">Chamada</button></div></div>';
    }).join('') : '<p class="vazio-adm">Sem turma hoje.</p>';

    atr.sort(function (a, b) { return DB.statusPag(b).dias - DB.statusPag(a).dias; });
    $('#g-atraso').innerHTML = atr.length ? atr.map(linhaCobranca).join('') : '<p class="vazio-adm">Ninguém atrasado. Padrão penta.</p>';

    $('#g-exp').innerHTML = d.experimentais.length ? d.experimentais.slice(0, 6).map(function (x) {
      return '<div class="item"><div class="info"><b>' + esc(x.nome) + '</b><small>' + esc(x.nivel) + ' · ' + esc(x.turma) + (x.quando ? ' · ' + esc(x.quando) : '') + ' · pediu ' + esc(rel(x.criado).toLowerCase()) + '</small></div>' +
        '<div class="lado"><label class="sr" for="ex-' + x.id + '">Situação</label><select id="ex-' + x.id + '" data-exp="' + x.id + '" class="sel-mini">' +
        STATUS_EXP.map(function (s) { return '<option' + (s === x.status ? ' selected' : '') + '>' + s + '</option>'; }).join('') + '</select>' +
        '<a class="btn btn-zap mini" target="_blank" rel="noopener" href="' + esc(zapAluno(x.telefone, 'Oi, ' + primeiro(x.nome) + '! Aqui é o Prof. Marcelinho, do CTF. Recebi seu pedido de aula experimental. Bora marcar?')) + '">WhatsApp</a></div></div>';
    }).join('') : '<p class="vazio-adm">Nenhum pedido ainda.</p>';
    $$('[data-exp]').forEach(function (s) { s.addEventListener('change', function () { var x = d.experimentais.filter(function (e) { return e.id === s.getAttribute('data-exp'); })[0]; if (x) { x.status = s.value; salva(); pGeral(); } }); });

    var evs = d.eventos.filter(function (e) { return e.data >= H; }).sort(function (a, b) { return a.data < b.data ? -1 : 1; });
    $('#g-eventos').innerHTML = evs.length ? evs.map(function (e) {
      return '<div class="item"><div class="info"><b>' + esc(e.nome) + '</b><small>' + esc(DB.curto(e.data)) + ' · ' + esc(hora(e.hora)) + ' · ' + esc(e.local) + '</small></div></div>';
    }).join('') : '<p class="vazio-adm">Nenhum evento marcado.</p>';
  }
  function kpi(v, nome, sub, alerta) { return '<div class="kpi' + (alerta ? ' alerta' : '') + '"><b>' + esc(v) + '</b><span>' + esc(nome) + '</span><small>' + esc(sub) + '</small></div>'; }
  function msgCobranca(a) {
    return 'Oi, ' + primeiro(a.nome) + '! Aqui é o Prof. Marcelinho, do CTF. Passando pra lembrar da mensalidade do plano ' + DB.plano(a.plano).nome + ', que venceu em ' + DB.dm(a.vencimento) + '. Qualquer coisa me chama aqui. Bora treinar!';
  }
  function linhaCobranca(a) {
    var st = DB.statusPag(a);
    return '<div class="item"><div class="info"><b>' + esc(a.nome) + '</b><small>' + esc(DB.plano(a.plano).nome) + ' · ' + esc(st.txt.toLowerCase()) + '</small></div>' +
      '<div class="lado"><a class="btn btn-zap mini" target="_blank" rel="noopener" href="' + esc(zapAluno(a.telefone, msgCobranca(a))) + '">Cobrar</a>' +
      '<button class="btn btn-linha mini" type="button" data-pagou="' + a.id + '">Pagou</button></div></div>';
  }
  document.addEventListener('click', function (ev) {
    var b = ev.target.closest('[data-pagou]'); if (!b) return;
    var a = DB.aluno(b.getAttribute('data-pagou')); if (!a) return;
    a.pagamentos = a.pagamentos || [];
    a.pagamentos.unshift({ data: DB.hoje(), ref: a.vencimento });
    a.vencimento = DB.somaMes(a.vencimento, 1);
    salva();
    if (b.closest('.ficha')) abreFicha(a.id); else ativa(abaAtual);
  });

  /* ---------------- ALUNOS ---------------- */
  var fStatus = 'todos', fTurma = '', fBusca = '';
  function alunosDa(tid) { return d.alunos.filter(function (a) { return a.turmas.indexOf(tid) >= 0; }); }
  function pAlunos() {
    $$('#f-status button').forEach(function (b) { b.setAttribute('aria-pressed', String(b.getAttribute('data-v') === fStatus)); });
    var sel = $('#f-turma');
    sel.innerHTML = '<option value="">Todas as turmas</option>' + d.turmas.map(function (t) { return '<option value="' + t.id + '"' + (t.id === fTurma ? ' selected' : '') + '>' + esc(t.nome) + '</option>'; }).join('');
    var lista = d.alunos.filter(function (a) {
      var st = DB.statusPag(a).id;
      return (fStatus === 'todos' || st === fStatus) && (!fTurma || a.turmas.indexOf(fTurma) >= 0) &&
        (!fBusca || a.nome.toLowerCase().indexOf(fBusca.toLowerCase()) >= 0);
    }).sort(function (a, b) { return a.vencimento < b.vencimento ? -1 : 1; });
    $('#lista-alunos').innerHTML = lista.length ? '<table class="tab-al"><thead><tr><th>Aluno</th><th>Turmas</th><th>Plano</th><th>Mensalidade</th><th class="num">Freq. mês</th><th>Ações</th></tr></thead><tbody>' +
      lista.map(function (a) {
        var st = DB.statusPag(a), f = DB.freqMes(a);
        return '<tr><td><button class="nome" type="button" data-ficha="' + a.id + '">' + esc(a.nome) + '</button><small>' + esc(DB.nivelNome(a.nivel)) + ' · ' + esc(telFmt(a.telefone)) + '</small></td>' +
          '<td data-r="Turmas">' + esc(a.turmas.map(function (t) { var x = DB.turma(t); return x ? x.nome : ''; }).join(', ')) + '</td>' +
          '<td data-r="Plano">' + esc(DB.plano(a.plano).nome) + '</td>' +
          '<td data-r="Vence">' + selo(st) + '<small>vence ' + esc(DB.dm(a.vencimento)) + '</small></td>' +
          '<td class="num" data-r="Frequência">' + (f.previstas ? f.pct + '% <small>' + f.foi + '/' + f.previstas + '</small>' : '—') + '</td>' +
          '<td><div class="lado" style="display:flex;gap:.4rem;flex-wrap:wrap">' +
          (st.id !== 'emdia' ? '<a class="btn btn-zap mini" target="_blank" rel="noopener" href="' + esc(zapAluno(a.telefone, msgCobranca(a))) + '">Cobrar</a>' : '') +
          '<button class="btn btn-linha mini" type="button" data-pagou="' + a.id + '">Pagou</button></div></td></tr>';
      }).join('') + '</tbody></table>' : '<p class="vazio-adm">Nenhum aluno com esse filtro.</p>';
  }
  $('#f-status').addEventListener('click', function (ev) { var b = ev.target.closest('[data-v]'); if (!b) return; fStatus = b.getAttribute('data-v'); pAlunos(); });
  $('#f-turma').addEventListener('change', function () { fTurma = this.value; pAlunos(); });
  $('#f-busca').addEventListener('input', function () { fBusca = this.value.trim(); pAlunos(); });
  $('#bt-novo-aluno').addEventListener('click', function () { abreFicha(null); });
  document.addEventListener('click', function (ev) { var b = ev.target.closest('[data-ficha]'); if (b) abreFicha(b.getAttribute('data-ficha')); });

  /* ---------------- FICHA ---------------- */
  var dlg = $('#ficha');
  // Enter num campo não fecha a ficha; só o botão ×
  $('#ficha-form').addEventListener('submit', function (ev) { if (!ev.submitter || !ev.submitter.classList.contains('fechar')) ev.preventDefault(); });
  function abreFicha(id) {
    var a = id ? DB.aluno(id) : null, novo = !a;
    if (novo) a = { id: DB.id('a'), nome: '', telefone: '', email: '', nivel: 'iniciante', turmas: [], plano: d.planos[0].id, desde: DB.hoje(), vencimento: DB.somaMes(DB.hoje(), 1), pagamentos: [], avaliacoes: [] };
    $('#ficha-tit').textContent = novo ? 'Novo aluno' : DB.semExemplo(a.nome);
    var f = novo ? null : DB.freqMes(a), st = DB.statusPag(a);
    var html = '<div class="bloco form"><div class="bloco-cab"><h2>Dados e plano</h2>' + (novo ? '' : selo(st)) + '</div>' +
      '<div class="dois"><div class="campo"><label for="fi-nome">Nome</label><input id="fi-nome" value="' + esc(a.nome) + '"></div>' +
      '<div class="campo"><label for="fi-tel">WhatsApp</label><input id="fi-tel" type="tel" value="' + esc(a.telefone) + '"></div></div>' +
      '<div class="dois"><div class="campo"><label for="fi-nivel">Nível</label><select id="fi-nivel">' + CFG.niveis.map(function (n) { return '<option value="' + n.id + '"' + (n.id === a.nivel ? ' selected' : '') + '>' + esc(n.nome) + '</option>'; }).join('') + '</select></div>' +
      '<div class="campo"><label for="fi-plano">Plano</label><select id="fi-plano">' + d.planos.map(function (p) { return '<option value="' + p.id + '"' + (p.id === a.plano ? ' selected' : '') + '>' + esc(p.nome) + '</option>'; }).join('') + '</select></div></div>' +
      '<div class="campo"><fieldset><legend>Turmas</legend><div class="opcoes">' + d.turmas.map(function (t) { return '<label><input type="checkbox" name="fi-turma" value="' + t.id + '"' + (a.turmas.indexOf(t.id) >= 0 ? ' checked' : '') + '><span>' + esc(t.nome) + '</span></label>'; }).join('') + '</div></fieldset></div>' +
      '<div class="dois"><div class="campo"><label for="fi-venc">Próximo vencimento</label><input id="fi-venc" type="date" value="' + a.vencimento + '"></div>' +
      '<div class="campo"><label for="fi-email">E-mail de acesso à área do aluno</label><input id="fi-email" type="email" value="' + esc(a.email || '') + '"' + (a.email === CFG.loginAluno.email ? ' readonly' : '') + '></div></div>' +
      '<p class="erro-campo" id="fi-erro" hidden></p>' +
      '<div class="acoes"><button class="btn btn-mar" type="button" id="fi-salvar">' + (novo ? 'Cadastrar aluno' : 'Salvar dados') + '</button>' +
      (novo ? '' : '<button class="btn btn-linha" type="button" data-pagou="' + a.id + '">Registrar pagamento</button>') + '</div></div>';
    if (!novo) {
      html += '<div class="bloco"><div class="bloco-cab"><h2>Frequência do mês</h2></div><p><b style="font-size:1.6rem">' + (f.previstas ? f.pct + '%' : '—') + '</b> ' + (f.previstas ? f.foi + ' de ' + f.previstas + ' aulas' : 'sem chamada no mês') + '</p></div>';
      html += '<div class="bloco"><div class="bloco-cab"><h2>Pagamentos</h2></div>' + (a.pagamentos.length ? '<ul class="lista-sec">' + a.pagamentos.slice(0, 6).map(function (p) { return '<li>Pago em ' + esc(DB.dm(p.data)) + ' <small>· referente ao vencimento de ' + esc(DB.dm(p.ref)) + '</small></li>'; }).join('') + '</ul>' : '<p class="vazio-adm">Nenhum pagamento registrado.</p>') + '</div>';
      html += '<div class="bloco"><div class="bloco-cab"><h2>Avaliação por fundamento (0 a 10)</h2></div>' +
        (a.avaliacoes.length ? '<div class="rolagem-x"><table class="mini-tab"><thead><tr><th>Fundamento</th>' + a.avaliacoes.map(function (v) { return '<th>' + esc(DB.dm(v.data)) + '</th>'; }).join('') + '</tr></thead><tbody>' +
          CFG.fundamentos.map(function (fu) { return '<tr><td>' + esc(fu.nome) + '</td>' + a.avaliacoes.map(function (v) { return '<td>' + String(v.notas[fu.id]).replace('.', ',') + '</td>'; }).join('') + '</tr>'; }).join('') + '</tbody></table></div>' : '<p class="vazio-adm">Sem avaliação ainda.</p>') +
        '<p style="margin:1rem 0 .5rem;font-weight:800">Nova avaliação de hoje</p><div class="notas-g">' + CFG.fundamentos.map(function (fu) {
          var ult = a.avaliacoes.length ? a.avaliacoes[a.avaliacoes.length - 1].notas[fu.id] : 5;
          return '<div class="campo"><label for="nt-' + fu.id + '">' + esc(fu.nome) + '</label><input id="nt-' + fu.id + '" type="number" min="0" max="10" step="0.5" value="' + ult + '"></div>';
        }).join('') + '</div><div class="acoes"><button class="btn btn-mar" type="button" id="fi-aval">Salvar avaliação</button></div><p class="ok-msg" id="fi-ok" hidden></p></div>';
      html += '<div class="acoes"><button class="btn btn-perigo mini" type="button" id="fi-remover">Remover aluno</button></div>';
    }
    $('#ficha-corpo').innerHTML = html;
    $('#fi-salvar').addEventListener('click', function () {
      var nome = $('#fi-nome').value.trim(), tel = $('#fi-tel').value.replace(/\D/g, '');
      var turmas = $$('input[name=fi-turma]:checked').map(function (c) { return c.value; });
      var err = $('#fi-erro');
      if (nome.length < 2) { err.textContent = 'Coloque o nome do aluno.'; err.hidden = false; return; }
      if (!turmas.length) { err.textContent = 'Marque pelo menos uma turma.'; err.hidden = false; return; }
      a.nome = nome; a.telefone = tel; a.nivel = $('#fi-nivel').value; a.plano = $('#fi-plano').value; a.turmas = turmas;
      a.vencimento = $('#fi-venc').value || a.vencimento; a.email = $('#fi-email').value.trim();
      if (novo) d.alunos.push(a);
      salva(); dlg.close(); ativa(abaAtual);
    });
    if (!novo) {
      $('#fi-aval').addEventListener('click', function () {
        var notas = {};
        CFG.fundamentos.forEach(function (fu) { var v = parseFloat($('#nt-' + fu.id).value); notas[fu.id] = isNaN(v) ? 0 : Math.max(0, Math.min(10, v)); });
        var hj = DB.hoje(), ult = a.avaliacoes[a.avaliacoes.length - 1];
        if (ult && ult.data === hj) ult.notas = notas; else a.avaliacoes.push({ data: hj, notas: notas });
        salva(); abreFicha(a.id); flash($('#fi-ok'), 'Avaliação salva. Já aparece no gráfico do aluno.');
      });
      $('#fi-remover').addEventListener('click', function () {
        if (!window.confirm('Remover ' + DB.semExemplo(a.nome) + ' da lista de alunos?')) return;
        d.alunos = d.alunos.filter(function (x) { return x.id !== a.id; });
        salva(); dlg.close(); ativa(abaAtual);
      });
    }
    if (!dlg.open) { if (dlg.showModal) dlg.showModal(); else dlg.setAttribute('open', ''); }
  }

  /* ---------------- PRESENÇA ---------------- */
  var pTurma = '', pDia = '';
  function datasDa(t) {
    var out = [], x = DB.deIso(DB.hoje());
    for (var i = 0; i < 35 && out.length < 12; i++) { if (t.dias.indexOf(x.getDay()) >= 0) out.push(DB.iso(x)); x.setDate(x.getDate() - 1); }
    return out;
  }
  function pPresenca() {
    if (!d.turmas.length) { $('#p-lista').innerHTML = '<p class="vazio-adm">Cadastre uma turma primeiro.</p>'; return; }
    if (!DB.turma(pTurma)) pTurma = d.turmas[0].id;
    var t = DB.turma(pTurma), datas = datasDa(t);
    if (datas.indexOf(pDia) < 0) pDia = datas[0] || DB.hoje();
    $('#p-turma').innerHTML = d.turmas.map(function (x) { return '<option value="' + x.id + '"' + (x.id === pTurma ? ' selected' : '') + '>' + esc(x.nome) + ' · ' + esc(hora(x.hora)) + '</option>'; }).join('');
    $('#p-dia').innerHTML = datas.map(function (s) { var feita = d.presencas[pTurma + '|' + s]; return '<option value="' + s + '"' + (s === pDia ? ' selected' : '') + '>' + esc(rel(s)) + (feita ? ' · feita' : ' · pendente') + '</option>'; }).join('');
    var al = alunosDa(pTurma).filter(function (a) { return a.desde <= pDia; }), reg = d.presencas[pTurma + '|' + pDia] || [];
    $('#p-tit').textContent = t.nome + ' · ' + rel(pDia);
    $('#p-lista').innerHTML = al.length ? al.map(function (a) {
      return '<label><input type="checkbox" value="' + a.id + '"' + (reg.indexOf(a.id) >= 0 ? ' checked' : '') + '> ' + esc(DB.semExemplo(a.nome)) + '</label>';
    }).join('') : '<p class="vazio-adm">Nenhum aluno nesta turma.</p>';
    conta();
    // resumo por turma (mês corrente)
    var H = DB.deIso(DB.hoje());
    $('#p-resumo').innerHTML = d.turmas.map(function (x) {
      var tot = 0, foi = 0;
      Object.keys(d.presencas).forEach(function (k) {
        var p = k.split('|'); if (p[0] !== x.id) return;
        var dd = DB.deIso(p[1]); if (dd.getMonth() !== H.getMonth() || dd.getFullYear() !== H.getFullYear()) return;
        var n = alunosDa(x.id).filter(function (a) { return a.desde <= p[1]; }).length;
        tot += n; foi += Math.min(n, d.presencas[k].length);
      });
      var pct = tot ? Math.round(foi / tot * 100) : 0;
      return '<div class="freq-l"><span>' + esc(x.nome) + '</span><span class="trilho" aria-hidden="true"><i style="width:' + pct + '%"></i></span><b>' + (tot ? pct + '%' : '—') + '</b></div>';
    }).join('');
  }
  function conta() { var c = $$('#p-lista input'), m = c.filter(function (x) { return x.checked; }).length; $('#p-conta').textContent = m + ' de ' + c.length + ' presentes'; }
  $('#p-lista').addEventListener('change', conta);
  $('#p-turma').addEventListener('change', function () { pTurma = this.value; pDia = ''; pPresenca(); });
  $('#p-dia').addEventListener('change', function () { pDia = this.value; pPresenca(); });
  $('#p-todos').addEventListener('click', function () { $$('#p-lista input').forEach(function (c) { c.checked = true; }); conta(); });
  $('#p-salvar').addEventListener('click', function () {
    d.presencas[pTurma + '|' + pDia] = $$('#p-lista input:checked').map(function (c) { return c.value; });
    salva(); pPresenca(); flash($('#p-ok'), 'Chamada salva.');
  });

  /* ---------------- TURMAS ---------------- */
  function pTurmas() {
    $('#lista-turmas').innerHTML = d.turmas.map(function (t) {
      var n = alunosDa(t.id).length;
      return '<div class="turma-ed" data-t="' + t.id + '">' +
        '<div class="campo col-nome"><label for="tn-' + t.id + '">Nome</label><input id="tn-' + t.id + '" data-k="nome" value="' + esc(t.nome) + '"></div>' +
        '<div class="campo"><label for="tv-' + t.id + '">Nível</label><select id="tv-' + t.id + '" data-k="nivel">' + CFG.niveis.map(function (x) { return '<option value="' + x.id + '"' + (x.id === t.nivel ? ' selected' : '') + '>' + esc(x.nome) + '</option>'; }).join('') + '</select></div>' +
        '<div class="campo col-dias"><fieldset><legend>Dias</legend><div class="dias">' + DB.SEM_C.map(function (s, i) { return '<label><input type="checkbox" data-k="dia" value="' + i + '"' + (t.dias.indexOf(i) >= 0 ? ' checked' : '') + '><span>' + s + '</span></label>'; }).join('') + '</div></fieldset></div>' +
        '<div class="campo"><label for="ti-' + t.id + '">Início</label><input id="ti-' + t.id + '" type="time" data-k="hora" value="' + t.hora + '"></div>' +
        '<div class="campo"><label for="tf-' + t.id + '">Fim</label><input id="tf-' + t.id + '" type="time" data-k="fim" value="' + t.fim + '"></div>' +
        '<div class="campo"><label for="tq-' + t.id + '">Vagas</label><input id="tq-' + t.id + '" type="number" min="1" data-k="vagas" value="' + t.vagas + '"></div>' +
        '<button class="btn btn-perigo mini" type="button" data-rm-turma="' + t.id + '">Remover</button>' +
        '<p class="info-t">' + n + ' de ' + t.vagas + ' vagas ocupadas · no site: ' + esc(DB.horario(t)) + '</p></div>';
    }).join('') || '<p class="vazio-adm">Nenhuma turma.</p>';
  }
  $('#lista-turmas').addEventListener('change', function (ev) {
    var box = ev.target.closest('[data-t]'); if (!box) return;
    var t = DB.turma(box.getAttribute('data-t')), k = ev.target.getAttribute('data-k'); if (!t || !k) return;
    if (k === 'dia') t.dias = $$('input[data-k=dia]:checked', box).map(function (c) { return +c.value; });
    else if (k === 'vagas') t.vagas = Math.max(1, parseInt(ev.target.value, 10) || 1);
    else if (ev.target.value) t[k] = ev.target.value;
    salva(); pTurmas();
  });
  $('#lista-turmas').addEventListener('click', function (ev) {
    var b = ev.target.closest('[data-rm-turma]'); if (!b) return;
    var id = b.getAttribute('data-rm-turma'), n = alunosDa(id).length;
    if (!window.confirm(n ? 'Esta turma tem ' + n + ' alunos. Remover mesmo assim? Eles ficam sem essa turma na ficha.' : 'Remover esta turma?')) return;
    d.turmas = d.turmas.filter(function (t) { return t.id !== id; });
    d.alunos.forEach(function (a) { a.turmas = a.turmas.filter(function (x) { return x !== id; }); });
    salva(); pTurmas();
  });
  $('#bt-nova-turma').addEventListener('click', function () {
    d.turmas.push({ id: DB.id('t'), nome: 'Nova turma', nivel: 'iniciante', dias: [1, 3], hora: '19:00', fim: '20:00', vagas: 12 });
    salva(); pTurmas();
    var ult = $$('.turma-ed input[data-k=nome]').pop(); if (ult) { ult.focus(); ult.select(); }
  });

  /* ---------------- COPA E EVENTOS ---------------- */
  var cCat = CFG.copa.categorias[0].id;
  function pCopa() {
    $('#c-cat').innerHTML = CFG.copa.categorias.map(function (c) {
      var n = d.inscricoes.filter(function (i) { return i.cat === c.id; }).length;
      return '<button type="button" data-cat="' + c.id + '" aria-pressed="' + (c.id === cCat) + '">' + esc(c.nome) + ' · ' + n + '/' + c.vagas + '</button>';
    }).join('');
    var ins = d.inscricoes.filter(function (i) { return i.cat === cCat; });
    var pend = ins.filter(function (i) { return i.status === 'pendente'; }).length;
    $('#c-conta').textContent = ins.length + ' duplas · ' + pend + ' pendentes';
    $('#c-inscritos').innerHTML = ins.length ? ins.map(function (i) {
      return '<div class="item"><div class="info"><b>' + esc(DB.semExemplo(i.atleta1)) + ' / ' + esc(DB.semExemplo(i.atleta2)) + (i.exemplo ? ' <small>(exemplo)</small>' : '') + '</b><small>' + esc(telFmt(i.telefone)) + ' · inscrita ' + esc(rel(i.criado).toLowerCase()) + '</small></div>' +
        '<div class="lado"><span class="selo ' + (i.status === 'confirmada' ? 'selo-ok' : 'selo-alerta') + '">' + (i.status === 'confirmada' ? 'Confirmada' : 'Pendente') + '</span>' +
        '<button class="btn btn-linha mini" type="button" data-conf="' + i.id + '">' + (i.status === 'confirmada' ? 'Voltar p/ pendente' : 'Confirmar') + '</button>' +
        '<a class="btn btn-zap mini" target="_blank" rel="noopener" href="' + esc(zapAluno(i.telefone, 'Oi, ' + primeiro(i.atleta1) + '! Aqui é o Prof. Marcelinho. Sua dupla com ' + primeiro(i.atleta2) + ' está ' + (i.status === 'confirmada' ? 'confirmada' : 'pré-inscrita') + ' na Copa Marcelinho. ')) + '">WhatsApp</a>' +
        '<button class="btn btn-perigo mini" type="button" data-rm-ins="' + i.id + '">Remover</button></div></div>';
    }).join('') : '<p class="vazio-adm">Nenhuma dupla nesta categoria.</p>';
    var js = d.jogos.filter(function (j) { return j.cat === cCat; });
    var opts = function (sel) { return '<option value="">A definir</option>' + ins.map(function (i) { return '<option value="' + i.id + '"' + (i.id === sel ? ' selected' : '') + '>' + esc(DB.dupla(i.id)) + '</option>'; }).join(''); };
    $('#c-jogos').innerHTML = js.length ? js.map(function (j) {
      return '<div class="jogo-ed" data-j="' + j.id + '"><div class="lado-j" style="grid-template-columns:1fr 1fr auto;margin:0">' +
        '<select data-k="fase" aria-label="Fase">' + FASES.map(function (f) { return '<option' + (f === j.fase ? ' selected' : '') + '>' + f + '</option>'; }).join('') + '</select>' +
        '<input data-k="quando" aria-label="Quando" value="' + esc(j.quando || '') + '" style="text-align:left;font-weight:600;font-size:1rem">' +
        '<button class="btn btn-perigo mini" type="button" data-rm-jogo="' + j.id + '" aria-label="Remover jogo">×</button></div>' +
        '<div class="lado-j"><select data-k="a" aria-label="Dupla 1">' + opts(j.a) + '</select><input data-k="pa" type="number" min="0" inputmode="numeric" aria-label="Placar dupla 1" value="' + (j.pa == null ? '' : j.pa) + '"></div>' +
        '<div class="lado-j"><select data-k="b" aria-label="Dupla 2">' + opts(j.b) + '</select><input data-k="pb" type="number" min="0" inputmode="numeric" aria-label="Placar dupla 2" value="' + (j.pb == null ? '' : j.pb) + '"></div></div>';
    }).join('') : '<p class="vazio-adm">Nenhum jogo nesta categoria.</p>';
    var evs = d.eventos.slice().sort(function (a, b) { return a.data < b.data ? -1 : 1; });
    $('#lista-eventos').innerHTML = evs.length ? evs.map(function (e) {
      return '<div class="item"><div class="info"><b>' + esc(e.nome) + '</b><small>' + esc(DB.curto(e.data)) + ' · ' + esc(hora(e.hora)) + ' · ' + esc(e.local) + (e.data < DB.hoje() ? ' · já passou' : '') + '</small></div><div class="lado"><button class="btn btn-perigo mini" type="button" data-rm-ev="' + e.id + '">Remover</button></div></div>';
    }).join('') : '<p class="vazio-adm">Nenhum evento.</p>';
  }
  $('#c-cat').addEventListener('click', function (ev) { var b = ev.target.closest('[data-cat]'); if (!b) return; cCat = b.getAttribute('data-cat'); pCopa(); });
  $('#c-inscritos').addEventListener('click', function (ev) {
    var b = ev.target.closest('[data-conf]'), r = ev.target.closest('[data-rm-ins]');
    if (b) { var i = DB.inscricao(b.getAttribute('data-conf')); i.status = i.status === 'confirmada' ? 'pendente' : 'confirmada'; salva(); pCopa(); }
    if (r) {
      var id = r.getAttribute('data-rm-ins'); if (!window.confirm('Remover esta dupla da Copa?')) return;
      d.inscricoes = d.inscricoes.filter(function (x) { return x.id !== id; });
      d.jogos.forEach(function (j) { if (j.a === id) j.a = null; if (j.b === id) j.b = null; });
      salva(); pCopa();
    }
  });
  $('#c-jogos').addEventListener('change', function (ev) {
    var box = ev.target.closest('[data-j]'); if (!box) return;
    var j = d.jogos.filter(function (x) { return x.id === box.getAttribute('data-j'); })[0], k = ev.target.getAttribute('data-k'); if (!j || !k) return;
    if (k === 'pa' || k === 'pb') { var v = ev.target.value === '' ? null : Math.max(0, parseInt(ev.target.value, 10) || 0); j[k] = v; }
    else j[k] = ev.target.value || null;
    salva();
  });
  $('#c-jogos').addEventListener('click', function (ev) {
    var b = ev.target.closest('[data-rm-jogo]'); if (!b) return;
    d.jogos = d.jogos.filter(function (j) { return j.id !== b.getAttribute('data-rm-jogo'); }); salva(); pCopa();
  });
  $('#bt-novo-jogo').addEventListener('click', function () { d.jogos.push({ id: DB.id('j'), cat: cCat, fase: 'Grupo A', a: null, b: null, pa: null, pb: null, quando: '' }); salva(); pCopa(); });
  $('#lista-eventos').addEventListener('click', function (ev) {
    var b = ev.target.closest('[data-rm-ev]'); if (!b) return;
    d.eventos = d.eventos.filter(function (e) { return e.id !== b.getAttribute('data-rm-ev'); }); salva(); pCopa();
  });
  $('#form-evento').addEventListener('submit', function (ev) {
    ev.preventDefault();
    var nome = $('#ev-nome').value.trim(), data = $('#ev-data').value;
    if (!nome || !data) return;
    d.eventos.push({ id: DB.id('e'), nome: nome, data: data, hora: $('#ev-hora').value, local: $('#ev-local').value.trim() || CFG.local, tipo: 'evento', texto: '' });
    salva(); this.reset(); $('#ev-local').value = 'Arena do CTF · Clube Espanhol'; pCopa();
  });

  /* ---------------- AVISOS ---------------- */
  function nomePara(p) {
    if (p === 'todos') return 'Todos os alunos';
    var n = CFG.niveis.filter(function (x) { return x.id === p; })[0]; if (n) return 'Nível ' + n.nome;
    var t = DB.turma(p); return t ? 'Turma ' + t.nome : p;
  }
  function pAvisos() {
    $('#av-para').innerHTML = '<option value="todos">Todos os alunos</option>' +
      '<optgroup label="Por nível">' + CFG.niveis.map(function (n) { return '<option value="' + n.id + '">Nível ' + esc(n.nome) + '</option>'; }).join('') + '</optgroup>' +
      '<optgroup label="Por turma">' + d.turmas.map(function (t) { return '<option value="' + t.id + '">' + esc(t.nome) + '</option>'; }).join('') + '</optgroup>';
    var avs = d.avisos.slice().sort(function (a, b) { return (b.fixo - a.fixo) || (a.data < b.data ? 1 : -1); });
    $('#lista-avisos').innerHTML = avs.length ? avs.map(function (v) {
      return '<div class="item"><div class="info"><b>' + esc(v.titulo) + (v.fixo ? ' <span class="tag-ex" style="border-style:solid">Fixado</span>' : '') + '</b><small>' + esc(DB.dm(v.data)) + ' · ' + esc(nomePara(v.para)) + '</small><p style="margin-top:.3rem">' + esc(v.texto) + '</p></div>' +
        '<div class="lado"><button class="btn btn-linha mini" type="button" data-fixa="' + v.id + '">' + (v.fixo ? 'Desafixar' : 'Fixar') + '</button><button class="btn btn-perigo mini" type="button" data-rm-av="' + v.id + '">Apagar</button></div></div>';
    }).join('') : '<p class="vazio-adm">Nenhum aviso publicado.</p>';
  }
  $('#form-aviso').addEventListener('submit', function (ev) {
    ev.preventDefault();
    var tit = $('#av-tit').value.trim(), txt = $('#av-txt').value.trim();
    if (!tit || !txt) return;
    d.avisos.unshift({ id: DB.id('v'), data: DB.hoje(), titulo: tit, texto: txt, para: $('#av-para').value, fixo: $('#av-fixo').checked });
    salva(); this.reset(); pAvisos(); flash($('#av-ok'), 'Aviso publicado. Já aparece na área do aluno.');
  });
  $('#lista-avisos').addEventListener('click', function (ev) {
    var f = ev.target.closest('[data-fixa]'), r = ev.target.closest('[data-rm-av]');
    if (f) { d.avisos.forEach(function (v) { if (v.id === f.getAttribute('data-fixa')) v.fixo = !v.fixo; }); salva(); pAvisos(); }
    if (r) { d.avisos = d.avisos.filter(function (v) { return v.id !== r.getAttribute('data-rm-av'); }); salva(); pAvisos(); }
  });

  /* ---------------- AJUSTES ---------------- */
  function pAjustes() {
    $('#planos-campos').innerHTML = d.planos.map(function (p) {
      return '<div class="campo"><label for="pl-' + p.id + '">' + esc(p.nome) + ' (R$ por mês)</label><input id="pl-' + p.id + '" data-pl="' + p.id + '" type="number" min="0" step="1" inputmode="numeric" placeholder="a confirmar" value="' + (p.valor || '') + '"></div>';
    }).join('');
  }
  $('#form-planos').addEventListener('submit', function (ev) {
    ev.preventDefault();
    $$('[data-pl]').forEach(function (i) { var p = DB.plano(i.getAttribute('data-pl')); p.valor = Math.max(0, parseInt(i.value, 10) || 0); });
    salva(); flash($('#pl-ok'), 'Valores salvos.');
  });
  $('#bt-recomecar').addEventListener('click', function () {
    if (!window.confirm('Apagar tudo o que foi mexido neste aparelho e voltar aos dados de exemplo?')) return;
    d = DB.recomeca(); ativa('geral');
  });

  mostra();
})();
