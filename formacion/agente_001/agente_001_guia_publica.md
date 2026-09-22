# Construye un agente de oportunidades comerciales

Esta guía te permite crear, probar y programar un agente que observa noticias públicas y las transforma en señales de negocio para una cooperativa. El resultado es una base de datos en Excel y un dashboard HTML que siempre parten de la misma evidencia.

El ejercicio utiliza una cooperativa ficticia ubicada en Nayón, Quito. Cambia el nombre, territorio, segmentos y productos por los de tu institución. Las oportunidades que produce el agente son hipótesis para revisión humana; no son decisiones de crédito, inversión ni contacto comercial.

## Qué vas a construir

```text
agente_001/
├── AGENTS.md
├── PERFIL.md
├── FLUJO_AGENTE.md
├── 01_entrada_noticias/noticias.json
├── 02_base_de_datos/base_agente_001.json
├── 02_base_de_datos/generar_agente_001.py
├── 03_dashboard/agente_001.xlsx
├── 03_dashboard/index.html
├── 04_reportes/
└── 05_respaldo/
```

La carpeta `03_dashboard` será el paquete visible para compartir: contendrá juntos el dashboard y el libro de Excel. La carpeta `02_base_de_datos` conservará la base estructurada y el generador que mantiene sincronizados ambos archivos. El archivo Python se conserva porque permite repetir el proceso; su función debe quedar explicada en `FLUJO_AGENTE.md`.

El demo reúne 24 fichas de noticias públicas recolectadas durante una ventana de 30 días, desde finales de agosto hasta el 21 de septiembre de 2026. Conserva fuentes, fechas, hechos y limitaciones. Algunas fuentes describen un mismo acontecimiento y se agruparán mediante `id_evento`; no se contarán dos veces como señal.

Para mantener el ejercicio dentro del tiempo del taller, las 24 fichas se conservan como evidencia, pero el dashboard en vivo trabajará como máximo con ocho señales prioritarias y cinco oportunidades. La ampliación completa se puede ejecutar después.

## Antes de comenzar

1. Crea una carpeta llamada `agente_001` en tu computador.
2. En la aplicación de escritorio de ChatGPT crea un proyecto local y selecciona esa carpeta. También puedes trabajar en un proyecto en la nube si subes allí los archivos; en ese caso el agente no escribirá directamente en una carpeta de tu computador.
3. Ten a mano el Prompt 2 de esta guía: contiene las noticias del demo y se pegará directamente en la conversación.
4. No cargues nombres de clientes, identificaciones, cuentas, saldos, solicitudes, contratos ni otra información confidencial.

## Configuración recomendada del modelo

Para construir el demo utiliza **GPT-5.6 Terra**, con **esfuerzo medio** y modo estándar. Ofrece un buen equilibrio para leer las fichas, crear los archivos relacionados y validar el resultado dentro del tiempo del taller.

Usa **GPT-5.6 Sol con esfuerzo medio** si Terra encuentra un error difícil o si quieres hacer una revisión adicional. Cuando el flujo ya esté probado, las ejecuciones rutinarias pueden hacerse con **GPT-5.6 Luna con esfuerzo bajo**. Reserva Astra para una revisión profunda o una versión de producción más compleja.

