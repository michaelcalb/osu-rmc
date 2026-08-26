import { CanActivate, Injectable, NotFoundException } from "@nestjs/common";

@Injectable()
export class DevRoutesGuard implements CanActivate {
    canActivate(): boolean {
        if (process.env.ENABLE_DEV_ROUTES !== 'true') {
            throw new NotFoundException()
        }

        return true
    }
}