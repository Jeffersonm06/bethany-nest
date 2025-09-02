import { LoginPayload } from '../auth/dtos/loginPayload';

export const authorizationToLoginPayload = (
  authorization: string | undefined,
): LoginPayload | undefined => {
  if (!authorization) {
    return undefined;
  }

  const authorizationSplited = authorization.split('.');

  if (authorizationSplited.length < 3 || !authorizationSplited[1]) {
    return undefined;
  }

  try {
    return JSON.parse(
      Buffer.from(authorizationSplited[1], 'base64').toString('ascii'),
    );
  } catch (error) {
    return undefined;
  }
};