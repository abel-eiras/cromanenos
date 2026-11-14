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

## Como arrancalo

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

A cámara e o micrófono (para o stop motion e para gravar a voz) piden permiso a primeira vez.

## Como se usa

1. Preme **➕** en «Fondo» ou en «Enriba» para engadir vídeos ou fotos. Cada un queda como un anaco na liña de tempo.
2. **Toca un anaco** para escollelo.
3. En **✨ Efectos**, preme o que queiras poñerlle a ese anaco.
4. Preme **▶ Ver** para comprobar como queda.
5. Preme **🎬 Crear o vídeo** e despois **⬇ Descargar o vídeo** para ter o MP4.

A vista do vídeo pódese facer máis grande ou máis pequena arrastrando a asa que ten debaixo (ou coas frechas do teclado, se a asa está escollida). Un dobre clic na asa devólvea ao tamaño automático. Cromanenos lembra o tamaño para a próxima vez.

O botón **💡 Trucos** explica paso a paso os efectos máis vistosos. O idioma (galego, castelán ou inglés) cámbiase en **⚙**.

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

### Outras ferramentas

- **✂ Cortar aquí** parte un anaco en dous; cada metade pode levar efectos distintos.
- **🧊 Conxelar aquí** detén a imaxe uns segundos.
- **⭐ Adhesivos e texto** que aparecen e desaparecen cando ti queiras.
- **🔊 Sons**: seis efectos sonoros e gravación da voz co micrófono.
- **📸 Stop motion**: fotos coa cámara, unha a unha, ou escollidas do disco.

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

## Limitacións coñecidas

- O son do MP4 pode saír en formato Opus (pasa en Linux); nalgún reprodutor antigo o vídeo veríase sen son.
- Cambiar a velocidade cambia tamén o ton da voz.
- Os anacos ao revés non soan na previsualización, pero si no vídeo gardado.
- O ficheiro de proxecto leva dentro os vídeos, así que ocupa o mesmo ca eles xuntos.
- A lista de proxectos recentes e o «Gardar» directo só funcionan en Chrome, Edge e Chromium.
- Os vídeos gravados nalgúns móbiles (formato HEVC/H.265) poden non abrirse; nese caso hai que gravalos en formato «máis compatible» (H.264).
- Está pensado para vídeos curtos, de poucos minutos.
- O arranque e as actualizacións en Windows, e o uso da cámara e do micrófono, aínda están pouco probados.

## Para quen queira tocar o código

Non hai paso de compilación: son módulos de JavaScript servidos tal cal.

| Ruta | Contido |
|---|---|
| `index.html`, `style.css` | A páxina |
| `js/` | O código: modelo da liña de tempo, compositor WebGL, previsualización, exportación, son, stop motion, proxectos, versións, idiomas |
| `VERSION` | O número desta versión |
| `icons/` | A icona do lanzador e do navegador, feitas a partir de `logo.jpeg` |
| `vendor/` | [Mediabunny](https://mediabunny.dev/) 1.66.0, para ler e escribir MP4 |
| `tools/serve.py`, `tools/serve.ps1` | Os lanzadores: serven os ficheiros a este ordenador e encárganse das actualizacións |

### O ficheiro `.cromanenos`

É un formato propio e sinxelo: unha sinatura de 20 bytes (`CROMANENOS-PROXECTO` e un salto de liña), un número de 4 bytes coa lonxitude do índice, o índice en JSON e, a continuación, os vídeos, fotos e gravacións un tras outro. O índice di que versión do formato é, describe a liña de tempo e lista o nome, o tipo e o tamaño de cada ficheiro incluído. O código está en `js/projectfile.js`.

### Actualizacións

O lanzador segue a redirección de `releases/latest` no repositorio para saber a última versión e descarga `cromanenos-vX.Y.Z.zip` desa versión. Antes de instalar comproba que o ZIP só ten ficheiros dentro de `cromanenos/`, sen rutas raras, e que o seu `VERSION` coincide. Nunha copia con `.git` (de desenvolvemento) nunca se instala nada. Para probar con outro servidor pódese cambiar a orixe coa variable de contorno `CROMANENOS_UPDATE_BASE`.

Para publicar unha versión: cambiar `VERSION`, etiquetar `vX.Y.Z` e subir á release un ZIP chamado `cromanenos-vX.Y.Z.zip` co cartafol `cromanenos/` dentro (por exemplo con `git archive --format=zip --prefix=cromanenos/ -o cromanenos-vX.Y.Z.zip HEAD`).

Para as probas automáticas, `python3 tools/serve.py 8766 --no-csp` arranca o servidor sen a política de seguridade, o que permite cargar os vídeos de `test-media/` por código. Ese modo é só para desenvolver.

## Licenza

Cromanenos é software libre baixo a [licenza MIT](LICENSE).

## Créditos

Cromanenos usa [Mediabunny](https://github.com/Vanilagy/mediabunny), publicada baixo a licenza MPL-2.0 (ver `vendor/LICENSE`).
