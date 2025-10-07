import { Router } from "express";
import { PrismaClient } from "@prisma/client";

const router = Router();
const prisma = new PrismaClient();

router.post("/getCatastro", async (req, res) => {
  try {
    const filtros = req.body;
    // Limpiar filtros: eliminar claves con valores null, undefined o string vacío
    console.log("Filtros recibidos:", filtros);
    const filtrosLimpios = Object.fromEntries(
      Object.entries(filtros).filter(
        ([, v]) => v !== null && v !== undefined && v !== ""
      )
    );

    // Separar filtros de operadoras y catastro
    const { estado, municipio, interlocutor, servicio, ...filtrosCatastro } =
      filtrosLimpios;

    let interlocutores = null;

    if (interlocutor) {
      // Si el usuario envió interlocutor (puede ser string o array)
      interlocutores = Array.isArray(interlocutor)
        ? interlocutor
        : [interlocutor];
    } else if (
      (estado || municipio || servicio) &&
      !filtrosCatastro.cedula &&
      !filtrosCatastro.cuentaContrato
    ) {
      // Si no hay interlocutor pero sí estado/municipio/servicio y tampoco cedula/cuentaContrato, buscar en operadoras
      const operadoras = await prisma.operadoras.findMany({
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
    console.log(filtrosCatastro);
    // Consultar catastro
    const catastro = await prisma.catastro.findMany({
      where: {
        ...filtrosCatastro,
        ...(interlocutores && { interlocutor: { in: interlocutores } }),
      },
    });

    // Convertir BigInt a string en los resultados
    const catastroSerializado = JSON.parse(
      JSON.stringify(catastro, (key, value) =>
        typeof value === "bigint" ? value.toString() : value
      )
    );

    res.status(200).json(catastroSerializado);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
