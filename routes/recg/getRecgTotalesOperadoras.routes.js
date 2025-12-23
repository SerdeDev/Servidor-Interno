import { Router } from "express";
import pkg from "@prisma/client";
const { PrismaClient } = pkg;

const router = Router();
const prisma = new PrismaClient();

router.post("/getRecgTotalesOperadoras", async (req, res) => {
  try {
    const filtros = req.body;
    console.log("Filtros recibidos:", filtros);

    const filtrosLimpios = Object.fromEntries(
      Object.entries(filtros).filter(
        ([, v]) => v !== null && v !== undefined && v !== ""
      )
    );

    // 📌 Construir rango de fechas
    let rangoFechas = {};
    if (filtrosLimpios.mesSeleccionado) {
      // Ejemplo: "2025-12"
      const [año, mes] = filtrosLimpios.mesSeleccionado.split("-");
      const fechaInicio = new Date(`${año}-${mes}-01T00:00:00Z`);
      const fechaFin = new Date(fechaInicio);
      fechaFin.setMonth(fechaFin.getMonth() + 1); // primer día del siguiente mes

      console.log("Filtro de mes:", { fechaInicio, fechaFin });

      rangoFechas = {
        fecha: {
          gte: fechaInicio,
          lt: fechaFin,
        },
      };
    } else if (filtrosLimpios.fechaInicio && filtrosLimpios.fechaFin) {
      // Si vienen fechas explícitas
      rangoFechas = {
        fecha: {
          gte: new Date(filtrosLimpios.fechaInicio),
          lt: new Date(filtrosLimpios.fechaFin),
        },
      };
    }

    // Obtener interlocutores únicos desde recg
    const interlocutoresRecg = await prisma.recg.findMany({
      select: { interlocutor: true },
      distinct: ["interlocutor"],
    });

    const interlocutorIds = interlocutoresRecg.map((i) => i.interlocutor);

    // Obtener operadoras filtradas
    let operadorasWhere = { interlocutor: { in: interlocutorIds } };

    const operadoras = await prisma.operadoras_mod.findMany({
      where: operadorasWhere,
    });

    // 📌 Aplicar filtro de fechas en recg
    console.log("Aplicando filtro:", rangoFechas);

    const registrosRecg = await prisma.recg.findMany({
      where: {
        interlocutor: { in: operadoras.map((o) => o.interlocutor) },
        ...rangoFechas,
      },
    });

    // Combinar registros con operadoras
    const registros = registrosRecg.map((rec) => {
      const operadora = operadoras.find(
        (op) => op.interlocutor === rec.interlocutor
      );
      return {
        ...rec,
        operadora: operadora || {},
      };
    });

    const resultado = {};

    for (const rec of registros) {
      const nombre = rec.operadora.nombre || "Sin nombre";
      const servicio = rec.operadora.servicio?.trim();
      const producto = rec.producto;

      if (!resultado[nombre]) {
        resultado[nombre] = {
          nombre,
          CANTIDAD_FAGE: 0,
          FAGE_ASEO: 0,
          FAGE_RELL: 0,
          CANTIDAD_FACO: 0,
          FACO_ASEO: 0,
          FACO_RELL: 0,
          TOTAL: 0,
        };
      }

      const montoTotal = Number(
        Number(rec.monto || 0) +
          Number(rec.iva || 0) +
          Number(rec.montoPlus || 0) +
          Number(rec.ivaPlus || 0)
      );

      if (producto === "FACTURAS GENERADAS") {
        resultado[nombre].CANTIDAD_FAGE += rec.cantidad || 0;
        if (servicio && servicio.toUpperCase().includes("ASEO"))
          resultado[nombre].FAGE_ASEO += montoTotal;
        if (servicio && servicio.toUpperCase().includes("RELL"))
          resultado[nombre].FAGE_RELL += montoTotal;
      }

      if (producto === "FACTURAS COBRADAS") {
        resultado[nombre].CANTIDAD_FACO += rec.cantidad || 0;
        if (servicio && servicio.toUpperCase().includes("ASEO"))
          resultado[nombre].FACO_ASEO += montoTotal;
        if (servicio && servicio.toUpperCase().includes("RELL"))
          resultado[nombre].FACO_RELL += montoTotal;
      }

      resultado[nombre].TOTAL += montoTotal;
    }

    const resumen = Object.values(resultado);

    const recgSerializado = JSON.parse(
      JSON.stringify(resumen, (key, value) =>
        typeof value === "bigint" ? value.toString() : value
      )
    );

    res.status(200).json(recgSerializado);
  } catch (error) {
    console.error("Error interno:", error);
    res.status(500).json({ mensaje: "Error interno del servidor" });
  }
});

export default router;
