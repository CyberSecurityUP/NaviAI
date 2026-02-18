1) Objetivo do produto (visão rápida)

Um web app responsivo (PWA) onde o idoso:

toca num ícone gigante de microfone e fala o que precisa

recebe resposta em texto + voz

se pedir “como fazer”, o sistema pode mostrar um passo a passo e/ou abrir um vídeo confiável

toca num ícone grande de câmera e tira foto de algo (tela, boleto, documento, remédio) e o assistente explica

ao criar conta, há um assistente falado guiando cada etapa

2) Princípios de UX para idoso (o que dita o design)

1 ação principal por tela (microfone no centro)

botões enormes, alto contraste, sem menus escondidos

linguagem simples e respostas em passos curtos (“Passo 1… Passo 2…”)

confirmações claras antes de abrir links (“Posso abrir um vídeo?”)

modo acessibilidade sempre visível (toggle grande)

sempre ler em voz alta quando o modo estiver ativo

3) Componentes (arquitetura em camadas)
A) Frontend (Web/PWA)

Responsivo + acessível

Tela principal:
[MIC gigante] + [CÂMERA] + [AJUDA] + [ACESSIBILIDADE]

STT/TTS:

Preferência: Web Speech API (quando disponível no navegador)

Fallback: enviar áudio pro backend (STT server-side)

Câmera:

getUserMedia() para tirar foto

“Cartões” de resposta:

Resposta curta

Botões: “Ouvir”, “Ver passo a passo”, “Abrir vídeo confiável”

Mostrar fonte (importante pra confiança)

B) Backend (API)

Um backend que coordena tudo:

API Gateway (FastAPI/Node)

Sessões e autenticação (cookies/sessão simples, “lembrar de mim”)

Orquestrador (o “cérebro” que decide qual modelo/serviço chamar)

Módulos de ferramentas (tools)

C) Camada de IA (LLM + modelos auxiliares)

Aqui entra “integra outros modelos”:

LLM Orquestrador (principal)

entende intenção (“quer tutorial”, “quer resolver um problema”, “quer abrir vídeo”)

escolhe ferramentas

gera resposta final em linguagem simples

STT (Speech-to-Text)

converte voz em texto (browser ou servidor)

TTS (Text-to-Speech)

lê as respostas em voz alta

também narra onboarding (“criar conta”)

Modelo de Visão

analisa a foto e descreve o que está vendo

extrai contexto (“isso parece uma tela de pagamento”, “isso é um boleto”, etc.)

(Opcional) OCR para ler textos na imagem

RAG / Busca Confiável

busca resposta em uma base confiável (guias, FAQs, fontes curadas)

devolve trechos com referência

o LLM só “fala” com apoio dessas fontes quando for tutorial sensível

Recomendador de Vídeos Confiáveis

busca e seleciona vídeo em fontes confiáveis (mais abaixo explico como)

4) Fluxos principais (como funciona na prática)
Fluxo 1: Pergunta por voz

idoso toca no MIC

fala: “Como pagar uma conta nesse aplicativo?”

STT → texto

Orquestrador classifica intenção:

“tutorial passo a passo” + possivelmente “abrir vídeo”

RAG consulta base confiável + recomenda vídeo

LLM responde em passos curtos + oferece botão “Abrir vídeo confiável”

TTS lê a resposta

Fluxo 2: Ajuda com câmera (foto)

toca no ícone câmera

tira foto (ex.: tela do app, boleto, erro)

Visão/OCR extrai contexto

LLM explica “o que aparece na tela” e orienta em passos

Se detectar risco (dados sensíveis):

“Vejo informações pessoais. Quer que eu oculte isso e explique só o necessário?”

Fluxo 3: Criar conta com voz guiada

“Criar conta”

TTS entra em modo narrador:

“Agora vamos criar sua conta. Vou explicar cada tela.”

Cada etapa tem:

texto gigante + narração

1 campo por vez (nome, e-mail/telefone, senha)

Ao finalizar:

“Quer ativar o Modo Acessibilidade automaticamente sempre que entrar?”

5) “Vídeos confiáveis”: como garantir fonte boa

Para evitar que o idoso caia em tutorial ruim/golpe, faça assim:

Opção recomendada (mais segura no MVP)

Whitelist (lista curada)

canais oficiais (ex.: governo, bancos oficiais, apps oficiais, instituições reconhecidas)

playlists próprias “Como fazer X”

atualização manual/semiautomática

Opção avançada (automática com pontuação de confiança)

busca vídeos, mas só aceita se passar num Trust Score, por exemplo:

canal verificado / domínio oficial

título e descrição compatíveis

baixo risco de termos típicos de golpe

preferência por vídeos recentes (app muda muito)

sempre mostrar: “Fonte: Canal X (verificado)”

6) Modo Acessibilidade (o que ele liga/desliga)

Um botão grande “👁 Acessibilidade” que abre um painel simples:

Fonte gigante (ex.: 120% / 150% / 200%)

Alto contraste

Layout simplificado (remove tudo que não é essencial)

Ler tudo em voz alta

Modo “toque fácil” (áreas clicáveis maiores)

Velocidade da voz (lenta / normal)

Detalhe importante: o modo deve ser persistente (salvo por usuário) e acessível em 1 toque na tela principal.

7) Segurança e privacidade (essencial para idoso)

Como você já curte privacidade, isso aqui vira diferencial:

não armazenar áudio/fotos por padrão

usar só para processamento e apagar (com opção “salvar no histórico”)

criptografia em trânsito e em repouso

alerta de dados sensíveis (documentos, CPF, boletos)

logs com mínimo necessário

LGPD: tela simples de consentimento narrada

8) Stack sugerida (bem prática)

Frontend

Next.js/React (ou Vue) + CSS com tokens de acessibilidade

PWA (instala como “app” no celular)

Web Speech API (quando der) + fallback via backend

Backend

FastAPI (Python) ou Node (Nest)

Postgres (usuários/histórico) + Redis (sessão/fila)

Armazenamento de arquivos (S3 compatível) opcional

IA

LLM principal (orquestrador)

STT/TTS (serviço/browser)

Visão/OCR

Vector store (pgvector no Postgres já resolve no começo)

9) Diagrama textual (visão macro)

Usuário (voz/câmera) → Web App (PWA) → API → Orquestrador →

STT (voz→texto)

Visão/OCR (foto→descrição)

RAG (base confiável → trechos + fontes)

Vídeos (whitelist/score)

LLM (gera resposta final)

TTS (texto→voz)

10) Plano de MVP (pra sair do papel rápido)

UI com MIC gigante + resposta falada

Modo acessibilidade (fonte/contraste/ler em voz alta)

“Como fazer” com base confiável (RAG simples)

Botão “Abrir vídeo confiável” (whitelist)

Câmera: tirar foto e explicar o que vê

Criar conta com onboarding narrado
