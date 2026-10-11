const legalUrl = (file: string) => `${import.meta.env.BASE_URL}${file}`

export default function PrivacyNotice({ className = '' }: { className?: string }) {
  return (
    <div className={`quote-privacy-notice ${className}`}>
      <p>
        A GMAC utilizará os dados informados para analisar sua solicitação e entrar
        em contato. Consulte a{' '}
        <a href={legalUrl('privacidade.html')} target="_blank" rel="noopener noreferrer">
          Política de Privacidade<span className="sr-only"> (abre em nova aba)</span>
        </a>.
      </p>
      <p>
        O envio inicia um pedido de orçamento e não significa contratação automática.{' '}
        <a href={legalUrl('regras-orcamento.html')} target="_blank" rel="noopener noreferrer">
          Leia as regras da solicitação<span className="sr-only"> (abre em nova aba)</span>
        </a>.
      </p>
    </div>
  )
}
