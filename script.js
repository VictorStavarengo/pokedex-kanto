// ELEMENTOS HTML ---
const searchForm = document.getElementById('search-form');
const searchInput = document.getElementById('search-input');
const shinyButton = document.querySelector('.shiny-button');
const prevButton = document.getElementById('prev-button');
const nextButton = document.getElementById('next-button');
let currentPokemonData = null;

// CONFIGURAÇÃO INICIAL ---
document.addEventListener('DOMContentLoaded', () => {
    setupEventListeners(); 
    fetchPokemonData('bulbasaur'); 
});

// CONFIGURAÇÃO DOS EVENTOS ---
function setupEventListeners() {
    // Evento para o formulário de busca
    searchForm.addEventListener('submit', (event) => {
        event.preventDefault();
        const searchTerm = searchInput.value.trim().toLowerCase();
        if (searchTerm) {
            fetchPokemonData(searchTerm);
        }
        searchInput.value = '';
    });

    // Botão SHINY
    shinyButton.addEventListener('click', () => {
        if (currentPokemonData) {
            const pokemonImage = document.getElementById('pokemon-image');
            const defaultSprite = currentPokemonData.sprites.versions['generation-v']['black-white'].animated.front_default;
            const shinySprite = currentPokemonData.sprites.versions['generation-v']['black-white'].animated.front_shiny;

            if (pokemonImage.src === defaultSprite) {
                pokemonImage.src = shinySprite || currentPokemonData.sprites.front_shiny; // Fallback
            } else {
                pokemonImage.src = defaultSprite;
            }
        }
    });

    // Botão ANTERIOR
    prevButton.addEventListener('click', () => {
        if (currentPokemonData && currentPokemonData.id > 1) {
            fetchPokemonData(currentPokemonData.id - 1);
        }
    });

    // Botão PRÓXIMO
    nextButton.addEventListener('click', () => {
        if (currentPokemonData) {
            fetchPokemonData(currentPokemonData.id + 1);
        }
    });
}

// FUNÇÃO PRINCIPAL DA API ---
async function fetchPokemonData(pokemonNameOrId) {
    try {
        const mainUrl = `https://pokeapi.co/api/v2/pokemon/${pokemonNameOrId}`;
        const response = await fetch(mainUrl);
        if (!response.ok) throw new Error('Pokémon não encontrado!');
        const pokemonData = await response.json();

        const speciesUrl = pokemonData.species.url;
        const speciesResponse = await fetch(speciesUrl);
        const speciesData = await speciesResponse.json();
        
        renderPokemon(pokemonData, speciesData);
    } catch (error) {
        console.error('Houve um erro:', error);
        alert('Pokémon não encontrado! Tente outro nome ou número.');
    }
}

// FUNÇÃO DE RENDERIZAÇÃO ---
function renderPokemon(pokemonData, speciesData) {
    currentPokemonData = pokemonData; // Salva os dados do Pokémon atual

    // PAINEL ESQUERDO
    document.getElementById('pokemon-name').textContent = pokemonData.name;
    document.getElementById('pokemon-id').textContent = `no. ${pokemonData.id}`;
    document.getElementById('pokemon-image').src = pokemonData.sprites.versions['generation-v']['black-white'].animated.front_default;
    document.getElementById('pokemon-image').alt = pokemonData.name;

    const englishDescription = speciesData.flavor_text_entries.find(entry => entry.language.name === 'en');
    document.getElementById('pokemon-description').textContent = englishDescription ? englishDescription.flavor_text.replace(/\n/g, ' ') : 'Nenhuma descrição encontrada.';

    // PAINEL DIREITO
    const statsList = document.getElementById('stats-list');
    statsList.innerHTML = '';
    pokemonData.stats.forEach(stat => {
        const statItem = document.createElement('li');
        statItem.textContent = `${stat.stat.name.replace('-', ' ')}: ${stat.base_stat}`;
        statsList.appendChild(statItem);
    });

    const typesDisplay = document.querySelector('.types-display');
    typesDisplay.innerHTML = '';
    pokemonData.types.forEach(typeInfo => {
        const typeSpan = document.createElement('span');
        typeSpan.textContent = typeInfo.type.name;
        typeSpan.className = `type-box ${typeInfo.type.name}`;
        typesDisplay.appendChild(typeSpan);
    });

    const movesScreen = document.querySelector('.moves-screen');
    movesScreen.innerHTML = '';
    const fireRedLevelUpMoves = pokemonData.moves.map(moveInfo => {
        for (const version of moveInfo.version_group_details) {
            if (version.version_group.name === 'firered-leafgreen' && version.move_learn_method.name === 'level-up') {
                return { name: moveInfo.move.name.replace('-', ' '), level: version.level_learned_at };
            }
        }
        return null;
    }).filter(move => move !== null && move.level > 0);
    fireRedLevelUpMoves.sort((a, b) => a.level - b.level);
    const movesList = document.createElement('ul');
    fireRedLevelUpMoves.forEach(moveInfo => {
        const moveElement = document.createElement('li');
        moveElement.textContent = `Lv ${moveInfo.level}: ${moveInfo.name}`;
        movesList.appendChild(moveElement);
    });
    movesScreen.appendChild(movesList);

    // FUNÇÃO DA CADEIA EVOLUTIVA 
    renderEvolutionChain(speciesData);
}

// FUNÇÃO DA CADEIA EVOLUTIVA (MOVIDA PARA FORA) ---
async function renderEvolutionChain(speciesData) {
    try {
        // Limpa as evoluções anteriores
        for (let i = 1; i <= 3; i++) {
            document.getElementById(`evo-${i}-img`).src = '';
            document.getElementById(`evo-${i}-name`).textContent = '';
        }

        const evoChainUrl = speciesData.evolution_chain.url;
        const evoChainResponse = await fetch(evoChainUrl);
        const evoChainData = await evoChainResponse.json();

        const evolutionNames = [];
        let currentEvo = evoChainData.chain;
        while (currentEvo) {
            evolutionNames.push(currentEvo.species.name);
            currentEvo = currentEvo.evolves_to[0];
        }

        for (let i = 0; i < evolutionNames.length; i++) {
            const pokemonName = evolutionNames[i];
            const pokemonResponse = await fetch(`https://pokeapi.co/api/v2/pokemon/${pokemonName}`);
            const pokemonData = await pokemonResponse.json();
            
            const evoImg = document.getElementById(`evo-${i + 1}-img`);
            const evoName = document.getElementById(`evo-${i + 1}-name`);
            
            evoImg.src = pokemonData.sprites.versions['generation-v']['black-white'].animated.front_default || pokemonData.sprites.front_default;
            evoName.textContent = pokemonName;
        }
    } catch (error) {
        console.error('Erro ao buscar cadeia evolutiva:', error);
    }
}