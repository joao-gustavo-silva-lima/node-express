import type { CorsOptions, CorsOptionsDelegate } from "cors";

const credentialedRoutes: (string | RegExp)[] = [/\/user\/auth/, /\/link/];

const corsOptionsMiddleware: CorsOptionsDelegate = function (req, callback) {
  const reqPath = (req as any).path as string;

  const isCredentialedRoute = credentialedRoutes.some((route) =>
    typeof route === "string" ? reqPath.includes(route) : route.test(reqPath),
  );

  var corsOptions: CorsOptions = {
    origin: process.env.FRONT_END_URL!,
    credentials: isCredentialedRoute,
  };

  callback(null, corsOptions);
};

export default corsOptionsMiddleware;
