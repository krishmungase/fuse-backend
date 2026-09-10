import { param, query } from "express-validator";

import { CONNECTOR_IDS } from "../constants/connector.constants";

export const providerValidator = [
  param("provider").isIn(CONNECTOR_IDS).withMessage("Unsupported integration"),
];

export const callbackValidator = [
  query("state").isString().notEmpty().withMessage("state is required"),
  query("code").optional().isString(),
  query("error").optional().isString(),
];
