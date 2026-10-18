const FIELD_ALIASES = {
    title: ["title", "name", "event_name", "nazwa", "tytul"],
    text: ["text", "description", "content", "opis", "description_short"],
    address: ["address", "adres", "street", "ulica", "adres_wydarzenia"],
    localization: ["localization", "location", "lokalizacja", "miejsce", "venue", "place"],
    image: [
        "image", "image_url", "imageurl", "image_display_url", "photo", "photo_url",
        "picture", "picture_url", "img", "img_url", "src", "thumbnail", "thumbnail_url",
        "media", "images", "zdjecie", "zdjecia", "zdjecie_url", "url_zdjecia",
        "link_do_zdjecia", "fotografia", "grafika"
    ],
    category: ["category", "type", "kategoria", "typ"],
    from: ["from", "date_from", "start", "start_date", "data_od", "data_rozpoczecia"],
    to: ["to", "date_to", "end", "end_date", "data_do", "data_zakonczenia"],
    latitude: ["latitude", "lat", "szerokosc_geograficzna"],
    longitude: ["longitude", "lon", "lng", "dlugosc_geograficzna"]
};

function normalizeKey(key) {
    return key
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase()
        .replace(/[^a-z0-9]/g, "");
}

function getRecords(payload) {
    if (Array.isArray(payload)) {
        return payload;
    }

    if (payload && typeof payload === "object") {
        for (const key of ["result", "data", "records", "items", "events"]) {
            if (payload[key] !== undefined) {
                const records = getRecords(payload[key]);
                if (records) {
                    return records;
                }
            }
        }
    }

    return null;
}

function getFieldValue(record, aliases) {
    if (!record || typeof record !== "object") {
        return null;
    }

    const normalizedAliases = new Set(aliases.map(normalizeKey));
    const sources = [
        record,
        record.attributes,
        record.properties,
        record.fields
    ];

    for (const source of sources) {
        if (!source || typeof source !== "object" || Array.isArray(source)) {
            continue;
        }

        for (const [key, value] of Object.entries(source)) {
            if (normalizedAliases.has(normalizeKey(key)) && value != null) {
                return value;
            }
        }
    }

    return null;
}

const IMAGE_FIELD_KEYS = new Set(FIELD_ALIASES.image.map(normalizeKey));
const IMAGE_URL_KEYS = ["url", "href", "src", "path", "download_url", "image_url", "imageUrl"];

function findImageValue(value, isImageField = false) {
    if (typeof value === "string") {
        return isImageField ? value : null;
    }

    if (!value || typeof value !== "object") {
        return null;
    }

    if (Array.isArray(value)) {
        for (const item of value) {
            const image = findImageValue(item, isImageField);
            if (image) {
                return image;
            }
        }
        return null;
    }

    if (isImageField) {
        for (const key of IMAGE_URL_KEYS) {
            if (typeof value[key] === "string" && value[key].trim()) {
                return value[key];
            }
        }

        for (const item of Object.values(value)) {
            const image = findImageValue(item, true);
            if (image) {
                return image;
            }
        }
    }

    for (const [key, item] of Object.entries(value)) {
        if (IMAGE_FIELD_KEYS.has(normalizeKey(key))) {
            const image = findImageValue(item, true);
            if (image) {
                return image;
            }
        }
    }

    return null;
}

function getOccurrenceValue(record, field) {
    const occurrence = Array.isArray(record?.occurrence) ? record.occurrence[0] : record?.occurrence;
    return occurrence?.[field] ?? null;
}

function getMapCoordinate(record, index) {
    return record?.map?.features?.[0]?.geometry?.coordinates?.[index] ?? null;
}

function normalizeImageUrl(value) {
    if (typeof value !== "string") {
        return null;
    }

    const htmlImage = value.match(/<img[^>]+src=["']([^"']+)["']/i);
    const imageUrl = (htmlImage?.[1] ?? value).trim();
    if (!imageUrl) {
        return null;
    }

    if (/^(data:|blob:)/i.test(imageUrl)) {
        return imageUrl;
    }

    try {
        const url = new URL(imageUrl, "https://dane.um.warszawa.pl/");
        if (url.protocol === "http:" && url.hostname === "um.warszawa.pl") {
            url.protocol = "https:";
        }
        return url.toString();
    } catch {
        return null;
    }
}

function toDisplayValue(value, field) {
    if (value == null) {
        return null;
    }

    if (field === "image") {
        if (Array.isArray(value)) {
            for (const item of value) {
                const image = toDisplayValue(item, field);
                if (image) {
                    return image;
                }
            }
            return null;
        }

        if (typeof value === "object") {
            const imageValue = findImageValue(value, true);
            return imageValue == null ? null : toDisplayValue(imageValue, field);
        }

        return normalizeImageUrl(String(value));
    }

    if (Array.isArray(value)) {
        return toDisplayValue(value[0], field);
    }

    if (typeof value === "object") {
        const objectValue = field === "image"
            ? value.url ?? value.href ?? value.src
            : value.name ?? value.value ?? value.label ?? value.address;
        return objectValue == null ? null : toDisplayValue(objectValue, field);
    }

    return String(value);
}

function normalizeEvent(record) {
    const image = getFieldValue(record, FIELD_ALIASES.image) ?? findImageValue(record);
    const from = getFieldValue(record, FIELD_ALIASES.from) ?? getOccurrenceValue(record, "from");
    const to = getFieldValue(record, FIELD_ALIASES.to) ?? getOccurrenceValue(record, "to");
    const latitude = getFieldValue(record, FIELD_ALIASES.latitude) ?? getMapCoordinate(record, 1);
    const longitude = getFieldValue(record, FIELD_ALIASES.longitude) ?? getMapCoordinate(record, 0);

    return Object.fromEntries(
        Object.entries(FIELD_ALIASES).map(([field, aliases]) => [
            field,
            field === "from"
                ? toDisplayValue(from, field)
                : field === "to"
                    ? toDisplayValue(to, field)
                    : field === "latitude" || field === "longitude"
                        ? Number.parseFloat(field === "latitude" ? latitude : longitude)
                        : toDisplayValue(field === "image" ? image : getFieldValue(record, aliases), field)
        ])
    );
}

export async function FetchData() {
    const from = new Date();
    const to = new Date(from);
    to.setDate(to.getDate() + 7);

    const formatDate = (date) => {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, "0");
        const day = String(date.getDate()).padStart(2, "0");
        return `${year}-${month}-${day}`;
    };

    const params = new URLSearchParams({
        from: formatDate(from),
        to: formatDate(to)
    });

    const response = await fetch(`/api/events?${params}`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        }
    });

    if (!response.ok) {
        throw new Error(`Failed to fetch events: ${response.status} ${response.statusText}`);
    }

    const payload = await response.json();
    const records = getRecords(payload);

    if (!records) {
        throw new TypeError("The events API response does not contain a records array.");
    }

    return records.map(normalizeEvent);
}
