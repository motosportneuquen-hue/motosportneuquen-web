import { MessageCircle } from 'lucide-react';

const WHATSAPP_URL = 'https://wa.me/5492995343094?text=Hola%20MotoSport%20Neuqu%C3%A9n%2C%20quiero%20hacer%20una%20consulta.';

export default function WhatsAppFloat() {
  return (
    <a
      href={WHATSAPP_URL}
      target="_blank"
      rel="noreferrer"
      aria-label="Escribir por WhatsApp"
      className="fixed bottom-5 right-5 z-50 flex h-12 w-12 items-center justify-center rounded-full bg-[#25D366] text-white shadow-[0_8px_22px_rgba(37,211,102,0.32)] transition-all duration-200 hover:scale-105 hover:bg-[#20bd5a] focus:outline-none focus:ring-2 focus:ring-[#25D366] focus:ring-offset-2 focus:ring-offset-black"
    >
      <MessageCircle className="h-6 w-6" />
    </a>
  );
}
