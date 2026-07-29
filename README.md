# LANCER Action HUD — Foundry VTT Module

![Foundry VTT v13](https://img.shields.io/badge/Foundry-v13-orange)
![LANCER RPG](https://img.shields.io/badge/System-LANCER%203.0+-red)

Um módulo HUD moderno, dinâmico e otimizado para o sistema **LANCER RPG** no Foundry VTT. Oferece uma interface tática flutuante de acesso rápido a todas as ações, armas, sistemas, talentos e status do seu personagem/mech durante o combate.

---

## 🚀 Recursos Principais

### ⚔️ Painel de Ações e Abas Táticas
- **Armas (Weapons)**: Exibição inteligente de alcance, tipo de dano e botões de ataque/dano rápidos. Alternância instantânea de perfis de armas.
- **Ações Tecnológicas (Tech)**: Ações de invasão (Invade), Lock-On, Bolster e sistemas de hacking.
- **Sistemas (Systems)**: Acesso direto a sistemas equipados, ações ativáveis e posicionamento no mapa.
- **Poder do Núcleo (Core Power)**: Ativação rápida de Core Powers ativos e passivos da Frame.
- **Talentos (Talents)**: Lista expansível de Talentos agrupados por Ranks com detalhes de cada ação.
- **Implementos & Drones**: Deploy facilitado de tokens no mapa com mira e snap ao grid.
- **Condições & Statuses**: Aplicação rápida de status (Exposed, Lock On, Impaired, etc.) no próprio token ou no alvo (Target).
- **Atributos & HASE**: Rolagem direta de testes HASE (Hull, Agility, Systems, Engineering) pelo painel de stats.

---

### ⏱️ Action Tracker Inteligente
Rastreamento visual de ações do turno:
- **Movimento**, **Ação Rápida 1**, **Ação Rápida 2**, **Ação Completa**, **Reação**, **Sobrecarga** e **Core**.
- **Suporte a Armas Superheavy**: Detecta automaticamente armas do tipo *Superheavy* e deduz uma Ação Completa do tracker ao disparar.
- Atualização automática via ações do HUD ou mensagens roláveis no chat.

---

### 💬 Cards Interativos no Chat
- Botão rápido `<i class="fas fa-comment-alt"></i>` em cada item, sistema ou rank de talento para enviar um card estilizado com a descrição completa e botões interativos diretamente para o chat do Foundry.

---

### 🎮 Atalhos de Teclado
- <kbd>Z</kbd> : Minimizar / Expandir a janela do HUD.
- <kbd>Ctrl</kbd> + <kbd>E</kbd> : Ativar / Desativar a exibição do HUD.

---

## 🛠️ Arquitetura do Módulo

O módulo é construído usando **ES Modules nativos** (compatível com Foundry VTT sem necessidade de bundlers como Webpack/Rollup):

```
lancer-action-hud/
├── module.json
├── README.md
├── scripts/
│   ├── main.js                  # Entry point (imports de módulos)
│   ├── utils.js                 # Estado global (HUDState), busca de HUD e helpers
│   ├── hooks.js                 # Eventos do Foundry (controlToken, updateActor, etc.)
│   ├── init.js                  # Hook ready e window.StylishAction global
│   ├── adapter/
│   │   ├── lancer-adapter.js    # Adaptador do sistema Lancer (extende BaseSystemAdapter)
│   │   ├── item-tags.js         # Extração e normalização de tags de itens
│   │   ├── data-strike.js       # Provedor de dados de Armas
│   │   ├── data-tech.js         # Provedor de dados de Tech Actions
│   │   ├── data-system.js       # Provedor de dados de Sistemas
│   │   ├── data-core.js         # Provedor de dados do Core Power
│   │   ├── data-talent.js       # Provedor de dados de Talentos
│   │   ├── data-utility.js      # Provedor de dados de Utilitários
│   │   ├── data-implementos.js  # Provedor de dados de Deployables
│   │   ├── data-status.js       # Provedor de dados de Statuses
│   │   ├── data-stats.js        # Provedor de dados de Atributos/HASE
│   │   └── use-item.js          # Execução centralizada de ações do HUD
│   └── hud/
│       ├── lancer-action-hud.js     # Aplicação principal (LancerActionHUD)
│       ├── lancer-item-popup.js     # Popup de detalhes de itens (LancerItemPopup)
│       └── lancer-deployable-hud.js # HUD compacto para Deployables
├── styles/
│   ├── lancer-action-hud.css    # Hub de @imports
│   └── partials/
│       ├── _variables.css       # Variáveis CSS e fontes
│       ├── _hud-window.css      # Janela principal e painel do ator
│       ├── _hud-tabs.css        # Abas de navegação
│       ├── _hud-submenu.css     # Listas de itens e accordions
│       ├── _hud-buttons.css     # Botões e tags
│       ├── _hud-stats.css       # Grids de atributos e tracker
│       ├── _hud-popup.css       # Popup de detalhes
│       └── _hud-deployable.css  # HUD de Deployables
└── templates/
    ├── hud.html                 # Layout principal do HUD
    ├── popup.html               # Layout do popup de detalhes
    ├── deployable-hud.html      # Layout do HUD de deployables
    └── structstress-dialog.html # Diálogo de teste de estrutura/estresse
```

---

## 💻 Requisitos e Compatibilidade

- **Foundry VTT**: v13+ (ou v12+)
- **Sistema Game**: [LANCER RPG System](https://github.com/EemilLagerspetz/foundryvtt-lancer) v3.0.0+

---

## 📝 Licença
Desenvolvido por **LPfontes**. Código disponibilizado para uso com a comunidade LANCER VTT.
