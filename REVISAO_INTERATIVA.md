# BRAVIX — revisão interativa

Data: 30/09/2026. Base única: `12_SITE/dist`.

## Preservação

Hero e seção `01 / EMPREENDIMENTO` preservados: os dois blocos HTML foram comparados com o arquivo anterior e permaneceram idênticos. O cabeçalho conserva o layout e passa a usar o logotipo original fornecido, sem redesenho.

## Implementado

- Galeria com 10 perspectivas em sequência editorial, miniaturas, setas, gesto e ampliação em diálogo acessível por teclado.
- Filme com os 4 vídeos fornecidos, 38,5 segundos, dissolvências de 0,5 s, capítulos e reprodução silenciosa. Carregamento somente ao solicitar a reprodução. Versão 960 × 540 no celular; 1280 × 720 no desktop.
- Modelo técnico procedural de 30 × 40 m: seis vistas, órbita, cobertura opcional e vista explodida. Carrega ao aproximar a seção; celular inicia por clique. Pausa fora da tela e libera recursos ao sair da página.
- Comparador por estado de entrega, tabela de escopos e gráfico com total, preço por m² ou economia. Sem índice de prontidão inventado.
- Sete referências regionais de aluguel, pontos consultáveis e links das fontes. Segmentação empresarial exploratória com amostra e data.
- Cenários de aluguel/vacância com receita, yield bruto, payback simples e receita acumulada em seis anos. Não inclui terreno e despesas expressamente listadas na página.
- Cronograma M0–M6 com etapas de obra e comercialização, mapa externo opcional, acordions e pauta copiável.
- Movimento discreto, foco visível, redução de movimento, imagens WebP/AVIF e miniaturas.

## Valores corrigidos

| Modalidade | Área | Unitário | Total |
|---|---:|---:|---:|
| Integral | 1.200 m² | R$ 1.350,00/m² | R$ 1.620.000 |
| Estrutura+ | 1.200 m² | R$ 1.280,00/m² | R$ 1.536.000 |
| Essencial | 1.200 m² | R$ 1.150,00/m² | R$ 1.380.000 |

Escopos, prazos e soluções são premissas preliminares. O modelo e as perspectivas não são projetos executivos. O mapa identifica a região, não o lote confirmado.

## Verificação

Rotina reproduzível: `outputs/verify-site.cjs`, executada com Playwright e Google Chrome instalado. Dimensões: 1920 × 1080, 1600 × 900, 1440 × 900, 1366 × 768, 1024 × 768, 768 × 1024, 430 × 932, 390 × 844 e 360 × 800. Capturas e relatório em `outputs/ui-review`. Revisão visual independente com correções de fallback do mapa, dicas de navegação horizontal e texto comercial.

Prévia nesta sessão: http://127.0.0.1:4173/. Para servir novamente, iniciar um servidor HTTP estático na pasta `dist`; abrir o HTML diretamente por `file://` não suporta o modelo modular.

Publicação online pendente: o envio ao fluxo de hospedagem foi bloqueado pela política de autorização da sessão. Não há confirmação de publicação e nenhuma URL de produção foi apresentada como concluída.
