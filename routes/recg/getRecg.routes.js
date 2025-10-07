import { Router } from "express";
import { PrismaClient } from "@prisma/client";

const router = Router();
const prisma = new PrismaClient();

router.post("/getRecg", async (req, res) => {
  try {
    const filtros = req.body;
    console.log("Filtros recibidos:", filtros);
    const filtrosLimpios = Object.fromEntries(
      Object.entries(filtros).filter(
        ([, v]) => v !== null && v !== undefined && v !== ""
      )
    );

    const { estado, municipio, interlocutor, servicio } = filtrosLimpios;

    let interlocutores = null;

    if (interlocutor) {
      // Si el usuario envió interlocutor (puede ser string o array)
      interlocutores = Array.isArray(interlocutor)
        ? interlocutor
        : [interlocutor];
    } else if (estado || municipio || servicio) {
      const operadoras = await prisma.operadoras.findMany({
        where: {
          ...(estado && { estado }),
          ...(municipio && { municipio }),
          ...(servicio && { servicio }),
        },
        select: { interlocutor: true },
      });
      interlocutores = operadoras.map((op) => op.interlocutor);
      if (interlocutores.length === 0) {
        return res.status(200).json([]); // No hay interlocutores, devolver vacío
      }
    }

    const recg = await prisma.recg.findMany({
      where: {
        ...(interlocutores && { interlocutor: { in: interlocutores } }),
      },
    });

    const recgSerializado = JSON.parse(
      JSON.stringify(recg, (key, value) =>
        typeof value === "bigint" ? value.toString() : value
      )
    );

    res.status(200).json(recgSerializado);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
