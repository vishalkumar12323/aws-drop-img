import jwt from "jsonwebtoken";
import { compare, hash } from "bcrypt";
import { client } from "../utils/database";

export const handler = async (event) => {
  try {
    await client.connect();

    const body = JSON.parse(event.body);
    if (event.path.endsWith("signup")) {
      const { name, email, password } = body;
      const hashedPass = await hash(password, 10);

      const query = `
        INSERT INTO users (fullname, email, password)
        VALUES ($1, $2, $3)
        RETURNING *;
      `;

      const user = await client.query(query, [name, email, hashedPass]);
      return {
        statusCode: 200,
        body: JSON.stringify({
          message: "user created",
          userId: user.rows[0].id,
        }),
      };
    }

    if (event.path.endsWith("login")) {
      const { email, password } = body;

      const query = `
        SELECT * FROM users
        WHERE email = $1;
      `;
      const user = await client.query(query, [email]);

      if (!user.rows[0])
        return { statusCode: 404, body: "Invalid credentials" };

      const matchPassword = await compare(password, user.rows[0].password);
      if (!matchPassword)
        return { statusCode: 404, body: "Invalid credentials" };

      const token = jwt.sign({ id: user.rows[0].id }, process.env.jwt_SECRET, {
        expiresIn: "1h",
      });
      return {
        statusCode: 200,
        message: JSON.stringify({ token }),
      };
    }

    return { statusCode: 400, message: "Invalid route" };
  } catch (error) {
    console.log("auth handler err: ", error);
    return {
      statusCode: 500,
      message: JSON.stringify({ error: error.message }),
    };
  } finally {
    await client.end();
  }
};
