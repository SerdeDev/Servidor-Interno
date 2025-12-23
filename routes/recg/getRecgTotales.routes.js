import { Router } from "express";
import pkg from "@prisma/client";
const { PrismaClient } = pkg;

const router = Router();
const prisma = new PrismaClient();

router.post("/getRecgTotales", async (req, res) => {
  try {
    const filtros = req.body;
    console.log("Filtros recibidos:", filtros);
    const filtrosLimpios = Object.fromEntries(
      Object.entries(filtros).filter(
        ([, v]) => v !== null && v !== undefined && v !== ""
      )
    );
    const interlocutoresRecg = await prisma.recg.findMany({
      select: { interlocutor: true },
      distinct: ["interlocutor"],
    });

    const interlocutorIds = interlocutoresRecg.map((i) => i.interlocutor);

    // 1. Combina los filtros de operadoras
    let operadoras = [];
    let operadorasWhere = { interlocutor: { in: interlocutorIds } };
    if (filtrosLimpios.estatusComer === true)
      operadorasWhere.estatusComer = true;
    if (filtrosLimpios.estatusTec === true) operadorasWhere.estatusTec = true;
    if (filtrosLimpios.estatusRecau === true)
      operadorasWhere.estatusRecau = true;

    operadoras = await prisma.operadoras_mod.findMany({
      where: {
        interlocutor: { in: interlocutorIds },
        ingreso_date: { lte: new Date(filtros.fechaFin) }, // ingresó antes o igual a fechaFin
      },
      select: {
        interlocutor: true,
        estado: true,
        municipio: true,
        nombre: true,
      },
      distinct: ["interlocutor"],
    });

    const interlocutoresFiltrados = operadoras.map((o) => o.interlocutor);

    const makeGroupBy = (producto, campo) =>
      prisma.recg.groupBy({
        by: ["interlocutor"],
        where: {
          producto,
          interlocutor: { in: interlocutoresFiltrados },
          fecha: {
            gte: new Date(filtrosLimpios.fechaInicio),
            lt: new Date(filtrosLimpios.fechaFin),
          },
        },
        _sum: { [campo]: true },
      });

    const [
      cantidadFage,
      montoFage,
      ivaFage,
      montoPlusFage,
      ivaPlusFage,
      cantidadFaga,
      montoFaga,
      ivaFaga,
      montoPlusFaga,
      ivaPlusFaga,
      cantidadFaco,
      montoFaco,
      ivaFaco,
      montoPlusFaco,
      ivaPlusFaco,
      cantidadFcoa,
      montoFcoa,
      ivaFcoa,
      montoPlusFcoa,
      ivaPlusFcoa,
      cantidadCoar,
      montoCoar,
      ivaCoar,
      montoPlusCoar,
      ivaPlusCoar,
      cantidadCoaa,
      montoCoaa,
      ivaCoaa,
      montoPlusCoaa,
      ivaPlusCoaa,
      cantidadFacoa,
      montoFacoa,
      ivaFacoa,
      montoPlusFacoa,
      ivaPlusFacoa,
    ] = await Promise.all([
      makeGroupBy("FACTURAS GENERADAS", "cantidad"),
      makeGroupBy("FACTURAS GENERADAS", "monto"),
      makeGroupBy("FACTURAS GENERADAS", "iva"),
      makeGroupBy("FACTURAS GENERADAS", "montoPlus"),
      makeGroupBy("FACTURAS GENERADAS", "ivaPlus"),
      makeGroupBy("FACTURAS GENERADAS ANULADAS", "cantidad"),
      makeGroupBy("FACTURAS GENERADAS ANULADAS", "monto"),
      makeGroupBy("FACTURAS GENERADAS ANULADAS", "iva"),
      makeGroupBy("FACTURAS GENERADAS ANULADAS", "montoPlus"),
      makeGroupBy("FACTURAS GENERADAS ANULADAS", "ivaPlus"),
      makeGroupBy("FACTURAS COBRADAS", "cantidad"),
      makeGroupBy("FACTURAS COBRADAS", "monto"),
      makeGroupBy("FACTURAS COBRADAS", "iva"),
      makeGroupBy("FACTURAS COBRADAS", "montoPlus"),
      makeGroupBy("FACTURAS COBRADAS", "ivaPlus"),
      makeGroupBy("FACTURAS COBRADAS ANULADAS", "cantidad"),
      makeGroupBy("FACTURAS COBRADAS ANULADAS", "monto"),
      makeGroupBy("FACTURAS COBRADAS ANULADAS", "iva"),
      makeGroupBy("FACTURAS COBRADAS ANULADAS", "montoPlus"),
      makeGroupBy("FACTURAS COBRADAS ANULADAS", "ivaPlus"),
      makeGroupBy("COBROS ANTICIPADOS REALIZADOS", "cantidad"),
      makeGroupBy("COBROS ANTICIPADOS REALIZADOS", "monto"),
      makeGroupBy("COBROS ANTICIPADOS REALIZADOS", "iva"),
      makeGroupBy("COBROS ANTICIPADOS REALIZADOS", "montoPlus"),
      makeGroupBy("COBROS ANTICIPADOS REALIZADOS", "ivaPlus"),
      makeGroupBy("COBROS ANTICIPADOS ANULADOS", "cantidad"),
      makeGroupBy("COBROS ANTICIPADOS ANULADOS", "monto"),
      makeGroupBy("COBROS ANTICIPADOS ANULADOS", "iva"),
      makeGroupBy("COBROS ANTICIPADOS ANULADOS", "montoPlus"),
      makeGroupBy("COBROS ANTICIPADOS ANULADOS", "ivaPlus"),
      makeGroupBy("FACTURAS ASOCIADAS A COBROS ANTICIPADOS", "cantidad"),
      makeGroupBy("FACTURAS ASOCIADAS A COBROS ANTICIPADOS", "monto"),
      makeGroupBy("FACTURAS ASOCIADAS A COBROS ANTICIPADOS", "iva"),
      makeGroupBy("FACTURAS ASOCIADAS A COBROS ANTICIPADOS", "montoPlus"),
      makeGroupBy("FACTURAS ASOCIADAS A COBROS ANTICIPADOS", "ivaPlus"),
    ]);

    const resultado = interlocutoresFiltrados.map((interlocutor) => {
      const op = operadoras.find((o) => o.interlocutor === interlocutor);
      const incluirUbicacion = filtrosLimpios.estatusComer
        ? {
            ESTADO: op.estado,
            MUNICIPIO: op.municipio,
          }
        : {};
      const incluirCantidad = filtrosLimpios.estatusRecau
        ? {
            CANTIDAD_FAGE:
              Number(
                cantidadFage.find((r) => r.interlocutor === interlocutor)?._sum
                  ?.cantidad
              ) || 0,
            CANTIDAD_FAGA:
              Number(
                cantidadFaga.find((r) => r.interlocutor === interlocutor)?._sum
                  ?.cantidad
              ) || 0,
            CANTIDAD_FACO:
              Number(
                cantidadFaco.find((r) => r.interlocutor === interlocutor)?._sum
                  ?.cantidad
              ) || 0,
            CANTIDAD_FCOA:
              Number(
                cantidadFcoa.find((r) => r.interlocutor === interlocutor)?._sum
                  ?.cantidad
              ) || 0,
            CANTIDAD_COAR:
              Number(
                cantidadCoar.find((r) => r.interlocutor === interlocutor)?._sum
                  ?.cantidad
              ) || 0,
            CANTIDAD_COAA:
              Number(
                cantidadCoaa.find((r) => r.interlocutor === interlocutor)?._sum
                  ?.cantidad
              ) || 0,
            CANTIDAD_FACOA:
              Number(
                cantidadFacoa.find((r) => r.interlocutor === interlocutor)?._sum
                  ?.cantidad
              ) || 0,
          }
        : {};
      return {
        INTERLOCUTOR: interlocutor,
        OPERADORA: op.nombre,
        ...incluirUbicacion,
        CANTIDADFAGE:
          Number(
            cantidadFage.find((r) => r.interlocutor === interlocutor)?._sum
              ?.cantidad
          ) || 0,
        MONTOFAGE:
          Number(
            montoFage.find((r) => r.interlocutor === interlocutor)?._sum?.monto
          ).toFixed(2) || 0,
        IVAFAGE:
          Number(
            ivaFage.find((r) => r.interlocutor === interlocutor)?._sum?.iva
          ).toFixed(2) || 0,
        MONTOPLUSFAGE:
          Number(
            montoPlusFage.find((r) => r.interlocutor === interlocutor)?._sum
              ?.montoPlus
          ).toFixed(2) || 0,
        IVAPLUSFAGE:
          Number(
            ivaPlusFage.find((r) => r.interlocutor === interlocutor)?._sum
              ?.ivaPlus
          ).toFixed(2) || 0,
        ...incluirCantidad.CANTIDAD_FAGE,
        TOTALFAGE: Number(
          (Number(
            montoFage.find((r) => r.interlocutor === interlocutor)?._sum?.monto
          ) || 0) +
            (Number(
              ivaFage.find((r) => r.interlocutor === interlocutor)?._sum?.iva
            ) || 0) +
            (Number(
              montoPlusFage.find((r) => r.interlocutor === interlocutor)?._sum
                ?.montoPlus
            ) || 0) +
            (Number(
              ivaPlusFage.find((r) => r.interlocutor === interlocutor)?._sum
                ?.ivaPlus
            ) || 0)
        ).toFixed(2),
        CANTIDADFAGA:
          Number(
            cantidadFaga.find((r) => r.interlocutor === interlocutor)?._sum
              ?.cantidad
          ).toFixed(2) || 0,
        MONTOFAGA:
          Number(
            montoFaga.find((r) => r.interlocutor === interlocutor)?._sum?.monto
          ).toFixed(2) || 0,
        IVAFAGA:
          Number(
            ivaFaga.find((r) => r.interlocutor === interlocutor)?._sum?.iva
          ).toFixed(2) || 0,
        MONTOPLUSFAGA:
          Number(
            montoPlusFaga.find((r) => r.interlocutor === interlocutor)?._sum
              ?.montoPlus
          ).toFixed(2) || 0,
        IVAPLUSFAGA:
          Number(
            ivaPlusFaga.find((r) => r.interlocutor === interlocutor)?._sum
              ?.ivaPlus
          ).toFixed(2) || 0,
        ...incluirCantidad.CANTIDAD_FAGA,
        TOTALFAGA: Number(
          (Number(
            montoFaga.find((r) => r.interlocutor === interlocutor)?._sum?.monto
          ) || 0) +
            (Number(
              ivaFaga.find((r) => r.interlocutor === interlocutor)?._sum?.iva
            ) || 0) +
            (Number(
              montoPlusFaga.find((r) => r.interlocutor === interlocutor)?._sum
                ?.montoPlus
            ) || 0) +
            (Number(
              ivaPlusFaga.find((r) => r.interlocutor === interlocutor)?._sum
                ?.ivaPlus
            ) || 0)
        ).toFixed(2),

        CANTIDADFACO:
          Number(
            cantidadFaco.find((r) => r.interlocutor === interlocutor)?._sum
              ?.cantidad
          ).toFixed(2) || 0,
        MONTOFACO:
          Number(
            montoFaco.find((r) => r.interlocutor === interlocutor)?._sum?.monto
          ).toFixed(2) || 0,
        IVAFACO:
          Number(
            ivaFaco.find((r) => r.interlocutor === interlocutor)?._sum?.iva
          ).toFixed(2) || 0,
        MONTOPLUSFACO:
          Number(
            montoPlusFaco.find((r) => r.interlocutor === interlocutor)?._sum
              ?.montoPlus
          ).toFixed(2) || 0,
        IVAPLUSFACO:
          Number(
            ivaPlusFaco.find((r) => r.interlocutor === interlocutor)?._sum
              ?.ivaPlus
          ).toFixed(2) || 0,
        ...incluirCantidad.CANTIDAD_FACO,
        TOTALFACO: Number(
          (Number(
            montoFaco.find((r) => r.interlocutor === interlocutor)?._sum?.monto
          ) || 0) +
            (Number(
              ivaFaco.find((r) => r.interlocutor === interlocutor)?._sum?.iva
            ) || 0) +
            (Number(
              montoPlusFaco.find((r) => r.interlocutor === interlocutor)?._sum
                ?.montoPlus
            ) || 0) +
            (Number(
              ivaPlusFaco.find((r) => r.interlocutor === interlocutor)?._sum
                ?.ivaPlus
            ) || 0)
        ).toFixed(2),

        CANTIDADFCOA:
          Number(
            cantidadFcoa.find((r) => r.interlocutor === interlocutor)?._sum
              ?.cantidad
          ).toFixed(2) || 0,
        MONTOFCOA:
          Number(
            montoFcoa.find((r) => r.interlocutor === interlocutor)?._sum?.monto
          ).toFixed(2) || 0,
        IVAFCOA:
          Number(
            ivaFcoa.find((r) => r.interlocutor === interlocutor)?._sum?.iva
          ).toFixed(2) || 0,
        MONTOPLUSFCOA:
          Number(
            montoPlusFcoa.find((r) => r.interlocutor === interlocutor)?._sum
              ?.montoPlus
          ).toFixed(2) || 0,
        IVAPLUSFCOA:
          Number(
            ivaPlusFcoa.find((r) => r.interlocutor === interlocutor)?._sum
              ?.ivaPlus
          ).toFixed(2) || 0,
        ...incluirCantidad.CANTIDAD_FCOA,
        TOTALFCOA: Number(
          (Number(
            montoFcoa.find((r) => r.interlocutor === interlocutor)?._sum?.monto
          ) || 0) +
            (Number(
              ivaFcoa.find((r) => r.interlocutor === interlocutor)?._sum?.iva
            ) || 0) +
            (Number(
              montoPlusFcoa.find((r) => r.interlocutor === interlocutor)?._sum
                ?.montoPlus
            ) || 0) +
            (Number(
              ivaPlusFcoa.find((r) => r.interlocutor === interlocutor)?._sum
                ?.ivaPlus
            ) || 0)
        ).toFixed(2),
        CANTIDADCOAR:
          Number(
            cantidadCoar.find((r) => r.interlocutor === interlocutor)?._sum
              ?.cantidad
          ).toFixed(2) || 0,
        MONTOCOAR:
          Number(
            montoCoar.find((r) => r.interlocutor === interlocutor)?._sum?.monto
          ).toFixed(2) || 0,
        IVACOAR:
          Number(
            ivaCoar.find((r) => r.interlocutor === interlocutor)?._sum?.iva
          ).toFixed(2) || 0,
        MONTOPLUSCOAR:
          Number(
            montoPlusCoar.find((r) => r.interlocutor === interlocutor)?._sum
              ?.montoPlus
          ).toFixed(2) || 0,
        IVAPLUSCOAR:
          Number(
            ivaPlusCoar.find((r) => r.interlocutor === interlocutor)?._sum
              ?.ivaPlus
          ).toFixed(2) || 0,
        ...incluirCantidad.CANTIDAD_COAR,
        TOTALCOAR: Number(
          (Number(
            montoCoar.find((r) => r.interlocutor === interlocutor)?._sum?.monto
          ) || 0) +
            (Number(
              ivaCoar.find((r) => r.interlocutor === interlocutor)?._sum?.iva
            ) || 0) +
            (Number(
              montoPlusCoar.find((r) => r.interlocutor === interlocutor)?._sum
                ?.montoPlus
            ) || 0) +
            (Number(
              ivaPlusCoar.find((r) => r.interlocutor === interlocutor)?._sum
                ?.ivaPlus
            ) || 0)
        ).toFixed(2),
        CANTIDADCOAA:
          Number(
            cantidadCoaa.find((r) => r.interlocutor === interlocutor)?._sum
              ?.cantidad
          ).toFixed(2) || 0,
        MONTOCOAA:
          Number(
            montoCoaa.find((r) => r.interlocutor === interlocutor)?._sum?.monto
          ).toFixed(2) || 0,
        IVACOAA:
          Number(
            ivaCoaa.find((r) => r.interlocutor === interlocutor)?._sum?.iva
          ).toFixed(2) || 0,
        MONTOPLUSCOAA:
          Number(
            montoPlusCoaa.find((r) => r.interlocutor === interlocutor)?._sum
              ?.montoPlus
          ).toFixed(2) || 0,
        IVAPLUSCOAA:
          Number(
            ivaPlusCoaa.find((r) => r.interlocutor === interlocutor)?._sum
              ?.ivaPlus
          ).toFixed(2) || 0,
        ...incluirCantidad.CANTIDAD_COAA,
        TOTALCOAA: Number(
          (Number(
            montoCoaa.find((r) => r.interlocutor === interlocutor)?._sum?.monto
          ) || 0) +
            (Number(
              ivaCoaa.find((r) => r.interlocutor === interlocutor)?._sum?.iva
            ) || 0) +
            (Number(
              montoPlusCoaa.find((r) => r.interlocutor === interlocutor)?._sum
                ?.montoPlus
            ) || 0) +
            (Number(
              ivaPlusCoaa.find((r) => r.interlocutor === interlocutor)?._sum
                ?.ivaPlus
            ) || 0)
        ).toFixed(2),
        CANTIDADFACOA:
          Number(
            cantidadFacoa.find((r) => r.interlocutor === interlocutor)?._sum
              ?.cantidad
          ).toFixed(2) || 0,
        MONTOFACOA:
          Number(
            montoFacoa.find((r) => r.interlocutor === interlocutor)?._sum?.monto
          ).toFixed(2) || 0,
        IVAFACOA:
          Number(
            ivaFacoa.find((r) => r.interlocutor === interlocutor)?._sum?.iva
          ).toFixed(2) || 0,
        MONTOPLUSFACOA:
          Number(
            montoPlusFacoa.find((r) => r.interlocutor === interlocutor)?._sum
              ?.montoPlus
          ).toFixed(2) || 0,
        IVAPLUSFACOA:
          Number(
            ivaPlusFacoa.find((r) => r.interlocutor === interlocutor)?._sum
              ?.ivaPlus
          ).toFixed(2) || 0,
        ...incluirCantidad.CANTIDAD_FACOA,
        TOTALFACOA: Number(
          (Number(
            montoFacoa.find((r) => r.interlocutor === interlocutor)?._sum?.monto
          ) || 0) +
            (Number(
              ivaFacoa.find((r) => r.interlocutor === interlocutor)?._sum?.iva
            ) || 0) +
            (Number(
              montoPlusFacoa.find((r) => r.interlocutor === interlocutor)?._sum
                ?.montoPlus
            ) || 0) +
            (Number(
              ivaPlusFacoa.find((r) => r.interlocutor === interlocutor)?._sum
                ?.ivaPlus
            ) || 0)
        ).toFixed(2),
      };
    });

    console.log("Resultado:", resultado);

    const recgSerializado = JSON.parse(
      JSON.stringify(resultado, (key, value) =>
        typeof value === "bigint" ? value.toString() : value
      )
    );

    res.status(200).json(recgSerializado);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
