import { Router } from "express";
import pkg from "@prisma/client";
const { PrismaClient } = pkg;

const router = Router();
const prisma = new PrismaClient();

// Ruta para obtener los meses y años disponibles en la tabla 'recg'.
router.get("/getRecgMesesDisponibles", async (req, res) => {
  try {
    const fechas = await prisma.recg.findMany({
      distinct: ["fecha"], // elimina duplicados
      orderBy: { fecha: "asc" }, // orden ascendente
      select: { fecha: true }, // solo la columna fecha
    });

    const mesesAnios = fechas
      .map((f) => {
        const fecha = new Date(f.fecha); // fuerza hora local

        return {
          mes: fecha.getUTCMonth() + 1, // mes en UTC
          año: fecha.getUTCFullYear(), // año en UTC
        };
      })
      .reduce((acc, curr) => {
        const clave = `${curr.año}-${String(curr.mes).padStart(2, "0")}`;
        if (!acc.includes(clave)) acc.push(clave);
        return acc;
      }, [])
      .sort();

    res.json(mesesAnios);
  } catch (error) {
    console.error("Error al obtener fechas:", error);
    res.status(500).json({ error: "Error al obtener fechas disponibles" });
  }
});

export default router;
