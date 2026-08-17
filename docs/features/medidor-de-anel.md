# Medidor de anel com IA (3 camadas)

Ferramenta pública ("Guia de medidas" no menu, e um atalho contextual dentro do modal de qualquer produto da categoria Anéis) que ajuda o cliente a descobrir o tamanho do anel antes de comprar. Pesquisada e desenhada após analisar o medidor da concorrência (Gazin Semijoias) e o estado da arte do mercado — implementada em 3 níveis de sofisticação, do mais simples ao mais moderno.

## Onde fica o código

- `src/lib/ringSizeChart.ts` — tabela/fórmulas de conversão (circunferência mm → BR/US/UK/EU)
- `src/lib/useCardCalibration.ts` — calibração por cartão, persistida no `localStorage`
- `src/lib/handLandmarker.ts` — carregador lazy do MediaPipe Hands
- `src/components/RingSizer/` — os componentes de UI (um arquivo por camada + o modal + o card de resultado)
- Pontos de entrada: `Navbar.tsx` ("Guia de medidas" no menu) e `ProductModal.tsx` (link contextual, só quando `product.glyph === 'ring'`)

## Camada 1 — Manual

Digitar circunferência ou diâmetro (mm) direto. Sem dependência de câmera, sempre funciona, é o fallback universal.

## Camada 2 — Anel físico na tela

Mesmo princípio usado pela concorrência: calibrar arrastando um retângulo até bater com um cartão de crédito/débito real encostado na tela (`CardCalibrator.tsx`), depois comparar um anel físico com um círculo ajustável. Calibração fica salva no navegador (`useCardCalibration`) — não pede de novo em visitas futuras no mesmo aparelho.

**Por que a calibração é necessária**: cada tela/dispositivo tem uma densidade de pixel diferente — sem calibrar contra um objeto de tamanho real conhecido, não tem como converter "pixels na tela" em milímetros.

## Camada 3 — Câmera com IA (o diferencial competitivo)

Usa **MediaPipe Hands** (`@mediapipe/tasks-vision`, Google) — roda 100% no navegador via WebAssembly, nenhuma foto sai do aparelho do cliente. Fluxo:

1. Usuário abre a câmera, posiciona a mão espalmada + um cartão real na mesma superfície, dentro do guia tracejado mostrado na tela.
2. **Detecção em tempo real** (modo `VIDEO`, não `IMAGE`): a IA roda continuamente em loop (`requestAnimationFrame` + `detectForVideo`) enquanto a câmera está aberta, não só uma vez na foto já tirada. A borda da câmera e um selo ficam **verdes com "Mão detectada"** assim que a IA encontra a mão — a pessoa pode reposicionar a mão *antes* de capturar, em vez de tirar a foto às cegas e só descobrir depois que não funcionou.
3. Ao capturar, a foto é congelada e a **última detecção da câmera ao vivo** (já em `lastResultRef`) é reaproveitada — não roda a IA de novo na imagem parada. Localiza a base (`MCP`) do dedo escolhido e posiciona duas "alcinhas" arrastáveis ali.
4. **Cartão**: o retângulo de calibração nasce na **mesma posição exata do guia tracejado** já mostrado durante a pré-visualização ao vivo (`CARD_GUIDE`, coordenadas compartilhadas entre a tela ao vivo e o pós-captura) — não é uma posição genérica/aleatória. Como o usuário foi instruído a encaixar o cartão real ali, aproveitar essa instrução como âncora é mais confiável do que tentar detectar o objeto por visão computacional. Três formas de ajustar: arrastar o corpo (move), arrastar o canto inferior direito (redimensiona largura e altura **de forma totalmente independente**, sem proporção travada), arrastar a alça acima do centro (**gira** — necessário porque na prática as pessoas fotografam o cartão segurando na mão, em ângulo, não perfeitamente alinhado com a câmera).
5. Usuário ajusta fino: as alcinhas até a borda real do dedo (arrastando cada uma individualmente na horizontal, ou o par inteiro na vertical pela faixa central com ícone ↕ — área de clique de 32px de altura, bem maior que a linha visível de 2px, pra ser fácil de "pegar" mesmo no celular), e o retângulo até as 4 bordas do cartão (movendo/redimensionando/girando conforme necessário).
6. Cálculo: `pxPerMm = larguraCartãoEmPx / 85.6mm` (a largura do cartão no seu próprio eixo local, que não muda com a rotação — só a exibição visual muda), depois `diâmetro = larguraDedoEmPx / pxPerMm`.

### Por que não usamos detecção automática do cartão por IA

