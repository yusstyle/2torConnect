import "dotenv/config";
import app from "../artifacts/api-server/dist/index.cjs";

export default function handler(req: any, res: any) {
  return app(req, res, (err?: unknown) => {
    if (err) {
      console.error(err);
      res.statusCode = 500;
      res.end("Internal Server Error");
    }
  });
}
