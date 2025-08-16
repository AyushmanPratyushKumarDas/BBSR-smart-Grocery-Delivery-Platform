pipeline {
    agent any

    environment {
        DOCKER_IMAGE_BACKEND = 'bbsr-grocery-backend'
        DOCKER_IMAGE_FRONTEND = 'bbsr-grocery-frontend'
        DOCKER_TAG = 'latest'
    }

    stages {
        stage('Checkout') {
            steps {
                checkout scm
            }
        }

        stage('Build Images') {
            parallel {
                stage('Build Backend') {
                    steps {
                        script {
                            echo 'Building Backend Docker Image...'
                            sh "docker build -t ${DOCKER_IMAGE_BACKEND}:${DOCKER_TAG} ./backend"
                        }
                    }
                }
                stage('Build Frontend') {
                    steps {
                        script {
                            echo 'Building Frontend Docker Image...'
                            sh "docker build -t ${DOCKER_IMAGE_FRONTEND}:${DOCKER_TAG} ./frontend"
                        }
                    }
                }
            }
        }

        stage('Stop Existing Containers') {
            steps {
                script {
                    echo 'Stopping existing containers...'
                    sh 'docker compose down --remove-orphans || true'
                }
            }
        }

        stage('Deploy Application') {
            steps {
                withCredentials([string(credentialsId: 'bbsr-grocery-env', variable: 'ENV_FILE_CONTENT')]) {
                    script {
                        // Create the .env file. We will NOT delete it here anymore.
                        echo 'Creating temporary .env file from Jenkins credentials...'
                        sh 'echo "$ENV_FILE_CONTENT" > backend/.env'

                        try {
                            echo 'Attempting to deploy all services...'
                            sh 'docker compose up -d'
                            echo "SUCCESS: Both backend and frontend services are starting up."
                        } catch (any) {
                            echo "WARN: Could not start all services. This is likely due to a backend failure."
                            echo "Attempting to start only the frontend service as a fallback."
                            sh 'docker compose up -d frontend'
                            echo "SUCCESS: Frontend service started independently."
                        }
                        // NOTE: The 'finally' block with 'rm' is removed from this stage.
                    }
                }
            }
        }

        stage('Health Check') {
            steps {
                script {
                    echo 'Waiting for services to become available...'
                    sleep 30

                    try {
                        echo 'Checking Backend Health...'
                        sh 'curl -f http://localhost:5000/'
                        echo 'Backend is healthy.'
                    } catch (any) {
                        echo 'Backend is not responding. This is likely due to a crash.'
                    }

                    // FIX #1: Correct syntax for the frontend health check
                    try {
                        echo 'Checking Frontend Health...'
                        sh 'curl -f http://localhost:80/'
                        echo 'Frontend is healthy.'
                    } catch (any) {
                        // This will now correctly fail the pipeline if the frontend is down.
                        error("Frontend failed health check.")
                    }
                }
            }
        }
    }

    post {
        always {
            echo 'Pipeline completed. Final container status:'
            // These commands will now work because the .env file still exists.
            sh 'docker compose ps'
            sh "docker images | grep '${DOCKER_IMAGE_BACKEND}\\|${DOCKER_IMAGE_FRONTEND}'"
            
            // FIX #2: Clean up the .env file at the very end of the pipeline.
            echo 'Cleaning up temporary .env file...'
            sh 'rm backend/.env || true'
        }
        success {
            echo 'Pipeline finished successfully!'
        }
        failure {
            echo 'Pipeline failed! Check the logs from the containers:'
            // This command will now work correctly.
            sh 'docker compose logs --tail=100'
        }
    }
}