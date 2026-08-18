export interface ErrorBannerProps {
  message: string
}

export function ErrorBanner({ message }: ErrorBannerProps) {
  return (
    <div role="alert" className="af-error-banner">
      {message}
    </div>
  )
}