Consideramos usar **OpenCV.js** para detectar o contorno do cartão de verdade na foto (técnica clássica de "leitor de documento": escala de cinza → detecção de bordas → contornos → filtro por proporção retangular). Descartado por um motivo concreto: essa biblioteca tem [bugs documentados e conhecidos de instabilidade com Vite](https://github.com/vitejs/vite/issues/6710) (o bundler usado neste projeto) — risco real de quebrar um recurso que já funciona bem, sem conseguir validar de verdade nesse ambiente de desenvolvimento (mesma limitação de rede que afeta o MediaPipe aqui — ver `docs/troubleshooting.md`). Preferimos a solução do item 4 acima (âncora no guia já mostrado), que é confiável e não depende de uma biblioteca instável.

### Por que é "semi-automático", não 100% automático

Os pontos do MediaPipe (`landmarks`) são o **esqueleto** da mão (posições de juntas), não a **silhueta**/contorno visual do dedo — não dá pra extrair a largura exata do dedo só com esses pontos. Por isso a IA acelera e direciona (localiza automaticamente onde medir), mas o ajuste fino da largura real continua com o usuário. Essa é uma escolha deliberada de honestidade técnica: melhor prometer "IA ajuda a posicionar, você confirma" do que reivindicar uma detecção 100% automática que os landmarks sozinhos não sustentam.

### Alerta recomendando o celular

A tela inicial da câmera mostra um aviso explicando por que usar o celular dá resultado melhor que o computador: no computador a câmera costuma ser frontal (selfie) e de qualidade mais baixa, dificultando enquadrar a mão numa mesa; no celular, a câmera traseira e a facilidade de apoiar o aparelho dão fotos bem mais nítidas e fáceis de enquadrar.

### Carregamento sob demanda

`getHandLandmarker()` usa `import()` dinâmico — o Vite separa o MediaPipe num chunk à parte (`vision_bundle`, ~153KB), baixado só quando alguém realmente abre a câmera e tira uma foto. O carregamento normal do site não é afetado (bundle principal cresceu só ~21KB com a UI das 3 camadas).

### Fallback gracioso

Se o MediaPipe falhar ao carregar (rede, navegador sem suporte a WASM, etc.) ou não encontrar uma mão na foto, a ferramenta não quebra — cai para posições padrão no centro da imagem, e o texto muda pra "Não conseguimos localizar a mão automaticamente — posicione as alcinhas e o retângulo manualmente." O fluxo continua 100% funcional sem a IA, só sem o atalho de posicionamento automático.

## Tabela de conversão (BR/US/UK/EU)

Fórmulas em `ringSizeChart.ts`, validadas contra pontos de referência cruzados de tabelas de joalheria reais:

| Sistema | Fórmula a partir da circunferência (mm) | Pontos de referência conferidos |
|---|---|---|
| Brasil (aro) | `circunferência − 40` | aro 20 ≈ 60mm, aro 15 ≈ 55mm |
| Europa/ISO | `circunferência` (o próprio número) | por definição do padrão ISO |
| EUA | `3 + (circunferência − 44.2) / 2.55`, arredondado ao meio-número | US 7 ≈ 54,4mm |
| Reino Unido | Letra A–Z (+ Z+1…Z+5) partindo de 39,05mm, passo de 1,25mm/letra | UK G≈46,5mm, UK N≈55,2mm, UK R≈60,2mm |

Validade assumida: 38mm–75mm de circunferência (`MIN_CIRCUMFERENCE_MM`/`MAX_CIRCUMFERENCE_MM`) — fora dessa faixa, a ferramenta avisa que o valor parece incomum em vez de mostrar um resultado sem sentido.

### Diagrama de posicionamento e erro diagnóstico

Um erro real de uso mostrou que texto sozinho não bastava: usuários fotografavam a palma virada de frente pra câmera (mão levantada, segurando o cartão) em vez de deitar a mão numa mesa e fotografar de cima — os dedos ficavam cortados ou dobrados fora do enquadramento certo, resultando num valor calculado sem sentido.

Duas correções:
1. **Diagrama esquemático** (SVG simples) na tela inicial da câmera, mostrando visualmente a vista de cima da mão numa mesa com o cartão ao lado, e o ícone de câmera olhando pra baixo.
2. **Mensagem de erro diagnóstica**: em vez de só "fora da faixa", mostra o valor real calculado (ex: "86mm de circunferência") e uma explicação de causa provável (alcinhas muito perto/longe uma da outra, ou quadro do cartão desproporcional ao cartão real na foto) — dá pra pessoa entender em que direção ajustar, em vez de só saber que deu errado.

## Limitações conhecidas (comunicadas ao cliente na própria tela de resultado)

- É uma medida aproximada — a mensagem final sempre recomenda considerar um número abaixo pra anéis anatômicos/largos, e falar no WhatsApp em caso de dúvida entre dois tamanhos.
- Depende de boa iluminação e de o usuário ter um cartão físico por perto (camadas 2 e 3) ou já saber a medida em mm (camada 1).
- Não substitui provar um anel físico pra compras de maior valor/definitivas (aliança, por exemplo) — isso não é uma limitação técnica corrigível, é inerente a qualquer método de medição remota, incluindo os concorrentes.
