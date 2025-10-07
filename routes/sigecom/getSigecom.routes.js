import { Router } from "express";
import { PrismaClient } from "@prisma/client";

const router = Router();
const prisma = new PrismaClient();

router.post("/getSigecom", async (req, res) => {
  try {
    const filtros = req.body;
    // Limpiar filtros: eliminar claves con valores null, undefined o string vacío
    const filtrosLimpios = Object.fromEntries(
      Object.entries(filtros).filter(
        ([, v]) => v !== null && v !== undefined && v !== ""
      )
    );
    const estados = await prisma.sigecom.findMany({
      where: filtrosLimpios,
    });
    res.status(200).json(estados);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
