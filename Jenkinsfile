// 프로파일마다 다른 것 중 비밀이 아닌 것은 여기에, 비밀은 Jenkins Credentials 에 둔다.
//   envFile     → Secret file credential. API_BASE_URL · JUSO_API_KEY · KAKAO_REST_API_KEY 값 파일 전체를 올려 두고, 배포 때
//                 APP_DIR 에 놓아 컨테이너의 /app/.env.production 으로 마운트한다. 이미지에는 들어가지 않는다.
//                 next start 는 두 프로파일 모두 NODE_ENV=production 이라 컨테이너 안 경로는 같다.
//   port        → 이 서버에서 열 포트. dev · prod 가 한 서버에 같이 뜨므로 겹치면 안 된다(api 는 8001 · 8000, staff 는 4001 · 4000).
// 배포 방식: Jenkins 가 설치된 서버에서 이미지를 빌드해 ECR 에 올리고, 같은 서버에서 그 ECR 이미지를 받아 컨테이너를 띄운다(SSH 없음).
//   ECR 로그인은 AWS credential(AWS_CRED)로 받은 토큰을 쓴다. Jenkins 에 aws CLI 와 AWS Credentials 플러그인이 있어야 한다.
def PROFILES = [
  dev : [envFile: 'whale-erp-front-env-dev',  port: '3001'],
  prod: [envFile: 'whale-erp-front-env-prod', port: '3000'],
]

pipeline {
  agent any // Jenkins 서버 자신. jenkins 사용자가 docker 를 쓸 수 있어야 한다(docker 그룹). node · pnpm 은 필요 없다(이미지 안에서 빌드한다).

  parameters {
    choice(name: 'PROFILE', choices: ['dev', 'prod'], description: '배포 프로파일')
  }

  environment {
    AWS_DEFAULT_REGION = 'ap-northeast-2'
    REGISTRY = '494501706948.dkr.ecr.ap-northeast-2.amazonaws.com'
    IMAGE    = "${REGISTRY}/interplug/whale-erp-front"
    AWS_CRED = 'whale-erp-aws'
    APP_DIR  = '/opt/whale-erp-front'
  }

  options {
    disableConcurrentBuilds()
    timestamps()
  }

  stages {
    stage('Prepare') {
      steps {
        script {
          def cfg = PROFILES[params.PROFILE]
          // 잡에 파라미터가 아직 등록되지 않은 첫 실행은 params 에 기본값만 들어오고 sh 의 $PROFILE 은 비므로 직접 넣는다.
          env.PROFILE = params.PROFILE
          env.ENV_FILE_CRED = cfg.envFile
          env.HOST_PORT = cfg.port
          env.TAG = "${params.PROFILE}-${env.GIT_COMMIT.take(8)}-${env.BUILD_NUMBER}"
          currentBuild.displayName = "#${env.BUILD_NUMBER} ${env.TAG}"
        }
      }
    }

    stage('Build') {
      steps {
        sh 'docker build -t $IMAGE:$TAG -t $IMAGE:$PROFILE-latest .'
      }
    }

    stage('Push') {
      steps {
        withCredentials([aws(credentialsId: env.AWS_CRED)]) {
          sh '''
            aws ecr get-login-password | docker login --username AWS --password-stdin "$REGISTRY"
            docker push $IMAGE:$TAG
            docker push $IMAGE:$PROFILE-latest
          '''
        }
      }
    }

    stage('Approve') {
      when { expression { params.PROFILE == 'prod' } }
      steps {
        input message: "운영에 ${env.TAG} 를 배포할까요?", ok: '배포'
      }
    }

    stage('Deploy') {
      steps {
        withCredentials([
          file(credentialsId: env.ENV_FILE_CRED, variable: 'ENV_FILE'),
          aws(credentialsId: env.AWS_CRED),
        ]) {
          // 디렉터리는 700 으로 서버의 다른 사용자를 막고, 파일은 644 로 둔다 — 컨테이너의 node 사용자(uid 1000)가
          // 마운트된 파일을 읽어야 하기 때문이다.
          // 마운트하는 이유: docker run --env-file 은 따옴표를 벗기지 않아, dotenv 로 읽던 따옴표 값이 다르게 들어간다.
          sh '''
            mkdir -p $APP_DIR && chmod 700 $APP_DIR
            install -m 644 "$ENV_FILE" $APP_DIR/.env.$PROFILE

            # 운영 승인을 기다리는 동안 토큰(12시간)이 끝날 수 있어 다시 로그인한다.
            aws ecr get-login-password | docker login --username AWS --password-stdin "$REGISTRY"
            docker pull $IMAGE:$TAG

            (docker rm -f whale-erp-front-$PROFILE || true)
            docker run -d --name whale-erp-front-$PROFILE --restart unless-stopped \
              -p $HOST_PORT:3000 \
              -v $APP_DIR/.env.$PROFILE:/app/.env.production:ro \
              $IMAGE:$TAG

            # 값 파일이 잘못돼 next 가 프로세스를 띄운 채 요청마다 500 을 낼 수 있으므로,
            # 로그인 화면이 실제로 열리는지까지 확인한다.
            # Jenkins 가 컨테이너 안에서 돌아 localhost 는 Jenkins 자신이다 — 호스트에 뜬 앱은 host.docker.internal 로 본다.
            for i in $(seq 1 30); do
              curl -sf host.docker.internal:$HOST_PORT/login >/dev/null && exit 0
              sleep 2
            done
            docker logs --tail 50 whale-erp-front-$PROFILE
            exit 1
          '''
        }
      }
    }
  }

  post {
    // 성공했을 때만 빌드 캐시를 비운다. -a 를 붙이지 않아 지금 이미지가 쓰는 층(의존성 설치 층)의 캐시는 남는다.
    success { sh 'docker builder prune -f || true' }
    always { sh 'docker image prune -f || true' }
  }
}
