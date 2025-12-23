import { Router } from "express";
import pkg from "@prisma/client";
const { PrismaClient } = pkg;

const router = Router();
const prisma = new PrismaClient();

router.get("/operadoras", async (req, res) => {
  try {
    // Usamos el modelo correcto: operadoras_mod
    const operadoras = await prisma.operadoras_mod.findMany();

    // Convertir BigInt a string para evitar problemas en JSON
    const operadorasParsed = operadoras.map((op) => ({
      ...op,
      interlocutor: op.interlocutor.toString(),
    }));

    console.log(operadorasParsed);
    res.status(200).json(operadorasParsed);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
