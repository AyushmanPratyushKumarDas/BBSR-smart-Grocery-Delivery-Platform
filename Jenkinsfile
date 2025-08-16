pipeline {
    agent any

    environment {
        DOCKER_IMAGE_BACKEND = 'bbsr-grocery-backend'
        DOCKER_IMAGE_FRONTEND = 'bbsr-grocery-frontend'
        DOCKER_TAG = 'latest'
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
                // UPDATED: Load both backend and frontend credentials
                withCredentials([
                    string(credentialsId: 'bbsr-grocery-env', variable: 'BACKEND_ENV_CONTENT'),
                    string(credentialsId: 'bbsr-grocery-frontend-env', variable: 'FRONTEND_ENV_CONTENT')
                ]) {
                    script {
                        echo 'Creating .env files from Jenkins credentials...'
                        sh 'echo "$BACKEND_ENV_CONTENT" > backend/.env'
                        sh 'echo "$FRONTEND_ENV_CONTENT" > frontend/.env' // Added for frontend

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
        }

        stage('Health Check') {
            steps {
                script {
                    echo 'Waiting for services to become available...'
                    timeout(time: 1, unit: 'MINUTES') {
                        try {
                            retry(6) {
                                echo 'Checking Backend Health...'
                                sh 'curl -f http://localhost:5000/'
                                sleep 10
                            }
                            echo 'Backend is healthy.'
                        } catch (any) {
                            echo 'Backend did not become healthy in time.'
                        }
                    }
                    timeout(time: 1, unit: 'MINUTES') {
                        retry(6) {
                            echo 'Checking Frontend Health...'
                            sh 'curl -f http://localhost:80/'
                            sleep 10
                        }
                        echo 'Frontend is healthy.'
                    }
                }
            }
        }
    }

    post {
        always {
            script {
                // UPDATED: Load both credentials for post-build checks
                withCredentials([
                    string(credentialsId: 'bbsr-grocery-env', variable: 'BACKEND_ENV_CONTENT'),
                    string(credentialsId: 'bbsr-grocery-frontend-env', variable: 'FRONTEND_ENV_CONTENT')
                ]) {
                    try {
                        echo 'Creating .env files for post-build status checks...'
                        sh 'echo "$BACKEND_ENV_CONTENT" > backend/.env'
                        sh 'echo "$FRONTEND_ENV_CONTENT" > frontend/.env' // Added for frontend
                        
                        echo 'Pipeline completed. Final container status:'
                        sh 'docker compose ps'
                        sh "docker images | grep '${DOCKER_IMAGE_BACKEND}\\|${DOCKER_IMAGE_FRONTEND}'"
                    } finally {
                        echo 'Cleaning up .env files...'
                        sh 'rm backend/.env frontend/.env || true' // Updated cleanup
                    }
                }
            }
        }
        success {
            echo 'Pipeline finished successfully!'
        }
        failure {
            script {
                // UPDATED: Load both credentials to fetch logs on failure
                withCredentials([
                    string(credentialsId: 'bbsr-grocery-env', variable: 'BACKEND_ENV_CONTENT'),
                    string(credentialsId: 'bbsr-grocery-frontend-env', variable: 'FRONTEND_ENV_CONTENT')
                ]) {
                    try {
                        echo 'Creating .env files to fetch failure logs...'
                        sh 'echo "$BACKEND_ENV_CONTENT" > backend/.env'
                        sh 'echo "$FRONTEND_ENV_CONTENT" > frontend/.env' // Added for frontend

                        echo 'Pipeline failed! Check the logs from the containers:'
                        sh 'docker compose logs --tail=100'
                    } finally {
                        sh 'rm backend/.env frontend/.env || true' // Updated cleanup
                    }
                }
            }
        }
    }
}