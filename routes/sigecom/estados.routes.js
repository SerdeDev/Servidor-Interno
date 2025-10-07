import { Router } from "express";
import { PrismaClient } from "@prisma/client";

const router = Router();
const prisma = new PrismaClient();

router.get("/estados", async (req, res) => {
  try {
    const estados = await prisma.sigecom.groupBy({
      by: ["estadoCC", "municipioCC", "parroquiaCC"],
    });
    res.status(200).json(estados);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
