# Signal Zero Assist

Crea una PWA llamada "SEÑAL CERO": asistente de emergencias que funciona sin

internet. Solo frontend con datos mock. React + TypeScript + Tailwind +

framer-motion. Sin backend, sin login, sin Supabase.

Idiomas: español e inglés, con un toggle simple (objeto i18n).

Estilo: modo oscuro, calmado, no alarmista. Fondo #0B1015, tarjetas #16202B,

acento ámbar #FFB020, confirmación #10B981, texto #F8FAFC. Fuente Inter,

base 18px. Botones de mínimo 72px de alto, todo lo accionable en la mitad

inferior de la pantalla. Esquinas rounded-2xl.

3 pantallas:

1. HOME

- Badge arriba con estado: "SIN SEÑAL — activo"

- Botón SOS circular grande al centro, con pulso lento (framer-motion)

- Grid de 6 tarjetas: Hemorragia, Atragantamiento, RCP, Persona atrapada,

  Quemadura, Convulsión

- Barra inferior: Linterna · Silbato · Idioma

- Pie fijo pequeño: "Esto no reemplaza llamar a emergencias"

2. PROTOCOLO PASO A PASO

- Un paso a la vez, texto grande, "Paso 2 de 6"

- Botón grande "Hecho, siguiente" abajo

- Botón de altavoz para leer el paso

- Transición slide + fade entre pasos

- Al pie en pequeño: fuente del protocolo

3. MODO RCP

- Anillo circular que late a 110 bpm y contador de compresiones

- Botón para detener

Datos: src/data/protocols.json con este formato, incluye 3 protocolos de

ejemplo (hemorragia, atragantamiento, RCP):

{ id, titulo, titleEn, fuente, pasos: [{ id, texto, textEn, segundosTimer }] }

Crea src/lib/engine.ts vacío (solo comentarios) para conectar lógica después.

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/55b57a9d-88a7-4d3d-aef9-b1f47d084b02).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
