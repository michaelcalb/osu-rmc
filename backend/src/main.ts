import 'dotenv/config'
import { NestFactory } from '@nestjs/core'
import type { NestExpressApplication } from '@nestjs/platform-express'
import { AppModule } from './app.module'
import cookieParser from 'cookie-parser'
import { requireEnv } from './common/env'

async function bootstrap() {
    const app = await NestFactory.create<NestExpressApplication>(AppModule)

    app.set('trust proxy', 'loopback')

    app.use(cookieParser(requireEnv('SESSION_SECRET')))

    app.enableCors({
        origin: requireEnv('FRONTEND_URL'),
        credentials: true,
        exposedHeaders: ['Retry-After']
    })

    app.enableShutdownHooks()
    await app.listen(process.env.PORT ?? 3000)
}
bootstrap()
