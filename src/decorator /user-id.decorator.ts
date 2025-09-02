import { createParamDecorator, ExecutionContext, UnauthorizedException } from "@nestjs/common";
import { authorizationToLoginPayload } from "src/utils/base-64-converter";

export const UserId = createParamDecorator((_, ctx: ExecutionContext): string => {
  const request = ctx.switchToHttp().getRequest();
  const authorization = request.headers['authorization'];
        console.log(authorization)
  // Verifica se o header Authorization está presente
  if (!authorization) {
    throw new UnauthorizedException('Authorization header is missing');
  }

  // Verifica se o token está no formato correto (Bearer <token>)
  const [bearer, token] = authorization.split(' ');
  if (bearer !== 'Bearer' || !token) {
    throw new UnauthorizedException('Invalid authorization token format');
  }

  // Extrai o payload do token
  const loginPayload = authorizationToLoginPayload(token);

  // Verifica se o payload foi extraído corretamente
  if (!loginPayload || !loginPayload.id) {
    throw new UnauthorizedException('Invalid or expired token');
  }

  return loginPayload.id;
});