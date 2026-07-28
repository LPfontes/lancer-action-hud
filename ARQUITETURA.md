# Arquitetura do Lancer Action HUD

## Visão Geral

O **Lancer Action HUD** é um módulo para Foundry Virtual Tabletop (FoundryVTT) que fornece uma **interface pop-out de ação** para o sistema de jogo **LANCER RPG**. Ele permite que o jogador acesse armas, sistemas, talentos, status e muito mais em uma janela separada, sem precisar usar a ficha de personagem padrão.

O módulo é implementado em **JavaScript puro (ES Modules)**, sem dependências externas ou ferramentas de build. Utiliza o sistema de templates Handlebars embutido do FoundryVTT e CSS puro para estilização.

---

## Estrutura de Diretórios

```
lancer-action-hud/
  ├── .git/
  ├── lang/
  │   ├── en.json              # Traduções para Inglês
  │   └── pt-BR.json           # Traduções para Português Brasileiro
  ├── scripts/
  │   ├── main.js              # Ponto de entrada principal (1914 linhas)
  │   ├── base.js              # Classe base do adaptador de sistema (1063 linhas)
  │   ├── defaults.js          # Sistema de registro de configurações padrão
  │   ├── icon-config.js       # Utilitários de ícones SVG
  │   └── icon-config-custom.js # Sobrescrita de ícones pelo usuário
  ├── styles/
  │   └── lancer-action-hud.css # Folha de estilos completa (915 linhas)
  ├── templates/
  │   └── hud.html             # Template Handlebars da interface (242 linhas)
  └── module.json              # Manifesto do módulo FoundryVTT
```

---

## Arquivos Principais e suas Responsabilidades

### `module.json` — Manifesto do Módulo

Define as metainformações do módulo:
- **ID:** `lancer-action-hud`
- **Entrypoint:** `scripts/main.js` (carregado como ES module)
- **Estilos:** `styles/lancer-action-hud.css`
- **Compatibilidade:** Foundry VTT v13, sistema LANCER v3.0.0+
- **Idiomas:** Inglês e Português Brasileiro

### `scripts/main.js` — Núcleo do Módulo

Contém duas classes principais e os hooks de inicialização:

1. **`LancerSystemAdapter`** (estende `BaseSystemAdapter`)
   - Implementação específica para LANCER do padrão **Adapter**
   - Define 8 abas: `strike` (armas), `tech` (tecnologia), `system` (sistemas), `core` (núcleo), `talent` (talentos), `utility` (utilidades), `status` (condições), `stats` (atributos)
   - Extrai dados de armas, sistemas, talentos, núcleo, chassis, etc. dos atores do LANCER
   - Centraliza o despacho de ações via `useItem()` (mais de 15 tipos de ação)
   - Implementa o rastreador de ações (action tracker) persistido em flags do ator

2. **`LancerActionHUD`** (estende `Application`)
   - Subclasse de `Application` do FoundryVTT que renderiza a janela pop-out
   - `getData()`: Agrega todos os dados do ator para o template
   - `activateListeners()`: Gerencia eventos de clique, busca, rolagem de HASE, edição de vitais, etc.
   - Persiste a posição da janela entre sessões via `game.settings`

3. **Hooks de inicialização**:
   - `init`: Registra configurações e atalhos de teclado
   - `ready`: Instancia as classes e expõe `window.StylishAction` como ponte global
   - `controlToken`: Abre/fecha o HUD ao selecionar um token
   - `updateActor`, `createItem`, `deleteItem`: Re-renderiza o HUD em mudanças de dados
   - `createChatMessage`: Dedução automática de ações baseada em mensagens de chat
   - `updateToken`: Dedução automática da ação de Movimento ao mover o token

### `scripts/base.js` — Adaptador Base

Fornece a classe genérica `BaseSystemAdapter` que define a interface para qualquer sistema de jogo:
- `getStats()`: Resolve atributos do ator a partir de caminhos em notação de ponto
- `updateAttribute()`: Atualiza valores com suporte a ajustes relativos (`+5`, `-3`) e absolutos
- `getConditions()`: Extrai efeitos ativos do ator
- `getActionCategories()`: Retorna o layout de menu customizado ou padrão
- `getSubMenuData()`: Roteia para provedores de dados específicos do sistema
- `createSystemMacro()`: Cria macros organizadas em pastas ("Stylish HUD Macros")

### `scripts/defaults.js` — Registro de Padrões

Sistema de registro com prioridades baseado em `Map`:
- Gerencia `attributes`, `layout`, `statusEffects`, `trackableAttributes`
- Permite que módulos externos registrem configurações padrão com prioridade, função de compatibilidade e modo (`replace`, `append`, `prepend`)

### `scripts/icon-config.js` + `icon-config-custom.js`

Mapeia chaves de ícone para nomes de arquivo SVG e gera HTML de ícone via CSS mask-image.

### `styles/lancer-action-hud.css`

