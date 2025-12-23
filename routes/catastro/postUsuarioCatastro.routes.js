import { Router } from "express";
import pkg from "@prisma/client";
const { PrismaClient } = pkg;

const router = Router();
const prisma = new PrismaClient();

router.post("/postUsuarioCatastro", async (req, res) => {
  try {
    const data = req.body;
    console.log(data);
    const usuarios = await prisma.catastro.findMany({
      where: {
        cedula: {
          contains: data.cedula,
          mode: "insensitive",
        },
      },
    });

    // Convertir BigInt a string
    const usuariosSerializados = usuarios.map((op) => {
      const serializado = {};
      for (const key in op) {
        const valor = op[key];
        serializado[key] = typeof valor === "bigint" ? valor.toString() : valor;
      }
      return serializado;
    });

    res.status(200).json(usuariosSerializados);
  } catch (error) {
    console.error("Error en el backend:", error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
