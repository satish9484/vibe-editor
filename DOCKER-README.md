# 🐳 Docker Deployment Guide for VibeCode Editor

> **For general project information, setup instructions, and features, see the
> main [README.md](README.md)**

This guide will help you deploy VibeCode Editor using Docker with all services
containerized.

## 📋 Prerequisites

- **Docker** (version 20.10+)
- **Docker Compose** (version 2.0+)
- **Git** (to clone the repository)

## 🚀 Quick Start

### 1. Clone and Setup

```bash
git clone https://github.com/satish9484/vibe-editor.git
cd vibe-editor
```

### 2. Environment Configuration

```bash
# Copy environment template
cp .env.example .env

# Edit .env file with your actual values
nano .env
```

### 3. Build and Start

```bash
# Make scripts executable
chmod +x docker-scripts.sh

# Build and start the application
./docker-scripts.sh build
./docker-scripts.sh start
```

### 4. Access the Application

- **Application**: http://localhost:3000
- **Ollama API**: http://localhost:11434

## 🤖 AI Models Management

### Check Available Models

```bash
# List all installed models
docker-compose exec ollama ollama list

# Test a specific model
docker-compose exec ollama ollama run tinyllama "Hello"

# Check model details
docker-compose exec ollama ollama show tinyllama
```

### Available Models

| Model                  | Size   | RAM Required | Status                  |
| ---------------------- | ------ | ------------ | ----------------------- |
| **`tinyllama`**        | 637 MB | 1GB+         | ✅ **Currently Active** |
| **`codellama:7b`**     | 3.8 GB | 6GB+         | ⚠️ Requires more RAM    |
| **`codellama:latest`** | 3.8 GB | 6GB+         | ⚠️ Requires more RAM    |

### Pull New Models

```bash
# Pull a lightweight model (recommended for low RAM)
docker-compose exec ollama ollama pull tinyllama

# Pull CodeLlama models (requires 6GB+ RAM)
docker-compose exec ollama ollama pull codellama:7b
docker-compose exec ollama ollama pull codellama:latest

# Pull other models
docker-compose exec ollama ollama pull <model-name>
```

### Switch Models

To change the AI model, edit `app/api/code-completion/route.ts`:

```typescript
const requestBody = {
  // Current working model (lightweight, ~637MB)
  model: 'tinyllama',

  // Alternative models (uncomment to use):
  // model: 'codellama:latest',     // Full CodeLlama (3.8GB) - requires 6GB+ RAM
  // model: 'codellama:7b',         // CodeLlama 7B (3.8GB) - requires 6GB+ RAM
  // model: 'codellama:13b',       // CodeLlama 13B (7.3GB) - requires 8GB+ RAM
  // model: 'codellama:34b',       // CodeLlama 34B (19GB) - requires 20GB+ RAM

  prompt,
  stream: false,
  option: {
    temperature: 0.7,
    max_tokens: 300,
  },
};
```

### Model Performance

- **TinyLlama**: Fast, lightweight, good for basic code suggestions
- **CodeLlama**: Better code understanding, requires more resources
- **Memory Requirements**: Check your system RAM before using larger models

## 🔧 Configuration

### Environment Variables (.env)

```env
# Database Configuration (MongoDB Atlas)
DATABASE_URL="mongodb+srv://username:password@cluster.mongodb.net/vibe-editor?retryWrites=true&w=majority"

# Authentication Configuration
AUTH_SECRET="your-super-secret-auth-key-here"
AUTH_GOOGLE_ID="your-google-oauth-client-id"
AUTH_GOOGLE_SECRET="your-google-oauth-client-secret"
AUTH_GITHUB_ID="your-github-oauth-client-id"
AUTH_GITHUB_SECRET="your-github-oauth-client-secret"

# Application Configuration
NEXTAUTH_URL="http://localhost:3000"

# MongoDB Configuration (if using local MongoDB)
MONGO_ROOT_USERNAME="admin"
MONGO_ROOT_PASSWORD="password"
MONGO_DATABASE="vibe-editor"
```

### OAuth Setup

