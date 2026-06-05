export type ParsedRequirementsFields = Partial<{
  inputVoltage: string;
  mcuFamily: string;
  interfaces: string;
  digitalInputsCount: number;
  relayOutputsCount: number;
  boardWidthMm: number;
  boardHeightMm: number;
  layers: number;
  inputLevel: string;
  powerRails: string;
  environment: string;
  deviceType: string;
}>;

export type ParsedRequirementKey = keyof ParsedRequirementsFields;

export type ParseRequirementsResult = {
  fields: ParsedRequirementsFields;
  foundKeys: ParsedRequirementKey[];
};

const NUMBER_WORDS: Record<string, number> = {
  один: 1,
  одна: 1,
  одно: 1,
  два: 2,
  две: 2,
  три: 3,
  четыре: 4,
  пять: 5,
  шесть: 6,
  семь: 7,
  восемь: 8,
};

const NUMBER_TOKEN = "(\\d+|один|одна|одно|два|две|три|четыре|пять|шесть|семь|восемь)";
const WORD_TAIL = "[\\p{L}\\p{N}_-]*";
const WORD_BOUNDARY = "(?![\\p{L}\\p{N}_-])";

function normalizeText(text: string) {
  return text.toLowerCase().replaceAll("ё", "е");
}

function parseNumberToken(value: string | undefined) {
  if (!value) {
    return undefined;
  }

  const normalizedValue = normalizeText(value.trim());
  const wordValue = NUMBER_WORDS[normalizedValue];

  if (wordValue !== undefined) {
    return wordValue;
  }

  const numericValue = Number(normalizedValue.replace(",", "."));
  return Number.isFinite(numericValue) ? numericValue : undefined;
}

function parseDimension(value: string | undefined) {
  const numericValue = Number(value?.replace(",", "."));
  return Number.isFinite(numericValue) && numericValue > 0 ? numericValue : undefined;
}

function pushFoundKey(keys: ParsedRequirementKey[], key: ParsedRequirementKey) {
  if (!keys.includes(key)) {
    keys.push(key);
  }
}

export function parseRequirementsText(text: string): ParseRequirementsResult {
  const normalizedText = normalizeText(text);
  const fields: ParsedRequirementsFields = {};
  const foundKeys: ParsedRequirementKey[] = [];

  if (/\bstm32\b/u.test(normalizedText)) {
    fields.mcuFamily = "STM32";
    pushFoundKey(foundKeys, "mcuFamily");
  }

  if (/\brs\s*-?\s*485\b/u.test(normalizedText)) {
    fields.interfaces = "RS-485";
    pushFoundKey(foundKeys, "interfaces");
  }

  if (
    new RegExp(`(?:питан${WORD_TAIL}\\s*)?24\\s*(?:в|v|вольт)${WORD_BOUNDARY}`, "u").test(
      normalizedText,
    ) ||
    new RegExp(`питан${WORD_TAIL}\\s*24${WORD_BOUNDARY}`, "u").test(normalizedText)
  ) {
    fields.inputVoltage = "24V DC";
    pushFoundKey(foundKeys, "inputVoltage");
  }

  if (new RegExp(`(?:вход${WORD_TAIL}\\s*)?24\\s*(?:в|v|вольт)${WORD_BOUNDARY}`, "u").test(normalizedText)) {
    fields.inputLevel = "24 В";
    pushFoundKey(foundKeys, "inputLevel");
  }

  if (
    new RegExp(`5\\s*(?:в|v)${WORD_BOUNDARY}`, "u").test(normalizedText) &&
    new RegExp(`(?:3[,.]3|3\\s*,\\s*3)\\s*(?:в|v)${WORD_BOUNDARY}`, "u").test(normalizedText)
  ) {
    fields.powerRails = "5 В, 3,3 В";
    pushFoundKey(foundKeys, "powerRails");
  }

  const digitalInputsMatch = normalizedText.match(
    new RegExp(`${NUMBER_TOKEN}\\s+(?:дискретн${WORD_TAIL}\\s+)?вход${WORD_TAIL}`, "u"),
  );
  const digitalInputsCount = parseNumberToken(digitalInputsMatch?.[1]);

  if (digitalInputsCount !== undefined) {
    fields.digitalInputsCount = digitalInputsCount;
    pushFoundKey(foundKeys, "digitalInputsCount");
  }

  const relayOutputsMatch = normalizedText.match(
    new RegExp(
      `${NUMBER_TOKEN}\\s+(?:(?:релейн${WORD_TAIL}\\s+выход${WORD_TAIL})|(?:реле(?:йных)?(?:\\s+выход${WORD_TAIL})?))`,
      "u",
    ),
  );
  const relayOutputsCount = parseNumberToken(relayOutputsMatch?.[1]);

  if (relayOutputsCount !== undefined) {
    fields.relayOutputsCount = relayOutputsCount;
    pushFoundKey(foundKeys, "relayOutputsCount");
  }

  const boardSizeMatch =
    normalizedText.match(/(\d+(?:[,.]\d+)?)\s*(?:x|х|×|\*)\s*(\d+(?:[,.]\d+)?)/u) ??
    normalizedText.match(/(\d+(?:[,.]\d+)?)\s+на\s+(\d+(?:[,.]\d+)?)(?:\s*мм)?/u);
  const boardWidthMm = parseDimension(boardSizeMatch?.[1]);
  const boardHeightMm = parseDimension(boardSizeMatch?.[2]);

  if (boardWidthMm !== undefined && boardHeightMm !== undefined) {
    fields.boardWidthMm = boardWidthMm;
    fields.boardHeightMm = boardHeightMm;
    pushFoundKey(foundKeys, "boardWidthMm");
    pushFoundKey(foundKeys, "boardHeightMm");
  }

  const layerMatch = normalizedText.match(new RegExp(`${NUMBER_TOKEN}\\s*[- ]?(?:layer|сло(?:й|я|ев|ев|ёв))`, "u"));
  const parsedLayers = parseNumberToken(layerMatch?.[1]);

  if (parsedLayers !== undefined) {
    fields.layers = parsedLayers;
    pushFoundKey(foundKeys, "layers");
  } else if (new RegExp(`двухслойн${WORD_TAIL}`, "u").test(normalizedText)) {
    fields.layers = 2;
    pushFoundKey(foundKeys, "layers");
  }

  if (new RegExp(`промышленн${WORD_TAIL}|industrial`, "u").test(normalizedText)) {
    fields.environment = "Промышленная";
    fields.deviceType = "Промышленный контроллер";
    pushFoundKey(foundKeys, "environment");
    pushFoundKey(foundKeys, "deviceType");
  }

  return {
    fields,
    foundKeys,
  };
}