No uses `high`, `xhigh` o `max` durante la demostración: pueden mejorar tareas muy complejas, pero aumentan el tiempo y el consumo sin ser necesarios para este caso. La documentación de OpenAI sitúa el esfuerzo bajo en flujos con herramientas y búsqueda, y el medio en trabajos con hojas de cálculo, planificación y tareas agenticas. [Guía oficial de modelos y razonamiento](https://developers.openai.com/api/docs/guides/reasoning).

## Cómo combinar modelos durante el taller

La elección depende de la parte del viaje. No hace falta utilizar el mismo modelo para todo el recorrido, siempre que el espacio de trabajo permita cambiarlo dentro del mismo proyecto.

| Modelo | Papel en este demo | Esfuerzo sugerido | Ventaja | Límite práctico |
|---|---|---:|---|---|
| **GPT-5.6 Luna** | Preparar y normalizar las noticias; repetir una ejecución ya probada | Bajo | Muy rápido y económico para tareas estructuradas | Tiene menos margen para resolver ambigüedades al crear varios archivos relacionados |
| **GPT-5.6 Terra** | Construir la base, el libro y el dashboard sencillo | Medio | Buen equilibrio entre velocidad, calidad y coste | Puede necesitar una instrucción adicional si el proyecto se vuelve más complejo |
| **GPT-5.6 Sol** | Resolver un fallo o revisar una parte compleja | Medio | Más capacidad para planificación y validación multietapa | Puede tardar más de lo necesario para una primera demostración |
| **GPT-6 Astra** | Nave nodriza: rescate, revisión profunda o versión de producción | Bajo o medio | Máxima capacidad para flujos largos y herramientas | Es excesiva para el demo corto y puede aumentar tiempo y consumo |

### Combinación recomendada

1. **Paso 1 y Paso 2:** Luna, esfuerzo bajo, para crear la estructura y convertir el bloque de noticias en registros.
2. **Paso 3:** Terra, esfuerzo medio, para construir la base, el libro y el dashboard.
3. **Paso 4:** Luna, esfuerzo bajo, para probar ejecuciones repetidas sin novedades.
4. **Comparación opcional:** antes del Paso 4, cambia a Sol con esfuerzo medio y repite el mismo flujo para comprobar resultados y detectar posibles mejoras.
5. **Si aparece un fallo:** Sol, esfuerzo medio. Usa Astra solo si el problema exige una revisión profunda o si quieres mostrar la nave nodriza como una capacidad futura.

La documentación oficial presenta Astra como el modelo de mayor capacidad para trabajos de razonamiento y a Luna como la opción de menor coste y latencia. Para este taller, la combinación muestra una idea central: elegir el vehículo según el trayecto, en lugar de usar la nave más grande para ir a comprar el pan. [Guía oficial de modelos y razonamiento](https://developers.openai.com/api/docs/guides/reasoning).

## Paso 1 — Crear el proyecto y sus reglas

Copia este prompt completo en el proyecto:

```text
Vamos a construir un agente de oportunidades comerciales para una cooperativa ficticia. Trabaja únicamente dentro de la carpeta actual y no busques noticias todavía.

PERFIL DEL EJEMPLO
Nombre: Cooperativa Andina de Ahorro y Crédito.
Ubicación: Nayón, Quito, Ecuador.
Segmentos: familias, comercios, viveros y empresas de servicios.
Productos: ahorro, depósitos a plazo, microcrédito y crédito productivo.
Objetivo: observar señales públicas del entorno y proponer conversaciones comerciales para revisión humana.
Zona horaria: America/Guayaquil.

Crea las carpetas 01_entrada_noticias, 02_base_de_datos, 03_dashboard, 04_reportes y 05_respaldo. Crea PERFIL.md con el perfil anterior. Crea AGENTS.md con estas reglas: distingue HECHO, INFERENCIA e HIPÓTESIS COMERCIAL; conserva entidad, URL, fecha de publicación, fecha del hecho y fecha de captura; no inventes cifras, fuentes ni intención de compra; no uses datos personales o confidenciales; no decidas créditos, inversiones ni condiciones financieras; no contactes personas ni publiques información; conserva responsable, estado, fecha objetivo, notas y resultado cuando ya existan; guarda una copia en 05_respaldo antes de modificar el libro; deduplica por URL normalizada y por acontecimiento; y registra limitaciones y fallos.

Crea FLUJO_AGENTE.md con este proceso: leer el perfil y las reglas, recibir noticias, conservar la evidencia, generar señales, proponer oportunidades, actualizar el libro y el dashboard, guardar respaldo y solicitar validación humana. No crees todavía el libro ni el dashboard. Muéstrame la lista de archivos creados y espera el siguiente paso.
```

Comprueba que existan las cinco carpetas y los archivos `PERFIL.md`, `AGENTS.md` y `FLUJO_AGENTE.md`.

## Paso 2 — Incorporar las noticias del demo

El siguiente prompt contiene las 24 fichas de noticias recolectadas durante una ventana de 30 días. Puedes copiar y pegar todo en una sola operación. Algunas fichas confirman un mismo acontecimiento; el agente conservará las fuentes y las agrupará mediante `id_evento`.

```text
Lee AGENTS.md y PERFIL.md. Usa exclusivamente los registros incluidos abajo como entrada de este demo; no hagas una búsqueda nueva en internet.

Convierte los registros en 01_entrada_noticias/noticias.json. Para cada uno conserva id_noticia, id_evento, nivel_evidencia, categoria, titulo, entidad, url, fecha_publicacion, fecha_hecho si existe, periodo_dato, territorio, sector, hecho_comprobado y limitaciones. Usa fechas ISO AAAA-MM-DD. Si un campo no aparece, déjalo vacío y anótalo como limitación. No cambies hechos, cifras ni URLs. Si varias fuentes describen el mismo acontecimiento, conserva las fuentes pero usa el mismo id_evento.

VENTANA DE RECOLECCIÓN
Periodo revisado: 2026-08-23 a 2026-09-21.
Criterio: noticias públicas relacionadas con tasas, liquidez, actividad económica, cooperativas, clima, energía, geopolítica, movilidad, comercio y hogares en Ecuador, Quito y Pichincha.

REGISTROS DEL DEMO

N001 | evento-n001 | Actividad local | Ferias y comercio ordenado dinamizan la economía de Quito durante los fines de semana | Quito Informa | 2026-08-29 | https://quitoinforma.quito.gob.ec/2026/08/29/ferias-y-comercio-ordenado-dinamizan-la-economia-de-quito-durante-los-fines-de-semana/ | El Municipio informó que las ferias de emprendimientos se despliegan semanalmente en sectores urbanos y rurales para ampliar ventas y públicos de comerciantes autónomos. | Quito | Comercio y economía popular | Confianza registrada: 5/5. Requiere validación antes de una acción comercial.
N002 | evento-tasas-interes-septiembre-2026 | Tasas | Tasas de interés efectivas vigentes para septiembre de 2026 | Banco Central del Ecuador | 2026-08-31 | https://www.bce.fin.ec/junta-de-politica-y-regulacion-financiera-y-monetaria/tasas-de-interes/ | El BCE reporta para septiembre de 2026 una tasa activa referencial de 7,03% y una tasa pasiva referencial de 4,99%. | Ecuador | Servicios financieros | Confianza registrada: 5/5. Requiere validación antes de una acción comercial.
N003 | evento-n003 | Actividad local | Veinte emprendimientos participaron en la feria Emprende Trole | Quito Informa | 2026-09-01 | https://quitoinforma.quito.gob.ec/2026/09/01/la-feria-emprende-trole-llega-a-la-estacion-rio-coca/ | La feria reunió 20 emprendimientos y se ubicó en una estación con cerca de 20.000 usuarios diarios, con oferta de artesanías, textiles, alimentos y papelería. | Quito - Río Coca | Comercio y emprendimiento | Confianza registrada: 5/5. Requiere validación antes de una acción comercial.
N004 | evento-capacitacion-finanzas-verdes-cooperativas-2026-09-02 | Finanzas verdes | Más de 700 funcionarios fortalecieron capacidades en finanzas verdes y riesgos ambientales | SEPS | 2026-09-02 | https://www.seps.gob.ec/2026/09/ | La SEPS informó que más de 700 funcionarios de cooperativas y mutualistas participaron en formación sobre finanzas verdes, cambio climático y gestión de riesgos ambientales y sociales. | Ecuador | Cooperativas | Confianza registrada: 5/5. Requiere validación antes de una acción comercial.
N005 | evento-n005 | Turismo | La Ruta Basílica incorpora nueve negocios y emprendimientos | Quito Informa | 2026-09-03 | https://quitoinforma.quito.gob.ec/2026/09/03/la-ruta-basilica-se-suma-a-las-rutas-de-la-ciudad-para-impulsar-el-turismo-y-la-economia-local/ | Nueve negocios se incorporaron al lanzamiento de la Ruta Basílica, con oferta gastronómica, café, chocolate, heladería y productos artesanales. | Quito - Centro Histórico | Turismo, gastronomía y comercio | Confianza registrada: 5/5. Requiere validación antes de una acción comercial.
N006 | evento-expectativas-sectoriales-julio-2026 | Confianza empresarial | Las expectativas empresariales aumentaron en julio | Banco Central del Ecuador | 2026-09-04 | https://www.bce.fin.ec/expectativas-empresariales-aumentaron-en-julio-y-todos-los-sectores-se-ubicaron-en-zona-de-mayor-confianza/ | El Índice de Expectativas de la Economía llegó a 56,2 puntos, 3,0 puntos más que en junio. Servicios marcó 60; comercio 53,7; construcción 53,1; manufactura 51,8. | Ecuador | Empresas | Confianza registrada: 5/5. Requiere validación antes de una acción comercial.
N007 | evento-n007 | Energía | Reporte petrolero de julio de 2026 | Banco Central del Ecuador | 2026-09-08 | https://contenido.bce.fin.ec/ultimas-publicaciones/ | El BCE publicó las cifras petroleras de julio de 2026. El boletín de comercio exterior sitúa el precio promedio del crudo exportado en USD 74,6 por barril en julio. | Ecuador | Petróleo y energía | Confianza registrada: 5/5. Requiere validación antes de una acción comercial.
N008 | evento-n008 | Comunidad | Servicios municipales de salud llegaron a 28 puntos de Quito | Quito Informa | 2026-09-08 | https://quitoinforma.quito.gob.ec/2026/09/08/hasta-el-13-de-septiembre-quito-tendra-ferias-caravanas-y-atencion-en-salud-oral-en-28-puntos-de-la-ciudad/ | El Municipio anunció servicios gratuitos en 28 puntos y reportó 11.204 participantes en 146 Caravanas Salud Mujer durante 2026. | Quito | Salud y hogares | Confianza registrada: 5/5. Requiere validación antes de una acción comercial.
N009 | evento-n009 | Clima | El Niño se fortalece y supera 90% de probabilidad de evento muy fuerte | NOAA Climate Prediction Center | 2026-09-10 | https://www.cpc.ncep.noaa.gov/products/analysis_monitoring/enso_advisory/ensodisc_Sp.shtml | NOAA declaró advertencia de El Niño y estimó una probabilidad superior al 90% de un evento muy fuerte durante el otoño e invierno 2026-27 del hemisferio norte. | Pacífico ecuatorial y Ecuador | Agricultura, comercio e infraestructura | Confianza registrada: 5/5. Requiere validación antes de una acción comercial.
N010 | evento-n010 | Liquidez | Reservas internacionales cerraron agosto en USD 12.067,5 millones | Banco Central del Ecuador | 2026-09-10 | https://contenido.bce.fin.ec/documentos/Estadisticas/SectorMonFin/RILD/RMRI_0826.html | Las reservas internacionales aumentaron USD 721,9 millones en agosto hasta USD 12.067,5 millones. Los ingresos del mes fueron USD 5.732,1 millones. | Ecuador | Macroeconomía y dolarización | Confianza registrada: 5/5. Requiere validación antes de una acción comercial.
N011 | evento-n011 | Comercio exterior | Ecuador registró superávit comercial de USD 2.843,1 millones | Banco Central del Ecuador | 2026-09-11 | https://www.bce.fin.ec/las-exportaciones-impulsaron-un-superavit-comercial-de-usd-2-8431-millones-entre-enero-y-julio-de-2026/ | Entre enero y julio las exportaciones sumaron USD 23.289 millones, 9,3% más interanual. Camarón creció 17,6%, minería 43,5%, banano 7,5% y cacao cayó 54,6%. | Ecuador | Exportaciones y cadenas productivas | Confianza registrada: 5/5. Requiere validación antes de una acción comercial.
N012 | evento-n012 | Inflación | Inflación de agosto: 0,04% mensual y 1,12% anual | INEC | 2026-09-14 | https://www.ecuadorencifras.gob.ec/inec-publica-las-cifras-de-inflacion-de-agosto-2026/ | El IPC registró 0,04% mensual y 1,12% anual en agosto. La canasta familiar básica se ubicó en USD 828,06. | Ecuador | Hogares y consumo | Confianza registrada: 5/5. Requiere validación antes de una acción comercial.
N013 | evento-n013 | Geopolítica | El petróleo subió por ataques a infraestructura energética en Oriente Medio | Reuters | 2026-09-14 | https://www.marketscreener.com/news/oil-prices-jump-more-than-3-after-new-strikes-on-saudi-strait-of-hormuz-ce785bdcd981f025 | Reuters reportó que el WTI subió 4,2% a USD 104,26 por barril tras ataques a infraestructura energética y buques en Oriente Medio. | Global y Ecuador | Energía, transporte y comercio | Confianza registrada: 4/5. Requiere validación antes de una acción comercial.
N014 | evento-n014 | Crecimiento | El BCE elevó a 2,7% la previsión de crecimiento para 2026 | Banco Central del Ecuador | 2026-09-15 | https://www.bce.fin.ec/el-bce-eleva-a-27-la-prevision-de-crecimiento-economico-de-ecuador-para-2026/ | El BCE revisó el crecimiento de 2026 de 2,5% a 2,7%. Estimó que un El Niño moderado podría restar 0,5 puntos al crecimiento de 2027 y uno fuerte 1,4 puntos. | Ecuador | Macroeconomía | Confianza registrada: 5/5. Requiere validación antes de una acción comercial.
N015 | evento-n015 | Sector financiero | SEPS publicó estados financieros de agosto del sector cooperativo | SEPS | 2026-09-15 | https://estadisticas.seps.gob.ec/index.php/estadisticas-sfps/ | La publicación mensual contiene estados financieros e indicadores de segmentos 1, 2 y 3, mutualistas, FINANCOOP y CONAFIPS con corte a agosto de 2026. | Ecuador | Cooperativas | Confianza registrada: 5/5. Requiere validación antes de una acción comercial.
N016 | evento-n016 | Tasas | La Reserva Federal elevó su rango objetivo a 3,75%-4,00% | Federal Reserve | 2026-09-16 | https://www.federalreserve.gov/newsevents/pressreleases/monetary20260916a.htm | El FOMC elevó en 25 puntos básicos el rango objetivo de la tasa de fondos federales a 3,75%-4,00%, señalando inflación todavía elevada e incertidumbre geopolítica. | Estados Unidos y economías dolarizadas | Tasas y liquidez | Confianza registrada: 5/5. Requiere validación antes de una acción comercial.
N017 | evento-n017 | Inclusión financiera | El 81,5% de participantes en ferias de agosto fueron mujeres | Quito Informa | 2026-09-16 | https://quitoinforma.quito.gob.ec/2026/09/16/trabajo-oportunidad-y-autonomia-815-de-las-ferias-de-quito-son-lideradas-por-mujeres/ | Tres ferias reunieron 72 comerciantes; 81,5% fueron mujeres y más de 90% jefas o jefes de hogar, según el Municipio. | Quito | Comercio autónomo | Confianza registrada: 5/5. Requiere validación antes de una acción comercial.
N018 | evento-incendios-quito-temporada-seca-2026 | Riesgo climático y continuidad operativa | Bomberos continúan trabajos para controlar el fuego en el cerro Casitagua | Quito Informa | 2026-09-18 | https://quitoinforma.quito.gob.ec/2026/09/18/bomberos-continuan-trabajos-para-controlar-el-fuego-en-el-cerro-casitagua/ | Quito Informa reportó que el incendio forestal del cerro Casitagua continuaba activo y que aproximadamente 100 hectáreas habían sido afectadas. Los equipos trabajaban por tierra y aire para contener dos líneas activas en una zona de difícil acceso. | Quito - Pomasqui | Agricultura, hogares, comercio e infraestructura | Confianza registrada: 5/5. Requiere validación antes de una acción comercial.
noticia-bce-tasas-2026-09 | evento-tasas-interes-septiembre-2026 | tasas de interés | Tasas de interés activas y pasivas de septiembre de 2026 | Banco Central del Ecuador | 2026-08-31 | https://contenido.bce.fin.ec/documentos/Estadisticas/SectorMonFin/TasasInteres/Indice.htm | La página técnica del BCE muestra para septiembre de 2026 tasas activas máximas de 28,23% para microcrédito minorista, 24,89% para microcrédito de acumulación simple y 22,05% para microcrédito de acumulación ampliada. También muestra una tasa pasiva referencial de 4,99% y una tasa referencial para depósitos a plazo de 4,99%. | Ecuador | microcrédito, crédito productivo, ahorro y depósitos a plazo | La página técnica no muestra una fecha de publicación en su cuerpo; el índice oficial de publicaciones del BCE lista Tasas de Interés Efectivas. Septiembre 2026 el 31 de agosto de 2026.; No se establece una fecha puntual del hecho porque el dato corresponde a un mes de vigencia.; Las tasas son referencias o máximos nacionales; no son condiciones aprobadas para Cooperativa Andina ni implican una decisión de crédito.
noticia-remesas-proyeccion-2026-09-21 | evento-proyeccion-remesas-ecuador-2026 | remesas y actividad económica | Remesas récord para 2026: Banco Central proyecta unos 8.020 millones de dólares | El Universo, Redacción; proyección atribuida al Banco Central del Ecuador | 2026-09-21 | https://www.eluniverso.com/noticias/economia/remesas-proyecciones-analisis-expertos-cierre-record-2026-banco-central-ecuador-2026-nota/?outputType=amp | El Universo informó que la programación macroeconómica del BCE proyecta ingresos por remesas de 8.020 millones de dólares en 2026, frente a 7.729 millones recibidos en 2025. La nota también reportó 1.856,7 millones recibidos en el primer trimestre de 2026, un 7,7% más que en el mismo período de 2025. | Ecuador; Pichincha aparece como territorio de relevancia en la distribución nacional | hogares, ahorro, microcrédito y crédito productivo | La cifra de 8.020 millones es una proyección, no un flujo realizado.; La fuente es un medio de comunicación que atribuye la proyección al BCE; debe contrastarse con el documento primario cuando esté disponible.; No hay desglose para Nayón ni evidencia de que una persona receptora tenga intención de ahorrar o invertir.
noticia-incendios-quito-2026-09-21 | evento-incendios-quito-temporada-seca-2026 | clima y fenómenos naturales | Incendios forestales en Quito aumentaron más de 700% entre los veranos de 2025 y 2026 | Primicias, Redacción; datos atribuidos al Cuerpo de Bomberos de Quito, INAMHI y Municipio de Quito | 2026-09-21 | https://www.primicias.ec/quito/incendio-forestal-casitagua-pusuqui-pabel-munoz-133096/ | Primicias reportó, con datos del Cuerpo de Bomberos de Quito, 217 incendios que dañaron 1.648 hectáreas entre el 1 de julio y el 21 de septiembre de 2026. La nota señaló como factores indicados por INAMHI y el Municipio las mayores temperaturas, los vientos fuertes y la ausencia de lluvias. | Quito, incluidos Casitagua, Pusuquí y La Vicentina | riesgo climático y continuidad territorial; familias, comercios, viveros y empresas de servicios como segmentos a revisar | La fuente consultada es periodística y no se abrió en esta ejecución el registro primario del Cuerpo de Bomberos o del INAMHI.; No existe en la fuente un desglose específico para Nayón ni una cuantificación de daños financieros a los segmentos del perfil.; La exposición de cada familia, comercio, vivero o empresa de servicios debe verificarse individualmente por una persona autorizada.
noticia-cortes-coca-codo-quito-2026-09-14 | evento-reduccion-coca-codo-sedimentos-2026-09-14 | energía | Coca Codo Sinclair redujo su generación por aumento de sedimentos; se registraron cortes de luz en Quito | Primicias, Redacción; información atribuida a CENACE | 2026-09-14 | https://www.primicias.ec/economia/cortes-luz-quito-coca-codo-sinclair-salida-operacion-temporal-sedimentos-132563/ | Primicias informó que el aumento extraordinario de sedimentos en la central Coca Codo Sinclair redujo temporalmente su generación y que CENACE dispuso desconexiones controladas e inmediatas en varios sectores de Quito el 14 de septiembre de 2026. | Quito, incluidos La Floresta, Iñaquito, González Suárez y sectores de Eloy Alfaro y Gaspar de Villarroel | energía eléctrica; continuidad de comercios, familias y empresas de servicios | La fuente consultada es periodística; no se abrió en esta ejecución el comunicado o registro operativo de CENACE.; No se cuantifican pérdidas de comercios, familias o empresas de servicios ni se informa afectación específica en Nayón.; El hecho no demuestra por sí mismo una necesidad de crédito ni una oportunidad comercial.
noticia-obras-panamericana-norte-2026-09-09 | evento-obras-panamericana-norte-calderon-2026 | acontecimientos locales de Quito y Pichincha | Nuevos frentes de obra de la Panamericana Norte se realizan en El Clavel y La Candelaria 1 | Quito Informa, Municipio de Quito | 2026-09-09 | https://quitoinforma.quito.gob.ec/2026/09/09/nuevos-frentes-de-obra-de-la-panamericana-norte-se-realizan-en-el-clavel-y-la-candelaria-1/ | Quito Informa comunicó que se activaron dos frentes de trabajo en los carriles laterales de la Panamericana Norte, con cierres puntuales en La Candelaria 1 y El Clavel. Informó que los carriles centrales permanecían habilitados y que existían desvíos temporales. | Quito, parroquia de Calderón: La Candelaria 1, El Clavel y conexión hacia Llano Grande | movilidad; comercios y empresas de servicios locales como segmentos a revisar | La noticia describe obras y movilidad, pero no cuantifica ventas, ingresos o pérdidas de negocios.; El acontecimiento se ubica en Calderón y no en Nayón; la relevancia para Cooperativa Andina es territorial y debe validarse.; No se infiere intención de contratar crédito ni capacidad de pago de ningún negocio.
noticia-trafico-quito-2026-09-08 | evento-congestion-quito-2026 | acontecimientos locales de Quito y Pichincha | En Quito se viaja a 13 km/h en hora pico | El Comercio; referencias a la Secretaría de Movilidad y la AMT | 2026-09-08 | https://www.elcomercio.com/actualidad/quito/trafico-vehicular-secretaria-movilidad-informe/ | El Comercio reportó una velocidad promedio de 13 km/h en horas pico en Quito y mencionó congestión en sectores como Maldonado, El Recreo, Mariscal Sucre, El Trébol, Guayasamín, Carcelén y otros puntos de la ciudad. | Quito, incluidos sectores del sur, hipercentro y norte de la ciudad | movilidad urbana; familias, comercios y empresas de servicios como segmentos a revisar | La fuente cita un informe de movilidad, pero la noticia no enlaza el documento completo para revisar su metodología.; No hay medición específica para Nayón ni un cálculo actualizado del efecto sobre comercios o empresas de servicios.; La mención de familias, comercios y servicios expresa relevancia para revisión, no un impacto comercial comprobado.

Crea 04_reportes/inventario.md con el número de noticias, categorías, entidades, período cubierto, acontecimientos agrupados y limitaciones. Muéstrame una tabla breve con id_noticia, título, entidad y URL.
```

Comprueba que el inventario indique 24 fichas de entrada, que cubra la ventana de 30 días y que cada ficha conserve una fuente. Una noticia puede orientar una pregunta comercial sin demostrar por sí sola demanda, capacidad de pago o intención de compra.


## Paso 3 — Crear la base, el libro y el dashboard

Copia este prompt completo. Los dos entregables visibles quedarán juntos en `03_dashboard` y utilizarán la misma base estructurada:

```text
Lee AGENTS.md, PERFIL.md y 01_entrada_noticias/noticias.json. Usa las herramientas disponibles para crear directamente estos archivos finales:

1. 02_base_de_datos/base_agente_001.json con las noticias, señales y oportunidades estructuradas.
2. 02_base_de_datos/generar_agente_001.py como generador reproducible que lea la base y produzca el libro y el HTML.
3. 03_dashboard/agente_001.xlsx con cinco pestañas: Noticias, Senales, Oportunidades, Seguimiento y Dashboard.
4. 03_dashboard/index.html autocontenido, sin dependencias externas.
5. 04_reportes/resumen_ultima.md.

Conserva generar_agente_001.py porque permite repetir la actualización. Ubícalo dentro de 02_base_de_datos, no en la raíz, y explica en FLUJO_AGENTE.md que es el motor técnico del proyecto. Elimina únicamente archivos temporales de inspección o scripts auxiliares que no sean necesarios. Los únicos archivos visibles dentro de 03_dashboard deben ser agente_001.xlsx e index.html.

En Noticias conserva las 24 fichas de entrada. En Senales selecciona como máximo ocho señales prioritarias, procurando combinar contexto macroeconómico, actividad local, cooperativas, clima, energía y geopolítica. Para cada señal conserva el título de la noticia, la URL, el hecho comprobado, una inferencia explicada y el dato que todavía debe comprobarse.

En Oportunidades crea entre tres y cinco hipótesis comerciales a partir de las señales prioritarias. Consolida señales relacionadas cuando conduzcan a una misma oportunidad; nunca crees automáticamente una oportunidad por cada noticia o por cada señal. Utiliza estas columnas: id_oportunidad, ids_senales, segmento, producto, hipotesis, evidencia, dato_pendiente, accion_validacion, territorio_0a5, encaje_0a5, urgencia_0a5, confianza_0a5, justificacion, puntaje, prioridad, responsable, estado, fecha_objetivo, notas y resultado. Calcula puntaje como territorio + encaje + urgencia + confianza. Escribe “Hipótesis para validación humana” en cada oportunidad.

Diseña el dashboard para que una persona comercial identifique rápidamente el tema, la oportunidad y su potencial. Muestra primero los conteos de noticias, señales y oportunidades. Después presenta entre tres y cinco oportunidades principales. Para cada oportunidad muestra, en este orden:

- TEMA: un nombre corto, en mayúsculas y orientado al mercado, que sintetice las noticias relacionadas. Ejemplos: EL NIÑO, TASAS Y AHORRO, EMPRENDIMIENTOS DE QUITO o CONTINUIDAD ENERGÉTICA.
- NOTICIAS: los títulos completos como hipervínculos a las URLs originales; debajo de cada uno, fecha y territorio en texto pequeño.
- QUÉ OCURRIÓ: una síntesis de una o dos frases de los hechos comprobados.
- OPORTUNIDAD: una propuesta comercial clara, proactiva y escrita como lo haría un experto en ventas y marketing. Describe el mejor escenario comercial razonable para los segmentos y productos del perfil: una campaña, una conversación de valor, una oferta temática o una línea de acompañamiento. Habla de beneficios, momento comercial y segmentos prioritarios. No muestres identificadores, lenguaje técnico, advertencias ni la frase “Hipótesis para validación humana” en el dashboard.
- PUNTAJE: muestra el resultado sobre 20 y la prioridad, por ejemplo “15/20 · Alta”.

No muestres una sección de acción de validación en el dashboard. Conserva accion_validacion, limitaciones y controles en el libro y en la base de datos para uso del equipo interno. Si una oportunidad usa varias noticias, muestra hasta tres títulos enlazados. La fuente debe quedar incorporada en el hipervínculo del título y no ocupar una columna independiente. No presentes una tabla reducida a identificadores y fuentes. Incluye arriba un botón visible “Abrir libro de datos” enlazado a ./agente_001.xlsx.

Usa fondo casi negro, blanco suave, gris oscuro y acentos turquesa, ámbar y rojo solo para indicar prioridad. Mantén filtros y encabezados legibles en el libro. La pestaña Dashboard del Excel debe utilizar la misma lógica visual y mostrar tema, noticia, oportunidad y puntaje.

Antes de sobrescribir un archivo existente, guarda una copia fechada en 05_respaldo. Conserva los campos manuales ya existentes. No inventes datos ni oportunidades sin fuente.

Antes de terminar valida todo lo siguiente: hay 24 noticias; no hay más de ocho señales; hay entre tres y cinco oportunidades; cada oportunidad visible muestra un tema, al menos una noticia enlazada, el hecho, una oportunidad comercial y el puntaje; los enlaces conservan las URLs originales; 03_dashboard contiene agente_001.xlsx e index.html; ambos archivos abren correctamente; generar_agente_001.py puede volver a producir ambos entregables; y no quedan archivos temporales o auxiliares en la raíz del proyecto. Registra en resumen_ultima.md los archivos creados, conteos, limitaciones y resultado, y muéstrame un resumen de la ejecución.
```

Abre `03_dashboard/index.html` en un navegador y comprueba el botón que lleva al libro. Cada oportunidad debe permitir identificar el tema, leer la noticia, entender la oportunidad comercial y ver el puntaje sin consultar otra pantalla.

## Paso 4 — Ejecutar el agente de nuevo

Este prompt sirve para la segunda y tercera ejecución manual. Antes de probarlo, puedes añadir una noticia nueva al archivo de entrada. Si no añades nada, el resultado esperado es “sin novedades”.

```text
Ejecuta el agente. Lee AGENTS.md, PERFIL.md, 01_entrada_noticias/noticias.json, 02_base_de_datos/base_agente_001.json, 02_base_de_datos/generar_agente_001.py y los archivos existentes en 03_dashboard. Detecta duplicados por URL normalizada y acontecimiento, conserva las oportunidades y campos manuales existentes y guarda un respaldo antes de modificar los archivos.

Actualiza base_agente_001.json y ejecuta generar_agente_001.py para regenerar agente_001.xlsx e index.html con las mismas reglas del Paso 3. Mantén juntos el libro y el HTML en 03_dashboard. Conserva el generador y elimina únicamente archivos auxiliares innecesarios. Verifica que cada oportunidad visible muestre tema, noticias enlazadas, hecho, oportunidad comercial, prioridad y puntaje.

Registra en 04_reportes/pruebas.md la fecha y hora America/Guayaquil, noticias nuevas, duplicados, oportunidades creadas o actualizadas, archivos modificados y limitaciones. Si no hay novedades, registra “sin novedades” y no inventes cambios. No busques nuevas fuentes durante esta prueba ni contactes personas.
```

Para repetirlo dos o tres veces, utiliza el mismo prompt. La prueba está correcta si no duplica fichas, no borra notas humanas y deja un registro de cada ejecución.

### Comparación opcional con un modelo de mayor capacidad

Si quieres comprobar la calidad del resultado, selecciona **GPT-5.6 Sol con esfuerzo medio antes de pegar el mismo Prompt 4**. No cambies la estructura del prompt. Compara los conteos, los identificadores, las fuentes, las fórmulas, los duplicados y las limitaciones que registra cada ejecución. Explica al grupo que una corrida con Sol puede tardar más porque dedica más trabajo al análisis; la comparación solo es útil si revisa resultados concretos.

## Paso 5 — Programar una actualización de lunes a viernes

Primero ejecuta manualmente el prompt siguiente y revisa el resultado. Después crea una tarea programada para lunes a viernes a las 08:00, con la zona horaria de tu institución:

```text
En este proyecto, ejecuta el agente de oportunidades comerciales. Lee AGENTS.md, PERFIL.md, 02_base_de_datos/base_agente_001.json y el último resumen de ejecución. Busca novedades públicas desde la última ejecución exitosa, con dos días de solapamiento y un máximo de cinco noticias nuevas. Prioriza fuentes oficiales y fuentes con fecha y enlace verificables sobre tasas, remesas, actividad económica, energía, clima, Quito, Pichincha y acontecimientos internacionales con efecto económico explicable.

Actualiza noticias.json y base_agente_001.json, deduplica por URL y acontecimiento y ejecuta 02_base_de_datos/generar_agente_001.py para regenerar 03_dashboard/agente_001.xlsx y 03_dashboard/index.html. Preserva los campos manuales y guarda un respaldo antes de modificar los archivos. Mantén en el dashboard el tema, las noticias enlazadas, el hecho, la oportunidad comercial y el puntaje. Registra fuentes no accesibles y limitaciones. No uses datos de clientes, no tomes decisiones financieras, no contactes personas y no presentes hipótesis como hechos. Entrega un resumen de máximo cinco líneas con noticias nuevas, oportunidades que requieren revisión y limitaciones. Si no hay novedades, registra “sin novedades”.
```

En un proyecto local, el computador debe estar encendido, la aplicación de escritorio abierta y la carpeta disponible cuando llegue la hora programada. Revisa las primeras ejecuciones antes de confiar en la rutina diaria. En un proyecto en la nube, conserva las fuentes en el proyecto o usa un conector autorizado. [Consulta la documentación oficial sobre tareas programadas](https://learn.chatgpt.com/docs/automations).

## Cómo interpretar el resultado

Una noticia es evidencia cuando una fuente afirma un hecho comprobable. Una señal es una lectura posible del efecto de ese hecho en el territorio o segmento. Una oportunidad es una hipótesis comercial acompañada de una acción para validarla. El dashboard ayuda a priorizar preguntas; no reemplaza la revisión de una persona autorizada.

El agente debe dejar visibles las fuentes, fechas y limitaciones. Si no puede abrir una fuente, debe declararlo. Si una noticia habla de Quito pero no de Nayón, la relación con Nayón debe quedar como una inferencia pendiente, no como un hecho local.

## Privacidad y control humano

Para esta demostración utiliza únicamente información pública y datos sintéticos. Un proyecto local organiza los archivos en tu equipo, pero no convierte automáticamente el procesamiento del modelo en procesamiento local. Antes de usar información real, revisa la configuración de privacidad, la retención, los conectores y las reglas de tu organización. Mantén la aprobación humana antes de cualquier decisión financiera o contacto con un socio.
