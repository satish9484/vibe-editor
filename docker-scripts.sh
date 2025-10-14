# docker-scripts.sh

#!/bin/bash

# Docker Management Scripts for VibeCode Editor

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if Docker is running
check_docker() {
    if ! docker info > /dev/null 2>&1; then
        print_error "Docker is not running. Please start Docker and try again."
        exit 1
    fi
}

# Check if .env file exists
check_env() {
    if [ ! -f .env ]; then
        print_warning ".env file not found. Creating from template..."
        cp env.example .env
        print_warning "Please edit .env file with your actual values before running the application."
        exit 1
    fi
}

# Build the application
build() {
    print_status "Building VibeCode Editor..."
    check_docker
    check_env
    
    # Clean previous builds
    docker-compose down --remove-orphans 2>/dev/null || true
    
    # Build with no cache for fresh build
    docker-compose build --no-cache --pull
    print_success "Build completed successfully!"
}


# Start the application
start() {
    print_status "Starting VibeCode Editor..."
    check_docker
    check_env
    
    docker-compose up -d
    print_success "Application started successfully!"
    print_status "Application is available at: http://localhost:3000"
    print_status "Ollama API is available at: http://localhost:11434"
}

# Stop the application
stop() {
    print_status "Stopping VibeCode Editor..."
    docker-compose down
    print_success "Application stopped successfully!"
}

# Restart the application
restart() {
    print_status "Restarting VibeCode Editor..."
    stop
    start
}

# Show logs
logs() {
    docker-compose logs -f vibe-editor
}

# Show all logs
logs_all() {
    docker-compose logs -f
}

# Clean up Docker resources
clean() {
    print_status "Cleaning up Docker resources..."
    docker-compose down -v --remove-orphans
    docker system prune -f
    print_success "Cleanup completed!"
}

# Pull Ollama model
pull_model() {
    print_status "Pulling CodeLlama model..."
    docker-compose exec ollama ollama pull codellama:latest
    print_success "Model pulled successfully!"
}

# Database operations
db_migrate() {
    print_status "Running database migrations..."
    docker-compose exec vibe-editor npx prisma db push
    print_success "Database migrations completed!"
}

db_generate() {
    print_status "Generating Prisma client..."
    docker-compose exec vibe-editor npx prisma generate
    print_success "Prisma client generated!"
}

db_reset() {
    print_status "Resetting database..."
    docker-compose exec vibe-editor npx prisma db push --force-reset
    print_success "Database reset completed!"
}

db_seed() {
    print_status "Seeding database..."
    docker-compose exec vibe-editor npx prisma db seed
    print_success "Database seeded!"
}

db_status() {
    print_status "Checking database status..."
    docker-compose exec vibe-editor npx prisma db pull
    print_success "Database status checked!"
}

# Show detailed container information
info() {
    print_status "VibeCode Editor Container Information:"
    echo ""
    
    print_status "Application Container:"
    docker inspect vibe-editor-app --format "{{.Name}} - {{.Config.Image}} - {{.State.Status}}" 2>/dev/null || echo "Container not running"
    
    print_status "Ollama Container:"
    docker inspect vibe-editor-ollama --format "{{.Name}} - {{.Config.Image}} - {{.State.Status}}" 2>/dev/null || echo "Container not running"
    
    echo ""
    print_status "Network Information:"
    docker network ls | grep vibe-network || echo "Network not found"
    
    echo ""
    print_status "Volume Information:"
    docker volume ls | grep ollama || echo "No volumes found"
}

# Show help
help() {
    echo "VibeCode Editor Docker Management Script"
    echo ""
    echo "Usage: $0 [COMMAND]"
    echo ""
    echo "Commands:"
    echo "  build       Build the Docker images"
    echo "  build-start Build and start the application"
    echo "  start       Start the application"
    echo "  stop        Stop the application"
    echo "  restart     Restart the application"
    echo "  logs        Show application logs"
    echo "  logs-all    Show all service logs"
    echo "  clean       Clean up Docker resources"
    echo "  pull-model  Pull CodeLlama model"
    echo "  db-migrate  Run database migrations"
    echo "  db-generate Generate Prisma client"
    echo "  db-reset    Reset database (WARNING: destroys data)"
    echo "  db-seed     Seed database with initial data"
    echo "  db-status   Check database status"
    echo "  status      Show application status"
    echo "  info        Show detailed container information"
    echo "  help        Show this help message"
    echo ""
    echo "Examples:"
    echo "  $0 build && $0 start"
    echo "  $0 logs"
    echo "  $0 clean"
}

# Main script logic
case "${1:-help}" in
    build)
        build
        ;;
    build-start)
        build_start
        ;;
    start)
        start
        ;;
    stop)
        stop
        ;;
    restart)
        restart
        ;;
    logs)
        logs
        ;;
    logs-all)
        logs_all
        ;;
    clean)
        clean
        ;;
    pull-model)
        pull_model
        ;;
    db-migrate)
        db_migrate
        ;;
    db-generate)
        db_generate
        ;;
    db-reset)
        db_reset
        ;;
    db-seed)
        db_seed
        ;;
    db-status)
        db_status
        ;;
    status)
        status
        ;;
    info)
        info
        ;;
    help|--help|-h)
        help
        ;;
    *)
        print_error "Unknown command: $1"
        help
        exit 1
        ;;
esac