Tema escuro completo com:
- Variáveis CSS para cores de destaque (`--l-accent: #802932`)
- Layout de duas colunas (grid de abas vertical + painel de submenu)
- Barras de HP e Heat com gradientes
- Grid de atributos com linhas coloridas (vermelho, verde, azul, laranja)
- Botões do rastreador de ações com estados coloridos e riscado quando usado
- Botões de rolagem HASE com ícone de dado
- Fonte Orbitron (via Google Fonts)

### `templates/hud.html`

Template Handlebars com dois painéis principais:

**Painel Direito (`.hud-right-panel`):**
- Rastreador de ações (6 botões + reset)
- Grid vertical de 8 abas
- Retrato em formato de diamante com 4 estatísticas sobrepostas (ARM, EVA, DEFESA-E, VEL)
- Painel de vitais: barras de HP e Heat com inputs inline, Overshield e Burn
- Emblemas de Estrutura e Estresse

**Painel Esquerdo (`.hud-left-panel`):**
- Cabeçalho do submenu com título e campo de busca
- Grid de estatísticas do mech (3x4) + rolagens HASE (condicional, aba Stats)
- Lista de itens com headers e linhas contendo nome, ações, tags e descrição expansível

---

## Padrões de Arquitetura

### 1. **Padrão Adapter (Adaptador)**

A arquitetura separa a lógica específica do sistema de jogo da interface genérica do HUD:

```
┌─────────────────────────────────────────────────┐
│                 LancerActionHUD                  │
│             (Application FoundryVTT)             │
│                                                   │
│  getData() → template rendering                   │
│  activateListeners() → user interaction           │
│  Hook-driven reactivity (token selection, etc.)   │
└──────────────────────┬────────────────────────────┘
                       │ delegates data extraction
                       ▼
┌──────────────────────────────────────────────────┐
│             LancerSystemAdapter                   │
│           (extends BaseSystemAdapter)             │
│                                                   │
│  _getStrikeData() | _getTechData() | ...          │
│  useItem() → dispatches to LANCER API             │
│  Action tracker logic                             │
└──────────────────────┬────────────────────────────┘
                       │ extends
                       ▼
┌──────────────────────────────────────────────────┐
│             BaseSystemAdapter                     │
│           (script base.js)                        │
│                                                   │
│  getStats() | updateAttribute()                   │
│  getActionCategories() | getSubMenuData()         │
│  getConditions() | removeCondition()              │
│  createSystemMacro()                              │
└──────────────────────────────────────────────────┘
```

Este padrão permite que o mesmo HUD funcione com diferentes sistemas de jogo desde que um adaptador seja implementado para cada um.

### 2. **Registro Hierárquico (Registry Pattern)**

Em `defaults.js`, um sistema de registro com prioridades permite que múltiplos módulos contribuam com configurações padrão:

```
Módulo A (prioridade 10) ─┐
                          ├──→ Registry → get() → resolved defaults
Módulo B (prioridade 20) ─┘
```

### 3. **Reatividade via Hooks**

O FoundryVTT utiliza um sistema de hooks (eventos globais) que o módulo aproveita para reatividade:

```
controlToken ─→ abrir/fechar HUD
updateActor  ─→ re-renderizar HUD
createChatMessage ─→ deduzir ação gasta
updateToken  ─→ marcar Movimento como usado
```

### 4. **Bridge Global**

O objeto `window.StylishAction` é exposto globalmente para permitir que handlers inline nos templates HTML chamem métodos do módulo:

```javascript
// No template: onclick="StylishAction.useItem('attack:abc123', event)"
// No código:   window.StylishAction = { useItem, closeHUD, toggleHUD }
```

Isso evita a necessidade de delegação de eventos complexa para botões gerados dinamicamente.

---

## Fluxo de Dados

```
Usuário seleciona um token
        │
        ▼
Hook "controlToken" dispara
        │
        ▼
LancerActionHUD.activeToken = token selecionado
LancerActionHUD.render(true) → getData()
        │
        ├── Lê actor.system (hp, heat, structure, stress, armor, evasion, etc.)
        ├── Chama adapter.getDefaultLayout() → definições das abas
        ├── Chama adapter._getSystemSubMenuData(actor, activeTab)
        │       │
        │       ├── Dispara _getStrikeData / _getTechData / _getSystemData / etc.
        │       │       │
        │       │       ├── Filtra actor.items por tipo (mech_weapon, system, talent, etc.)
        │       │       ├── Extrai dano, alcance, tags, perfis do item.system
        │       │       ├── Constrói HTML de botões de ação com onclick inline
        │       │       └── Retorna { title, items, hasTabs, tabLabels }
        │       │
        │       └── Retorna dados do submenu
        │
        └── Lê actionTracker das flags do ator
        │
        ▼
Dados retornados para hud.html (Handlebars)
        │
        ▼
Usuário interage com a interface
        │
        ├── Clique em aba → activeTab muda, render(false)
        ├── Busca → filtra .hud-item-row via JS
        ├── Clique em HASE → actor.beginStatFlow()
        ├── Input em vital → actor.update()
        ├── Clique em ação → StylishAction.useItem(itemId, event)
        │       │
        │       └── LancerSystemAdapter.useItem()
        │               ├── attack: → beginWeaponAttackFlow()
        │               ├── damage: → beginDamageFlow()
        │               ├── tech: → beginTechAttackFlow()
        │               ├── util: → beginOverchargeFlow() / beginStabilizeFlow()
        │               ├── status: → toggleStatusEffect()
        │               ├── deploy: → fluxo de implantação no canvas
        │               └── ... outros tipos
        │
        └── Atualiza actionTracker via flags do ator
```

