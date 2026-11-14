<p align="center"><img src="icons/logo.png" alt="Logo de Cromanenos" width="180"></p>

# Cromanenos

Editor de vídeo moi sinxelo para nenas e nenos de primaria, con efectos especiais: croma, pantalla dividida para «clonarse», pantasmas, xigantes e miniaturas, marcha atrás, stop motion e máis.

Funciona no navegador, en Windows e en Linux, **sen instalar nada e sen permisos de administrador**.

## 🔒 Os vídeos non saen do ordenador

Cromanenos non ten servidor ao que subir nada. O navegador le os vídeos directamente do disco e fai nel todo o traballo: os efectos, a mestura, os proxectos gardados e o vídeo final.

- Non hai contas, nin nube, nin analítica, nin publicidade.
- A páxina leva unha política de seguridade (`connect-src 'self'`) coa que o propio navegador lle impide conectarse a calquera sitio que non sexa o seu lanzador, que está neste mesmo ordenador. A páxina non pode enviar nada a internet.
- A única libraría externa vai copiada dentro do proxecto (`vendor/`).
- Pódese usar sen conexión.

### O único que sae á rede: mirar se hai versión nova

O lanzador (o programiña que arranca con `iniciar.bat` ou `iniciar.sh`) pregúntalle a github.com cal é a última versión publicada de Cromanenos e, se hai unha máis nova, descárgaa dos servidores de GitHub. Son descargas normais, coma as de calquera navegador: **non se envía ningún dato da persoa nin dos seus vídeos ou proxectos**. Como en calquera conexión, GitHub ve o enderezo IP desde o que se pide.

Se non hai internet, ou a rede do centro bloquea GitHub, non pasa nada: Cromanenos arranca e funciona igual, sen avisos nin erros.

## Usar sen descargar

Cromanenos tamén se pode abrir directamente cunha ligazón, sen descargar nin descomprimir nada:

**<https://abel-eiras.github.io/cromanenos/>**

Aí tamén **os vídeos non saen do ordenador**: esa páxina só entrega o programa, e todo o demais faise no navegador, igual ca na versión descargada. Sempre é a última versión.

## Como arrancalo no propio ordenador

