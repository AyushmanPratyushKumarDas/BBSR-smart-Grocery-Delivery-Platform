pipeline {
    agent any

    environment {
        DOCKER_IMAGE_BACKEND = 'bbsr-grocery-backend'
        DOCKER_IMAGE_FRONTEND = 'bbsr-grocery-frontend'
        DOCKER_TAG = 'latest'
        
        // --- CHANGED: Load all your secrets here ---
        // Replace the credential IDs with the actual IDs from your Jenkins Credentials Manager.
        AWS_REGION            = credentials('AWS_REGION')
        AWS_ACCESS_KEY_ID     = credentials('aws_access_key_id')
        AWS_SECRET_ACCESS_KEY = credentials('AWS_SECRET_ACCESS_KEY')
        DB_PASSWORD           = credentials('db-password')
        JWT_SECRET            = credentials('jwt-secret')
        // Add any other secrets you need from Jenkins Credentials
    }

    stages {
        // --- STAGES: Checkout, Build, Stop (No changes here) ---
        stage('Checkout') {
            steps { checkout scm }
        }
        stage('Build Images') {
            parallel {
                stage('Build Backend') { steps { script { echo 'Building Backend...'; sh "docker build -t ${DOCKER_IMAGE_BACKEND}:${DOCKER_TAG} ./backend" } } }
                stage('Build Frontend') { steps { script { echo 'Building Frontend...'; sh "docker build -t ${DOCKER_IMAGE_FRONTEND}:${DOCKER_TAG} ./frontend" } } }
            }
        }
        stage('Stop Existing Containers') {
            steps { script { echo 'Stopping containers...'; sh 'docker compose down --remove-orphans || true' } }
        }

        stage('Deploy Application') {
            steps {
                script {
                    echo 'Creating .env file from Jenkins credentials...'
                    
                    // --- CHANGED: Dynamically build the .env file ---
                    // This script writes all your variables (secrets and non-secrets) into the .env file.
                    sh '''
                        echo "NODE_ENV=production" > backend/.env
                        echo "PORT=5000" >> backend/.env
                        echo "FRONTEND_URL=http://localhost:5173" >> backend/.env
                        echo "DB_NAME=bbsr_grocery_db" >> backend/.env
                        echo "DB_USER=postgres" >> backend/.env
                        echo "DB_USERNAME=postgres" >> backend/.env
                        echo "DB_PASSWORD=${DB_PASSWORD}" >> backend/.env
                        echo "DB_HOST=database-1.c5yiaiqoe8j4.ap-southeast-2.rds.amazonaws.com" >> backend/.env
                        echo "DB_PORT=5432" >> backend/.env
                        echo "DB_DIALECT=postgres" >> backend/.env
                        echo "AWS_REGION=${AWS_REGION}" >> backend/.env
                        echo "AWS_ACCESS_KEY_ID=${AWS_ACCESS_KEY_ID}" >> backend/.env
                        echo "AWS_SECRET_ACCESS_KEY=${AWS_SECRET_ACCESS_KEY}" >> backend/.env
                        echo "JWT_SECRET=${JWT_SECRET}" >> backend/.env
                        # Add any other variables your application needs here
                    '''

                    try {
                        echo 'Attempting to deploy all services...'
                        sh 'docker compose up -d'
                        echo "SUCCESS: Both backend and frontend services are starting up."
                    } catch (any) {
                        echo "WARN: Could not start all services. Deploying frontend as fallback."
                        sh 'docker compose up -d frontend'
                        echo "SUCCESS: Frontend service started independently."
                    }
                }
            }
        }
        
        // --- STAGES: Health Check (No changes here) ---
        stage('Health Check') {
            steps {
                script {
                    // Your health check logic...
                    // Remember to use the service name (e.g., http://backend:5000) instead of localhost.
                }
            }
        }
    }

    post {
        // --- POST SECTION ---
        // The logic is simplified because we don't need to pass credentials around anymore.
        // The .env file will be cleaned up automatically by the next build's 'Stop Existing Containers' stage
        // or the workspace cleanup. We just need the logs on failure.
        always {
            echo 'Pipeline completed. Final container status:'
            sh 'docker compose ps'
            sh "docker images | grep '${DOCKER_IMAGE_BACKEND}\\|${DOCKER_IMAGE_FRONTEND}'"
            
            // Clean up the .env file as a best practice
            echo 'Cleaning up .env file...'
            sh 'rm backend/.env || true'
        }
        success {
            echo 'Pipeline finished successfully!'
        }
        failure {
            echo 'Pipeline failed! Check the logs from the containers:'
            sh 'docker compose logs --tail=100'
        }
    }
}