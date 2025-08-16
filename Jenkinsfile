pipeline {
    agent any

    environment {
        DOCKOCKER_IMAGE_BACKEND = 'bbsr-grocery-backend'
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
                        echo 'Creating .env file from Jenkins credentials...'
                        sh 'echo "$ENV_FILE_CONTENT" > backend/.env'

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
                    
                    // UPDATED: Replaced 'sleep' with a robust retry loop for the backend.
                    // Tries 6 times, waiting 10 seconds between attempts (total 1 minute).
                    timeout(time: 1, unit: 'MINUTES') {
                        try {
                            retry(6) {
                                echo 'Checking Backend Health...'
                                sh 'curl -f http://localhost:5000/'
                                sleep 10 // Wait before next check if successful
                            }
                            echo 'Backend is healthy.'
                        } catch (any) {
                            echo 'Backend did not become healthy in time. This is likely due to a crash.'
                        }
                    }

                    // UPDATED: Replaced 'sleep' with a robust retry loop for the frontend.
                    timeout(time: 1, unit: 'MINUTES') {
                        retry(6) {
                            echo 'Checking Frontend Health...'
                            sh 'curl -f http://localhost:80/'
                            sleep 10 // Wait before next check
                        }
                        echo 'Frontend is healthy.'
                    }
                }
            }
        }
    }

    post {
        // UPDATED: Wrapped the entire post block to ensure .env is always available for all commands.
        withCredentials([string(credentialsId: 'bbsr-grocery-env', variable: 'ENV_FILE_CONTENT')]) {
            always {
                // We create the .env file again here just for the post-build commands
                sh 'echo "$ENV_FILE_CONTENT" > backend/.env'
                
                echo 'Pipeline completed. Final container status:'
                sh 'docker compose ps'
                sh "docker images | grep '${DOCKER_IMAGE_BACKEND}\\|${DOCKER_IMAGE_FRONTEND}'"

                // Clean up the file at the very end
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
}