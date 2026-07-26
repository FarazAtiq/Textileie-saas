export function validateFactory(factory) {
  const errors = {};

  if (!factory.factoryName.trim())
    errors.factoryName = "Factory Name is required.";

  if (!factory.factoryType)
    errors.factoryType = "Factory Type is required.";

  if (!factory.country)
    errors.country = "Country is required.";

  if (!factory.city.trim())
    errors.city = "City is required.";

  return errors;
}
