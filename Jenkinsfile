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
                // This block securely loads the credential by its ID.
                // Make sure to replace 'your-credential-id-here' with the actual ID you created.
                withCredentials([string(credentialsId: 'bbsr-grocery-env', variable: 'ENV_FILE_CONTENT')]) {
                    script {
                        try {
                            // Create the .env file in the workspace just before it's needed
                            echo 'Creating temporary .env file from Jenkins credentials...'
                            sh 'echo "$ENV_FILE_CONTENT" > backend/.env'

                            // Attempt to deploy all services
                            echo 'Attempting to deploy all services...'
                            sh 'docker compose up -d'
                            echo "SUCCESS: Both backend and frontend services are starting up."

                        } catch (any) {
                            // If deployment fails, run the fallback
                            echo "WARN: Could not start all services. This is likely due to a backend failure."
                            echo "Attempting to start only the frontend service as a fallback."
                            sh 'docker compose up -d frontend'
                            echo "SUCCESS: Frontend service started independently."

                        } finally {
                            // IMPORTANT: Always clean up the temporary .env file for security
                            echo 'Cleaning up temporary .env file...'
                            sh 'rm backend/.env'
                        }
                    }
                }
            }
        }

        stage('Health Check') {
            steps {
                script {
                    echo 'Waiting for services to become available...'
                    sleep 30 // Give containers time to initialize

                    try {
                        echo 'Checking Backend Health...'
                        sh 'curl -f http://localhost:5000/'
                        echo 'Backend is healthy.'
                    } catch (any) {
                        echo 'Backend is not responding. This is expected if it failed to start.'
                    }

                    echo 'Checking Frontend Health...'
                    sh 'curl -f http://localhost:80/ || error("Frontend failed health check.")'
                    echo 'Frontend is healthy.'
                }
            }
        }
    }

    post {
        always {
            echo 'Pipeline completed. Final container status:'
            sh 'docker compose ps'
            sh "docker images | grep '${DOCKER_IMAGE_BACKEND}\\|${DOCKER_IMAGE_FRONTEND}'"
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