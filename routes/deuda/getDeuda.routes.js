import { Router } from "express";
import { PrismaClient } from "@prisma/client";

const router = Router();
const prisma = new PrismaClient();

router.post("/getDeuda", async (req, res) => {
  res.setTimeout(120000); // ⏱️ Timeout de 2 minutos

  const inicio = Date.now(); // 🧭 Marca de tiempo inicial

  try {
    const filtros = req.body;
    console.log("Filtros recibidos:", filtros);

    // Limpieza de filtros: elimina null, undefined y ""
    const filtrosLimpios = Object.fromEntries(
      Object.entries(filtros).filter(
        ([, v]) => v !== null && v !== undefined && v !== ""
      )
    );

    const { estado, municipio, interlocutor, servicio, ...filtrosDeuda } =
      filtrosLimpios;

    let interlocutores = null;

    // Si viene interlocutor directamente
    if (interlocutor) {
      interlocutores = Array.isArray(interlocutor)
        ? interlocutor
        : [interlocutor];
    } else if (
      (estado || municipio || servicio) &&
      !filtrosDeuda.cedula &&
      !filtrosDeuda.cuentaContrato
    ) {
      // ⚠️ Usar operadoras_mod en lugar de operadoras
      const operadoras = await prisma.operadoras_mod.findMany({
        where: {
          ...(estado && { estado }),
          ...(municipio && { municipio }),
          ...(servicio && { servicio }),
        },
        select: { interlocutor: true },
      });
      interlocutores = operadoras.map((op) => op.interlocutor);
      if (interlocutores.length === 0) {
        return res.status(200).json([]);
      }
    }

    // Separar filtros CNAE
    const {
      cnaeResidencial,
      cnaeComercial,
      cnaeIndustrial,
      cnaeNoFaturable,
      ...filtrosDeudaSinCnae
    } = filtrosDeuda;

    let deuda = [];

    const baseWhere = {
      ...filtrosDeudaSinCnae,
      ...(interlocutores && { interlocutor: { in: interlocutores } }),
    };

    const filtrosCNAE = [];

    if (cnaeResidencial) {
      filtrosCNAE.push({
        ...baseWhere,
        cnae: { gte: 1000, lte: 1999 },
      });
    }
    if (cnaeComercial) {
      filtrosCNAE.push({
        ...baseWhere,
        cnae: { gte: 2000, lte: 2999 },
      });
    }
    if (cnaeIndustrial) {
      filtrosCNAE.push({
        ...baseWhere,
        cnae: { gte: 3000, lte: 3999 },
      });
    }
    if (cnaeNoFaturable) {
      filtrosCNAE.push({
        ...baseWhere,
        cnae: { lte: 1000 },
      });
    }

    // Consulta principal
    if (filtrosCNAE.length === 0) {
      deuda = await prisma.deudaTotal.findMany({
        where: baseWhere,
        // skip: 0, take: 100, // opcional: paginación
      });
    } else {
      const consultas = filtrosCNAE.map((where) =>
        prisma.deudaTotal.findMany({ where })
      );
      const resultados = await Promise.all(consultas);
      deuda = resultados.flat();
    }

    // Serializar BigInt a string
    const deudaSerializado = JSON.parse(
      JSON.stringify(deuda, (key, value) =>
        typeof value === "bigint" ? value.toString() : value
      )
    );

    const duracion = Date.now() - inicio;
    console.log(`Consulta completada en ${duracion} ms`);

    res.status(200).json(deudaSerializado);
  } catch (error) {
    console.error("Error en /getDeuda:", error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
