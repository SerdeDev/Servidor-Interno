import { Router } from "express";
import { PrismaClient } from "@prisma/client";

const router = Router();
const prisma = new PrismaClient();

router.post("/updateRecaudacion", async (req, res) => {
  try {
    const data = req.body;
    console.log("Datos recibidos:", data);

    if (!Array.isArray(data) || data.length === 0) {
      return res.status(400).json({
        error:
          "El cuerpo debe ser un array de objetos con datos de recaudación.",
      });
    }

    // Validar que todos los objetos tengan los campos requeridos
    const camposRequeridos = [
      "interlocutor",
      "nombreOperadora",
      "servicio",
      "total",
      "fecha",
    ];
    const faltantes = data.filter((item) =>
      camposRequeridos.some(
        (campo) => item[campo] === undefined || item[campo] === null
      )
    );
    if (faltantes.length > 0) {
      return res
        .status(400)
        .json({
          error: "Algunos objetos no tienen todos los campos requeridos.",
        });
    }

    // Opcional: convertir fecha a formato ISO si viene como dd.mm.yyyy
    const dataProcesada = data.map((item) => ({
      ...item,
      fecha: item.fecha.includes(".")
        ? new Date(item.fecha.split(".").reverse().join("-")).toISOString()
        : item.fecha,
    }));

    const recaudacion = await prisma.recaudacion.createMany({
      data: dataProcesada,
    });

    res.status(200).json(recaudacion);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
