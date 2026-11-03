# Refugio del Lago — Sistema de Gestión

Sistema de reservas para el Hotel Refugio del Lago: sitio público, panel de administración, API REST y base de datos, todo orquestado con Docker Compose.

```
refugio-del-lago/
├── docker-compose.yml     ← levanta todo (frontend + backend + MySQL)
├── backend/               ← API REST (Node.js + Express + Sequelize)
└── frontend/              ← sitio público + panel admin (HTML/CSS/JS, nginx)
```

## Cómo correrlo (Docker)

Requisitos: [Docker Desktop](https://www.docker.com/products/docker-desktop/).

```bash
git clone <url-de-este-repo> refugio-del-lago
cd refugio-del-lago

# El backend trae valores por defecto. Si querés personalizarlos:
cp backend/.env.example backend/.env

docker compose up --build
```

Esperá ~30 segundos a que MySQL termine de inicializar. Listo:

- **Sitio público:** http://localhost:8080
- **Panel admin:** http://localhost:8080/admin.html
- **API:** http://localhost:3000/api/habitaciones
- **MySQL (desde host):** `localhost:3307` usuario `refugio` / pass `refugio123`

### Comandos útiles

```bash
docker compose up --build           # build + levantar
docker compose up -d                # en background
docker compose logs -f backend      # ver logs del backend
docker compose down                 # detener todo
docker compose down -v              # detener + borrar la DB
```

## Cómo correrlo sin Docker (desarrollo)

```bash
# Asumiendo MySQL local corriendo en :3306 con DB "refugio"
cd backend
cp .env.example .env            # editar: DB_HOST=localhost
npm install
npm start
```

El backend levanta en http://localhost:3000. Abrí `frontend/index.html` en el navegador — `api.js` detecta el puerto y apunta al backend correcto.

## Endpoints

| Método | Ruta | Descripción |
|---|---|---|
| GET | `/api/habitaciones` | Listar habitaciones |
| GET | `/api/habitaciones/disponibles?checkIn=YYYY-MM-DD&checkOut=YYYY-MM-DD` | Filtrar disponibles |
| GET | `/api/habitaciones/:id` | Obtener una |
| POST | `/api/habitaciones` | Crear |
| PUT | `/api/habitaciones/:id` | Actualizar |
| DELETE | `/api/habitaciones/:id` | Eliminar |
| GET | `/api/reservas` | Listar (incluye huésped y habitación) |
| POST | `/api/reservas` | Crear reserva |
| POST | `/api/reservas/:id/cancelar` | Cancelar |
| GET | `/api/huespedes` | Listar huéspedes |

### Ejemplo

```bash
curl -X POST http://localhost:3000/api/reservas \
  -H "Content-Type: application/json" \
  -d '{
    "nombre": "Juan", "apellido": "Pérez", "email": "juan@example.com",
    "idHabitacion": 1, "checkIn": "2026-06-01", "checkOut": "2026-06-05",
    "cantidadDePersonas": 2
  }'
```

## Modelo de datos

- **Habitacion** (id, numero, tipo, titulo, capacidadMaxima, precioPorNoche, tieneBalcon)
- **Huesped** (id, nombre, apellido, email, telefono, documento)
- **Reserva** (id, checkIn, checkOut, cantidadDePersonas, montoTotal, estado, idHuesped, idHabitacion, idUsuario)
- **Usuario** (id, nombreDeUsuario, email, contrasena, rol)

## Seed inicial

Al primer arranque carga:
- 5 habitaciones (Suite Panorámica, Habitación Bosque, Suite Jardín & Agua, Cabaña Privada, Refugio del Pinar)
- 1 usuario admin (`admin@refugio.uy` / `admin123`)

## Tecnologías

Node.js 20 · Express 5 · Sequelize 6 · MySQL 8 · nginx · Docker Compose

## Autor

Nahuel Souza — Universidad de Montevideo, Introducción a la Licenciatura