Descarga o ZIP da [última versión](https://github.com/abel-eiras/cromanenos/releases/latest) e descomprímeo onde queiras (tamén vale un lapis USB).

### Windows

1. Abre o cartafol e fai dobre clic en **`iniciar.bat`**.
2. Ábrese unha xanela negra e, de seguido, o navegador con Cromanenos.
3. Non peches a xanela negra mentres o uses. Para rematar, péchaa.

A primeira vez que o arrancas créase no cartafol un atallo **Cromanenos** coa icona. A partir de aí podes usar ese atallo, ou copialo ao escritorio.

Se Windows amosa o aviso «Windows protexeu o seu PC», preme en «Máis información» e despois en «Executar de todas as formas». Non fai falta instalar nada: úsase o PowerShell que xa trae Windows.

### Linux

1. Abre un terminal no cartafol e executa:

   ```bash
   ./iniciar.sh
   ```

2. Ábrese o navegador con Cromanenos.
3. Para rematar, preme `Ctrl+C` no terminal.

Só fai falta `python3`, que xa vén na maioría das distribucións.

A primeira vez que o arrancas créase no cartafol un lanzador **Cromanenos** coa icona, que podes abrir con dobre clic ou copiar ao escritorio. Segundo o escritorio, a primeira vez pode pedir que confirmes que queres executalo.

### Navegador

Recoméndase **Chrome, Edge ou Chromium** nunha versión recente. Se o navegador que se abre é outro, copia o enderezo `http://localhost:8765/` e pégao nun destes.

A cámara e o micrófono (para gravar vídeo, para o stop motion e para gravar a voz) piden permiso a primeira vez.

## Como se usa

1. Preme **➕** en «Fondo» ou en «Enriba» para engadir vídeos ou fotos, ou arrástraos desde un cartafol e sóltaos na pista. Cada un queda como un anaco na liña de tempo. Con **🎥** gravas un vídeo coa cámara sen saír de Cromanenos.
2. **Toca un anaco** para escollelo.
3. En **✨ Efectos**, preme o que queiras poñerlle a ese anaco.
4. Preme **▶ Ver** para comprobar como queda.
5. Preme **🎬 Crear o vídeo** e despois **⬇ Descargar o vídeo** para ter o MP4.

**Non hai medo a equivocarse**: **↩ Desfacer** (`Ctrl+Z`) volve atrás paso a paso, e **↪ Refacer** (`Ctrl+Y`) volve adiante. E se a pestana se pecha sen querer ou se apaga o ordenador, ao abrir Cromanenos outra vez pregunta **«Seguir onde o deixaches?»**.

A vista do vídeo pódese facer máis grande ou máis pequena arrastrando a asa **⋯ ↕ ⋯** que ten debaixo (ou coas frechas do teclado, se a asa está escollida). Un dobre clic na asa devólvea ao tamaño automático. Cromanenos lembra o tamaño para a próxima vez.

O botón **💡 Trucos** explica paso a paso os efectos máis vistosos, e cada truco ten un botón **▶ Probar cun exemplo** que o carga xa feito cuns vídeos de mostra, para ver como queda antes de gravar nada. O idioma (galego, castelán ou inglés) cámbiase en **⚙**.

### Proxectos: gardar e seguir outro día

Na parte de arriba están os botóns do proxecto:

| | |
|---|---|
| **📄 Novo** | Comeza un proxecto baleiro |
| **📂 Abrir** | Amosa os proxectos recentes e deixa buscar outro no ordenador |
| **💾 Gardar** | Garda os cambios no mesmo ficheiro (`Ctrl+S`) |
| **Gardar como…** | Garda unha copia con outro nome ou noutro sitio (`Ctrl+Maiús+S`) |

O proxecto gárdase nun só ficheiro rematado en `.cromanenos`. **Leva dentro todo**: a liña de tempo cos seus efectos, os adhesivos, os textos, os sons e tamén os vídeos e as fotos. Por iso pode ocupar bastante, pero pódese copiar a un lapis USB e abrir noutro ordenador sen que falte nada.

Un punto «•» ao lado do nome avisa de que hai cambios sen gardar, e Cromanenos pregunta antes de perdelos.

En Chrome, Edge e Chromium, «Gardar» escribe directamente no ficheiro e os proxectos recentes quedan lembrados (ao abrir un recente, o navegador pode pedir permiso para usar ese ficheiro). Noutros navegadores, gardar descarga o ficheiro ao cartafol de descargas e non hai lista de recentes.

O proxecto non é o vídeo final: para ter o MP4 hai que premer **🎬 Crear o vídeo**.

### Efectos para cada anaco

| | Efecto | Para que serve |
|---|---|---|
| 🟩 | Croma | Fai invisible unha cor (un fondo verde, un calcetín verde…) |
| 👯 | Pantalla dividida | Á esquerda vese o fondo e á dereita o anaco de enriba |
| 👻 | Pantasma | Fai o anaco medio transparente |
| 🔍 | Tamaño | Agranda, encolle e move o anaco |
| 🪞 | Espello | Dálle a volta de esquerda a dereita |
| 🎨 | Cores | Branco e negro, sepia e outros filtros |
| ⏩ | Velocidade | Cámara lenta ou rápida |
| ⏪ | Ao revés | Marcha atrás |
| 🔇 | Sen son | O anaco deixa de soar (para poñerlle a túa voz ou outros sons) |

### Mover e recortar os anacos

- **Arrastra un anaco** para cambialo de sitio, ou para levalo á outra pista.
- **Tira dos seus bordos** para recortarlle o principio ou o final (nas fotos, para que duren máis ou menos).
- Co teclado: `Alt` + frechas moven o anaco escollido.

Cada anaco amosa unha miniatura do vídeo e as iconas dos efectos que leva postos.

### Outras ferramentas

- **✂ Cortar aquí** parte un anaco en dous; cada metade pode levar efectos distintos.
- **🧊 Conxelar aquí** detén a imaxe uns segundos.
- **⭐ Adhesivos e texto** que aparecen e desaparecen cando ti queiras.
- **🔊 Sons**: seis efectos sonoros e gravación da voz co micrófono.
- **📸 Stop motion**: fotos coa cámara, unha a unha, ou escollidas do disco.
- **🎥 Gravar coa cámara**: conta atrás 3-2-1, gravar, e despois «Usar» ou «Repetir».

### Canto dura o vídeo

O vídeo remata cando remata o último anaco, adhesivo, texto ou son, o que estea máis á dereita. Se o «Fondo» acaba antes, queda quieto na súa última imaxe (así unha toma curta do sitio baleiro vale de fondo para unha toma máis longa). A pista de «Enriba» desaparece cando remata.

### Trucos

- **🧦 A man invisible.** Grava o sitio baleiro cun trípode e ponllo a «Fondo». Sen mover a cámara, grava a escena cun calcetín verde na man e ponllo a «Enriba». Escolle ese anaco, preme 🟩 Croma e toca o calcetín co 🎯.
- **👯 Clónate.** Grava dúas tomas sen mover a cámara: nunha estás á esquerda e na outra á dereita. Pon unha en «Fondo» e outra en «Enriba», e a esta ponlle 👯 Pantalla dividida.
- **✨ Aparecer e desaparecer.** Grava unha toma contigo e outra sen ti, sen mover a cámara, e ponas seguidas na mesma pista.

## Versións novas

Ao arrancar, Cromanenos mira se hai unha versión máis nova. Se a hai, e ten conexión, descárgaa e instálaa soa mentres segues traballando; un aviso di que estará lista **a próxima vez que o abras**. Só se substitúen os ficheiros do programa: os teus proxectos e vídeos non se tocan.

En **⚙ Configuración** vese a versión que tes e hai un botón **🔄 Comprobar se hai versións novas**. Se aparece unha, o botón **⬇ Descargar e actualizar** instálaa. Se non se pode (por exemplo, porque a rede bloquea a descarga), ofrécese unha ligazón á páxina de versións para baixala á man.

## Vídeos de proba

No cartafol `test-media/` hai uns vídeos sintéticos pequenos para probar sen ter que gravar nada:

| Ficheiro | Que é |
|---|---|
| `fondo.mp4` | Carta de axuste de 6 s con son, para usar de fondo |
| `enriba.mp4` | Un cadrado vermello movéndose sobre fondo verde, para probar o croma |
| `conta.mp4` | Un contador de fotogramas, para comprobar a velocidade e a marcha atrás |
| `fondo.png` | Unha imaxe fixa de cor |
| `ex-sitio.mp4` | Exemplos dos trucos: unha habitación baleira |
| `ex-calcetin.mp4` | A mesma habitación cun «calcetín» verde que sostén unha pelota (a man invisible) |
| `ex-monstro-esquerda.mp4`, `ex-monstro-dereita.mp4` | Un monstriño debuxado, á esquerda e á dereita da habitación (clonarse, aparecer e desaparecer, pantasma) |
| `ex-verde.mp4` | O monstriño sobre fondo verde (xigantes e miniaturas) |
| `ex-paisaxe.png` | Unha paisaxe con casiñas |

Os exemplos son debuxos feitos por programa (`tools/xerar-exemplos.py`); non sae ninguén neles.

## Limitacións coñecidas

- O son do MP4 pode saír en formato Opus (pasa en Linux); nalgún reprodutor antigo o vídeo veríase sen son.
- Cambiar a velocidade cambia tamén o ton da voz.
- Os anacos ao revés non soan na previsualización, pero si no vídeo gardado.
- O ficheiro de proxecto leva dentro os vídeos, así que ocupa o mesmo ca eles xuntos.
- A lista de proxectos recentes e o «Gardar» directo só funcionan en Chrome, Edge e Chromium.
- Os vídeos gravados nalgúns móbiles (formato HEVC/H.265) poden non abrirse; Cromanenos avisa e explica que hai que gravalos en formato «máis compatible» (H.264).
- A recuperación automática garda unha copia dos vídeos no almacenamento do navegador, neste mesmo ordenador; se non hai sitio, ou en navegación privada, simplemente non hai recuperación. Só a leva unha pestana de cada vez.
- Despois de «Gardar» nun ficheiro, pode que non se poidan desfacer os pasos anteriores nos que se borraran anacos.
- Está pensado para vídeos curtos, de poucos minutos.
- O arranque e as actualizacións en Windows, e o uso real da cámara e do micrófono, aínda están pouco probados.

## Para quen queira tocar o código

Non hai paso de compilación: son módulos de JavaScript servidos tal cal.

| Ruta | Contido |
|---|---|
| `index.html`, `style.css` | A páxina |
| `js/` | O código: modelo da liña de tempo, compositor WebGL, previsualización, exportación, son, stop motion, cámara, proxectos, desfacer, recuperación, miniaturas, versións, idiomas |
| `.nojekyll` | Para que GitHub Pages sirva os ficheiros tal cal |
| `VERSION` | O número desta versión |
| `icons/` | A icona do lanzador e do navegador, feitas a partir de `logo.jpeg` |
| `vendor/` | [Mediabunny](https://mediabunny.dev/) 1.66.0, para ler e escribir MP4 |
| `tools/serve.py`, `tools/serve.ps1` | Os lanzadores: serven os ficheiros a este ordenador e encárganse das actualizacións |

### O ficheiro `.cromanenos`

É un formato propio e sinxelo: unha sinatura de 20 bytes (`CROMANENOS-PROXECTO` e un salto de liña), un número de 4 bytes coa lonxitude do índice, o índice en JSON e, a continuación, os vídeos, fotos e gravacións un tras outro. O índice di que versión do formato é, describe a liña de tempo e lista o nome, o tipo e o tamaño de cada ficheiro incluído. O código está en `js/projectfile.js`.

### Recuperación automática

Uns segundos despois de cada cambio, e ao agochar ou pechar a pestana, `js/recovery.js` garda o traballo sen gardar no almacenamento privado do navegador (OPFS): cada vídeo escríbese unha soa vez e despois só se reescribe a descrición da liña de tempo. Bórrase ao gardar o proxecto nun ficheiro, ao empezar un novo ou ao dicir que non se quere recuperar. Nunca sae do ordenador.

### Actualizacións

O lanzador segue a redirección de `releases/latest` no repositorio para saber a última versión e descarga `cromanenos-vX.Y.Z.zip` desa versión. Antes de instalar comproba que o ZIP só ten ficheiros dentro de `cromanenos/`, sen rutas raras, e que o seu `VERSION` coincide. Nunha copia con `.git` (de desenvolvemento) nunca se instala nada. Para probar con outro servidor pódese cambiar a orixe coa variable de contorno `CROMANENOS_UPDATE_BASE`.

Para publicar unha versión: cambiar `VERSION`, etiquetar `vX.Y.Z` e subir á release un ZIP chamado `cromanenos-vX.Y.Z.zip` co cartafol `cromanenos/` dentro (por exemplo con `git archive --format=zip --prefix=cromanenos/ -o cromanenos-vX.Y.Z.zip HEAD`).

Para as probas automáticas, `python3 tools/serve.py 8766 --no-csp` arranca o servidor sen a política de seguridade, o que permite cargar os vídeos de `test-media/` por código. Ese modo é só para desenvolver.

## Licenza

Cromanenos é software libre baixo a [licenza MIT](LICENSE).

## Créditos

Cromanenos usa [Mediabunny](https://github.com/Vanilagy/mediabunny), publicada baixo a licenza MPL-2.0 (ver `vendor/LICENSE`).
