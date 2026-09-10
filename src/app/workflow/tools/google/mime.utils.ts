const isAscii = (value: string) =>
  [...value].every((character) => character.charCodeAt(0) < 128);

const encodeHeader = (value: string) =>
  isAscii(value)
    ? value
    : `=?UTF-8?B?${Buffer.from(value, "utf8").toString("base64")}?=`;

export const toBase64Url = (value: string) =>
  Buffer.from(value)
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");

export const decodeBase64Url = (value: string) =>
  Buffer.from(value.replace(/-/g, "+").replace(/_/g, "/"), "base64").toString(
    "utf8",
  );

export const buildRawMessage = ({
  to,
  subject,
  body,
  cc,
}: {
  to: string[];
  subject: string;
  body: string;
  cc?: string[];
}): string => {
  const headers = [
    `To: ${to.join(", ")}`,
    ...(cc?.length ? [`Cc: ${cc.join(", ")}`] : []),
    "Content-Type: text/html; charset=utf-8",
    "MIME-Version: 1.0",
    `Subject: ${encodeHeader(subject)}`,
  ];

  return toBase64Url([...headers, "", body].join("\r\n"));
};
