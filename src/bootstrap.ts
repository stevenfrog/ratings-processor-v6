import Joi from "@hapi/joi";

// In a TypeScript environment, you would typically use module augmentation
// to add properties to Joi, but this approach from the original code still works.
// We declare 'Joi' as 'any' to bypass strict type checking for this dynamic assignment.
const joiAny = Joi as any;

joiAny.id = () => Joi.number().integer().positive();
joiAny.sid = () => Joi.string().uuid();
