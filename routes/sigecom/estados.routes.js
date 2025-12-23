import { Router } from "express";
import { PrismaClient } from "@prisma/client";

const router = Router();
const prisma = new PrismaClient();

router.get("/estados", async (req, res) => {
  try {
    // Aquí agrupamos por estado y municipio usando las relaciones
    const estados = await prisma.estr_pol_parr.findMany({
      select: {
        estr_pol_edo: { select: { estr_pol_edo_descrip: true } },
        estr_pol_mun: { select: { estr_pol_mun_descrip: true } },
        estr_pol_parr_descrip: true,
      },
    });

    // Transformamos la respuesta para que sea más clara
    const resultado = estados.map((e) => ({
      estado: e.estr_pol_edo.estr_pol_edo_descrip,
      municipio: e.estr_pol_mun.estr_pol_mun_descrip,
      parroquia: e.estr_pol_parr_descrip,
    }));

    res.status(200).json(resultado);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
