//define o endereço do nosso back-end

const API_URL = 'http://localhost:3000'; 

console.log("Script carregado e pronto para conectar com a API!");

// lógica do login
const formLogin = document.getElementById('formLogin');

//verificamos se o formulário existe na página atual para evitar erros de console
if (formLogin) {
    formLogin.addEventListener('submit', async function(e) {
        //passo 1: impede o comportamento padrão do navegador (recarregar a página)
        e.preventDefault(); 
        
        // passo 2 : Captura os valores digitados nos inputs pelo ID
        const email = document.getElementById('email').value;
        const senha = document.getElementById('senha').value;

        try {
            // Passo 3: comunicação com o servidor (fetch API)
            //O 'await' pausa a execução até o servidor responder.
            const response = await fetch(`${API_URL}/login`, {
                method: 'POST', // método http para enviar dados sesíveis
                headers: {
                    'Content-Type': 'application/json' // avisa o back-end que estamos enviando JSON
                },
                body: JSON.stringify({ email, senha }) // Transforma o objeto JS em texto JSON
            });
            
            // Converte a resposta bruta do servidor de volta para Objeto JavaScript
            const data = await response.json(); 
            // Passo 4: verifica o status da resposta
            if (response.ok) {
                // sucesso 
                alert('Sucesso! ' + data.mensagem);
    
                // Salvamos o ID e nome no navegador para usar nas próximas páginas
                //Isso permite que a página principal.html saiba quem está logado
                localStorage.setItem('usuarioId', data.usuarioId);
                localStorage.setItem('usuarioNome', data.nome);

                // Redirecionamento para o dashboard
                window.location.href = 'principal.html'; 
            }
                
                
            else {
                alert('Erro: ' + data.erro);
            }

        } catch (error) {
            console.error('Erro na requisição:', error);
            alert('Erro ao conectar com o servidor. Verifique se o Node está rodando.');
        }
    });
}

// Lógica do cadastro
// Envia os dados do novo usuário para persistência no banco.

const formCadastro = document.getElementById('formCadastro');

if (formCadastro) {
    formCadastro.addEventListener('submit', async function(e) {
        e.preventDefault();

        const nome = document.getElementById('nome').value;
        const email = document.getElementById('email').value;
        const senha = document.getElementById('senha').value;

        try {
            const response = await fetch(`${API_URL}/cadastro`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ nome, email, senha })
            });

            const data = await response.json();

            if (response.ok) {
                alert('Cadastro realizado com sucesso! Agora faça login.');
                // Redireciona o usuário para a tela de login
                window.location.href = 'index.html';
            } else {
                alert('Erro ao cadastrar: ' + data.erro);
            }

        } catch (error) {
            console.error('Erro na requisição:', error);
            alert('Erro ao conectar com o servidor.');
        }
    });
}