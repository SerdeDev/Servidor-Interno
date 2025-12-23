import { Router } from "express";
import pkg from "@prisma/client";
const { PrismaClient } = pkg;

const router = Router();
const prisma = new PrismaClient();

router.post("/getoperadorasFiltradas", async (req, res) => {
  const { estado, municipio } = req.body;
  console.log("📥 Filtros recibidos:", { estado, municipio });

  if (!estado || !municipio) {
    return res.status(400).json({ error: "Estado y municipio requeridos" });
  }

  try {
    // 1. Buscar operadoras por estado y municipio
    const operadoras = await prisma.operadoras_mod.findMany({
      where: { estado, municipio },
    });

    console.log(`📍 Operadoras encontradas: ${operadoras.length}`);
    if (operadoras.length === 0) return res.status(200).json([]);

    // 2. Extraer interlocutores
    const interlocutores = operadoras.map((op) => op.interlocutor);

    // 3. Buscar cuentas contrato en catastro asociadas a esos interlocutores
    const cuentas = await prisma.catastro.findMany({
      where: {
        interlocutor: { in: interlocutores },
      },
      select: {
        cuentaContrato: true,
      },
    });

    // 4. Convertir BigInt a string y eliminar duplicados
    const cuentasContrato = [
      ...new Set(cuentas.map((c) => c.cuentaContrato.toString())),
    ];

    console.log(
      `🔍 Cuentas contrato encontradas en catastro: ${cuentasContrato.length}`
    );
    console.table(cuentasContrato);

    res.status(200).json(cuentasContrato);
  } catch (error) {
    console.error("❌ Error en getoperadorasFiltradas:", error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
