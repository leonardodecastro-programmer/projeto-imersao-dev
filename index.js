import { inicializaModelo } from "./modelo.js";

let searchInput = ""; 
let type = "";
let jsonDataArray = [];

document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('input[name="tipo"]').forEach((radio) => {
    radio.addEventListener('change', (event) => {
      type = event.target.id;
      console.log(type);
    });
  });
});

const search = document.getElementById('search');
search.addEventListener('input', (event) => {
  searchInput = event.target.value;
  console.log(searchInput);
});

const chatbotConfig = {
  text: `Você é uma IA projetada para ajudar os usuários a encontrar filmes, séries e animes com base nas características de personagens, enredos ou nomes fornecidos por eles. Sua principal funcionalidade é receber descrições fornecidas pelos usuários, como características físicas, traços de personalidade, habilidades ou até falas de personagens, e usar essas informações para listar todas as produções possíveis com base na escolha do tipo de produção que o usuário deseja podendo ser filmes, séries ou animes.

Aqui está como você deve operar:

1. **Receber descrições de personagens**: Quando o usuário fornecer detalhes de um personagem (nome, aparência, habilidades, etc.), você deve processar essas informações e retornar uma lista de filmes, séries ou animes que possuam personagens com características semelhantes.

2. **Busca por enredo ou temática**: Se o usuário lembrar de detalhes do enredo ou da temática central da história, use essas informações para sugerir produções que correspondam às descrições.

3. **Busca por nome de personagem**: Caso o usuário forneça o nome de um personagem específico, você deve buscar produções onde esse personagem esteja presente e listar as opções encontradas.

Ao listar os resultados, sempre siga EXATAMENTE como esta no exemplo abaixo, com este padrao de markdown:

  * **Título do Filme ou Série ou Anime**
    *Gêneros: [gêneros]
    *Disponível em: [plataformas disponíveis]

Se houver mais de um resultado, apresente-os como uma lista com marcadores. As opções de plataformas são: Netflix, Amazon Prime Video, Disney+, HBO Max, Hulu, Apple TV+, Paramount+, Peacock, Crunchyroll e Mubi.

Caso seja perguntado sobre algo que não tenha relação com características de personagens, enredo ou nome de filmes, séries ou animes, voce deve retornar exatamente este texto para o usuário: "Não foi possível encontrar resultados para sua busca. Tente novamente com outras palavras."
  `
};

