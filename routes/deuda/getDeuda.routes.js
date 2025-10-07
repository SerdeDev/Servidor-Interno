import { Router } from "express";
import { PrismaClient } from "@prisma/client";

const router = Router();
const prisma = new PrismaClient();

router.post("/getDeuda", async (req, res) => {
  try {
    const filtros = req.body;
    console.log("Filtros recibidos:", filtros);
    const filtrosLimpios = Object.fromEntries(
      Object.entries(filtros).filter(
        ([, v]) => v !== null && v !== undefined && v !== ""
      )
    );

    const { estado, municipio, interlocutor, servicio, ...filtrosDeuda } =
      filtrosLimpios;

    let interlocutores = null;

    if (interlocutor) {
      // Si el usuario envió interlocutor (puede ser string o array)
      interlocutores = Array.isArray(interlocutor)
        ? interlocutor
        : [interlocutor];
    } else if (
      (estado || municipio || servicio) &&
      !filtrosDeuda.cedula &&
      !filtrosDeuda.cuentaContrato
    ) {
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
    console.log(filtrosDeuda);
    let deuda = [];
    // Quita los campos de checkboxes del objeto filtrosDeuda para la consulta general
    const {
      cnaeResidencial,
      cnaeComercial,
      cnaeIndustrial,
      cnaeNoFaturable,
      ...filtrosDeudaSinCnae
    } = filtrosDeuda;
    if (
      filtrosDeuda.cnaeResidencial === false &&
      filtrosDeuda.cnaeComercial === false &&
      filtrosDeuda.cnaeIndustrial === false &&
      filtrosDeuda.cnaeNoFaturable === false
    ) {
      // Si no hay filtro de cnae, busca con los demás filtros
      deuda = await prisma.deudaTotal.findMany({
        where: {
          ...filtrosDeudaSinCnae,
          ...(interlocutores && { interlocutor: { in: interlocutores } }),
        },
      });
    } else {
      if (cnaeResidencial === true) {
        deuda = await prisma.deudaTotal.findMany({
          where: {
            nombre: filtrosDeuda.nombre,
            cedula: filtrosDeuda.cedula,
            cuentaContrato: filtrosDeuda.cuentaContrato,
            ...(interlocutores && {
              interlocutor: { in: interlocutores },
            }),
            cnae: {
              gte: 1000,
              lte: 1999,
            },
          },
        });
      }
      if (cnaeComercial === true) {
        deuda = await prisma.deudaTotal.findMany({
          where: {
            nombre: filtrosDeuda.nombre,
            cedula: filtrosDeuda.cedula,
            cuentaContrato: filtrosDeuda.cuentaContrato,
            ...(interlocutores && {
              interlocutor: { in: interlocutores },
            }),
            cnae: {
              gte: 2000,
              lte: 2999,
            },
          },
        });
      }
      if (cnaeIndustrial === true) {
        deuda = await prisma.deudaTotal.findMany({
          where: {
            nombre: filtrosDeuda.nombre,
            cedula: filtrosDeuda.cedula,
            cuentaContrato: filtrosDeuda.cuentaContrato,
            ...(interlocutores && {
              interlocutor: { in: interlocutores },
            }),
            cnae: {
              gte: 3000,
              lte: 3999,
            },
          },
        });
      }
      if (cnaeNoFaturable === true) {
        deuda = await prisma.deudaTotal.findMany({
          where: {
            nombre: filtrosDeuda.nombre,
            cedula: filtrosDeuda.cedula,
            cuentaContrato: filtrosDeuda.cuentaContrato,
            ...(interlocutores && {
              interlocutor: { in: interlocutores },
            }),
            cnae: {
              lte: 1000,
            },
          },
        });
      }
    }
    // Convertir BigInt a string en los resultados
    const deudaSerializado = JSON.parse(
      JSON.stringify(deuda, (key, value) =>
        typeof value === "bigint" ? value.toString() : value
      )
    );

    res.status(200).json(deudaSerializado);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
