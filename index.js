import cors from "cors";
import express from "express";

// sigecom
import estados from "./routes/sigecom/estados.routes.js";
import getSigecom from "./routes/sigecom/getSigecom.routes.js";

// operadoras
import operadoras from "./routes/operadoras/operadoras.routes.js";
import getoperadorasFiltradas from "./routes/operadoras/operadorasFiltradas.routes.js";

// catastro
import getCatastro from "./routes/catastro/getCatastro.routes.js";
import getCatastroCnae from "./routes/catastro/getCatastroCnae.routes.js";
import getCatastroCnaePrecio from "./routes/catastro/getCatastroCnaePrecio.routes.js";
import postUsuarioCatastro from "./routes/catastro/postUsuarioCatastro.routes.js";

// deuda
import getDeuda from "./routes/deuda/getDeuda.routes.js";
import getDeudaCnae from "./routes/deuda/getDeudaCnae.routes.js";
import getDeudaEstado from "./routes/deuda/getDeudaEstado.routes.js";
import getDeudaCnaePublicos from "./routes/deuda/getDeudaCnaePublicos.routes.js";
import getDeudaCnaePrivados from "./routes/deuda/getDeudaCnaePrivados.routes.js";

// recg
import getRecg from "./routes/recg/getRecg.routes.js";
import getRecgMesesDisponibles from "./routes/recg/getRecgMesesDisponibles.routes.js";
import getRecgTotales from "./routes/recg/getRecgTotales.routes.js";
import getRecgTotalesOperadoras from "./routes/recg/getRecgTotalesOperadoras.routes.js";

// recaudacion
import updateRecaudacion from "./routes/recaudacion/updateRecaudacion.routes.js";
import getAnticipos from "./routes/recaudacion/getAnticipos.routes.js";

// auth (nuevo módulo)
import authRoutes from "./routes/auth/index.js";

const app = express();
app.use(cors());
app.use(express.json());

// Monta todas las rutas bajo /api
app.use("/api", estados);
app.use("/api", operadoras);
app.use("/api", getSigecom);
app.use("/api", getCatastro);
app.use("/api", getCatastroCnae);
app.use("/api", getCatastroCnaePrecio);
app.use("/api", postUsuarioCatastro);
app.use("/api", getDeuda);
app.use("/api", getDeudaCnae);
app.use("/api", getDeudaEstado);
app.use("/api", getDeudaCnaePublicos);
app.use("/api", getDeudaCnaePrivados);
app.use("/api", getRecg);
app.use("/api", getRecgMesesDisponibles);
app.use("/api", getRecgTotales);
app.use("/api", getRecgTotalesOperadoras);
app.use("/api", updateRecaudacion);
app.use("/api", getAnticipos);
app.use("/api", getoperadorasFiltradas);

// Login y autenticación
app.use("/api/auth", authRoutes);

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});