async function main() {
    const model = await inicializaModelo("gemini-1.0-pro");

    async function getGenerativeContent() {
        const searchButton = document.querySelector('button[type="submit"]');
        searchButton.classList.add('loading'); // Add loading class

        // Remove existing 'sem-resposta' tag if it exists
        const existingPTag = document.querySelector('.sem-resposta');
        if (existingPTag) {
            existingPTag.remove();
        }

        if (!type || !searchInput) {
            let pTag = document.createElement('p');
            pTag.className = 'sem-resposta';
            pTag.innerHTML = "Faltando tipo ou entrada de busca.";
            const firstSection = document.querySelector('main section');
            firstSection.parentNode.insertBefore(pTag, firstSection.nextSibling);
            searchButton.classList.remove('loading'); // Remove loading class
            return;
        }

        const prompt = `input: encontre todos os ${type} com as seguintes características: ${searchInput}`;

        const parts = [
            { text: chatbotConfig.text },
            { text: prompt },
            { text: "output:" }
        ];

        try {
            const result = await model.generateContent({
                contents: [{ role: "user", parts }]
            });

            const responseText = await result.response.text();
            console.log(responseText);
            jsonDataArray = parseResponseToArray(responseText);
            console.log(jsonDataArray);
            renderResults();

            if (responseText === "Não foi possível encontrar resultados para sua busca. Tente novamente com outras palavras.") {
                const pTag = document.createElement('p');
                pTag.className = 'sem-resposta';
                pTag.innerHTML = "Não foi possível encontrar resultados para sua busca.<br> Tente novamente com outras palavras.";
                const firstSection = document.querySelector('main section');
                firstSection.parentNode.insertBefore(pTag, firstSection.nextSibling);
            }

        } catch (error) {
            console.error("Erro ao gerar conteúdo:", error);
        } finally {
            searchButton.classList.remove('loading'); // Remove loading class
        }
    }

    function parseResponseToArray(responseText) {
        const jsonDataArray = [];
        // Dividir o texto por linha e percorrer para identificar padrões
        const lines = responseText.split('\n').map(line => line.trim()).filter(line => line);
    
        let currentItem = null;
    
        lines.forEach(line => {
            if (line.startsWith('* **') && line.endsWith('**')) {
                // Quando encontrar um novo título, salvar o item anterior (se houver) no array
                if (currentItem) {
                    jsonDataArray.push(currentItem);
                }
                // Criar um novo item para o próximo filme/série/anime
                currentItem = { title: line.replace('* **', '').replace('**', '').trim(), gêneros: [], disponivel: [], tipo: '' };
            } else if (line.startsWith('*Gêneros:')) {
                // Gêneros do título
                const generos = line.replace('*Gêneros:', '').split(',').map(g => g.trim());
                currentItem.gêneros = generos;
            } else if (line.startsWith('*Disponível em:')) {
                // Plataformas disponíveis
                const plataformas = line.replace('*Disponível em:', '').split(',').map(p => p.trim());
                currentItem.disponivel = plataformas;
            } else if (line.startsWith('*Tipo:')) {
                // Tipo (filme, série ou anime)
                const tipo = line.replace('*Tipo:', '').trim();
                currentItem.tipo = tipo;
            }
        });
    
        // Adicionar o último item ao array
        if (currentItem) {
            jsonDataArray.push(currentItem);
        }
    
        return jsonDataArray;
    }

    function renderResults() {
        const resultadosPesquisa = document.getElementById('resultados-pesquisa');
        resultadosPesquisa.innerHTML = ''; // Limpa os resultados anteriores
    
        jsonDataArray.map((item) => {
            const itemResultado = document.createElement('div');
            itemResultado.classList.add('item-resultado');
    
            const h2 = document.createElement('h2');
            const a = document.createElement('h2');
            a.href = '#';
            a.target = '_blank';
            a.textContent = item.title;
            h2.appendChild(a);
    
            itemResultado.appendChild(h2); // Adiciona o título primeiro
    
            // Cria a div com a classe 'genero-container' para os gêneros
            const generoContainer = document.createElement('div');
            generoContainer.classList.add('genero-container');
    
            // Para cada gênero, criar um <p> separado e adicionar na div 'genero-container'
            item.gêneros.forEach((genero) => {
                const generoP = document.createElement('p');
                generoP.classList.add('descricao-meta');
                generoP.textContent = genero;
                generoContainer.appendChild(generoP); // Adiciona o <p> para cada gênero dentro da div 'genero-container'
            });
    
            itemResultado.appendChild(generoContainer); // Adiciona a div 'genero-container' ao itemResultado
    
            // Cria a div com a classe 'disponivel-container' para as plataformas disponíveis
            const disponivelContainer = document.createElement('div');
            disponivelContainer.classList.add('disponivel-container');
    
            // Para cada plataforma, criar um <span> separado e adicionar na div 'disponivel-container'
            item.disponivel.forEach((plataforma) => {
                const span = document.createElement('span');
                span.classList.add('disponivel');
                span.textContent = plataforma;
                disponivelContainer.appendChild(span); // Adiciona o <span> para cada plataforma dentro da div 'disponivel-container'
            });
    
            itemResultado.appendChild(disponivelContainer); // Adiciona a div 'disponivel-container' ao itemResultado
    
            resultadosPesquisa.appendChild(itemResultado); // Adiciona o item ao container de resultados
        });
    }

    const searchButton = document.querySelector('button[type="submit"]');
    searchButton.addEventListener('click', (event) => {
        event.preventDefault();
        getGenerativeContent();
    });
}

main();
