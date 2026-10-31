/* =====================================================================
   CTF Marcelinho — ÚNICO arquivo de dados fixos do site.
   O que é fato veio da bio e das legendas do @ctfmarcelinho (out/2026).
   O que está marcado "exemplo" é provisório e está na lista
   "A confirmar" do README: horários, níveis, valores, categorias.
   ===================================================================== */
window.CTF = {
  modoDemo: true,               // true = dados de exemplo no navegador (localStorage)
  prefixo: 'ctf_',              // chaves do localStorage
  supabaseUrl: '',              // modo real: preencher (ver db/schema.sql)
  supabaseAnon: '',

  nome: 'CTF Marcelinho',
  professor: 'Prof. Marcelinho',
  modalidade: 'Futevôlei',
  local: 'Clube Espanhol',
  cidade: 'Salvador · BA',
  whatsapp: '5571991735120',
  whatsappVisivel: '(71) 99173-5120',
  instagram: 'ctfmarcelinho',
  mapa: 'https://www.google.com/maps/search/?api=1&query=Clube+Espanhol+Salvador+BA',
  mapaEmbed: 'https://www.google.com/maps?q=Clube+Espanhol,+Salvador+-+BA&output=embed',

  titulos: { mundial: 5, brasileiro: 10 },

  // Logins de demonstração (mostrados na tela de login). No modo real: Supabase Auth.
  loginAluno: { email: 'aluno@demo', senha: '1234' },
  loginProfessor: { email: 'professor@demo', senha: 'penta5' },

  // Níveis das turmas (EXEMPLO — confirmar com o professor)
  niveis: [
    { id: 'iniciante', nome: 'Iniciante', texto: 'Primeiro contato com a bola na areia: domínio, passe e posição na quadra.' },
    { id: 'intermediario', nome: 'Intermediário', texto: 'Já joga. Aqui entra levantada com intenção, ataque e leitura do jogo.' },
    { id: 'avancado', nome: 'Avançado', texto: 'Ritmo de competição. Treino padrão penta para quem disputa torneio.' },
    { id: 'feminina', nome: 'Feminina', texto: 'Turma só delas. #mulhertbjoga, como ele escreve nas legendas.' }
  ],

  // Planos (EXEMPLO — valores fictícios, só aparecem no painel e na área do aluno)
  planos: [
    { id: 'p2', nome: '2x por semana', valor: 0 },
    { id: 'p3', nome: '3x por semana', valor: 0 },
    { id: 'livre', nome: 'Livre (todas as turmas do nível)', valor: 0 }
  ],

  fundamentos: [
    { id: 'saque', nome: 'Saque' },
    { id: 'recepcao', nome: 'Recepção' },
    { id: 'levantada', nome: 'Levantada' },
    { id: 'ataque', nome: 'Ataque' },
    { id: 'defesa', nome: 'Defesa' },
    { id: 'leitura', nome: 'Leitura de jogo' }
  ],

  // Copa Marcelinho. Fato: a arte oficial de 17/10/2025 é da "3ª Copa Marcelinho Futevôlei".
  // Data, local, categorias e taxa da próxima edição: A CONFIRMAR.
  copa: {
    edicaoAnterior: '3ª Copa Marcelinho',
    proxima: 'Próxima edição',
    data: 'Data a confirmar',
    local: 'Arena do CTF · Clube Espanhol',
    taxa: 'Taxa a confirmar',
    categorias: [
      { id: 'iniciante', nome: 'Iniciante', vagas: 16 },
      { id: 'intermediario', nome: 'Intermediário', vagas: 16 },
      { id: 'feminino', nome: 'Feminino', vagas: 12 },
      { id: 'misto', nome: 'Misto', vagas: 12 }
    ]
  }
};
