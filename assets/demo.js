/* =====================================================================
   CTF Marcelinho — motor do modo demonstração.
   Guarda tudo no navegador (localStorage, chave ctf_dados) e expõe
   window.CTFDB para o site, a área do aluno e o painel lerem e gravarem
   o MESMO lugar: aviso criado no painel aparece no aluno.html, turma
   editada aparece na grade do index, inscrição da copa entra no painel.
   Alunos, duplas e placares são fictícios e marcados "(exemplo)".
   Carrega depois de config.js e antes do script da página.
   ===================================================================== */
(function () {
  'use strict';
  var CFG = window.CTF || {};
  var PFX = CFG.prefixo || 'ctf_';
  var K = PFX + 'dados', VERSAO = 3;

  /* ---------- datas ---------- */
  function iso(d) { return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); }
  function deIso(s) { var p = String(s).split('-'); return new Date(+p[0], +p[1] - 1, +p[2], 12); }
  function hoje() { return iso(new Date()); }
  function soma(s, n) { var d = deIso(s); d.setDate(d.getDate() + n); return iso(d); }
  function somaMes(s, n) { var d = deIso(s), dia = d.getDate(); d.setDate(1); d.setMonth(d.getMonth() + n); var ult = new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate(); d.setDate(Math.min(dia, ult)); return iso(d); }
  function difDias(a, b) { return Math.round((deIso(b) - deIso(a)) / 86400000); }
  var SEMANA = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];
  var SEM_C = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
  var MESES = ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho', 'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'];
  function dm(s) { var d = deIso(s); return String(d.getDate()).padStart(2, '0') + '/' + String(d.getMonth() + 1).padStart(2, '0'); }
  function curto(s) { var d = deIso(s); return SEM_C[d.getDay()] + ', ' + dm(s); }
  function longo(s) { var d = deIso(s); return d.getDate() + ' de ' + MESES[d.getMonth()]; }

  /* ---------- sorteio repetível (mesma demo em todo aparelho) ---------- */
  function rng(seed) { return function () { seed |= 0; seed = seed + 0x6D2B79F5 | 0; var t = Math.imul(seed ^ seed >>> 15, 1 | seed); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }

  /* ---------- semente ---------- */
  function semente() {
    var r = rng(55);
    var H = hoje();

    // Turmas e horários: EXEMPLO (dias 0=dom ... 6=sáb)
    var turmas = [
      { id: 't1', nome: 'Iniciante manhã', nivel: 'iniciante', dias: [1, 3, 5], hora: '06:00', fim: '07:00', vagas: 12 },
      { id: 't2', nome: 'Intermediário manhã', nivel: 'intermediario', dias: [1, 3, 5], hora: '07:00', fim: '08:00', vagas: 12 },
      { id: 't3', nome: 'Feminina', nivel: 'feminina', dias: [2, 4], hora: '17:00', fim: '18:00', vagas: 12 },
      { id: 't4', nome: 'Iniciante noite', nivel: 'iniciante', dias: [2, 4], hora: '18:00', fim: '19:00', vagas: 12 },
      { id: 't5', nome: 'Avançado', nivel: 'avancado', dias: [1, 3, 5], hora: '18:00', fim: '19:30', vagas: 10 },
      { id: 't6', nome: 'Aulão de sábado', nivel: 'intermediario', dias: [6], hora: '08:00', fim: '10:00', vagas: 16 }
    ];

    // [nome, turmas, plano, desde (dias atrás), venc (dias a partir de hoje), base de nota]
    var A = [
      ['Rafaela Souza', ['t3', 't6'], 'p3', 210, 6, 6.2],
      ['Bruno Nascimento', ['t5'], 'p3', 420, 12, 8.1],
      ['Juliana Matos', ['t3'], 'p2', 95, -4, 4.8],
      ['Caio Brandão', ['t2', 't6'], 'p3', 160, 2, 6.6],
      ['Lucas Teles', ['t1'], 'p2', 35, 20, 3.4],
      ['Marina Pires', ['t3'], 'p2', 70, -11, 5.1],
      ['Diego Ramos', ['t5'], 'livre', 610, 9, 8.6],
      ['Thaís Moura', ['t3', 't6'], 'p3', 130, 15, 6.0],
      ['Pedro Galvão', ['t4'], 'p2', 22, 25, 3.0],
      ['Fernanda Lima', ['t1'], 'p2', 48, -2, 3.9],
      ['Gustavo Rocha', ['t2'], 'p2', 300, 4, 7.0],
      ['Aline Barreto', ['t3'], 'p2', 120, 1, 5.6],
      ['Vitor Hugo Sá', ['t5', 't6'], 'livre', 540, 18, 8.3],
      ['Camila Torres', ['t4'], 'p2', 15, 27, 2.9],
      ['Renan Queiroz', ['t2'], 'p3', 200, -7, 6.9],
      ['Beatriz Almeida', ['t3'], 'p3', 260, 11, 6.8],
      ['Igor Santana', ['t1', 't6'], 'p3', 60, 8, 4.4],
      ['Larissa Couto', ['t4'], 'p2', 40, -1, 3.6],
      ['Mateus Freire', ['t5'], 'p3', 380, 3, 7.9],
      ['Natália Reis', ['t3'], 'p2', 85, 22, 5.0]
    ];
    var FUND = (CFG.fundamentos || []).map(function (f) { return f.id; });
    var alunos = A.map(function (a, i) {
      var desde = soma(H, -a[3]);
      var nivelT = turmas.filter(function (t) { return t.id === a[1][0]; })[0];
      // avaliações mensais desde a entrada (máx. 6), nota sobe aos poucos
      var aval = [], n = Math.min(6, Math.max(1, Math.floor(a[3] / 30)));
      for (var k = 0; k < n; k++) {
        var notas = {};
        FUND.forEach(function (f, j) {
          var v = a[5] - (n - 1 - k) * (0.35 + r() * 0.25) + (j % 3 - 1) * 0.6 + (r() - .5) * .8;
          notas[f] = Math.max(1, Math.min(10, Math.round(v * 2) / 2));
        });
        aval.push({ data: soma(H, -(n - 1 - k) * 30 - 3), notas: notas });
      }
      var venc = soma(H, a[4]);
      var pags = [];
      for (var m = 1; m <= Math.min(5, Math.floor(a[3] / 30)); m++) pags.push({ data: somaMes(venc, a[4] < 0 ? -m - 1 : -m), ref: somaMes(venc, -m) });
      return {
        id: 'a' + (i + 1), nome: a[0] + ' (exemplo)', telefone: '7199000' + String(1000 + i),
        email: i === 0 ? CFG.loginAluno.email : '', nivel: nivelT ? nivelT.nivel : 'iniciante',
        turmas: a[1], plano: a[2], desde: desde, vencimento: venc, pagamentos: pags.reverse(),
        avaliacoes: aval, exemplo: true
      };
    });

    // presenças dos últimos 60 dias
    var presencas = {};
    for (var d = -60; d <= 0; d++) {
      var dia = soma(H, d), wd = deIso(dia).getDay();
      turmas.forEach(function (t) {
        if (t.dias.indexOf(wd) < 0) return;
        if (d === 0) return; // hoje o professor marca no painel
        var lista = alunos.filter(function (al) { return al.turmas.indexOf(t.id) >= 0 && al.desde <= dia; })
          .filter(function (al) { var taxa = al.vencimento < H ? .55 : .82; return r() < taxa; })
          .map(function (al) { return al.id; });
        presencas[t.id + '|' + dia] = lista;
      });
    }

    var avisos = [
      { id: 'v1', data: soma(H, -1), titulo: 'Sábado tem aulão', texto: 'Aulão de sábado com jogo valendo. Chega 15 min antes pra aquecer, que o treino é padrão penta.', para: 'todos', fixo: true },
      { id: 'v2', data: soma(H, -3), titulo: 'Turma feminina', texto: 'Meninas, na quinta a gente treina defesa. Tragam água e protetor. #mulhertbjoga', para: 'feminina', fixo: false },
      { id: 'v3', data: soma(H, -8), titulo: 'Inscrições da Copa', texto: 'Quem vai jogar a Copa Marcelinho já pode fechar a dupla e se inscrever pelo site.', para: 'todos', fixo: false }
    ];

    var eventos = [
      { id: 'e1', nome: 'Aulão de sábado', data: proxDia(H, 6), hora: '08:00', local: 'Arena do CTF · Clube Espanhol', tipo: 'treino', texto: 'Jogo valendo para todos os níveis (exemplo).' },
      { id: 'e2', nome: 'Desafio do Penta', data: soma(H, 16), hora: '15:00', local: 'Arena do CTF · Clube Espanhol', tipo: 'desafio', texto: 'Desafio interno do CT. Data de exemplo.' },
      { id: 'e3', nome: 'Copa Marcelinho', data: soma(H, 37), hora: '08:00', local: 'Arena do CTF · Clube Espanhol', tipo: 'copa', texto: 'Data de exemplo: a data real será confirmada pelo professor.' }
    ];

    // Copa: duplas e jogos de exemplo
    var D = {
      iniciante: [['Lucas Teles', 'Pedro Galvão'], ['Igor Santana', 'Rafael Dias'], ['Fernanda Lima', 'Camila Torres'], ['Henrique Lopes', 'Davi Costa'], ['Tiago Prado', 'Murilo Neves'], ['Larissa Couto', 'Paulo Vidal']],
      intermediario: [['Caio Brandão', 'Gustavo Rocha'], ['Renan Queiroz', 'Felipe Araújo'], ['Mateus Freire', 'Leo Bastos'], ['André Pinto', 'Sávio Melo']],
      feminino: [['Rafaela Souza', 'Thaís Moura'], ['Juliana Matos', 'Aline Barreto'], ['Beatriz Almeida', 'Natália Reis'], ['Marina Pires', 'Clara Fontes']],
      misto: [['Bruno Nascimento', 'Beatriz Almeida'], ['Diego Ramos', 'Rafaela Souza'], ['Vitor Hugo Sá', 'Thaís Moura'], ['Gustavo Rocha', 'Aline Barreto']]
    };
    var inscricoes = [], jogos = [], ni = 0, nj = 0;
    Object.keys(D).forEach(function (cat) {
      D[cat].forEach(function (p, i) {
        ni++;
        inscricoes.push({ id: 'i' + ni, cat: cat, atleta1: p[0] + ' (exemplo)', atleta2: p[1] + ' (exemplo)', telefone: '7199100' + String(1000 + ni),
          criado: soma(H, -20 + i), status: i % 4 === 3 ? 'pendente' : 'confirmada', exemplo: true });
      });
    });
    function insc(cat) { return inscricoes.filter(function (x) { return x.cat === cat; }); }
    function jogo(cat, fase, a, b, pa, pb, quando) { nj++; jogos.push({ id: 'j' + nj, cat: cat, fase: fase, a: a, b: b, pa: pa, pb: pb, quando: quando }); }
    // feminino: semifinais jogadas, final pendente
    var f = insc('feminino');
    jogo('feminino', 'Semifinal', f[0].id, f[3].id, 18, 14, 'Sáb 09:00');
    jogo('feminino', 'Semifinal', f[1].id, f[2].id, 15, 18, 'Sáb 09:40');
    jogo('feminino', 'Final', f[0].id, f[2].id, null, null, 'Sáb 15:00');
    var i0 = insc('intermediario');
    jogo('intermediario', 'Semifinal', i0[0].id, i0[3].id, 18, 16, 'Sáb 10:20');
    jogo('intermediario', 'Semifinal', i0[1].id, i0[2].id, null, null, 'Sáb 11:00');
    jogo('intermediario', 'Final', null, null, null, null, 'Sáb 16:00');
    var ini = insc('iniciante');
    jogo('iniciante', 'Grupo A', ini[0].id, ini[1].id, 18, 12, 'Sáb 08:00');
    jogo('iniciante', 'Grupo A', ini[1].id, ini[2].id, 18, 17, 'Sáb 08:40');
    jogo('iniciante', 'Grupo A', ini[0].id, ini[2].id, null, null, 'Sáb 11:40');
    jogo('iniciante', 'Grupo B', ini[3].id, ini[4].id, 14, 18, 'Sáb 08:00');
    jogo('iniciante', 'Grupo B', ini[4].id, ini[5].id, null, null, 'Sáb 12:20');
    jogo('iniciante', 'Grupo B', ini[3].id, ini[5].id, null, null, 'Sáb 13:00');
    var mi = insc('misto');
    jogo('misto', 'Semifinal', mi[0].id, mi[3].id, null, null, 'Dom 09:00');
    jogo('misto', 'Semifinal', mi[1].id, mi[2].id, null, null, 'Dom 09:40');
    jogo('misto', 'Final', null, null, null, null, 'Dom 15:00');

    var experimentais = [
      { id: 'x1', nome: 'Sofia Andrade (exemplo)', telefone: '71990002001', nivel: 'Nunca joguei', turma: 'Feminina', quando: 'Terça à tarde', criado: soma(H, -1), status: 'novo' },
      { id: 'x2', nome: 'Henrique Lopes (exemplo)', telefone: '71990002002', nivel: 'Jogo na praia', turma: 'Intermediário manhã', quando: 'Segunda cedo', criado: soma(H, -2), status: 'agendada' },
      { id: 'x3', nome: 'Paula Reis (exemplo)', telefone: '71990002003', nivel: 'Nunca joguei', turma: 'Iniciante noite', quando: 'Quinta à noite', criado: soma(H, -6), status: 'virou aluno' }
    ];

    return { versao: VERSAO, turmas: turmas, alunos: alunos, presencas: presencas, avisos: avisos, eventos: eventos,
      inscricoes: inscricoes, jogos: jogos, experimentais: experimentais, planos: (CFG.planos || []).map(function (p) { return { id: p.id, nome: p.nome, valor: p.valor }; }) };
  }
  function proxDia(de, wd) { var d = deIso(de); d.setDate(d.getDate() + 1); while (d.getDay() !== wd) d.setDate(d.getDate() + 1); return iso(d); }

  /* ---------- leitura / gravação ---------- */
  var cache = null;
  function le() {
    if (cache) return cache;
    var d = null;
    try { d = JSON.parse(localStorage.getItem(K) || 'null'); } catch (e) { d = null; }
    if (!d || d.versao !== VERSAO) { d = semente(); grava(d); }
    cache = d;
    return d;
  }
  function grava(d) { cache = d || cache; try { localStorage.setItem(K, JSON.stringify(cache)); } catch (e) {} }
  function recomeca() { try { localStorage.removeItem(K); } catch (e) {} cache = null; return le(); }

  /* ---------- regras ---------- */
  function turma(id) { return (le().turmas.filter(function (t) { return t.id === id; })[0]) || null; }
  function aluno(id) { return (le().alunos.filter(function (a) { return a.id === id; })[0]) || null; }
  function plano(id) { return (le().planos.filter(function (p) { return p.id === id; })[0]) || { nome: '—', valor: 0 }; }
  function nivelNome(id) { return ((CFG.niveis || []).filter(function (n) { return n.id === id; })[0] || {}).nome || id; }
  function statusPag(a) {
    var dd = difDias(hoje(), a.vencimento);
    if (dd < 0) return { id: 'atrasada', nome: 'Atrasada', dias: -dd, txt: 'Atrasada há ' + (-dd) + (dd === -1 ? ' dia' : ' dias') };
    if (dd <= 5) return { id: 'vence', nome: 'Vence logo', dias: dd, txt: dd === 0 ? 'Vence hoje' : 'Vence em ' + dd + (dd === 1 ? ' dia' : ' dias') };
    return { id: 'emdia', nome: 'Em dia', dias: dd, txt: 'Em dia' };
  }
  // aulas previstas x presenças no mês corrente (até hoje)
  function freqMes(a, ref) {
    var d = le(), base = deIso(ref || hoje()), H = hoje();
    var ini = new Date(base.getFullYear(), base.getMonth(), 1, 12), previstas = 0, foi = 0, dias = [];
    for (var x = new Date(ini); x.getMonth() === base.getMonth() && iso(x) <= H; x.setDate(x.getDate() + 1)) {
      var s = iso(x);
      if (s < a.desde) continue;
      a.turmas.forEach(function (tid) {
        var t = turma(tid);
        if (!t || t.dias.indexOf(x.getDay()) < 0) return;
        var lista = d.presencas[tid + '|' + s];
        if (!lista) return; // aula ainda sem chamada
        previstas++;
        var veio = lista.indexOf(a.id) >= 0;
        if (veio) foi++;
        dias.push({ dia: s, turma: tid, veio: veio });
      });
    }
    return { previstas: previstas, foi: foi, pct: previstas ? Math.round(foi / previstas * 100) : 0, dias: dias };
  }
  function proximasAulas(a, n) {
    var out = [], d = deIso(hoje()), agora = new Date(), lim = 0;
    while (out.length < (n || 3) && lim < 21) {
      var s = iso(d);
      a.turmas.forEach(function (tid) {
        var t = turma(tid);
        if (!t || t.dias.indexOf(d.getDay()) < 0) return;
        if (s === hoje()) { var p = t.hora.split(':'); if (agora.getHours() * 60 + agora.getMinutes() > +p[0] * 60 + +p[1]) return; }
        out.push({ dia: s, turma: t });
      });
      d.setDate(d.getDate() + 1); lim++;
    }
    return out.sort(function (x, y) { return (x.dia + x.turma.hora) < (y.dia + y.turma.hora) ? -1 : 1; }).slice(0, n || 3);
  }
  function inscricao(id) { return (le().inscricoes.filter(function (i) { return i.id === id; })[0]) || null; }
  function dupla(id, curtoNome) {
    var i = inscricao(id);
    if (!i) return 'A definir';
    function n(s) { s = String(s).replace(/\s*\(exemplo\)/, ''); return curtoNome ? s.split(' ')[0] : s; }
    return n(i.atleta1) + ' / ' + n(i.atleta2);
  }
  function zap(texto, numero) { return 'https://wa.me/' + (numero || CFG.whatsapp) + '?text=' + encodeURIComponent(texto); }
  function semExemplo(s) { return String(s || '').replace(/\s*\(exemplo\)/, ''); }
  function id(pfx) { return (pfx || 'n') + Date.now().toString(36) + Math.random().toString(36).slice(2, 5); }
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function horario(t) { return t.dias.map(function (x) { return SEM_C[x]; }).join(' · ') + ' — ' + t.hora.replace(':00', 'h').replace(':', 'h') + ' às ' + t.fim.replace(':00', 'h').replace(':', 'h'); }

  window.CTFDB = {
    le: le, grava: grava, recomeca: recomeca,
    iso: iso, deIso: deIso, hoje: hoje, soma: soma, somaMes: somaMes, difDias: difDias, dm: dm, curto: curto, longo: longo,
    SEMANA: SEMANA, SEM_C: SEM_C, MESES: MESES,
    turma: turma, aluno: aluno, plano: plano, nivelNome: nivelNome, statusPag: statusPag, freqMes: freqMes,
    proximasAulas: proximasAulas, inscricao: inscricao, dupla: dupla, zap: zap, semExemplo: semExemplo, id: id, esc: esc, horario: horario
  };
})();
