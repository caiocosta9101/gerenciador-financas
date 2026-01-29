💰 Gerenciador de Finanças Pessoais com Inteligência Artificial

Aplicação full stack para controle de finanças pessoais, desenvolvida com JavaScript, Node.js, PostgreSQL e HTML/CSS, com integração de Inteligência Artificial para leitura de texto e imagens.

O objetivo do projeto foi criar uma solução prática para registrar e visualizar gastos e ganhos, reduzindo atrito do usuário através de IA — permitindo cadastrar transações digitando frases naturais ou enviando fotos de notas fiscais.

🔗 Demo: gerenciador-financas-lake.vercel.app

🚀 Funcionalidades
🔐 Autenticação

Cadastro de usuário com senha criptografada (bcrypt)

Login com JWT

Proteção de rotas no back-end

Sessão expira automaticamente

📊 Controle Financeiro

Cadastro de entradas e saídas

Edição e exclusão de transações

Categorias financeiras organizadas

Saldo total calculado automaticamente

Histórico completo de transações

📅 Filtros Inteligentes

Visualização por:

Semana

Mês

Ano

Filtro aplicado direto no banco de dados

📈 Dashboard

Gráfico de entradas vs saídas (Chart.js)

Totais atualizados em tempo real

Interface simples e responsiva

🤖 Inteligência Artificial Integrada
✍️ IA por Texto

O usuário pode digitar frases como:

“Uber 32 reais”
“Salário 2500”
“Mercado 180”

A IA interpreta automaticamente e retorna:

descrição

valor

tipo (entrada/saída)

categoria correta

📷 IA por Imagem

Upload de foto de nota fiscal ou recibo

Compressão da imagem no front-end para melhor performance

A IA analisa a imagem e extrai:

valor total

descrição

categoria

tipo da transação

🛠️ Tecnologias Utilizadas
Front-end

HTML5

CSS3

JavaScript puro (Vanilla JS)

Chart.js

DOMPurify

Back-end

Node.js

Express

JWT (Autenticação)

Bcrypt (Criptografia de senha)

Multer (Upload de imagens)

Google Gemini API (IA texto e imagem)

Banco de Dados

PostgreSQL (Neon)

Deploy

Front-end e Back-end hospedados no Vercel

Banco de dados em nuvem

🧠 Destaques Técnicos

Separação clara entre front-end e API

Middleware de autenticação JWT

Queries seguras com parâmetros

Validação de dados

Compressão de imagem no cliente

Tratamento de erros e rate limit da IA


▶️ Como rodar o projeto localmente
# Clone o repositório
git clone https://github.com/caiocosta9101/gerenciador-financas.git

# Entre na pasta do back-end
cd gerenciador-financas/back-end

# Instale as dependências
npm install

# Configure o arquivo .env
DATABASE_URL=postgres://...
JWT_SECRET=sua_chave
GEMINI_API_KEY=sua_chave

# Rode o servidor
node server.js


Depois disso, acesse:

http://localhost:3000

📌 Próximos Passos (Roadmap)

Relatórios mensais em PDF

Metas financeiras

Categorias customizadas

Testes automatizados

👨‍💻 Autor

Caio Felipe Costa Souza
Desenvolvedor Full Stack Júnior
📍 Brasil

🔗 GitHub: https://github.com/caiocosta9101

🔗 LinkedIn: https://www.linkedin.com/in/caio-costa-12622131b/