import { Router } from "express";
import { PrismaClient } from "@prisma/client";

const router = Router();
const prisma = new PrismaClient();

router.post("/getAnticipos", async (req, res) => {
  try {
    const filtros = req.body;
    console.log("Filtros recibidos:", filtros);

    async function obtenerTotales(tipo) {
      // Paso 1: Filtrar recaudaciones del tipo correspondiente
      const recaudaciones = await prisma.recaudacion.findMany({
        where: {
          operadoras_recaudacion_mod: { tipo }, // relación actualizada
        },
        include: {
          operadoras_recaudacion_mod: true, // incluir relación actualizada
        },
      });

      // Paso 2: Agrupar y calcular totales
      const agrupado = new Map();

      for (const r of recaudaciones) {
        const clave = `${r.operadoras_recaudacion_mod.operadoraMun}|${r.nombreOperadora}|${r.servicio}`;
        const actual = agrupado.get(clave) ?? { total: 0, tipo: tipo };
        actual.total += Number(r.total);
        agrupado.set(clave, actual);
      }

      // Paso 3: Aplicar porcentajes desde deducciones
      const resultadoFinal = [];

      for (const [clave, datos] of agrupado.entries()) {
        const [mun, operadora, servicio] = clave.split("|");

        const deduccion = await prisma.deduccionesAlianzas.findFirst({
          where: {
            operadoraGrup: operadora,
            operadoraMun: mun,
          },
        });

        const porcentaje = deduccion ? Number(deduccion.porcentaje) : 0.85; // default 85%

        resultadoFinal.push({
          operadoramun: mun,
          operadora,
          servicio,
          tipo: tipo,
          total_municipio: datos.total,
          total_porcent: Number((datos.total * porcentaje).toFixed(2)),
        });
      }

      return resultadoFinal;
    }

    // Paso 4: Calcular anticipos
    const anticipos = await prisma.recaudacion.aggregate({
      where: {
        operadoras_recaudacion_mod: { tipo: "2" }, // relación actualizada
      },
      _sum: { total: true },
    });

    const anticiposFormat = {
      operadoramun: ".",
      operadora: "OPERADORA XYZ",
      servicio: "TOTAL ANTICIPO",
      tipo: "2",
      total_municipio: anticipos._sum.total,
      total_porcent: Number((anticipos._sum.total * 0.85).toFixed(2)),
    };

    // Paso 5: Unir todos los resultados
    const todos = [
      ...(await obtenerTotales("1")),
      ...(await obtenerTotales("2")),
      ...(await obtenerTotales("3")),
      ...(await obtenerTotales("4")),
      ...(await obtenerTotales("5")),
      anticiposFormat,
      // otros bloques con textos fijos como “EMPRESA DE DESECHOS 15%” puedes agregarlos aquí
    ];

    console.log("Datos totales:", todos);
    res.status(200).json(todos);
  } catch (error) {
    console.error("Error en /getAnticipos:", error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
