/**
 * Servicio para consultar datos de RENIEC usando la API de mydevs
 */

const RENIEC_API_HOST = "http://www.consultasapi.devmiguelrevilla.com/api/test";

const REQUIRED_ENV_VARS = [
  "TOKEN_API_DOCUMENT_MYDEVS",
  "KEY_API_DOCUMENT_MYDEVS",
];

const missingEnvVars = REQUIRED_ENV_VARS.filter(
  (key) => !process.env[key] || process.env[key].trim() === ""
);

if (missingEnvVars.length > 0) {
  console.warn(
    `[RENIEC] Variables de entorno faltantes: ${missingEnvVars.join(
      ", "
    )}. La consulta RENIEC no estará disponible hasta que se configuren.`
  );
}

// Variable de entorno para habilitar/deshabilitar búsqueda profunda
const DEEP_SEARCH_ENABLED = process.env.RENIEC_DEEP_SEARCH !== "false";

// Delay entre intentos de búsqueda profunda (ms)
const DEEP_SEARCH_DELAY = parseInt(process.env.RENIEC_DEEP_SEARCH_DELAY || "100", 10);

// Log de inicialización
if (missingEnvVars.length === 0) {
  console.log(
    `[RENIEC] Servicio inicializado. Búsqueda profunda: ${DEEP_SEARCH_ENABLED ? "HABILITADA" : "DESHABILITADA"}${DEEP_SEARCH_ENABLED ? ` (delay: ${DEEP_SEARCH_DELAY}ms)` : ""}`
  );
}

const isSearchableObject = (value) =>
  value !== null && typeof value === "object";

const collectStringValuesByKeySet = (root, keySet) => {
  if (!isSearchableObject(root)) {
    return [];
  }

  const matches = [];
  const visited = new WeakSet();
  const stack = [root];

  const pushCandidate = (candidate) => {
    if (typeof candidate === "string") {
      const trimmed = candidate.trim();
      if (trimmed) {
        matches.push(trimmed);
      }
      return;
    }

    if (typeof candidate === "number") {
      const stringified = candidate.toString().trim();
      if (stringified) {
        matches.push(stringified);
      }
      return;
    }
  };

  while (stack.length > 0) {
    const current = stack.pop();

    if (!isSearchableObject(current) || visited.has(current)) {
      continue;
    }

    visited.add(current);

    for (const [key, value] of Object.entries(current)) {
      const normalizedKey = key.toLowerCase();

      if (keySet.has(normalizedKey)) {
        if (Array.isArray(value)) {
          for (const item of value) {
            pushCandidate(item);
            if (isSearchableObject(item) && !visited.has(item)) {
              stack.push(item);
            }
          }
        } else {
          pushCandidate(value);
        }
      }

      if (Array.isArray(value)) {
        for (const item of value) {
          if (isSearchableObject(item) && !visited.has(item)) {
            stack.push(item);
          }
        }
        continue;
      }

      if (isSearchableObject(value) && !visited.has(value)) {
        stack.push(value);
      }
    }
  }

  return matches;
};

const toUniqueOrderedWords = (values) => {
  const seen = new Set();
  const result = [];

  for (const value of values) {
    const words = value.split(/\s+/).map((word) => word.trim());

    for (const word of words) {
      if (!word) continue;

      const key = word.toUpperCase();
      if (seen.has(key)) continue;

      seen.add(key);
      result.push(word);
    }
  }

  return result;
};

const nombreKeySet = new Set(
  [
    "nombres",
    "nombrescompletos",
    "nombres_completos",
    "nombre",
    "name",
    "first_name",
    "firstname",
    "primer_nombre",
    "primernombre",
    "given_name",
    "givenname",
    "prenombres",
  ].map((key) => key.toLowerCase())
);

const additionalNameKeySet = new Set(
  [
    "segundo_nombre",
    "segundonombre",
    "otros_nombres",
    "otrosnombres",
    "second_name",
    "secondname",
    "middle_name",
    "middlename",
  ].map((key) => key.toLowerCase())
);

