import { createParamDecorator, ExecutionContext, UnauthorizedException } from "@nestjs/common";
import { authorizationToLoginPayload } from "src/utils/base-64-converter";

export const UserId = createParamDecorator((_, ctx: ExecutionContext): string => {
  const request = ctx.switchToHttp().getRequest();
  const authorization = request.headers['authorization'];
  if (!authorization) {
    throw new UnauthorizedException('Authorization header is missing');
  }

  const [bearer, token] = authorization.split(' ');
  if (bearer !== 'Bearer' || !token) {
    throw new UnauthorizedException('Invalid authorization token format');
  }

  const loginPayload = authorizationToLoginPayload(token);

  if (!loginPayload || !loginPayload.id) {
    throw new UnauthorizedException('Invalid or expired token');
  }

  return loginPayload.id;
});