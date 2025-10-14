## Running This Project with Docker

This project is fully containerized and can be run using Docker Compose. Below are the specific requirements and instructions for running all services.

### Project-Specific Requirements
- **Node.js Version:** All Node-based services require Node.js `22.13.1` (as set by `ARG NODE_VERSION=22.13.1` in Dockerfiles).
- **Bun Version:** The Hono starter uses Bun `1.2` (`ARG BUN_VERSION=1.2`).
- **Angular CLI:** The Angular starter installs `@angular/cli` globally for builds.
- **Prisma:** The main app generates Prisma client during build.
- **Non-root Users:** All containers run as non-root users for security.

### Environment Variables
- The main app and starters support environment files (`.env`, `.env.example`).
- To use custom environment variables, uncomment the `env_file` lines in `docker-compose.yml` for each service and provide the appropriate `.env` file.
- **MongoDB:** If enabling local MongoDB, set `MONGO_ROOT_USERNAME`, `MONGO_ROOT_PASSWORD`, and `MONGO_DATABASE` in your environment.

### Build and Run Instructions
1. **Build and Start All Services:**
   ```sh
   docker compose up --build
   ```
   This will build and start all services defined in `docker-compose.yml`.

2. **Optional: Enable Local MongoDB**
   - Uncomment the `mongodb` service in `docker-compose.yml` and the corresponding volume.
   - Provide required MongoDB environment variables.
   - By default, the project expects MongoDB Atlas; local MongoDB is optional.

### Exposed Ports Per Service
| Service                        | Port Mapping      | Description                |
|------------------------------- |------------------ |--------------------------- |
| typescript-root                | 3000:3000         | Main Next.js app           |
| typescript-angular             | 4200:4200         | Angular starter            |
| javascript-express-simple      | 3001:3000         | Express starter            |
| typescript-hono-nodejs-starter | 3002:3000         | Hono starter (Bun)         |
| typescript-nextjs-new          | 3003:3000         | Next.js starter            |
| typescript-react-ts            | 4173:4173         | React (Vite) starter       |
| javascript-vue                 | 4174:4173         | Vue (Vite) starter         |
| ollama                         | 11434:11434       | Ollama AI service          |
| mongodb (optional)             | 27017:27017       | MongoDB (if enabled)       |

### Special Configuration
- **Ollama AI Service:** Runs on port `11434` and persists data in the `ollama_data` volume.
- **MongoDB:** Not enabled by default; recommended to use MongoDB Atlas. Local MongoDB can be enabled as described above.
- **Volumes:** Persistent data for Ollama (and optionally MongoDB) is managed via Docker volumes.
- **Networks:** All services are connected via the `vibe-network` bridge network for internal communication.

### Notes
- All Dockerfiles use multi-stage builds for optimized images.
- If you add or modify environment variables, ensure your `.env` files are up to date and referenced in `docker-compose.yml`.
- For development, you may want to mount source directories or use bind mounts; this setup is optimized for production builds.

---
*This section was updated to reflect the current Docker setup and service configuration for this project.*
