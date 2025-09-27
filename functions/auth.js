import jwt from "jsonwebtoken";
import { compare, hash } from "bcrypt";
import { connectDB } from "../utils/database";
import User from "../models/User";

export const handler = async (event) => {
  try {
    await connectDB();

    const body = JSON.parse(event.body);
    if (event.path.endsWith("signup")) {
      const { name, email, password } = body;
      const hashedPass = await hash(password, 10);
      const user = await User.create({ name, email, password: hashedPass });

      return {
        statusCode: 200,
        body: JSON.stringify({ message: "user created", userId: user._id }),
      };
    }

    if (event.path.endsWith("login")) {
      const { email, password } = body;
      const user = await User.find({ email });

      if (!user) return { statusCode: 404, body: "Invalid credentials" };

      const matchPassword = await compare(password, user.password);
      if (!matchPassword)
        return { statusCode: 404, body: "Invalid credentials" };

      const token = jwt.sign({ id: user._id }, process.env.jwt_SECRET, {
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
  }
};
