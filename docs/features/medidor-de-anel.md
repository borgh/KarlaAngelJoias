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

1. Usuário abre a câmera, posiciona a mão espalmada + um cartão real na mesma superfície, tira uma foto (frame congelado, não vídeo contínuo).
2. `HandLandmarker.detect()` roda sobre a foto e localiza os 21 pontos padrão da mão. Localiza a base (`MCP`) do dedo escolhido e sugere uma posição inicial de duas "alcinhas" arrastáveis ali.
3. Usuário ajusta fino: as alcinhas até a borda real do dedo, e um retângulo até a borda do cartão (mesmo cartão, mesma foto — evita ter que assumir distância/zoom da câmera).
4. Cálculo: `pxPerMm = larguraCartãoEmPx / 85.6mm` (tamanho ISO de um cartão), depois `diâmetro = larguraDedoEmPx / pxPerMm`.

### Por que é "semi-automático", não 100% automático

Os pontos do MediaPipe (`landmarks`) são o **esqueleto** da mão (posições de juntas), não a **silhueta**/contorno visual do dedo — não dá pra extrair a largura exata do dedo só com esses pontos. Por isso a IA acelera e direciona (localiza automaticamente onde medir), mas o ajuste fino da largura real continua com o usuário. Essa é uma escolha deliberada de honestidade técnica: melhor prometer "IA ajuda a posicionar, você confirma" do que reivindicar uma detecção 100% automática que os landmarks sozinhos não sustentam.

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

## Limitações conhecidas (comunicadas ao cliente na própria tela de resultado)

- É uma medida aproximada — a mensagem final sempre recomenda considerar um número abaixo pra anéis anatômicos/largos, e falar no WhatsApp em caso de dúvida entre dois tamanhos.
- Depende de boa iluminação e de o usuário ter um cartão físico por perto (camadas 2 e 3) ou já saber a medida em mm (camada 1).
- Não substitui provar um anel físico pra compras de maior valor/definitivas (aliança, por exemplo) — isso não é uma limitação técnica corrigível, é inerente a qualquer método de medição remota, incluindo os concorrentes.