const apellidoKeySet = new Set(
  [
    "apellidos",
    "apellido",
    "last_name",
    "lastname",
    "surname",
    "surnames",
    "family_name",
    "familyname",
    "primer_apellido",
    "primerapellido",
    "segundo_apellido",
    "segundoapellido",
    "ape_paterno",
    "ape_materno",
  ].map((key) => key.toLowerCase())
);

const additionalLastNameKeySet = new Set(
  [
    "apellido_paterno",
    "apellidopaterno",
    "apellido_materno",
    "apellidomaterno",
    "paterno",
    "materno",
    "second_lastname",
    "secondlastname",
    "apellido1",
    "apellido2",
    "apellido_casada",
  ].map((key) => key.toLowerCase())
);

const normalizeNombre = (data) => {
  const primaryValues = collectStringValuesByKeySet(data, nombreKeySet);
  const additionalValues = collectStringValuesByKeySet(
    data,
    additionalNameKeySet
  );

  const words = toUniqueOrderedWords([...primaryValues, ...additionalValues]);

  if (words.length === 0) {
    return null;
  }

  return words.join(" ");
};

const normalizeApellido = (data) => {
  const primaryValues = collectStringValuesByKeySet(data, apellidoKeySet);
  const additionalValues = collectStringValuesByKeySet(
    data,
    additionalLastNameKeySet
  );

  const words = toUniqueOrderedWords([...primaryValues, ...additionalValues]);

  if (words.length === 0) {
    return null;
  }

  return words.join(" ");
};

const candidateDateKeys = [
  "fechaNacimiento",
  "fecha_nacimiento",
  "fechaNacimientoReniec",
  "fecha_de_nacimiento",
  "fechanacimiento",
  "fechaNac",
  "fecha_nac",
  "fecha",
  "birthDate",
  "birth_date",
  "birthdate",
  "birthday",
  "dateOfBirth",
  "date_of_birth",
  "dob",
  "fn",
];

const candidateDateKeysLower = new Set(
  candidateDateKeys.map((key) => key.toLowerCase())
);

const looksLikeDateKey = (key) => {
  const lower = key.toLowerCase();
  return (
    candidateDateKeysLower.has(lower) ||
    lower.includes("fecha") ||
    lower.includes("birth") ||
    lower.includes("nac") ||
    lower === "fn" ||
    lower === "dob"
  );
};

const extractStringValue = (value) => {
  if (typeof value === "string") {
    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : null;
  }

  if (typeof value === "number") {
    const stringified = value.toString();
    return stringified.length > 0 ? stringified : null;
  }

  return null;
};

const getDirectDateValue = (obj) => {
  for (const [key, value] of Object.entries(obj)) {
    if (looksLikeDateKey(key)) {
      const candidate = extractStringValue(value);
      if (candidate) {
        return candidate;
      }
    }
  }
  return null;
};

const searchValuesCollection = (collection, visited) => {
  for (const item of collection) {
    const nested = findDateValueDeep(item, visited);
    if (nested) {
      return nested;
    }
  }
  return null;
};

const findDateValueDeep = (data, visited = new WeakSet()) => {
  if (!isSearchableObject(data)) {
    return null;
  }

  if (visited.has(data)) {
    return null;
  }

  visited.add(data);

  const direct = getDirectDateValue(data);
  if (direct) {
    return direct;
  }

  for (const value of Object.values(data)) {
    if (Array.isArray(value)) {
      const nested = searchValuesCollection(value, visited);
      if (nested) {
        return nested;
      }
      continue;
    }

    if (!isSearchableObject(value)) {
      continue;
    }

    const nested = findDateValueDeep(value, visited);
    if (nested) {
      return nested;
    }
  }

  return null;
};

