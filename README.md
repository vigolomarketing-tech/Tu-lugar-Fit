# TU Lugar Fit — Catálogo online

Catálogo con carrito para TU Lugar Fit (equipamiento de gimnasio y artículos
deportivos). El cliente arma su pedido y se envía por WhatsApp. Sin pagos
online, sin login, sin backend: HTML + CSS + JS vanilla.

## Estructura

- `index.html` — estructura de la página.
- `styles.css` — estilos (mobile-first, tema oscuro con acento verde lima).
- `data.js` — **acá se edita todo el contenido**: datos del negocio (`CONFIG`),
  categorías (`CATEGORIAS`) y productos (`PRODUCTOS`).
- `app.js` — lógica: búsqueda, filtros, carrito y armado del mensaje de WhatsApp.
- `img/productos/` — fotos de cada producto.

## Editar precios o productos

Todo vive en `data.js`. Por ejemplo, para cambiar un precio:

```js
{
  id: 1,
  nombre: "Tobilleras de 1 kg (el par)",
  categoria: "Tobilleras",
  precio: 11400,      // <- cambiar acá
  unidad: "par",
  imagen: "img/productos/001-tobilleras-de-1-kg-el-par.jpeg",
},
```

Para agregar un producto nuevo, copiá un bloque `{ ... }`, poné un `id` que no
esté usado, completá `nombre`, `categoria` (tiene que ser una de las que están
en `CATEGORIAS`), `precio`, `unidad` (`"par"`, `"unidad"` o `null`) y subí la
foto a `img/productos/`.

## Ver el sitio localmente

Como usa `fetch`/módulos nada especial, alcanza con abrir `index.html`
directo en el navegador. Si preferís levantar un servidor local:

```bash
python3 -m http.server 8000
```

y entrar a `http://localhost:8000`.

## Deploy

No requiere build. Se puede subir la carpeta completa tal cual a
**Cloudflare Pages** o **Netlify** (framework: "None" / sin comando de build,
directorio de publicación: `/`).

## Nota sobre el pedido de origen (PDF)

Los 203 productos y sus fotos se extrajeron automáticamente de la lista de
precios en PDF. El producto `id: 101` ("Kit body 60 kg...") quedó marcado con
`// REVISAR` en `data.js` porque su descripción está cortada en el PDF
original — conviene completarla a mano.
