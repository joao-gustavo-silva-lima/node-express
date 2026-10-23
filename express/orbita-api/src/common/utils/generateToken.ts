import jwt from "jsonwebtoken";

export default function generateToken(username: string) {
  return jwt.sign({ authUsername: username }, process.env.JWT_SECRET!, {
    expiresIn: "1Day",
  });
}
