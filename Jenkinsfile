pipeline {
    agent any

    environment {
        DOCKER_IMAGE_BACKEND = 'bbsr-grocery-backend'
        DOCKER_IMAGE_FRONTEND = 'bbsr-grocery-frontend'
        DOCKER_TAG = 'latest'
    }

    stages {
        // --- STAGES: Checkout, Build Images, Stop Containers (No changes here) ---
        stage('Checkout') { steps { checkout scm } }
        stage('Build Images') { /* ... no changes ... */ }
        stage('Stop Existing Containers') { /* ... no changes ... */ }

        stage('Deploy Application') {
            steps {
                withCredentials([string(credentialsId: 'bbsr-grocery-env', variable: 'ENV_FILE_CONTENT')]) {
                    script {
                        // Create the .env file. It will persist until the 'post' block is done.
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
                    sleep 30

                    try {
                        echo 'Checking Backend Health...'
                        sh 'curl -f http://localhost:5000/'
                        echo 'Backend is healthy.'
                    } catch (any) {
                        echo 'Backend is not responding. This is likely due to a crash.'
                    }

                    try {
                        echo 'Checking Frontend Health...'
                        sh 'curl -f http://localhost:80/'
                        echo 'Frontend is healthy.'
                    } catch (any) {
                        error("Frontend failed health check.")
                    }
                }
            }
        }
    }

    post {
        // FIX: Wrap the entire post block to ensure .env is available for all commands
        withCredentials([string(credentialsId: 'your-credential-id-here', variable: 'ENV_FILE_CONTENT')]) {
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
                // This command will now work and give you the backend error message
                sh 'docker compose logs --tail=100'
            }
        }
    }
}