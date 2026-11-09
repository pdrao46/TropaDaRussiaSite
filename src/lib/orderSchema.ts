import { z } from 'zod';

/** Validações locais do formulário (o backend deve revalidar). */
export const customerSchema = z.object({
  characterName: z
    .string()
    .trim()
    .min(3, 'Informe o nome do personagem (mín. 3 caracteres).')
    .max(40, 'Máximo de 40 caracteres.')
    .regex(/^[\p{L}\p{M}' .-]+$/u, 'Use apenas letras, espaços, ponto, hífen ou apóstrofo.'),
  characterId: z
    .string()
    .trim()
    .min(1, 'Informe o ID do personagem.')
    .regex(/^\d{1,8}$/, 'O ID deve conter apenas números (até 8 dígitos).'),
  factionName: z.string().trim().min(2, 'Informe o nome da sua facção.').max(40, 'Máximo de 40 caracteres.'),
  phoneRp: z
    .string()
    .trim()
    .min(1, 'Informe o telefone dentro do jogo.')
    .regex(/^[0-9][0-9 -]{2,14}$/, 'Use apenas números e hífen (ex.: 555-0123).'),
  discordUser: z
    .string()
    .trim()
    .min(2, 'Informe seu usuário do Discord.')
    .max(37, 'Usuário muito longo.')
    .regex(/^@?[A-Za-z0-9_.]{2,32}(#\d{4})?$/, 'Usuário inválido. Use letras, números, ponto ou _ (ex.: tdr.membro).'),
  discordId: z
    .string()
    .trim()
    .regex(/^(\d{17,20})?$/, 'O ID do Discord tem de 17 a 20 dígitos.')
    .optional(),
  notes: z.string().trim().max(500, 'Máximo de 500 caracteres.').optional(),
});

export type CustomerFormValues = z.infer<typeof customerSchema>;

export const partnerFactionSchema = z
  .string()
  .trim()
  .min(2, 'Informe o nome da facção parceira.')
  .max(40, 'Máximo de 40 caracteres.');