const normalizeFechaNacimiento = (data) => {
  let fecha = findDateValueDeep(data);

  if (!fecha) return null;

  // Normalizar a formato yyyy-mm-dd
  const parseDateString = (valor) => {
    const trimmed = valor.trim();

    if (trimmed.length === 0) return null;

    if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
      return trimmed;
    }

    if (/^\d{2}\/\d{2}\/\d{4}$/.test(trimmed)) {
      const [dia, mes, anio] = trimmed.split("/");
      return `${anio}-${mes}-${dia}`;
    }

    if (/^\d{2}-\d{2}-\d{4}$/.test(trimmed)) {
      const [dia, mes, anio] = trimmed.split("-");
      return `${anio}-${mes}-${dia}`;
    }

    if (/^\d{4}\/\d{2}\/\d{2}$/.test(trimmed)) {
      const [anio, mes, dia] = trimmed.split("/");
      return `${anio}-${mes}-${dia}`;
    }

    if (/^\d{4}\d{2}\d{2}$/.test(trimmed)) {
      return `${trimmed.slice(0, 4)}-${trimmed.slice(4, 6)}-${trimmed.slice(
        6,
        8
      )}`;
    }

    // ISO completo u otros formatos parseables por Date
    const parsedDate = new Date(trimmed);
    if (!Number.isNaN(parsedDate.getTime())) {
      const year = parsedDate.getUTCFullYear();
      const month = String(parsedDate.getUTCMonth() + 1).padStart(2, "0");
      const day = String(parsedDate.getUTCDate()).padStart(2, "0");
      return `${year}-${month}-${day}`;
    }

    return null;
  };

  return parseDateString(fecha);
};

const normalizeResponse = (data) => {
  if (!data || typeof data !== "object") {
    return null;
  }

  const nombres = normalizeNombre(data);
  const apellidos = normalizeApellido(data);
  const fechaNacimiento = normalizeFechaNacimiento(data);

  if (!nombres && !apellidos && !fechaNacimiento) {
    return null;
  }

  return {
    nombres: nombres ?? "",
    apellidos: apellidos ?? "",
    fechaNacimiento: fechaNacimiento ?? "",
  };
};

/**
 * Limpia y normaliza un DNI, removiendo caracteres no numéricos
 * @param {string} dni - DNI a limpiar
 * @returns {string} DNI limpio con solo dígitos
 */
const limpiarDNI = (dni) => {
  if (!dni) return "";
  // Remover todos los caracteres no numéricos
  return dni.toString().replace(/\D/g, "");
};

/**
 * Genera todas las variaciones posibles de un DNI para búsqueda profunda
 * @param {string} dni - DNI original a variar
 * @returns {Array<string>} Array de variaciones de DNI únicas a intentar (ordenadas por prioridad)
 */
const generarVariacionesDNI = (dni) => {
  const variaciones = new Set();
  
  // Limpiar el DNI de caracteres no numéricos
  const dniLimpio = limpiarDNI(dni);
  
  if (!dniLimpio || dniLimpio.length === 0) {
    return [];
  }
  
  // Estrategia 1: DNI original con padding estándar a 8 dígitos (prioridad máxima)
  const dniPadded = dniLimpio.padStart(8, "0");
  if (dniPadded.length === 8) {
    variaciones.add(dniPadded);
  }
  
  // Estrategia 2: Si el DNI tiene exactamente 8 dígitos y comienza con ceros,
  // intentar variaciones removiendo ceros iniciales progresivamente
  if (dniLimpio.length === 8 && dniLimpio.startsWith("0")) {
    // Encontrar la primera posición donde hay un dígito distinto de cero
    let primeraNoCero = -1;
    for (let i = 0; i < dniLimpio.length; i++) {
      if (dniLimpio[i] !== "0") {
        primeraNoCero = i;
        break;
      }
    }
    
    // Si encontramos un dígito no cero, crear variaciones
    if (primeraNoCero > 0 && primeraNoCero < 8) {
      // Variación: remover todos los ceros iniciales y aplicar padding
      const sinCeros = dniLimpio.substring(primeraNoCero);
      if (sinCeros.length > 0 && sinCeros.length <= 8) {
        const sinCerosPadded = sinCeros.padStart(8, "0");
        if (sinCerosPadded !== dniPadded && sinCerosPadded.length === 8) {
          variaciones.add(sinCerosPadded);
        }
      }
      
      // Variaciones intermedias: remover 1, 2, 3... ceros iniciales (máximo 3 para evitar demasiadas variaciones)
      const maxCerosRemover = Math.min(primeraNoCero, 3);
      for (let cerosRemovidos = 1; cerosRemovidos <= maxCerosRemover; cerosRemovidos++) {
        const parcial = dniLimpio.substring(cerosRemovidos);
        if (parcial.length > 0 && parcial.length <= 8) {
          const parcialPadded = parcial.padStart(8, "0");
          if (parcialPadded !== dniPadded && parcialPadded.length === 8) {
            variaciones.add(parcialPadded);
          }
        }
      }
    }
  }
  
  // Estrategia 3: Si el DNI tiene menos de 8 dígitos, también intentar sin ceros adicionales
  // (esto ya está cubierto por el padding estándar, pero por si acaso)
  if (dniLimpio.length < 8 && dniLimpio.length > 0) {
    // El padding estándar ya se agregó arriba, así que solo verificar que esté
    const verificado = dniLimpio.padStart(8, "0");
    if (verificado.length === 8) {
      variaciones.add(verificado);
    }
  }
  
  // Convertir a array y ordenar por prioridad
  const variacionesArray = Array.from(variaciones);
  
  // Ordenar: prioridad al DNI original con padding estándar
  variacionesArray.sort((a, b) => {
    // El DNI original con padding tiene máxima prioridad
    if (a === dniPadded) return -1;
    if (b === dniPadded) return 1;
    // Luego ordenar alfabéticamente (los DNIs más "cortos" conceptualmente primero)
    return a.localeCompare(b);
  });
  
  // Filtrar solo DNIs válidos de 8 dígitos y eliminar duplicados
  return variacionesArray.filter((dni) => /^\d{8}$/.test(dni));
};

