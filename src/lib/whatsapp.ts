/** Un lien vers une conversation WhatsApp, avec un message pré-rempli facultatif. */
export function lienWhatsApp(numero: string, message?: string): string {
  const chiffres = numero.replace(/\D/g, "");
  const international = chiffres.length === 9 ? `237${chiffres}` : chiffres;
  const base = `https://wa.me/${international}`;
  return message ? `${base}?text=${encodeURIComponent(message)}` : base;
}