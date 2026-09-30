# site-Bravix
site BRAVIX ENGENHARIA

Apresentação interativa do galpão de 1.200 m² no Setor de Placas, Brasília/DF.

## Apresentação ao cliente

Após a ativação do GitHub Pages, a apresentação fica disponível em:
https://wz9nvqgqqt-cyber.github.io/site-Bravix/

Compartilhe o endereço do site, não o endereço do repositório. Abra a apresentação no navegador, de preferência em tela cheia. Percorra as seções na ordem existente, apresente o filme completo, explore a galeria e encerre comparando os três pacotes da proposta.

O conteúdo é público, incluindo os valores comerciais. Não exige login do cliente e não depende do computador do autor estar ligado.

## Conteúdo preservado

A pasta `dist/` é a apresentação pronta. Todos os arquivos existentes foram mantidos, incluindo imagens, vídeos, versões para celular, fontes de interação e bibliotecas locais. Não há etapa de compilação, compressão ou alteração visual na publicação.

Os arquivos de automação ficam fora de `dist/`. `site-integrity.json` registra tamanho e SHA-256 de cada arquivo publicado. A automação verifica essa lista antes de enviar a pasta integral ao GitHub Pages.

## Publicação automática

Em **Settings → Pages → Build and deployment → Source**, selecione **GitHub Actions**. A automação `.github/workflows/pages.yml` publica a pasta `dist/` em cada atualização da branch `main`. Também pode ser executada manualmente pela aba **Actions**.

Para verificar os arquivos localmente com Node.js:

```sh
node scripts/site-integrity.mjs
```

Após uma alteração intencional no site, atualize o manifesto antes do próximo envio:

```sh
node scripts/site-integrity.mjs --update
```

Para visualizar localmente, sirva a pasta `dist/` com um servidor HTTP. Evite abrir `index.html` diretamente pelo protocolo `file://`, pois o estudo interativo utiliza módulos JavaScript.

## Acesso remoto ao Codex

É separado da hospedagem da apresentação. Use o pareamento oficial da OpenAI na sua própria conta. O computador precisa continuar ligado, conectado à internet e sem suspensão para executar tarefas remotamente. Não publique senhas, tokens ou o serviço local do Codex neste repositório.
