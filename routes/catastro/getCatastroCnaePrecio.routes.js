//1. Configuración inicial
//Se crea un router de Express.
//Se inicializa Prisma Client para poder consultar la base de datos.

import { Router } from "express";
import { PrismaClient } from "@prisma/client";

const router = Router();
const prisma = new PrismaClient();

//2. Definición de la ruta /getCatastroCnaePrecio
//Se define la ruta POST /getCatastroCnaePrecio.
//Se capturan los filtros enviados en el cuerpo de la petición.

router.post("/getCatastroCnaePrecio", async (req, res) => {
  try {
    const filtros = req.body;

    // 3. Obtener interlocutores únicos desde catastro
    const interlocutores = await prisma.catastro.findMany({
      select: { interlocutor: true },
      distinct: ["interlocutor"],
    });
    const interlocutorIds = interlocutores.map((i) => i.interlocutor);

    // 4. Filtrar operadoras_mod según interlocutores
    //Se buscan las operadoras que tengan esos interlocutores.
    //Se seleccionan solo los campos relevantes.
    //Se obtiene un array de interlocutores filtrados.

    let operadorasWhere = { interlocutor: { in: interlocutorIds } };

    const operadoras = await prisma.operadoras_mod.findMany({
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

    // 5. Conteos por tipo con groupBy
    //Se hacen 10 consultas en paralelo con Promise.all.
    //Cada consulta agrupa por interlocutor y cuenta cuentaContrato según distintos filtros:
    // cnae en rangos (1000–1999 → residenciales, 2000–2999 → comerciales, 3000–3999 → industriales).
    // monto mayor a 0 o igual a 0.
    //tarifa que termina o no en "00".
    //cnae < 1000 para no facturables.
    //Sin filtro para total de usuarios.

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
      prisma.catastro.groupBy({
        by: ["interlocutor"],
        where: {
          cnae: { gte: 1000, lte: 1999 },
          monto: { gte: 0 },
          tarifa: { not: { endsWith: "00" } },
          interlocutor: { in: interlocutoresFiltrados },
        },
        _count: { cuentaContrato: true },
      }),
      prisma.catastro.groupBy({
        by: ["interlocutor"],
        where: {
          cnae: { gte: 2000, lte: 2999 },
          monto: { gte: 0 },
          tarifa: { not: { endsWith: "00" } },
          interlocutor: { in: interlocutoresFiltrados },
        },
        _count: { cuentaContrato: true },
      }),
      prisma.catastro.groupBy({
        by: ["interlocutor"],
        where: {
          cnae: { gte: 3000, lte: 3999 },
          monto: { gte: 0 },
          tarifa: { not: { endsWith: "00" } },
          interlocutor: { in: interlocutoresFiltrados },
        },
        _count: { cuentaContrato: true },
      }),
      prisma.catastro.groupBy({
        by: ["interlocutor"],
        where: {
          cnae: { gte: 1000, lte: 1999 },
          monto: { equals: 0 },
          interlocutor: { in: interlocutoresFiltrados },
        },
        _count: { cuentaContrato: true },
      }),
      prisma.catastro.groupBy({
        by: ["interlocutor"],
        where: {
          cnae: { gte: 2000, lte: 2999 },
          monto: { equals: 0 },
          interlocutor: { in: interlocutoresFiltrados },
        },
        _count: { cuentaContrato: true },
      }),
      prisma.catastro.groupBy({
        by: ["interlocutor"],
        where: {
          cnae: { gte: 3000, lte: 3999 },
          monto: { equals: 0 },
          tarifa: { not: { endsWith: "00" } },
          interlocutor: { in: interlocutoresFiltrados },
        },
        _count: { cuentaContrato: true },
      }),
      prisma.catastro.groupBy({
        by: ["interlocutor"],
        where: {
          cnae: { lt: 1000 },
          monto: { equals: 0 },
          tarifa: { not: { endsWith: "00" } },
          interlocutor: { in: interlocutoresFiltrados },
        },
        _count: { cuentaContrato: true },
      }),
      prisma.catastro.groupBy({
        by: ["interlocutor"],
        where: { interlocutor: { in: interlocutoresFiltrados } },
        _count: { cuentaContrato: true },
      }),
      prisma.catastro.groupBy({
        by: ["interlocutor"],
        where: {
          tarifa: { endsWith: "00" },
          interlocutor: { in: interlocutoresFiltrados },
        },
        _count: { cuentaContrato: true },
      }),
      prisma.catastro.groupBy({
        by: ["interlocutor"],
        where: {
          tarifa: { not: { endsWith: "00" } },
          cnae: { lte: 3 },
          monto: { gt: 0 },
          interlocutor: { in: interlocutoresFiltrados },
        },
        _count: { cuentaContrato: true },
      }),
    ]);

    // 6. Unir resultados
    //  La columna monto de la tabla catastro indica el precio aforo (neto de la tarifa).
    //  Se unen los resultados de las distintas consultas por interlocutor.
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
        COMERCIALES:
          comerciales.find((r) => r.interlocutor === id)?._count
            .cuentaContrato || 0,
        INDUSTRIALES:
          industriales.find((r) => r.interlocutor === id)?._count
            .cuentaContrato || 0,
        NOFACTURABLE:
          (nofacturableA.find((r) => r.interlocutor === id)?._count
            .cuentaContrato || 0) +
          (nofacturableB.find((r) => r.interlocutor === id)?._count
            .cuentaContrato || 0),
        RESIDENCIALES_0:
          residenciales_0.find((r) => r.interlocutor === id)?._count
            .cuentaContrato || 0,
        COMERCIALES_0:
          comerciales_0.find((r) => r.interlocutor === id)?._count
            .cuentaContrato || 0,
        INDUSTRIALES_0:
          industriales_0.find((r) => r.interlocutor === id)?._count
            .cuentaContrato || 0,
        NOFACTURABLE_0:
          noFacturable_0.find((r) => r.interlocutor === id)?._count
            .cuentaContrato || 0,
        TOTAL_USUARIOS:
          totalUsuarios.find((r) => r.interlocutor === id)?._count
            .cuentaContrato || 0,
      };
    });
    //7. Respuesta final
    console.log("Resultado:", resultado);
    res.status(200).json(resultado);
  } catch (error) {
    console.error("Error en getCatastroCnaePrecio:", error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
