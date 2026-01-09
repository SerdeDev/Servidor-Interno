import { Router } from "express";
import prisma from "../../config/prismaClient.js";
import jwt from "jsonwebtoken";

const router = Router();

router.post("/login", async (req, res) => {
  console.log("Body recibido:", req.body);
  const { correo, password } = req.body;

  try {
    const user = await prisma.employees_user.findFirst({
      where: { employees_user_correo: correo },
      include: {
        employees_cargos: {
          include: {
            employees_gerencias: true
          }
        }
      }
    });

  

    if (!user) {
      return res.status(401).json({ error: "Usuario no encontrado" });
    }

    // 👇 Comparación directa en texto plano (recomendación: usar bcrypt)
    if (password !== user.employees_user_password) {
      return res.status(401).json({ error: "Credenciales inválidas" });
    }

    const role = user.employees_cargos?.employees_gerencias?.employees_gerencias_descrip;
    

    if (!process.env.JWT_SECRET) {
      return res.status(500).json({ error: "JWT_SECRET no definido en el servidor" });
    }

    const token = jwt.sign(
      { id: user.employees_user_id, role },
      process.env.JWT_SECRET,
      { expiresIn: "8h" }
    );

    // 👇 Respuesta uniforme para el frontend
    res.json({
      token,
      role,
      name: user.employees_user_name,
      surname: user.employees_user_surname // 👈 ahora sí se envía como surname
    });

  } catch (err) {
    console.error("Error en login:", err);
    res.status(500).json({ error: "Error interno", details: err.message });
  }
});

export default router;
