# SOP – Implementação do Sistema Tamagotchi Infinity sem quebrar o jogo atual

## 0. Objetivo
Definir um passo a passo claro para o desenvolvedor integrar o novo sistema de pet estilo Tamagotchi (Slime → Teen → Adult, muita sujidade / fome / tédio em cada fase) **sem quebrar o código existente**, **reaproveitando o backend atual em Vercel** e mantendo **compatibilidade com o banco de dados e game loops já em produção**.

Foco:
- Evolução incremental (feature flag / rollout seguro).
- Respeitar modelos de dados já existentes.
- Criar um loop de jogo infinito (never‑ending), com notificações, sem perda de contexto do jogador.

---

## 1. Visão geral da arquitetura atual (Saber antes de mexer)

1.1. Mapear componentes principais já existentes:
- Frontend (React / Next / RN / WebGL, etc.).
- Game loop Infinity atual (onde roda física, score, partidas, etc.).
- Módulo de autenticação (login, usuários, sessão).
- API routes / serverless functions em Vercel (ex: `/api/user`, `/api/progress`, etc.).
- Banco de dados (Prisma + Postgres, Supabase, PlanetScale, etc.).

1.2. Levantar como o jogo hoje salva e recupera estado:
- Tabelas/collections usadas para progresso de usuário.
- Campos já existentes ligados a power‑ups, skins, moedas, etc.
- Se já existe algum campo para "pet" ou "companion".

1.3. Resultado esperado desta fase:
- Diagrama rápido (mesmo que mental ou em markdown) mostrando:
  - `User` → relação com `GameProfile` → outras entidades (moedas, skins).
  - Pontos de extensão seguros para inserir o novo `PetState`.

Nada de código ainda. Objetivo é **não mexer às cegas**.

---

## 2. Estratégia de integração segura (Feature Flag + Compatibilidade)

2.1. Criar uma **feature flag** para o sistema Tamagotchi:
- Ex.: campo `tamagotchiEnabled` no usuário ou variável de ambiente + rollout por grupo de usuários.
- Permite ligar/desligar a feature rapidamente sem fazer rollback de deploy.

2.2. Manter o jogo Infinity atual intacto:
- Não alterar a lógica principal de partida.
- Implementar o sistema de pet como **módulo separado** que lê/escreve no mesmo usuário, mas não muda o core do loop já em produção.

2.3. Criar camadas claras:
- `pet-logic-core.ts`: somente funções puras (sem acesso direto a API/DB).
- `pet-service.ts`: faz o bridge entre a lógica pura e o banco (carrega, salva, trata erros).
- Components UI: consomem `pet-service` via hooks/context.

---

## 3. Modelagem de dados (sem quebrar o DB)

3.1. Adicionar estrutura de Pet no schema mantendo compatibilidade:

- Se DB for relacional (Prisma / SQL):
  - Criar tabela `PetState` ou `UserPet` com chave estrangeira para `User`.
  - Manter campos opcionais onde necessário para não quebrar DB existente.

- Exemplo Prisma (conceitual):
  ```prisma
  model UserPet {
    id             String   @id @default(cuid())
    userId         String   @unique
    stage          String   // EGG, SLIME, TEEN, ADULT, DEAD
    hunger         Int
    dirt           Int
    boredom        Int
    hp             Int
    happiness      Int
    sickness       String   // NONE, SICK, BERSERK

    ageHoursTotal  Float
    ageHoursInStage Float
    poopCount      Int

    totalPoopsCleaned Int
    totalGamesPlayed  Int
    totalMissionsDone Int

    lastUpdate     DateTime
    timesDied      Int

    user           User     @relation(fields: [userId], references: [id])
  }
  ```

3.2. Se já existe uma tabela de progresso genérica:
- Adicionar um campo `petStateJson` (`JSONB` ou `text`) com a estrutura do `PetState` serializada.
- Integração mínima, sem necessidade de nova tabela.

3.3. Migração cuidadosa:
- Criar migration incremental.
- Rodar em ambiente de staging primeiro.
- Garantir que usuários antigos não tenham `petState` ainda (lidar com `null`).

---

## 4. Núcleo de lógica de pet (módulo puro e testável)

