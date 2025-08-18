pipeline {
    agent any

    environment {
        DOCKER_IMAGE_BACKEND = 'bbsr-grocery-backend'
        DOCKER_IMAGE_FRONTEND = 'bbsr-grocery-frontend'
        DOCKER_TAG = 'latest'
        
        // --- KEY CHANGE: Load all secrets individually from Jenkins Credentials ---
        // Replace the IDs here with the actual IDs from your Jenkins Credentials Manager.
        AWS_REGION            = credentials('AWS_REGION')
        AWS_ACCESS_KEY_ID     = credentials('aws_access_key_id')
        AWS_SECRET_ACCESS_KEY = credentials('AWS_SECRET_ACCESS_KEY')
        DB_PASSWORD           = credentials('db-password')
        JWT_SECRET            = credentials('jwt-secret')
    }

    stages {
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
                    // --- KEY CHANGE: Dynamically build the .env file from all variables ---
                    sh '''
                        echo "NODE_ENV=production" > backend/.env
                        echo "PORT=5000" >> backend/.env
                        echo "FRONTEND_URL=http://localhost:5173" >> backend/.env
                        echo "DB_NAME=bbsr_grocery_db" >> backend/.env
                        echo "DB_USER=postgres" >> backend/.env
                        echo "DB_USERNAME=postgres" >> backend/.env
                        echo "DB_HOST=database-1.c5yiaiqoe8j4.ap-southeast-2.rds.amazonaws.com" >> backend/.env
                        echo "DB_PORT=5432" >> backend/.env
                        echo "DB_DIALECT=postgres" >> backend/.env
                        echo "JWT_SECRET=${JWT_SECRET}" >> backend/.env
                        echo "DB_PASSWORD=${DB_PASSWORD}" >> backend/.env
                        echo "AWS_REGION=${AWS_REGION}" >> backend/.env
                        echo "AWS_ACCESS_KEY_ID=${AWS_ACCESS_KEY_ID}" >> backend/.env
                        echo "AWS_SECRET_ACCESS_KEY=${AWS_SECRET_ACCESS_KEY}" >> backend/.env
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

        stage('Health Check') {
            steps {
                script {
                    echo 'Waiting for services to become available...'
                    timeout(time: 1, unit: 'MINUTES') {
                        try {
                            retry(6) {
                                echo 'Checking Backend Health...'
                                // --- KEY CHANGE: Use the Docker service name, not localhost ---
                                sh 'curl -f http://backend:5000/api/health'
                                sleep 10
                            }
                            echo 'Backend is healthy.'
                        } catch (any) {
                            error 'Backend did not become healthy in time.'
                        }
                    }
                    // Health check for frontend is optional but good practice
                    timeout(time: 1, unit: 'MINUTES') {
                        try {
                            retry(6) {
                                echo 'Checking Frontend Health...'
                                // --- KEY CHANGE: Use the Docker service name, not localhost ---
                                sh 'curl -f http://frontend:80/'
                                sleep 10
                            }
                             echo 'Frontend is healthy.'
                        } catch (any) {
                            // This is just a warning as the backend is more critical
                            echo 'Warning: Frontend did not become healthy in time.'
                        }
                    }
                }
            }
        }
    }

    post {
        // --- KEY CHANGE: Simplified and syntactically correct post block ---
        always {
            echo 'Pipeline completed. Final container status:'
            sh 'docker compose ps'
            // Clean up the created .env file
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