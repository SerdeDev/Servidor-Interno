import { Router } from "express";
import { PrismaClient } from "@prisma/client";

const router = Router();
const prisma = new PrismaClient();

router.post("/getDeudaEstado", async (req, res) => {
  try {
    const filtros = req.body;

    const interlocutores = await prisma.deudaTotal.findMany({
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
      deudaResidenciales,
      comerciales,
      deudaComerciales,
      industriales,
      deudaIndustriales,
      noFacturable,
      deudaNoFacturable,
      totalUsuarios,
      deudaTotalUsuarios,
    ] = await Promise.all([
      prisma.deudaTotal.groupBy({
        by: ["interlocutor"],
        where: {
          cnae: {
            gte: 1000,
            lte: 1999,
          },
        },
        _count: {
          cuentaContrato: true,
        },
      }),
      prisma.deudaTotal.groupBy({
        by: ["interlocutor"],
        where: {
          cnae: {
            gte: 1000,
            lte: 1999,
          },
        },
        _sum: {
          total: true,
        },
      }),
      prisma.deudaTotal.groupBy({
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
      prisma.deudaTotal.groupBy({
        by: ["interlocutor"],
        where: {
          cnae: {
            gte: 2000,
            lte: 2999,
          },
        },
        _sum: {
          total: true,
        },
      }),
      prisma.deudaTotal.groupBy({
        by: ["interlocutor"],
        where: {
          cnae: {
            gte: 3000,
            lte: 3999,
          },
        },
        _count: {
          cuentaContrato: true,
        },
      }),
      prisma.deudaTotal.groupBy({
        by: ["interlocutor"],
        where: {
          cnae: {
            gte: 3000,
            lte: 3999,
          },
        },
        _sum: {
          total: true,
        },
      }),
      prisma.deudaTotal.groupBy({
        by: ["interlocutor"],
        where: {
          cnae: {
            lt: 1000,
          },
        },
        _count: {
          cuentaContrato: true,
        },
      }),
      prisma.deudaTotal.groupBy({
        by: ["interlocutor"],
        where: {
          cnae: {
            lt: 1000,
          },
        },
        _sum: {
          total: true,
        },
      }),
      prisma.deudaTotal.groupBy({
        by: ["interlocutor"],
        // Sin filtro, trae todos
        _count: {
          cuentaContrato: true,
        },
      }),
      prisma.deudaTotal.groupBy({
        by: ["interlocutor"],
        // Sin filtro, trae todos
        _sum: {
          total: true,
        },
      }),
    ]);

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
        DEUDA_R: Number(
          deudaResidenciales.find((r) => r.interlocutor === id)?._sum.total || 0
        ),
        COMERCIALES: Number(
          comerciales.find((r) => r.interlocutor === id)?._count
            .cuentaContrato || 0
        ),
        DEUDA_C: Number(
          deudaComerciales.find((r) => r.interlocutor === id)?._sum.total || 0
        ),
        INDUSTRIALES: Number(
          industriales.find((r) => r.interlocutor === id)?._count
            .cuentaContrato || 0
        ),
        DEUDA_I: Number(
          deudaIndustriales.find((r) => r.interlocutor === id)?._sum.total || 0
        ),
        NOFACTURABLE: Number(
          noFacturable.find((r) => r.interlocutor === id)?._count
            .cuentaContrato || 0
        ),
        DEUDA_NOFAC: Number(
          deudaNoFacturable.find((r) => r.interlocutor === id)?._sum.total || 0
        ),
        TOTAL_USUARIOS: Number(
          totalUsuarios.find((r) => r.interlocutor === id)?._count
            .cuentaContrato || 0
        ),
        DEUDA_TOTAL: Number(
          deudaTotalUsuarios.find((r) => r.interlocutor === id)?._sum.total || 0
        ),
      };
    });

    // Agrupar por estado y sumar los valores
    const resultadoPorEstado = Object.values(
      resultado.reduce((acc, curr) => {
        const estado = curr.estado || "SIN_ESTADO";
        if (!acc[estado]) {
          acc[estado] = {
            estado,
            RESIDENCIALES: 0,
            DEUDA_R: 0,
            COMERCIALES: 0,
            DEUDA_C: 0,
            INDUSTRIALES: 0,
            DEUDA_I: 0,
            NOFACTURABLE: 0,
            DEUDA_NOFAC: 0,
            TOTAL_USUARIOS: 0,
            DEUDA_TOTAL: 0,
          };
        }
        acc[estado].RESIDENCIALES += curr.RESIDENCIALES;
        acc[estado].DEUDA_R += curr.DEUDA_R;
        acc[estado].COMERCIALES += curr.COMERCIALES;
        acc[estado].DEUDA_C += curr.DEUDA_C;
        acc[estado].INDUSTRIALES += curr.INDUSTRIALES;
        acc[estado].DEUDA_I += curr.DEUDA_I;
        acc[estado].NOFACTURABLE += curr.NOFACTURABLE;
        acc[estado].DEUDA_NOFAC += curr.DEUDA_NOFAC;
        acc[estado].TOTAL_USUARIOS += curr.TOTAL_USUARIOS;
        acc[estado].DEUDA_TOTAL += curr.DEUDA_TOTAL;
        return acc;
      }, {})
    );

    console.log("Resultado por estado:", resultadoPorEstado);
    res.status(200).json(resultadoPorEstado);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
