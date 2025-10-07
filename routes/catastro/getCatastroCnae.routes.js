import { Router } from "express";
import { PrismaClient } from "@prisma/client";

const router = Router();
const prisma = new PrismaClient();

router.post("/getCatastroCnae", async (req, res) => {
  try {
    const filtros = req.body;
    console.log("Filtros recibidos:", filtros.estatus.estatusComer);
    // 1. Obtén los interlocutores únicos
    const interlocutores = await prisma.catastro.findMany({
      select: { interlocutor: true },
      distinct: ["interlocutor"],
    });
    const interlocutorIds = interlocutores.map((i) => i.interlocutor);
    let operadoras = [];
    let operadorasWhere = { interlocutor: { in: interlocutorIds } };
    if (filtros.estatus.estatusComer === true)
      operadorasWhere.estatusComer = true;
    if (filtros.estatus.estatusTec === true) operadorasWhere.estatusTec = true;
    if (filtros.estatus.estatusRecau === true)
      operadorasWhere.estatusRecau = true;

    operadoras = await prisma.operadoras.findMany({
      where: operadorasWhere,
      select: {
        interlocutor: true,
        nombre: true,
        estado: true,
        municipio: true,
        servicio: true,
      },
    });

    const interlocutoresFiltrados = operadoras.map((o) => o.interlocutor);
    // 2. Haz los conteos por tipo
    const [
      residenciales,
      comerciales,
      industriales,
      noFacturable,
      totalUsuarios,
    ] = await Promise.all([
      prisma.catastro.groupBy({
        by: ["interlocutor"],

        where: {
          cnae: {
            gte: 1000,
            lte: 1999,
          },
          interlocutor: { in: interlocutoresFiltrados },
        },
        _count: {
          cuentaContrato: true,
        },
      }),
      prisma.catastro.groupBy({
        by: ["interlocutor"],
        where: {
          cnae: {
            gte: 2000,
            lte: 2999,
          },
        },
        _count: {
          cuentaContrato: true,
        },
      }),
      prisma.catastro.groupBy({
        by: ["interlocutor"],
        where: {
          cnae: {
            gte: 3000,
            lte: 3999,
          },
          interlocutor: { in: interlocutoresFiltrados },
        },
        _count: {
          cuentaContrato: true,
        },
      }),
      prisma.catastro.groupBy({
        by: ["interlocutor"],
        where: {
          cnae: {
            lt: 1000,
          },
          interlocutor: { in: interlocutoresFiltrados },
        },
        _count: {
          cuentaContrato: true,
        },
      }),
      prisma.catastro.groupBy({
        by: ["interlocutor"],
        where: {
          interlocutor: { in: interlocutoresFiltrados },
        },
        _count: {
          cuentaContrato: true,
        },
      }),
    ]);

    // 4. Une los resultados por interlocutor
    const resultado = interlocutoresFiltrados.map((id) => {
      const op = operadoras.find((o) => o.interlocutor === id);
      return {
        interlocutor: id.toString(),
        nombre: op?.nombre,
        estado: op?.estado,
        municipio: op?.municipio,
        servicio: op?.servicio,
        RESIDENCIALES: Number(
          residenciales.find((r) => r.interlocutor === id)?._count
            .cuentaContrato || 0
        ),
        COMERCIALES: Number(
          comerciales.find((r) => r.interlocutor === id)?._count
            .cuentaContrato || 0
        ),
        INDUSTRIALES: Number(
          industriales.find((r) => r.interlocutor === id)?._count
            .cuentaContrato || 0
        ),
        NOFACTURABLE: Number(
          noFacturable.find((r) => r.interlocutor === id)?._count
            .cuentaContrato || 0
        ),
        TOTAL_USUARIOS: Number(
          totalUsuarios.find((r) => r.interlocutor === id)?._count
            .cuentaContrato || 0
        ),
      };
    });
    console.log("Resultado:", resultado);
    res.status(200).json(resultado);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