/**
 * Realiza una consulta individual a la API de RENIEC
 * @param {string} dni - DNI a consultar (debe tener 8 dígitos)
 * @param {string} token - Token de autenticación
 * @param {string} apiKey - API Key para la solicitud
 * @returns {Promise<Object>} Respuesta de la API con datos normalizados
 */
const intentarConsulta = async (dni, token, apiKey) => {
  if (!/^\d{8}$/.test(dni)) {
    const error = new Error(`DNI inválido para consulta: ${dni}`);
    error.status = 400;
    error.code = "RENIEC_INVALID_DNI";
    throw error;
  }

  const url = `${RENIEC_API_HOST}/${dni}/${token}`;

  let response;
  try {
    response = await fetch(url, {
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
      },
      method: "GET",
    });
  } catch (err) {
    const error = new Error(
      `Error de conexión al consultar DNI ${dni}: ${err.message}`
    );
    error.status = 502;
    error.code = "RENIEC_FETCH_FAILED";
    error.cause = err;
    throw error;
  }

  if (!response.ok) {
    const error = new Error(
      response.status === 404
        ? `DNI ${dni} no encontrado (404)`
        : `Error HTTP ${response.status} al consultar DNI ${dni}`
    );
    error.status = response.status;
    error.code = "RENIEC_RESPONSE_ERROR";
    try {
      error.detail = await response.text();
    } catch {
      // ignorar
    }
    throw error;
  }

  let data;
  try {
    data = await response.json();
  } catch (err) {
    const error = new Error(`Respuesta JSON inválida para DNI ${dni}`);
    error.status = 502;
    error.code = "RENIEC_INVALID_JSON";
    error.cause = err;
    throw error;
  }

  if (data?.hasErrorRequest === true) {
    const error = new Error(
      data?.error ||
        `El servicio RENIEC reportó un error para DNI ${dni}`
    );
    error.status = 502;
    error.code = "RENIEC_REPORTED_ERROR";
    error.detail = data;
    throw error;
  }

  const resultado = normalizeResponse(data);

  if (!resultado) {
    const error = new Error(`No se encontraron datos válidos para DNI ${dni}`);
    error.status = 404;
    error.code = "RENIEC_DATA_NOT_FOUND";
    error.detail = data;
    throw error;
  }

  return {
    dni: dni,
    data: resultado,
    raw: data,
  };
};

