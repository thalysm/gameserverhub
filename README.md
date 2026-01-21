# 🎮 Game Server Hub (GSH)

![Game Server Hub](./public/gameserverhub.png)

O **Game Server Hub** é uma plataforma open-source moderna e robusta desenvolvida em Next.js para gerenciamento e implantação simplificada de servidores de jogos via Docker. 

O objetivo é fornecer uma interface intuitiva onde qualquer pessoa possa subir, configurar e monitorar servidores de jogos sem precisar lidar diretamente com a linha de comando.

---

## ✨ Funcionalidades Atuais

- 🚀 **One-Click Deploy**: Suba servidores em segundos usando Docker.
- 📂 **Gerenciador de Arquivos Inline**: Visualize e edite arquivos de configuração (`.cfg`, `.properties`, `.json`, etc) diretamente no navegador.
- 🛠️ **Admin Panel Avançado**: 
  - Execução de comandos via RCON.
  - Troca dinâmica de mapas (CS2 Workshop support).
  - Configurações persistentes via Banco de Dados.
- 📈 **Monitoramento**: Status do servidor, uso de recursos e logs em tempo real.

---

## 🕹️ Jogos Suportados

Atualmente, o GSH suporta oficialmente:
- ✅ **Minecraft Java Edition** (utilizando a imagem `itzg/minecraft-server`)
- ✅ **Counter-Strike 2** (utilizando a imagem `joedwards32/cs2`)

### 🔜 Próximos Jogos (Em Desenvolvimento)
Estamos trabalhando para adicionar suporte a:
- [ ] Terraria
- [ ] Assetto Corsa
- [ ] Rust
- [ ] Valheim
- [ ] Garry's Mod
- [ ] Ark: Survival Evolved
- [ ] Palworld
- [ ] Factorio
- [ ] Project Zomboid
- [ ] Don't Starve Together (DST)

---

## 🗺️ Roadmap do Sistema (TODO)

- [ ] **Internacionalização (i18n)**: Suporte completo para Inglês (EN) e Português (PT-BR).
- [ ] **Proxy Reverso Integrado**: Facilitar o acesso aos servidores via domínios/links personalizados.
- [ ] **Sistema de Backup Cloud**: Automação de backups para S3 ou Google Drive.

---

## 🚀 Tecnologias Utilizadas

- **Frontend/Backend**: [Next.js 14](https://nextjs.org/) (App Router)
- **Estilização**: Tailwind CSS + Shadcn/UI
- **Banco de Dados**: Prisma + SQLite (padrão local)
- **Infraestrutura**: Docker & Docker Compose
- **Comunicação**: RCON Protocol & Docker Engine API

---

## 🤝 Contribuição

Este é um projeto **Open Source** e contribuições de todos os níveis são muito bem-vindas! 

Se você quer ajudar a adicionar um novo jogo, corrigir um bug ou sugerir uma funcionalidade:
1. Faça um **Fork** do projeto.
2. Crie uma **Branch** para sua funcionalidade (`git checkout -b feature/novo-jogo`).
3. Faça o **Commit** de suas alterações (`git commit -m 'feat: add support for Terraria'`).
4. Envie para o **Pull Request**.

Sinta-se à vontade para abrir uma **Issue** para discutirmos melhorias!

---

## 🛠️ Instalação Local

1. Clone o repositório:
   ```bash
   git clone https://github.com/seu-usuario/game-server-hub.git
   ```
2. Instale as dependências:
   ```bash
   npm install
   ```
3. Configure as variáveis de ambiente baseadas no `.env.example`.
4. Rode as migrações do banco:
   ```bash
   npx prisma migrate dev
   ```
5. Inicie o servidor de desenvolvimento:
   ```bash
   npm run dev
   ```

---

## 📄 Licença

Distribuído sob a licença MIT. Veja `LICENSE` para mais informações.

---
Desenvolvido com ❤️ pela comunidade GSH.
