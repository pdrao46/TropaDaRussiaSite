import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { AtSign, Fingerprint, Hash, MessageSquare, Phone, Shield, UserRound } from 'lucide-react';
import { customerSchema, type CustomerFormValues } from '../../lib/orderSchema';
import type { CustomerData } from '../../types/Order';
import { useAuth } from '../../hooks/useAuth';
import { StepHeader } from '../OrderExperience/StepHeader';
import { TextAreaField, TextField } from './Field';

export const IDENTIFICATION_FORM_ID = 'tdr-identification-form';

const EMPTY: CustomerFormValues = {
  characterName: '',
  characterId: '',
  factionName: '',
  phoneRp: '',
  discordUser: '',
  discordId: '',
  notes: '',
};

interface Props {
  defaultValues: CustomerData | null;
  onValid: (data: CustomerData) => void;
}

/** Formulário de identificação (somente dados do jogo e do Discord). */
export function IdentificationForm({ defaultValues, onValid }: Props) {
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, dirtyFields, touchedFields },
  } = useForm<CustomerFormValues>({
    resolver: zodResolver(customerSchema),
    mode: 'onTouched',
    reValidateMode: 'onChange',
    defaultValues: { ...EMPTY, ...defaultValues },
  });

  // Conta Discord vinculada à sessão autenticada (dados vindos SOMENTE de GET /api/auth/me).
  const { status: authStatus, user: sessionUser } = useAuth();
  const linked = authStatus === 'authenticated' && sessionUser ? sessionUser : null;

  useEffect(() => {
    if (!linked) return;
    const opts = { shouldDirty: true, shouldTouch: true, shouldValidate: true } as const;
    setValue('discordUser', linked.username, opts);
    setValue('discordId', linked.id, opts);
  }, [linked, setValue]);

  const values = watch();
  const isValid = (name: keyof CustomerFormValues) =>
    !errors[name] && (touchedFields[name] || dirtyFields[name] || Boolean(defaultValues)) && String(values[name] ?? '').trim().length > 0;

  const submit = handleSubmit((data) => {
    const clean: CustomerData = {
      characterName: data.characterName.trim(),
      characterId: data.characterId.trim(),
      factionName: data.factionName.trim(),
      phoneRp: data.phoneRp.trim(),
      // Com sessão ativa, os dados do Discord vêm da conta autenticada (nunca do campo editável).
      discordUser: linked ? linked.username : data.discordUser.trim().replace(/^@/, ''),
      discordId: linked ? linked.id : data.discordId?.trim() || undefined,
      notes: data.notes?.trim() || undefined,
    };
    onValid(clean);
  });

  const notesLength = values.notes?.length ?? 0;

  return (
    <div>
      <StepHeader step={4} title="Identificação" description="Informe os dados do seu personagem. Use somente informações do GTA RP e do Discord." />
      <form id={IDENTIFICATION_FORM_ID} noValidate onSubmit={submit} className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-5">
        <TextField label="Nome do personagem" required icon={<UserRound className="h-4 w-4" />} placeholder="Ex.: Ivan Petrov" autoComplete="off" maxLength={40} error={errors.characterName?.message} valid={isValid('characterName')} {...register('characterName')} />
        <TextField label="ID do personagem" required icon={<Hash className="h-4 w-4" />} placeholder="Ex.: 1452" inputMode="numeric" autoComplete="off" maxLength={8} error={errors.characterId?.message} valid={isValid('characterId')} {...register('characterId')} />
        <TextField label="Nome da facção" required icon={<Shield className="h-4 w-4" />} placeholder="Ex.: Tropa da Rússia" autoComplete="off" maxLength={40} error={errors.factionName?.message} valid={isValid('factionName')} {...register('factionName')} />
        <TextField label="Telefone dentro do jogo" required icon={<Phone className="h-4 w-4" />} placeholder="Ex.: 555-0123" inputMode="tel" autoComplete="off" maxLength={15} error={errors.phoneRp?.message} valid={isValid('phoneRp')} hint="Número do celular do personagem no RP." {...register('phoneRp')} />
        <TextField label="Usuário do Discord" required icon={<AtSign className="h-4 w-4" />} placeholder="Ex.: tdr.membro" autoComplete="off" autoCapitalize="none" spellCheck={false} maxLength={37} error={errors.discordUser?.message} valid={isValid('discordUser')} readOnly={Boolean(linked)} aria-readonly={Boolean(linked) || undefined} hint={linked ? 'Vinculado à sua conta Discord conectada.' : undefined} {...register('discordUser')} />
        <TextField label="ID do usuário no Discord" icon={<Fingerprint className="h-4 w-4" />} placeholder="Ex.: 123456789012345678" inputMode="numeric" autoComplete="off" maxLength={20} error={errors.discordId?.message} valid={isValid('discordId')} readOnly={Boolean(linked)} aria-readonly={Boolean(linked) || undefined} hint={linked ? 'Obtido automaticamente da sua conta Discord.' : 'Ative o Modo Desenvolvedor no Discord e copie seu ID.'} {...register('discordId')} />
        <div className="sm:col-span-2">
          <TextAreaField label="Observações da encomenda" icon={<MessageSquare className="h-4 w-4" />} placeholder="Horário de entrega, ponto de encontro no RP, detalhes adicionais…" maxLength={500} error={errors.notes?.message} hint={`${notesLength}/500 caracteres`} {...register('notes')} />
        </div>
        <button type="submit" className="sr-only">Continuar para revisão</button>
      </form>
    </div>
  );
}