/**
 * Utilidad para hacer delay entre intentos
 * @param {number} ms - Milisegundos a esperar
 * @returns {Promise<void>}
 */
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Consulta profunda de DNI intentando múltiples variaciones
 * @param {string} dni - DNI original a consultar
 * @returns {Promise<Object>} Datos de la persona con información sobre qué variación funcionó
 */
const consultarDNIProfundo = async (dni) => {
  const dniLimpio = limpiarDNI(dni);
  
  if (!dniLimpio || dniLimpio.length === 0) {
    const error = new Error("El DNI debe contener al menos un dígito.");
    error.status = 400;
    error.code = "RENIEC_INVALID_DNI";
    throw error;
  }

  if (missingEnvVars.length > 0) {
    const error = new Error(
      "La consulta RENIEC no está disponible. Configure las variables de entorno requeridas."
    );
    error.status = 500;
    error.code = "RENIEC_ENV_MISSING";
    throw error;
  }

  const token = process.env.TOKEN_API_DOCUMENT_MYDEVS;
  const apiKey = process.env.KEY_API_DOCUMENT_MYDEVS;

  // Generar variaciones de DNI
  const variaciones = generarVariacionesDNI(dniLimpio);
  
  if (variaciones.length === 0) {
    const error = new Error("No se pudieron generar variaciones válidas del DNI.");
    error.status = 400;
    error.code = "RENIEC_NO_VARIATIONS";
    throw error;
  }

  console.log(
    `[RENIEC] Búsqueda profunda iniciada para DNI: ${dni} -> ${variaciones.length} variación(es) a intentar: ${variaciones.join(", ")}`
  );

  const errores = [];
  let ultimoError = null;
  let intentoExitoso = null;

  // Intentar cada variación en orden
  for (let i = 0; i < variaciones.length; i++) {
    const variacionDNI = variaciones[i];
    const esPrimeraVariacion = i === 0;
    const esUltimaVariacion = i === variaciones.length - 1;

    try {
      // Delay entre intentos (excepto el primero)
      if (!esPrimeraVariacion && DEEP_SEARCH_DELAY > 0) {
        await delay(DEEP_SEARCH_DELAY);
      }

      console.log(
        `[RENIEC] Intento ${i + 1}/${variaciones.length}: consultando DNI ${variacionDNI}`
      );

      const resultado = await intentarConsulta(variacionDNI, token, apiKey);

      // Si llegamos aquí, la consulta fue exitosa
      console.log(
        `[RENIEC] ✓ Consulta exitosa con DNI ${variacionDNI} (intento ${i + 1}/${variaciones.length})`
      );

      intentoExitoso = {
        dniConsultado: variacionDNI,
        dniOriginal: dni,
        intento: i + 1,
        totalIntentos: variaciones.length,
        variaciones: variaciones,
      };

      // Mapear al formato esperado por el frontend
      const nombreCompleto = `${resultado.data.nombres} ${resultado.data.apellidos}`.trim();

      return {
        dni: variacionDNI,
        dni_original: dni,
        nombre_completo: nombreCompleto,
        nombres: resultado.data.nombres,
        apellidos: resultado.data.apellidos,
        fecha_nacimiento: resultado.data.fechaNacimiento,
        _meta: {
          busqueda_profunda: true,
          intento_exitoso: intentoExitoso,
          variaciones_intentadas: variaciones.slice(0, i + 1),
        },
      };
    } catch (error) {
      // Registrar el error
      const errorInfo = {
        dni: variacionDNI,
        intento: i + 1,
        error: error.message,
        codigo: error.code,
        status: error.status,
      };

      errores.push(errorInfo);
      ultimoError = error;

      console.log(
        `[RENIEC] ✗ Intento ${i + 1}/${variaciones.length} falló para DNI ${variacionDNI}: ${error.message} (${error.code || error.status})`
      );

      // Si es un error que no es 404 (no encontrado), no continuar con más intentos
      // ya que puede ser un error del servidor, de autenticación, etc.
      if (error.status && error.status !== 404 && error.status !== 502) {
        console.log(
          `[RENIEC] Error no recuperable (${error.status}), deteniendo búsqueda profunda`
        );
        throw error;
      }

      // Si es el último intento, lanzar el error
      if (esUltimaVariacion) {
        break;
      }
    }
  }

  // Si llegamos aquí, todos los intentos fallaron
  console.log(
    `[RENIEC] ✗ Búsqueda profunda fallida después de ${variaciones.length} intento(s). Errores: ${errores.map((e) => `${e.dni} (${e.error})`).join("; ")}`
  );

  // Crear un error descriptivo con información sobre todos los intentos
  const error = new Error(
    `No se encontró información para el DNI ${dni} después de intentar ${variaciones.length} variación(es).`
  );
  error.status = 404;
  error.code = "RENIEC_DEEP_SEARCH_FAILED";
  error.detail = {
    dni_original: dni,
    variaciones_intentadas: variaciones,
    errores: errores,
    total_intentos: variaciones.length,
  };
  error.cause = ultimoError;

  throw error;
};