---

## Fluxo de Implantação (Deploy)

O HUD possui um fluxo sofisticado para implantar drones e objetos implantáveis:

1. Usuário clica em "IMPLANTAR" → `useItem('deploy:...')`
2. O módulo anexa um listener de clique ao canvas
3. Ao clicar no canvas, a posição é obtida com snapping à grid
4. Busca o ator implantável no mundo ou em compêndios
5. Cria o token no local clicado via `TokenDocument.create()`
6. Remove o listener de clique e restaura o estado anterior do canvas

---

## Árvore de Componentes da Interface

```
LancerActionHUD (Application Foundry, janela pop-out)
  │
  ├── .hud-panel (container flex)
  │   │
  │   ├── .hud-right-panel
  │   │   ├── .hud-action-tracker (7 ações + reset)
  │   │   ├── .hud-tabs-vertical (grid 2 colunas × 4 linhas)
  │   │   ├── .hud-portrait-container (retrato + ARM/EVA/DEFESA-E/VEL)
  │   │   └── .hud-actor-panel
  │   │       ├── .hud-actor-meta (nome, subtítulo, vitais)
  │   │       │   ├── Barras de HP e Heat com inputs inline
  │   │       │   └── Indicador de Burn
  │   │       └── .hud-actor-badges (Overshield, Estrutura, Estresse)
  │   │
  │   └── .hud-left-panel
  │       └── .hud-submenu-panel
  │           ├── .hud-submenu-header (título + busca)
  │           ├── .la-stats-grid (3×4, aba Stats)
  │           ├── .la-hase-grid (1×4, aba Stats)
  │           └── .hud-items-list
  │               ├── .hud-item-header (cabeçalho de seção)
  │               └── .hud-item-row (item individual)
  │                   ├── Imagem do item
  │                   ├── Nome + ações (botões)
  │                   ├── Tags (dano, alcance, etc.)
  │                   └── Descrição (expansível)
```

---

## Rastreador de Ações (ActionTracker)

O rastreador persiste o estado das ações do mech em **flags do ator**:

```javascript
actor.setFlag('lancer-action-hud', 'actionTracker', {
  move: false,
  quick1: false,
  quick2: false,
  full: false,
  reaction: false,
  overcharge: false,
  core: false
})
```

**Lógica de cascata:**
- Usar Ação Completa → marca Quick1 e Quick2 como usados
- Usar Quick1 + Quick2 → automaticamente torna Completa como disponível (regra LANCER)

**Dedução automática:**
- Ao mover o token → marca `move` como usado
- Ao enviar mensagem de chat contendo "barrage" → marca ações apropriadas
- Ao enviar mensagem contendo "skirmish" → marca ações apropriadas

---

## Internacionalização

O módulo suporta múltiplos idiomas através de arquivos JSON em `lang/`:

| Arquivo  | Idioma            | Chaves |
|----------|-------------------|--------|
| `en.json` | Inglês           | 105    |
| `pt-BR.json` | Português Brasileiro | 105    |

As chaves cobrem: rótulos de abas, tooltips, descrições de utilidades, diálogos, ações básicas, estatísticas, configurações e atalhos de teclado.

---

## Build e Tooling

**Não há sistema de build.** O módulo é intencionalmente mantido simples:

- JavaScript puro (ES Modules) — sem TypeScript
- CSS puro — sem pré-processadores
- Handlebars (nativo do FoundryVTT) — sem bundlers
- Sem `package.json` ou dependências npm

**Fluxo de desenvolvimento:**
1. Editar arquivos fonte diretamente
2. Recarregar o FoundryVTT (ou usar modo hot reload)

---

## Decisões de Design Notáveis

1. **HTML inline em JavaScript**: Botões de ação são construídos como strings HTML com `onclick`/`oncontextmenu` inline dentro dos métodos de extração de dados. Isso mistura lógica de apresentação com dados, mas permite geração dinâmica por arma/sistema.

2. **Bridge global (`window.StylishAction`)**: Objeto global exposto para que handlers inline nos templates consigam chamar métodos do módulo, evitando delegação de eventos complexa.

3. **Persistência em flags do ator**: O estado do rastreador de ações é salvo por ator, sobrevivendo a fechamentos do HUD e sendo visível para outros jogadores.

4. **Sem dependências externas**: Todo o código é vanilla JS + CSS + Handlebars embutido. A única resource externa é a fonte Roboto Mono do Google Fonts.

5. **Adaptação de framework maior**: O `BaseSystemAdapter` e `defaults.js` são claramente herdados de um projeto maior ("Stylish Action HUD"), com o adaptador LANCER sobrescrevendo apenas o necessário.

6. **Deploy com fallback**: O fluxo de implantação busca o ator primeiro no mundo, depois em compêndios, com tratamento de erros e limpeza de listeners.
