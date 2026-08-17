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

### Ponto de medição correto: meio do dedo, não a base

Erro real encontrado em uso: as alcinhas ficavam na altura da palma da mão. Causa: o código usava só a **MCP** (junta da base do dedo) — é ali que o MediaPipe "nomeia" o dedo, mas um anel **não** fica ali; fica na falange proximal, **entre a MCP e a PIP** (primeira dobra). Corrigido usando o ponto médio MCP↔PIP como ponto de medição, e a direção MCP→PIP (eixo real da falange) em vez de pulso→base (orientação geral da mão, que diverge do dedo quando ele está afastado dos outros). Ver `HAND_LANDMARKS` em `src/lib/handLandmarker.ts` — cada dedo tem 4 pontos (MCP → PIP → DIP → TIP).

### Checagem ao vivo do cartão no guia

`checkCardInGuide()` em `src/lib/cardDetector.ts` — roda a cada 3 frames durante a pré-visualização (junto com a detecção de mão), em resolução baixa (160px) pra não travar a câmera. Três critérios, todos obrigatórios: (1) borda absoluta forte no perímetro do guia, (2) perímetro bem mais forte que o entorno imediato (mesa lisa), (3) **nenhum dos 4 lados individualmente fraco** — é esse critério que distingue "mão cobrindo o cartão" (uma borda inteira some por onde a mão entra) de "cartão levemente torto" (as 4 bordas continuam lá).

Calibrado com 6 cenários sintéticos, todos corretos: aprova cartão realista (chip/texto/logo), torto a 5° e a 10°; reprova mão cobrindo o cartão, só a mesa, mão sem cartão. Foram necessárias 3 iterações de métrica — a primeira (perímetro/interior) confundia cartão realista com coberto; a segunda (perímetro/fora) ainda deixava passar mão sobre o cartão; a terceira (adicionando o critério por-lado) separou tudo com folga.

Na interface ao vivo, dois indicadores **separados** ("Mão" e "Cartão"), cada um verde independentemente, com mensagem contextual dizendo o que ainda falta ajustar. Quando os dois estão OK: borda verde, "✅ pode capturar", botão vira "Capturar agora". O objetivo é **guiar a pessoa pra tirar uma foto boa** antes de capturar — que é o que realmente determina o resultado, muito mais que qualquer processamento depois.

### Alternativas mais "avançadas" avaliadas e descartadas

