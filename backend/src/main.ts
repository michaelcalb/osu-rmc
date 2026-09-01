import 'dotenv/config'
import { NestFactory } from '@nestjs/core'
import { AppModule } from './app.module'
import cookieParser from 'cookie-parser'
import { requireEnv } from './common/env'

async function bootstrap() {
    const app = await NestFactory.create(AppModule)

    app.use(cookieParser(requireEnv('SESSION_SECRET')))

    app.enableCors({
        origin: requireEnv('FRONTEND_URL'),
        credentials: true
    })

    app.enableShutdownHooks()
    await app.listen(process.env.PORT ?? 3000)
}
bootstrap()
