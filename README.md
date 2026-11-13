<p align="center"><img src="icons/logo.png" alt="Logo de Cromanenos" width="180"></p>

# Cromanenos

Editor de vídeo moi sinxelo para nenas e nenos de primaria, con efectos especiais: croma, pantalla dividida para «clonarse», pantasmas, xigantes e miniaturas, marcha atrás, stop motion e máis.

Funciona no navegador, en Windows e en Linux, **sen instalar nada e sen permisos de administrador**.

## 🔒 Os vídeos non saen do ordenador

Cromanenos non ten servidor ao que subir nada. O navegador le os vídeos directamente do disco e fai nel todo o traballo: os efectos, a mestura e o vídeo final.

- Non hai contas, nin nube, nin analítica, nin publicidade.
- A páxina leva unha política de seguridade (`connect-src 'none'`) coa que o propio navegador bloquea calquera envío de datos.
- A única libraría externa vai copiada dentro do proxecto (`vendor/`); non se descarga nada de internet ao usalo.
- Pódese usar sen conexión.

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
5. Preme **💾 Gardar vídeo** e despois **⬇ Descargar** para ter o MP4.

O botón **💡 Trucos** explica paso a paso os efectos máis vistosos. O idioma (galego, castelán ou inglés) cámbiase en **⚙**.

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
- Aínda non se pode gardar o proxecto para seguir outro día: hai que rematar e gardar o vídeo na mesma sesión.
- Os vídeos gravados nalgúns móbiles (formato HEVC/H.265) poden non abrirse; nese caso hai que gravalos en formato «máis compatible» (H.264).
- Está pensado para vídeos curtos, de poucos minutos.
- O arranque en Windows e o uso da cámara e do micrófono aínda están pouco probados.

## Para quen queira tocar o código

Non hai paso de compilación: son módulos de JavaScript servidos tal cal.

| Ruta | Contido |
|---|---|
| `index.html`, `style.css` | A páxina |
| `js/` | O código: modelo da liña de tempo, compositor WebGL, previsualización, exportación, son, stop motion, idiomas |
| `icons/` | A icona do lanzador e do navegador, feitas a partir de `logo.jpeg` |
| `vendor/` | [Mediabunny](https://mediabunny.dev/) 1.66.0, para ler e escribir MP4 |
| `tools/serve.py`, `tools/serve.ps1` | Servidores locais de ficheiros estáticos |

Para as probas automáticas, `python3 tools/serve.py 8766 --no-csp` arranca o servidor sen a política de seguridade, o que permite cargar os vídeos de `test-media/` por código. Ese modo é só para desenvolver.

## Licenza

Cromanenos é software libre baixo a [licenza MIT](LICENSE).

## Créditos

Cromanenos usa [Mediabunny](https://github.com/Vanilagy/mediabunny), publicada baixo a licenza MPL-2.0 (ver `vendor/LICENSE`).
