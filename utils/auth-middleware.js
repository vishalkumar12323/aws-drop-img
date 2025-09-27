import jwt from "jsonwebtoken";

export function verifyToken(headers) {
  const authHeader = headers.Authorization || headers.authorization;

  if (!authHeader) throw new Error("Missing Token");

  const token = authHeader.split(" ")[1];
  try {
    return jwt.verify(token, process.env.JWT_SECRET);
  } catch (error) {
    console.log("auth err: ", error);
    throw new Error("Invalid token");
  }
}
