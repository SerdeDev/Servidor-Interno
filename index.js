// Importa el módulo 'cors'. CORS es un paquete de node.js para proporcionar un middleware Connect/Express
// que se puede usar para habilitar CORS con varias opciones.
import cors from "cors";

// Importa el módulo 'express'. Express es un marco de aplicación web para node.js
// diseñado para construir aplicaciones web y API.
import express from "express";

// Importa las rutas de los usuarios desde el archivo 'users.routes.js'.
import estados from "./routes/sigecom/estados.routes.js";
import operadoras from "./routes/operadoras/operadoras.routes.js";
//catastro
import getCatastro from "./routes/catastro/getCatastro.routes.js";
import getCatastroCnae from "./routes/catastro/getCatastroCnae.routes.js";
import getCatastroCnaePrecio from "./routes/catastro/getCatastroCnaePrecio.routes.js";
//deuda
import getDeuda from "./routes/deuda/getDeuda.routes.js";
import getDeudaCnae from "./routes/deuda/getDeudaCnae.routes.js";
import getDeudaEstado from "./routes/deuda/getDeudaEstado.routes.js";
import getDeudaCnaePublicos from "./routes/deuda/getDeudaCnaePublicos.routes.js";
import getDeudaCnaePrivados from "./routes/deuda/getDeudaCnaePrivados.routes.js";
// recg
import getRecg from "./routes/recg/getRecg.routes.js";
import getRecgTotales from "./routes/recg/getRecgTotales.routes.js";
import getRecgTotalesOperadoras from "./routes/recg/getRecgTotalesOperadoras.routes.js";
//sigecom
import getSigecom from "./routes/sigecom/getSigecom.routes.js";
import postUsuarioCatastro from "./routes/catastro/postUsuarioCatastro.routes.js";
//recaudacion anticipos
import updateRecaudacion from "./routes/recaudacion/updateRecaudacion.routes.js";
import getAnticipos from "./routes/recaudacion/getAnticipos.routes.js";
// Crea una nueva aplicación Express.
const app = express();

// Usa el middleware CORS. Esto permite o restringe los recursos solicitados en la página web
// para interactuar con los recursos de un dominio diferente.
app.use(cors());

// Usa el middleware express.json(). Este es un middleware incorporado en Express.
// Analiza las solicitudes entrantes con cargas útiles JSON y se basa en body-parser.

app.use(express.json());
// Usa las rutas de los usuarios para cualquier ruta que comienza con '/api'.
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
app.use("/api", getRecgTotales);
app.use("/api", getRecgTotalesOperadoras);
app.use("/api", updateRecaudacion);
app.use("/api", getAnticipos);
app.listen(3003);

console.log("server on port", 3003);
