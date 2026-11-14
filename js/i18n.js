// Textos da aplicación en galego (por defecto), castelán e inglés.
export const LANGS = { gl: 'Galego', es: 'Castellano', en: 'English' };

const D = {
  privacy: ['🔒 Os teus vídeos non saen deste ordenador', '🔒 Tus vídeos no salen de este ordenador', '🔒 Your videos never leave this computer'],
  settings: ['Configuración', 'Configuración', 'Settings'],
  language: ['Idioma', 'Idioma', 'Language'],
  close: ['Pechar', 'Cerrar', 'Close'],
  cancel: ['Cancelar', 'Cancelar', 'Cancel'],
  play: ['▶ Ver', '▶ Ver', '▶ Play'],
  pause: ['⏸ Parar', '⏸ Parar', '⏸ Pause'],
  position: ['Posición', 'Posición', 'Position'],
  save: ['🎬 Crear o vídeo', '🎬 Crear el vídeo', '🎬 Make the video'],
  download: ['⬇ Descargar o vídeo', '⬇ Descargar el vídeo', '⬇ Download the video'],
  preview: ['Vista do vídeo', 'Vista del vídeo', 'Video preview'],

  trackTop: ['2 · Enriba', '2 · Encima', '2 · On top'],
  trackBottom: ['1 · Fondo', '1 · Fondo', '1 · Background'],
  trackSound: ['🔊 Sons', '🔊 Sonidos', '🔊 Sounds'],
  addFile: ['Engadir vídeo ou fotos', 'Añadir vídeo o fotos', 'Add video or photos'],
  addStop: ['Facer stop motion', 'Hacer stop motion', 'Make stop motion'],

  hintEmpty: ['Preme ➕ en «Fondo» para engadir un vídeo ou unha foto', 'Pulsa ➕ en «Fondo» para añadir un vídeo o una foto', 'Press ➕ on “Background” to add a video or a photo'],
  hintTop: ['Agora engade algo en «Enriba» para facer trucos', 'Ahora añade algo en «Encima» para hacer trucos', 'Now add something to “On top” to do tricks'],
  hintPick: ['Toca no vídeo a cor que queres facer desaparecer', 'Toca en el vídeo el color que quieres hacer desaparecer', 'Tap the colour in the video that you want to make disappear'],
  tipJump: ['💡 Truco: para que algo apareza ou desapareza, grava dúas tomas sen mover a cámara e ponas seguidas na mesma pista.',
    '💡 Truco: para que algo aparezca o desaparezca, graba dos tomas sin mover la cámara y ponlas seguidas en la misma pista.',
    '💡 Trick: to make something appear or vanish, film two takes without moving the camera and put them one after the other on the same track.'],
  tipSock: ['💡 Truco: pon de fondo unha foto do sitio baleiro. O que teña a cor escollida (un calcetín verde!) vólvese invisible.',
    '💡 Truco: pon de fondo una foto del sitio vacío. Lo que tenga el color elegido (¡un calcetín verde!) se vuelve invisible.',
    '💡 Trick: use a photo of the empty place as background. Anything in the chosen colour (a green sock!) turns invisible.'],

  cardClip: ['🎬 Anaco escollido', '🎬 Trozo elegido', '🎬 Selected clip'],
  noClip: ['Toca un anaco na liña de tempo', 'Toca un trozo en la línea de tiempo', 'Tap a clip on the timeline'],
  speed: ['Velocidade', 'Velocidad', 'Speed'],
  reverse: ['⏪ Ao revés', '⏪ Al revés', '⏪ Backwards'],
  mirror: ['🪞 Espello', '🪞 Espejo', '🪞 Mirror'],
  split: ['✂ Cortar aquí', '✂ Cortar aquí', '✂ Cut here'],
  freeze: ['🧊 Conxelar aquí', '🧊 Congelar aquí', '🧊 Freeze here'],
  del: ['🗑 Borrar', '🗑 Borrar', '🗑 Delete'],
  stillDur: ['Canto dura (segundos)', 'Cuánto dura (segundos)', 'How long (seconds)'],
  freezeName: ['Conxelado', 'Congelado', 'Freeze'],

  tricks: ['💡 Trucos', '💡 Trucos', '💡 Tricks'],
  trackStickers: ['⭐ Adhesivos', '⭐ Pegatinas', '⭐ Stickers'],
  cardFx: ['✨ Efectos', '✨ Efectos', '✨ Effects'],
  fxHint: ['Toca primeiro un anaco na liña de tempo e despois escolle un efecto', 'Toca primero un trozo en la línea de tiempo y después elige un efecto', 'First tap a clip on the timeline, then choose an effect'],
  fx_chroma: ['Croma', 'Croma', 'Green screen'],
  fx_split: ['Pantalla dividida', 'Pantalla dividida', 'Split screen'],
  fx_ghost: ['Pantasma', 'Fantasma', 'Ghost'],
  fx_size: ['Tamaño', 'Tamaño', 'Size'],
  fx_mirror: ['Espello', 'Espejo', 'Mirror'],
  fx_filter: ['Cores', 'Colores', 'Colours'],
  fx_speed: ['Velocidade', 'Velocidad', 'Speed'],
  fx_reverse: ['Ao revés', 'Al revés', 'Backwards'],
  removeFx: ['Quitar {name}', 'Quitar {name}', 'Remove {name}'],
  fxBottomHint: ['Este anaco está no fondo e detrás del só hai negro. Para mesturar dúas imaxes, pon unha delas en «Enriba».',
    'Este trozo está en el fondo y detrás solo hay negro. Para mezclar dos imágenes, pon una de ellas en «Encima».',
    'This clip is on the background, with only black behind it. To mix two pictures, put one of them on “On top”.'],
  chromaInfo: ['A cor escollida vólvese invisible e vese o que hai debaixo.', 'El color elegido se vuelve invisible y se ve lo que hay debajo.', 'The chosen colour turns invisible and you see what is underneath.'],
  splitInfo: ['Á esquerda da liña vese o que hai debaixo; á dereita, este anaco.', 'A la izquierda de la línea se ve lo que hay debajo; a la derecha, este trozo.', 'Left of the line you see what is underneath; right of it, this clip.'],
  reverseInfo: ['O anaco vese do final ao comezo.', 'El trozo se ve del final al principio.', 'The clip plays from the end to the start.'],
  mirrorInfo: ['Dálle a volta: a esquerda pasa á dereita.', 'Le da la vuelta: la izquierda pasa a la derecha.', 'Flips it: left becomes right.'],
  putHere: ['📍 Poñer na liña vermella', '📍 Poner en la línea roja', '📍 Move to the red line'],
  noItem: ['Toca un adhesivo ou un texto para cambialo', 'Toca una pegatina o un texto para cambiarlo', 'Tap a sticker or a text to change it'],
  noSound: ['Toca un son na liña de tempo para cambialo', 'Toca un sonido en la línea de tiempo para cambiarlo', 'Tap a sound on the timeline to change it'],

  cardChroma: ['🟩 Croma', '🟩 Croma', '🟩 Green screen'],
  keyColor: ['Cor que desaparece', 'Color que desaparece', 'Colour that disappears'],
  pick: ['🎯 Escoller a cor no vídeo', '🎯 Elegir el color en el vídeo', '🎯 Pick the colour in the video'],
  tol: ['Canto borra', 'Cuánto borra', 'How much it erases'],
  soft: ['Bordo suave', 'Borde suave', 'Soft edge'],

  cardSplit: ['👯 Pantalla dividida', '👯 Pantalla dividida', '👯 Split screen'],
  splitOn: ['Esquerda: fondo · Dereita: enriba', 'Izquierda: fondo · Derecha: encima', 'Left: background · Right: top'],
  splitPos: ['Onde vai a liña', 'Dónde va la línea', 'Where the line goes'],
  splitSoft: ['Liña difuminada', 'Línea difuminada', 'Blurry line'],

  cardGhost: ['👻 Pantasma e tamaño', '👻 Fantasma y tamaño', '👻 Ghost and size'],
  opacity: ['Canto se ve (pantasma ↔ normal)', 'Cuánto se ve (fantasma ↔ normal)', 'How visible (ghost ↔ normal)'],
  zoom: ['Tamaño (miniatura ↔ xigante)', 'Tamaño (miniatura ↔ gigante)', 'Size (tiny ↔ giant)'],
  dragTip: ['Arrastra a imaxe co rato para movela', 'Arrastra la imagen con el ratón para moverla', 'Drag the picture with the mouse to move it'],
  reset: ['↩ Como estaba', '↩ Como estaba', '↩ Reset'],

  cardFilter: ['🎨 Cores', '🎨 Colores', '🎨 Colours'],
  f_none: ['Normal', 'Normal', 'Normal'],
  f_bw: ['Branco e negro', 'Blanco y negro', 'Black & white'],
  f_sepia: ['Sepia', 'Sepia', 'Sepia'],
  f_neg: ['Negativo', 'Negativo', 'Negative'],
  f_comic: ['Cómic', 'Cómic', 'Comic'],

  cardStickers: ['⭐ Adhesivos e texto', '⭐ Pegatinas y texto', '⭐ Stickers and text'],
  textPh: ['Escribe aquí', 'Escribe aquí', 'Type here'],
  addText: ['➕ Poñer texto', '➕ Poner texto', '➕ Add text'],
  itemSize: ['Tamaño', 'Tamaño', 'Size'],
  delItem: ['🗑 Borrar o escollido', '🗑 Borrar lo elegido', '🗑 Delete selected'],
  addSticker: ['Poñer o adhesivo {s}', 'Poner la pegatina {s}', 'Add sticker {s}'],

  cardSound: ['🔊 Son', '🔊 Sonido', '🔊 Sound'],
  recVoice: ['🎤 Gravar a voz', '🎤 Grabar la voz', '🎤 Record your voice'],
  recStop: ['⏹ Parar de gravar', '⏹ Parar de grabar', '⏹ Stop recording'],
  sfxTip: ['Os sons póñense onde está a liña vermella', 'Los sonidos se ponen donde está la línea roja', 'Sounds go where the red line is'],
  delSound: ['🗑 Borrar o son escollido', '🗑 Borrar el sonido elegido', '🗑 Delete selected sound'],
  s_boing: ['Boing', 'Boing', 'Boing'],
  s_pop: ['Pop', 'Pop', 'Pop'],
  s_laser: ['Láser', 'Láser', 'Laser'],
  s_whoosh: ['Fiuuu', 'Fiuuu', 'Whoosh'],
  s_drum: ['Tambor', 'Tambor', 'Drum'],
  s_ding: ['Campá', 'Campana', 'Bell'],
  s_voice: ['Voz', 'Voz', 'Voice'],

  sm_title: ['📸 Stop motion', '📸 Stop motion', '📸 Stop motion'],
  sm_capture: ['📷 Foto!', '📷 ¡Foto!', '📷 Snap!'],
  sm_undo: ['↩ Borrar a última', '↩ Borrar la última', '↩ Delete last'],
  sm_fps: ['Fotos por segundo', 'Fotos por segundo', 'Photos per second'],
  sm_files: ['📁 Escoller fotos do ordenador', '📁 Elegir fotos del ordenador', '📁 Choose photos from the computer'],
  sm_use: ['✅ Usar ({n})', '✅ Usar ({n})', '✅ Use ({n})'],
  sm_name: ['Stop motion', 'Stop motion', 'Stop motion'],

  st_preparing: ['Preparando…', 'Preparando…', 'Getting ready…'],
  st_saving: ['Creando o vídeo… {p} %', 'Creando el vídeo… {p} %', 'Making the video… {p}%'],
  st_done: ['Listo! ({mb} MB)', '¡Listo! ({mb} MB)', 'Done! ({mb} MB)'],
  st_doneMute: ['Listo! ({mb} MB, sen son)', '¡Listo! ({mb} MB, sin sonido)', 'Done! ({mb} MB, no sound)'],
  err_open: ['Este navegador non sabe ler «{name}». Proba con outro ficheiro (MP4 ou WebM).',
    'Este navegador no sabe leer «{name}». Prueba con otro archivo (MP4 o WebM).',
    'This browser cannot read “{name}”. Try another file (MP4 or WebM).'],
  err_decode: ['Este navegador non pode ler «{name}» fotograma a fotograma.',
    'Este navegador no puede leer «{name}» fotograma a fotograma.',
    'This browser cannot read “{name}” frame by frame.'],
  err_encode: ['Este navegador non pode crear vídeos.', 'Este navegador no puede crear vídeos.', 'This browser cannot create videos.'],
  err_save: ['Non se puido crear o vídeo: {msg}', 'No se pudo crear el vídeo: {msg}', 'Could not make the video: {msg}'],
  err_cam: ['Non se pode usar a cámara. Podes escoller fotos do ordenador.',
    'No se puede usar la cámara. Puedes elegir fotos del ordenador.',
    'The camera cannot be used. You can choose photos from the computer.'],
  err_mic: ['Non se pode usar o micrófono.', 'No se puede usar el micrófono.', 'The microphone cannot be used.'],
  err_freeze: ['Non se puido conxelar a imaxe.', 'No se pudo congelar la imagen.', 'Could not freeze the picture.'],

  // Proxectos
  pj_new: ['📄 Novo', '📄 Nuevo', '📄 New'],
  pj_open: ['📂 Abrir', '📂 Abrir', '📂 Open'],
  pj_save: ['💾 Gardar', '💾 Guardar', '💾 Save'],
  pj_saveAs: ['Gardar como…', 'Guardar como…', 'Save as…'],
  pj_area: ['Proxecto', 'Proyecto', 'Project'],
  untitled: ['Sen título', 'Sin título', 'Untitled'],
  pj_unsaved: ['Hai cambios sen gardar', 'Hay cambios sin guardar', 'There are unsaved changes'],
  pj_saving: ['Gardando o proxecto…', 'Guardando el proyecto…', 'Saving the project…'],
  pj_saved: ['✔ Proxecto gardado', '✔ Proyecto guardado', '✔ Project saved'],
  pj_downloaded: ['✔ Proxecto descargado. Búscao no cartafol de descargas.', '✔ Proyecto descargado. Búscalo en la carpeta de descargas.', '✔ Project downloaded. Look for it in your downloads folder.'],
  pj_opening: ['Abrindo o proxecto…', 'Abriendo el proyecto…', 'Opening the project…'],
  pj_opened: ['✔ Aberto: {name}', '✔ Abierto: {name}', '✔ Opened: {name}'],
  pj_gone: ['Ese proxecto xa non está onde estaba. Quitouse da lista.', 'Ese proyecto ya no está donde estaba. Se ha quitado de la lista.', 'That project is no longer where it was. It has been removed from the list.'],
  err_saveProject: ['Non se puido gardar o proxecto. Proba con «Gardar como…».', 'No se pudo guardar el proyecto. Prueba con «Guardar como…».', 'Could not save the project. Try “Save as…”.'],
  err_openProject: ['Non se puido abrir o proxecto.', 'No se pudo abrir el proyecto.', 'Could not open the project.'],
  err_notProject: ['Ese ficheiro non é un proxecto de Cromanenos.', 'Ese archivo no es un proyecto de Cromanenos.', 'That file is not a Cromanenos project.'],
  err_newerProject: ['Ese proxecto fíxose cunha versión máis nova de Cromanenos. Actualiza para abrilo.', 'Ese proyecto se hizo con una versión más nueva de Cromanenos. Actualiza para abrirlo.', 'That project was made with a newer version of Cromanenos. Update to open it.'],
  open_title: ['📂 Abrir un proxecto', '📂 Abrir un proyecto', '📂 Open a project'],
  recent_title: ['Proxectos recentes', 'Proyectos recientes', 'Recent projects'],
  recent_none: ['Aínda non hai proxectos recentes.', 'Todavía no hay proyectos recientes.', 'There are no recent projects yet.'],
  recent_unsupported: ['Este navegador non pode lembrar os proxectos. Búscaos no ordenador.', 'Este navegador no puede recordar los proyectos. Búscalos en el ordenador.', 'This browser cannot remember projects. Look for them on the computer.'],
  pj_browse: ['🔎 Buscar no ordenador…', '🔎 Buscar en el ordenador…', '🔎 Look on the computer…'],
  cf_title: ['Hai cambios sen gardar', 'Hay cambios sin guardar', 'There are unsaved changes'],
  cf_text: ['Queres gardar o proxecto antes de continuar?', '¿Quieres guardar el proyecto antes de continuar?', 'Do you want to save the project before going on?'],
  cf_discard: ['Non gardar', 'No guardar', "Don't save"],

  // Versións
  ver_title: ['Versión', 'Versión', 'Version'],
  ver_line: ['Cromanenos {v}', 'Cromanenos {v}', 'Cromanenos {v}'],
  upd_check: ['🔄 Comprobar se hai versións novas', '🔄 Comprobar si hay versiones nuevas', '🔄 Check for new versions'],
  upd_checking: ['Comprobando…', 'Comprobando…', 'Checking…'],
  upd_latest: ['✔ Tes a última versión.', '✔ Tienes la última versión.', '✔ You have the latest version.'],
  upd_new: ['Hai unha versión nova: {v}', 'Hay una versión nueva: {v}', 'There is a new version: {v}'],
  upd_apply: ['⬇ Descargar e actualizar', '⬇ Descargar y actualizar', '⬇ Download and update'],
  upd_applying: ['Descargando a versión nova…', 'Descargando la versión nueva…', 'Downloading the new version…'],
  upd_done: ['✔ Lista! Pecha Cromanenos e volve abrilo.', '✔ ¡Lista! Cierra Cromanenos y vuelve a abrirlo.', '✔ Ready! Close Cromanenos and open it again.'],
  upd_fail: ['Agora non se puido comprobar. Proba máis tarde.', 'Ahora no se ha podido comprobar. Prueba más tarde.', 'It could not be checked right now. Try again later.'],
  upd_failApply: ['Agora non se puido descargar. Proba máis tarde.', 'Ahora no se ha podido descargar. Prueba más tarde.', 'It could not be downloaded right now. Try again later.'],
  upd_link: ['Descargala á man desde a páxina de versións', 'Descargarla a mano desde la página de versiones', 'Download it by hand from the releases page'],
  upd_ready: ['✨ Hai unha versión nova ({v}) lista. Usarase a próxima vez que abras Cromanenos.', '✨ Hay una versión nueva ({v}) lista. Se usará la próxima vez que abras Cromanenos.', '✨ A new version ({v}) is ready. It will be used the next time you open Cromanenos.'],

  // Desfacer, recortar, exemplos, cámara e recuperación
  undo: ['↩ Desfacer', '↩ Deshacer', '↩ Undo'],
  redo: ['↪ Refacer', '↪ Rehacer', '↪ Redo'],
  undoTip: ['Desfacer o último cambio (Ctrl+Z)', 'Deshacer el último cambio (Ctrl+Z)', 'Undo the last change (Ctrl+Z)'],
  redoTip: ['Volver facer o que desfixeches (Ctrl+Y)', 'Volver a hacer lo que deshiciste (Ctrl+Y)', 'Redo what you undid (Ctrl+Y)'],
  fx_mute: ['Sen son', 'Sin sonido', 'No sound'],
  muteInfo: ['Este anaco non soa. Vai ben para poñerlle a túa voz ou outros sons.', 'Este trozo no suena. Va bien para ponerle tu voz u otros sonidos.', 'This clip is silent. Handy for adding your voice or other sounds.'],
  dragHint: ['Arrastra un anaco para cambialo de sitio. Tira dos seus bordos para recortalo.', 'Arrastra un trozo para cambiarlo de sitio. Tira de sus bordes para recortarlo.', 'Drag a clip to move it. Pull its edges to trim it.'],
  addCam: ['Gravar coa cámara', 'Grabar con la cámara', 'Record with the camera'],
  cam_title: ['🎥 Gravar coa cámara', '🎥 Grabar con la cámara', '🎥 Record with the camera'],
  cam_rec: ['⏺ Gravar', '⏺ Grabar', '⏺ Record'],
  cam_stop: ['⏹ Parar', '⏹ Parar', '⏹ Stop'],
  cam_use: ['✅ Usar', '✅ Usar', '✅ Use'],
  cam_retry: ['🔁 Repetir', '🔁 Repetir', '🔁 Again'],
  cam_busy: ['Preparando a gravación…', 'Preparando la grabación…', 'Getting the recording ready…'],
  cam_name: ['Gravación', 'Grabación', 'Recording'],
  err_camRec: ['Non se pode usar a cámara. Podes engadir un vídeo co botón ➕.', 'No se puede usar la cámara. Puedes añadir un vídeo con el botón ➕.', 'The camera cannot be used. You can add a video with the ➕ button.'],
  err_camSave: ['Non se puido gardar a gravación. Proba outra vez.', 'No se pudo guardar la grabación. Prueba otra vez.', 'The recording could not be saved. Try again.'],
  err_hevc: ['«{name}» está gravado nun formato (HEVC) que este navegador non sabe ler. No móbil, entra nos axustes da cámara, escolle o formato «máis compatible» (H.264) e grávao de novo.',
    '«{name}» está grabado en un formato (HEVC) que este navegador no sabe leer. En el móvil, entra en los ajustes de la cámara, elige el formato «más compatible» (H.264) y grábalo de nuevo.',
    '“{name}” was filmed in a format (HEVC) that this browser cannot read. On the phone, open the camera settings, choose the “most compatible” format (H.264) and film it again.'],
  ex_try: ['▶ Probar cun exemplo', '▶ Probar con un ejemplo', '▶ Try with an example'],
  ex_loaded: ['✨ Este é o exemplo. Preme ▶ Ver e mira os efectos que ten cada anaco.', '✨ Este es el ejemplo. Pulsa ▶ Ver y mira los efectos que tiene cada trozo.', '✨ This is the example. Press ▶ Play and look at the effects on each clip.'],
  ex_fail: ['Agora non se puido cargar o exemplo.', 'Ahora no se ha podido cargar el ejemplo.', 'The example could not be loaded right now.'],
  rc_title: ['Seguir onde o deixaches?', '¿Seguir donde lo dejaste?', 'Carry on where you left off?'],
  rc_text: ['A última vez quedou un traballo sen gardar: «{name}».', 'La última vez quedó un trabajo sin guardar: «{name}».', 'Last time some work was left unsaved: “{name}”.'],
  rc_yes: ['✅ Si, seguir', '✅ Sí, seguir', '✅ Yes, carry on'],
  rc_no: ['Non, empezar de novo', 'No, empezar de nuevo', 'No, start again'],
  rc_done: ['✔ Aquí o tes, tal como o deixaches. Lembra gardalo.', '✔ Aquí lo tienes, tal como lo dejaste. Recuerda guardarlo.', '✔ Here it is, just as you left it. Remember to save it.'],
  rc_fail: ['Non se puido recuperar o traballo anterior.', 'No se pudo recuperar el trabajo anterior.', 'The earlier work could not be recovered.'],

  resize: ['Arrastra para cambiar o tamaño do vídeo (ou usa as frechas)', 'Arrastra para cambiar el tamaño del vídeo (o usa las flechas)', 'Drag to resize the video (or use the arrow keys)'],
  noticeClose: ['Pechar o aviso', 'Cerrar el aviso', 'Close the notice'],
};

