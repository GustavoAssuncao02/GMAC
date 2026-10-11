import { useState } from 'react'
import { MapPin } from 'lucide-react'

export default function PrivacyMap({ src, title, className = '' }: {
  src: string
  title: string
  className?: string
}) {
  const [loaded, setLoaded] = useState(false)

  return (
    <div className={`privacy-map ${className}`}>
      {loaded ? (
        <>
          <iframe title={title} src={src} allowFullScreen referrerPolicy="no-referrer" />
          <button type="button" className="privacy-map__close" onClick={() => setLoaded(false)}>
            Fechar mapa
          </button>
        </>
      ) : (
        <div className="privacy-map__choice">
          <MapPin size={32} aria-hidden="true" />
          <h3>Localização da GMAC</h3>
          <p>
            O mapa é fornecido pelo Google Maps. Ao carregá-lo, o Google receberá
            informações técnicas da sua navegação e poderá utilizar cookies.
          </p>
          <button type="button" onClick={() => setLoaded(true)}>Carregar Google Maps</button>
          <a href="https://policies.google.com/privacy?hl=pt-BR" target="_blank" rel="noopener noreferrer">
            Privacidade do Google<span className="sr-only"> (abre em nova aba)</span>
          </a>
        </div>
      )}
    </div>
  )
}