4.1. Implementar todas as funções de lógica em um módulo **sem dependência de framework**:
- Funções puras como `updatePetState`, `feedPet`, `cleanPoop`, `playWithPet`, `checkEvolution`, `getNotificationReasons`.

4.2. Essas funções devem receber/retornar `PetState` sem tocar em rede/DB:

```ts
// exemplo conceitual
export function updatePetState(pet: PetState, now: number): PetState { /* ... */ }
export function feedPet(pet: PetState, foodPower: number): PetState { /* ... */ }
```

4.3. Criar testes unitários básicos para garantir que:
- Slime gera muito cocô.
- Teen consome fome rapidamente.
- Adult aumenta tédio muito rápido.
- Evolução e morte funcionam conforme regras.

4.4. Somente depois dos testes, integrar essa lógica na camada de serviço.

---

## 5. Serviço de pet (bridge entre lógica e banco – Vercel)

5.1. Criar um módulo `pet-service` que:
- Carrega o `PetState` do banco para um usuário logado.
- Se não existir, cria um estado inicial (EGG ou SLIME).
- Chama `updatePetState` com `Date.now()` sempre que o usuário abre o app ou acessa a tela do pet.
- Salva o estado atualizado novamente no DB.

5.2. Padrão de funções:

```ts
async function getPetState(userId: string): Promise<PetState> { /* ... */ }
async function savePetState(userId: string, pet: PetState): Promise<void> { /* ... */ }

async function updatePetForUser(userId: string): Promise<PetState> {
  const pet = await getPetState(userId);
  const updated = updatePetState(pet, Date.now());
  await savePetState(userId, updated);
  return updated;
}
```

5.3. Implementação em API Routes (Next/Vercel):
- Rota `GET /api/pet` → retorna o estado atualizado do pet.
- Rota `POST /api/pet/action` → recebe ações (`feed`, `cleanPoop`, `play`) e devolve o novo estado.

5.4. Manter idempotência / segurança:
- Validar usuário autenticado em todas as rotas.
- Garantir que erros de DB não derrubam o jogo Infinity principal.

---

## 6. Integração com o jogo Infinity (sem acoplamento forte)

6.1. Definir **interface de bônus** do pet para o game principal:
- Exemplo: `petBuffs = { scoreMultiplier, extraCoinsChance, shieldOnStart }`.

6.2. Criar função de tradução de `PetState` → buffs:

```ts
function getPetBuffs(pet: PetState): PetBuffs {
  // exemplo: quanto mais feliz e evoluído, mais buff
}
```

6.3. No fluxo atual de início de partida do Infinity:
- Buscar `PetState` (via `pet-service`).
- Calcular `petBuffs`.
- Injetar esses buffs no contexto da partida (sem mudar regras básicas).

6.4. No final da partida:
- Atualizar métricas do pet (ex.: `totalGamesPlayed` +1, moedas, etc.).
- Não alterar nada da persistência de score principal.

---

## 7. Loop infinito de jogo (never-ending loop design)

7.1. Garantir que sempre exista algo a fazer com o pet:
- Estatísticas que nunca travam: fome, sujeira, tédio sempre mudam com o tempo.
- Missões diárias ligadas ao pet (limpar X cocôs, brincar Y vezes, manter fome abaixo de Z).

7.2. Quando o pet morre:
- Registrar `timesDied`.
- Gerar um novo ovo mantendo parte do progresso (skins, achievements, parte das moedas ou buffs permanentes).
- Isso cria ciclo **roguelike** sem fim.

7.3. Integrar isso na UI:
- Tela de memorial/linha do tempo das vidas anteriores.
- Lore se expandindo a cada morte/evolução.

---

## 8. Notificações (push / web push / local)

8.1. Derivar motivos de notificação a partir de `PetState` com função pura:
- `getNotificationReasons(pet)` → retorna lista de triggers: fome alta, sujeira alta, tédio alto, evolução pronta, etc.

8.2. Backend em Vercel:
- Agendar job recorrente (cron job / scheduled function) para verificar pets a cada X minutos ou horas.
- Para cada usuário:
  - Atualizar `PetState` com `updatePetState`.
  - Se houver trigger de notificação e dentro dos limites (máx. N por dia) → enviar push.

8.3. Implementar canal de notificação por plataforma:
- Web: Web Push (Service Worker).
- Mobile (se RN/Expo): Notifications API do Expo, FCM, etc.

