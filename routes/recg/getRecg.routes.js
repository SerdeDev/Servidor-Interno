import { Router } from "express";
import pkg from "@prisma/client";
const { PrismaClient } = pkg;

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

    // 📌 Construir rango de fechas
    let rangoFechas = {};
    if (filtrosLimpios.mesSeleccionado) {
      const [año, mes] = filtrosLimpios.mesSeleccionado.split("-");
      const fechaInicio = new Date(`${año}-${mes}-01T00:00:00Z`);
      const fechaFin = new Date(fechaInicio);
      fechaFin.setMonth(fechaFin.getMonth() + 1);

      console.log("Filtro de mes:", { fechaInicio, fechaFin });

      rangoFechas = {
        fecha: {
          gte: fechaInicio,
          lt: fechaFin,
        },
      };
    } else if (filtrosLimpios.fechaInicio && filtrosLimpios.fechaFin) {
      rangoFechas = {
        fecha: {
          gte: new Date(filtrosLimpios.fechaInicio),
          lt: new Date(filtrosLimpios.fechaFin),
        },
      };
    }

    let interlocutores = null;

    if (interlocutor) {
      // Si el usuario envió interlocutor (puede ser string o array)
      interlocutores = Array.isArray(interlocutor)
        ? interlocutor
        : [interlocutor];
    } else if (estado || municipio || servicio) {
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
        return res.status(200).json([]); // No hay interlocutores, devolver vacío
      }
    }

    // 📌 Consulta específica de RECG con filtros y fechas
    const recg = await prisma.recg.findMany({
      where: {
        ...(interlocutores && { interlocutor: { in: interlocutores } }),
        ...rangoFechas,
      },
      orderBy: { fecha: "asc" }, // opcional: ordenar por fecha
    });

    const recgSerializado = JSON.parse(
      JSON.stringify(recg, (key, value) =>
        typeof value === "bigint" ? value.toString() : value
      )
    );

    res.status(200).json(recgSerializado);
  } catch (error) {
    console.error("Error interno:", error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