/**
 * Consulta datos de una persona por DNI usando la API de RENIEC
 * Utiliza búsqueda profunda si está habilitada, de lo contrario realiza una consulta simple
 * @param {string} dni - Número de DNI a consultar
 * @returns {Promise<Object>} Datos de la persona con nombres, apellidos y fechaNacimiento
 */
export const consultarDNI = async (dni) => {
  // Si la búsqueda profunda está habilitada, usarla
  if (DEEP_SEARCH_ENABLED) {
    try {
      const resultado = await consultarDNIProfundo(dni);
      
      // Si la búsqueda profunda fue exitosa, retornar el resultado
      // (removiendo metadatos internos para mantener compatibilidad)
      return {
        dni: resultado.dni,
        nombre_completo: resultado.nombre_completo,
        nombres: resultado.nombres,
        apellidos: resultado.apellidos,
        fecha_nacimiento: resultado.fecha_nacimiento,
      };
    } catch (error) {
      // Si la búsqueda profunda falla, lanzar el error
      // El error ya contiene información detallada sobre los intentos
      throw error;
    }
  }

  // Búsqueda simple (comportamiento original para compatibilidad)
  const dniLimpio = limpiarDNI(dni);
  
  if (!dniLimpio || dniLimpio.length === 0) {
    const error = new Error("El DNI debe contener al menos un dígito.");
    error.status = 400;
    error.code = "RENIEC_INVALID_DNI";
    throw error;
  }

  // Asegurar que el DNI tenga 8 dígitos
  const dniFormateado = dniLimpio.padStart(8, "0");
  
  if (dniFormateado.length !== 8) {
    const error = new Error("El DNI debe tener 8 dígitos después de la normalización.");
    error.status = 400;
    error.code = "RENIEC_INVALID_DNI";
    throw error;
  }

  if (missingEnvVars.length > 0) {
    const error = new Error(
      "La consulta RENIEC no está disponible. Configure las variables de entorno requeridas."
    );
    error.status = 500;
    error.code = "RENIEC_ENV_MISSING";
    throw error;
  }

  const token = process.env.TOKEN_API_DOCUMENT_MYDEVS;
  const apiKey = process.env.KEY_API_DOCUMENT_MYDEVS;

  try {
    const resultado = await intentarConsulta(dniFormateado, token, apiKey);
    
    // Mapear al formato esperado por el frontend
    const nombreCompleto = `${resultado.data.nombres} ${resultado.data.apellidos}`.trim();

    return {
      dni: dniFormateado,
      nombre_completo: nombreCompleto,
      nombres: resultado.data.nombres,
      apellidos: resultado.data.apellidos,
      fecha_nacimiento: resultado.data.fechaNacimiento,
    };
  } catch (error) {
    // Re-lanzar el error con formato más amigable si es necesario
    if (error.status === 404) {
      const errorMejorado = new Error(
        "No se encontró información para el DNI proporcionado."
      );
      errorMejorado.status = 404;
      errorMejorado.code = error.code || "RENIEC_DATA_NOT_FOUND";
      errorMejorado.cause = error;
      throw errorMejorado;
    }
    throw error;
  }
};