// Receitas paso a paso. Cada texto: [galego, castelán, inglés].
const TRICKS = [
  {
    title: ['🧦 A man invisible (co calcetín verde)', '🧦 La mano invisible (con el calcetín verde)', '🧦 The invisible hand (with a green sock)'],
    steps: [
      ['Pon a cámara nun trípode ou ben apoiada, para que non se mova nada.', 'Pon la cámara en un trípode o bien apoyada, para que no se mueva nada.', 'Put the camera on a tripod or rest it somewhere so it does not move at all.'],
      ['Grava o sitio baleiro, sen ninguén (tamén vale unha foto).', 'Graba el sitio vacío, sin nadie (también vale una foto).', 'Film the empty place, with nobody in it (a photo works too).'],
      ['Sen mover a cámara, grava a escena co calcetín verde posto na man.', 'Sin mover la cámara, graba la escena con el calcetín verde puesto en la mano.', 'Without moving the camera, film the scene wearing the green sock on your hand.'],
      ['Preme ➕ en «Fondo» e escolle o sitio baleiro.', 'Pulsa ➕ en «Fondo» y elige el sitio vacío.', 'Press ➕ on “Background” and choose the empty place.'],
      ['Preme ➕ en «Enriba» e escolle a toma do calcetín.', 'Pulsa ➕ en «Encima» y elige la toma del calcetín.', 'Press ➕ on “On top” and choose the take with the sock.'],
      ['Toca ese anaco na liña de tempo e, en Efectos, preme 🟩 Croma.', 'Toca ese trozo en la línea de tiempo y, en Efectos, pulsa 🟩 Croma.', 'Tap that clip on the timeline and, in Effects, press 🟩 Green screen.'],
      ['Preme 🎯 e toca o calcetín no vídeo. A man desaparece!', 'Pulsa 🎯 y toca el calcetín en el vídeo. ¡La mano desaparece!', 'Press 🎯 and tap the sock in the video. The hand vanishes!'],
      ['Se aínda se ve algo verde, sobe «Canto borra».', 'Si aún se ve algo verde, sube «Cuánto borra».', 'If you can still see some green, turn up “How much it erases”.'],
    ],
  },
  {
    title: ['👯 Clónate: fala contigo mesmo', '👯 Clónate: habla contigo mismo', '👯 Clone yourself: talk to yourself'],
    steps: [
      ['Pon a cámara fixa, sen movela entre toma e toma.', 'Pon la cámara fija, sin moverla entre toma y toma.', 'Keep the camera still; do not move it between takes.'],
      ['Grava a primeira toma colocándote na metade esquerda da imaxe.', 'Graba la primera toma colocándote en la mitad izquierda de la imagen.', 'Film the first take standing in the left half of the picture.'],
      ['Grava a segunda toma colocándote na metade dereita.', 'Graba la segunda toma colocándote en la mitad derecha.', 'Film the second take standing in the right half.'],
      ['Pon a primeira toma en «Fondo» e a segunda en «Enriba».', 'Pon la primera toma en «Fondo» y la segunda en «Encima».', 'Put the first take on “Background” and the second on “On top”.'],
      ['Toca o anaco de «Enriba» e, en Efectos, preme 👯 Pantalla dividida.', 'Toca el trozo de «Encima» y, en Efectos, pulsa 👯 Pantalla dividida.', 'Tap the clip on “On top” and, in Effects, press 👯 Split screen.'],
      ['Move a liña ata que non se note a unión.', 'Mueve la línea hasta que no se note la unión.', 'Move the line until you cannot see the join.'],
    ],
  },
  {
    title: ['✨ Aparecer e desaparecer', '✨ Aparecer y desaparecer', '✨ Appear and vanish'],
    steps: [
      ['Pon a cámara fixa.', 'Pon la cámara fija.', 'Keep the camera still.'],
      ['Grava unha toma coa persoa ou o obxecto.', 'Graba una toma con la persona o el objeto.', 'Film one take with the person or the object.'],
      ['Sen mover a cámara, grava outra toma sen el.', 'Sin mover la cámara, graba otra toma sin él.', 'Without moving the camera, film another take without it.'],
      ['Pon as dúas tomas seguidas na mesma pista.', 'Pon las dos tomas seguidas en la misma pista.', 'Put the two takes one after the other on the same track.'],
      ['Se sobra algo dunha toma, tira do bordo do anaco para recortalo.', 'Si sobra algo de una toma, tira del borde del trozo para recortarlo.', 'If a take is too long, pull the edge of the clip to trim it.'],
    ],
  },
  {
    title: ['🔍 Xigantes e miniaturas', '🔍 Gigantes y miniaturas', '🔍 Giants and miniatures'],
    steps: [
      ['Grava alguén diante dunha tea ou dunha parede verde.', 'Graba a alguien delante de una tela o una pared verde.', 'Film someone in front of a green cloth or wall.'],
      ['Pon unha paisaxe en «Fondo» e a toma verde en «Enriba».', 'Pon un paisaje en «Fondo» y la toma verde en «Encima».', 'Put a landscape on “Background” and the green take on “On top”.'],
      ['Toca o anaco de «Enriba», preme 🟩 Croma e, con 🎯, toca o verde.', 'Toca el trozo de «Encima», pulsa 🟩 Croma y, con 🎯, toca el verde.', 'Tap the clip on “On top”, press 🟩 Green screen and, with 🎯, tap the green.'],
      ['Preme 🔍 Tamaño e faino moi grande ou moi pequeno.', 'Pulsa 🔍 Tamaño y hazlo muy grande o muy pequeño.', 'Press 🔍 Size and make it very big or very small.'],
      ['Arrastra a imaxe para colocalo onde queiras.', 'Arrastra la imagen para colocarlo donde quieras.', 'Drag the picture to put it wherever you like.'],
    ],
  },
  {
    title: ['👻 Pantasma', '👻 Fantasma', '👻 Ghost'],
    steps: [
      ['Coa cámara fixa, grava o sitio baleiro e pono en «Fondo».', 'Con la cámara fija, graba el sitio vacío y ponlo en «Fondo».', 'With the camera still, film the empty place and put it on “Background”.'],
      ['Sen mover a cámara, grava a persoa que fai de pantasma e pona en «Enriba».', 'Sin mover la cámara, graba a la persona que hace de fantasma y ponla en «Encima».', 'Without moving the camera, film the person playing the ghost and put it on “On top”.'],
      ['Toca ese anaco e, en Efectos, preme 👻 Pantasma.', 'Toca ese trozo y, en Efectos, pulsa 👻 Fantasma.', 'Tap that clip and, in Effects, press 👻 Ghost.'],
      ['Baixa «Canto se ve» ata que se vexa a través del.', 'Baja «Cuánto se ve» hasta que se vea a través de él.', 'Turn down “How visible” until you can see through it.'],
    ],
  },
];

