import { Router } from "express";
import { PrismaClient } from "@prisma/client";
import { Decimal } from "@prisma/client/runtime/library";

const router = Router();
const prisma = new PrismaClient();

router.post("/getDeudaCnae", async (req, res) => {
  try {
    const filtros = req.body;

    // 1. Obtener interlocutores únicos desde deudaTotal
    const interlocutores = await prisma.deudaTotal.findMany({
      select: { interlocutor: true },
      distinct: ["interlocutor"],
    });
    const interlocutorIds = interlocutores.map((i) => i.interlocutor);

    // 2. Filtrar operadoras_mod según interlocutores
    const operadoras = await prisma.operadoras_mod.findMany({
      where: { interlocutor: { in: interlocutorIds } },
      select: {
        interlocutor: true,
        nombre: true,
        estado: true,
        municipio: true,
        servicio: true,
      },
    });
    const interlocutoresFiltrados = operadoras.map((o) => o.interlocutor);

    // 3. Consultas en serie (una por una)
    const residenciales = await prisma.deudaTotal.groupBy({
      by: ["interlocutor"],
      where: {
        cnae: { gte: 1000, lte: 1999 },
        interlocutor: { in: interlocutoresFiltrados },
      },
      _count: { cuentaContrato: true },
    });

    const deudaResidenciales = await prisma.deudaTotal.groupBy({
      by: ["interlocutor"],
      where: {
        cnae: { gte: 1000, lte: 1999 },
        interlocutor: { in: interlocutoresFiltrados },
      },
      _sum: { total: true },
    });

    const comerciales = await prisma.deudaTotal.groupBy({
      by: ["interlocutor"],
      where: {
        cnae: { gte: 2000, lte: 2999 },
        interlocutor: { in: interlocutoresFiltrados },
      },
      _count: { cuentaContrato: true },
    });

    const deudaComerciales = await prisma.deudaTotal.groupBy({
      by: ["interlocutor"],
      where: {
        cnae: { gte: 2000, lte: 2999 },
        interlocutor: { in: interlocutoresFiltrados },
      },
      _sum: { total: true },
    });

    const industriales = await prisma.deudaTotal.groupBy({
      by: ["interlocutor"],
      where: {
        cnae: { gte: 3000, lte: 3999 },
        interlocutor: { in: interlocutoresFiltrados },
      },
      _count: { cuentaContrato: true },
    });

    const deudaIndustriales = await prisma.deudaTotal.groupBy({
      by: ["interlocutor"],
      where: {
        cnae: { gte: 3000, lte: 3999 },
        interlocutor: { in: interlocutoresFiltrados },
      },
      _sum: { total: true },
    });

    const noFacturable = await prisma.deudaTotal.groupBy({
      by: ["interlocutor"],
      where: {
        cnae: { lt: 1000 },
        interlocutor: { in: interlocutoresFiltrados },
      },
      _count: { cuentaContrato: true },
    });

    const deudaNoFacturable = await prisma.deudaTotal.groupBy({
      by: ["interlocutor"],
      where: {
        cnae: { lt: 1000 },
        interlocutor: { in: interlocutoresFiltrados },
      },
      _sum: { total: true },
    });

    const totalUsuarios = await prisma.deudaTotal.groupBy({
      by: ["interlocutor"],
      where: { interlocutor: { in: interlocutoresFiltrados } },
      _count: { cuentaContrato: true },
    });

    const deudaTotalUsuarios = await prisma.deudaTotal.groupBy({
      by: ["interlocutor"],
      where: { interlocutor: { in: interlocutoresFiltrados } },
      _sum: { total: true },
    });

    // 4. Unir resultados
    const resultado = interlocutoresFiltrados.map((id) => {
      const op = operadoras.find((o) => o.interlocutor === id);
      return {
        interlocutor: id.toString(),
        nombre: op?.nombre,
        estado: op?.estado,
        municipio: op?.municipio,
        servicio: op?.servicio,
        RESIDENCIALES:
          residenciales.find((r) => r.interlocutor === id)?._count
            .cuentaContrato || 0,
        DEUDA_R: Number(
          deudaResidenciales.find((r) => r.interlocutor === id)?._sum.total || 0
        ),
        COMERCIALES:
          comerciales.find((r) => r.interlocutor === id)?._count
            .cuentaContrato || 0,
        DEUDA_C: Number(
          deudaComerciales.find((r) => r.interlocutor === id)?._sum.total || 0
        ),
        INDUSTRIALES:
          industriales.find((r) => r.interlocutor === id)?._count
            .cuentaContrato || 0,
        DEUDA_I: Number(
          deudaIndustriales.find((r) => r.interlocutor === id)?._sum.total || 0
        ),
        NOFACTURABLE:
          noFacturable.find((r) => r.interlocutor === id)?._count
            .cuentaContrato || 0,
        DEUDA_NOFAC: Number(
          deudaNoFacturable.find((r) => r.interlocutor === id)?._sum.total || 0
        ),
        TOTAL_USUARIOS:
          totalUsuarios.find((r) => r.interlocutor === id)?._count
            .cuentaContrato || 0,
        DEUDA_TOTAL: Number(
          deudaTotalUsuarios.find((r) => r.interlocutor === id)?._sum.total || 0
        ),
      };
    });

    console.log("Resultado:", resultado);
    res.status(200).json(resultado);
  } catch (error) {
    console.error("Error en /getDeudaCnae:", error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
