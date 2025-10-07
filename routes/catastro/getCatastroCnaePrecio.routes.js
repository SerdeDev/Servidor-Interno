import { Router } from "express";
import { PrismaClient } from "@prisma/client";

const router = Router();
const prisma = new PrismaClient();

router.post("/getCatastroCnaePrecio", async (req, res) => {
  try {
    const filtros = req.body;

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

    const [
      residenciales,
      comerciales,
      industriales,
      residenciales_0,
      comerciales_0,
      industriales_0,
      noFacturable_0,
      totalUsuarios,
      nofacturableA,
      nofacturableB,
    ] = await Promise.all([
      //residenciales
      prisma.catastro.groupBy({
        by: ["interlocutor"],
        where: {
          cnae: {
            gte: 1000,
            lte: 1999,
          },
          monto: {
            gte: 0,
          },
          tarifa: {
            not: {
              endsWith: "00",
            },
          },
        },
        _count: {
          cuentaContrato: true,
        },
      }),
      // comerciales
      prisma.catastro.groupBy({
        by: ["interlocutor"],
        where: {
          cnae: {
            gte: 2000,
            lte: 2999,
          },
          monto: {
            gte: 0,
          },
          tarifa: {
            not: {
              endsWith: "00",
            },
          },
        },
        _count: {
          cuentaContrato: true,
        },
      }),
      // industriales
      prisma.catastro.groupBy({
        by: ["interlocutor"],
        where: {
          cnae: {
            gte: 3000,
            lte: 3999,
          },
          monto: {
            gte: 0,
          },
          tarifa: {
            not: {
              endsWith: "00",
            },
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
            gte: 1000,
            lte: 1999,
          },
          monto: {
            equals: 0,
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
            gte: 2000,
            lte: 2999,
          },
          monto: {
            equals: 0,
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
          monto: {
            equals: 0,
          },
          tarifa: {
            not: {
              endsWith: "00",
            },
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
            lt: 1000,
          },
          monto: {
            equals: 0,
          },
          tarifa: {
            not: {
              endsWith: "00",
            },
          },
        },
        _count: {
          cuentaContrato: true,
        },
      }),

      prisma.catastro.groupBy({
        by: ["interlocutor"],
        // Sin filtro, trae todos
        _count: {
          cuentaContrato: true,
        },
      }),
      prisma.catastro.groupBy({
        by: ["interlocutor"],
        where: {
          tarifa: { endsWith: "00" },
        },
        _count: { cuentaContrato: true },
      }),
      prisma.catastro.groupBy({
        by: ["interlocutor"],
        where: {
          tarifa: { not: { endsWith: "00" } },
          cnae: { lte: 3 },
          monto: { gt: 0 },
        },
        _count: { cuentaContrato: true },
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
          (nofacturableA.find((r) => r.interlocutor === id)?._count
            .cuentaContrato || 0) +
            (nofacturableB.find((r) => r.interlocutor === id)?._count
              .cuentaContrato || 0)
        ),
        RESIDENCIALES_0: Number(
          residenciales_0.find((r) => r.interlocutor === id)?._count
            .cuentaContrato || 0
        ),
        COMERCIALES_0: Number(
          comerciales_0.find((r) => r.interlocutor === id)?._count
            .cuentaContrato || 0
        ),
        INDUSTRIALES_0: Number(
          industriales_0.find((r) => r.interlocutor === id)?._count
            .cuentaContrato || 0
        ),
        NOFACTURABLE_0: Number(
          noFacturable_0.find((r) => r.interlocutor === id)?._count
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
