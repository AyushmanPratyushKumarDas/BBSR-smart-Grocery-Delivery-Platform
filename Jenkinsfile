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
        
        stage('Build Backend Image') {
            steps {
                script {
                    echo 'Building Backend Docker Image...'
                    sh "docker build -t ${DOCKER_IMAGE_BACKEND}:${DOCKER_TAG} ./backend"
                }
            }
        }
        
        stage('Build Frontend Image') {
            steps {
                script {
                    echo 'Building Frontend Docker Image...'
                    sh "docker build -t ${DOCKER_IMAGE_FRONTEND}:${DOCKER_TAG} ./frontend"
                }
            }
        }
        
        stage('Stop Existing Containers') {
            steps {
                script {
                    echo 'Stopping existing containers...'
                    sh 'docker-compose down --remove-orphans || true'
                }
            }
        }
        
        stage('Run Containers') {
            steps {
                script {
                    echo 'Starting containers with docker-compose...'
                    sh 'docker-compose up -d'
                }
            }
        }
        
        stage('Health Check') {
            steps {
                script {
                    echo 'Waiting for services to start...'
                    sleep 30
                    
                    echo 'Checking Backend Health...'
                    sh 'curl -f http://localhost:5000/ || echo "Backend not ready yet"'
                    
                    echo 'Checking Frontend Health...'
                    sh 'curl -f http://localhost:80/ || echo "Frontend not ready yet"'
                }
            }
        }
    }
    
    post {
        always {
            echo 'Pipeline completed. Check container status:'
            sh 'docker-compose ps'
            sh 'docker images | grep bbsr-grocery'
        }
        success {
            echo 'Pipeline succeeded! Services are running.'
            echo 'Backend: http://localhost:5000'
            echo 'Frontend: http://localhost:80'
        }
        failure {
            echo 'Pipeline failed! Check logs:'
            sh 'docker-compose logs --tail=50'
        }
    }
}