**Segment Anything (SAM / SAM2, Meta)** — modelo de segmentação com precisão de pixel, seria o ideal em teoria pra recortar o dedo e o cartão exatamente. Descartado por um motivo concreto de viabilidade: [rodando no navegador via WebAssembly, o encoder leva ~45 segundos, impraticável](https://github.com/microsoft/onnxruntime-inference-examples/tree/main/js/segment-anything); só fica rápido com WebGPU em GPUs recentes, que muitos celulares dos clientes não têm. Pra uma loja onde qualquer cliente precisa conseguir usar, isso é um risco inaceitável — melhor uma técnica mais simples que funciona em qualquer aparelho e guia bem a foto.

**OpenCV.js** — ver seção "Detecção automática do cartão por bordas" acima; descartado por bugs documentados de instabilidade com Vite.

### Medição real da largura do dedo (não mais um chute)

`src/lib/fingerEdgeDetector.ts`, função `refineFingerEdges()` — antes, a largura do dedo usada pra posicionar as alcinhas era só um chute proporcional fixo (16% da distância pulso→base do dedo), sem nunca olhar a imagem de verdade. Agora: varre uma linha **perpendicular ao eixo do dedo** (calculado a partir do vetor pulso→base já detectado pelo MediaPipe), ancorada nesse mesmo ponto, e procura o pico de gradiente (Sobel) de cada lado — a borda real (transição pele→fundo), medida de verdade na foto. Mesma filosofia de busca local ancorada do detector de cartão.

**Precisão validada** com imagem sintética antes de integrar: dedo reto ≈ 99,9% de precisão (erro de 0,3px numa largura de 40px); dedo em ângulo de 20° ≈ 95% de precisão. Usa a distância euclidiana real entre as duas bordas encontradas (não só a diferença em X), senão fotos com o dedo em ângulo teriam a largura subestimada.

Só usa o resultado da detecção quando a confiança for razoável (>50%, calculada pela força do pico de gradiente encontrado comparada à média do perfil); caso contrário cai pro chute proporcional antigo — mais previsível que confiar numa detecção ambígua (mesmo padrão de "melhor esforço com fallback gracioso" usado em todo o recurso).

### Detecção automática do cartão por bordas (best-effort)

`src/lib/cardDetector.ts`, função `refineCardRect()` — depois de capturar, refina automaticamente a posição/tamanho/rotação do quadro de calibração, tentando encaixar nas bordas reais do cartão detectadas na foto. Técnica: gradiente Sobel (magnitude de borda) + busca em duas fases — uma grade grosseira de posição/escala primeiro (evita ficar "preso" numa região sem gradiente, problema real encontrado testando a primeira versão), seguida de refinamento fino por coordinate descent. Roda em ~75-150ms, 100% no navegador, sem dependência nova.

**Honestidade técnica**: testado com uma foto sintética idealizada (cartão bem definido, fundo uniforme), o refinamento melhora a posição de forma mensurável (~50% de redução no erro de posição) mas **não converge pra um encaixe perfeito de forma confiável** — características internas do próprio cartão (chip, texto, logo) podem confundir a busca, puxando o retângulo pra um tamanho ligeiramente errado. Por isso a interface descreve isso como "encaixado automaticamente — confira e ajuste fino se precisar", nunca como garantia de precisão. Ajuste manual continua sempre disponível.

Essa é a mesma razão pela qual optamos por essa técnica em vez de OpenCV.js (avaliado e descartado — ver `docs/troubleshooting.md`, bugs documentados de instabilidade com Vite): entre um risco real de dependência instável e uma técnica mais simples com limitações conhecidas e comunicadas, a segunda é mais responsável.

### Bolinhas do dedo em formato de mira vazada

Redesenhadas depois de um relato real: o preenchimento vermelho sólido das bolinhas tampava a vista da borda do dedo bem no ponto que importa, dificultando perceber se o ajuste ficou preciso. Agora são uma "mira" vazada — anel branco externo (contraste em qualquer tom de pele) + anel vermelho mais fino por dentro + cruz central marcando o ponto exato — sem nada sólido tampando a imagem por baixo.

### Diagrama de posicionamento e erro diagnóstico

Um erro real de uso mostrou que texto sozinho não bastava: usuários fotografavam a palma virada de frente pra câmera (mão levantada, segurando o cartão) em vez de deitar a mão numa mesa e fotografar de cima — os dedos ficavam cortados ou dobrados fora do enquadramento certo, resultando num valor calculado sem sentido.

Duas correções:
1. **Diagrama esquemático** (SVG simples) na tela inicial da câmera, mostrando visualmente a vista de cima da mão numa mesa com o cartão ao lado, e o ícone de câmera olhando pra baixo.
2. **Mensagem de erro diagnóstica**: em vez de só "fora da faixa", mostra o valor real calculado (ex: "86mm de circunferência") e uma explicação de causa provável (alcinhas muito perto/longe uma da outra, ou quadro do cartão desproporcional ao cartão real na foto) — dá pra pessoa entender em que direção ajustar, em vez de só saber que deu errado.

## Limitações conhecidas (comunicadas ao cliente na própria tela de resultado)

- É uma medida aproximada — a mensagem final sempre recomenda considerar um número abaixo pra anéis anatômicos/largos, e falar no WhatsApp em caso de dúvida entre dois tamanhos.
- Depende de boa iluminação e de o usuário ter um cartão físico por perto (camadas 2 e 3) ou já saber a medida em mm (camada 1).
- Não substitui provar um anel físico pra compras de maior valor/definitivas (aliança, por exemplo) — isso não é uma limitação técnica corrigível, é inerente a qualquer método de medição remota, incluindo os concorrentes.