1. **Google OAuth**:
   - Go to [Google Cloud Console](https://console.cloud.google.com/)
   - Create OAuth 2.0 credentials
   - Add `http://localhost:3000/api/auth/callback/google` to redirect URIs

2. **GitHub OAuth**:
   - Go to GitHub Settings > Developer settings > OAuth Apps
   - Create new OAuth App
   - Add `http://localhost:3000/api/auth/callback/github` to callback URL

## 🛠️ Docker Commands

### Using the Management Script

```bash
# Build the application
./docker-scripts.sh build

# Start all services
./docker-scripts.sh start

# Stop all services
./docker-scripts.sh stop

# Restart all services
./docker-scripts.sh restart

# View application logs
./docker-scripts.sh logs

# View all service logs
./docker-scripts.sh logs-all

# Pull AI model
./docker-scripts.sh pull-model

# Run database migrations (Prisma)
./docker-scripts.sh db-migrate

# Generate Prisma client
./docker-scripts.sh db-generate

# Reset database (WARNING: destroys data)
./docker-scripts.sh db-reset

# Check service status
./docker-scripts.sh status

# Clean up resources
./docker-scripts.sh clean
```

### Manual Docker Commands

```bash
# Build images
docker-compose build

# Start services
docker-compose up -d

# Stop services
docker-compose down

# View logs
docker-compose logs -f vibe-editor

# Execute commands in container
docker-compose exec vibe-editor npx prisma db push
```

## 🏗️ Architecture

### Services

1. **vibe-editor**: Next.js application (Port 3000)
2. **ollama**: AI service with CodeLlama model (Port 11434)
3. **mongodb**: Local MongoDB database (Port 27017) - **DISABLED** (using
   MongoDB Atlas)

### Volumes

- `ollama_data`: Stores Ollama models and data
- ~~`mongodb_data`: Stores MongoDB data~~ (disabled - using MongoDB Atlas)

### Networks

- `vibe-network`: Internal Docker network for service communication

## 🔍 Troubleshooting

### Common Issues

1. **Port Already in Use**:

   ```bash
   # Check what's using the port
   lsof -i :3000

   # Kill the process or change port in docker-compose.yml
   ```

2. **Ollama Model Not Loading**:

   ```bash
   # Pull the model manually
   ./docker-scripts.sh pull-model

   # Or check Ollama logs
   docker-compose logs ollama
   ```

3. **Database Connection Issues**:

   ```bash
   # Check MongoDB status
   docker-compose ps mongodb

   # Run migrations
   ./docker-scripts.sh db-migrate
   ```

4. **Build Failures**:
   ```bash
   # Clean and rebuild
   ./docker-scripts.sh clean
   ./docker-scripts.sh build
   ```

### Logs and Debugging

```bash
# Application logs
docker-compose logs vibe-editor

# Ollama logs
docker-compose logs ollama

# All service logs
docker-compose logs

# Follow logs in real-time
docker-compose logs -f vibe-editor
```

## 📊 Monitoring

### Health Checks

```bash
# Check if services are running
docker-compose ps

# Check resource usage
docker stats

# Check service health
curl http://localhost:3000/api/health
curl http://localhost:11434/api/tags
```

## 🔄 Updates and Maintenance

### Updating the Application

```bash
# Pull latest changes
git pull

# Rebuild and restart
./docker-scripts.sh build
./docker-scripts.sh restart
```

### Database Maintenance

```bash
# Backup database
docker-compose exec mongodb mongodump --out /backup

# Restore database
docker-compose exec mongodb mongorestore /backup
```

## 🚀 Production Deployment

### Environment Variables for Production

```env
NEXTAUTH_URL="https://yourdomain.com"
DATABASE_URL="mongodb://your-production-db"
AUTH_SECRET="production-secret-key"
```

### Security Considerations

1. **Change default passwords**
2. **Use strong AUTH_SECRET**
3. **Enable HTTPS**
4. **Configure firewall rules**
5. **Regular security updates**

### Scaling

```bash
# Scale the application
docker-compose up -d --scale vibe-editor=3

# Use load balancer (nginx)
# Add nginx service to docker-compose.yml
```

## 📝 Additional Notes

- **First startup** may take longer due to model downloading
- **Ollama models** are cached in Docker volumes
- **Database data** persists between container restarts
- **Template files** are mounted as read-only volumes

## 🆘 Support

If you encounter issues:

1. Check the logs: `./docker-scripts.sh logs-all`
2. Verify environment variables
3. Ensure all ports are available
4. Check Docker daemon is running

For more help, check the main README.md file.
