# 🍞 PANADERÍA APP — Guía de Desarrollo Completa

## Stack: MERN (MongoDB · Express · React · Node.js)

---

## ÍNDICE

1. [Visión General del Proyecto](#1-visión-general-del-proyecto)
2. [Arquitectura de Carpetas](#2-arquitectura-de-carpetas)
3. [Módulo 0 — Setup Inicial](#3-módulo-0--setup-inicial)
4. [Módulo 1 — Autenticación y Roles](#4-módulo-1--autenticación-y-roles)
5. [Módulo 2 — Sucursales](#5-módulo-2--sucursales)
6. [Módulo 3 — Categorías](#6-módulo-3--categorías)
7. [Módulo 4 — Materia Prima (Stock)](#7-módulo-4--materia-prima-stock)
8. [Módulo 5 — Productos Terminados](#8-módulo-5--productos-terminados)
9. [Módulo 6 — Recetas](#9-módulo-6--recetas)
10. [Módulo 7 — Producción](#10-módulo-7--producción)
11. [Módulo 8 — Caja Diaria](#11-módulo-8--caja-diaria)
12. [Módulo 9 — Ventas (POS)](#12-módulo-9--ventas-pos)
13. [Módulo 10 — Gastos](#13-módulo-10--gastos)
14. [Módulo 11 — Proveedores y Compras](#14-módulo-11--proveedores-y-compras)
15. [Módulo 12 — Movimientos de Stock (Auditoría)](#15-módulo-12--movimientos-de-stock-auditoría)
16. [Módulo 13 — Dashboard](#16-módulo-13--dashboard)
17. [Módulo 14 — Reportes](#17-módulo-14--reportes)
18. [Buenas Prácticas Generales](#18-buenas-prácticas-generales)
19. [Fases de Entrega](#19-fases-de-entrega)
20. [Ideas para el Futuro (Fase 2+)](#20-ideas-para-el-futuro-fase-2)

---

## 1. Visión General del Proyecto

**¿Qué es?**
Sistema integral de gestión para una panadería con dos sucursales. Cubre desde la compra de materia prima hasta la venta al público, pasando por producción, caja diaria, gastos y reportes.

**Usuarios del sistema:**

- **Admin:** dueño de la panadería, acceso total
- **Manager:** encargado de sucursal, gestiona stock/producción/reportes de su local
- **Cajero:** punto de venta, abre/cierra caja, registra ventas
- **Panadero:** registra producción, consulta recetas y stock de materia prima

**Flujo principal del negocio:**

```
Compra MP → Stock MP → Producción (Receta) → Stock Producto → Venta → Caja
     ↓                       ↓                       ↓            ↓
  Proveedor          Descuenta MP            Descuenta Prod    Arqueo
                   automáticamente           automáticamente
```

---

## 2. Arquitectura de Carpetas

```
panaderia-app/
│
├── backend/
│   ├── src/
│   │   ├── config/           → db.js, cors.js, env.js
│   │   ├── models/           → Un archivo por entidad
│   │   ├── routes/           → Un archivo por módulo
│   │   ├── controllers/      → Lógica de negocio por módulo
│   │   ├── middlewares/      → auth, roles, validación, errorHandler
│   │   ├── utils/            → Helpers (token, cálculos, alertas)
│   │   └── seeders/          → Datos iniciales para desarrollo
│   ├── server.js
│   ├── package.json
│   └── .env
│
├── frontend/
│   ├── src/
│   │   ├── api/              → Configuración de Axios + servicios por módulo
│   │   ├── context/          → AuthContext (o usar Zustand/Redux)
│   │   ├── hooks/            → Hooks reutilizables (useAuth, useFetch, etc.)
│   │   ├── components/
│   │   │   ├── layout/       → Sidebar, Navbar, MainLayout
│   │   │   ├── common/       → DataTable, Modal, ConfirmDialog, StatsCard
│   │   │   └── forms/        → Formularios reutilizables
│   │   ├── pages/            → Una carpeta por módulo
│   │   ├── routes/           → AppRouter, PrivateRoute, RoleRoute
│   │   └── utils/            → formatCurrency, formatDate, constants
│   ├── App.jsx
│   └── main.jsx
│
└── AGENTS.md                 → Este archivo
```

---

## 3. Módulo 0 — Setup Inicial

### Backend

- Inicializar proyecto con `npm init`
- Instalar dependencias: express, mongoose, cors, dotenv, bcryptjs, jsonwebtoken, express-validator, morgan
- Dev dependencies: nodemon
- Crear `server.js` con Express básico
- Configurar conexión a MongoDB en `config/db.js`
- Configurar CORS permitiendo el origen del frontend
- Configurar variables de entorno (.env): MONGO_URI, JWT_SECRET, JWT_EXPIRES_IN, PORT, FRONTEND_URL
- Configurar morgan para logging en desarrollo
- Crear middleware global de manejo de errores (errorHandler)

### Frontend

- Crear proyecto con Vite: `npm create vite@latest frontend -- --template react`
- Instalar dependencias: react-router-dom, axios, react-hot-toast (notificaciones), react-icons, tailwindcss (o la UI que prefieras)
- Configurar Axios con baseURL e interceptors (adjuntar token automáticamente, manejar 401)
- Configurar rutas base con react-router-dom v6

### Buenas prácticas del setup

- Usar `.env.example` para documentar variables de entorno necesarias
- Nunca commitear `.env` al repositorio
- Configurar scripts: `dev`, `start`, `seed` en backend
- Usar ESLint + Prettier desde el inicio

---

## 4. Módulo 1 — Autenticación y Roles

### Modelo: User

| Campo      | Tipo     | Notas                                  |
| ---------- | -------- | -------------------------------------- |
| name       | String   | Obligatorio, trim, max 100             |
| email      | String   | Obligatorio, único, lowercase          |
| password   | String   | Obligatorio, min 6, `select: false`    |
| role       | String   | Enum: admin, manager, cajero, panadero |
| branch     | ObjectId | Ref a Branch. Obligatorio              |
| isActive   | Boolean  | Default true. Para baja lógica         |
| lastLogin  | Date     | Se actualiza en cada login             |
| timestamps | auto     | createdAt, updatedAt                   |

### Endpoints

| Método | Ruta                  | Rol         | Descripción              |
| ------ | --------------------- | ----------- | ------------------------ |
| POST   | /api/auth/login       | Público     | Login, devuelve JWT      |
| GET    | /api/auth/me          | Autenticado | Datos del usuario actual |
| POST   | /api/users            | Admin       | Crear usuario            |
| GET    | /api/users            | Admin       | Listar usuarios          |
| PUT    | /api/users/:id        | Admin       | Editar usuario           |
| PATCH  | /api/users/:id/toggle | Admin       | Activar/desactivar       |

### Lógica clave

- Hashear password con bcrypt (salt 12) en un hook pre-save
- Generar JWT con id del usuario en el payload, expiración configurable
- Middleware `protect`: extrae token del header `Authorization: Bearer <token>`, verifica con jwt.verify, busca usuario en DB, valida que esté activo, adjunta a `req.user`
- Middleware `authorize(...roles)`: verifica que `req.user.role` esté en la lista de roles permitidos
- Método de instancia `comparePassword` para login
- Sobreescribir `toJSON` para nunca devolver el password

### Frontend

- Página de Login con email y password
- AuthContext o store global con: user, token, login(), logout(), isAuthenticated
- Guardar token en localStorage (o httpOnly cookie si querés más seguridad)
- Interceptor de Axios: adjuntar token a todas las requests, redirigir a login en 401
- Componente PrivateRoute que verifica autenticación
- Componente RoleRoute que verifica rol mínimo
- Sidebar dinámico según el rol del usuario

### Buenas prácticas

- Nunca guardar passwords en texto plano
- `select: false` en password para que no viaje en queries normales
- Baja lógica (isActive: false) en vez de borrar usuarios
- Token con expiración de 8h para un turno de trabajo
- Validar inputs en backend siempre, no confiar en el frontend

---

## 5. Módulo 2 — Sucursales

### Modelo: Branch

| Campo    | Tipo    | Notas              |
| -------- | ------- | ------------------ |
| name     | String  | Obligatorio, único |
| address  | String  | Obligatorio        |
| phone    | String  | Opcional           |
| isActive | Boolean | Default true       |

### Endpoints

| Método | Ruta                     | Rol         | Descripción        |
| ------ | ------------------------ | ----------- | ------------------ |
| POST   | /api/branches            | Admin       | Crear sucursal     |
| GET    | /api/branches            | Autenticado | Listar sucursales  |
| PUT    | /api/branches/:id        | Admin       | Editar sucursal    |
| PATCH  | /api/branches/:id/toggle | Admin       | Activar/desactivar |

### Notas

- Cada usuario pertenece a una sucursal
- El stock se maneja POR SUCURSAL (un producto tiene stock independiente en cada local)
- El admin puede ver datos de todas las sucursales; manager/cajero/panadero solo la suya
- Seedear las 2 sucursales al inicio

---

## 6. Módulo 3 — Categorías

### Modelo: Category

| Campo       | Tipo    | Notas                                |
| ----------- | ------- | ------------------------------------ |
| name        | String  | Obligatorio, único                   |
| description | String  | Opcional                             |
| appliesTo   | String  | Enum: materia_prima, producto, ambos |
| isActive    | Boolean | Default true                         |

### Endpoints

| Método | Ruta                | Rol            | Descripción       |
| ------ | ------------------- | -------------- | ----------------- |
| POST   | /api/categories     | Admin, Manager | Crear categoría   |
| GET    | /api/categories     | Autenticado    | Listar categorías |
| PUT    | /api/categories/:id | Admin, Manager | Editar categoría  |

### Categorías sugeridas para seedear

- Materia prima: Harinas, Lácteos, Endulzantes, Levaduras, Grasas, Frutas secas, Esencias
- Productos: Panes, Facturas, Tortas, Galletas, Sandwiches, Pizzas, Empanadas

---

## 7. Módulo 4 — Materia Prima (Stock)

### Modelo: RawMaterial

| Campo       | Tipo             | Notas                                      |
| ----------- | ---------------- | ------------------------------------------ |
| name        | String           | Obligatorio                                |
| category    | ObjectId         | Ref a Category                             |
| unit        | String           | Enum: kg, g, l, ml, unidad, docena         |
| costPerUnit | Number           | Costo por unidad de medida (ej: $/kg)      |
| stock       | Array de objetos | `[{ branch: ObjectId, quantity: Number }]` |
| minStock    | Number           | Umbral para alerta de stock bajo           |
| isActive    | Boolean          | Default true                               |

### Endpoints

| Método | Ruta                          | Rol            | Descripción                    |
| ------ | ----------------------------- | -------------- | ------------------------------ |
| POST   | /api/raw-materials            | Admin, Manager | Crear materia prima            |
| GET    | /api/raw-materials            | Autenticado    | Listar (filtrar por sucursal)  |
| GET    | /api/raw-materials/:id        | Autenticado    | Detalle con historial de stock |
| PUT    | /api/raw-materials/:id        | Admin, Manager | Editar                         |
| GET    | /api/raw-materials/low-stock  | Admin, Manager | Listar con stock bajo          |
| PATCH  | /api/raw-materials/:id/adjust | Admin, Manager | Ajuste manual de stock         |

### Lógica clave

- El stock es un array con un objeto por sucursal: `[{ branch: "id_suc1", quantity: 50 }, { branch: "id_suc2", quantity: 30 }]`
- Virtual `hasLowStock`: retorna true si alguna sucursal tiene stock ≤ minStock
- Al crear una materia prima, inicializar el stock en 0 para cada sucursal activa
- El ajuste manual debe registrar un StockMovement de tipo "ajuste"
- Nunca permitir stock negativo (validar antes de descontar)

### Materias primas sugeridas para seedear

| Materia Prima       | Unidad | Categoría    |
| ------------------- | ------ | ------------ |
| Harina 000          | kg     | Harinas      |
| Harina 0000         | kg     | Harinas      |
| Harina integral     | kg     | Harinas      |
| Levadura fresca     | kg     | Levaduras    |
| Levadura seca       | kg     | Levaduras    |
| Sal fina            | kg     | —            |
| Azúcar              | kg     | Endulzantes  |
| Manteca             | kg     | Grasas       |
| Margarina           | kg     | Grasas       |
| Aceite              | l      | Grasas       |
| Grasa vacuna        | kg     | Grasas       |
| Huevos              | docena | Lácteos      |
| Leche entera        | l      | Lácteos      |
| Crema de leche      | l      | Lácteos      |
| Dulce de leche      | kg     | Endulzantes  |
| Dulce de membrillo  | kg     | Endulzantes  |
| Cacao en polvo      | kg     | —            |
| Esencia de vainilla | l      | Esencias     |
| Mejorador de masa   | kg     | —            |
| Polvo de hornear    | kg     | Levaduras    |
| Almidón de maíz     | kg     | Harinas      |
| Nueces              | kg     | Frutas secas |
| Pasas de uva        | kg     | Frutas secas |
| Queso cremoso       | kg     | Lácteos      |
| Jamón cocido        | kg     | —            |

### Frontend

- Tabla con filtros: por sucursal, por categoría, solo stock bajo
- Indicador visual (rojo/amarillo/verde) según nivel de stock
- Modal para ajuste manual con campo de justificación
- Vista responsive para que el manager lo use desde el celular

---

## 8. Módulo 5 — Productos Terminados

### Modelo: Product

| Campo          | Tipo             | Notas                                      |
| -------------- | ---------------- | ------------------------------------------ |
| name           | String           | Obligatorio                                |
| category       | ObjectId         | Ref a Category                             |
| salePrice      | Number           | Precio de venta al público                 |
| productionCost | Number           | Se calcula desde la receta automáticamente |
| stock          | Array de objetos | Igual que RawMaterial, por sucursal        |
| minStock       | Number           | Umbral para alerta                         |
| sellBy         | String           | Enum: unidad, kg, docena                   |
| image          | String           | URL (para futuro)                          |
| isActive       | Boolean          | Default true                               |

### Endpoints

| Método | Ruta                    | Rol            | Descripción    |
| ------ | ----------------------- | -------------- | -------------- |
| POST   | /api/products           | Admin, Manager | Crear producto |
| GET    | /api/products           | Autenticado    | Listar         |
| GET    | /api/products/:id       | Autenticado    | Detalle        |
| PUT    | /api/products/:id       | Admin, Manager | Editar         |
| GET    | /api/products/low-stock | Admin, Manager | Stock bajo     |

### Lógica clave

- Virtual `profitMargin`: `((salePrice - productionCost) / productionCost) * 100`
- El costo de producción se recalcula cada vez que se modifica la receta o el precio de materia prima
- El stock se actualiza automáticamente por producción (+) y ventas (-)

### Productos sugeridos para seedear

| Producto              | Categoría  | Se vende por |
| --------------------- | ---------- | ------------ |
| Pan francés           | Panes      | unidad       |
| Pan mignon            | Panes      | unidad       |
| Pan de campo          | Panes      | kg           |
| Pan lactal            | Panes      | unidad       |
| Pan integral          | Panes      | unidad       |
| Medialunas de grasa   | Facturas   | docena       |
| Medialunas de manteca | Facturas   | docena       |
| Facturas surtidas     | Facturas   | docena       |
| Vigilantes            | Facturas   | unidad       |
| Cañoncitos de DDL     | Facturas   | unidad       |
| Torta de chocolate    | Tortas     | unidad       |
| Budín de pan          | Tortas     | unidad       |
| Galletas de grasa     | Galletas   | kg           |
| Bizcochos salados     | Galletas   | kg           |
| Empanadas             | Empanadas  | unidad       |
| Pizza                 | Pizzas     | unidad       |
| Sandwich de miga      | Sandwiches | unidad       |
| Tostado (JyQ)         | Sandwiches | unidad       |
| Prepizza              | Pizzas     | unidad       |

---

## 9. Módulo 6 — Recetas

### Modelo: Recipe

| Campo        | Tipo             | Notas                                                         |
| ------------ | ---------------- | ------------------------------------------------------------- |
| product      | ObjectId         | Ref a Product. Unique (1 producto = 1 receta)                 |
| yield        | Number           | Cuántas unidades rinde esta receta                            |
| yieldUnit    | String           | Enum: unidad, kg, docena                                      |
| ingredients  | Array de objetos | `[{ rawMaterial: ObjectId, quantity: Number, unit: String }]` |
| instructions | String           | Pasos de preparación (opcional)                               |
| prepTime     | Number           | Minutos estimados                                             |
| isActive     | Boolean          | Default true                                                  |

### Endpoints

| Método | Ruta                    | Rol            | Descripción               |
| ------ | ----------------------- | -------------- | ------------------------- |
| POST   | /api/recipes            | Admin, Manager | Crear receta              |
| GET    | /api/recipes            | Autenticado    | Listar recetas            |
| GET    | /api/recipes/:productId | Autenticado    | Ver receta de un producto |
| PUT    | /api/recipes/:id        | Admin, Manager | Editar receta             |

### Lógica clave

- Relación 1:1 con Product (un producto tiene exactamente una receta)
- Al crear/editar receta, recalcular `productionCost` del producto: sumar `(ingredient.quantity / recipe.yield) * rawMaterial.costPerUnit` para cada ingrediente
- Validar que las unidades del ingrediente coincidan con las de la materia prima referenciada
- La receta es el corazón del sistema: conecta producción con stock

### Ejemplo de receta para seedear

**Pan Francés — Rinde 100 unidades:**
| Ingrediente | Cantidad | Unidad |
|--------------------|----------|--------|
| Harina 000 | 5 | kg |
| Agua | 3 | l |
| Levadura fresca | 0.15 | kg |
| Sal fina | 0.1 | kg |
| Grasa vacuna | 0.2 | kg |
| Azúcar | 0.05 | kg |
| Mejorador de masa | 0.05 | kg |

**Medialunas de manteca — Rinde 50 unidades:**
| Ingrediente | Cantidad | Unidad |
|--------------------|----------|--------|
| Harina 0000 | 2.5 | kg |
| Manteca | 1.5 | kg |
| Azúcar | 0.5 | kg |
| Huevos | 0.5 | docena |
| Levadura fresca | 0.1 | kg |
| Leche entera | 0.5 | l |
| Esencia de vainilla| 0.02 | l |
| Sal fina | 0.03 | kg |

### Frontend

- Formulario dinámico: poder agregar/quitar ingredientes con un botón "+"
- Mostrar el costo de producción calculado en tiempo real mientras se arma la receta
- Selector de materia prima que filtre por categoría

---

## 10. Módulo 7 — Producción

### Modelo: Production

| Campo            | Tipo             | Notas                                                   |
| ---------------- | ---------------- | ------------------------------------------------------- |
| product          | ObjectId         | Ref a Product                                           |
| recipe           | ObjectId         | Ref a Recipe                                            |
| branch           | ObjectId         | Ref a Branch                                            |
| quantityProduced | Number           | Cuántas unidades se produjeron                          |
| materialsUsed    | Array de objetos | Snapshot: `[{ rawMaterial, quantityUsed, unit, cost }]` |
| totalCost        | Number           | Suma de todos los costos de materiales                  |
| producedBy       | ObjectId         | Ref a User (quien registró)                             |
| notes            | String           | Observaciones                                           |
| status           | String           | Enum: completada, cancelada                             |

### Endpoints

| Método | Ruta                        | Rol                      | Descripción                         |
| ------ | --------------------------- | ------------------------ | ----------------------------------- |
| POST   | /api/productions            | Admin, Manager, Panadero | Registrar producción                |
| GET    | /api/productions            | Admin, Manager, Panadero | Listar (filtrar por fecha/sucursal) |
| GET    | /api/productions/:id        | Autenticado              | Detalle                             |
| PATCH  | /api/productions/:id/cancel | Admin, Manager           | Cancelar (revierte stock)           |

### Lógica clave (LA MÁS IMPORTANTE DEL SISTEMA)

Al registrar producción, el controller debe hacer en orden:

1. Buscar la receta del producto
2. Calcular la proporción: `factor = quantityProduced / recipe.yield`
3. Para cada ingrediente de la receta:
   a. Calcular cantidad necesaria: `ingredient.quantity * factor`
   b. Verificar que haya stock suficiente en la sucursal
   c. Si NO hay stock → rechazar toda la producción (no producción parcial)
   d. Si hay stock → descontar de `rawMaterial.stock` de esa sucursal
   e. Registrar un StockMovement tipo `produccion_egreso`
4. Sumar `quantityProduced` al stock del producto en esa sucursal
5. Registrar un StockMovement tipo `produccion_ingreso`
6. Guardar snapshot de materiales usados con costos en `materialsUsed`
7. Calcular `totalCost` sumando los costos

### Cancelación

- Solo si la producción fue reciente (ej: mismo día)
- Revertir: devolver materia prima al stock, restar producto del stock
- Registrar StockMovements de reversión
- Marcar status como "cancelada"

### Frontend

- Selector de producto → muestra automáticamente la receta y los ingredientes
- Input de cantidad → muestra en tiempo real cuánta materia prima se va a usar
- Alerta si algún ingrediente no tiene stock suficiente
- Historial de producciones con filtros por fecha y producto

---

## 11. Módulo 8 — Caja Diaria

### Modelo: CashRegister

| Campo              | Tipo             | Notas                                                                 |
| ------------------ | ---------------- | --------------------------------------------------------------------- |
| branch             | ObjectId         | Ref a Branch                                                          |
| openedBy           | ObjectId         | Ref a User                                                            |
| closedBy           | ObjectId         | Ref a User                                                            |
| openingAmount      | Number           | Monto inicial al abrir caja                                           |
| openedAt           | Date             | Fecha/hora de apertura                                                |
| closedAt           | Date             | Fecha/hora de cierre                                                  |
| status             | String           | Enum: abierta, cerrada                                                |
| movements          | Array de objetos | `[{ type, amount, description, reference, registeredBy, createdAt }]` |
| totalCashSales     | Number           | Ventas en efectivo                                                    |
| totalCardSales     | Number           | Ventas con tarjeta                                                    |
| totalTransferSales | Number           | Ventas por transferencia                                              |
| totalWithdrawals   | Number           | Egresos/retiros                                                       |
| expectedAmount     | Number           | Calculado: apertura + ingresos - egresos                              |
| actualAmount       | Number           | Lo que contó el cajero                                                |
| difference         | Number           | actualAmount - expectedAmount                                         |
| closingNotes       | String           | Notas del cierre                                                      |

### Movement (subdocumento)

| Campo          | Tipo     | Notas                           |
| -------------- | -------- | ------------------------------- |
| type           | String   | Enum: ingreso, egreso, retiro   |
| amount         | Number   | Monto                           |
| description    | String   | Descripción del movimiento      |
| reference      | ObjectId | Ref a Sale o Expense (opcional) |
| referenceModel | String   | "Sale" o "Expense"              |
| registeredBy   | ObjectId | Ref a User                      |
| createdAt      | Date     | Hora del movimiento             |

### Endpoints

| Método | Ruta                        | Rol            | Descripción            |
| ------ | --------------------------- | -------------- | ---------------------- |
| POST   | /api/cash-register/open     | Cajero+        | Abrir caja             |
| GET    | /api/cash-register/current  | Cajero+        | Caja actual abierta    |
| POST   | /api/cash-register/movement | Cajero+        | Registrar movimiento   |
| POST   | /api/cash-register/close    | Cajero+        | Cerrar caja con arqueo |
| GET    | /api/cash-register/history  | Admin, Manager | Historial de cajas     |
| GET    | /api/cash-register/:id      | Admin, Manager | Detalle de una caja    |

### Lógica clave

- Solo UNA caja abierta por sucursal a la vez (usar índice único parcial en MongoDB: `{ branch: 1, status: 1 }` con `partialFilterExpression: { status: 'abierta' }`)
- No se pueden registrar ventas sin caja abierta
- Al cerrar caja:
  1. Calcular `expectedAmount = openingAmount + totalIngresos - totalEgresos`
  2. Cajero ingresa `actualAmount` (lo que realmente contó)
  3. `difference = actualAmount - expectedAmount`
  4. Si hay diferencia, queda registrada para revisión del admin
- Los movimientos de caja se crean automáticamente al registrar una venta en efectivo

### Frontend

- Botón grande "Abrir Caja" si no hay caja abierta
- Vista de caja actual: monto de apertura, movimientos del día, totales parciales
- Formulario de cierre: campo para ingresar monto real contado
- Indicador visual de diferencia (verde si cuadra, rojo si no)
- Historial de cajas con resumen rápido

---

## 12. Módulo 9 — Ventas (POS)

### Modelo: Sale

| Campo          | Tipo             | Notas                                                                 |
| -------------- | ---------------- | --------------------------------------------------------------------- |
| ticketNumber   | Number           | Auto-incremental, único                                               |
| branch         | ObjectId         | Ref a Branch                                                          |
| cashRegister   | ObjectId         | Ref a CashRegister (la caja abierta)                                  |
| items          | Array de objetos | `[{ product, productName, quantity, unitPrice, subtotal }]`           |
| total          | Number           | Suma de subtotales (con descuento aplicado)                           |
| paymentMethod  | String           | Enum: efectivo, tarjeta_debito, tarjeta_credito, transferencia, mixto |
| amountReceived | Number           | Cuánto entregó el cliente (para efectivo)                             |
| change         | Number           | Vuelto                                                                |
| discount       | Number           | Porcentaje de descuento (0-100)                                       |
| seller         | ObjectId         | Ref a User                                                            |
| status         | String           | Enum: completada, anulada                                             |
| cancelReason   | String           | Motivo de anulación                                                   |

### Endpoints

| Método | Ruta                     | Rol                    | Descripción      |
| ------ | ------------------------ | ---------------------- | ---------------- |
| POST   | /api/sales               | Admin, Manager, Cajero | Registrar venta  |
| GET    | /api/sales               | Admin, Manager, Cajero | Listar ventas    |
| GET    | /api/sales/:id           | Autenticado            | Detalle de venta |
| PATCH  | /api/sales/:id/cancel    | Admin, Manager         | Anular venta     |
| GET    | /api/sales/daily-summary | Admin, Manager, Cajero | Resumen del día  |

### Lógica clave

Al registrar una venta:

1. Verificar que haya caja abierta en la sucursal
2. Para cada item:
   a. Verificar stock del producto en la sucursal
   b. Descontar del stock
   c. Guardar snapshot del nombre y precio actual (no confiar en el ref)
   d. Registrar StockMovement tipo `venta`
3. Calcular total con descuento: `total = sumaSubtotales * (1 - discount/100)`
4. Si es efectivo: calcular vuelto
5. Auto-generar ticketNumber incremental
6. Agregar movimiento de ingreso a la caja abierta
7. Actualizar totales de la caja según método de pago

### Anulación

- Solo admin o manager
- Requiere motivo obligatorio
- Revertir stock de los productos
- Crear movimiento de egreso en caja
- No borrar, marcar como "anulada"

### Frontend (POS - Punto de Venta)

- Interfaz tipo caja registradora optimizada para velocidad:
  - Búsqueda rápida de productos (por nombre, con autocompletado)
  - Lista de items agregados con cantidad editable
  - Total en tiempo real
  - Botones grandes para método de pago
  - Cálculo de vuelto automático para efectivo
- Histórico de ventas del día con opción de reimprimir ticket
- Diseño pensado para pantalla táctil si es posible

---

## 13. Módulo 10 — Gastos

### Modelo: Expense

| Campo         | Tipo     | Notas                                                                                                                     |
| ------------- | -------- | ------------------------------------------------------------------------------------------------------------------------- |
| branch        | ObjectId | Ref a Branch                                                                                                              |
| category      | String   | Enum: servicios, alquiler, sueldos, mantenimiento, impuestos, insumos_limpieza, combustible, transporte, marketing, otros |
| description   | String   | Obligatorio                                                                                                               |
| amount        | Number   | Obligatorio, > 0                                                                                                          |
| date          | Date     | Fecha del gasto (puede diferir del registro)                                                                              |
| paymentMethod | String   | Enum: efectivo, tarjeta, transferencia, cheque                                                                            |
| cashRegister  | ObjectId | Ref a CashRegister (si se pagó desde caja)                                                                                |
| receipt       | String   | URL de imagen del comprobante (futuro)                                                                                    |
| registeredBy  | ObjectId | Ref a User                                                                                                                |
| isRecurring   | Boolean  | Si es un gasto fijo mensual                                                                                               |

### Endpoints

| Método | Ruta                  | Rol            | Descripción                                  |
| ------ | --------------------- | -------------- | -------------------------------------------- |
| POST   | /api/expenses         | Admin, Manager | Registrar gasto                              |
| GET    | /api/expenses         | Admin, Manager | Listar (filtros: fecha, categoría, sucursal) |
| PUT    | /api/expenses/:id     | Admin, Manager | Editar gasto                                 |
| DELETE | /api/expenses/:id     | Admin          | Eliminar gasto                               |
| GET    | /api/expenses/summary | Admin, Manager | Resumen por categoría                        |

### Lógica clave

- Si el gasto se paga desde caja (efectivo), registrar un movimiento de egreso en la caja abierta
- Gastos recurrentes: flag para identificarlos, útil para proyecciones en reportes
- Categorías predefinidas para poder agrupar en dashboard

---

## 14. Módulo 11 — Proveedores y Compras

### Modelo: Supplier

| Campo         | Tipo           | Notas                               |
| ------------- | -------------- | ----------------------------------- |
| name          | String         | Obligatorio                         |
| contactPerson | String         | Persona de contacto                 |
| phone         | String         | Teléfono                            |
| email         | String         | Email                               |
| address       | String         | Dirección                           |
| supplies      | Array ObjectId | Refs a RawMaterial (qué nos provee) |
| paymentTerms  | String         | Condiciones de pago                 |
| notes         | String         | Notas                               |
| isActive      | Boolean        | Default true                        |

### Modelo: Purchase

| Campo         | Tipo             | Notas                                                   |
| ------------- | ---------------- | ------------------------------------------------------- |
| supplier      | ObjectId         | Ref a Supplier                                          |
| branch        | ObjectId         | Ref a Branch (a qué sucursal va la compra)              |
| items         | Array de objetos | `[{ rawMaterial, quantity, unit, unitCost, subtotal }]` |
| total         | Number           | Suma de subtotales                                      |
| date          | Date             | Fecha de la compra                                      |
| paymentMethod | String           | Enum: efectivo, transferencia, cheque, cuenta_corriente |
| status        | String           | Enum: pendiente, recibida, cancelada                    |
| stockUpdated  | Boolean          | Si ya se actualizó el stock                             |
| invoiceNumber | String           | Número de factura del proveedor                         |
| registeredBy  | ObjectId         | Ref a User                                              |
| notes         | String           | Notas                                                   |

### Endpoints

| Método | Ruta                       | Rol            | Descripción                       |
| ------ | -------------------------- | -------------- | --------------------------------- |
| POST   | /api/suppliers             | Admin, Manager | Crear proveedor                   |
| GET    | /api/suppliers             | Admin, Manager | Listar proveedores                |
| PUT    | /api/suppliers/:id         | Admin, Manager | Editar proveedor                  |
| POST   | /api/purchases             | Admin, Manager | Registrar compra                  |
| GET    | /api/purchases             | Admin, Manager | Listar compras                    |
| PATCH  | /api/purchases/:id/receive | Admin, Manager | Marcar como recibida (suma stock) |

### Lógica clave

- Al marcar una compra como "recibida":
  1. Para cada item, sumar quantity al stock de la materia prima en la sucursal destino
  2. Actualizar el `costPerUnit` de la materia prima si el precio cambió
  3. Registrar StockMovement tipo `compra`
  4. Marcar `stockUpdated: true`
- Historial de precios: al actualizar costPerUnit, considerar recalcular costos de producción de los productos que usen esa materia prima

---

## 15. Módulo 12 — Movimientos de Stock (Auditoría)

### Modelo: StockMovement

| Campo          | Tipo     | Notas                                                                                                                  |
| -------------- | -------- | ---------------------------------------------------------------------------------------------------------------------- |
| itemType       | String   | Enum: raw_material, product                                                                                            |
| itemId         | ObjectId | Ref dinámica según itemType                                                                                            |
| branch         | ObjectId | Ref a Branch                                                                                                           |
| movementType   | String   | Enum: compra, produccion_ingreso, produccion_egreso, venta, ajuste, merma, transferencia_entrada, transferencia_salida |
| quantity       | Number   | Positivo = entrada, Negativo = salida                                                                                  |
| unit           | String   | Unidad del movimiento                                                                                                  |
| stockAfter     | Number   | Stock resultante después del movimiento                                                                                |
| reference      | ObjectId | Ref al documento origen (Purchase, Production, Sale)                                                                   |
| referenceModel | String   | Nombre del modelo de referencia                                                                                        |
| description    | String   | Descripción                                                                                                            |
| registeredBy   | ObjectId | Ref a User                                                                                                             |

### Endpoints

| Método | Ruta                          | Rol            | Descripción                     |
| ------ | ----------------------------- | -------------- | ------------------------------- |
| GET    | /api/stock-movements          | Admin, Manager | Listar todos (con filtros)      |
| GET    | /api/stock-movements/item/:id | Admin, Manager | Historial de un item específico |

### Lógica clave

- Este modelo NO se crea directamente. Se crea automáticamente desde otros módulos:
  - Producción → crea movimientos de egreso (MP) e ingreso (producto)
  - Ventas → crea movimientos de egreso (producto)
  - Compras → crea movimientos de ingreso (MP)
  - Ajustes manuales → crea movimiento de ajuste
- Nunca se edita ni se borra, es un log inmutable
- Siempre guardar `stockAfter` para poder reconstruir el historial
- Índices en: `(itemId, createdAt)`, `(branch, createdAt)`, `(movementType, createdAt)`

---

## 16. Módulo 13 — Dashboard

### Endpoints

| Método | Ruta                          | Rol            | Descripción                  |
| ------ | ----------------------------- | -------------- | ---------------------------- |
| GET    | /api/dashboard/summary        | Admin, Manager | KPIs generales               |
| GET    | /api/dashboard/sales-chart    | Admin, Manager | Datos para gráfico de ventas |
| GET    | /api/dashboard/top-products   | Admin, Manager | Productos más vendidos       |
| GET    | /api/dashboard/expenses-chart | Admin, Manager | Gastos por categoría         |
| GET    | /api/dashboard/stock-alerts   | Admin, Manager | Items con stock bajo         |

### KPIs a mostrar

- Ventas del día / semana / mes (comparativa con período anterior)
- Ganancias: ventas - (costos de producción + gastos)
- Ticket promedio: total ventas / cantidad de ventas
- Productos más vendidos (top 10)
- Productos con mayor margen de ganancia
- Stock bajo (materia prima y productos)
- Comparativa entre sucursales
- Producción del día
- Estado de caja actual

### Frontend

- Cards con KPIs principales en la parte superior
- Gráfico de barras: ventas por día de la semana/mes
- Gráfico de torta: distribución de gastos por categoría
- Gráfico de torta: ventas por método de pago
- Tabla: top productos
- Lista: alertas de stock bajo
- Filtro por sucursal y rango de fechas
- Librería sugerida: Recharts o Chart.js

---

## 17. Módulo 14 — Reportes

### Endpoints

| Método | Ruta                       | Rol            | Descripción                        |
| ------ | -------------------------- | -------------- | ---------------------------------- |
| GET    | /api/reports/sales         | Admin, Manager | Reporte de ventas por período      |
| GET    | /api/reports/production    | Admin, Manager | Reporte de producción              |
| GET    | /api/reports/profitability | Admin          | Rentabilidad por producto          |
| GET    | /api/reports/expenses      | Admin, Manager | Reporte de gastos                  |
| GET    | /api/reports/stock         | Admin, Manager | Estado de inventario completo      |
| GET    | /api/reports/cash-register | Admin, Manager | Historial de cajas con diferencias |

### Reportes clave

- **Ventas por período:** agrupar por día/semana/mes, por sucursal, por producto, por método de pago
- **Rentabilidad:** para cada producto → precio venta - costo producción = margen. Incluir cantidad vendida para calcular ganancia total
- **Gastos vs Ingresos:** balance mensual por sucursal
- **Stock:** valorización del inventario (stock _ costo unitario para MP, stock _ costo producción para productos)
- **Cajas:** cajas con diferencias, ranking de cajeros

### Frontend

- Filtros de fecha con presets: Hoy, Esta semana, Este mes, Último mes, Personalizado
- Tablas exportables (botón para descargar CSV o PDF en el futuro)
- Gráficos de tendencia

---

## 18. Buenas Prácticas Generales

### Backend

- **Validar SIEMPRE en el backend**, nunca confiar en el frontend
- **Baja lógica:** nunca borrar datos, usar `isActive: false`
- **Snapshots:** en ventas y producción, guardar copia de nombres y precios al momento de la operación (los precios pueden cambiar después)
- **Transacciones de MongoDB:** usar `session` y `startTransaction()` cuando una operación modifica múltiples documentos (ej: producción que descuenta varios materiales y suma producto)
- **Índices:** crear índices para las queries más frecuentes (branch + date es la combinación más común)
- **Paginación:** implementar paginación en todos los GET que devuelven listas (page, limit, total)
- **Filtros:** recibir como query params: `?branch=id&from=2024-01-01&to=2024-01-31&status=completada`
- **Respuestas consistentes:** siempre devolver `{ success: true/false, data: ..., message: ..., pagination: ... }`
- **Variables de entorno:** para TODO lo configurable (puertos, secretos, URIs)
- **Error handler global:** un middleware que capture todos los errores y devuelva formato consistente
- **Logging:** usar morgan en desarrollo, considerar winston para producción

### Frontend

- **Componentes reutilizables:** DataTable genérica que reciba columnas y datos, Modal genérico, formularios configurables
- **Manejo de estado:** AuthContext para autenticación. Para estado del servidor (datos), usar react-query o SWR para cache y refetch automático
- **Feedback al usuario:** siempre mostrar loading, éxito y error con toast notifications
- **Protección de rutas:** verificar rol antes de renderizar páginas y también en el sidebar (no mostrar links a secciones que el usuario no puede ver)
- **Responsive:** el cajero puede usarlo en tablet, el admin en desktop
- **Formateo consistente:** helpers para moneda (ARS), fechas, porcentajes

### Seguridad

- JWT en header Authorization, nunca en URL
- CORS configurado solo para el dominio del frontend
- Rate limiting en endpoints de login (evitar fuerza bruta)
- Sanitizar inputs contra NoSQL injection
- Helmet para headers de seguridad en Express
- Nunca exponer stack traces en producción

### Base de datos

- No usar `_id` de MongoDB como datos de negocio visibles (usar ticketNumber, etc.)
- Índices compuestos para las queries más comunes
- Usar `populate` con selectores específicos (no traer todo): `.populate('branch', 'name')`
- Considerar desnormalización intencional para performance (snapshots de precios en ventas)

---

## 19. Fases de Entrega

### Fase 1 — MVP (Semanas 1-4)

1. ✅ Setup del proyecto (backend + frontend)
2. ✅ Módulo 1: Autenticación y Roles
3. ✅ Módulo 2: Sucursales
4. ✅ Módulo 3: Categorías
5. ✅ Módulo 4: Materia Prima
6. ✅ Módulo 5: Productos
7. ✅ Módulo 6: Recetas
8. ✅ Módulo 7: Producción
9. ✅ Módulo 8: Caja Diaria
10. ✅ Módulo 9: Ventas (POS)
11. ✅ Módulo 10: Gastos
12. ✅ Módulo 13: Dashboard (básico)

### Fase 2 — Completa (Semanas 5-6)

13. Módulo 11: Proveedores y Compras
14. Módulo 12: Movimientos de Stock
15. Módulo 14: Reportes avanzados
16. Dashboard completo

### Fase 3 — Mejoras (Semanas 7+)

17. Merma y desperdicios
18. Clientes mayoristas
19. Notificaciones (stock bajo, vencimientos)
20. Exportar reportes a PDF/Excel
21. Upload de imágenes (productos, comprobantes)

---

## 20. Ideas para el Futuro (Fase 2+)

- **Merma/Desperdicio:** registrar productos no vendidos que se descartan. Nuevo tipo de StockMovement. Reportes de merma por producto para ajustar producción.
- **Clientes mayoristas:** modelo Client con datos fiscales, precios especiales, cuenta corriente, historial de compras.
- **Transferencias entre sucursales:** mover stock de una sucursal a otra con movimientos de `transferencia_salida` y `transferencia_entrada`.
- **Notificaciones:** alertas por email o push cuando stock cae bajo el mínimo, cuando una caja tiene diferencia grande, cuando hay un gasto inusual.
- **App móvil:** React Native con las funciones del cajero y panadero para uso en tablet.
- **Facturación electrónica:** integración con AFIP para factura electrónica (Argentina).
- **Códigos de barras:** escanear productos en el POS.
- **Turnos de personal:** registro de horas trabajadas asociado a producción y ventas.
- **Multi-moneda / multi-impuestos:** para escalar a otros contextos.

---

> **Nota final:** Este documento es tu hoja de ruta. Seguí el orden de los módulos ya que cada uno depende del anterior. El módulo de Producción es el corazón del sistema porque conecta materia prima con productos, así que asegurate de que funcione perfectamente antes de avanzar con ventas.