const ORDER = ['gl', 'es', 'en'];
let lang = 'gl';
const listeners = [];

try {
  const saved = localStorage.getItem('cromanenos.lang');
  if (saved && LANGS[saved]) lang = saved;
} catch { /* sen almacenamento: quédase en galego */ }

export const getLang = () => lang;

export function t(key, vars) {
  const row = D[key];
  let s = row ? row[ORDER.indexOf(lang)] : key;
  if (vars) for (const [k, v] of Object.entries(vars)) s = s.replaceAll(`{${k}}`, v);
  return s;
}

export function tricks() {
  const i = ORDER.indexOf(lang);
  return TRICKS.map((r) => ({ title: r.title[i], steps: r.steps.map((s) => s[i]) }));
}

// Erro cunha mensaxe traducible.
export function tErr(key, vars) {
  return Object.assign(new Error(key), { i18n: [key, vars] });
}

export function applyI18n(root = document) {
  document.documentElement.lang = lang;
  root.querySelectorAll('[data-i18n]').forEach((el) => { el.textContent = t(el.dataset.i18n); });
  root.querySelectorAll('[data-i18n-title]').forEach((el) => { el.title = t(el.dataset.i18nTitle); });
  root.querySelectorAll('[data-i18n-aria]').forEach((el) => { el.setAttribute('aria-label', t(el.dataset.i18nAria)); });
  root.querySelectorAll('[data-i18n-ph]').forEach((el) => { el.placeholder = t(el.dataset.i18nPh); });
}

export function onLangChange(fn) { listeners.push(fn); }

export function setLang(l) {
  if (!LANGS[l]) return;
  lang = l;
  try { localStorage.setItem('cromanenos.lang', l); } catch { /* ignórase */ }
  applyI18n();
  listeners.forEach((fn) => fn());
}