8.4. Cuidar para não spammar:
- Guardar no DB o último horário de notificação por tipo.
- Somente enviar se passou uma janela mínima (ex. 4h).

---

## 9. UI/UX – camadas de interface

9.1. Criar um **Pet Hub** independente da tela principal do Infinity:
- Tela dedicada: mostra o pet, barras de fome/sujeira/tédio, cocôs no cenário, botões de ação.
- Mantém a lógica de UI separada do gameplay de corrida/plataforma.

9.2. Componente de resumo rápido na home do Infinity:
- Ex.: ícone de pet com estado (feliz, triste, doente).
- Barra pequena / alerta se fome/sujeira/tédio estiverem altos.

9.3. Sem quebrar UX atual:
- Não alterar o fluxo principal de começar uma partida Infinity.
- Apenas adicionar a opção de visitar o pet ou mostrar o pet como companheiro na HUD.

---

## 10. Controle de qualidade e testes

10.1. Testes automatizados:
- Unitários para o módulo de lógica.
- Testes de integração para `pet-service` + DB (em ambiente de staging).

10.2. Testes manuais focados em regressão:
- Verificar que o jogo Infinity atual funciona idêntico com e sem a feature flag.
- Verificar que o login, salvamento e carregamento de usuário não quebram.

10.3. Testes de longo prazo (simulação):
- Scripts que simulam vários dias de uso aplicando `updatePetState` com grandes `delta` de tempo.
- Conferir se os valores continuam dentro dos ranges e se evolução/morte funcionam.

---

## 11. Estratégia de rollout em produção

11.1. Etapa 1 – Staging
- Deploy full da feature em ambiente de teste.
- Usar um ou poucos usuários internos.

11.2. Etapa 2 – Beta fechado
- Ativar feature flag para porcentagem pequena de usuários.
- Monitorar erros (Sentry, logs de Vercel) e comportamento de DB.

11.3. Etapa 3 – Rollout gradual
- Aumentar gradualmente o percentual de usuários com Tamagotchi ligado.
- Se houver problema, desligar a feature flag rapidamente sem rollback de código.

11.4. Etapa 4 – Ativação global
- Após estabilidade confirmada, manter feature ligada para todos.
- Planejar atualizações de balanceamento somente via parâmetros no DB, não mudanças de código sempre que possível.

---

## 12. Boas práticas específicas para este projeto

12.1. Nunca acoplar lógica de pet diretamente à lógica gráfica ou engine do Infinity.
- Sempre passar por funções de alto nível (ex.: `applyPetBuffsToRun(context, petBuffs)`).

12.2. Centralizar constantes de balanceamento em um único arquivo configurável.
- Facilita ajustes de valores sem mexer na lógica.

12.3. Evitar dependências circulares:
- O módulo do pet pode conhecer o jogo Infinity apenas via interface de buffs.
- O jogo principal não deve conhecer detalhes internos do `PetState` (apenas ler buffs/estado geral).

12.4. Documentar JSON de `PetState` e endpoints usados.
- Garante que qualquer dev futuro consiga dar manutenção sem quebrar a lógica.

---

## 13. Checklist final para o dev

- [ ] Mapeou a arquitetura atual (onde salvar estado, quais tabelas existem).
- [ ] Definiu/implementou o schema de `PetState` no DB (nova tabela ou JSON).
- [ ] Criou módulo de lógica pura com funções de update/evolução/morte/testadas.
- [ ] Implementou `pet-service` para integrar lógica + DB em Vercel.
- [ ] Criou endpoints `/api/pet` e `/api/pet/action` (ou equivalentes) com autenticação.
- [ ] Conectou o pet ao jogo Infinity apenas via buffs/estatísticas, sem quebrar o core loop.
- [ ] Implementou UI básica do Pet Hub + resumo na home.
- [ ] Montou sistema de notificações baseado em `getNotificationReasons`.
- [ ] Testou em staging + beta fechado com feature flag.
- [ ] Planejou e executou rollout gradual em produção.

Seguindo este SOP, o dev consegue integrar o sistema Tamagotchi Infinity de forma **incremental, segura** e com padrão de qualidade profissional, sem perda de contexto nem quebra das lógicas já existentes no jogo.

