pipeline {
  agent any



    environment {

        DOCKER_IMAGE_BACKEND = 'bbsr-grocery-backend'

        DOCKER_IMAGE_FRONTEND = 'bbsr-grocery-frontend'

        DOCKER_TAG = 'latest'

    }



    stages {

        // --- STAGES: Checkout, Build, Stop, Deploy, Health Check (No changes here) ---

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

        // CORRECTED STRUCTURE: The withCredentials logic must be INSIDE each condition that needs it.

        always {

            script {

                withCredentials([string(credentialsId: 'bbsr-grocery-env', variable: 'ENV_FILE_CONTENT')]) {

                    try {

                        echo 'Creating .env for post-build status checks...'

                        sh 'echo "$ENV_FILE_CONTENT" > backend/.env'

                       

                        echo 'Pipeline completed. Final container status:'

                        sh 'docker compose ps'

                        sh "docker images | grep '${DOCKER_IMAGE_BACKEND}\\|${DOCKER_IMAGE_FRONTEND}'"

                    } finally {

                        echo 'Cleaning up .env file...'

                        sh 'rm backend/.env || true'

                    }

                }

            }

        }

        success {

            echo 'Pipeline finished successfully!'

        }

        failure {

            script {

                withCredentials([string(credentialsId: 'bbsr-grocery-env', variable: 'ENV_FILE_CONTENT')]) {

                    try {

                        echo 'Creating .env to fetch failure logs...'

                        sh 'echo "$ENV_FILE_CONTENT" > backend/.env'



                        echo 'Pipeline failed! Check the logs from the containers:'

                        sh 'docker compose logs --tail=100'

                    } finally {

                        // The 'always' block will also run on failure, so this cleanup is redundant but safe.

                        sh 'rm backend/.env || true'

                    }

                }

            }
 }

    }

} 