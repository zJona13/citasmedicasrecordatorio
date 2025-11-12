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
 * Consulta datos de una persona por DNI usando la API de RENIEC
 * @param {string} dni - Número de DNI a consultar (debe tener 8 dígitos)
 * @returns {Promise<Object>} Datos de la persona con nombres, apellidos y fechaNacimiento
 */
export const consultarDNI = async (dni) => {
  if (!/^\d{8}$/.test(dni)) {
    const error = new Error("El DNI debe tener 8 dígitos.");
    error.status = 400;
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

  const url = `${RENIEC_API_HOST}/${dni}/${token}`;

  let response;
  try {
    console.log(`[RENIEC] Consultando DNI: ${dni} en ${url}`);
    response = await fetch(url, {
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
      },
      method: "GET",
    });
  } catch (err) {
    const error = new Error(
      "No se pudo conectar con el servicio de RENIEC. Intente nuevamente."
    );
    error.status = 502;
    error.code = "RENIEC_FETCH_FAILED";
    error.cause = err;
    throw error;
  }

  if (!response.ok) {
    const message =
      response.status === 404
        ? "No se encontró información para el DNI proporcionado."
        : "El servicio de RENIEC devolvió un error inesperado.";
    const error = new Error(message);
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
    const error = new Error("La respuesta de RENIEC no es un JSON válido.");
    error.status = 502;
    error.code = "RENIEC_INVALID_JSON";
    error.cause = err;
    throw error;
  }

  if (data?.hasErrorRequest === true) {
    const error = new Error(
      data?.error ||
        "El servicio de RENIEC reportó un error al procesar la solicitud."
    );
    error.status = 502;
    error.code = "RENIEC_REPORTED_ERROR";
    error.detail = data;
    throw error;
  }

  const resultado = normalizeResponse(data);

  if (!resultado) {
    const error = new Error(
      "No se encontraron datos válidos para el DNI proporcionado."
    );
    error.status = 404;
    error.code = "RENIEC_DATA_NOT_FOUND";
    error.detail = data;
    throw error;
  }

  // Mapear al formato esperado por el frontend
  const nombreCompleto = `${resultado.nombres} ${resultado.apellidos}`.trim();

  return {
    dni: dni,
    nombre_completo: nombreCompleto,
    nombres: resultado.nombres,
    apellidos: resultado.apellidos,
    fecha_nacimiento: resultado.fechaNacimiento,
  };
};
